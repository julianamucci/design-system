import { describe, expect, it } from 'vitest';
import { AREA_CLICK_DIREITO } from '@shared/primitives/context-menu-area';
import * as contextMenuSourceModule from './context-menu.source';
import {
  contextMenuCheckboxIndeterminateSource,
  contextMenuCompleteCompositionSource,
  contextMenuDarkPaletteSource,
  contextMenuItemDestructiveSource,
  contextMenuItemDisabledSource,
  contextMenuItemInsetSource,
  contextMenuPlaygroundSource,
  contextMenuWithCheckboxSource,
  contextMenuWithRadioGroupSource,
  contextMenuWithShortcutSource,
  contextMenuWithSubmenuSource,
} from './context-menu.source';

/**
 * A ausência deste arquivo era o `source_sem_teste` do auditor.
 *
 * O painel Code imprime o `template` da story literalmente — com os bindings
 * ligados aos args e às props que o renderer monta — e essa saída NÃO chega ao
 * DOM durante a `play`: nenhuma suíte de navegador a alcança. O `transform`
 * devolve o uso real, e é aqui que ele tem guarda.
 *
 * A varredura genérica do `source-snippets.test.ts` prova que o snippet importa
 * o que usa e liga só o que a classe declara. O que ela NÃO pode provar é o que
 * este arquivo cobra: omitir o valor padrão, bater com a story ao lado, e não
 * vazar binding que só existe nela.
 */

/**
 * As props que as stories injetam no objeto do renderer.
 *
 * Escritas como STRING, e não direto num literal de expressão regular: o portão
 * `identificador_pt_novo` descasca comentário e literal de texto antes de
 * contar, mas não descasca regex.
 */
const STORY_PROPS = ['onSelect', 'onOpenChange'];

/** O espião da `play` ligado ao item — andaime, nunca lição do menu. */
const STORY_SPY = new RegExp(`\\((?:${STORY_PROPS.join('|')})\\)="`);

// ─── Playground ───────────────────────────────────────────────────────────────

describe('contextMenuPlaygroundSource', () => {
  it('devolve o componente que se escreve, e não o template da story', () => {
    const code = contextMenuPlaygroundSource();
    expect(code).toContain("import { NDS_CONTEXT_MENU } from '@/components/ui/context-menu';");
    expect(code).toContain('imports: [NDS_CONTEXT_MENU],');
    expect(code).toContain('<div ndsContextMenu>');
    expect(code).toContain('<ng-template ndsContextMenuContent>');
    // O que só existe dentro da story: o binding de classe contra o objeto de
    // props do renderer, o endereço do teste e o espião de output que a `play`
    // consulta.
    expect(code).not.toContain('args.');
    expect(code).not.toContain('[class]=');
    expect(code).not.toContain('data-testid');
    expect(code).not.toMatch(STORY_SPY);
  });

  it('usa o rótulo padrão quando o control não trouxe texto', () => {
    // O padrão do construtor era "Clique com o botão direito" enquanto a story
    // renderizava "…direito aqui": o painel Code ensinava um texto que o preview
    // ao lado não mostrava. É o mesmo rótulo de `demonstration.labels`.
    const code = contextMenuPlaygroundSource();
    expect(code).toContain('>Clique com o botão direito aqui</div>');
  });

  it('imprime o rótulo vindo do control quando ele muda', () => {
    const code = contextMenuPlaygroundSource('', { args: { triggerLabel: 'Clique na imagem' } });
    expect(code).toContain('>Clique na imagem</div>');
    expect(code).not.toContain('Clique com o botão direito aqui');
  });

  it('publica a forma canônica: ações, divisória e a saída destrutiva por último', () => {
    const code = contextMenuPlaygroundSource();
    // TRÊS itens e UMA divisória, exatamente como a `play` da story afirma.
    expect(code.match(/<div ndsContextMenuItem[ >]/g)).toHaveLength(3);
    expect(code.match(/<div ndsContextMenuSeparator><\/div>/g)).toHaveLength(1);
    expect(code).toContain('<div ndsContextMenuItem>Duplicar</div>');
    // DOIS atalhos, e o do item destrutivo é `Delete` — o mesmo que as outras
    // stories deste componente e `demonstration.labels.deleteShortcut` usam. A
    // story dizia `Del`, e foi ela que se alinhou.
    expect(code).toContain('<span ndsContextMenuShortcut>Ctrl+E</span>');
    expect(code).toContain('<span ndsContextMenuShortcut>Delete</span>');
    expect(code.match(/<span ndsContextMenuShortcut>/g)).toHaveLength(2);
    // O Playground NÃO envolve os itens em grupo — a story ao lado também não,
    // e escrever um aqui ensinaria um menu que o preview não mostra.
    expect(code).not.toContain('ndsContextMenuGroup');
  });
});

// ─── Cobertura das três stories ───────────────────────────────────────────────

/**
 * Os onze construtores e a story que cada um serve.
 *
 * A lista existe para ser COBRADA: o caso logo abaixo compara com o que o
 * módulo exporta, e um construtor novo que não entre aqui reprova em vez de
 * sair calado da varredura. É a lição do `source-snippets.test.ts` do Vue, onde
 * 28 exports saíram do alcance e a suíte seguiu verde medindo menos.
 *
 * NENHUMA das onze stories fica sem construtor próprio — não há exclusão a
 * declarar aqui. A tentação era juntar `ItemDestructive` e `WithShortcut`, que
 * têm markup parecido, mas o painel Code é por story: um construtor comum
 * publicaria "Excluir permanentemente" embaixo do menu que mostra "Desfazer".
 */
const CONSTRUCTORS: Array<{
  name: string;
  story: string;
  build: () => string;
  /** Os três snippets com estado próprio: sinal na classe, par ligado no item. */
  stateful?: true;
}> = [
  {
    name: 'contextMenuPlaygroundSource',
    story: 'Playground',
    build: contextMenuPlaygroundSource,
  },
  {
    name: 'contextMenuItemDisabledSource',
    story: 'States/ItemDisabled',
    build: contextMenuItemDisabledSource,
  },
  {
    name: 'contextMenuItemInsetSource',
    story: 'States/ItemInset',
    build: contextMenuItemInsetSource,
  },
  {
    name: 'contextMenuItemDestructiveSource',
    story: 'States/ItemDestructive',
    build: contextMenuItemDestructiveSource,
  },
  {
    name: 'contextMenuCheckboxIndeterminateSource',
    story: 'States/CheckboxIndeterminate',
    build: contextMenuCheckboxIndeterminateSource,
  },
  {
    name: 'contextMenuDarkPaletteSource',
    story: 'States/DarkPalette',
    build: contextMenuDarkPaletteSource,
  },
  {
    name: 'contextMenuWithShortcutSource',
    story: 'Compositions/WithShortcut',
    build: contextMenuWithShortcutSource,
  },
  {
    name: 'contextMenuWithCheckboxSource',
    story: 'Compositions/WithCheckbox',
    build: contextMenuWithCheckboxSource,
    stateful: true,
  },
  {
    name: 'contextMenuWithRadioGroupSource',
    story: 'Compositions/WithRadioGroup',
    build: contextMenuWithRadioGroupSource,
    stateful: true,
  },
  {
    name: 'contextMenuWithSubmenuSource',
    story: 'Compositions/WithSubmenu',
    build: contextMenuWithSubmenuSource,
  },
  {
    name: 'contextMenuCompleteCompositionSource',
    story: 'Compositions/CompleteComposition',
    build: contextMenuCompleteCompositionSource,
    stateful: true,
  },
];

describe('cobertura das três stories', () => {
  it('todo construtor exportado pelo módulo entra na varredura', () => {
    const exported = Object.entries(contextMenuSourceModule)
      .filter(([, value]) => typeof value === 'function')
      .map(([name]) => name)
      .sort();
    expect(exported).toEqual(CONSTRUCTORS.map((c) => c.name).sort());
  });

  for (const { name, story, build, stateful } of CONSTRUCTORS) {
    it(`${name} (${story}) publica o componente, não o andaime da story`, () => {
      const code = build();

      expect(code).not.toContain('args.');
      expect(code).not.toMatch(STORY_SPY);
      // O binding de classe, o endereço do teste e a marcação de duas pontas
      // contra campo comum do objeto de props — os três só existem na story.
      expect(code).not.toContain('[class]=');
      expect(code).not.toContain('data-testid');
      expect(code).not.toContain('[(checked)]');
      expect(code).not.toContain('[(value)]');
      // O primitivo escreve os `data-slot` em runtime, e no Angular o host
      // binding da diretiva apaga um atributo estático do template: nomear peça
      // por `data-slot` no snippet ensinaria algo que não funciona.
      expect(code).not.toContain('data-slot=');
      // Valor de design em `style` inline não existe no design system.
      expect(code).not.toContain('style=');

      // Um menu de raiz por snippet. `ndsContextMenuSub` não entra na contagem:
      // o caractere depois de `ndsContextMenu` ali é `S`, e não `>`.
      expect(code.match(/<div ndsContextMenu>/g)).toHaveLength(1);
      expect(code.match(/ndsContextMenuTrigger/g)).toHaveLength(1);
      expect(code.match(/<ng-template ndsContextMenuContent>/g)).toHaveLength(1);

      // A moldura tracejada, escrita da constante COMPARTILHADA — é o que
      // impede o vocabulário de classe de divergir de novo entre as stacks.
      expect(code).toContain(`class="${AREA_CLICK_DIREITO}"`);
      // As duas classes de borda são necessárias: uma traz largura e cor, a
      // outra só troca o estilo do traço.
      expect(code).toContain('nds-border-default');
      expect(code).toContain('nds-border-dashed');
      // Sem altura fixa: o quadro nasce do recheio e cresce com a fonte do
      // navegador (WCAG 1.4.4).
      expect(code).not.toContain('height');
      expect(code).toContain('>Clique com o botão direito aqui</div>');

      // O import que todo snippet ensina, e o `imports` do componente.
      expect(code).toContain("import { NDS_CONTEXT_MENU } from '@/components/ui/context-menu';");
      expect(code).toContain('imports: [NDS_CONTEXT_MENU],');

      // O que o componente já entrega e escrever à mão ensinaria API que não
      // existe: o sub-gatilho anuncia `aria-haspopup`, `aria-expanded` e —
      // porque o painel é portalado — o `aria-owns` que aponta para ele; e o
      // atalho fica legível justamente por NÃO ter `aria-hidden`.
      expect(code).not.toContain('aria-haspopup');
      expect(code).not.toContain('aria-expanded');
      expect(code).not.toContain('aria-owns');
      expect(code).not.toContain('aria-hidden');

      // Quando há ação destrutiva, ela vem depois da ÚLTIMA divisória e é
      // única: a ação que não se desfaz não fica ao alcance de um clique
      // distraído, e um menu inteiro de perigo não marcaria nada.
      if (code.includes('variant="destructive"')) {
        expect(code.match(/variant="destructive"/g)).toHaveLength(1);
        expect(code.indexOf('variant="destructive"')).toBeGreaterThan(
          code.lastIndexOf('<div ndsContextMenuSeparator></div>'),
        );
      }

      // Estado próprio é de três snippets; nos demais a classe fica vazia, e
      // inventar um sinal ali pediria estado que a story não tem.
      if (stateful) {
        expect(code).toContain('  readonly ');
        expect(code).toContain('signal(');
      } else {
        expect(code).toContain('export class Exemplo {}');
        expect(code).not.toContain('signal(');
      }
    });
  }
});

// ─── Estados ──────────────────────────────────────────────────────────────────

describe('estados', () => {
  it('contextMenuItemDisabledSource escreve o bloqueio na PROP, e não em cada consumidor', () => {
    // O item indisponível continua no menu e é alcançável pela seta, para ser
    // anunciado; o que ele não pode é executar. As duas coisas vêm da prop.
    const code = contextMenuItemDisabledSource();
    expect(code).toContain('<div ndsContextMenuItem disabled>Duplicar</div>');
    expect(code).toContain('<div ndsContextMenuItem>Renomear</div>');
    expect(code).toContain('<div ndsContextMenuItem variant="destructive" disabled>Excluir</div>');
    // DOIS indisponíveis e QUATRO itens, como a story ao lado — ela nomeia
    // `primeiro`, `off`, `ultimo` e `perigo-off`.
    expect(code.match(/ disabled[ >]/g)).toHaveLength(2);
    expect(code.match(/<div ndsContextMenuItem[ >]/g)).toHaveLength(4);
    // Nada de `pointer-events` escrito à mão: quem o aplica é a folha do item.
    expect(code).not.toContain('pointer-events');
  });

  it('contextMenuItemInsetSource recua rótulo e itens, e só por binding', () => {
    // `inset` é `input(false)` sem transformação booleana: atributo simples
    // chegaria como texto e o compilador de templates reprovaria. É por isso que
    // aqui o valor vai por binding e o `disabled` do vizinho não vai.
    const code = contextMenuItemInsetSource();
    expect(code).toContain('<div ndsContextMenuLabel [inset]="true">Arquivo</div>');
    expect(code).toContain('<div ndsContextMenuItem>Editar</div>');
    expect(code).toContain('<div ndsContextMenuItem [inset]="true">Duplicar</div>');
    expect(code).toContain('<div ndsContextMenuItem [inset]="true" variant="destructive">Excluir</div>');
    // TRÊS recuos — o rótulo e dois itens —, como a story ao lado.
    expect(code.match(/\[inset\]="true"/g)).toHaveLength(3);
    expect(code).not.toContain('inset>');
    // O recuo mora num grupo: é o alinhamento com quem tem indicador à esquerda.
    expect(code.match(/<div ndsContextMenuGroup>/g)).toHaveLength(1);
  });

  it('contextMenuItemDestructiveSource nomeia a ação irreversível por extenso', () => {
    const code = contextMenuItemDestructiveSource();
    expect(code).toContain('Excluir permanentemente');
    expect(code).toContain('<span ndsContextMenuShortcut>Delete</span>');
    // O grupo reúne as ações neutras; a destrutiva fica FORA dele, depois da
    // divisória — é a mesma forma da story.
    expect(code.match(/<div ndsContextMenuGroup>/g)).toHaveLength(1);
    expect(code.indexOf('Excluir permanentemente')).toBeGreaterThan(
      code.indexOf('<div ndsContextMenuSeparator></div>'),
    );
    expect(code.match(/<div ndsContextMenuItem[ >]/g)).toHaveLength(3);
  });

  it('contextMenuCheckboxIndeterminateSource escreve os TRÊS estados por extenso', () => {
    // O assunto é o CONTRASTE entre eles — misto desenha traço, marcado desenha
    // tique, desmarcado não desenha nada. Omitir o desmarcado apagaria metade
    // da lição, e é o que a `play` da story mede glifo a glifo.
    const code = contextMenuCheckboxIndeterminateSource();
    expect(code).toContain(
      `<div ndsContextMenuCheckboxItem [checked]="'indeterminate'">Colunas</div>`,
    );
    expect(code).toContain('<div ndsContextMenuCheckboxItem [checked]="true">Régua</div>');
    expect(code).toContain('<div ndsContextMenuCheckboxItem [checked]="false">Grade</div>');
    expect(code.match(/ndsContextMenuCheckboxItem/g)).toHaveLength(3);
    expect(code).toContain('<div ndsContextMenuLabel>Mostrar na tela</div>');
    // Valor FIXO, e não ligado: o primeiro clique num item misto o resolve para
    // marcado, e é por isso que a story ao lado não interage com eles.
    expect(code).not.toContain('(checkedChange)');
  });

  it('contextMenuDarkPaletteSource não publica prop nenhuma de tema', () => {
    // A troca é global (classe no documento) e não muda uma linha do menu — é
    // exatamente o que a story mostra. Escrever uma prop aqui ensinaria API que
    // não existe.
    const code = contextMenuDarkPaletteSource();
    expect(code).not.toContain('dark');
    expect(code).not.toContain('theme');
    expect(code).toContain('<div ndsContextMenuItem>Editar</div>');
    expect(code).toContain('<div ndsContextMenuItem disabled>Duplicar</div>');
    expect(code).toContain('<div ndsContextMenuItem variant="destructive">Excluir</div>');
    expect(code.match(/<div ndsContextMenuItem[ >]/g)).toHaveLength(3);
  });
});

// ─── Composições ──────────────────────────────────────────────────────────────

describe('composições', () => {
  it('contextMenuWithShortcutSource põe o atalho DENTRO do item, e sem aria-hidden', () => {
    // É assim que ele entra no nome acessível ("Excluir, Delete"). Escondido, a
    // pessoa ouviria só "Excluir" e nunca saberia que existe uma tecla.
    const code = contextMenuWithShortcutSource();
    for (const key of ['Ctrl+E', 'Ctrl+Z', 'Delete']) {
      expect(code).toContain(`<span ndsContextMenuShortcut>${key}</span>`);
    }
    // TRÊS atalhos, o número que a `play` da story afirma.
    expect(code.match(/<span ndsContextMenuShortcut>/g)).toHaveLength(3);
    // Cada atalho dentro do seu item: fora dele, o leitor de tela leria o texto
    // como um irmão solto e o nome do item ficaria sem a tecla.
    const items = [...code.matchAll(/<div ndsContextMenuItem[^>]*>\n([\s\S]*?)\n\s*<\/div>/g)];
    expect(items).toHaveLength(3);
    for (const item of items) {
      expect(item[1]).toContain('<span ndsContextMenuShortcut>');
    }
  });

  it('contextMenuWithCheckboxSource dá a cada item o próprio estado, num sinal', () => {
    // Independentes entre si — é o que separa a marcação da escolha única. A
    // story liga `[(checked)]` a campos do objeto de props do renderer, que não
    // existem em componente nenhum; aqui as duas pontas são explícitas.
    const code = contextMenuWithCheckboxSource();
    expect(code).toContain('[checked]="showGrid()"');
    expect(code).toContain('(checkedChange)="showGrid.set($event)"');
    expect(code).toContain('[checked]="showRulers()"');
    expect(code).toContain('(checkedChange)="showRulers.set($event)"');
    // Os valores iniciais são os da story: grade desmarcada, réguas marcadas.
    expect(code).toContain('  readonly showGrid = signal(false);');
    expect(code).toContain('  readonly showRulers = signal(true);');
    // DOIS alternadores e o rótulo do bloco, como a story ao lado.
    expect(code.match(/ndsContextMenuCheckboxItem/g)).toHaveLength(2);
    expect(code).toContain('<div ndsContextMenuLabel>Visualização</div>');
    expect(code).toContain('>Mostrar grade</div>');
    expect(code).toContain('>Mostrar réguas</div>');
    // Sem valor comum: um grupo de escolha única aqui faria a marcação de um
    // item desmarcar a do outro.
    expect(code).not.toContain('ndsContextMenuRadioGroup');
  });

  it('contextMenuWithRadioGroupSource põe o valor no GRUPO, e o value em cada opção', () => {
    // É o que separa a escolha única da marcação: escolher um item desmarca o
    // anterior sem que ninguém escreva essa regra.
    const code = contextMenuWithRadioGroupSource();
    expect(code).toContain(
      '<div ndsContextMenuRadioGroup [value]="layout()" (valueChange)="layout.set($event)">',
    );
    expect(code).toContain(`  readonly layout = signal('grid');`);
    // TRÊS opções, como a story ao lado, e cada uma só com o `value` que
    // representa — o estado marcado não se escreve no item.
    expect(code.match(/<div ndsContextMenuRadioItem value="/g)).toHaveLength(3);
    expect(code).toContain('<div ndsContextMenuRadioItem value="grid">Grade</div>');
    expect(code).toContain('<div ndsContextMenuRadioItem value="list">Lista</div>');
    expect(code).toContain('<div ndsContextMenuRadioItem value="columns">Colunas</div>');
    expect(code).not.toContain('[checked]');
    // O rótulo fica FORA do grupo, como a story o põe.
    expect(code.indexOf('<div ndsContextMenuLabel>Layout</div>')).toBeLessThan(
      code.indexOf('<div ndsContextMenuRadioGroup'),
    );
  });

  it('contextMenuWithSubmenuSource publica a tríade do segundo nível', () => {
    // `ndsContextMenuSub` guarda o estado, o sub-gatilho é o item que abre, e o
    // `ndsContextMenuSubContent` é o painel filho — outro `<ng-template>`, pelo
    // mesmo motivo do miolo de cima.
    const code = contextMenuWithSubmenuSource();
    expect(code).toContain('<div ndsContextMenuSub>');
    expect(code).toContain('<div ndsContextMenuSubTrigger>Compartilhar</div>');
    expect(code).toContain('<ng-template ndsContextMenuSubContent>');
    expect(code).toContain('</ng-template>');
    // DOIS itens no submenu, como a `play` da story afirma, mais o item do menu
    // pai que fica de fora dele.
    expect(code).toContain('<div ndsContextMenuItem>Editar</div>');
    expect(code).toContain('<div ndsContextMenuItem>Por e-mail</div>');
    expect(code).toContain('<div ndsContextMenuItem>Por link</div>');
    expect(code.match(/<div ndsContextMenuItem[ >]/g)).toHaveLength(3);
    // Sem divisória: a story não tem nenhuma, e o submenu não é bloco à parte.
    expect(code).not.toContain('ndsContextMenuSeparator');
  });

  it('contextMenuCompleteCompositionSource mostra os três blocos convivendo', () => {
    // Os números são os que a `play` da story afirma um a um: três grupos, três
    // rótulos e três divisórias.
    const code = contextMenuCompleteCompositionSource();
    expect(code.match(/<div ndsContextMenuGroup>/g)).toHaveLength(3);
    expect(code.match(/<div ndsContextMenuLabel>/g)).toHaveLength(3);
    expect(code.match(/<div ndsContextMenuSeparator><\/div>/g)).toHaveLength(3);
    expect(code).toContain('<div ndsContextMenuLabel>Ações</div>');
    expect(code).toContain('<div ndsContextMenuLabel>Visualização</div>');
    expect(code).toContain('<div ndsContextMenuLabel>Layout</div>');
    // Marcação e escolha única no mesmo menu — é a convivência que é o assunto.
    expect(code.match(/ndsContextMenuCheckboxItem/g)).toHaveLength(1);
    expect(code.match(/<div ndsContextMenuRadioItem value="/g)).toHaveLength(2);
    // E o submenu dentro do primeiro grupo, com os dois destinos.
    expect(code).toContain('<div ndsContextMenuSubTrigger>Compartilhar</div>');
    expect(code).toContain('<ng-template ndsContextMenuSubContent>');
    // QUATRO itens: Editar, os dois do submenu e a saída destrutiva.
    expect(code.match(/<div ndsContextMenuItem[ >]/g)).toHaveLength(4);
    // Os dois sinais que a classe declara, com os valores iniciais da story.
    expect(code).toContain('  readonly showGrid = signal(true);');
    expect(code).toContain(`  readonly layout = signal('grid');`);
  });
});
