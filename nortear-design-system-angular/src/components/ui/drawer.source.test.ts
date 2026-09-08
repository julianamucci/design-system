import { describe, expect, it } from 'vitest';
import drawerTranslations from '@shared/content/drawer/translations.json';
import * as drawerSourceModule from './drawer.source';
import {
  drawerBottomSource,
  drawerClosedSource,
  drawerControlledSource,
  drawerLeftSource,
  drawerNotDismissibleSource,
  drawerOpenSource,
  drawerPlaygroundSource,
  drawerRightSource,
  drawerTopSource,
  drawerWithConfirmationSource,
  drawerWithFormSource,
  drawerWithScrollSource,
} from './drawer.source';

/**
 * A ausência deste arquivo era o `source_sem_teste` do auditor.
 *
 * O painel Code imprime o `template` da story literalmente — com a interpolação
 * ligada ao objeto de props que o renderer do Angular monta — e essa saída NÃO
 * chega ao DOM durante a `play`: nenhuma suíte de navegador a alcança. O
 * `transform` devolve o uso real, e é aqui que ele tem guarda.
 *
 * A varredura genérica do `source-snippets.test.ts` prova que o snippet importa
 * o que usa e liga só o que a classe declara. O que ela NÃO pode provar é o que
 * este arquivo cobra: omitir o valor padrão, bater com a story ao lado, e não
 * vazar binding que só existe nela.
 */

/**
 * O texto que o conteúdo compartilhado publica, lido do JSON direto.
 *
 * Caminho independente do `t()` que os construtores usam: lá o dicionário passa
 * por achatamento e sobreposição, aqui é acesso cru. Se as duas leituras
 * divergirem, é porque alguma delas mudou de assunto.
 *
 * Locale pt-BR porque é o padrão da escada de negociação quando não há janela —
 * e é o que o projeto `unit` do vitest tem.
 */
function text(path: string): string {
  let node: unknown = (drawerTranslations as Record<string, unknown>)['pt-BR'];
  for (const key of path.split('.')) node = (node as Record<string, unknown>)[key];
  return String(node);
}

const TRIGGER = text('usage.uxWriting.table.trigger.good');
const TITLE = text('usage.uxWriting.table.title.good');
const DESCRIPTION = text('usage.uxWriting.table.description.good');
const CLOSE = text('usage.uxWriting.table.close.good');
const SCROLL_TITLE = text('variants.items.withScroll.name');
const SCROLL_TEXT = text('variants.items.withScroll.use');
const CONFIRMATION_TITLE = text('variants.compositions.withConfirmation.name');

/**
 * Os cinco rótulos que o conteúdo compartilhado NÃO traz.
 *
 * Vêm de `LABELS_DRAWER` em `DrawerDocs.ts`, de onde as stories de composição os
 * leem, e o módulo de snippet os repete numa tabela própria — importar a docs
 * page traria um `@Component` para dentro do projeto `unit`, que roda em node
 * sem o compilador do Angular. Ficam fixados aqui para que a divergência entre
 * as duas cópias apareça como falha, e não como silêncio.
 */
const CONFIRM = 'Salvar alterações';
const DESTROY = 'Excluir';
const FIELD = 'Nome';
const FIELD_EMAIL = 'E-mail';
const DESTROY_MESSAGE = 'Você pode desfazer esta ação nos próximos 30 dias.';

/**
 * Os campos do objeto de `props` que o renderer monta para cada story.
 *
 * Escritos como STRING, e não direto num literal de expressão regular: o portão
 * `identificador_pt_novo` descasca comentário e literal de texto antes de
 * contar, mas não descasca regex.
 */
const STORY_PROPS = [
  'tituloPainel',
  'descricaoPainel',
  'rotuloGatilho',
  'rotuloFechar',
  'rotuloCampo',
  'emailFieldLabel',
  'rotuloConfirmar',
  'rotuloDestruir',
  'rotuloExterno',
  'triggerLabel',
  'paragrafos',
];

/** Interpolação contra campo do renderer — andaime, nunca lição do drawer. */
const STORY_INTERPOLATION = new RegExp(`\\{\\{\\s*(?:${STORY_PROPS.join('|')})\\b`);

/** O espião de output que a `play` do Playground consulta. */
const STORY_SPY = /\(openChange\)="onOpenChange\(/;

// ─── Playground ───────────────────────────────────────────────────────────────

describe('drawerPlaygroundSource', () => {
  it('devolve o componente que se escreve, e não o template da story', () => {
    const code = drawerPlaygroundSource();
    expect(code).toContain("import { NDS_DRAWER } from '@/components/ui/drawer';");
    expect(code).toContain("import { NdsButton } from '@/components/ui/button';");
    expect(code).toContain('imports: [...NDS_DRAWER, NdsButton],');
    expect(code).toContain('<ng-template ndsDrawerContent>');
    expect(code).not.toContain('args.');
    expect(code).not.toMatch(STORY_INTERPOLATION);
    expect(code).not.toMatch(STORY_SPY);
  });

  it('com os controls no padrão, a raiz sai sem atributo nenhum', () => {
    // É esta a premissa do reuso declarado da story DragToDismiss: o drawer
    // canônico é o de raiz limpa. `bottom`, `modal` ligado e `defaultOpen`
    // desligado são o que o componente já faz, e repeti-los ensinaria ruído.
    const code = drawerPlaygroundSource();
    expect(code).toContain('<nds-drawer>');
    expect(code).not.toContain('direction=');
    expect(code).not.toContain('[modal]=');
    expect(code).not.toContain('[defaultOpen]=');
  });

  it('imprime o que difere do padrão, com o valor vindo dos controls', () => {
    const code = drawerPlaygroundSource('', {
      args: { direction: 'right', modal: false, defaultOpen: true, triggerLabel: 'Abrir painel' },
    });
    expect(code).toContain('<nds-drawer direction="right" [defaultOpen]="true" [modal]="false">');
    expect(code).toContain(
      '<button ndsDrawerTrigger ndsButton variant="outline">Abrir painel</button>',
    );
    expect(code).not.toContain(TRIGGER);
  });

  it('publica o par que dá nome e descrição acessíveis ao diálogo', () => {
    // O primitivo liga `aria-labelledby` e `aria-describedby` aos ids REAIS do
    // título e da descrição. Sem eles o painel modal abre anônimo, e nenhum
    // teste de render percebe.
    const code = drawerPlaygroundSource();
    expect(code).toContain(`<h2 ndsDrawerTitle>${TITLE}</h2>`);
    expect(code).toContain(`<p ndsDrawerDescription>${DESCRIPTION}</p>`);
    expect(code).toContain(
      `<button ndsDrawerClose ndsButton variant="outline">${CLOSE}</button>`,
    );
  });
});

// ─── Cobertura das quatro stories ─────────────────────────────────────────────

/**
 * Os doze construtores e a story que cada um serve.
 *
 * A lista existe para ser COBRADA: o caso logo abaixo compara com o que o
 * módulo exporta, e um construtor novo que não entre aqui reprova em vez de sair
 * calado da varredura. É a lição do `source-snippets.test.ts` do Vue, onde 28
 * exports saíram do alcance e a suíte seguiu verde medindo menos.
 *
 * TREZE stories, doze construtores: `States/DragToDismiss` reusa o do
 * Playground, e a exclusão está declarada no cabeçalho de `drawer.source.ts` e
 * cobrada no caso `reuso declarado` no fim deste arquivo.
 */
const CONSTRUCTORS: Array<{
  name: string;
  story: string;
  build: () => string;
  /** A story controlada é a única sem gatilho interno. */
  noTrigger?: true;
  /** A story Closed é a única sem rodapé — ver o docblock do construtor. */
  noFooter?: true;
  /** Os dois snippets com estado próprio: sinal na classe, ponta ligada. */
  stateful?: true;
  /**
   * O único snippet com MÉTODO na classe: a confirmação escolhe o alvo do foco
   * inicial, e o gancho do primitivo pede um handler. Exceção declarada, não
   * silenciosa — o caso abaixo cobra a premissa nos outros onze.
   */
  comMetodo?: true;
}> = [
  { name: 'drawerPlaygroundSource', story: 'Playground', build: drawerPlaygroundSource },
  { name: 'drawerBottomSource', story: 'Variants/Bottom', build: drawerBottomSource },
  { name: 'drawerTopSource', story: 'Variants/Top', build: drawerTopSource },
  { name: 'drawerLeftSource', story: 'Variants/Left', build: drawerLeftSource },
  { name: 'drawerRightSource', story: 'Variants/Right', build: drawerRightSource },
  {
    name: 'drawerWithScrollSource',
    story: 'Variants/WithScroll',
    build: drawerWithScrollSource,
    stateful: true,
  },
  {
    name: 'drawerClosedSource',
    story: 'States/Closed',
    build: drawerClosedSource,
    noFooter: true,
  },
  { name: 'drawerOpenSource', story: 'States/Open', build: drawerOpenSource },
  {
    name: 'drawerControlledSource',
    story: 'States/Controlled',
    build: drawerControlledSource,
    noTrigger: true,
    stateful: true,
  },
  {
    name: 'drawerNotDismissibleSource',
    story: 'States/NotDismissible',
    build: drawerNotDismissibleSource,
  },
  {
    name: 'drawerWithFormSource',
    story: 'Compositions/WithForm',
    build: drawerWithFormSource,
  },
  {
    name: 'drawerWithConfirmationSource',
    story: 'Compositions/WithConfirmation',
    build: drawerWithConfirmationSource,
    comMetodo: true,
  },
];

describe('cobertura das quatro stories', () => {
  it('todo construtor exportado pelo módulo entra na varredura', () => {
    const exported = Object.entries(drawerSourceModule)
      .filter(([, value]) => typeof value === 'function')
      .map(([name]) => name)
      .sort();
    expect(exported).toEqual(CONSTRUCTORS.map((c) => c.name).sort());
  });

  for (const { name, story, build, noTrigger, noFooter, stateful, comMetodo } of CONSTRUCTORS) {
    it(`${name} (${story}) publica o componente, não o andaime da story`, () => {
      const code = build();

      expect(code).not.toContain('args.');
      expect(code).not.toMatch(STORY_INTERPOLATION);
      expect(code).not.toMatch(STORY_SPY);
      // O `data-testid` é endereço de teste, e no Angular o host binding da
      // diretiva apaga atributo estático do template: nomear peça por
      // `data-slot` ensinaria markup que não sobrevive à renderização.
      expect(code).not.toContain('data-testid');
      expect(code).not.toContain('data-slot=');
      // Valor de design em `style` inline não existe no design system.
      expect(code).not.toContain('style=');

      // Uma raiz por snippet, e um miolo em `ng-template`: nó projetado
      // pertence à view de quem consome, e o portal o removeria do DOM sem
      // destruir as diretivas.
      expect(code.match(/<nds-drawer[ >]/g)).toHaveLength(1);
      expect(code.match(/<ng-template ndsDrawerContent>/g)).toHaveLength(1);

      // O par que sustenta o nome e a descrição acessíveis do diálogo — um de
      // cada, sempre, porque é do id REAL deles que o primitivo se serve.
      expect(code.match(/<h2 ndsDrawerTitle>/g)).toHaveLength(1);
      expect(code.match(/<p ndsDrawerDescription>/g)).toHaveLength(1);

      // O que o componente já entrega, e escrever à mão ensinaria API que não
      // existe: papel, modalidade e a ligação do nome saem do primitivo, e a
      // alça é desenhada pelo próprio painel — `aria-hidden`, sem foco.
      expect(code).not.toContain('role="dialog"');
      expect(code).not.toContain('aria-modal');
      expect(code).not.toContain('aria-labelledby');
      expect(code).not.toContain('aria-describedby');
      expect(code).not.toContain('aria-hidden');
      expect(code).not.toContain('nds-drawer-handle');
      expect(code).not.toContain('data-vaul');
      // `tabindex` da região rolável vem da diretiva. Escrito à mão, viraria
      // duas fontes para o mesmo atributo.
      expect(code).not.toContain('tabindex');

      // Valor padrão não se escreve: `bottom` é o padrão de `direction`, e
      // `modal` nasce ligado.
      expect(code).not.toContain('direction="bottom"');
      expect(code).not.toContain('[modal]="true"');

      // Os imports que todo snippet ensina.
      expect(code).toContain("import { NDS_DRAWER } from '@/components/ui/drawer';");
      expect(code).toContain("import { NdsButton } from '@/components/ui/button';");

      if (noTrigger) {
        // Sem gatilho interno é o modo controlado, e só ele: quem abre é o
        // botão de fora.
        expect(code).not.toContain('ndsDrawerTrigger');
      } else {
        expect(code.match(/ndsDrawerTrigger/g)).toHaveLength(1);
        expect(code).toContain(
          `<button ndsDrawerTrigger ndsButton variant="outline">${TRIGGER}</button>`,
        );
      }

      if (noFooter) {
        expect(code).not.toContain('ndsDrawerFooter');
        expect(code).not.toContain('ndsDrawerClose');
      } else {
        // A saída explícita, com o rótulo de cancelamento do conteúdo
        // compartilhado, e uma só por painel.
        expect(code.match(/<div ndsDrawerFooter>/g)).toHaveLength(1);
        expect(code).toContain(
          `<button ndsDrawerClose ndsButton variant="outline">${CLOSE}</button>`,
        );
      }

      // Estado próprio é de dois snippets; nos demais a classe fica vazia, e
      // inventar um sinal ali pediria estado que a story não tem.
      if (stateful) {
        expect(code).toContain('  readonly ');
      } else if (comMetodo) {
        expect(code).not.toContain('readonly ');
        expect(code).toContain('  protected focusSafeExit(event: Event): void {');
      } else {
        expect(code).toContain('export class Exemplo {}');
        expect(code).not.toContain('readonly ');
      }

      // A premissa da exceção, cobrada nos dois sentidos: o gancho de foco é do
      // painel de CONFIRMAÇÃO e de mais nenhum. No painel de formulário o foco
      // segue no primeiro campo, e é isso que o não-conter prova.
      if (comMetodo) {
        expect(code).toContain('(openAutoFocus)="focusSafeExit($event)"');
      } else {
        expect(code).not.toContain('openAutoFocus');
      }
    });
  }
});

// ─── Direções ─────────────────────────────────────────────────────────────────

describe('direções', () => {
  it('drawerBottomSource não escreve a direção padrão, e não desenha a alça', () => {
    // Bottom é o padrão de `direction` — escrevê-lo seria repetir o componente.
    // A alça só aparece nesta direção, e mesmo aqui quem a desenha é o painel.
    const code = drawerBottomSource();
    expect(code).toContain('<nds-drawer>');
    expect(code).not.toContain('direction=');
    expect(code).toContain(`<h2 ndsDrawerTitle>${text('demonstration.labels.bottom')}</h2>`);
  });

  it('as outras três escrevem a direção como atributo simples', () => {
    // `direction` é `input<DrawerDirection>(...)` sem transformação, e o valor é
    // texto: binding por extenso só acrescentaria cerimônia.
    const cases: Array<[() => string, string]> = [
      [drawerTopSource, 'top'],
      [drawerLeftSource, 'left'],
      [drawerRightSource, 'right'],
    ];
    for (const [build, direction] of cases) {
      const code = build();
      expect(code).toContain(`<nds-drawer direction="${direction}">`);
      expect(code).not.toContain(`[direction]=`);
      // O título é o mesmo rótulo que a story mostra ao lado.
      expect(code).toContain(
        `<h2 ndsDrawerTitle>${text(`demonstration.labels.${direction}`)}</h2>`,
      );
    }
  });

  it('as quatro direções publicam painéis distintos', () => {
    // Se duas colapsassem no mesmo texto, uma delas estaria ensinando a direção
    // errada — que é exatamente o defeito que o atributo fixo produz.
    const codes = [
      drawerBottomSource(),
      drawerTopSource(),
      drawerLeftSource(),
      drawerRightSource(),
    ];
    expect(new Set(codes).size).toBe(4);
  });
});

// ─── Estados ──────────────────────────────────────────────────────────────────

describe('estados', () => {
  it('drawerWithScrollSource nomeia a região que rola, e deixa o resto ao componente', () => {
    // `tabindex="0"` e o papel saem da diretiva; o nome NÃO, e sem ele o papel
    // também não sai — nome em elemento sem papel é atributo proibido.
    const code = drawerWithScrollSource();
    expect(code).toContain(
      `<div ndsDrawerBody class="nds-stack" data-spacing="sm" aria-label="${SCROLL_TITLE}">`,
    );
    expect(code).toContain(SCROLL_TEXT);
    expect(code.match(/<div ndsDrawerBody/g)).toHaveLength(1);
    // TRINTA parágrafos, o mesmo número que a story monta — é o que faz o corpo
    // ficar mais alto que o painel, que é o assunto inteiro da story.
    expect(code).toContain('readonly paragraphs = Array.from({ length: 30 }, (_, i) => i + 1);');
    expect(code).toContain('@for (n of paragraphs; track n) {');
    // O rodapé segue na tela com o corpo cheio: é o que separa conteúdo longo
    // de ação fora de alcance.
    expect(code.indexOf('<div ndsDrawerFooter>')).toBeGreaterThan(
      code.indexOf('<div ndsDrawerBody'),
    );
  });

  it('drawerClosedSource é o painel sem prop nenhuma', () => {
    // Fechado é o padrão do componente. O gatilho anuncia o diálogo sem afirmar
    // que ele já está aberto, e quem escreve esse anúncio é a diretiva.
    const code = drawerClosedSource();
    expect(code).toContain('<nds-drawer>');
    expect(code).not.toContain('[defaultOpen]=');
    expect(code).not.toContain('[open]=');
    expect(code).not.toContain('aria-haspopup');
    expect(code).toContain('export class Exemplo {}');
  });

  it('drawerOpenSource escreve defaultOpen, que aqui É o assunto', () => {
    // Nas stories de direção e de composição ele existe para a foto do
    // Chromatic, e por isso fica de fora daqueles snippets.
    const code = drawerOpenSource();
    expect(code).toContain('<nds-drawer [defaultOpen]="true">');
    // Modo NÃO-controlado: quem guarda o estado é o componente.
    expect(code).not.toContain('[open]=');
    expect(code).not.toContain('(openChange)=');
  });

  it('nenhum outro snippet carrega o defaultOpen da captura visual', () => {
    // As stories de direção e de composição nascem abertas para o Chromatic, e
    // esse `[defaultOpen]="true"` é andaime: um drawer de produção não nasce
    // aberto. Se ele vazar para um snippet, este caso reprova nomeando.
    const leaked = CONSTRUCTORS.filter(
      (c) => c.name !== 'drawerOpenSource' && c.build().includes('[defaultOpen]'),
    ).map((c) => c.name);
    expect(leaked).toEqual([]);
  });

  it('drawerControlledSource liga as DUAS pontas, contra um sinal', () => {
    // Ligar só a primeira prenderia o painel ao valor inicial: ele reabriria no
    // ciclo de detecção seguinte a cada tentativa de fechar. E o estado mora num
    // sinal — na story ele é campo comum do objeto de props do renderer, que
    // redesenha só porque quem agenda a detecção ali é o próprio evento.
    const code = drawerControlledSource();
    expect(code).toContain('<nds-drawer [open]="isOpen()" (openChange)="isOpen.set($event)">');
    expect(code).toContain('  readonly isOpen = signal(false);');
    expect(code).toContain(
      '<button ndsButton variant="outline" (click)="isOpen.set(true)">Abrir pelo estado externo</button>',
    );
    // A forma da story, que só funciona contra o objeto de props.
    expect(code).not.toContain('="isOpen = $event"');
    expect(code).not.toContain('="isOpen = true"');
  });

  it('drawerNotDismissibleSource desliga o ponteiro e mantém a saída explícita', () => {
    // Escape continua fechando — o primitivo não oferece desligar o teclado, e
    // painel modal que engole Escape é armadilha de teclado (WCAG 2.1.2). Com o
    // descarte por ponteiro desligado, o botão do rodapé é a saída que sobra.
    const code = drawerNotDismissibleSource();
    expect(code).toContain('<nds-drawer [disablePointerDismissal]="true">');
    expect(code).toContain(
      `<button ndsDrawerClose ndsButton variant="outline">${CLOSE}</button>`,
    );
    // `dismissible` é o nome que o conteúdo compartilhado usa; a prop deste
    // stack é outra, e publicar a de lá ensinaria API que não existe aqui.
    expect(code).not.toContain('dismissible=');
    expect(code).not.toContain('[dismissible]');
  });
});

// ─── Composições ──────────────────────────────────────────────────────────────

describe('composições', () => {
  it('drawerWithFormSource casa o for do rótulo com o id do campo', () => {
    // Sem o par, o campo fica sem nome acessível dentro de um painel modal — e
    // é pelo rótulo que a `play` da story o encontra.
    const code = drawerWithFormSource();
    expect(code).toContain(`<label ndsLabel for="drawer-comp-nome">${FIELD}</label>`);
    expect(code).toContain('<input ndsInput id="drawer-comp-nome" name="nome" value="Maria Souza" />');
    // O SEGUNDO campo, e o motivo de ele existir: é o de e-mail que as play das
    // cinco stacks procuram pelo rótulo, e com um campo só a submissão
    // implícita do navegador esconderia o par id ↔ `form` do rodapé.
    expect(code).toContain(`<label ndsLabel for="drawer-comp-email">${FIELD_EMAIL}</label>`);
    expect(code).toContain(
      '<input ndsInput id="drawer-comp-email" name="email" type="email" value="maria@exemplo.com" />',
    );
    expect(code.match(/<label ndsLabel /g)).toHaveLength(2);
    // O `<form>` e o par id ↔ `form`: sem eles a ação primária não envia nada,
    // e o Enter no campo tampouco. Era a única das cinco stacks sem `<form>`.
    expect(code).toContain('<form id="drawer-comp-form"');
    expect(code).toContain('(submit)="$event.preventDefault()"');
    // As duas peças a mais entram no import e no `imports` do componente.
    expect(code).toContain("import { NdsInput } from '@/components/ui/input';");
    expect(code).toContain("import { NdsLabel } from '@/components/ui/label';");
    expect(code).toContain('imports: [...NDS_DRAWER, NdsButton, NdsInput, NdsLabel],');
    // DUAS ações no rodapé, cancelar primeiro — a ordem de leitura que a `play`
    // da story afirma.
    expect(code).toContain(
      `<button ndsButton type="submit" form="drawer-comp-form">${CONFIRM}</button>`,
    );
    expect(code.indexOf(CLOSE)).toBeLessThan(code.indexOf(CONFIRM));
    // Este corpo não leva nome: sem nome a diretiva não emite papel, e o rótulo
    // do campo já diz o que há ali dentro.
    expect(code).toContain('<div ndsDrawerBody class="nds-stack" data-spacing="sm">');
  });

  it('drawerWithConfirmationSource escreve a consequência e marca a ação', () => {
    // A descrição É a descrição acessível do diálogo: subentender a consequência
    // deixaria quem usa leitor de tela sem ela. E quem escreve a cor de perigo é
    // a variante, nunca uma classe à mão.
    const code = drawerWithConfirmationSource();
    expect(code).toContain(`<h2 ndsDrawerTitle>${CONFIRMATION_TITLE}</h2>`);
    expect(code).toContain(`<p ndsDrawerDescription>${DESTROY_MESSAGE}</p>`);
    expect(code).toContain(`<button ndsButton variant="destructive">${DESTROY}</button>`);
    expect(code.match(/variant="destructive"/g)).toHaveLength(1);
    expect(code).not.toContain('nds-button-destructive');
    // Cancelar continua sendo a saída de menor risco, e vem antes.
    expect(code.indexOf(CLOSE)).toBeLessThan(code.indexOf(DESTROY));
  });
});

// ─── Reuso declarado ──────────────────────────────────────────────────────────

describe('reuso declarado', () => {
  it('States/DragToDismiss é servida pelo construtor do Playground', () => {
    // O gesto de arraste não liga prop nenhuma — ele vem do motor de pointer que
    // o componente já monta —, e o template daquela story é o drawer canônico:
    // fechado, com gatilho, cabeçalho e rodapé. Este caso guarda a PREMISSA: se
    // o Playground passar a escrever atributo por padrão, ou perder o rodapé, o
    // reuso deixa de bater com a story e reprova aqui.
    const code = drawerPlaygroundSource();
    expect(code).toContain('<nds-drawer>');
    expect(code).toContain(
      `<button ndsDrawerTrigger ndsButton variant="outline">${TRIGGER}</button>`,
    );
    expect(code).toContain(
      `<button ndsDrawerClose ndsButton variant="outline">${CLOSE}</button>`,
    );
    // Nada de prop de arraste: o gesto é do componente, e publicar uma aqui
    // ensinaria API inexistente.
    expect(code).not.toContain('swipe');
    expect(code).not.toContain('drag');
  });
});
