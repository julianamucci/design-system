/**
 * Guarda transversal das transforms do painel Code.
 *
 * Cada `*.source.ts` exporta funções chamáveis SEM argumento (os args da story
 * são opcionais e caem no padrão). Isso é o que permite varrer todas de uma vez
 * e cobrar o que vale para o repositório inteiro: o snippet ensina o design
 * system, não o andaime da story.
 */
import { describe, expect, it } from 'vitest';

const modulos = import.meta.glob<Record<string, unknown>>('./**/*.source.ts', { eager: true });

const caminhos = Object.keys(modulos).sort();

/**
 * O TEXTO de cada módulo, para enxergar os ramos que a chamada não produz.
 *
 * Lido em cru, e não importado: a pergunta que ele responde não é sobre o que
 * o construtor DEVOLVE com os args padrão — é sobre tudo que ele pode escrever.
 */
const fontes = import.meta.glob<string>('./**/*.source.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** Nome do componente-invólucro que existe só dentro do arquivo de story. */
const SCAFFOLD = /\b[A-Z][A-Za-z0-9]*Story\b|\bwrapper\b|\bcaso\b/;

/** Regra do repositório: nada de nome de outra stack no que o leitor vê. */
const OTHER_STACK = /\b(React|Vue|Angular|Vanilla|reka-ui|base-ui|radix)\b/i;

/**
 * Exports que legitimamente NÃO constroem snippet — hoje, nenhum: todas as
 * transforms desta stack terminam em `Source` ou `Snippet`.
 *
 * Lista fechada de propósito. Acrescentar um nome aqui é declarar a exceção;
 * deixar de fora é reprovar — que é o que dá dentes à convenção.
 */
const HELPERS = new Set<string>([]);

/**
 * Nomes que um `{#each}` pode iterar sem ninguém os declarar no exemplo.
 *
 * Lista fechada de propósito: o que não estiver aqui e não for declarado no
 * `<script>` publicado é acusado, porque o silêncio é o modo de falhar que a
 * checagem abaixo existe para fechar.
 */
const GLOBALS = new Set([
  'Array',
  'Object',
  'Math',
  'JSON',
  'Number',
  'String',
  'Boolean',
  'Date',
  'Map',
  'Set',
]);

/**
 * O texto do módulo, sem o que não é código publicado.
 *
 * Três remoções, e as três foram falso positivo meu antes de virarem regra:
 *
 *  1. COMENTÁRIO SAI PRIMEIRO. Um docblock explica o snippet em crase, e
 *     `{#each …}` citado numa explicação vira laço publicado se ninguém o
 *     tirar. Extrair o snippet por par de crases solto é a mesma armadilha
 *     vista de outro ângulo — foi assim que um nome que só existe na prosa
 *     virou achado.
 *  2. ESCAPE SAI ANTES DA INTERPOLAÇÃO. `\`Tag \${i + 1}\`` tem crase
 *     escapada; apagar `${…}` primeiro deixa duas barras coladas na crase, o
 *     casamento de crases inverte a partir dali e o `<script>` inteiro sai da
 *     conta — dois módulos CORRETOS (`scroll-area`, `table`) foram acusados
 *     assim.
 *  3. `${…}` SAI POR ÚLTIMO, de dentro para fora. O que mora ali é nome do
 *     CONSTRUTOR, não do exemplo, e contá-lo inventaria declaração em todo
 *     módulo.
 */
function textoPublicado(bruto: string): string {
  let texto = bruto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
  texto = texto.replace(/\\[\s\S]/g, '');
  let antes: string;
  do {
    antes = texto;
    texto = texto.replace(/\$\{[^{}]*\}/g, '');
  } while (texto !== antes);
  return texto;
}

/** Os trechos entre crases — onde o exemplo é escrito, e não montado. */
function templateRegions(texto: string): Array<[number, number]> {
  const regions: Array<[number, number]> = [];
  let inside = false;
  let start = 0;
  for (let i = 0; i < texto.length; i += 1) {
    if (texto[i] !== '`') continue;
    if (inside) {
      regions.push([start, i]);
      inside = false;
    } else {
      inside = true;
      start = i + 1;
    }
  }
  return regions;
}

/** O que um trecho de código PUBLICADO traz para o escopo do `<script>`. */
function collectDeclarations(trecho: string, into: Set<string>): void {
  for (const m of trecho.matchAll(/(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)/g)) {
    into.add(m[1]!);
  }
  // Desestruturação: `const { grouped, waiting } = …`. Sem ela, o snippet do
  // cartão de autorização fora da caixa era acusado por `waiting`.
  for (const m of trecho.matchAll(/(?:const|let|var)\s*\{([^}]*)\}\s*=/g)) {
    for (const parte of m[1]!.split(',')) {
      const nome = parte.trim().split(/[:=]/).pop()?.trim();
      if (nome && /^[A-Za-z_$][\w$]*$/.test(nome)) into.add(nome);
    }
  }
  // IMPORT TAMBÉM DECLARA, e esquecê-lo acusou cinco módulos corretos de uma
  // vez: os snippets que ensinam a ITERAR o vocabulário compartilhado
  // (`RUN_STATUSES`, `CONNECTION_STATES`, `CONTEXT_DISPLAY_FORMS`) publicam o
  // import da constante no próprio `<script>` — ela chega ao exemplo por ali.
  for (const m of trecho.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s*from/g)) {
    for (const parte of m[1]!.split(',')) {
      const nome = parte
        .trim()
        .split(/\s+as\s+/)
        .pop()
        ?.trim()
        .replace(/^type\s+/, '');
      if (nome && /^[A-Za-z_$][\w$]*$/.test(nome)) into.add(nome);
    }
  }
  for (const m of trecho.matchAll(/import\s+([A-Za-z_$][\w$]*)\s+from/g)) into.add(m[1]!);
}

/**
 * O que TODO ramo do módulo itera e o `<script>` do exemplo não declara.
 *
 * POR QUE UMA SEGUNDA PASSAGEM EXISTE. A que executa chama cada construtor UMA
 * vez, com os args padrão — e medido em 2026-09-03, 70 dos 82 módulos desta
 * stack mudam a forma do snippet conforme o argumento. O ramo que os padrões
 * não produzem não tinha portão nenhum. Declarar caso a caso custaria uma
 * entrada por ramo, e cada uma esquecida voltaria a ser silêncio; ler o TEXTO
 * vê todos os ramos de uma vez, ao custo de uma mudança por stack.
 *
 * O que se cobra é o mesmo de sempre: `{#each lista as item}` só resolve se
 * `lista` chegar pelo `<script lang="ts">` que viaja DENTRO do snippet. Uma
 * constante do arquivo de módulo não vale — ela fica para trás quando alguém
 * copia o bloco do painel. Por isso as declarações são colhidas só do texto
 * PUBLICADO: crase (o exemplo escrito por extenso) e aspas (o exemplo montado
 * por lista de linhas, que é como metade dos módulos daqui o escreve).
 *
 * Só a RAIZ da fonte do laço é conferida: em `{#each group.options as option}`
 * quem precisa existir é `group`, e o que vem depois do ponto é do tipo.
 *
 * O QUE ELA NÃO VÊ, e por isso a passagem que EXECUTA continua:
 *
 *  · laço cuja fonte é INTERPOLADA (`{#each ${nome} as x}`): o `${…}` é
 *    apagado antes da varredura, porque ali o nome é do construtor e não do
 *    exemplo. Sai da conta, e o ramo padrão o cobre pela outra passagem;
 *  · nome declarado no ramo ERRADO: publicado no ramo A e iterado no B. As
 *    declarações do módulo entram todas no mesmo saco, então o membro ao menos
 *    EXISTE em algum exemplo — falha mais rara que a que isto passa a pegar;
 *  · qualquer ligação que não seja laço. `{#if}`, `{#await}`, `{@render}` e
 *    atributo (`labels={rotulos}`) ficam de fora de propósito: vários módulos
 *    nomeiam ali, por convenção, a variável de quem consome;
 *  · nome que o próprio componente entrega ao bloco. `{#snippet children({
 *    cells })}` e a variável de `{#each}` são colhidas como locais — sem isso,
 *    `input-otp` e `pagination` eram acusados por `cells` e `pages`.
 */
function loopsSemDeclaracaoNoTexto(bruto: string): string[] {
  const texto = textoPublicado(bruto);

  const declarados = new Set<string>();
  for (const [inicio, fim] of templateRegions(texto)) {
    collectDeclarations(texto.slice(inicio, fim), declarados);
  }
  for (const m of texto.matchAll(/['"][^'"]*/g)) collectDeclarations(m[0]!, declarados);

  // Nomes que a própria marcação introduz. Ignorá-los é o erro que a versão
  // anterior desta checagem cometeu no Angular: 50 ligações corretas acusadas,
  // quase todas variável de laço.
  const locais = new Set<string>();
  for (const m of texto.matchAll(
    /\{#each\s+[^}\n]*?\s+as\s+([A-Za-z_$][\w$]*)(?:\s*,\s*([A-Za-z_$][\w$]*))?/g,
  )) {
    locais.add(m[1]!);
    if (m[2]) locais.add(m[2]);
  }
  for (const m of texto.matchAll(/\{#snippet\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/g)) {
    locais.add(m[1]!);
    for (const parte of m[2]!.replace(/[{}]/g, ' ').split(',')) {
      const nome = parte.trim().split(':').pop()?.trim();
      if (nome && /^[A-Za-z_$][\w$]*$/.test(nome)) locais.add(nome);
    }
  }
  for (const m of texto.matchAll(/\{@const\s+([A-Za-z_$][\w$]*)/g)) locais.add(m[1]!);
  for (const m of texto.matchAll(/\{#await\s+[^}\n]*?\s+then\s+([A-Za-z_$][\w$]*)/g)) {
    locais.add(m[1]!);
  }

  const soltos = new Set<string>();
  for (const m of texto.matchAll(/\{#each\s+([A-Za-z_$][\w$]*)/g)) {
    const nome = m[1]!;
    if (GLOBALS.has(nome) || declarados.has(nome) || locais.has(nome)) continue;
    soltos.add(nome);
  }
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

      // Vale para TODOS os ramos, e não só para o que os args padrão produzem.
      it('nenhum ramo itera lista que o script do exemplo não declara', () => {
        // REPROVA em vez de sair calada. `if (bruto === undefined) return;`
        // pouparia uma linha e carregaria a forma exata do portão que encolhe
        // sozinho: no dia em que os dois globs divergirem, o módulo que só um
        // deles alcança sai da varredura SEM UMA PALAVRA, com a suíte verde
        // medindo menos. Esta casa já pagou isso duas vezes.
        const bruto = fontes[caminho];
        expect(
          bruto,
          `${caminho}: o texto do módulo não chegou à varredura — provavelmente o arquivo saiu do alcance do glob de \`fontes\`, e sem esta falha ele sumiria da medição em silêncio`,
        ).toBeTypeOf('string');
        const soltos = loopsSemDeclaracaoNoTexto(bruto!);
        expect(
          soltos,
          `${caminho}: algum ramo do snippet itera ${soltos.join(', ')}, que nenhum <script> do exemplo declara — quem copiar aquele ramo recebe um laço que não resolve`,
        ).toEqual([]);
      });

      // Esta varredura não filtra por sufixo, então ela não perde teste quando
      // um nome sai da convenção — mas a convenção é cross-stack, e no Vue a
      // varredura FILTRA. Lá, a tradução dos identificadores moveu o sufixo
      // para o meio (`buttonParDeAcoesSource` -> `actionsSourceButtonPair`) e
      // apagou 28 testes com a suíte verde. O nome fica consistente na
      // declaração e em todo uso, então nenhum dos três portões reclama: quem
      // cobra a forma do nome é este check.
      it('todo export é construtor de snippet ou helper declarado', () => {
        const outside = Object.keys(modulo).filter(
          (name) => !/(?:Source|Snippet)$/.test(name) && !HELPERS.has(name),
        );
        expect(
          outside,
          `${caminho}: export fora da convenção — termine em Source/Snippet, ou declare em HELPERS se não constrói snippet`,
        ).toEqual([]);
      });

      for (const [name, fn] of exportadas) {
        it(`${name} devolve um snippet honesto`, () => {
          const saida = fn();
          expect(typeof saida, `${name} deve devolver string sem receber args`).toBe('string');
          const text = saida as string;
          expect(text.trim().length).toBeGreaterThan(0);
          // O andaime da story não é parte do design system.
          expect(text).not.toMatch(SCAFFOLD);
          // Docs de cada stack são consumidas isoladamente.
          expect(text).not.toMatch(OTHER_STACK);
          // `bits-ui` é a lib headless por baixo; o leitor importa do design
          // system, nunca dela.
          expect(text).not.toContain('bits-ui');
          // Sobra de template literal mal fechado.
          expect(text).not.toContain('undefined');
          expect(text).not.toContain('[object Object]');
        });
      }
    });
  }
});
