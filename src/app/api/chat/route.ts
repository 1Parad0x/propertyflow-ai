import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { matchProperties } from '@/lib/propertyMatcher';
import { readLeads, writeLeads } from '@/lib/leadsStore';
import { Property } from '@/types';

const SYSTEM_PROMPT = `
You are PropertyFlow AI, a real estate assistant. Follow this flow:
1. Greet the user and ask if they want to Rent or Buy.
2. Ask for the City.
3. Optionally ask for the District/neighbourhood — make clear it's optional and they can search the whole city if they prefer. Never block progress if they skip it or say "any" / "whole city".
4. Ask for their Budget (max price).
5. Optionally ask how many rooms they need — make clear it's optional and they can skip it if they just want to see what's available within their budget. Never block progress if they skip it.
Once you have AT LEAST listingType, city and budget (district and rooms are optional), call the 'search_properties' function.
Show the results to the user naturally, briefly highlighting why each one fits.
Then, ask: "Would you like an agent to contact you?"
If they say yes, ask for their Full Name, Email, and Phone Number.
Once you have all three (name, email, phone), your NEXT response MUST call the 'save_lead' function — pass name, email, phone, AND a "requirements" object containing every search criterion you've gathered so far (listingType, city, district, price as the max budget the user specified, rooms — use null for anything not provided). In that turn, the hidden context block is still required as described below, but leave any user-visible text empty — do not say anything to the user in that turn, just call the function.
Only AFTER the 'save_lead' function call has returned a result, in your following reply, thank them warmly, confirm an agent will reach out shortly, and let them know the conversation is complete.
NEVER invent properties or hallucinate. Be concise, polite, and use a modern professional tone.

CRITICAL — every single reply you send (including ones that call a function) MUST start with a hidden context block on its own line, in this EXACT format, before any visible text:
<!--CONTEXT:{"transaction":"rent"|"buy"|null,"city":string|null,"district":string|null,"budget":number|null,"rooms":number|null,"status":"greeting"|"qualifying"|"matching"|"awaiting_contact"|"collecting_contact"|"completed"}-->
Rules for the context block:
- Include every field every time, using null for anything not yet known.
- "district" stays null if the user hasn't given one or said they want the whole city — do not guess one.
- "status" reflects the conversation stage: "greeting" before transaction is known, "qualifying" while collecting city/budget/rooms, "matching" right when you call search_properties or are presenting results and asking about agent contact, "collecting_contact" while gathering name/email/phone, "completed" ONLY in the reply that comes after you have received a function result for 'save_lead' — never set it to "completed" in the same turn where you are calling save_lead, and never set it before save_lead has actually been called.
- The context block must be valid JSON on a single line, wrapped exactly in <!--CONTEXT:...-->, and must never be visible or explained to the user.
`;

type ChatContext = {
  transaction: 'rent' | 'buy' | null;
  city: string | null;
  district: string | null;
  budget: number | null;
  rooms: number | null;
  status: 'greeting' | 'qualifying' | 'matching' | 'awaiting_contact' | 'collecting_contact' | 'completed';
};

async function generateContentWithRotation(contents: any[], tools?: any[]) {
  const keys = process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(',') : [];
  if (keys.length === 0) {
    throw new Error('No Gemini API keys configured (GEMINI_API_KEYS environment variable is missing or empty)');
  }

  let lastError: any = null;
  const startIndex = Math.floor(Math.random() * keys.length);

  for (let i = 0; i < keys.length; i++) {
    const currentIdx = (startIndex + i) % keys.length;
    const apiKey = keys[currentIdx].trim();
    if (!apiKey) continue;

    try {
      const ai = new GoogleGenAI({ apiKey });
      const config: any = { systemInstruction: SYSTEM_PROMPT };

      if (tools) {
        config.tools = [{ functionDeclarations: tools }];
      }

      return await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config,
      });
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error('All configured API keys are rate-limited.');
}

function extractContext(rawText: string): { text: string; context: ChatContext | null } {
  if (!rawText) return { text: rawText, context: null };

  const match = rawText.match(/<!--CONTEXT:(\{[\s\S]*?\})-->/);
  if (!match) return { text: rawText.trim(), context: null };

  let context: ChatContext | null = null;
  try {
    context = JSON.parse(match[1]);
  } catch {
    context = null;
  }

  const text = rawText.replace(match[0], '').trim();
  return { text, context };
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const geminiMessages = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const toolsDefinition = [
      {
        name: 'search_properties',
        description: 'Search for properties based on user criteria. District and rooms are optional — omit district to search the whole city, and omit rooms to match on budget alone.',
        parameters: {
          type: 'OBJECT',
          properties: {
            listingType: { type: 'STRING', enum: ['rent', 'buy'] },
            city: { type: 'STRING' },
            district: { type: 'STRING', description: 'Optional. Omit or leave empty to search the entire city.' },
            budget: { type: 'NUMBER' },
            rooms: { type: 'NUMBER', description: 'Optional. Omit if the user has no room preference.' },
          },
          required: ['listingType', 'city', 'budget'],
        },
      },
      {
        name: 'save_lead',
        description: 'Save user contact info as a lead, along with the search criteria gathered during the conversation.',
        parameters: {
          type: 'OBJECT',
          properties: {
            name: { type: 'STRING' },
            email: { type: 'STRING' },
            phone: { type: 'STRING' },
            requirements: {
              type: 'OBJECT',
              description: 'All search criteria gathered so far, for the agent\'s reference.',
              properties: {
                listingType: { type: 'STRING', enum: ['rent', 'buy'] },
                city: { type: 'STRING' },
                district: { type: 'STRING' },
                price: { type: 'NUMBER', description: 'Max budget the user specified.' },
                rooms: { type: 'NUMBER' },
              },
            },
          },
          required: ['name', 'email', 'phone'],
        },
      },
    ];

    let response;
    try {
      response = await generateContentWithRotation(geminiMessages, toolsDefinition);
    } catch (error: any) {
      return NextResponse.json({ error: 'Service overloaded', details: error.message }, { status: 429 });
    }

    const candidate = response.candidates?.[0];
    const functionCalls = candidate?.content?.parts?.filter((p: any) => p.functionCall);

    if (functionCalls && functionCalls.length > 0) {
      const functionCall = functionCalls[0].functionCall!;
      const args: any = functionCall.args ?? {};
      let functionResult = '';
      let properties: Property[] | null = null;

      if (functionCall.name === 'search_properties') {
        const results = matchProperties({
          listingType: args.listingType,
          city: args.city,
          district: args.district || undefined,
          rooms: args.rooms != null ? Number(args.rooms) : undefined,
          price: Number(args.budget),
        });
        properties = results;
        functionResult = JSON.stringify(results);
      } else if (functionCall.name === 'save_lead') {
        try {
          const leads = await readLeads();
          const newLead = { id: crypto.randomUUID(), ...args, createdAt: new Date().toISOString() };
          leads.push(newLead);
          await writeLeads(leads);
          functionResult = JSON.stringify({ status: 'success', message: 'Lead saved successfully' });
        } catch (err: any) {
          console.error('Failed to save lead:', err);
          functionResult = JSON.stringify({ status: 'error', message: 'Lead could not be saved due to a storage error.' });
        }
      }

      geminiMessages.push(candidate!.content);
      geminiMessages.push({
        role: 'tool',
        parts: [{
          functionResponse: {
            name: functionCall.name,
            response: { result: functionResult },
          },
        }],
      });

      let secondResponse;
      try {
        secondResponse = await generateContentWithRotation(geminiMessages);
      } catch (error: any) {
        return NextResponse.json({ error: 'Error generating final response', details: error.message }, { status: 429 });
      }

      const rawContent = secondResponse.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const { text, context } = extractContext(rawContent);

      const fallbackText = properties
        ? `Found ${properties.length} ${properties.length === 1 ? 'match' : 'matches'} for your search.`
        : 'Done.';

      return NextResponse.json({
        message: { content: text || fallbackText },
        context,
        ...(properties ? { properties } : {}),
      });
    }

    const rawContent = candidate?.content?.parts?.[0]?.text || '';
    const { text, context } = extractContext(rawContent);
    return NextResponse.json({ message: { content: text }, context });

  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}