// Portão: todo patch de `patches/` está DE FATO aplicado em `node_modules`.
//
// O modo de falha que ele fecha já custou um dia de CI nesta casa. O nome do
// arquivo de patch carrega a versão (`reka-ui+2.10.3.patch`), então um bump de
// dependência faz o `patch-package` do `postinstall` deixar de aplicá-lo — e o
// pior não é o CI: é o patch parar de valer no ambiente LOCAL sem aviso, de modo
// que tudo que se medir naquele componente vale para um estado que o design
// system não entrega.
//
// POR QUE ELE MORA AQUI, e não em `scripts/audit.mjs`:
//
// 1. o `audit.mjs` audita a ÁRVORE DE FONTE — ele pula `node_modules` por nome,
//    de propósito. O que este portão mede não é fonte: é o estado da árvore
//    INSTALADA, que só existe depois do `npm install`;
// 2. rodando pelo projeto `unit` da própria stack, `node_modules` está garantido
//    presente — o vitest sai de lá. Isso zera o falso positivo que o `audit.mjs`
//    teria: da raiz do repositório ele veria as cinco stacks, e reprovaria
//    qualquer uma cujas dependências ainda não tivessem sido instaladas.
//    Portão que reprova por dependência não instalada ensina a ignorar o portão;
// 3. o portão vive na stack DONA do patch, então nada é pulado em silêncio: não
//    existe caminho em que ele passe sem ter medido.
//
// A lista é o DIRETÓRIO, e não uma enumeração escrita aqui: patch novo entra na
// varredura sozinho. É o contrário do `source-snippets.test.ts`, que encolheu em
// silêncio quando 28 exports saíram do filtro. A contrapartida — uma stack ganhar
// `patches/` e ficar sem portão — é fechada pela regra `patch_sem_portao` do
// `scripts/audit.mjs`, que é texto puro e não precisa de `node_modules`.
//
// COMO ELE PROVA QUE O PATCH ESTÁ APLICADO: reconstrói, de cada bloco `@@` do
// diff, o texto DEPOIS do patch (linhas de contexto + linhas adicionadas, na
// ordem) e exige esse trecho no arquivo instalado. Conferir só a existência do
// arquivo de patch não provaria nada, e procurar apenas as linhas adicionadas
// soltas daria falso verde quando o trecho aparece em outro ponto do arquivo.
//
// Verificado plantando o defeito: revertida uma linha do `reka-ui` em
// `node_modules`, o caso reprova nomeando o pacote, o arquivo e o bloco.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const STACK = process.cwd();
const PATCHES = join(STACK, 'patches');

/** Um bloco `@@` do diff, já reduzido ao texto que deve existir DEPOIS do patch. */
type Hunk = { file: string; after: string };

type PatchFile = { name: string; pkg: string; declaredVersion: string; hunks: Hunk[] };

const normalize = (s: string) => s.replace(/\r\n/g, '\n');

/**
 * A versão vem do NOME do arquivo (é ela que o `patch-package` compara), e o
 * pacote vem do CONTEÚDO — o cabeçalho `diff --git a/node_modules/<pkg>/…` já
 * traz o nome com escopo resolvido, enquanto no nome do arquivo o escopo chega
 * codificado com `+`.
 */
function parsePatch(name: string): PatchFile {
  const raw = normalize(readFileSync(join(PATCHES, name), 'utf8'));
  const lines = raw.split('\n');

  const base = name.replace(/\.patch$/, '');
  const declaredVersion = base.split('+').find((p) => /^\d+\.\d+\.\d+/.test(p)) ?? '';

  const hunks: Hunk[] = [];
  let file = '';
  let pkg = '';
  let body: string[] | null = null;

  const flush = () => {
    if (body && body.length > 0) hunks.push({ file, after: body.join('\n') });
    body = null;
  };

  for (const line of lines) {
    const alvo = /^\+\+\+ b\/(node_modules\/.+)$/.exec(line);
    if (alvo) {
      flush();
      file = alvo[1];
      const escopo = /^node_modules\/(@[^/]+\/[^/]+|[^/]+)\//.exec(file);
      if (escopo && !pkg) pkg = escopo[1];
      continue;
    }
    if (line.startsWith('@@')) {
      flush();
      body = [];
      continue;
    }
    if (body === null) continue;
    // `\ No newline at end of file` não é conteúdo.
    if (line.startsWith('\\')) continue;
    if (line.startsWith('-')) continue;
    if (line.startsWith('+') || line.startsWith(' ')) {
      body.push(line.slice(1));
      continue;
    }
    if (line === '') {
      // Linha de contexto vazia: alguns geradores omitem o espaço à esquerda.
      body.push('');
      continue;
    }
    // Qualquer outra coisa encerra o bloco (cabeçalho `diff --git`, `index`…).
    flush();
  }
  flush();

  return { name, pkg, declaredVersion, hunks };
}

const arquivos = existsSync(PATCHES)
  ? readdirSync(PATCHES).filter((f) => f.endsWith('.patch')).sort()
  : [];

describe('patches de node_modules continuam aplicados', () => {
  // Sem este caso, apagar a pasta `patches/` faria a suíte inteira sumir sem
  // reprovar — a forma de portão que passa medindo nada.
  it('a stack tem pelo menos um patch para medir', () => {
    expect(existsSync(PATCHES), `${PATCHES} não existe`).toBe(true);
    expect(arquivos.length).toBeGreaterThan(0);
  });

  for (const name of arquivos) {
    const patch = parsePatch(name);

    describe(name, () => {
      it('o pacote está instalado na versão que o nome do patch declara', () => {
        expect(patch.pkg, `não deu para ler o pacote em ${name}`).not.toBe('');
        expect(patch.declaredVersion, `não deu para ler a versão em ${name}`).not.toBe('');

        const manifesto = join(STACK, 'node_modules', patch.pkg, 'package.json');
        expect(existsSync(manifesto), `${patch.pkg} não está instalado`).toBe(true);

        const instalada = JSON.parse(readFileSync(manifesto, 'utf8')).version;
        expect(
          instalada,
          `${patch.pkg} instalado em ${instalada}, mas ${name} vale para ${patch.declaredVersion} — ` +
            'o patch NÃO está sendo aplicado. Refaça com `npx patch-package ' +
            `${patch.pkg}\` e apague o arquivo antigo, ou apague o patch se o upstream já corrigiu.`,
        ).toBe(patch.declaredVersion);
      });

      it('cada bloco do diff está presente no arquivo instalado', () => {
        expect(patch.hunks.length, `${name} não tem bloco nenhum`).toBeGreaterThan(0);

        for (const hunk of patch.hunks) {
          const alvo = join(STACK, hunk.file);
          expect(existsSync(alvo), `${hunk.file} não existe — ${name} não pôde ser aplicado`).toBe(
            true,
          );

          const conteudo = normalize(readFileSync(alvo, 'utf8'));
          const primeira = hunk.after.split('\n').find((l) => l.trim() !== '') ?? '';
          expect(
            conteudo.includes(hunk.after),
            `${name} NÃO está aplicado em ${hunk.file} — o trecho que começa em ` +
              `"${primeira.trim().slice(0, 80)}" não está lá. Rode \`npx patch-package\` ` +
              'e confira a linha `pacote@versão ✔`.',
          ).toBe(true);
        }
      });
    });
  }
});
