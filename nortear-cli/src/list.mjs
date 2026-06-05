// `nortear list` — imprime o índice do registry.
import { c, log, fetchRegistry } from './lib.mjs';

export async function list({ flags }) {
  const registry = flags.registry || 'https://nortear.dev/v1';
  const index = await fetchRegistry(registry, 'index');
  console.log(`\n  ${c.bold('Nortear registry')} ${c.dim(`(${registry})`)}\n`);
  for (const entry of index.items) {
    const deps = entry.registryDependencies?.length
      ? c.dim(` ← ${entry.registryDependencies.join(', ')}`)
      : '';
    console.log(`    ${c.bold(entry.name.padEnd(20))} ${c.dim(`v${entry.version}`)}${deps}`);
  }
  console.log('');
}
