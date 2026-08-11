import { execSync } from 'node:child_process';
import { build } from 'esbuild';

// 1) Typecheck strict (tsc) — le build ne passe pas si le typage est faux.
execSync('npx tsc -p tsconfig.build.json --noEmit', { stdio: 'inherit' });

// 2) Bundle ESM exécutable par Node directement (resolve les imports sans extension,
//    contrairement à la sortie brute de tsc). sharp est natif → laissé externe.
const common = {
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  sourcemap: true,
  external: ['sharp'],
  packages: 'external',
  logLevel: 'info',
};

await Promise.all([
  build({ ...common, entryPoints: ['src/index.ts'], outfile: 'dist/index.js' }),
  build({ ...common, entryPoints: ['src/infrastructure/database/migrate.ts'], outfile: 'dist/migrate.js' }),
]);

console.log('✓ build esbuild terminé (dist/index.js, dist/migrate.js)');
