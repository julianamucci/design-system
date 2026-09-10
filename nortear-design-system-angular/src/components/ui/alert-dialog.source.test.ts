import { describe, expect, it } from 'vitest';
import alertDialogTranslations from '@shared/content/alert-dialog/translations.json';
import * as alertDialogSourceModule from './alert-dialog.source';
import {
  alertDialogControlledSource,
  alertDialogDestructiveSource,
  alertDialogExtraClassSource,
  alertDialogHeadingH3Source,
  alertDialogLongDescriptionSource,
  alertDialogNeutralSource,
  alertDialogPlaygroundSource,
  alertDialogWithMediaSource,
  alertDialogWithoutDescriptionSource,
} from './alert-dialog.source';
import { LONG_DESCRIPTION, WITHOUT_DESCRIPTION_LABELS } from './alert-dialog.fixtures';

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
 * este arquivo cobra: omitir o que o primitivo já entrega, bater com a story ao
 * lado, não vazar andaime de teste, e manter a saída segura ANTES da
 * confirmação.
 */

/**
 * O texto que o conteúdo compartilhado publica, lido do JSON direto.
 *
 * Caminho independente do `t()` que as fixtures usam: lá o dicionário passa
 * por achatamento e sobreposição, aqui é acesso cru. Se as duas leituras
 * divergirem, é porque alguma delas mudou de assunto.
 *
 * Locale pt-BR porque é o padrão da escada de negociação quando não há janela —
 * e é o que o projeto `unit` do vitest tem.
 */
function text(path: string): string {
  let node: unknown = (alertDialogTranslations as Record<string, unknown>)['pt-BR'];
  for (const key of path.split('.')) node = (node as Record<string, unknown>)[key];
  return String(node);
}

const TRIGGER = text('demonstration.labels.triggerLabel');
const TITLE = text('demonstration.labels.title');
const DESCRIPTION = text('demonstration.labels.description');
const CANCEL = text('demonstration.labels.cancel');
const ACTION = text('demonstration.labels.action');

/**
 * Os campos do objeto de `props` que o renderer monta para as stories.
 *
 * Escritos como STRING, e não direto num literal de expressão regular: o portão
 * `identificador_pt_novo` descasca comentário e literal de texto antes de
 * contar, mas não descasca regex.
 */
const STORY_PROPS = [
  'labels',
  'longDescription',
  'triggerLabel',
  'title',
  'description',
  'cancelLabel',
  'actionLabel',
  'tone',
  'showMedia',
  'panelClass',
  'defaultOpen',
];

/** Interpolação ou binding contra campo do renderer — andaime, nunca lição do componente. */
const STORY_BINDING = new RegExp(`\\{\\{\\s*(?:${STORY_PROPS.join('|')})\\b|="(?:${STORY_PROPS.join('|')})\\b`);

/** Os espiões das stories, que só existem dentro delas. */
const STORY_SPY = /onOpenChange\(|onConfirm\(|Spy\b/;

/** Os rótulos dos botões do rodapé, na ordem em que estão no DOM. */
function footerLabels(code: string): string[] {
  const block = /<div ndsAlertDialogFooter[^>]*>([\s\S]*?)\n\s*<\/div>/.exec(code)?.[1] ?? '';
  return [...block.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/g)].map((m) => m[1]!.trim());
}

// ─── Cobertura das stories ────────────────────────────────────────────────────

/**
 * Cada construtor e as stories que ele serve.
 *
 * A lista existe para ser COBRADA: o caso logo abaixo compara com o que o
 * módulo exporta, e um construtor novo que não entre aqui reprova em vez de
 * sair calado da varredura. É a lição do `source-snippets.test.ts` do Vue, onde
 * 28 exports saíram do alcance e a suíte seguiu verde medindo menos.
 *
 * O que muda de construtor para construtor se DECLARA — nível do título,
 * presença de descrição, gatilho interno — em vez de a asserção afrouxar para
 * caber a exceção: a varredura que aceita qualquer forma deixaria passar calada
 * a forma acidental.
 */
const CONSTRUCTORS: Array<{
  name: string;
  stories: string[];
  build: () => string;
  titleTag?: 'h3';
  /** A story omite a descrição de propósito (D4). */
  withoutDescription?: true;
  /** O estado mora no pai, e o botão que abre fica fora da raiz. */
  withoutTrigger?: true;
}> = [
  { name: 'alertDialogPlaygroundSource', stories: ['Playground'], build: alertDialogPlaygroundSource },
  {
    name: 'alertDialogDestructiveSource',
    stories: [
      'States/Closed',
      'States/Open',
      'States/Confirmed',
      'States/Cancelled',
      'Variants/Destructive',
      'Variants/Responsive',
    ],
    build: alertDialogDestructiveSource,
  },
  {
    name: 'alertDialogControlledSource',
    stories: ['States/Controlled'],
    build: alertDialogControlledSource,
    withoutTrigger: true,
  },
  { name: 'alertDialogNeutralSource', stories: ['Variants/Neutral'], build: alertDialogNeutralSource },
  { name: 'alertDialogWithMediaSource', stories: ['Variants/WithMedia'], build: alertDialogWithMediaSource },
  {
    name: 'alertDialogWithoutDescriptionSource',
    stories: ['Variants/WithoutDescription'],
    build: alertDialogWithoutDescriptionSource,
    withoutDescription: true,
  },
  {
    name: 'alertDialogLongDescriptionSource',
    stories: ['Variants/LongDescription'],
    build: alertDialogLongDescriptionSource,
  },
  { name: 'alertDialogExtraClassSource', stories: ['Variants/ExtraClass'], build: alertDialogExtraClassSource },
  {
    name: 'alertDialogHeadingH3Source',
    stories: ['Variants/HeadingH3'],
    build: alertDialogHeadingH3Source,
    titleTag: 'h3',
  },
];

describe('cobertura das stories', () => {
  it('todo construtor exportado pelo módulo entra na varredura', () => {
    const exported = Object.entries(alertDialogSourceModule)
      .filter(([, value]) => typeof value === 'function')
      .map(([name]) => name)
      .sort();
    expect(exported).toEqual(CONSTRUCTORS.map((c) => c.name).sort());
  });

  it('as catorze stories dos três arquivos têm construtor, e só um cada', () => {
    // Playground + 5 estados + 8 variantes. Story sem construtor volta a
    // imprimir o template cru no painel Code — o `story_file_sem_transform`
    // do auditor olha o arquivo, e esta lista olha a story.
    const stories = CONSTRUCTORS.flatMap((c) => c.stories).sort();
    expect(stories).toEqual(
      [
        'Playground',
        'States/Closed',
        'States/Open',
        'States/Confirmed',
        'States/Cancelled',
        'States/Controlled',
        'Variants/Destructive',
        'Variants/Neutral',
        'Variants/WithMedia',
        'Variants/WithoutDescription',
        'Variants/LongDescription',
        'Variants/Responsive',
        'Variants/ExtraClass',
        'Variants/HeadingH3',
      ].sort(),
    );
  });

  for (const c of CONSTRUCTORS) {
    it(`${c.name} (${c.stories.join(', ')}) publica o componente, não o andaime da story`, () => {
      const code = c.build();

      expect(code).not.toContain('args.');
      expect(code).not.toMatch(STORY_BINDING);
      expect(code).not.toMatch(STORY_SPY);
      // O `data-testid` é endereço de teste, e no Angular o host binding da
      // diretiva apaga atributo estático do template: nomear peça por
      // `data-slot` ensinaria markup que não sobrevive à renderização.
      expect(code).not.toContain('data-testid');
      expect(code).not.toContain('data-slot=');
      // Valor de design em `style` inline não existe no design system.
      expect(code).not.toContain('style=');
      // O ícone é o do design system; desenho à mão não se copia.
      expect(code).not.toContain('<path');

      // Uma raiz por snippet e um miolo em `ng-template`: fechado, nada do
      // conteúdo existe no DOM.
      expect(code.match(/<nds-alert-dialog[ >]/g)).toHaveLength(1);
      expect(code.match(/<ng-template ndsAlertDialogContent>/g)).toHaveLength(1);

      // O título, um só, no nível DECLARADO — `h2` por padrão.
      const titleTag = c.titleTag ?? 'h2';
      expect(code.match(new RegExp(`<${titleTag} ndsAlertDialogTitle>`, 'g'))).toHaveLength(1);
      expect(code.match(/<h[1-6] ndsAlertDialogTitle>/g)).toHaveLength(1);

      // A descrição, quando a story a tem; sem ela, nenhum parágrafo vazio.
      expect(code.match(/<p ndsAlertDialogDescription>/g) ?? []).toHaveLength(
        c.withoutDescription ? 0 : 1,
      );

      // O gatilho interno é quem devolve o foco no fechamento. No modo
      // controlado ele não existe, e o foco volta ao botão de fora.
      expect(code.match(/ndsAlertDialogTrigger/g) ?? []).toHaveLength(c.withoutTrigger ? 0 : 1);

      // O que o componente já entrega, e escrever à mão ensinaria API que não
      // existe: papel de alerta, modalidade, vínculos do nome e da descrição,
      // e o foco inicial no Cancelar.
      expect(code).not.toContain('role="alertdialog"');
      expect(code).not.toContain('aria-modal');
      expect(code).not.toContain('aria-labelledby');
      expect(code).not.toContain('aria-describedby');
      expect(code).not.toMatch(/autofocus|cdkFocusInitial|\.focus\(/i);

      // Nenhum trecho nasce aberto por padrão: nas stories é andaime de
      // captura, e quem copia quer o diálogo comandado pelo gatilho. Só o
      // Playground o escreve, e só com o control ligado — caso próprio abaixo.
      expect(code).not.toContain('defaultOpen');

      // A saída segura vem ANTES da confirmação, no DOM: é a ordem de leitura e
      // de tabulação, e é sobre ela que a folha trabalha (`column-reverse` no
      // estreito, `row` no largo). Inverter aqui inverteria a tela.
      expect(code.match(/<div ndsAlertDialogFooter>/g)).toHaveLength(1);
      expect(code.match(/ndsAlertDialogCancel/g)).toHaveLength(1);
      expect(code.match(/ndsAlertDialogAction/g)).toHaveLength(1);
      expect(code.indexOf('ndsAlertDialogCancel')).toBeLessThan(
        code.indexOf('ndsAlertDialogAction'),
      );
      expect(code).toContain('<button ndsAlertDialogCancel ndsButton variant="outline">');

      // Os imports que todo snippet ensina.
      expect(code).toContain("import { NDS_ALERT_DIALOG } from '@/components/ui/alert-dialog';");
      expect(code).toContain("import { NdsButton } from '@/components/ui/button';");

      // A ação de negócio roda no método da classe; quem FECHA é o primitivo.
      const method = /ndsAlertDialogAction[^>]*\(click\)="(\w+)\(\)"/.exec(code)?.[1];
      expect(method).toBeTruthy();
      expect(code).toContain(`  ${method}(): void {`);
    });
  }
});

// ─── Playground ───────────────────────────────────────────────────────────────

describe('alertDialogPlaygroundSource', () => {
  it('sem args, é a confirmação destrutiva canônica', () => {
    expect(alertDialogPlaygroundSource()).toBe(alertDialogDestructiveSource());
  });

  it('devolve o componente que se escreve, com os valores vindos dos controls', () => {
    const code = alertDialogPlaygroundSource('', {
      args: {
        triggerLabel: TRIGGER,
        title: TITLE,
        description: DESCRIPTION,
        cancelLabel: CANCEL,
        actionLabel: ACTION,
      },
    });
    expect(code).toContain('imports: [NDS_ALERT_DIALOG, NdsButton],');
    expect(code).toContain(`<h2 ndsAlertDialogTitle>${TITLE}</h2>`);
    expect(code).toContain(`<p ndsAlertDialogDescription>${DESCRIPTION}</p>`);
    expect(footerLabels(code)).toEqual([CANCEL, ACTION]);
  });

  it('gatilho e confirmação carregam a variante destrutiva; a saída segura não', () => {
    // Quem escreve a cor de perigo é a variante do botão, nunca uma classe à
    // mão — e o Cancelar fica na hierarquia secundária.
    const code = alertDialogPlaygroundSource();
    expect(code).toContain('<button ndsAlertDialogTrigger ndsButton variant="destructive">');
    expect(code).toContain(
      '<button ndsAlertDialogAction ndsButton variant="destructive" (click)="deleteAccount()">',
    );
    expect(code).not.toContain('nds-button-destructive');
  });

  it('tone "default" tira a variante dos DOIS botões que ela acopla', () => {
    // `default` é o padrão do `ndsButton`: escrevê-lo ensinaria a repetir o
    // padrão. O Cancelar não muda — ele é `outline` em qualquer tom.
    const code = alertDialogPlaygroundSource('', { args: { tone: 'default' } });
    expect(code).toContain('<button ndsAlertDialogTrigger ndsButton>');
    expect(code).toContain('<button ndsAlertDialogAction ndsButton (click)="deleteAccount()">');
    expect(code).not.toContain('variant="destructive"');
    expect(code).not.toContain('variant="default"');
  });

  it('showMedia põe a caixa do ícone como primeiro filho do cabeçalho, com o import dela', () => {
    const code = alertDialogPlaygroundSource('', { args: { showMedia: true } });
    expect(code).toContain("import { NdsAlertIcon } from '@/components/ui/alert';");
    expect(code).toContain('imports: [NDS_ALERT_DIALOG, NdsButton, NdsAlertIcon],');
    expect(code).toMatch(
      /<div ndsAlertDialogHeader>\s*<div ndsAlertDialogMedia>\s*<svg ndsAlertIcon kind="warning"><\/svg>\s*<\/div>\s*<h2 ndsAlertDialogTitle>/,
    );
    // Sem o control, nem a caixa nem o import.
    const without = alertDialogPlaygroundSource();
    expect(without).not.toContain('ndsAlertDialogMedia');
    expect(without).not.toContain('NdsAlertIcon');
  });

  it('descrição vazia tira o parágrafo, e não publica um vazio (D4)', () => {
    const code = alertDialogPlaygroundSource('', { args: { description: '' } });
    expect(code).not.toContain('ndsAlertDialogDescription');
  });

  it('panelClass chega à raiz, que é a rota da classe até o painel portalado', () => {
    const code = alertDialogPlaygroundSource('', { args: { panelClass: 'nds-overflow-hidden' } });
    expect(code).toContain('<nds-alert-dialog panelClass="nds-overflow-hidden">');
    expect(alertDialogPlaygroundSource('', { args: { panelClass: '' } })).toContain(
      '    <nds-alert-dialog>\n',
    );
  });

  it('defaultOpen acompanha o control: ligado aparece na raiz, desligado não emite nada', () => {
    // O trecho acompanha os controls — quem liga `defaultOpen` quer ver onde
    // ele mora. O padrão é desligado, e o padrão não se escreve.
    const on = alertDialogPlaygroundSource('', { args: { defaultOpen: true } });
    expect(on).toContain('    <nds-alert-dialog [defaultOpen]="true">\n');
    expect(on.match(/defaultOpen/g)).toHaveLength(1);
    expect(on.replace(' [defaultOpen]="true"', '')).toBe(alertDialogDestructiveSource());

    const off = alertDialogPlaygroundSource('', { args: { defaultOpen: false } });
    expect(off).not.toContain('defaultOpen');
    expect(off).toBe(alertDialogDestructiveSource());

    // Com a classe extra junto, os dois atributos convivem na raiz.
    expect(
      alertDialogPlaygroundSource('', { args: { defaultOpen: true, panelClass: 'nds-overflow-hidden' } }),
    ).toContain('<nds-alert-dialog [defaultOpen]="true" panelClass="nds-overflow-hidden">');
  });
});

// ─── Estados ──────────────────────────────────────────────────────────────────

describe('estados', () => {
  it('a canônica usa o conjunto destrutivo de demonstration.labels', () => {
    // Os rótulos saem do conteúdo compartilhado, e não de uma cópia local:
    // cravá-los faria o snippet ficar em português com a página em inglês.
    const code = alertDialogDestructiveSource();
    expect(code).toContain(`        ${TRIGGER}\n`);
    expect(code).toContain(`<h2 ndsAlertDialogTitle>${TITLE}</h2>`);
    expect(code).toContain(`<p ndsAlertDialogDescription>${DESCRIPTION}</p>`);
    expect(footerLabels(code)).toEqual([CANCEL, ACTION]);
  });

  it('Controlled liga o par [open]/(openChange) a um sinal, sem gatilho interno', () => {
    // Ligar só a primeira ponta prenderia o painel ao valor inicial. E quem
    // abre é um botão comum, fora da raiz — é a ele que o foco volta.
    const code = alertDialogControlledSource();
    expect(code).toContain('<nds-alert-dialog [open]="isOpen()" (openChange)="isOpen.set($event)">');
    expect(code).toContain('<button ndsButton variant="destructive" (click)="isOpen.set(true)">');
    expect(code).toContain('  readonly isOpen = signal(false);');
    expect(code.indexOf('(click)="isOpen.set(true)"')).toBeLessThan(code.indexOf('<nds-alert-dialog'));
    expect(code).toContain(TRIGGER);
    expect(footerLabels(code)).toEqual([CANCEL, ACTION]);
  });
});

// ─── Variantes ────────────────────────────────────────────────────────────────

describe('variantes', () => {
  it('Neutral: gatilho outline, ação na variante padrão e os rótulos neutros', () => {
    const code = alertDialogNeutralSource();
    expect(code).toContain('<button ndsAlertDialogTrigger ndsButton variant="outline">');
    expect(code).toContain('<button ndsAlertDialogAction ndsButton (click)="signOut()">');
    expect(code).not.toContain('variant="destructive"');
    expect(code).toContain(`<h2 ndsAlertDialogTitle>${text('demonstration.labels.neutralTitle')}</h2>`);
    expect(code).toContain(text('demonstration.labels.neutralDescription'));
    expect(footerLabels(code)).toEqual([CANCEL, text('demonstration.labels.neutralAction')]);
  });

  it('WithMedia: a canônica com a caixa do ícone, e só isso', () => {
    const code = alertDialogWithMediaSource();
    expect(code).toContain('<svg ndsAlertIcon kind="warning"></svg>');
    expect(
      code
        .replace("\nimport { NdsAlertIcon } from '@/components/ui/alert';", '')
        .replace('NdsButton, NdsAlertIcon]', 'NdsButton]')
        .replace(/\n\s*<div ndsAlertDialogMedia>[\s\S]*?<\/div>/, ''),
    ).toBe(alertDialogDestructiveSource());
  });

  it('WithoutDescription: sem parágrafo, com o texto da story', () => {
    const code = alertDialogWithoutDescriptionSource();
    expect(code).not.toContain('ndsAlertDialogDescription');
    expect(code).toContain(`<h2 ndsAlertDialogTitle>${WITHOUT_DESCRIPTION_LABELS.title}</h2>`);
    expect(footerLabels(code)).toEqual([
      WITHOUT_DESCRIPTION_LABELS.cancelLabel,
      WITHOUT_DESCRIPTION_LABELS.actionLabel,
    ]);
  });

  it('LongDescription: a descrição longa da story, não a curta da canônica', () => {
    const code = alertDialogLongDescriptionSource();
    expect(code).toContain(`<p ndsAlertDialogDescription>${LONG_DESCRIPTION}</p>`);
    expect(code).not.toContain(DESCRIPTION);
  });

  it('ExtraClass: a classe do painel vai por panelClass, a da mídia no próprio class', () => {
    const code = alertDialogExtraClassSource();
    expect(code).toContain('<nds-alert-dialog panelClass="nds-overflow-hidden">');
    expect(code).toContain('<div ndsAlertDialogMedia class="nds-shrink-0">');
  });

  it('HeadingH3: o título em h3, e SÓ a tag muda', () => {
    // A igualdade com o painel canônico é cobrada letra por letra, para que uma
    // mudança no canônico não deixe este para trás em silêncio.
    const code = alertDialogHeadingH3Source();
    expect(code).toContain(`<h3 ndsAlertDialogTitle>${TITLE}</h3>`);
    expect(code).toBe(
      alertDialogDestructiveSource()
        .replace('<h2 ndsAlertDialogTitle>', '<h3 ndsAlertDialogTitle>')
        .replace('</h2>', '</h3>'),
    );
  });
});
