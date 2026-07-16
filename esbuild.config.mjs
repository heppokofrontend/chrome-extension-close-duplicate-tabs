/// <reference types="node" />
import { build, context } from 'esbuild';

const entryPoints = [
  { in: 'src/contexts/content-scripts.ts', out: 'content-scripts' },
  { in: 'src/contexts/popup/index.ts', out: 'popup' },
  { in: 'src/contexts/worker/index.ts', out: 'worker' },
  { in: 'src/contexts/duplicates-list.ts', out: 'duplicates-list' },
  { in: 'src/contexts/i18n.ts', out: 'i18n' },
];

const watch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints,
  outdir: 'package',
  alias: { '@': './src' },
  bundle: true,
  format: 'iife',
  target: 'chrome120',
  ...(watch ? { sourcemap: 'inline' } : { minify: true }),
};

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
} else {
  await build(options);
}
