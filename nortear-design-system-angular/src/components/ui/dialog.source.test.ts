import { describe, expect, it } from 'vitest';
import dialogTranslations from '@shared/content/dialog/translations.json';
import * as dialogSourceModule from './dialog.source';
import {
  dialogConfirmEmailSource,
  dialogControlledSource,
  dialogCustomCloseInFooterSource,
  dialogMediaPreviewSource,
  dialogNoFooterSource,
  dialogOpenSource,
  dialogPlaygroundSource,
  dialogProfileEditSource,
  dialogWithCloseButtonHiddenSource,
  dialogWithDestructiveActionSource,
  dialogWithFormSource,
  dialogWithScrollContentSource,
  dialogWithScrollingOverlaySource,
} from './dialog.source';

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
 * este arquivo cobra: omitir o valor padrão, bater com a story ao lado, não
 * vazar binding que só existe nela, e manter a ordem dos botões do rodapé.
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
  let node: unknown = (dialogTranslations as Record<string, unknown>)['pt-BR'];
  for (const key of path.split('.')) node = (node as Record<string, unknown>)[key];
  return String(node);
}

const TRIGGER = text('demonstration.labels.triggerLabel');
const TITLE = text('demonstration.labels.title');
const DESCRIPTION = text('demonstration.labels.description');
const ACTION = text('demonstration.labels.action');
const CANCEL = text('demonstration.labels.cancel');

/**
 * Os textos que o SNIPPET repete, e contra os quais as stories são conferidas.
 *
 * Sete deles subiram para `demonstration.labels` e passaram a sair de lá: a
 * story lê a chave, e cravá-los aqui de novo faria o portão medir a cópia velha
 * — mudar o texto no conteúdo compartilhado deixaria o snippet para trás sem
 * uma palavra, que é exatamente a divergência que este arquivo existe para
 * denunciar.
 *
 * Os cinco de baixo continuam cravados porque o conteúdo compartilhado não os
 * tem: são rótulos do convite e da composição de mídia, que só esta stack
 * escreve. Importar um `.stories.ts` traria o renderer do Storybook para
 * dentro do projeto `unit`, que roda em node — por isso a conferência é
 * contra o texto, e não contra a story.
 */
const DESTRUCTIVE_TRIGGER = text('demonstration.labels.removeItemAction');
const DESTRUCTIVE_TITLE = text('demonstration.labels.removeItemTitle');
const DESTRUCTIVE_DESCRIPTION = text('demonstration.labels.removeItemDescription');
const FORM_NAME = text('demonstration.labels.fieldName');
const FORM_EMAIL = text('demonstration.labels.fieldEmail');
const PROFILE_NAME = text('demonstration.labels.fieldFullName');
const PROFILE_USERNAME = text('demonstration.labels.fieldUsername');
const INVITE_TRIGGER = 'Enviar convite';
const INVITE_DESCRIPTION = 'O convite vai para ana&#64;exemplo.com. Você pode reenviar depois.';
const MEDIA_TRIGGER = 'Ver capa';
const MEDIA_TITLE = 'Capa do artigo';
const MEDIA_ALT = 'Padrão geométrico em tons de cinza';

/**
 * Os campos do objeto de `props` que o renderer monta para cada story.
 *
 * Escritos como STRING, e não direto num literal de expressão regular: o portão
 * `identificador_pt_novo` descasca comentário e literal de texto antes de
 * contar, mas não descasca regex.
 */
const STORY_PROPS = [
  'labels',
  'triggerLabel',
  'paragrafo',
  'paragrafos',
  'clausula',
  'clausulas',
  'src',
];

/** Interpolação contra campo do renderer — andaime, nunca lição do diálogo. */
const STORY_INTERPOLATION = new RegExp(`\\{\\{\\s*(?:${STORY_PROPS.join('|')})\\b`);

/** O espião de output do Playground e o campo comum da story controlada. */
const STORY_SPY = /onOpenChange\(|isOpen = \$event/;

/** Os rótulos dos botões do rodapé, na ordem em que estão no DOM. */
function footerLabels(code: string): string[] {
  const bloco = /<div ndsDialogFooter[^>]*>([\s\S]*?)\n\s*<\/div>/.exec(code)?.[1] ?? '';
  return [...bloco.matchAll(/<button[^>]*>([^<]*)<\/button>/g)].map((m) => m[1]!.trim());
}

// ─── Cobertura das quatro stories ─────────────────────────────────────────────

/**
 * Os treze construtores e a story que cada um serve.
 *
 * A lista existe para ser COBRADA: o caso logo abaixo compara com o que o
 * módulo exporta, e um construtor novo que não entre aqui reprova em vez de
 * sair calado da varredura. É a lição do `source-snippets.test.ts` do Vue, onde
 * 28 exports saíram do alcance e a suíte seguiu verde medindo menos.
 *
 * QUINZE stories, treze construtores: `Variants/Default` e `States/Closed`
 * reusam o do Playground, e as duas exclusões estão declaradas no cabeçalho de
 * `dialog.source.ts`, com a premissa cobrada no caso `reuso declarado` no fim
 * deste arquivo.
 */
const CONSTRUCTORS: Array<{
  name: string;
  story: string;
  build: () => string;
  /** Tem `div ndsDialogBody` — as demais são só cabeçalho e rodapé. */
  withBody?: true;
  /** Sem rodapé: nada a confirmar, e o X do canto é a saída. */
  noFooter?: true;
  /** Sem `ndsDialogClose`: quem fecha é o botão que o próprio rodapé desenha. */
  noCancel?: true;
  /** Estado próprio na classe do exemplo: a lista de cláusulas ou o sinal. */
  stateful?: true;
  /** Importa `NdsInput` + `NdsLabel`. */
  withField?: true;
  /** Importa `NdsAspectRatio`. */
  withMedia?: true;
}> = [
  { name: 'dialogPlaygroundSource', story: 'Playground', build: dialogPlaygroundSource },
  {
    name: 'dialogWithFormSource',
    story: 'Variants/WithForm',
    build: dialogWithFormSource,
    withBody: true,
    withField: true,
  },
  {
    name: 'dialogWithScrollContentSource',
    story: 'Variants/WithScrollContent',
    build: dialogWithScrollContentSource,
    withBody: true,
    stateful: true,
  },
  {
    name: 'dialogWithScrollingOverlaySource',
    story: 'Variants/WithScrollingOverlay',
    build: dialogWithScrollingOverlaySource,
    withBody: true,
    stateful: true,
  },
  {
    name: 'dialogNoFooterSource',
    story: 'Variants/NoFooter',
    build: dialogNoFooterSource,
    noFooter: true,
  },
  {
    name: 'dialogWithDestructiveActionSource',
    story: 'Variants/WithDestructiveAction',
    build: dialogWithDestructiveActionSource,
  },
  {
    name: 'dialogCustomCloseInFooterSource',
    story: 'Variants/CustomCloseInFooter',
    build: dialogCustomCloseInFooterSource,
    noCancel: true,
  },
  {
    name: 'dialogConfirmEmailSource',
    story: 'Variants/ConfirmEmail',
    build: dialogConfirmEmailSource,
  },
  { name: 'dialogOpenSource', story: 'States/Open', build: dialogOpenSource },
  {
    name: 'dialogWithCloseButtonHiddenSource',
    story: 'States/WithCloseButtonHidden',
    build: dialogWithCloseButtonHiddenSource,
  },
  {
    name: 'dialogControlledSource',
    story: 'States/Controlled',
    build: dialogControlledSource,
    stateful: true,
  },
  {
    name: 'dialogProfileEditSource',
    story: 'Compositions/ProfileEdit',
    build: dialogProfileEditSource,
    withBody: true,
    withField: true,
  },
  {
    name: 'dialogMediaPreviewSource',
    story: 'Compositions/MediaPreview',
    build: dialogMediaPreviewSource,
    withBody: true,
    noFooter: true,
    withMedia: true,
  },
];

describe('cobertura das quatro stories', () => {
  it('todo construtor exportado pelo módulo entra na varredura', () => {
    const exported = Object.entries(dialogSourceModule)
      .filter(([, value]) => typeof value === 'function')
      .map(([name]) => name)
      .sort();
    expect(exported).toEqual(CONSTRUCTORS.map((c) => c.name).sort());
  });

  for (const c of CONSTRUCTORS) {
    it(`${c.name} (${c.story}) publica o componente, não o andaime da story`, () => {
      const code = c.build();

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

      // Uma raiz, um portal, um véu e um painel por snippet. O miolo mora no
      // `ng-template`: fechado, nada do conteúdo existe no DOM.
      expect(code.match(/<div ndsDialog[ >]/g)).toHaveLength(1);
      expect(code.match(/<ng-template ndsDialogPortal>/g)).toHaveLength(1);
      expect(code.match(/<div ndsDialogOverlay[ >]/g)).toHaveLength(1);
      expect(code.match(/<div ndsDialogContent[ >]/g)).toHaveLength(1);

      // O par que sustenta o nome e a descrição acessíveis do diálogo — um de
      // cada, sempre, porque é do id REAL deles que o primitivo se serve.
      expect(code.match(/<div ndsDialogHeader>/g)).toHaveLength(1);
      expect(code.match(/<h2 ndsDialogTitle>/g)).toHaveLength(1);
      expect(code.match(/<p ndsDialogDescription>/g)).toHaveLength(1);

      // O gatilho, e um só: é ele que devolve o foco no fechamento.
      expect(code.match(/ndsDialogTrigger/g)).toHaveLength(1);

      // O que o componente já entrega, e escrever à mão ensinaria API que não
      // existe: papel, modalidade e a ligação do nome saem do primitivo, e o X
      // do canto é desenhado pelo próprio painel.
      expect(code).not.toContain('role="dialog"');
      expect(code).not.toContain('aria-modal');
      expect(code).not.toContain('aria-labelledby');
      expect(code).not.toContain('aria-describedby');
      expect(code).not.toContain('nds-dialog-close');
      expect(code).not.toContain('aria-haspopup');

      // O que é do AlertDialog, e não daqui: papel de alerta, véu que não
      // dispensa e foco inicial no cancelar. Publicar qualquer um destes
      // ensinaria a imitar o outro componente em vez de trocar de componente.
      expect(code).not.toContain('alertdialog');
      expect(code).not.toContain('disablePointerDismissal');
      expect(code).not.toContain('openAutoFocus');

      // Valor padrão não se escreve. `closeLabel` já vale `Fechar` nos dois
      // lugares em que existe, `modal` nasce ligado e o X do painel também.
      expect(code).not.toContain('closeLabel');
      expect(code).not.toContain('[modal]="true"');
      expect(code).not.toContain('[defaultOpen]="false"');
      expect(code).not.toContain('<div ndsDialogContent [showCloseButton]="true"');

      // Os imports que todo snippet ensina, e os dois que só alguns pedem.
      expect(code).toContain("import { NDS_DIALOG } from '@/components/ui/dialog';");
      expect(code).toContain("import { NdsButton } from '@/components/ui/button';");

      if (c.withField) {
        expect(code).toContain("import { NdsInput } from '@/components/ui/input';");
        expect(code).toContain("import { NdsLabel } from '@/components/ui/label';");
        expect(code).toContain('imports: [...NDS_DIALOG, NdsButton, NdsInput, NdsLabel],');
      } else {
        expect(code).not.toContain('NdsInput');
        expect(code).not.toContain('NdsLabel');
      }

      if (c.withMedia) {
        expect(code).toContain("import { NdsAspectRatio } from '@/components/ui/aspect-ratio';");
        expect(code).toContain('imports: [...NDS_DIALOG, NdsButton, NdsAspectRatio],');
      } else {
        expect(code).not.toContain('NdsAspectRatio');
      }

      if (c.withBody) {
        expect(code.match(/<div\n?\s*ndsDialogBody/g)).toHaveLength(1);
      } else {
        expect(code).not.toContain('ndsDialogBody');
      }

      if (c.noFooter) {
        expect(code).not.toContain('ndsDialogFooter');
        expect(code).not.toContain('ndsDialogClose');
      } else {
        expect(code.match(/<div ndsDialogFooter/g)).toHaveLength(1);

        // A ORDEM da guideline 04, e ela é o assunto: no DOM o secundário vem
        // primeiro e a ação primária por último. A folha é que põe a primária
        // em cima no empilhamento e à direita no lado a lado — inverter aqui
        // inverteria a tela. No Drawer três stacks estavam invertidas, e uma
        // delas tinha teste VERDE cobrando a inversão.
        const labels = footerLabels(code);
        if (c.noCancel) {
          // O fechar deste rodapé é desenhado pelo próprio `NdsDialogFooter`, e
          // não se escreve: sobra a ação primária.
          expect(code).not.toContain('ndsDialogClose');
          expect(labels).toEqual([ACTION]);
        } else {
          expect(code.match(/ndsDialogClose/g)).toHaveLength(1);
          expect(labels[0]).toBe(CANCEL);
          expect(labels).toHaveLength(2);
        }
      }

      // Estado próprio é de três snippets; nos demais a classe fica vazia, e
      // inventar um membro ali pediria estado que a story não tem.
      if (c.stateful) {
        expect(code).toContain('  readonly ');
      } else {
        expect(code).toContain('export class Exemplo {}');
        expect(code).not.toContain('readonly ');
      }
    });
  }

  it('nenhum outro snippet carrega o defaultOpen da captura visual', () => {
    // As stories de variante e de composição nascem abertas para o Chromatic, e
    // esse `[defaultOpen]="true"` é andaime: um diálogo de produção não nasce
    // aberto. Se ele vazar para um snippet, este caso reprova nomeando.
    const leaked = CONSTRUCTORS.filter(
      (c) => c.name !== 'dialogOpenSource' && c.build().includes('[defaultOpen]'),
    ).map((c) => c.name);
    expect(leaked).toEqual([]);
  });
});

// ─── Playground ───────────────────────────────────────────────────────────────

describe('dialogPlaygroundSource', () => {
  it('devolve o componente que se escreve, e não o template da story', () => {
    const code = dialogPlaygroundSource();
    expect(code).toContain('imports: [...NDS_DIALOG, NdsButton],');
    expect(code).toContain('<ng-template ndsDialogPortal>');
    expect(code).toContain(`<h2 ndsDialogTitle>${TITLE}</h2>`);
    expect(code).toContain(`<p ndsDialogDescription>${DESCRIPTION}</p>`);
  });

  it('com os controls no padrão, a raiz e o painel saem sem atributo nenhum', () => {
    // É esta a premissa das duas exclusões declaradas — ver o caso `reuso
    // declarado` no fim do arquivo.
    const code = dialogPlaygroundSource();
    expect(code).toContain('<div ndsDialog>');
    expect(code).toContain('<div ndsDialogContent>');
    expect(code).not.toContain('[defaultOpen]=');
    expect(code).not.toContain('[modal]=');
    expect(code).not.toContain('[showCloseButton]=');
  });

  it('imprime o que difere do padrão, com o valor vindo dos controls', () => {
    const code = dialogPlaygroundSource('', {
      args: {
        defaultOpen: true,
        modal: false,
        showCloseButton: false,
        triggerLabel: 'Abrir diálogo',
      },
    });
    expect(code).toContain('<div ndsDialog [defaultOpen]="true" [modal]="false">');
    expect(code).toContain('<div ndsDialogContent [showCloseButton]="false">');
    expect(code).toContain(
      '<button ndsDialogTrigger ndsButton variant="outline">Abrir diálogo</button>',
    );
    // O rótulo padrão sai do GATILHO, e só de lá: `demonstration.labels.title`
    // vale o mesmo texto, e continua no cabeçalho. Um `not.toContain(TRIGGER)`
    // solto reprovaria por causa do título — asserção por substring casa onde
    // não devia.
    expect(code).not.toContain(`ndsDialogTrigger ndsButton variant="outline">${TRIGGER}<`);
  });

  it('o rodapé traz o par de ações na ordem da guideline 04', () => {
    // Secundário primeiro no DOM, primária por último. É o mesmo par que a
    // `play` da story clica pelo nome acessível.
    const code = dialogPlaygroundSource();
    expect(code).toContain(
      `<button ndsDialogClose ndsButton variant="outline">${CANCEL}</button>`,
    );
    expect(code).toContain(`<button ndsButton>${ACTION}</button>`);
    expect(footerLabels(code)).toEqual([CANCEL, ACTION]);
  });
});

// ─── Variantes ────────────────────────────────────────────────────────────────

describe('variantes', () => {
  it('dialogWithFormSource casa o for do rótulo com o id do campo', () => {
    // Sem o par, o campo fica sem nome acessível dentro de um painel modal — e
    // é pelo rótulo que a `play` da story o encontra.
    const code = dialogWithFormSource();
    expect(code).toContain(`<label ndsLabel for="dlg-nome">${FORM_NAME}</label>`);
    expect(code).toContain('<input ndsInput id="dlg-nome" name="name" value="Ana Ribeiro" />');
    expect(code).toContain(`<label ndsLabel for="dlg-email">${FORM_EMAIL}</label>`);
    expect(code).toContain(
      '<input ndsInput id="dlg-email" name="email" type="email" value="ana@exemplo.com" />',
    );
    // O corpo desta variante não rola: sem classe de rolagem, sem parada de
    // tabulação e sem papel — o que rola é a variante de baixo.
    expect(code).not.toContain('nds-dialog-body-scroll');
    expect(code).not.toContain('tabindex');
    expect(code).not.toContain('role=');
  });

  it('dialogWithFormSource põe o rodapé DENTRO do form, como a story', () => {
    // O defeito que este caso guarda: a story escrevia `type="submit"` e o
    // arquivo inteiro não tinha um `<form>`. Botão de submissão fora de form
    // não submete nada, e o Enter no campo não faz nada — numa variante cujo
    // assunto É o formulário.
    const code = dialogWithFormSource();
    expect(code).toContain('<form (submit)="$event.preventDefault()">');
    expect(code.indexOf('<form')).toBeLessThan(code.indexOf('<div ndsDialogBody'));
    expect(code.indexOf('<div ndsDialogFooter>')).toBeLessThan(code.indexOf('</form>'));
    expect(code).toContain(`<button ndsButton type="submit">${ACTION}</button>`);
    expect(footerLabels(code)).toEqual([CANCEL, ACTION]);
  });

  it('dialogWithScrollContentSource nomeia a região que rola, e a torna alcançável', () => {
    // ROTA A: os três atributos andam juntos, e nenhum vem do componente. Sem
    // `tabindex` quem navega só por teclado não alcança a caixa (WCAG 2.1.1), e
    // parada de tabulação sem papel e sem nome não diz o que é.
    const code = dialogWithScrollContentSource();
    expect(code).toContain('class="nds-dialog-body-scroll nds-stack"');
    expect(code).toContain('tabindex="0"');
    expect(code).toContain('role="group"');
    expect(code).toContain(`aria-label="${TITLE}"`);
    // VINTE cláusulas, o mesmo número que a story monta — com texto curto o
    // conteúdo cabia inteiro no teto de 60vh e a rota não acontecia.
    expect(code).toContain('readonly clauses = Array.from({ length: 20 }, (_, i) => i + 1);');
    expect(code).toContain('@for (n of clauses; track n) {');
    // Cabeçalho e rodapé ficam parados, e por isso continuam no snippet.
    expect(code.indexOf('<div ndsDialogFooter')).toBeGreaterThan(code.indexOf('ndsDialogBody'));
    // Rota A: o painel é IRMÃO do véu, nunca filho.
    expect(code).toContain('<div ndsDialogOverlay></div>');
    expect(code).not.toContain('ndsDialogOverlay scroll');
  });

  it('dialogWithScrollingOverlaySource aninha o painel DENTRO do véu', () => {
    // ROTA B: rolagem de um elemento só alcança o que está dentro dele. Com os
    // dois como irmãos as classes chegam e o véu não tem o que rolar — medido
    // contra a folha compartilhada.
    const code = dialogWithScrollingOverlaySource();
    expect(code).toContain('<div ndsDialogOverlay scroll>');
    expect(code).toContain('<div ndsDialogContent scroll>');
    expect(code.indexOf('<div ndsDialogOverlay scroll>')).toBeLessThan(
      code.indexOf('<div ndsDialogContent scroll>'),
    );
    expect(code).not.toContain('<div ndsDialogOverlay></div>');
    // Nesta rota não há região rolável aninhada para alcançar por teclado.
    expect(code).not.toContain('nds-dialog-body-scroll');
    expect(code).not.toContain('tabindex');
    expect(code).not.toContain('role=');
    expect(code).toContain('readonly clauses = Array.from({ length: 20 }, (_, i) => i + 1);');
  });

  it('as duas rotas de rolagem publicam painéis distintos', () => {
    // Se colapsassem no mesmo texto, uma delas estaria ensinando a outra rota —
    // que é exatamente o defeito de as duas terem circulado sob o mesmo rótulo.
    expect(dialogWithScrollContentSource()).not.toBe(dialogWithScrollingOverlaySource());
  });

  it('dialogNoFooterSource não escreve nada para ter o X do canto', () => {
    // Sem rodapé, o X é a única saída visível — e ele vem do componente, com
    // `showCloseButton` ligado por padrão.
    const code = dialogNoFooterSource();
    expect(code).not.toContain('ndsDialogFooter');
    expect(code).not.toContain('showCloseButton');
    expect(code).toContain('<div ndsDialogContent>');
  });

  it('dialogWithDestructiveActionSource marca a ação e mantém o Cancelar antes', () => {
    // Quem escreve a cor de perigo é a variante, nunca uma classe à mão. E o
    // Cancelar continua sendo a saída de menor risco, primeiro no DOM.
    const code = dialogWithDestructiveActionSource();
    expect(code).toContain(`<h2 ndsDialogTitle>${DESTRUCTIVE_TITLE}</h2>`);
    expect(code).toContain(`<p ndsDialogDescription>${DESTRUCTIVE_DESCRIPTION}</p>`);
    expect(code).toContain(
      `<button ndsButton variant="destructive">${DESTRUCTIVE_TRIGGER}</button>`,
    );
    expect(code.match(/variant="destructive"/g)).toHaveLength(1);
    expect(code).not.toContain('nds-button-destructive');
    expect(footerLabels(code)).toEqual([CANCEL, DESTRUCTIVE_TRIGGER]);
  });

  it('dialogCustomCloseInFooterSource desliga o X do canto e liga o do rodapé', () => {
    // `showCloseButton` existe nos DOIS lugares e faz coisas diferentes: no
    // painel nasce ligado, no rodapé nasce desligado. Trocar os dois é a
    // composição inteira desta variante.
    const code = dialogCustomCloseInFooterSource();
    expect(code).toContain('<div ndsDialogContent [showCloseButton]="false">');
    expect(code).toContain('<div ndsDialogFooter [showCloseButton]="true">');
    expect(code).toContain(`<button ndsButton>${ACTION}</button>`);
  });

  it('dialogConfirmEmailSource mantém a ação primária neutra', () => {
    // Operação reversível: variante destrutiva aqui gritaria perigo onde não há
    // — o convite pode ser reenviado, e a descrição diz isso.
    const code = dialogConfirmEmailSource();
    expect(code).toContain(`<h2 ndsDialogTitle>${INVITE_TRIGGER}</h2>`);
    expect(code).toContain(`<p ndsDialogDescription>${INVITE_DESCRIPTION}</p>`);
    expect(code).not.toContain('variant="destructive"');
    expect(footerLabels(code)).toEqual([CANCEL, INVITE_TRIGGER]);
    // O arroba escapado: em texto de template do Angular ele abre bloco de
    // controle, e é assim que a story o escreve.
    expect(code).not.toContain('ana@exemplo.com. Você pode');
  });
});

// ─── Estados ──────────────────────────────────────────────────────────────────

describe('estados', () => {
  it('dialogOpenSource escreve defaultOpen, que aqui É o assunto', () => {
    // Nas stories de variante e de composição ele existe para a foto do
    // Chromatic, e por isso fica de fora daqueles snippets.
    const code = dialogOpenSource();
    expect(code).toContain('<div ndsDialog [defaultOpen]="true">');
    // Modo NÃO-controlado: quem guarda o estado é o componente.
    expect(code).not.toContain('[open]=');
    expect(code).not.toContain('(openChange)=');
  });

  it('dialogWithCloseButtonHiddenSource tira o X e mantém as duas saídas', () => {
    // Escape continua fechando — painel modal que engole Escape é armadilha de
    // teclado (WCAG 2.1.2) —, e o Cancelar do rodapé segue de pé. Nunca se tira
    // toda saída junto com o X.
    const code = dialogWithCloseButtonHiddenSource();
    expect(code).toContain('<div ndsDialogContent [showCloseButton]="false">');
    expect(code).toContain(
      `<button ndsDialogClose ndsButton variant="outline">${CANCEL}</button>`,
    );
  });

  it('dialogControlledSource liga as DUAS pontas, contra um sinal', () => {
    // Ligar só a primeira prenderia o painel ao valor inicial: ele reabriria no
    // ciclo de detecção seguinte a cada tentativa de fechar. E o estado mora num
    // sinal — na story ele é campo comum do objeto de props do renderer, que
    // redesenha só porque quem agenda a detecção ali é o próprio evento.
    const code = dialogControlledSource();
    expect(code).toContain('<div ndsDialog [open]="isOpen()" (openChange)="isOpen.set($event)">');
    expect(code).toContain('  readonly isOpen = signal(false);');
    // A forma da story, que só funciona contra o objeto de props.
    expect(code).not.toContain('="isOpen = $event"');
  });
});

// ─── Composições ──────────────────────────────────────────────────────────────

describe('composições', () => {
  it('dialogProfileEditSource põe o rodapé DENTRO do form', () => {
    // É o que separa esta composição de um painel com dois botões soltos: o
    // Enter em qualquer campo tem de disparar o envio, e para isso o botão de
    // submissão precisa estar dentro do `form`.
    const code = dialogProfileEditSource();
    expect(code).toContain('<form (submit)="$event.preventDefault()">');
    expect(code.indexOf('<form')).toBeLessThan(code.indexOf('<div ndsDialogFooter>'));
    expect(code.indexOf('<div ndsDialogFooter>')).toBeLessThan(code.indexOf('</form>'));
    expect(code).toContain(`<label ndsLabel for="profile-name">${PROFILE_NAME}</label>`);
    expect(code).toContain(
      '<input ndsInput id="profile-name" name="name" value="Maria Silva" />',
    );
    expect(code).toContain(`<label ndsLabel for="profile-username">${PROFILE_USERNAME}</label>`);
    expect(code).toContain(
      '<input ndsInput id="profile-username" name="username" value="@mariasilva" />',
    );
    // O ÚNICO tipo que difere do padrão. O `RdxButtonDirective` que vem com o
    // `ndsButton` liga `[attr.type]` com padrão `button`, e o `RdxDialogClose`
    // fixa o mesmo valor: escrever `type="button"` no Cancelar repetiria o
    // padrão, e por isso o snippet não o escreve.
    expect(code).toContain(`<button ndsButton type="submit">${ACTION}</button>`);
    expect(code).not.toContain('type="button"');
    expect(footerLabels(code)).toEqual([CANCEL, ACTION]);
  });

  it('dialogMediaPreviewSource descreve a mídia e dispensa o rodapé', () => {
    // A imagem carrega a informação do diálogo — `alt` vazio apagaria o conteúdo
    // inteiro para quem usa leitor de tela. E não há o que confirmar: sem
    // rodapé, o X do canto é a saída.
    const code = dialogMediaPreviewSource();
    expect(code).toContain(
      `<button ndsDialogTrigger ndsButton variant="outline">${MEDIA_TRIGGER}</button>`,
    );
    expect(code).toContain(`<h2 ndsDialogTitle>${MEDIA_TITLE}</h2>`);
    expect(code).toContain('<div ndsAspectRatio [ratio]="16 / 9">');
    expect(code).toContain(`alt="${MEDIA_ALT}"`);
    expect(code).not.toContain('ndsDialogFooter');
    // O SVG em data URI é da story, e existe para ela não depender de rede:
    // publicá-lo encheria o painel de base64 sem ensinar nada.
    expect(code).not.toContain('data:image/svg+xml');
    expect(code).not.toContain('[src]=');
  });
});

// ─── Reuso declarado ──────────────────────────────────────────────────────────

describe('reuso declarado', () => {
  it('Variants/Default e States/Closed são servidas pelo construtor do Playground', () => {
    // As duas stories mostram o diálogo canônico: raiz sem atributo, gatilho,
    // cabeçalho com o par título/descrição e rodapé com o par de ações. O
    // `[defaultOpen]="true"` da Default é a captura do Chromatic, e não entra em
    // snippet; a Closed não escreve prop nenhuma, porque fechado é o padrão.
    //
    // Este caso guarda a PREMISSA: se o Playground passar a escrever atributo
    // por padrão, ou perder o rodapé, o reuso deixa de bater com as duas stories
    // e reprova aqui, em vez de continuar quieto.
    const code = dialogPlaygroundSource();
    expect(code).toContain('<div ndsDialog>');
    expect(code).toContain('<div ndsDialogContent>');
    expect(code).toContain(
      `<button ndsDialogTrigger ndsButton variant="outline">${TRIGGER}</button>`,
    );
    expect(code).toContain(`<h2 ndsDialogTitle>${TITLE}</h2>`);
    expect(code).toContain(`<p ndsDialogDescription>${DESCRIPTION}</p>`);
    expect(footerLabels(code)).toEqual([CANCEL, ACTION]);
    // Nada de corpo: as duas stories mostram só cabeçalho e rodapé.
    expect(code).not.toContain('ndsDialogBody');
  });
});
