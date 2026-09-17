import { describe, expect, it } from 'vitest';
import * as menubarSourceModule from './menubar.source';
import {
  menubarCheckboxCheckedSource,
  menubarCheckboxIndeterminateSource,
  menubarClosedSource,
  menubarControlledSource,
  menubarDefaultSource,
  menubarDestructiveSource,
  menubarEditorSource,
  menubarItemDisabledSource,
  menubarOpenSource,
  menubarPlaygroundSource,
  menubarTabAtPageEndSource,
  menubarTabLeavesMenubarSource,
  menubarWithCheckboxSource,
  menubarWithRadioSource,
  menubarWithShortcutsSource,
  menubarWithSubmenuSource,
} from './menubar.source';

/**
 * A ausência deste arquivo era o `source_sem_teste` do auditor.
 *
 * O painel Code imprime o `template` da story literalmente — com o `@for` que
 * monta a barra a partir de uma lista da story e com os bindings ligados às
 * props que o renderer monta — e essa saída NÃO chega ao DOM durante a `play`:
 * nenhuma suíte de navegador a alcança. O `transform` devolve o uso real, e é
 * aqui que ele tem guarda.
 */

/**
 * As props que as stories injetam no objeto do renderer.
 *
 * Escritas como STRING, e não direto num literal de expressão regular: o portão
 * `identificador_pt_novo` descasca comentário e literal de texto antes de
 * contar, mas não descasca regex.
 */
const STORY_PROPS = ['onSelect', 'onOpenChange', 'menus', 'items', 'shortcuts', 'exportacoes', 'exibicoes', 'temas', 'marcados'];

/** O espião da `play` ou a lista da story ligados ao template — andaime, nunca lição. */
const STORY_BINDING = new RegExp(`(?:\\((?:onSelect|onOpenChange)\\)="|\\b(?:${STORY_PROPS.join('|')})\\[)`);

// ─── O TEXTO das stories ─────────────────────────────────────────────────────
//
// Lido, e não importado: importar um arquivo de story fora do compilador Angular
// quebra, e a pergunta aqui não precisa de execução — é sobre o que o arquivo
// ESCREVE. Mesma leitura por `?raw` do `popover.source.test.ts`.

const storySources = import.meta.glob<string>('./menubar*.stories.ts', {
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

describe('menubarPlaygroundSource', () => {
  it('devolve a barra que se escreve, e não o template da story', () => {
    const code = menubarPlaygroundSource();
    expect(code).toContain("import { NDS_MENUBAR } from '@/components/ui/menubar';");
    expect(code).toContain('imports: [...NDS_MENUBAR],');
    expect(code).toContain('<nds-menubar>');
    // O que só existe dentro da story: o laço sobre a lista, os bindings para
    // os args e o espião de output que a `play` consulta.
    expect(code).not.toContain('@for');
    expect(code).not.toContain('args.');
    expect(code).not.toContain('[side]="side"');
    expect(code).not.toContain('[align]="align"');
    expect(code).not.toContain('(openChange)="onOpenChange($event)"');
    expect(code).not.toMatch(STORY_BINDING);
  });

  it('omite modalidade, laço, lado e alinhamento quando são os padrões', () => {
    const code = menubarPlaygroundSource('', {
      args: { side: 'bottom', align: 'start', modal: true, loopFocus: true },
    });
    expect(code).toContain('<nds-menubar>');
    expect(code.match(/<ng-template ndsMenubarContent>/g)).toHaveLength(2);
  });

  it('imprime o que difere do padrão: modalidade e laço na BARRA, lado e alinhamento no CONTEÚDO', () => {
    const code = menubarPlaygroundSource('', {
      args: { side: 'top', align: 'end', modal: false, loopFocus: false },
    });
    expect(code).toContain('<nds-menubar [modal]="false" [loopFocus]="false">');
    expect(code.match(/<ng-template ndsMenubarContent side="top" align="end">/g)).toHaveLength(2);
    // Lado e alinhamento nunca migram para a barra nem para o menu.
    expect(code).not.toMatch(/<nds-menubar[^>]*\sside=/);
    expect(code).not.toMatch(/<nds-menubar-menu[^>]*\salign=/);
  });
});

// ─── Cobertura das quatro stories ─────────────────────────────────────────────

const ROOT = './menubar.stories.ts';
const VARIANTS = './menubar-variants.stories.ts';
const STATES = './menubar-states.stories.ts';
const COMPOSITIONS = './menubar-compositions.stories.ts';

/**
 * Os dezesseis construtores e a story que cada um serve.
 *
 * A lista existe para ser COBRADA nos DOIS sentidos: um caso a compara com o que
 * o módulo exporta, e outro com o que os quatro arquivos de story publicam no
 * painel. Construtor novo que não entre aqui reprova, e story nova sem
 * `transform` também — em vez de saírem calados da varredura, que é a lição do
 * `source-snippets.test.ts` do Vue, onde 28 exports saíram do alcance e a suíte
 * seguiu verde medindo menos.
 *
 * NENHUMA das dezesseis fica sem construtor próprio, e não há exclusão a
 * declarar.
 */
const CONSTRUCTORS: Array<{
  name: string;
  file: string;
  story: string;
  build: () => string;
  /** O único snippet com estado externo: um menu ligado a um sinal de fora. */
  controlled?: true;
  /** O único snippet que publica `defaultOpen` — ali estar aberto É o assunto. */
  bornOpen?: true;
  /** Os dois snippets que publicam a fileira com vizinhos de tabulação. */
  neighbors?: 'both' | 'before';
}> = [
  { name: 'menubarPlaygroundSource', file: ROOT, story: 'Playground', build: menubarPlaygroundSource },
  {
    name: 'menubarTabLeavesMenubarSource',
    file: ROOT,
    story: 'TabLeavesMenubar',
    build: menubarTabLeavesMenubarSource,
    neighbors: 'both',
  },
  {
    name: 'menubarTabAtPageEndSource',
    file: ROOT,
    story: 'TabAtPageEnd',
    build: menubarTabAtPageEndSource,
    neighbors: 'before',
  },
  { name: 'menubarDefaultSource', file: VARIANTS, story: 'Default', build: menubarDefaultSource },
  { name: 'menubarDestructiveSource', file: VARIANTS, story: 'Destructive', build: menubarDestructiveSource },
  { name: 'menubarClosedSource', file: STATES, story: 'Closed', build: menubarClosedSource },
  { name: 'menubarOpenSource', file: STATES, story: 'Open', build: menubarOpenSource, bornOpen: true },
  { name: 'menubarItemDisabledSource', file: STATES, story: 'ItemDisabled', build: menubarItemDisabledSource },
  { name: 'menubarCheckboxCheckedSource', file: STATES, story: 'CheckboxChecked', build: menubarCheckboxCheckedSource },
  {
    name: 'menubarCheckboxIndeterminateSource',
    file: STATES,
    story: 'CheckboxIndeterminate',
    build: menubarCheckboxIndeterminateSource,
  },
  {
    name: 'menubarControlledSource',
    file: STATES,
    story: 'ControlledOpen',
    build: menubarControlledSource,
    controlled: true,
  },
  { name: 'menubarWithShortcutsSource', file: COMPOSITIONS, story: 'WithShortcuts', build: menubarWithShortcutsSource },
  { name: 'menubarWithSubmenuSource', file: COMPOSITIONS, story: 'WithSubmenu', build: menubarWithSubmenuSource },
  { name: 'menubarWithCheckboxSource', file: COMPOSITIONS, story: 'WithCheckboxItems', build: menubarWithCheckboxSource },
  { name: 'menubarWithRadioSource', file: COMPOSITIONS, story: 'WithRadioGroup', build: menubarWithRadioSource },
  { name: 'menubarEditorSource', file: COMPOSITIONS, story: 'EditorCompleto', build: menubarEditorSource },
];

describe('cobertura das quatro stories', () => {
  it('todo construtor exportado pelo módulo entra na varredura', () => {
    const exported = Object.entries(menubarSourceModule)
      .filter(([, value]) => typeof value === 'function')
      .map(([name]) => name)
      .sort();
    expect(exported).toEqual(CONSTRUCTORS.map((c) => c.name).sort());
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
      expect(code).not.toMatch(STORY_BINDING);
      // A barra escrita à mão: o laço sobre a lista da story não é lição.
      expect(code).not.toContain('@for');
      // O primitivo escreve os `data-slot` em runtime, e no Angular o host
      // binding da diretiva apaga um atributo estático do template: nomear peça
      // por `data-slot` no snippet ensinaria algo que não funciona.
      expect(code).not.toContain('data-slot=');

      // UMA barra por snippet, e sempre fechada no fim.
      expect(code.match(/<nds-menubar[ >]/g)).toHaveLength(1);
      expect(code.match(/<\/nds-menubar>/g)).toHaveLength(1);
      // Cada menu com o gatilho da barra e o miolo em `ng-template`.
      const menus = code.match(/<nds-menubar-menu[ >]/g) ?? [];
      expect(menus.length).toBeGreaterThan(0);
      expect(code.match(/<button ndsMenubarTrigger>[^<]+<\/button>/g)).toHaveLength(menus.length);
      expect(code.match(/<ng-template ndsMenubarContent[ >]/g)).toHaveLength(menus.length);

      expect(code).toContain("import { NDS_MENUBAR } from '@/components/ui/menubar';");

      // A fileira de pontos de tabulação é de DOIS snippets, e neles é o
      // assunto. Nos demais, um vizinho ali seria cenário emprestado: quem copia
      // passaria a achar que a barra pede um botão ao lado para funcionar. O
      // botão do design system entra no `imports` junto — sem ele o exemplo não
      // compila, e é por isso que a checagem cobra os dois lados.
      if (neighbors) {
        expect(code).toContain("import { NdsButton } from '@/components/ui/button';");
        expect(code).toContain('imports: [...NDS_MENUBAR, NdsButton],');
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
        // `States/ControlledOpen` também traz o botão do design system, mas para
        // mexer no estado — nunca como vizinho de tabulação.
        expect(code).not.toContain('variant="ghost"');
        expect(code).not.toContain('>Antes</button>');
        expect(code).not.toContain('>Depois</button>');
      }

      // `[modal]="false"` é andaime do quadro — ele destrava o canvas por trás
      // do painel. Nenhum snippet o publica com os args no padrão.
      expect(code).not.toContain('[modal]');

      // `[defaultOpen]="true"` só na story cujo assunto É estar aberto.
      if (bornOpen) {
        expect(code).toContain('<nds-menubar-menu [defaultOpen]="true">');
      } else {
        expect(code).not.toContain('[defaultOpen]');
      }

      // Estado externo é de um snippet só, e mora no MENU — nunca na barra.
      if (controlled) {
        expect(code).toContain('<nds-menubar-menu [open]="fileOpen()" (openChange)="fileOpen.set($event)">');
        expect(code).toContain('  readonly fileOpen = signal(false);');
      } else {
        expect(code).not.toContain('[open]=');
        expect(code).not.toContain('(openChange)');
      }
      expect(code).not.toMatch(/<nds-menubar\s[^>]*\[open\]/);
    });
  }
});

// ─── Tab sai da barra ─────────────────────────────────────────────────────────

describe('Tab sai da barra', () => {
  // As duas stories do arquivo-raiz não têm andaime nenhum a recortar — nem
  // espião, nem `@for` sobre a lista, nem binding de arg —, e por isso o que o
  // snippet publica é o template INTEIRO da story. Isso deixa cobrar a forma
  // forte: igualdade. Se o template da story mudar de forma, é aqui que reprova,
  // em vez de o painel Code ensinar uma barra que o preview ao lado não mostra.
  const TAB_STORIES: Array<{ name: string; story: string; build: () => string }> = [
    {
      name: 'menubarTabLeavesMenubarSource',
      story: 'TabLeavesMenubar',
      build: menubarTabLeavesMenubarSource,
    },
    { name: 'menubarTabAtPageEndSource', story: 'TabAtPageEnd', build: menubarTabAtPageEndSource },
  ];

  for (const { name, story, build } of TAB_STORIES) {
    it(`${name} publica o MESMO markup que ${story} renderiza`, () => {
      const rendered = storyTemplate(ROOT, story);
      // Sem esta linha, um `template:` que deixasse de casar compararia string
      // vazia com string vazia e o caso passaria medindo nada.
      expect(rendered, `${ROOT}#${story}`).toContain('nds-menubar');
      expect(normalize(snippetTemplate(build())), `${name} divergiu de ${story}`).toBe(
        normalize(rendered),
      );
    });
  }

  it('TabLeavesMenubar ensina o submenu, e TabAtPageEnd não — é o que separa as duas', () => {
    // A premissa de haver DOIS construtores em vez de um. O segundo nível existe
    // na primeira porque o Tab de dentro dele fecha o menu INTEIRO; a segunda
    // mostra a barra como última parada, e cena a mais só disputaria atenção.
    const leaves = menubarTabLeavesMenubarSource();
    const atEnd = menubarTabAtPageEndSource();
    expect(leaves).toContain('<nds-menubar-sub>');
    expect(leaves).toContain('<div ndsMenubarSubTrigger>Exportar</div>');
    expect(leaves).toContain('<ng-template ndsMenubarSubContent>');
    expect(atEnd).not.toContain('nds-menubar-sub');
    // Os DOIS menus da barra nas duas: é o vizinho "Editar" que prova que o Tab
    // não anda dentro da barra, porque ela é uma parada só.
    for (const code of [leaves, atEnd]) {
      expect(code).toContain('<button ndsMenubarTrigger>Arquivo</button>');
      expect(code).toContain('<button ndsMenubarTrigger>Editar</button>');
      expect(code.match(/<nds-menubar-menu>/g)).toHaveLength(2);
    }
  });
});

// ─── Variantes ────────────────────────────────────────────────────────────────

describe('variantes: as duas ênfases de item', () => {
  it('o item neutro não escreve a variante — default é o padrão da diretiva', () => {
    const code = menubarDefaultSource();
    expect(code).not.toContain('variant=');
    // Os mesmos itens que a story ao lado: TRÊS no Arquivo, e o Editar vizinho.
    for (const label of ['Novo', 'Abrir', 'Salvar', 'Desfazer']) {
      expect(code).toContain(`<div ndsMenubarItem>${label}</div>`);
    }
    expect(code.match(/<div ndsMenubarItem>/g)).toHaveLength(4);
  });

  it('o item destrutivo vem por ÚLTIMO e separado da ação neutra', () => {
    const code = menubarDestructiveSource();
    expect(code).toContain('<div ndsMenubarItem>Salvar</div>');
    expect(code).toContain('<div ndsMenubarItem variant="destructive">Descartar alterações</div>');
    expect(code.indexOf('variant="destructive"')).toBeGreaterThan(code.indexOf('<div ndsMenubarSeparator></div>'));
    expect(code.match(/variant="destructive"/g)).toHaveLength(1);
  });
});

// ─── Estados ──────────────────────────────────────────────────────────────────

describe('estados', () => {
  it('menubarClosedSource escreve os QUATRO menus da story, sem prop de abertura', () => {
    const code = menubarClosedSource();
    for (const menu of ['Arquivo', 'Editar', 'Exibir', 'Ajuda']) {
      expect(code).toContain(`<button ndsMenubarTrigger>${menu}</button>`);
    }
    expect(code.match(/<nds-menubar-menu>/g)).toHaveLength(4);
    expect(code.match(/<div ndsMenubarItem>/g)).toHaveLength(8);
  });

  it('menubarOpenSource abre SÓ o primeiro menu por defaultOpen', () => {
    const code = menubarOpenSource();
    expect(code.match(/\[defaultOpen\]="true"/g)).toHaveLength(1);
    expect(code.indexOf('[defaultOpen]')).toBeLessThan(code.indexOf('<button ndsMenubarTrigger>Arquivo</button>'));
    expect(code).toContain('<button ndsMenubarTrigger>Editar</button>');
  });

  it('menubarItemDisabledSource escreve o bloqueio na PROP, e não em cada consumidor', () => {
    const code = menubarItemDisabledSource();
    expect(code).toContain('<div ndsMenubarItem disabled>Enviar para revisão</div>');
    expect(code.match(/ disabled>/g)).toHaveLength(1);
    expect(code).not.toContain('pointer-events');
  });

  it('menubarCheckboxCheckedSource guarda cada marcação no próprio sinal', () => {
    const code = menubarCheckboxCheckedSource();
    expect(code).toContain('[checked]="ruler()" (checkedChange)="ruler.set($event)"');
    expect(code).toContain('[checked]="grid()" (checkedChange)="grid.set($event)"');
    expect(code).toContain('  readonly ruler = signal(true);');
    expect(code).toContain('  readonly grid = signal(false);');
  });

  it('menubarCheckboxIndeterminateSource escreve os TRÊS estados por extenso e sem ligação', () => {
    const code = menubarCheckboxIndeterminateSource();
    expect(code).toContain(`<div ndsMenubarCheckboxItem [checked]="'indeterminate'">Colunas</div>`);
    expect(code).toContain('<div ndsMenubarCheckboxItem [checked]="true">Régua</div>');
    expect(code).toContain('<div ndsMenubarCheckboxItem [checked]="false">Grade</div>');
    expect(code).not.toContain('(checkedChange)');
  });

  it('menubarControlledSource liga as DUAS pontas no menu, e o controle externo é o botão do sistema', () => {
    // Ligar só `open` é o defeito clássico: o menu fecha na tela pelo Escape e
    // o valor de fora continua `true` — armadilha de teclado, WCAG 2.1.2.
    const code = menubarControlledSource();
    expect(code).toContain("import { NdsButton } from '@/components/ui/button';");
    expect(code).toContain('imports: [...NDS_MENUBAR, NdsButton],');
    expect(code).toContain('<button ndsButton variant="outline" size="sm" (click)="fileOpen.set(true)">');
    // O Editar vizinho continua se governando sozinho.
    expect(code).toContain('<nds-menubar-menu>');
  });
});

// ─── Composições ──────────────────────────────────────────────────────────────

describe('composições', () => {
  it('menubarWithShortcutsSource põe cada atalho DENTRO do seu item, e sem aria-hidden', () => {
    const code = menubarWithShortcutsSource();
    expect(code).not.toContain('aria-hidden');
    for (const [label, key] of [['Desfazer', 'Ctrl+Z'], ['Refazer', 'Ctrl+Shift+Z'], ['Copiar', 'Ctrl+C']]) {
      expect(code).toContain(`<div ndsMenubarItem>${label} <span ndsMenubarShortcut>${key}</span></div>`);
    }
  });

  it('menubarWithSubmenuSource publica a tríade do segundo nível', () => {
    const code = menubarWithSubmenuSource();
    expect(code).toContain('<nds-menubar-sub>');
    expect(code).toContain('<div ndsMenubarSubTrigger>Exportar</div>');
    expect(code).toContain('<ng-template ndsMenubarSubContent>');
    expect(code).not.toContain('aria-owns');
    // TRÊS itens no submenu, como a `play` da story afirma.
    for (const label of ['PDF', 'CSV', 'PNG']) expect(code).toContain(`<div ndsMenubarItem>${label}</div>`);
    // Linha em branco sem espaço sobrando.
    expect(code).not.toMatch(/^ +$/m);
  });

  it('menubarWithCheckboxSource dá a cada item o próprio estado, num sinal', () => {
    const code = menubarWithCheckboxSource();
    expect(code.match(/ndsMenubarCheckboxItem/g)).toHaveLength(3);
    for (const member of ['showRuler', 'showSidebar', 'showGrid']) {
      expect(code).toContain(`[checked]="${member}()" (checkedChange)="${member}.set($event)"`);
    }
    expect(code).not.toContain('ndsMenubarRadioGroup');
  });

  it('menubarWithRadioSource põe o valor no GRUPO, e o value em cada opção', () => {
    const code = menubarWithRadioSource();
    expect(code).toContain('<div ndsMenubarRadioGroup [value]="theme()" (valueChange)="theme.set($event)">');
    expect(code).toContain("  readonly theme = signal('light');");
    expect(code.match(/<div ndsMenubarRadioItem value="/g)).toHaveLength(3);
    expect(code).not.toContain('[checked]');
  });

  it('menubarEditorSource traz as quatro categorias, com a saída destrutiva por último no Arquivo', () => {
    const code = menubarEditorSource();
    for (const menu of ['Arquivo', 'Editar', 'Exibir', 'Ajuda']) {
      expect(code).toContain(`<button ndsMenubarTrigger>${menu}</button>`);
    }
    expect(code).toContain('<div ndsMenubarLabel>Documento</div>');
    expect(code.indexOf('variant="destructive"')).toBeGreaterThan(code.indexOf('<div ndsMenubarSeparator></div>'));
  });
});
