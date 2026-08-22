/**
 * Guarda transversal das transforms do painel Code.
 *
 * O painel imprimia a árvore do `render` da story, que monta andaime existente
 * só no arquivo de story ou no módulo de fixtures. O snippet compilava na
 * cabeça de quem lia e falhava ao colar. E a saída do painel NÃO chega ao DOM
 * durante a `play`: nenhuma suíte de browser a alcança, que é por que o defeito
 * viveu tanto tempo sem nada acusar.
 *
 * Cada `*.source.ts` exporta funções chamáveis SEM argumento (os args da story
 * são opcionais e caem no padrão). É isso que permite varrer todas de uma vez e
 * cobrar o que vale para o repositório inteiro: o snippet ensina o design
 * system, não o andaime.
 *
 * As três checagens que não cabem em olho humano:
 *
 * 1. **Toda tag JSX de inicial maiúscula precisa ter origem.** Ou o snippet a
 *    importa, ou a declara. Não existe curadoria de nomes proibidos aqui — o
 *    que não tem origem é andaime por definição, hoje e nos componentes que
 *    ainda não existem.
 * 2. **Todo nome importado de `@/components/ui/<x>` precisa existir lá.** É a
 *    checagem que pega o snippet que ensina uma peça que o componente não
 *    exporta.
 * 3. **Espião de control não vaza.** O Storybook entrega `onX` como FUNÇÃO;
 *    interpolada, o corpo do mock aparece no painel como se fosse código do
 *    design system.
 */
import { describe, expect, it } from 'vitest';
import pkg from '../../../package.json';

const modulos = import.meta.glob<Record<string, unknown>>('./**/*.source.ts', { eager: true });
const caminhos = Object.keys(modulos).sort();

/** Fonte crua dos primitivos, para saber o que cada um realmente exporta. */
const fontes = import.meta.glob<string>('./**/*.tsx', {
  eager: true,
  query: '?raw',
  import: 'default',
});

/** Fonte crua dos arquivos de story, para cobrar a fiação do `meta`. */
const storiesRaw = Object.fromEntries(
  Object.entries(fontes).filter(([caminho]) => caminho.endsWith('.stories.tsx')),
);

/** Nomes exportados por `src/components/ui/<slug>.tsx`, por slug. */
const slugExportados = new Map<string, Set<string>>();
for (const [caminho, fonte] of Object.entries(fontes)) {
  if (caminho.endsWith('.stories.tsx') || caminho.endsWith('.fixtures.tsx')) continue;
  const slug = caminho.replace(/^\.\//, '').replace(/\.tsx$/, '');
  const nomes = new Set<string>();
  for (const [, nome] of fonte.matchAll(/export\s+(?:async\s+)?(?:const|function|class|let)\s+([A-Za-z0-9_$]+)/g)) {
    nomes.add(nome);
  }
  for (const [, nome] of fonte.matchAll(/export\s+type\s+([A-Za-z0-9_$]+)/g)) nomes.add(nome);
  for (const [, bloco] of fonte.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const parte of bloco.split(',')) {
      const nome = parte.trim().split(/\s+as\s+/).pop()?.trim();
      if (nome) nomes.add(nome.replace(/^type\s+/, ''));
    }
  }
  slugExportados.set(slug, nomes);
}

/** Pacotes que um snippet pode citar: só o que o projeto realmente instala. */
const dependencias = new Set(Object.keys(pkg.dependencies ?? {}));

/** Regra do repositório: nada de nome de outra stack no que o leitor vê. */
const OUTRA_STACK = /\b(Vue|Svelte|Angular|Vanilla|reka-ui|bits-ui|@radix-ng|radix-vue)\b/i;

/** Andaime de story por forma do nome — pega o que ainda não foi escrito. */
const FORMA_SCAFFOLD =
  /\b(?:[A-Z][A-Za-z0-9]*(?:Story|Stories|Demo|Render|Preview|Fixture|Wrapper)|Demo[A-Z][A-Za-z0-9]*|Controlled[A-Z][A-Za-z0-9]*)\b/;

/** Tags nativas e pseudo-elementos que nunca precisam de origem. */
const TAGS_LIVRES = new Set(['Fragment', 'React', 'Suspense', 'StrictMode']);

/** Marcador plantado no corpo do espião: se aparecer na saída, vazou. */
const MARCA_SPY = 'ESPIAO_DE_CONTROL_VAZOU';

/**
 * Args com espião em toda prop de callback, como o Storybook os entrega.
 *
 * Só `onX` e `setX` viram função: qualquer coisa é o comportamento real do
 * runtime, e transformar TODO arg em função inventaria uma falha que o painel
 * não produz.
 */
function argsWithSpies(): Record<string, unknown> {
  const eCallback = (chave: string | symbol) =>
    typeof chave === 'string' && /^(on|set)[A-Z]/.test(chave);
  return new Proxy({} as Record<string, unknown>, {
    get: (_alvo, chave) =>
      eCallback(chave) ? () => 'ESPIAO_DE_CONTROL_VAZOU' : undefined,
    has: (_alvo, chave) => eCallback(chave),
  });
}

/** Nomes que o snippet liga por `import`, e os módulos de onde vêm. */
function importesDo(snippet: string): { nomes: Set<string>; modulos: string[] } {
  const nomes = new Set<string>();
  const modulos: string[] = [];
  const re = /import\s+(type\s+)?([\s\S]*?)\s+from\s+["']([^"']+)["']/g;
  for (const [, , clausula, modulo] of snippet.matchAll(re)) {
    modulos.push(modulo);
    const chaves = clausula.match(/\{([\s\S]*)\}/);
    if (chaves) {
      for (const parte of chaves[1].split(',')) {
        const nome = parte.trim().split(/\s+as\s+/).pop()?.trim();
        if (nome) nomes.add(nome.replace(/^type\s+/, ''));
      }
    }
    const defaultOuNamespace = clausula.replace(/\{[\s\S]*\}/, '').replace(/^type\s+/, '');
    for (const parte of defaultOuNamespace.split(',')) {
      const nome = parte.trim().replace(/^\*\s+as\s+/, '');
      if (nome && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(nome)) nomes.add(nome);
    }
  }
  return { nomes, modulos };
}

/** Nomes que o próprio snippet declara — função, const, let, class, parâmetro de map. */
function declaradosNo(snippet: string): Set<string> {
  const nomes = new Set<string>();
  for (const [, nome] of snippet.matchAll(/(?:function|const|let|var|class)\s+([A-Za-z0-9_$]+)/g)) {
    nomes.add(nome);
  }
  return nomes;
}

describe('transforms do painel Code', () => {
  it('a varredura encontra os módulos de source', () => {
    expect(caminhos.length).toBeGreaterThan(0);
  });

  it('todo arquivo de story importa a transform do seu componente', () => {
    const noFiacao = Object.entries(storiesRaw)
      .filter(([, fonte]) => !/from\s+["']\.\/[a-z0-9-]+\.source["']/.test(fonte))
      .map(([caminho]) => caminho)
      .sort();
    expect(noFiacao, 'story sem transform declarada no meta').toEqual([]);
  });

  it('todo arquivo de story declara a transform em source.transform', () => {
    const noTransform = Object.entries(storiesRaw)
      .filter(([, fonte]) => !/source:\s*\{[\s\S]{0,200}?transform:/.test(fonte))
      .map(([caminho]) => caminho)
      .sort();
    expect(noTransform, 'meta sem parameters.docs.source.transform').toEqual([]);
  });

  for (const caminho of caminhos) {
    const modulo = modulos[caminho];
    const exportadas = Object.entries(modulo).filter(
      ([, valor]) => typeof valor === 'function',
    ) as Array<[string, (...args: never[]) => unknown]>;

    describe(caminho, () => {
      it('exporta ao menos uma transform', () => {
        expect(exportadas.length).toBeGreaterThan(0);
      });

      for (const [nome, fn] of exportadas) {
        it(`${nome} devolve um snippet honesto`, () => {
          const saida = fn();
          expect(typeof saida, `${nome} deve devolver string sem receber args`).toBe('string');
          const texto = saida as string;
          expect(texto.trim().length).toBeGreaterThan(0);

          // Docs de cada stack são consumidas isoladamente.
          expect(texto).not.toMatch(OUTRA_STACK);
          // A lib headless é detalhe de implementação: quem lê importa do
          // design system, nunca dela.
          expect(texto).not.toContain('@base-ui');
          // Andaime de story, por forma do nome.
          expect(texto).not.toMatch(FORMA_SCAFFOLD);
          // Módulo que só existe para as stories montarem.
          expect(texto).not.toContain('fixtures');
          // O `{...args}` da story não é composição que alguém escreva.
          expect(texto).not.toContain('{...args}');
          // Sobra de template literal mal fechado.
          expect(texto).not.toContain('undefined');
          expect(texto).not.toContain('[object Object]');
          expect(texto).not.toContain('NaN');
        });

        it(`${nome} só usa peças com origem`, () => {
          const texto = fn() as string;
          const { nomes, modulos: mods } = importesDo(texto);
          const locais = declaradosNo(texto);

          for (const mod of mods) {
            const conhecido =
              mod.startsWith('@/components/ui/') ||
              mod.startsWith('@/lib/') ||
              mod.startsWith('@/hooks/') ||
              dependencias.has(mod) ||
              dependencias.has(mod.split('/').slice(0, mod.startsWith('@') ? 2 : 1).join('/'));
            expect(conhecido, `${nome}: import de módulo desconhecido "${mod}"`).toBe(true);
          }

          // O `<` de uma tag JSX nunca vem colado a um identificador. O de um
          // genérico vem sempre: `useState<Date>`, `Array<string>`,
          // `Record<string, Foo>`. Sem esta âncora a guarda cobrava import de
          // `Date` — tipo global, que ninguém importa.
          const tags = new Set(
            [...texto.matchAll(/(?:^|[^A-Za-z0-9_$])<([A-Z][A-Za-z0-9_$]*)/g)].map(([, tag]) => tag),
          );
          for (const tag of tags) {
            if (TAGS_LIVRES.has(tag)) continue;
            const hasOrigem = nomes.has(tag) || locais.has(tag);
            expect(hasOrigem, `${nome}: <${tag}> não é importado nem declarado no snippet`).toBe(true);
          }
        });

        it(`${nome} importa só o que o componente exporta`, () => {
          const texto = fn() as string;
          // `[^{}]` e não `[\s\S]`: a chave de um import nunca aninha, e a
          // versão gulosa emendava DOIS imports quando o do design system não
          // era o primeiro — lia `useState } from "react"; import { Calendar`
          // como um nome só e reprovava um snippet correto.
          const re = /import\s+(?:type\s+)?\{([^{}]*)\}\s+from\s+["']@\/components\/ui\/([a-z0-9-]+)["']/g;
          for (const [, clausula, slug] of texto.matchAll(re)) {
            const disponiveis = slugExportados.get(slug);
            expect(disponiveis, `${nome}: não existe src/components/ui/${slug}.tsx`).toBeDefined();
            for (const parte of clausula.split(',')) {
              const importado = parte.trim().split(/\s+as\s+/)[0].replace(/^type\s+/, '').trim();
              if (!importado) continue;
              expect(
                disponiveis!.has(importado),
                `${nome}: ${slug} não exporta "${importado}"`,
              ).toBe(true);
            }
          }
        });

        it(`${nome} não deixa espião de control virar código`, () => {
          const withSpies = fn(undefined as never, { args: argsWithSpies() } as never);
          expect(typeof withSpies).toBe('string');
          // A arrow function EM SI é legítima num snippet — `onClick={() =>
          // setAberto(true)}` é a composição real. O que não pode aparecer é o
          // corpo do mock, e é o marcador que separa um caso do outro.
          expect(withSpies as string).not.toContain(MARCA_SPY);
          expect(withSpies as string).not.toContain('undefined');
          expect(withSpies as string).not.toContain('[object Object]');
        });
      }
    });
  }
});
