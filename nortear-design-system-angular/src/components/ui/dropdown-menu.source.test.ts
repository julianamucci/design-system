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

/**
 * Os treze construtores e a story que cada um serve.
 *
 * A lista existe para ser COBRADA: o caso logo abaixo compara com o que o
 * módulo exporta, e um construtor novo que não entre aqui reprova em vez de
 * sair calado da varredura. É a lição do `source-snippets.test.ts` do Vue, onde
 * 28 exports saíram do alcance e a suíte seguiu verde medindo menos.
 *
 * NENHUMA das treze stories fica sem construtor próprio. As duas variantes
 * chegaram perto de compartilhar um — o markup é quase o mesmo —, mas o painel
 * Code é por story: um construtor comum publicaria "Excluir conta" embaixo do
 * menu que só tem ações neutras.
 */
const CONSTRUCTORS: Array<{
  name: string;
  story: string;
  build: () => string;
  /** O único snippet com estado externo: raiz ligada a um sinal de fora. */
  controlled?: true;
  /** O único snippet que publica `defaultOpen` — ali estar aberto É o assunto. */
  bornOpen?: true;
}> = [
  { name: 'dropdownMenuPlaygroundSource', story: 'Playground', build: dropdownMenuPlaygroundSource },
  { name: 'dropdownMenuDefaultSource', story: 'Variants/Default', build: dropdownMenuDefaultSource },
  {
    name: 'dropdownMenuDestructiveSource',
    story: 'Variants/Destructive',
    build: dropdownMenuDestructiveSource,
  },
  { name: 'dropdownMenuClosedSource', story: 'States/Closed', build: dropdownMenuClosedSource },
  {
    name: 'dropdownMenuOpenSource',
    story: 'States/Open',
    build: dropdownMenuOpenSource,
    bornOpen: true,
  },
  {
    name: 'dropdownMenuControlledSource',
    story: 'States/Controlled',
    build: dropdownMenuControlledSource,
    controlled: true,
  },
  {
    name: 'dropdownMenuItemDisabledSource',
    story: 'States/ItemDisabled',
    build: dropdownMenuItemDisabledSource,
  },
  {
    name: 'dropdownMenuCheckboxIndeterminateSource',
    story: 'States/CheckboxIndeterminate',
    build: dropdownMenuCheckboxIndeterminateSource,
  },
  {
    name: 'dropdownMenuWithLabelSource',
    story: 'Compositions/WithLabel',
    build: dropdownMenuWithLabelSource,
  },
  {
    name: 'dropdownMenuWithCheckboxSource',
    story: 'Compositions/WithCheckboxItems',
    build: dropdownMenuWithCheckboxSource,
  },
  {
    name: 'dropdownMenuWithRadioSource',
    story: 'Compositions/WithRadioGroup',
    build: dropdownMenuWithRadioSource,
  },
  {
    name: 'dropdownMenuWithSubmenuSource',
    story: 'Compositions/WithSubmenu',
    build: dropdownMenuWithSubmenuSource,
  },
  {
    name: 'dropdownMenuWithShortcutsSource',
    story: 'Compositions/WithShortcuts',
    build: dropdownMenuWithShortcutsSource,
  },
];

describe('cobertura das quatro stories', () => {
  it('todo construtor exportado pelo módulo entra na varredura', () => {
    const exported = Object.entries(dropdownMenuSourceModule)
      .filter(([, value]) => typeof value === 'function')
      .map(([name]) => name)
      .sort();
    expect(exported).toEqual(CONSTRUCTORS.map((c) => c.name).sort());
  });

  for (const { name, story, build, controlled, bornOpen } of CONSTRUCTORS) {
    it(`${name} (${story}) publica o componente, não o andaime da story`, () => {
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
    });
  }
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
    expect(code).toContain('  readonly showName = signal(true);');
    expect(code).toContain('  readonly showEmail = signal(false);');
    // DOIS alternadores, como a story ao lado.
    expect(code.match(/ndsDropdownMenuCheckboxItem/g)).toHaveLength(2);
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
    // abre, e o `ndsDropdownMenuSubContent` é o painel filho. O chevron e o par
    // `aria-haspopup`/`aria-expanded` entram pelo componente: nada disso pede
    // prop, e escrever uma ensinaria API que não existe.
    const code = dropdownMenuWithSubmenuSource();
    expect(code).toContain('<nds-dropdown-menu-sub>');
    expect(code).toContain('</nds-dropdown-menu-sub>');
    expect(code).toContain('<div ndsDropdownMenuSubTrigger>Exportar</div>');
    expect(code).toContain('<ng-template ndsDropdownMenuSubContent>');
    expect(code).not.toContain('aria-haspopup');
    expect(code).not.toContain('aria-expanded');
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
