/**
 * Guarda transversal das transforms do painel Code.
 *
 * Cada `*.source.ts` exporta funções chamáveis SEM argumento (os args da story
 * são opcionais e caem no padrão). É isso que permite varrer todas de uma vez e
 * cobrar o que vale para a stack inteira: o snippet ensina o design system, não
 * o andaime da story.
 *
 * POR QUE ESTE ARQUIVO CHEGOU ATRASADO, e o que se perdeu no caminho.
 *
 * React, Vue e Svelte tinham a guarda; esta stack, não. O único portão daqui
 * era a regra `static_source_code` do `audit.mjs`, que recusa
 * `docs.source.code` fixo — ela cobra a FIAÇÃO e nunca olha o texto que sai.
 * Enquanto isso, a saída do painel não chega ao DOM durante a `play`: nenhuma
 * suíte de navegador a alcança. Um snippet com `undefined` no meio, ou
 * ensinando um elemento que ninguém importa, viveria aqui sem nada acusar.
 *
 * A checagem de ORIGEM é a que muda de forma entre as stacks. Onde há JSX, o
 * guarda cobra que toda tag de inicial maiúscula seja importada ou declarada.
 * Aqui a pergunta equivalente é a do React: todo nome que o snippet manda
 * importar do design system existe mesmo lá? É a mesma promessa — o que o
 * código exibido ensina a importar tem de resolver na mão de quem copia.
 */
import { describe, expect, it } from 'vitest';

const modulos = import.meta.glob<Record<string, unknown>>('./**/*.source.ts', { eager: true });

const caminhos = Object.keys(modulos).sort();

/** Nome do componente-invólucro que existe só dentro do arquivo de story. */
const SCAFFOLD = /\b[A-Z][A-Za-z0-9]*Story\b|\bwrapper\b|\bcaso\b/;

/** Regra do repositório: nada de nome de outra stack no que o leitor vê. */
const OTHER_STACK = /\b(React|Vue|Svelte|Vanilla|reka-ui|base-ui|bits-ui)\b/i;

/**
 * Exports que legitimamente NÃO constroem snippet.
 *
 * Lista fechada de propósito. Acrescentar um nome aqui é declarar a exceção;
 * deixar de fora é reprovar — que é o que dá dentes à convenção. Foi essa
 * convenção que pegou, no React, uma fábrica curried devolvendo função em vez
 * de string: com ela, as checagens que leem o snippet nunca chegavam ao
 * snippet.
 */
const HELPERS = new Set<string>([
  // Os IDs dos vídeos das demonstrações incorporadas. São DADO, e não
  // construtor de snippet: moram no módulo de snippet porque é ele que precisa
  // do valor como texto, e as fixtures os reexportam para o componente.
  'YOUTUBE_VIDEO_ID',
  'VIMEO_VIDEO_ID',
]);

/**
 * O TEXTO de cada módulo de componente, para saber o que ele exporta.
 *
 * Lido como texto, e não importado: importar um componente Angular fora do
 * compilador quebra, e a pergunta aqui não precisa de execução — é sobre o que
 * o arquivo declara.
 *
 * A primeira versão deste check derivava o nome da classe do nome do elemento
 * (`nds-editor` -> `NdsEditor`) e acusou quinze snippets corretos: a classe do
 * editor se chama `EditorComponent`, e o combobox se importa por um barril
 * chamado `NDS_COMBOBOX`. Portão que acusa o que não é defeito ensina a
 * ignorar portão — então a heurística saiu, e o que ficou é exato.
 */
const fontes = import.meta.glob<string>('./*.ts', { query: '?raw', import: 'default', eager: true });

/** O que um módulo de componente exporta, lido da declaração. */
function exportadosPor(slug: string): Set<string> | null {
  const texto = fontes[`./${slug}.ts`];
  if (texto === undefined) return null;

  const nomes = new Set<string>();
  for (const m of texto.matchAll(
    /export\s+(?:declare\s+)?(?:abstract\s+)?(?:const|let|var|class|function|type|interface|enum)\s+([A-Za-z_$][\w$]*)/g,
  )) {
    nomes.add(m[1]!);
  }
  // `export { A, B as C }` — o nome que vale é o de fora.
  for (const m of texto.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const parte of m[1]!.split(',')) {
      const nome = parte.trim().split(/\s+as\s+/).pop()?.trim();
      if (nome) nomes.add(nome);
    }
  }
  return nomes;
}

/**
 * Os `import { … } from '@/components/ui/<slug>'` que o snippet ensina.
 *
 * `import type` conta, e a primeira versão desta função o deixava de fora:
 * `import\s*\{` não casa com o `type` que vem entre a palavra e a chave. O
 * efeito era o pior tipo de silêncio — o snippet do filtro do combobox, que
 * importa um TIPO, passava por ser PULADO, e não por ter sido verificado. Um
 * portão que exclui em silêncio é o defeito que este repositório já pagou caro
 * duas vezes; aqui ele quase nasceu com um.
 *
 * O `type` também aparece por nome (`import { type Foo }`), e ali ele é
 * prefixo do nome — não do import. Os dois são descascados.
 */
function importesDoDesignSystem(texto: string): Array<{ slug: string; nomes: string[] }> {
  const saida: Array<{ slug: string; nomes: string[] }> = [];
  for (const m of texto.matchAll(
    /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*'@\/components\/ui\/([a-z0-9-]+)'/g,
  )) {
    saida.push({
      slug: m[2]!,
      nomes: m[1]!
        .split(',')
        .map((n) => n.trim().split(/\s+as\s+/)[0]!.trim().replace(/^type\s+/, ''))
        .filter(Boolean),
    });
  }
  return saida;
}

describe('transforms do painel Code', () => {
  it('existe pelo menos um módulo de source por varredura', () => {
    expect(caminhos.length).toBeGreaterThan(0);
  });

  for (const caminho of caminhos) {
    const modulo = modulos[caminho];
    const exportadas = Object.entries(modulo).filter(
      ([, value]) => typeof value === 'function',
    ) as Array<[string, (...args: never[]) => unknown]>;

    describe(caminho, () => {
      it('exporta ao menos uma transform', () => {
        expect(exportadas.length).toBeGreaterThan(0);
      });

      // Esta varredura não filtra por sufixo, então ela não perde teste quando
      // um nome sai da convenção — mas a convenção é cross-stack, e no Vue a
      // varredura FILTRA. Lá, a tradução dos identificadores moveu o sufixo
      // para o meio (`buttonParDeAcoesSource` -> `actionsSourceButtonPair`) e
      // apagou 28 testes com a suíte verde. Quem cobra a forma do nome é este
      // check.
      it('todo export é construtor de snippet ou helper declarado', () => {
        const fora = Object.keys(modulo).filter(
          (name) => !/(?:Source|Snippet)$/.test(name) && !HELPERS.has(name),
        );
        expect(
          fora,
          `${caminho}: export fora da convenção — termine em Source/Snippet, ou declare em HELPERS se não constrói snippet`,
        ).toEqual([]);
      });

      for (const [name, fn] of exportadas) {
        it(`${name} devolve um snippet honesto`, () => {
          const saida = fn();
          expect(typeof saida, `${name} deve devolver string sem receber args`).toBe('string');
          const texto = saida as string;
          expect(texto.trim().length).toBeGreaterThan(0);
          // O andaime da story não é parte do design system.
          expect(texto).not.toMatch(SCAFFOLD);
          // Docs de cada stack são consumidas isoladamente.
          expect(texto).not.toMatch(OTHER_STACK);
          // `@radix-ng/primitives` é a lib headless por baixo; o leitor importa
          // do design system, nunca dela.
          expect(texto).not.toContain('@radix-ng');
          // Sobra de template literal mal fechado, ou de arg que não veio.
          expect(texto).not.toContain('[object Object]');
          expect(texto).not.toContain('NaN');

          // `undefined` só é vazamento DENTRO do template.
          //
          // No corpo da classe ele é TypeScript legítimo, e escrito de
          // propósito: `signal<ComposerQuote | undefined>(undefined)` é como a
          // stack declara estado ausente. A primeira versão deste check
          // proibia a palavra no texto inteiro e acusou seis snippets corretos
          // — nas stacks onde o snippet é só marcação a regra larga funciona,
          // aqui não. No template, porém, `undefined` só chega por interpolação
          // que não veio, e ali é sempre defeito.
          const template = /template:\s*`([\s\S]*?)`/.exec(texto)?.[1];
          if (template) expect(template).not.toContain('undefined');
        });

        it(`${name} importa só o que o componente exporta`, () => {
          const saida = fn();
          if (typeof saida !== 'string') return;

          const faltando: string[] = [];
          for (const { slug, nomes } of importesDoDesignSystem(saida)) {
            const exportados = exportadosPor(slug);
            // Slug que este arquivo não alcança — subpasta, ou peça que ainda
            // não existe aqui. Acusar seria acusar a varredura, não o snippet.
            if (!exportados) continue;
            for (const nome of nomes) {
              if (!exportados.has(nome)) faltando.push(`${nome} (de ${slug})`);
            }
          }
          expect(
            faltando,
            `${name}: o snippet ensina a importar ${faltando.join(', ')} — quem copiar recebe um import que não resolve`,
          ).toEqual([]);
        });
      }
    });
  }
});
