// nortear — dispatcher. Sem dep: parser de argv minimalista.
import { init } from './init.mjs';
import { add } from './add.mjs';
import { list } from './list.mjs';

const VERSION = '0.1.0-poc';

const HELP = `
  ${bold('nortear')} ${dim('— componentes copiados, não dependência (estilo shadcn, sem Tailwind/React)')}

  ${bold('Comandos')}
    nortear init [--registry <url|path>] [--root <dir>] [--yes]
        Cria nortear.json e instala a camada base (lib/, tokens, themes, estilos compartilhados).

    nortear add <name...> [--registry <url|path>] [--overwrite] [--dry-run] [--yes]
        Copia o componente e suas dependências de registry para o projeto.

    nortear list [--registry <url|path>]
        Lista todos os componentes disponíveis no registry.

  ${bold('Opções globais')}
    --registry <url|path>   URL HTTPS ou caminho local (./registry/v1). Default: o do nortear.json.
    --version, -v           Mostra versão.
    --help, -h              Mostra esta ajuda.
`;

export async function run(argv) {
  const { command, args, flags } = parse(argv);

  if (flags.version || flags.v) { console.log(VERSION); return; }
  if (!command || flags.help || flags.h) { console.log(HELP); return; }

  switch (command) {
    case 'init': return init({ args, flags });
    case 'add':  return add({ args, flags });
    case 'list': return list({ args, flags });
    default: throw new Error(`Comando desconhecido: ${command}. Use --help.`);
  }
}

// Parser tipo `commando arg1 arg2 --flag valor --bool`.
function parse(argv) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (tok.startsWith('--')) {
      const key = tok.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('-')) flags[key] = true;
      else { flags[key] = next; i++; }
    } else if (tok.startsWith('-') && tok.length > 1) {
      flags[tok.slice(1)] = true;
    } else {
      positional.push(tok);
    }
  }
  return { command: positional[0], args: positional.slice(1), flags };
}

function bold(s) { return `\x1b[1m${s}\x1b[0m`; }
function dim(s)  { return `\x1b[2m${s}\x1b[0m`; }
