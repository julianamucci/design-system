// `nortear add <name...>` — copia componentes + suas dependências do registry.
import path from 'node:path';
import { spawn } from 'node:child_process';
import {
  c, log,
  readConfig, resolveAll,
  targetFor, rewriteImports, makeRelImport,
  writeFileEnsuringDir, appendIfMissing, exists,
} from './lib.mjs';

export async function add({ args, flags }) {
  if (args.length === 0) throw new Error('uso: nortear add <name...>');

  const root = path.resolve(flags.root || process.cwd());
  const cfg = await readConfig(root);
  const registry = flags.registry || cfg.registry;
  const overwrite = !!flags.overwrite;
  const dryRun = !!flags['dry-run'];

  console.log(`\n  ${c.bold('Nortear add')} ${c.dim(`@ ${root}`)}\n`);

  // Resolve a árvore (componente + registryDependencies).
  const items = await resolveAll(registry, args);
  log('info', `${items.length} item(s) a processar: ${items.map((i) => i.name).join(', ')}`);

  const npmDeps = new Set();
  let written = 0, skipped = 0;
  const cssImportsToAdd = [];

  for (const item of items) {
    for (const file of item.files) {
      const targetRel = targetFor(file, cfg.paths);
      const targetAbs = path.resolve(root, targetRel);
      const content = file.type === 'lib' || file.type === 'component'
        ? rewriteImports(file.content, targetRel, cfg.paths)
        : file.content;
      if (dryRun) {
        log('info', `(dry-run) ${targetRel}`);
      } else {
        const r = await writeFileEnsuringDir(targetAbs, content, { overwrite });
        if (r.skipped) { log('skip', `${item.name} → ${targetRel}`); skipped++; }
        else           { log('add',  `${item.name} → ${targetRel}`); written++; }
      }
      // CSS de componente entra no entry CSS (path relativo ao entry).
      if (file.type === 'style') {
        cssImportsToAdd.push(makeRelImport(targetRel, cfg.entryCss));
      }
    }
    for (const dep of (item.dependencies || [])) npmDeps.add(dep);
  }

  // Acrescenta @imports no entry CSS.
  if (!dryRun) {
    const entryCssAbs = path.resolve(root, cfg.entryCss);
    for (const imp of cssImportsToAdd) {
      const r = await appendIfMissing(entryCssAbs, `@import "${imp}";`);
      if (r.added) log('add', `${cfg.entryCss}: @import "${imp}"`);
    }
  }

  // Instala deps npm faltantes.
  if (npmDeps.size && !dryRun) {
    await installIfMissing(root, [...npmDeps]);
  }

  console.log(`\n  ${c.ok('✓')} add concluído. ${c.dim(`${written} arquivos novos, ${skipped} preservados.`)}\n`);
}

async function installIfMissing(root, deps) {
  // Lê package.json p/ pular o que já está instalado.
  let pkg = {};
  try { pkg = JSON.parse(await (await import('node:fs/promises')).readFile(path.join(root, 'package.json'), 'utf8')); } catch {}
  const installed = new Set([
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ]);
  const missing = deps.filter((d) => !installed.has(d));
  if (!missing.length) { log('skip', `npm deps já presentes: ${deps.join(' ')}`); return; }

  let cmd = 'npm', args = ['install', ...missing];
  if (await exists(path.join(root, 'pnpm-lock.yaml')))  { cmd = 'pnpm'; args = ['add', ...missing]; }
  else if (await exists(path.join(root, 'yarn.lock'))) { cmd = 'yarn'; args = ['add', ...missing]; }
  else if (await exists(path.join(root, 'bun.lockb'))) { cmd = 'bun';  args = ['add', ...missing]; }
  log('info', `${cmd} ${args.join(' ')}`);
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
    p.on('close', (code) => code === 0 ? resolve() : reject(new Error(`${cmd} saiu com código ${code}`)));
  });
}
