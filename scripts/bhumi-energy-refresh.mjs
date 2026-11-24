import { execFile } from 'node:child_process';
import { timingSafeEqual } from 'node:crypto';
import { join } from 'node:path';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const timeoutMs = 80_000;

// Each lane runs in order so workflows that share a seeder lock or depend on
// a prior Redis key can run without competing with each other.
export const energyRefreshLanes = [
  [
    ['seed-pipelines-gas'], ['seed-pipelines-oil'], ['seed-storage-facilities'],
    ['seed-fuel-shortages'], ['seed-energy-disruptions'], ['seed-energy-crisis-policies'],
    ['seed-spr-policies'], ['seed-iea-oil-stocks'], ['seed-chokepoint-baselines'],
    ['seed-portwatch'], ['seed-portwatch-disruptions'], ['seed-chokepoint-flows'], ['seed-hormuz'],
  ],
  [['seed-economy', '--inventories-only'], ['seed-gie-gas-storage']],
  [['seed-commodity-quotes']],
];

export async function refreshEnergy(request) {
  const secret = process.env.CRON_SECRET;
  const auth = Buffer.from(request.headers.get('authorization') ?? '');
  const expected = Buffer.from('Bearer ' + (secret ?? ''));
  const headers = { 'Cache-Control': 'no-store' };
  if (!secret || auth.length !== expected.length || !timingSafeEqual(auth, expected)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  const deadline = Date.now() + 265_000;
  const results = await Promise.all(energyRefreshLanes.map(async (lane) => {
    const records = [];
    for (const [name, ...args] of lane) {
      const remaining = deadline - Date.now();
      if (remaining < 1_000) {
        records.push({ name, ok: false });
        continue;
      }
      try {
        // runSeed terminates its process, so each invocation needs its own child.
        const script = join(process.cwd(), 'energy-seeds', name + '.mjs');
        await exec(process.execPath, [script, ...args], {
          env: { ...process.env, BHUMI_ENERGY_DAILY: '1' },
          timeout: Math.min(timeoutMs, remaining),
        });
        records.push({ name, ok: true });
      } catch (error) {
        console.warn('Energy seed failed', name, error.code ?? error.name);
        records.push({ name, ok: false });
      }
    }
    return records;
  }));
  const seeds = results.flat();
  return Response.json({ seeds }, { status: seeds.every((seed) => seed.ok) ? 200 : 503, headers });
}
