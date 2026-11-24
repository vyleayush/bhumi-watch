import { execFileSync } from 'node:child_process';
import { appendFileSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { buildSync } from 'esbuild';
import { energyRefreshLanes } from './bhumi-energy-refresh.mjs';

const root = resolve(import.meta.dirname, '..');
const stage = mkdtempSync(join(tmpdir(), 'worldmonitor-vercel-hobby-'));
const archive = join(stage, 'source.tar');

// Keep eleven API functions so the routing middleware fits within Hobby's twelve-function limit.
const dashboardEndpoints = new Set([
  'api/bootstrap.js',
  'api/rss-proxy.js',
  'api/version.js',
  'api/wm-session.js',
  'api/batch/v1/[rpc].ts',
  'api/supply-chain/v1/[rpc].ts',
  'api/conflict/v1/[rpc].ts',
  'api/economic/v1/[rpc].ts',
  'api/market/v1/[rpc].ts',
  'api/news/v1/[rpc].ts',
  'api/seismology/v1/[rpc].ts',
]);

// Archive a commit to keep local environment files, dependencies, and work in progress out of the upload.
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
execFileSync('git', ['archive', '--format=tar', '--output', archive, commit], { cwd: root });
execFileSync('tar', ['-xf', archive, '-C', stage]);
rmSync(archive);

// The inventory generator reads the full source tree. Run it before filtering out routes.
execFileSync(process.execPath, ['scripts/generate-inventory-facts.mjs'], { cwd: stage, stdio: 'inherit' });

const apiFiles = execFileSync('git', ['ls-tree', '-r', '--name-only', '-z', commit, 'api'], {
  cwd: root,
  encoding: 'utf8',
}).split('\0');
const hormuzRoute = '/api/supply-chain/hormuz-tracker';
const sharedHormuzRoute = '/api/supply-chain/v1/hormuz-tracker';
renameSync(join(stage, 'api/supply-chain/hormuz-tracker.js'), join(stage, 'api/supply-chain/_hormuz-tracker.js'));

for (const file of apiFiles) {
  const isEntrypoint = /\.(?:[cm]?[jt]s|tsx)$/.test(file)
    && !file.split('/').some(part => part.startsWith('_'));
  if (isEntrypoint && !dashboardEndpoints.has(file) && file !== 'api/supply-chain/hormuz-tracker.js') rmSync(join(stage, file));
}

// Share the supply-chain Edge function with the legacy Hormuz route.
const supplyChainPath = join(stage, 'api/supply-chain/v1/[rpc].ts');
renameSync(supplyChainPath, join(stage, 'api/supply-chain/v1/_domain-handler.ts'));
writeFileSync(supplyChainPath, [
  "import supplyChain from './_domain-handler';",
  "// @ts-ignore -- legacy Edge handler is JavaScript",
  "import hormuz from '../_hormuz-tracker.js';",
  '',
  "export const config = { runtime: 'edge' };",
  '',
  'export default function handler(request: Request) {',
  '  const path = new URL(request.url).pathname;',
  `  if (path === '${hormuzRoute}' || path === '${sharedHormuzRoute}') {`,
  '    return hormuz(request);',
  '  }',
  '  return supplyChain(request);',
  '}',
  '',
].join('\n'));

// Reuse the version function slot for the authenticated daily energy refresh.
const versionPath = join(stage, 'api/version.js');
renameSync(versionPath, join(stage, 'api/_version.js'));
copyFileSync(join(stage, 'scripts/bhumi-energy-refresh.mjs'), join(stage, 'api/_bhumi-energy-refresh.mjs'));
writeFileSync(versionPath, [
  "import version from './_version.js';",
  "import { refreshEnergy } from './_bhumi-energy-refresh.mjs';",
  '',
  'export function GET(request) {',
  "  return new URL(request.url).searchParams.get('task') === 'energy-refresh'",
  '    ? refreshEnergy(request)',
  '    : version();',
  '}',
  '',
].join('\n'));

const seedsDir = join(stage, 'energy-seeds');
buildSync({
  absWorkingDir: root,
  entryPoints: energyRefreshLanes.flat().map(([name]) => 'scripts/' + name + '.mjs'),
  outdir: seedsDir,
  outExtension: { '.js': '.mjs' },
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'esm',
  banner: { js: "import { createRequire as createSeedRequire } from 'node:module'; const require = createSeedRequire(import.meta.url);" },
});
copyFileSync(join(stage, 'scripts/_proxy-utils.cjs'), join(seedsDir, '_proxy-utils.cjs'));
mkdirSync(join(seedsDir, 'data'));
for (const asset of [
  'pipelines-gas.json', 'pipelines-oil.json', 'storage-facilities.json',
  'fuel-shortages.json', 'energy-disruptions.json', 'energy-crisis-policies.json', 'spr-policies.json',
]) {
  copyFileSync(join(stage, 'scripts/data', asset), join(seedsDir, 'data', asset));
}

// Prevent the cloud install from recomputing the inventory against the reduced route set.
const packagePath = join(stage, 'package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
delete packageJson.scripts.postinstall;
writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

// Vercel's Node middleware at runtime cannot resolve extensionless TS imports.
const middlewarePath = join(stage, 'middleware.ts');
const middlewareSource = readFileSync(middlewarePath, 'utf8');
const configStart = middlewareSource.lastIndexOf('export const config =');
if (configStart < 0) throw new Error('Missing static Vercel middleware matcher');
buildSync({
  entryPoints: [middlewarePath],
  outfile: join(stage, 'middleware-bundle.mjs'),
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'esm',
  external: ['@vercel/functions/middleware'],
});
writeFileSync(join(stage, 'middleware-bundle.d.mts'),
  'export default function middleware(request: Request): Response | Promise<Response>;\n');
writeFileSync(middlewarePath,
  "export { default } from './middleware-bundle.mjs';\n\n" + middlewareSource.slice(configStart));

const vercelPath = join(stage, 'vercel.json');
const vercel = JSON.parse(readFileSync(vercelPath, 'utf8'));
vercel.rewrites.unshift({ source: hormuzRoute, destination: sharedHormuzRoute });
vercel.fluid = true;
vercel.functions = {
  ...vercel.functions,
  'api/version.js': {
    maxDuration: 300,
    includeFiles: '{energy-seeds/**,shared/commodities.json}',
  },
};
vercel.crons.push({ path: '/api/version?task=energy-refresh', schedule: '0 2 * * *' });
vercel.buildCommand = 'VITE_BHUMI_WATCH=1 npx vite build';
writeFileSync(vercelPath, JSON.stringify(vercel, null, 2) + '\n');

appendFileSync(join(stage, '.vercelignore'), '\n/.env\n/.env.*\n/node_modules/\n/dist/\n');
console.log(`Vercel Hobby workspace for ${commit}: ${stage}`);
