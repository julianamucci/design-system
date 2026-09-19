import { describe, expect, it } from 'vitest';
import * as dropdownMenuSourceModule from './dropdown-menu.source';
import {
  dropdownMenuCheckboxIndeterminateSource,
  dropdownMenuClosedSource,
  dropdownMenuControlledSource,
  dropdownMenuDefaultSource,
  dropdownMenuDestructiveSource,
  dropdownMenuItemDisabledSource,
  dropdownMenuOpenSource,
  dropdownMenuPlaygroundSource,
  dropdownMenuSnippet,
  dropdownMenuTabAtPageEndSource,
  dropdownMenuTabLeavesMenuSource,
  dropdownMenuWithCheckboxSource,
  dropdownMenuWithLabelSource,
  dropdownMenuWithRadioSource,
  dropdownMenuWithShortcutsSource,
  dropdownMenuWithSubmenuSource,
} from './dropdown-menu.source';

/**
 * A ausência deste arquivo era o `source_sem_teste` do auditor.
 *
 * O painel Code imprime o `template` da story literalmente — com os bindings
 * ligados aos args e às props que o renderer monta — e essa saída NÃO chega ao
 * DOM durante a `play`: nenhuma suíte de navegador a alcança. O `transform`
 * devolve o uso real, e é aqui que ele tem guarda.
 *
 * A lição que motiva o arquivo veio do Tooltip: lá, quando as stories foram
 * alinhadas e os construtores não, o gatilho do Playground passou a renderizar
 * `outline` enquanto o snippet ao lado ensinava `ghost`, e nenhum portão viu.
 */

/**
 * As props que as stories injetam no objeto do renderer.
 *
 * Escritas como STRING, e não direto num literal de expressão regular: o portão
 * `identificador_pt_novo` descasca comentário e literal de texto antes de
 * contar, mas não descasca regex.
 */
const STORY_PROPS = ['onSelect', 'onOpenChange', 'isOpen', 'name', 'email', 'theme'];

/** O espião da `play` ligado ao item — andaime, nunca lição do menu. */
const STORY_SPY = new RegExp(`\\((?:${STORY_PROPS.join('|')})\\)="`);

// ─── O TEXTO das stories ─────────────────────────────────────────────────────
//
// Lido, e não importado: importar um arquivo de story fora do compilador Angular
// quebra, e a pergunta aqui não precisa de execução — é sobre o que o arquivo
// ESCREVE. Mesma leitura por `?raw` do `popover.source.test.ts`, que fechou esta
// forma em 2026-09-17.

const storySources = import.meta.glob<string>('./dropdown-menu*.stories.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const STORY_START = /^export const (\w+): Story = \{/gm;

/** Story que ainda publica o template cru — dívida declarada, não silêncio. */
const SEM_TRANSFORM = '(nenhum)';

/** O bloco de texto de uma story, do `export const` até o próximo. */
function storyBlock(source: string, name: string): string {
  const marks = [...source.matchAll(STORY_START)];
  const i = marks.findIndex((m) => m[1] === name);
  if (i === -1) return '';
  const end = i + 1 < marks.length ? marks[i + 1]!.index! : source.length;
  return source.slice(marks[i]!.index!, end);
}

/** O `template` que a story renderiza, como ela o escreve. */
function storyTemplate(file: string, name: string): string {
  const block = storyBlock(storySources[file] ?? '', name);
  return /template:\s*`([\s\S]*?)`/.exec(block)?.[1] ?? '';
}

/**
 * A transform que cada story publica no painel — a dela, ou a que o `meta`
 * declarou para o arquivo inteiro.
 */
function transformsByStory(source: string): Map<string, string> {
  const marks = [...source.matchAll(STORY_START)];
  const header = marks.length ? source.slice(0, marks[0]!.index) : source;
  const fromMeta = /transform:\s*(\w+)/.exec(header)?.[1] ?? SEM_TRANSFORM;

  const out = new Map<string, string>();
  marks.forEach((m, i) => {
    const end = i + 1 < marks.length ? marks[i + 1]!.index! : source.length;
    const block = source.slice(m.index!, end);
    out.set(m[1]!, /transform:\s*(\w+)/.exec(block)?.[1] ?? fromMeta);
  });
  return out;
}

/** Markup comparável: sem comentário de template e sem espaço em branco à toa. */
function normalize(markup: string): string {
  return markup
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .replace(/> </g, '><')
    .trim();
}

/** O `template` que um snippet ensina, tirado o invólucro do `@Component`. */
function snippetTemplate(code: string): string {
  return /template: `([\s\S]*?)`,/.exec(code)?.[1] ?? '';
}

// ─── Playground ───────────────────────────────────────────────────────────────

describe('dropdownMenuPlaygroundSource', () => {
  it('devolve o componente que se escreve, e não o template da story', () => {
    const code = dropdownMenuPlaygroundSource();
    expect(code).toContain("import { NDS_DROPDOWN_MENU } from '@/components/ui/dropdown-menu';");
    expect(code).toContain("import { NdsButton } from '@/components/ui/button';");
    expect(code).toContain('imports: [...NDS_DROPDOWN_MENU, NdsButton],');
    expect(code).toContain('<nds-dropdown-menu>');
    expect(code).toContain('<ng-template ndsDropdownMenuContent>');
    // O que só existe dentro da story: os bindings para os args e o espião de
    // output que a `play` consulta.
    expect(code).not.toContain('args.');
    expect(code).not.toContain('[side]="side"');
    expect(code).not.toContain('[align]="align"');
    expect(code).not.toContain('(openChange)="onOpenChange($event)"');
    expect(code).not.toMatch(STORY_SPY);
  });

  it('omite lado, alinhamento, modalidade e abertura quando são os padrões', () => {
    // Repetir valor padrão ensina ruído: quem copia passa a declarar o que já
    // vem de graça, e some a informação de que existe um padrão.
    //
    // As asserções olham a TAG inteira, e não a substring `align=`: um
    // `not.toContain('align=')` casaria no `data-align` que o posicionador
    // escreve, e reprovaria por defeito da asserção.
    const code = dropdownMenuPlaygroundSource('', {
      args: { side: 'bottom', align: 'start', modal: true, defaultOpen: false },
    });
    expect(code).toContain('<nds-dropdown-menu>');
    expect(code).toContain('<ng-template ndsDropdownMenuContent>');
  });

  it('imprime o que difere do padrão, com o valor vindo dos controls', () => {
    const code = dropdownMenuPlaygroundSource('', {
      args: { side: 'top', align: 'end', modal: false, defaultOpen: true },
    });
    // A raiz carrega abertura e modalidade; o CONTEÚDO carrega lado e
    // alinhamento. Trocar de lugar é o erro mais fácil de cometer aqui, porque
    // "abre para cima" soa como coisa da raiz.
    expect(code).toContain('<nds-dropdown-menu [defaultOpen]="true" [modal]="false">');
    expect(code).toContain('<ng-template ndsDropdownMenuContent side="top" align="end">');
  });

  it('lado e alinhamento nunca migram para a raiz', () => {
    const code = dropdownMenuPlaygroundSource('', { args: { side: 'left', align: 'center' } });
    expect(code).not.toMatch(/<nds-dropdown-menu[^>]*\sside=/);
    expect(code).not.toMatch(/<nds-dropdown-menu[^>]*\salign=/);
  });

  it('publica a forma canônica: grupo nomeado, ações e a saída destrutiva por último', () => {
    // A story ao lado envolve os itens em `ndsDropdownMenuGroup` — o snippet
    // não envolvia, e o painel Code ensinava um menu sem grupo nenhum ao lado
    // de um preview que tinha um.
    const code = dropdownMenuPlaygroundSource();
    expect(code).toContain('<div ndsDropdownMenuGroup>');
    expect(code).toContain('<div ndsDropdownMenuLabel>Conta</div>');
    expect(code).toContain('<div ndsDropdownMenuSeparator></div>');
    // Destrutiva por último e depois do separador: a ação que não se desfaz não
    // fica ao alcance de um clique distraído.
    const destructive = code.indexOf('<div ndsDropdownMenuItem variant="destructive">Sair</div>');
    expect(destructive).toBeGreaterThan(code.indexOf('<div ndsDropdownMenuSeparator></div>'));
    // TRÊS itens, como a `play` do Playground afirma.
    expect(code.match(/<div ndsDropdownMenuItem[ >]/g)).toHaveLength(3);
  });
});

// ─── Cobertura das quatro stories ─────────────────────────────────────────────

const ROOT = './dropdown-menu.stories.ts';
const VARIANTS = './dropdown-menu-variants.stories.ts';
const STATES = './dropdown-menu-states.stories.ts';
const COMPOSITIONS = './dropdown-menu-compositions.stories.ts';

/**
 * Os quinze construtores e a story que cada um serve.
 *
 * A lista existe para ser COBRADA nos DOIS sentidos: um caso a compara com o que
 * o módulo exporta, e outro com o que os quatro arquivos de story publicam no
 * painel. Construtor novo que não entre aqui reprova, e story nova sem
 * `transform` também — em vez de saírem calados da varredura, que é como o
 * `source-snippets.test.ts` do Vue perdeu 28 exports e seguiu verde medindo
 * menos.
 *
 * NENHUMA das quinze stories fica sem construtor próprio, e não há exclusão a
 * declarar. As duas variantes chegaram perto de compartilhar um — o markup é
 * quase o mesmo —, mas o painel Code é por story: um construtor comum
 * publicaria "Excluir conta" embaixo do menu que só tem ações neutras. As duas
 * de Tab quase reaproveitaram `dropdownMenuClosedSource`, que monta o mesmo
 * menu; o que as separa é a FILEIRA de pontos de tabulação, que ali é o assunto.
 */
const CONSTRUCTORS: Array<{
  name: string;
  file: string;
  story: string;
  build: () => string;
  /** O único snippet com estado externo: raiz ligada a um sinal de fora. */
  controlled?: true;
  /** O único snippet que publica `defaultOpen` — ali estar aberto É o assunto. */
  bornOpen?: true;
  /** Os dois snippets que publicam a fileira com vizinhos de tabulação. */
  neighbors?: 'both' | 'before';
}> = [
  { name: 'dropdownMenuPlaygroundSource', file: ROOT, story: 'Playground', build: dropdownMenuPlaygroundSource },
  {
    name: 'dropdownMenuTabLeavesMenuSource',
    file: ROOT,
    story: 'TabLeavesMenu',
    build: dropdownMenuTabLeavesMenuSource,
    neighbors: 'both',
  },
  {
    name: 'dropdownMenuTabAtPageEndSource',
    file: ROOT,
    story: 'TabAtPageEnd',
    build: dropdownMenuTabAtPageEndSource,
    neighbors: 'before',
  },
  { name: 'dropdownMenuDefaultSource', file: VARIANTS, story: 'Default', build: dropdownMenuDefaultSource },
  {
    name: 'dropdownMenuDestructiveSource',
    file: VARIANTS,
    story: 'Destructive',
    build: dropdownMenuDestructiveSource,
  },
  { name: 'dropdownMenuClosedSource', file: STATES, story: 'Closed', build: dropdownMenuClosedSource },
  {
    name: 'dropdownMenuOpenSource',
    file: STATES,
    story: 'Open',
    build: dropdownMenuOpenSource,
    bornOpen: true,
  },
  {
    name: 'dropdownMenuControlledSource',
    file: STATES,
    story: 'Controlled',
    build: dropdownMenuControlledSource,
    controlled: true,
  },
  {
    name: 'dropdownMenuItemDisabledSource',
    file: STATES,
    story: 'ItemDisabled',
    build: dropdownMenuItemDisabledSource,
  },
  {
    name: 'dropdownMenuCheckboxIndeterminateSource',
    file: STATES,
    story: 'CheckboxIndeterminate',
    build: dropdownMenuCheckboxIndeterminateSource,
  },
  {
    name: 'dropdownMenuWithLabelSource',
    file: COMPOSITIONS,
    story: 'WithLabel',
    build: dropdownMenuWithLabelSource,
  },
  {
    name: 'dropdownMenuWithCheckboxSource',
    file: COMPOSITIONS,
    story: 'WithCheckboxItems',
    build: dropdownMenuWithCheckboxSource,
  },
  {
    name: 'dropdownMenuWithRadioSource',
    file: COMPOSITIONS,
    story: 'WithRadioGroup',
    build: dropdownMenuWithRadioSource,
  },
  {
    name: 'dropdownMenuWithSubmenuSource',
    file: COMPOSITIONS,
    story: 'WithSubmenu',
    build: dropdownMenuWithSubmenuSource,
  },
  {
    name: 'dropdownMenuWithShortcutsSource',
    file: COMPOSITIONS,
    story: 'WithShortcuts',
    build: dropdownMenuWithShortcutsSource,
  },
];

/**
 * Construtores que NÃO servem a uma story — a exclusão, declarada e com
 * premissa conferida abaixo.
 *
 * `dropdownMenuSnippet` monta o menu a partir de uma LISTA DE ENTRADAS, e quem
 * o chama é a docs page: cada ficha de Variantes imprime a prévia viva e o
 * código a partir da mesma lista. Não há story para ele porque o assunto dele é
 * o dado, não uma cena. Antes de 2026-09-18 ele morava dentro de
 * `DropdownMenuDocs.ts`, onde nada podia importá-lo e nada o testava
 * (inconsistência 22 da §7 do PRD).
 *
 * A PREMISSA da exclusão é medida no bloco `dropdownMenuSnippet` mais abaixo:
 * ele não pertence a nenhum dos quatro arquivos de story, e a tabela de
 * cobertura das stories continua fechada nos dois sentidos sem ele.
 */
const SEM_STORY = ['dropdownMenuSnippet'];

describe('cobertura das quatro stories', () => {
  it('todo construtor exportado pelo módulo entra na varredura', () => {
    const exported = Object.entries(dropdownMenuSourceModule)
      .filter(([, value]) => typeof value === 'function')
      .map(([name]) => name)
      .sort();
    expect(exported).toEqual([...CONSTRUCTORS.map((c) => c.name), ...SEM_STORY].sort());
  });

  it('a exceção declarada não é usada por story nenhuma', () => {
    // A premissa da exclusão: se um dia uma story passar a publicar
    // `dropdownMenuSnippet` no painel, ela precisa entrar na tabela como as
    // outras — e é aqui que isso reprova, em vez de o construtor sair da
    // varredura em silêncio.
    const usadas = new Set<string>();
    for (const source of Object.values(storySources)) {
      for (const transform of transformsByStory(source).values()) usadas.add(transform);
    }
    for (const name of SEM_STORY) expect(usadas.has(name), `${name} virou transform de story`).toBe(false);
  });

  it('os quatro arquivos de story chegaram à varredura', () => {
    // Sem esta linha, um glob que deixasse de casar apagaria o caso abaixo em
    // silêncio — e uma suíte verde medindo zero é pior que vermelha.
    expect(Object.keys(storySources).sort()).toEqual([COMPOSITIONS, STATES, VARIANTS, ROOT].sort());
  });

  it('toda story publica o construtor que esta tabela declara', () => {
    // O outro sentido da tabela: story sem `transform` (que publicaria o
    // template cru, e é a regra `story_file_sem_transform` do audit) e story que
    // herdou o transform do `meta` sem ninguém decidir isso caem aqui.
    const declared = new Map<string, string>();
    for (const { name, file, story } of CONSTRUCTORS) declared.set(`${file}#${story}`, name);

    const actual = new Map<string, string>();
    for (const [file, source] of Object.entries(storySources)) {
      for (const [story, transform] of transformsByStory(source)) {
        actual.set(`${file}#${story}`, transform);
      }
    }

    expect(Object.fromEntries([...actual].sort())).toEqual(
      Object.fromEntries([...declared].sort()),
    );
  });

  for (const { name, file, story, build, controlled, bornOpen, neighbors } of CONSTRUCTORS) {
    it(`${name} (${file}#${story}) publica o componente, não o andaime da story`, () => {
      const code = build();

      expect(code).not.toContain('args.');
      expect(code).not.toMatch(STORY_SPY);
      // O primitivo escreve os `data-slot` em runtime, e no Angular o host
      // binding da diretiva apaga um atributo estático do template: nomear peça
      // por `data-slot` no snippet ensinaria algo que não funciona.
      expect(code).not.toContain('data-slot=');
      // Andaime de captura da story, não do componente.
      expect(code).not.toContain('contain: layout');
      expect(code).not.toContain('min-height');

      // Um menu de raiz por snippet, e sempre fechado no fim. `-sub` não entra
      // na contagem: o caractere depois de `menu` é `-`, e não espaço nem `>`.
      expect(code.match(/<nds-dropdown-menu[ >]/g)).toHaveLength(1);
      expect(code.match(/<\/nds-dropdown-menu>/g)).toHaveLength(1);

      // O gatilho é o PRÓPRIO botão do design system: a diretiva mora no mesmo
      // elemento. Um `<button>` dentro de outro é violação de ARIA e quebra o
      // teclado — e é daqui que saem `aria-haspopup` e `aria-expanded`.
      expect(code.match(/<button ndsDropdownMenuTrigger ndsButton variant="outline">[^<]+<\/button>/g)).toHaveLength(1);
      expect(code).toContain('<ng-template ndsDropdownMenuContent');

      // Os dois imports que todo snippet ensina, e o `imports` do componente.
      expect(code).toContain("import { NDS_DROPDOWN_MENU } from '@/components/ui/dropdown-menu';");
      expect(code).toContain("import { NdsButton } from '@/components/ui/button';");
      expect(code).toContain('imports: [...NDS_DROPDOWN_MENU, NdsButton],');

      // `[modal]="false"` é andaime do quadro — ele destrava o canvas por trás
      // do popup, e não é lição de nada. Nenhum snippet o publica com os args
      // no padrão.
      expect(code).not.toContain('[modal]');

      // `[defaultOpen]="true"` só na story cujo assunto É estar aberto. Menu
      // que se abre sozinho ao carregar a página é o oposto do que se copia.
      if (bornOpen) {
        expect(code).toContain('<nds-dropdown-menu [defaultOpen]="true">');
      } else {
        expect(code).not.toContain('[defaultOpen]');
      }

      // Estado externo é de um snippet só; nos demais a raiz não recebe valor
      // de fora, e escrever um par `open`/`openChange` ali pediria um estado
      // que a story não tem.
      if (controlled) {
        expect(code).toContain('[open]="isOpen()" (openChange)="isOpen.set($event)"');
        expect(code).toContain('  readonly isOpen = signal(false);');
      } else {
        expect(code).not.toContain('[open]=');
        expect(code).not.toContain('(openChange)');
      }

      // A fileira de pontos de tabulação é de DOIS snippets, e neles é o
      // assunto. Nos demais, um vizinho ali seria cenário emprestado: quem copia
      // passaria a achar que o menu pede um botão ao lado para funcionar.
      if (neighbors) {
        expect(code).toContain('<div class="nds-cluster" data-spacing="md">');
        expect(code).toContain('<button ndsButton variant="ghost">Antes</button>');
        // `both` é a story que tem para onde mandar o foco; `before` é a que não
        // tem, e é a ausência do vizinho depois que a torna a última parada.
        if (neighbors === 'both') {
          expect(code).toContain('<button ndsButton variant="ghost">Depois</button>');
        } else {
          expect(code).not.toContain('Depois');
        }
      } else {
        // A fileira em si não é exclusiva — `States/Controlled` também usa uma,
        // para pôr o botão de estado ao lado do menu. O que os outros snippets
        // não podem ter é o VIZINHO de tabulação.
        expect(code).not.toContain('variant="ghost"');
        expect(code).not.toContain('>Antes</button>');
        expect(code).not.toContain('>Depois</button>');
      }
    });
  }
});

// ─── Tab sai do menu ──────────────────────────────────────────────────────────

describe('Tab sai do menu', () => {
  // As duas stories do arquivo-raiz não têm andaime nenhum a recortar — nem
  // espião, nem binding de arg, nem invólucro de medição —, e por isso o que o
  // snippet publica é o template INTEIRO da story. Isso deixa cobrar a forma
  // forte: igualdade. Se o template da story mudar de forma, é aqui que reprova,
  // em vez de o painel Code ensinar um menu que o preview ao lado não mostra.
  const TAB_STORIES: Array<{ name: string; story: string; build: () => string }> = [
    { name: 'dropdownMenuTabLeavesMenuSource', story: 'TabLeavesMenu', build: dropdownMenuTabLeavesMenuSource },
    { name: 'dropdownMenuTabAtPageEndSource', story: 'TabAtPageEnd', build: dropdownMenuTabAtPageEndSource },
  ];

  for (const { name, story, build } of TAB_STORIES) {
    it(`${name} publica o MESMO markup que ${story} renderiza`, () => {
      const rendered = storyTemplate(ROOT, story);
      // Sem esta linha, um `template:` que deixasse de casar compararia string
      // vazia com string vazia e o caso passaria medindo nada.
      expect(rendered, `${ROOT}#${story}`).toContain('nds-dropdown-menu');
      expect(normalize(snippetTemplate(build())), `${name} divergiu de ${story}`).toBe(
        normalize(rendered),
      );
    });
  }

  it('TabLeavesMenu ensina o submenu, e TabAtPageEnd não — é o que separa as duas', () => {
    // A premissa de haver DOIS construtores em vez de um. O segundo nível existe
    // na primeira porque o Tab de dentro dele fecha o menu INTEIRO; a segunda
    // mostra o gatilho como última parada, e um submenu ali só encheria a cena.
    const leaves = dropdownMenuTabLeavesMenuSource();
    const atEnd = dropdownMenuTabAtPageEndSource();
    expect(leaves).toContain('<nds-dropdown-menu-sub>');
    expect(leaves).toContain('<div ndsDropdownMenuSubTrigger>Exportar</div>');
    expect(leaves).toContain('<ng-template ndsDropdownMenuSubContent>');
    expect(atEnd).not.toContain('nds-dropdown-menu-sub');
    // E os dois itens do menu raiz são os mesmos nas duas, como nas stories.
    for (const code of [leaves, atEnd]) {
      expect(code).toContain('<div ndsDropdownMenuItem>Perfil</div>');
      expect(code).toContain('<div ndsDropdownMenuItem>Configurações</div>');
      expect(code).toContain('<button ndsDropdownMenuTrigger ndsButton variant="outline">Abrir menu</button>');
    }
  });
});

// ─── Variantes ────────────────────────────────────────────────────────────────

describe('variantes: as duas ênfases de item', () => {
  it('o item neutro não escreve a variante — default é o padrão da diretiva', () => {
    const code = dropdownMenuDefaultSource();
    expect(code).not.toContain('variant="default"');
    expect(code).toContain('<button ndsDropdownMenuTrigger ndsButton variant="outline">Conta</button>');
    // TRÊS itens, como a `play` da story afirma.
    expect(code.match(/<div ndsDropdownMenuItem>/g)).toHaveLength(3);
    for (const label of ['Perfil', 'Configurações', 'Equipe']) {
      expect(code).toContain(`<div ndsDropdownMenuItem>${label}</div>`);
    }
  });

  it('o item destrutivo vem por ÚLTIMO e separado das ações neutras', () => {
    // A ordem é a lição: a ação que não se desfaz não fica ao alcance de um
    // clique distraído. O separador é o que a afasta.
    const code = dropdownMenuDestructiveSource();
    expect(code).toContain('<div ndsDropdownMenuItem>Perfil</div>');
    expect(code).toContain('<div ndsDropdownMenuSeparator></div>');
    expect(code).toContain('<div ndsDropdownMenuItem variant="destructive">Excluir conta</div>');
    expect(code.indexOf('variant="destructive"')).toBeGreaterThan(
      code.indexOf('<div ndsDropdownMenuSeparator></div>'),
    );
    // Uma só: a variante marca a exceção, e um menu inteiro de itens de perigo
    // não marcaria nada.
    expect(code.match(/variant="destructive"/g)).toHaveLength(1);
  });
});

// ─── Estados ──────────────────────────────────────────────────────────────────

describe('estados', () => {
  it('dropdownMenuClosedSource não pede abertura nenhuma — fechado é o que o componente faz sozinho', () => {
    // A ausência é o assunto: o portal desmonta o popup, e fechado não é
    // "escondido com display:none". Não há prop nenhuma a escrever.
    const code = dropdownMenuClosedSource();
    expect(code).toContain('<nds-dropdown-menu>');
    expect(code).not.toContain('[defaultOpen]');
    expect(code).not.toContain('[open]');
    expect(code.match(/<div ndsDropdownMenuItem>/g)).toHaveLength(2);
  });

  it('dropdownMenuOpenSource abre por defaultOpen, e não liga prop nenhuma para o teclado', () => {
    // Setas, Home, End e o salto por letra vêm do primitivo: escrever uma prop
    // para eles ensinaria API que não existe.
    const code = dropdownMenuOpenSource();
    expect(code).toContain('<nds-dropdown-menu [defaultOpen]="true">');
    expect(code).not.toContain('[open]');
    expect(code).not.toContain('loopFocus');
    // TRÊS itens: a `play` da story usa o terceiro para provar End e o salto
    // por letra.
    expect(code.match(/<div ndsDropdownMenuItem>/g)).toHaveLength(3);
  });

  it('dropdownMenuControlledSource liga as DUAS pontas do estado, e guarda o valor num sinal', () => {
    // Ligar só `open` é o defeito clássico: o menu fecha na tela pelo Escape ou
    // pelo clique fora, o valor de fora continua `true`, e ele reabre no ciclo
    // seguinte de detecção. O sinal é o que agenda o redesenho — a story
    // renderiza um campo comum porque o renderer monta um objeto de props, e
    // ali o snippet está certo e a story não é componente.
    const code = dropdownMenuControlledSource();
    expect(code).toContain(
      '<nds-dropdown-menu [open]="isOpen()" (openChange)="isOpen.set($event)">',
    );
    expect(code).toContain('  readonly isOpen = signal(false);');
    expect(code).toContain(
      '<button ndsButton variant="secondary" (click)="isOpen.set(!isOpen())">',
    );
    // Estado externo e `defaultOpen` no mesmo menu se contradizem.
    expect(code).not.toContain('[defaultOpen]');
    // O gatilho do menu CONTINUA ali: o que muda é a raiz seguir um valor de
    // fora, não o menu perder o botão que o abre.
    expect(code).toContain(
      '<button ndsDropdownMenuTrigger ndsButton variant="outline">Ações</button>',
    );
  });

  it('dropdownMenuItemDisabledSource escreve o bloqueio na PROP, e não em cada consumidor', () => {
    // O item indisponível continua no menu e é alcançável pela seta, para ser
    // anunciado; o que ele não pode é executar. As duas coisas vêm da prop.
    const code = dropdownMenuItemDisabledSource();
    expect(code).toContain('<div ndsDropdownMenuItem>Duplicar</div>');
    expect(code).toContain('<div ndsDropdownMenuItem disabled>Arquivar</div>');
    // Nada de `pointer-events` escrito à mão: quem o aplica é a folha do item.
    expect(code).not.toContain('pointer-events');
  });

  it('dropdownMenuCheckboxIndeterminateSource escreve os TRÊS estados por extenso', () => {
    // O assunto é o CONTRASTE entre eles — misto desenha traço, marcado desenha
    // tique, desmarcado não desenha nada. Omitir o desmarcado apagaria metade
    // da lição.
    const code = dropdownMenuCheckboxIndeterminateSource();
    expect(code).toContain(
      `<div ndsDropdownMenuCheckboxItem [checked]="'indeterminate'">Nome</div>`,
    );
    expect(code).toContain('<div ndsDropdownMenuCheckboxItem [checked]="true">E-mail</div>');
    expect(code).toContain('<div ndsDropdownMenuCheckboxItem [checked]="false">Telefone</div>');
    expect(code.match(/ndsDropdownMenuCheckboxItem/g)).toHaveLength(3);
    // Valor FIXO, e não ligado: um par com `checkedChange` aqui pediria um
    // estado que a story não tem, e o primeiro clique num item misto o resolve
    // para marcado — que é outro assunto.
    expect(code).not.toContain('(checkedChange)');
    expect(code).toContain('<div ndsDropdownMenuLabel>Colunas visíveis</div>');
  });
});

// ─── Composições ──────────────────────────────────────────────────────────────

describe('composições', () => {
  it('dropdownMenuWithLabelSource nomeia cada grupo pelo próprio rótulo', () => {
    // É o que o rótulo entrega além do texto: sem ele o leitor anuncia "grupo"
    // e a pessoa não sabe de qual bloco se trata.
    const code = dropdownMenuWithLabelSource();
    expect(code.match(/<div ndsDropdownMenuGroup>/g)).toHaveLength(2);
    expect(code).toContain('<div ndsDropdownMenuLabel>Conta</div>');
    expect(code).toContain('<div ndsDropdownMenuLabel>Suporte</div>');
    // UM separador entre os dois grupos, e QUATRO itens — os mesmos números que
    // a `play` da story afirma.
    expect(code.match(/<div ndsDropdownMenuSeparator><\/div>/g)).toHaveLength(1);
    expect(code.match(/<div ndsDropdownMenuItem>/g)).toHaveLength(4);
    // O rótulo NÃO é item de menu: escrevê-lo como item o poria no percurso da
    // seta e no resultado do salto por letra.
    expect(code).not.toContain('<div ndsDropdownMenuItem>Conta</div>');
  });

  it('dropdownMenuWithCheckboxSource dá a cada item o próprio estado, num sinal', () => {
    // Independentes entre si — é o que separa a marcação da escolha única. A
    // story liga `[checked]` a campos do objeto de props do renderer, que não
    // existem em componente nenhum.
    const code = dropdownMenuWithCheckboxSource();
    expect(code).toContain('[checked]="showName()"');
    expect(code).toContain('(checkedChange)="showName.set($event)"');
    expect(code).toContain('[checked]="showEmail()"');
    expect(code).toContain('(checkedChange)="showEmail.set($event)"');
    expect(code).toContain('[checked]="showRole()"');
    expect(code).toContain('(checkedChange)="showRole.set($event)"');
    expect(code).toContain('  readonly showName = signal(true);');
    expect(code).toContain('  readonly showEmail = signal(false);');
    expect(code).toContain('  readonly showRole = signal(false);');
    // TRÊS alternadores, como a story ao lado.
    expect(code.match(/ndsDropdownMenuCheckboxItem/g)).toHaveLength(3);
    // Sem valor comum: um `ndsDropdownMenuRadioGroup` aqui faria a marcação de
    // um item desmarcar a do outro.
    expect(code).not.toContain('ndsDropdownMenuRadioGroup');
  });

  it('dropdownMenuWithRadioSource põe o valor no GRUPO, e o value em cada opção', () => {
    // É o que separa a escolha única da marcação: escolher um item desmarca o
    // anterior sem que ninguém escreva essa regra.
    const code = dropdownMenuWithRadioSource();
    expect(code).toContain(
      '<div ndsDropdownMenuRadioGroup [value]="theme()" (valueChange)="theme.set($event)">',
    );
    expect(code).toContain(`  readonly theme = signal('light');`);
    // TRÊS opções, como a `play` da story afirma, e cada uma só com o `value`
    // que representa — o estado marcado não se escreve no item.
    expect(code.match(/<div ndsDropdownMenuRadioItem value="/g)).toHaveLength(3);
    expect(code).toContain('<div ndsDropdownMenuRadioItem value="light">Claro</div>');
    expect(code).toContain('<div ndsDropdownMenuRadioItem value="dark">Escuro</div>');
    expect(code).toContain('<div ndsDropdownMenuRadioItem value="system">Sistema</div>');
    expect(code).not.toContain('[checked]');
  });

  it('dropdownMenuWithSubmenuSource publica a tríade do segundo nível', () => {
    // `<nds-dropdown-menu-sub>` guarda o estado, o sub-gatilho é o item que
    // abre, e o `ndsDropdownMenuSubContent` é o painel filho. O chevron,
    // `aria-haspopup`, `aria-expanded` e — porque o painel é portalado — o
    // `aria-owns` que aponta para ele entram pelo componente: nada disso pede
    // prop, e escrever uma ensinaria API que não existe.
    const code = dropdownMenuWithSubmenuSource();
    expect(code).toContain('<nds-dropdown-menu-sub>');
    expect(code).toContain('</nds-dropdown-menu-sub>');
    expect(code).toContain('<div ndsDropdownMenuSubTrigger>Exportar</div>');
    expect(code).toContain('<ng-template ndsDropdownMenuSubContent>');
    expect(code).not.toContain('aria-haspopup');
    expect(code).not.toContain('aria-expanded');
    expect(code).not.toContain('aria-owns');
    // DOIS itens no submenu, como a `play` da story afirma, mais o item do menu
    // pai que fica de fora dele.
    expect(code).toContain('<div ndsDropdownMenuItem>Renomear</div>');
    expect(code).toContain('<div ndsDropdownMenuItem>PDF</div>');
    expect(code).toContain('<div ndsDropdownMenuItem>CSV</div>');
  });

  it('dropdownMenuWithShortcutsSource põe o atalho DENTRO do item, e sem aria-hidden', () => {
    // É assim que ele entra no nome acessível ("Copiar Ctrl+C"). Escondido, a
    // pessoa ouviria só "Copiar" e nunca saberia que existe uma tecla.
    const code = dropdownMenuWithShortcutsSource();
    expect(code).not.toContain('aria-hidden');
    for (const key of ['Ctrl+Z', 'Ctrl+C', 'Ctrl+V']) {
      expect(code).toContain(`<span ndsDropdownMenuShortcut>${key}</span>`);
    }
    // Cada atalho dentro do seu item: fora dele, o leitor de tela leria o texto
    // como um irmão solto e o nome do item ficaria sem a tecla.
    const items = [...code.matchAll(/<div ndsDropdownMenuItem>\n([\s\S]*?)\n\s*<\/div>/g)];
    expect(items).toHaveLength(3);
    for (const item of items) {
      expect(item[1]).toContain('<span ndsDropdownMenuShortcut>');
    }
    // O separador que a story ao lado desenha antes de "Colar".
    expect(code.match(/<div ndsDropdownMenuSeparator><\/div>/g)).toHaveLength(1);
  });
});

// ─── O menu como DADO ─────────────────────────────────────────────────────────

/**
 * `dropdownMenuSnippet` é o construtor das fichas de Variantes da docs page: a
 * mesma lista de entradas monta a prévia VIVA e imprime o código ao lado.
 *
 * Ele não tem story (exceção declarada em `SEM_STORY`, com a premissa conferida
 * lá em cima), e até 2026-09-18 não tinha teste NENHUM — morava dentro de
 * `DropdownMenuDocs.ts`, onde nada podia importá-lo. Foi assim que 234
 * construtores ficaram sem guarda no repositório.
 */
describe('dropdownMenuSnippet — o menu como lista de entradas', () => {
  it('sem argumento nenhum devolve o menu canônico, e não uma string vazia', () => {
    const code = dropdownMenuSnippet();
    expect(code).toContain('<nds-dropdown-menu>');
    expect(code).toContain('<button ndsDropdownMenuTrigger ndsButton variant="outline">Conta</button>');
    expect(code).toContain('<ng-template ndsDropdownMenuContent>');
    expect(code).toContain('<div ndsDropdownMenuGroup>');
    expect(code).toContain('<div ndsDropdownMenuItem variant="destructive">Sair</div>');
  });

  it('o rótulo sai EXATAMENTE como chega — o construtor não traduz nada', () => {
    // A tradução é de quem chama: a docs page resolve a chave no idioma da
    // página antes de entregar a lista. Traduzir aqui obrigaria o construtor a
    // conhecer `translations.json`, e ele deixaria de rodar em node.
    const code = dropdownMenuSnippet({
      triggerLabel: 'Ajustes',
      entries: [{ kind: 'item', label: 'Preferências' }],
    });
    expect(code).toContain('>Ajustes</button>');
    expect(code).toContain('<div ndsDropdownMenuItem>Preferências</div>');
  });

  it('o atalho vai DENTRO do item, e sem aria-hidden', () => {
    const code = dropdownMenuSnippet({
      entries: [{ kind: 'item', label: 'Copiar', shortcut: 'Ctrl+C' }],
    });
    expect(code).not.toContain('aria-hidden');
    expect(code).toContain('Copiar <span ndsDropdownMenuShortcut>Ctrl+C</span>');
    // Item de uma linha quando não há atalho; de três quando há — é a diferença
    // que deixa o atalho entrar no nome acessível ("Copiar Ctrl+C").
    expect(code).toMatch(/<div ndsDropdownMenuItem>\n\s+Copiar <span/);
  });

  it('o rótulo de grupo nasce DENTRO do grupo, que é o que o faz nomear o bloco', () => {
    const code = dropdownMenuSnippet({
      entries: [
        { kind: 'group', label: 'Conta', entries: [{ kind: 'item', label: 'Perfil' }] },
      ],
    });
    expect(code.indexOf('<div ndsDropdownMenuGroup>')).toBeLessThan(
      code.indexOf('<div ndsDropdownMenuLabel>Conta</div>'),
    );
    expect(code.indexOf('<div ndsDropdownMenuLabel>Conta</div>')).toBeLessThan(
      code.indexOf('<div ndsDropdownMenuItem>Perfil</div>'),
    );
  });

  it('marcação, escolha única e submenu publicam a peça de cada tipo', () => {
    const code = dropdownMenuSnippet({
      entries: [
        { kind: 'checkbox', label: 'Régua', checked: true },
        { kind: 'separator' },
        {
          kind: 'radio-group',
          label: 'Tema',
          value: 'dark',
          options: [
            { label: 'Claro', value: 'light' },
            { label: 'Escuro', value: 'dark' },
          ],
        },
        { kind: 'sub', label: 'Exportar', entries: [{ kind: 'item', label: 'PDF' }] },
      ],
    });
    expect(code).toContain('<div ndsDropdownMenuCheckboxItem [checked]="true">Régua</div>');
    expect(code).toContain('<div ndsDropdownMenuSeparator></div>');
    expect(code).toContain('<div ndsDropdownMenuRadioGroup value="dark">');
    expect(code).toContain('<div ndsDropdownMenuRadioItem value="light">Claro</div>');
    expect(code).toContain('<nds-dropdown-menu-sub>');
    expect(code).toContain('<div ndsDropdownMenuSubTrigger>Exportar</div>');
    expect(code).toContain('<ng-template ndsDropdownMenuSubContent>');
    // O item do submenu é filho do `ng-template` do submenu, e não do painel
    // pai — dois espaços a mais de recuo é o que diz isso a quem lê.
    expect(code).toContain('        <div ndsDropdownMenuItem>PDF</div>');
  });

  it('a instrumentação da docs page NÃO entra no que se copia', () => {
    // `(onOpenChange)` e `(onSelect)` existem na prévia para disparar os eventos
    // de produto. São andaime da página, não lição do menu.
    const code = dropdownMenuSnippet({
      entries: [{ kind: 'item', label: 'Perfil' }, { kind: 'checkbox', label: 'Régua', checked: false }],
    });
    expect(code).not.toContain('(onSelect)');
    expect(code).not.toContain('(onOpenChange)');
    expect(code).not.toContain('(checkedChange)');
    expect(code).not.toContain('data-track');
  });
});
