import fs from 'fs';
import path from 'path';
import { createClient, RedisClientType } from 'redis';
import { Lead } from '@/types';

const SEED_PATH = path.join(process.cwd(), 'src', 'data', 'leads.json');
const LEADS_KEY = 'leads';

let client: RedisClientType | null = null;
let connecting: Promise<RedisClientType> | null = null;

function hasRedis(): boolean {
  return !!process.env.REDIS_URL;
}

async function getClient(): Promise<RedisClientType> {
  if (client) return client;

  if (!connecting) {
    connecting = (async () => {
      const c = createClient({ url: process.env.REDIS_URL });
      c.on('error', () => {
        if (client === c) client = null;
        connecting = null;
        c.quit().catch(() => {});
      });
      await c.connect();
      client = c as RedisClientType;
      return client;
    })();
  }

  return connecting;
}

function readSeed(): Lead[] {
  if (fs.existsSync(SEED_PATH)) {
    return JSON.parse(fs.readFileSync(SEED_PATH, 'utf-8'));
  }
  return [];
}

export async function readLeads(): Promise<Lead[]> {
  if (!hasRedis()) {
    return readSeed();
  }

  const redis = await getClient();
  const raw = await redis.get(LEADS_KEY);

  if (raw === null) {
    const seed = readSeed();
    if (seed.length > 0) {
      await redis.set(LEADS_KEY, JSON.stringify(seed));
    }
    return seed;
  }

  return JSON.parse(raw);
}

export async function writeLeads(leads: Lead[]): Promise<void> {
  if (!hasRedis()) {
    return;
  }

  const redis = await getClient();
  await redis.set(LEADS_KEY, JSON.stringify(leads));
}