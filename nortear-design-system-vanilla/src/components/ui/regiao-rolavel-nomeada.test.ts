// Portão da CLASSE: região que rola, alcançável por teclado, e com nome.
//
// A regra 6 da §8 da guideline 17 pede as duas metades juntas — "uma só camada
// rola, e ela tem nome e `tabindex=0`". O design system entregava só a segunda
// em seis componentes, e nenhum portão via a falta: o axe cobra
// `scrollable-region-focusable` quando falta o FOCO, e não cobra nada quando
// falta o NOME. `chat-thread` e `code-block` já fecharam em portões próprios;
// este cobre os seis restantes.
//
// Mede a FONTE das cinco stacks, e não o DOM, porque o projeto unitário roda em
// node e o defeito é de MARCAÇÃO: nasce e morre no arquivo do componente.
//
// O QUE ESTE PORTÃO EXIGE, e por que cada coisa:
//
// 1. papel e nome andam JUNTOS e são CONDICIONAIS ao nome. Nome sem papel é
//    descartado pelo leitor de tela (`aria-prohibited-attr` no axe), e papel sem
//    nome é ruído;
// 2. o papel é `group`, nunca `region`. `region` com nome vira MARCO de página,
//    e todos estes se repetem numa tela — tabela, gráfico, painel, área de
//    rolagem. Marco repetido é o que torna a lista de regiões do leitor inútil;
// 3. nenhum deles cravou nome genérico no componente. "Tabela", "Painel",
//    "Área de rolagem" anunciam o mecanismo sem informar o conteúdo — quem
//    chegou por Tab já sabe que rola; o que não sabe é O QUE rola.
//
// Verificado plantando o defeito: trocado `group` por `region` numa stack, o
// caso do papel reprova nomeando slug e stack; apagada a linha do nome, o caso
// do nome reprova nomeando slug e stack.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const RAIZ = join(process.cwd(), '..');
const VAN = join(process.cwd(), 'src', 'components', 'ui');
const de = (stack: string, ...p: string[]) =>
  join(RAIZ, `nortear-design-system-${stack}`, 'src', 'components', 'ui', ...p);

/**
 * Cada caso é uma região que rola, numa stack.
 *
 * `ancora` é o trecho a partir do qual a janela é medida — medir o arquivo
 * inteiro deixaria passar um `group` posto em OUTRO elemento com a região
 * seguindo anônima, que é justamente o defeito.
 *
 * `nome` é a expressão que liga o nome acessível a uma variável. Ela é por
 * stack porque a SINTAXE diverge (atributo, binding, `setAttribute`) —
 * divergência de API de framework, que a §5.3 manda registrar e não "alinhar".
 */
type Caso = { slug: string; stack: string; arquivo: string; ancora: string; nome: RegExp };

const CASOS: Caso[] = [
  // ── scroll-area: as cinco expõem nome, e as cinco dizem `group` ───────────
  { slug: 'scroll-area', stack: 'vanilla', arquivo: join(VAN, 'scroll-area.ts'),
    ancora: "viewport.className = 'nds-scroll-area-viewport'", nome: /setAttribute\('aria-label', label\)/ },
  { slug: 'scroll-area', stack: 'react', arquivo: de('react', 'scroll-area.tsx'),
    ancora: 'nds-scroll-area-viewport', nome: /aria-label=\{ariaLabel\}/ },
  { slug: 'scroll-area', stack: 'vue', arquivo: de('vue', 'scroll-area', 'ScrollArea.vue'),
    ancora: 'nds-scroll-area-viewport', nome: /:aria-label="props\['aria-label'\]"/ },
  { slug: 'scroll-area', stack: 'svelte', arquivo: de('svelte', 'scroll-area', 'scroll-area.svelte'),
    ancora: 'nds-scroll-area-viewport', nome: /aria-label=\{ariaLabel\}/ },
  { slug: 'scroll-area', stack: 'angular', arquivo: de('angular', 'scroll-area.ts'),
    ancora: 'class="nds-scroll-area-viewport"', nome: /\[attr\.aria-label\]="label\(\) \|\| null"/ },

  // ── table: o nome é do WRAPPER, e por isso tem entrada própria ────────────
  { slug: 'table', stack: 'vanilla', arquivo: join(VAN, 'table.ts'),
    ancora: "wrapper.className = 'nds-table-wrapper'", nome: /setAttribute\('aria-label', regionLabel\)/ },
  { slug: 'table', stack: 'react', arquivo: de('react', 'table.tsx'),
    ancora: 'nds-table-wrapper', nome: /aria-label=\{regionLabel\}/ },
  { slug: 'table', stack: 'vue', arquivo: de('vue', 'table', 'Table.vue'),
    ancora: 'nds-table-wrapper', nome: /:aria-label="props\.regionLabel"/ },
  { slug: 'table', stack: 'svelte', arquivo: de('svelte', 'table', 'table.svelte'),
    ancora: 'nds-table-wrapper', nome: /aria-label=\{regionLabel\}/ },
  { slug: 'table', stack: 'angular', arquivo: de('angular', 'table.ts'),
    ancora: "class: 'nds-table-wrapper'", nome: /'\[attr\.aria-label\]': 'regionLabel\(\) \|\| null'/ },

  // ── chart: aqui o nome JÁ existe — é a descrição do gráfico ───────────────
  { slug: 'chart', stack: 'vanilla', arquivo: join(VAN, 'chart.ts'),
    ancora: "wrapper.dataset.slot = 'chart-data'", nome: /setAttribute\('aria-label', describes\)/ },
  { slug: 'chart', stack: 'react', arquivo: de('react', 'chart.tsx'),
    ancora: 'data-slot="chart-data"', nome: /aria-label=\{showData \? ariaLabel : undefined\}/ },
  { slug: 'chart', stack: 'vue', arquivo: de('vue', 'chart', 'ChartContainer.vue'),
    ancora: ':class="dataClass"', nome: /:aria-label="showData \? accessibleLabel : undefined"/ },
  { slug: 'chart', stack: 'svelte', arquivo: de('svelte', 'chart', 'chart-container.svelte'),
    ancora: 'class={dataClass}', nome: /aria-label=\{showData \? ariaLabel : undefined\}/ },
  { slug: 'chart', stack: 'angular', arquivo: de('angular', 'chart.ts'),
    ancora: '[class.nds-table-wrapper]="showData()"', nome: /\[attr\.aria-label\]="showData\(\) \? label\(\) : null"/ },

  // ── drawer e sheet: o corpo é o próprio elemento que quem monta nomeia ────
  { slug: 'drawer', stack: 'vanilla', arquivo: join(VAN, 'drawer.ts'),
    ancora: "bodyEl.className = 'nds-drawer-body'", nome: /setAttribute\('aria-label', bodyLabel\)/ },
  { slug: 'drawer', stack: 'react', arquivo: de('react', 'drawer.tsx'),
    ancora: 'data-slot="drawer-body"', nome: /aria-label=\{ariaLabel\}/ },
  { slug: 'drawer', stack: 'vue', arquivo: de('vue', 'drawer', 'DrawerBody.vue'),
    ancora: 'data-slot="drawer-body"', nome: /:aria-label="props\['aria-label'\]"/ },
  { slug: 'drawer', stack: 'svelte', arquivo: de('svelte', 'drawer', 'drawer-body.svelte'),
    ancora: 'data-slot="drawer-body"', nome: /aria-label=\{ariaLabel\}/ },
  { slug: 'drawer', stack: 'angular', arquivo: de('angular', 'drawer.ts'),
    ancora: '"drawer-body"', nome: /'\[attr\.aria-label\]': 'ariaLabel\(\) \|\| null'/ },

  { slug: 'sheet', stack: 'vanilla', arquivo: join(VAN, 'sheet.ts'),
    ancora: "bodyEl.className = 'nds-sheet-body'", nome: /setAttribute\('aria-label', bodyLabel\)/ },
  { slug: 'sheet', stack: 'react', arquivo: de('react', 'sheet.tsx'),
    ancora: 'data-slot="sheet-body"', nome: /aria-label=\{ariaLabel\}/ },
  { slug: 'sheet', stack: 'vue', arquivo: de('vue', 'sheet', 'SheetBody.vue'),
    ancora: 'data-slot="sheet-body"', nome: /:aria-label="props\['aria-label'\]"/ },
  { slug: 'sheet', stack: 'svelte', arquivo: de('svelte', 'sheet', 'sheet-body.svelte'),
    ancora: 'data-slot="sheet-body"', nome: /aria-label=\{ariaLabel\}/ },
  { slug: 'sheet', stack: 'angular', arquivo: de('angular', 'sheet.ts'),
    ancora: '"sheet-body"', nome: /'\[attr\.aria-label\]': 'ariaLabel\(\) \|\| null'/ },

  // ── resizable: só as três em que o painel entra na ordem de tabulação ─────
  { slug: 'resizable', stack: 'vanilla', arquivo: join(VAN, 'resizable.ts'),
    ancora: "panelEl.className = 'nds-resizable-panel'", nome: /setAttribute\('aria-label', panelLabel\)/ },
  { slug: 'resizable', stack: 'react', arquivo: de('react', 'resizable.tsx'),
    ancora: 'data-slot="resizable-panel"', nome: /aria-label=\{ariaLabel\}/ },
  { slug: 'resizable', stack: 'angular', arquivo: de('angular', 'resizable.ts'),
    ancora: "class: 'nds-resizable-panel'", nome: /'\[attr\.aria-label\]': 'ariaLabel\(\) \|\| null'/ },
];

/**
 * As combinações que este portão DELIBERADAMENTE não mede, com o motivo.
 *
 * Existe porque a lista de casos é uma lista, e portão que mede COBERTURA a
 * partir de lista exclui em silêncio: quem não entra não é medido, a contagem
 * encolhe, e a suíte segue verde medindo menos. Aqui a exceção é NOMEADA, e o
 * caso abaixo confere a premissa dela — se o painel do Vue ou do Svelte passar
 * a receber `tabindex`, a exceção fica obsoleta e o portão reprova, em vez de
 * continuar calado.
 */
const EXCECOES: Array<{ slug: string; stack: string; motivo: string; premissa: [string, RegExp] }> = [
  {
    slug: 'resizable',
    stack: 'vue',
    motivo: 'o painel não entra na ordem de tabulação nesta stack — sem foco não há parada de teclado a nomear',
    premissa: ['resizable/ResizablePanel.vue', /tabindex/i],
  },
  {
    slug: 'resizable',
    stack: 'svelte',
    motivo: 'idem — o painel não recebe tabindex nesta stack',
    premissa: ['resizable/resizable-pane.svelte', /tabindex/i],
  },
];

const SLUGS = ['scroll-area', 'table', 'chart', 'drawer', 'sheet', 'resizable'];
const STACKS = ['vanilla', 'react', 'vue', 'svelte', 'angular'];

describe('a cobertura do portão é declarada, não implícita', () => {
  it('mede toda combinação slug × stack que não está declarada como exceção', () => {
    const medidos = new Set(CASOS.map((c) => `${c.slug}/${c.stack}`));
    const isentos = new Set(EXCECOES.map((e) => `${e.slug}/${e.stack}`));
    const faltando: string[] = [];
    for (const slug of SLUGS) {
      for (const stack of STACKS) {
        const chave = `${slug}/${stack}`;
        if (!medidos.has(chave) && !isentos.has(chave)) faltando.push(chave);
      }
    }
    expect(faltando, 'combinação sem caso e sem exceção nomeada').toEqual([]);
  });

  it.each(EXCECOES)('a premissa da exceção $slug/$stack continua valendo', (e) => {
    // Exceção cuja premissa caiu é pior que exceção nenhuma: ela declara que
    // não há o que medir num lugar onde passou a haver.
    const [rel, proibido] = e.premissa;
    const fonte = readFileSync(de(e.stack, ...rel.split('/')), 'utf8');
    expect(fonte, `${e.slug}/${e.stack}: ${e.motivo} — mas a premissa caiu`).not.toMatch(proibido);
  });
});

/** Janela a partir da âncora: cobre a declaração do elemento em todas as cinco. */
const JANELA = 900;

function regiao(c: Caso): string {
  const fonte = readFileSync(c.arquivo, 'utf8');
  const i = fonte.indexOf(c.ancora);
  if (i === -1) return '';
  // Recua um pouco: em algumas stacks o papel é declarado ANTES da âncora
  // (bloco `host` do Angular, atributos acima da classe).
  return fonte.slice(Math.max(0, i - 400), i + JANELA);
}

describe('região que rola tem papel e nome, na classe inteira', () => {
  it.each(CASOS)('$slug/$stack declara a região', (c) => {
    expect(regiao(c), `${c.slug}/${c.stack}: âncora "${c.ancora}" sumiu`).not.toBe('');
  });

  // O papel tem de estar ATRIBUÍDO, e não só mencionado. A primeira versão
  // deste portão casava a palavra solta e reprovou num COMENTÁRIO que explicava
  // por que `region` foi recusado — portão que lê prosa mede a prosa. As duas
  // expressões abaixo exigem a palavra `role` na mesma linha do valor, que é o
  // que todas as cinco sintaxes têm em comum (`setAttribute('role', …)`,
  // `role={…}`, `:role="…"`, `'[attr.role]': '…'`, `[attr.role]="…"`).
  const papel = (valor: string) => new RegExp(`role[^\n]{0,80}["']${valor}["']`);

  it.each(CASOS)('$slug/$stack dá papel de GRUPO à região', (c) => {
    expect(regiao(c), `${c.slug}/${c.stack}`).toMatch(papel('group'));
  });

  it.each(CASOS)('$slug/$stack NÃO usa papel de marco', (c) => {
    // `region` com nome vira landmark, e todos estes se repetem numa tela.
    expect(regiao(c), `${c.slug}/${c.stack}`).not.toMatch(papel('region'));
  });

  it.each(CASOS)('$slug/$stack nomeia a região por variável', (c) => {
    expect(regiao(c), `${c.slug}/${c.stack}`).toMatch(c.nome);
  });

  it.each(CASOS)('$slug/$stack não cravou nome genérico', (c) => {
    // Nome que descreve o mecanismo em vez do conteúdo.
    expect(regiao(c), `${c.slug}/${c.stack}`).not.toMatch(
      /aria-label[^\n]*["'](Tabela|Painel|Gráfico|Conteúdo|Área de rolagem|Região de rolagem)["']/,
    );
  });
});
