#!/usr/bin/env node
import { run } from '../src/cli.mjs';

run(process.argv.slice(2)).catch((err) => {
  console.error(`\n  ${red('×')} ${err?.message || err}\n`);
  process.exit(1);
});

function red(s) { return `\x1b[31m${s}\x1b[0m`; }
