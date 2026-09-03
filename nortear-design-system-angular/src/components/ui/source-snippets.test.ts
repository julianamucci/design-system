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
  // Rótulos acessíveis que o snippet INTERPOLA e a story consulta pelo nome
  // acessível. Também são DADO: moram no módulo de snippet porque o construtor
  // fecha sobre eles, e a story os importa de volta — o mesmo texto no exemplo
  // e na asserção, em vez de duas cópias, das quais uma envelhece sozinha.
  'LABEL',
  'LABEL_HANDLE',
  'LABEL_NEXT',
  'LABEL_PAGE',
  'LABEL_PREVIOUS',
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

/**
 * Palavras que aparecem numa expressão de template e NÃO são membro de classe.
 *
 * Literal, palavra reservada e sintaxe de controle de fluxo do Angular. A lista
 * é fechada de propósito: o que não estiver aqui e não for membro declarado é
 * acusado, porque o silêncio é o modo de falhar que este check existe para
 * fechar.
 */
const NAO_E_MEMBRO = new Set([
  'true', 'false', 'null', 'undefined', 'this', 'let', 'as', 'of', 'track', 'in',
  '$event', '$index', '$first', '$last', '$even', '$odd', '$count', '$implicit',
]);

/**
 * O que o template LIGA e a classe do snippet não declara.
 *
 * POR QUE ESTE CHECK EXISTE. Expressão de template do Angular só enxerga membro
 * de classe — uma constante importada no topo do arquivo é invisível ali. Três
 * snippets de `context-breakdown` ligavam `[parts]="CONTEXT_PARTS_TYPICAL"`
 * direto, e quem copiasse receberia um binding que não resolve. O check irmão,
 * que confere os IMPORTS, passava: o import estava certo, o uso é que não podia
 * ser aquele. É a mesma promessa vista do outro lado, e faltava metade dela.
 *
 * Só a RAIZ da expressão é conferida: em `usuario.nome` quem precisa existir é
 * `usuario`, e em `contar()` é `contar`. O que vem depois do ponto é do tipo,
 * não do escopo do template.
 */
function ligacoesSemMembro(texto: string): string[] {
  const template = /template:\s*`([\s\S]*?)`/.exec(texto)?.[1];
  if (!template) return [];

  // Os membros que a classe do próprio snippet declara: campo, método,
  // getter, e o que vier de `readonly`/`protected`/`static`.
  const membros = new Set<string>();
  for (const m of texto.matchAll(
    /^\s*(?:readonly|protected|private|public|static|get|set|async)?\s*(?:readonly\s+)?([A-Za-z_$][\w$]*)\s*[=(:]/gm,
  )) {
    membros.add(m[1]!);
  }

  // O PRÓPRIO TEMPLATE introduz nomes, e ignorá-los foi o meu primeiro erro
  // aqui: a versão anterior deste check acusou 50 bindings corretos, quase
  // todos variável de `@for`. Portão que despeja falso positivo ensina a
  // ignorar portão, e junto some o achado que importava.
  const locais = new Set<string>();
  // `@for (choice of choices; track choice.value)` — o nome antes do `of`.
  for (const m of template.matchAll(/@for\s*\(\s*([A-Za-z_$][\w$]*)\s+of\s/g)) locais.add(m[1]!);
  // `@if (x; as y)` e `@switch`/`@case` com apelido.
  for (const m of template.matchAll(/;\s*as\s+([A-Za-z_$][\w$]*)/g)) locais.add(m[1]!);
  // `@let nome = …`
  for (const m of template.matchAll(/@let\s+([A-Za-z_$][\w$]*)/g)) locais.add(m[1]!);
  // `<ng-template #nome>` e referência de template em geral.
  for (const m of template.matchAll(/#([A-Za-z_$][\w$]*)/g)) locais.add(m[1]!);

  const soltos = new Set<string>();
  const registra = (expressaoBruta: string) => {
    // TEXTO DENTRO DA EXPRESSÃO NÃO É REFERÊNCIA, e foi o terceiro falso
    // positivo deste check: `[attr.aria-label]="'Ir para página ' + n"` acusava
    // `para`, `p` e `gina`. A exclusão por aspas da varredura lá embaixo só
    // protege o PRIMEIRO caractere depois da abertura — e `á` não é `\w`, então
    // a varredura recomeçava no meio da palavra e inventava dois nomes.
    // Esvaziar cada literal antes de varrer fecha o caso inteiro.
    const semTexto = expressaoBruta.replace(/'[^']*'/g, "''").replace(/`[^`]*`/g, '``');

    // CHAVE DE OBJETO LITERAL NÃO É REFERÊNCIA, e foi o segundo falso positivo
    // deste check: `[usage]="{ input: 18000, output: 7000 }"` acusava `input` e
    // `output` como membros faltando. O que distingue chave de ramo de ternário
    // é o que vem ANTES — chave é precedida de `{` ou `,`, e o ramo de um
    // ternário, de `?` ou `:`. Apagar a chave antes de varrer resolve sem
    // precisar entender a expressão.
    const expressao = semTexto.replace(/([{,]\s*)[A-Za-z_$][\w$]*(\s*:)/g, '$1$2');

    for (const ident of expressao.matchAll(/(?:^|[^.\w$'"`])([A-Za-z_$][\w$]*)/g)) {
      const nome = ident[1]!;
      if (NAO_E_MEMBRO.has(nome) || membros.has(nome) || locais.has(nome)) continue;
      soltos.add(nome);
    }
  };

  // Binding de propriedade, escuta de evento e interpolação — os três lugares
  // em que uma expressão do template é avaliada contra a classe.
  for (const m of template.matchAll(/\[[\w.$-]+\]="([^"]*)"/g)) registra(m[1]!);
  for (const m of template.matchAll(/\((?!\s)[\w.$-]+\)="([^"]*)"/g)) registra(m[1]!);
  for (const m of template.matchAll(/\{\{([^}]*)\}\}/g)) registra(m[1]!);

  // E os BLOCOS DE CONTROLE, que eram o quarto lugar e não eram conferidos.
  //
  // A varredura já lia `@for` — mas só para colher o nome do laço como local, o
  // que a fazia ACEITAR a fonte sem olhar. `@for (slide of slides; …)` contra
  // uma classe vazia passava verde, e quem copiasse receberia um laço que não
  // resolve: exatamente o defeito que este check existe para pegar, escapando
  // pela porta que ele mesmo abria. Medido em 2026-09-03, logo depois de a
  // extração pôr 49 construtores ao alcance — `carousel` e `scroll-area`
  // publicavam cinco laços assim.
  //
  // A fonte do laço e a expressão de `track` são avaliadas contra a classe como
  // qualquer binding; a condição de `@if` e a de `@switch`/`@case`, também.
  for (const m of template.matchAll(/@for\s*\(\s*[A-Za-z_$][\w$]*\s+of\s+([^;)]+)/g)) registra(m[1]!);
  for (const m of template.matchAll(/;\s*track\s+([^;)]+)/g)) registra(m[1]!);
  for (const m of template.matchAll(/@if\s*\(([^)]*)\)/g)) registra(m[1]!.split(';')[0]!);
  for (const m of template.matchAll(/@(?:switch|case)\s*\(([^)]*)\)/g)) registra(m[1]!);

  // O QUE ESTA VARREDURA AINDA NÃO ALCANÇA, e vale saber antes de chamá-la de
  // verde: cada construtor é chamado UMA vez, com os padrões. Snippet que muda
  // de forma conforme o arg — o do scroll-area monta um conteúdo diferente por
  // orientação — só tem o ramo padrão conferido. Três dos quatro laços dele
  // ficaram fora desta medição e foram corrigidos por LEITURA, não por portão.

  return [...soltos].sort();
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

        it(`${name} liga só o que a classe declara`, () => {
          const saida = fn();
          if (typeof saida !== 'string') return;

          const soltos = ligacoesSemMembro(saida);
          expect(
            soltos,
            `${name}: o template liga ${soltos.join(', ')}, que a classe não declara — ` +
              `expressão de template só enxerga membro de classe, e quem copiar recebe ` +
              `um binding que não resolve`,
          ).toEqual([]);
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
