import { NextResponse } from 'next/server';
import { readLeads, writeLeads } from '@/lib/leadsStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const leads = await readLeads();
    return NextResponse.json(leads);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, contacted } = await req.json();

    if (!id || typeof contacted !== 'boolean') {
      return NextResponse.json({ error: 'id and contacted (boolean) are required' }, { status: 400 });
    }

    const leads = await readLeads();
    const index = leads.findIndex((lead) => lead.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    leads[index].contacted = contacted;
    await writeLeads(leads);

    return NextResponse.json({ status: 'success', lead: leads[index] });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const leads = await readLeads();
    const index = leads.findIndex((lead) => lead.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    leads.splice(index, 1);
    await writeLeads(leads);

    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}