// `nortear init` — escreve nortear.json + baixa o item 'init' (camada base).
import path from 'node:path';
import { spawn } from 'node:child_process';
import {
  c, log,
  fetchRegistry, writeConfig, readConfig,
  DEFAULT_PATHS, DEFAULT_ENTRY_CSS,
  targetFor, rewriteImports, makeRelImport,
  writeFileEnsuringDir, appendIfMissing, exists,
} from './lib.mjs';

export async function init({ flags }) {
  const root = path.resolve(flags.root || process.cwd());
  const registry = flags.registry || 'https://nortear.dev/v1';
  const overwrite = !!flags.overwrite;

  console.log(`\n  ${c.bold('Nortear init')} ${c.dim(`@ ${root}`)}\n`);

  // 1. Escreve nortear.json (não sobrescreve se já existir, salvo --overwrite).
  const cfgPath = path.resolve(root, 'nortear.json');
  if (!overwrite && await exists(cfgPath)) {
    log('skip', `nortear.json já existe (use --overwrite p/ recriar)`);
  } else {
    await writeConfig(root, {
      registry,
      paths: DEFAULT_PATHS,
      entryCss: DEFAULT_ENTRY_CSS,
    });
    log('ok', `nortear.json criado`);
  }

  // 2. Lê config (pode ter sido pré-existente) e baixa o item 'init'.
  const cfg = await readConfig(root);
  const initItem = await fetchRegistry(cfg.registry, 'init');

  // 3. Escreve cada arquivo do item init.
  let written = 0, skipped = 0;
  for (const file of initItem.files) {
    const targetRel = targetFor(file, cfg.paths);
    const targetAbs = path.resolve(root, targetRel);
    const content = file.type === 'lib' || file.type === 'component'
      ? rewriteImports(file.content, targetRel, cfg.paths)
      : file.content;
    const r = await writeFileEnsuringDir(targetAbs, content, { overwrite });
    if (r.skipped) { log('skip', targetRel); skipped++; }
    else           { log('add', targetRel); written++; }
  }

  // 4. Adiciona @imports ao CSS de entrada (path relativo ao próprio entry CSS).
  const entryCssAbs = path.resolve(root, cfg.entryCss);
  for (const ref of (initItem.entryImports || [])) {
    const targetRel = targetFor(ref, cfg.paths);
    const importPath = makeRelImport(targetRel, cfg.entryCss);
    const r = await appendIfMissing(entryCssAbs, `@import "${importPath}";`);
    if (r.added) log('add', `${cfg.entryCss}: @import "${importPath}"`);
  }

  // 5. Instala dependências npm.
  const deps = initItem.dependencies || [];
  if (deps.length) {
    if (flags['dry-run']) {
      log('info', `(dry-run) instalaria: ${deps.join(' ')}`);
    } else {
      await runPackageManager(root, deps);
    }
  }

  console.log(`\n  ${c.ok('✓')} init concluído. ${c.dim(`${written} arquivos novos, ${skipped} preservados.`)}\n  Próximo: ${c.bold('nortear add button')}\n`);
}

// Detecta pnpm/yarn/bun/npm via lockfiles e roda `install <deps>`.
async function runPackageManager(root, deps) {
  let cmd = 'npm', args = ['install', ...deps];
  if (await exists(path.join(root, 'pnpm-lock.yaml')))      { cmd = 'pnpm'; args = ['add', ...deps]; }
  else if (await exists(path.join(root, 'yarn.lock')))      { cmd = 'yarn'; args = ['add', ...deps]; }
  else if (await exists(path.join(root, 'bun.lockb')))      { cmd = 'bun';  args = ['add', ...deps]; }
  log('info', `${cmd} ${args.join(' ')}`);
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
    p.on('close', (code) => code === 0 ? resolve() : reject(new Error(`${cmd} saiu com código ${code}`)));
  });
}
