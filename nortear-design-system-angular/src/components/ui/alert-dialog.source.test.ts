import { describe, expect, it } from 'vitest';
import alertDialogTranslations from '@shared/content/alert-dialog/translations.json';
import * as alertDialogSourceModule from './alert-dialog.source';
import { alertDialogHeadingH3Source, alertDialogPlaygroundSource } from './alert-dialog.source';

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
 * lado, não vazar endereço de teste, e manter a saída segura ANTES da
 * confirmação.
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
  'tituloPainel',
  'descricaoPainel',
  'rotuloGatilho',
  'rotuloCancelar',
  'rotuloAcao',
  'triggerLabel',
  'title',
  'description',
  'cancel',
  'action',
];

/** Interpolação contra campo do renderer — andaime, nunca lição do componente. */
const STORY_INTERPOLATION = new RegExp(`\\{\\{\\s*(?:${STORY_PROPS.join('|')})\\b`);

/** O espião de output do Playground, que só existe dentro da story. */
const STORY_SPY = /onOpenChange\(|onConfirm\(/;

/** Os rótulos dos botões do rodapé, na ordem em que estão no DOM. */
function footerLabels(code: string): string[] {
  const bloco = /<div ndsAlertDialogFooter[^>]*>([\s\S]*?)\n\s*<\/div>/.exec(code)?.[1] ?? '';
  return [...bloco.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/g)].map((m) => m[1]!.trim());
}

// ─── Cobertura das stories ────────────────────────────────────────────────────

/**
 * Os dois construtores e a story que cada um serve.
 *
 * A lista existe para ser COBRADA: o caso logo abaixo compara com o que o
 * módulo exporta, e um construtor novo que não entre aqui reprova em vez de
 * sair calado da varredura. É a lição do `source-snippets.test.ts` do Vue, onde
 * 28 exports saíram do alcance e a suíte seguiu verde medindo menos.
 */
const CONSTRUCTORS: Array<{
  name: string;
  story: string;
  build: () => string;
  /**
   * Nível do cabeçalho do título, quando não é o `h2` de sempre.
   *
   * DECLARADO por construtor, e não afrouxando a asserção para `h[1-6]`: a
   * varredura que aceita qualquer nível deixaria um `h5` acidental passar
   * calado.
   */
  titleTag?: 'h3';
}> = [
  {
    name: 'alertDialogPlaygroundSource',
    story: 'Playground',
    build: alertDialogPlaygroundSource,
  },
  {
    name: 'alertDialogHeadingH3Source',
    story: 'Variants/HeadingH3',
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

  for (const c of CONSTRUCTORS) {
    it(`${c.name} (${c.story}) publica o componente, não o andaime da story`, () => {
      const code = c.build();

      expect(code).not.toContain('args.');
      expect(code).not.toMatch(STORY_INTERPOLATION);
      expect(code).not.toMatch(STORY_SPY);
      // O `data-testid` é endereço de teste, e no Angular o host binding da
      // diretiva apaga atributo estático do template: nomear peça por
      // `data-slot` ensinaria markup que não sobrevive à renderização. As
      // stories consultam por `data-testid` justamente por isso — e é o que
      // não pode vazar para quem copia.
      expect(code).not.toContain('data-testid');
      expect(code).not.toContain('data-slot=');
      // Valor de design em `style` inline não existe no design system.
      expect(code).not.toContain('style=');

      // Uma raiz por snippet e um miolo em `ng-template`: fechado, nada do
      // conteúdo existe no DOM.
      expect(code.match(/<nds-alert-dialog[ >]/g)).toHaveLength(1);
      expect(code.match(/<ng-template ndsAlertDialogContent>/g)).toHaveLength(1);

      // O par que sustenta o nome e a descrição acessíveis — um de cada,
      // sempre, porque é do id REAL deles que o primitivo se serve.
      //
      // O nível é DECLARADO: `h2` por padrão, e a exceção se escreve na lista.
      // Trocar a asserção por `h[1-6]` aceitaria um `h5` acidental sem uma
      // palavra — portão que afrouxa para caber uma exceção deixa de medir.
      const titleTag = c.titleTag ?? 'h2';
      expect(code.match(new RegExp(`<${titleTag} ndsAlertDialogTitle>`, 'g'))).toHaveLength(1);
      expect(code.match(/<h[1-6] ndsAlertDialogTitle>/g)).toHaveLength(1);
      expect(code.match(/<p ndsAlertDialogDescription>/g)).toHaveLength(1);

      // O gatilho, e um só: é ele que devolve o foco no fechamento.
      expect(code.match(/ndsAlertDialogTrigger/g)).toHaveLength(1);

      // O que o componente já entrega, e escrever à mão ensinaria API que não
      // existe: papel de alerta, modalidade e a ligação do nome saem do
      // primitivo, e o foco inicial pousa sozinho na saída segura.
      expect(code).not.toContain('role="alertdialog"');
      expect(code).not.toContain('aria-modal');
      expect(code).not.toContain('aria-labelledby');
      expect(code).not.toContain('aria-describedby');

      // `[defaultOpen]="true"` das stories é a captura do Chromatic: um diálogo
      // de confirmação de produção não nasce aberto.
      expect(code).not.toContain('[defaultOpen]');

      // A saída segura vem ANTES da confirmação, no DOM: é a ordem de leitura e
      // de foco, e é sobre ela que a folha trabalha (`column-reverse` no
      // estreito, `row` no largo). Inverter aqui inverteria a tela.
      expect(code.match(/<div ndsAlertDialogFooter>/g)).toHaveLength(1);
      expect(code.match(/ndsAlertDialogCancel/g)).toHaveLength(1);
      expect(code.match(/ndsAlertDialogAction/g)).toHaveLength(1);
      expect(code.indexOf('ndsAlertDialogCancel')).toBeLessThan(
        code.indexOf('ndsAlertDialogAction'),
      );

      // Os imports que todo snippet ensina.
      expect(code).toContain("import { NDS_ALERT_DIALOG } from '@/components/ui/alert-dialog';");
      expect(code).toContain("import { NdsButton } from '@/components/ui/button';");

      // A ação de negócio roda no método da classe; quem FECHA é o primitivo.
      expect(code).toContain('  excluir(): void {');
    });
  }
});

// ─── Playground ───────────────────────────────────────────────────────────────

describe('alertDialogPlaygroundSource', () => {
  it('devolve o componente que se escreve, com os valores vindos dos controls', () => {
    const code = alertDialogPlaygroundSource('', {
      args: {
        triggerLabel: TRIGGER,
        title: TITLE,
        description: DESCRIPTION,
        cancel: CANCEL,
        action: ACTION,
      },
    });
    expect(code).toContain('imports: [NDS_ALERT_DIALOG, NdsButton],');
    expect(code).toContain(`<h2 ndsAlertDialogTitle>${TITLE}</h2>`);
    expect(code).toContain(`<p ndsAlertDialogDescription>${DESCRIPTION}</p>`);
    expect(footerLabels(code)).toEqual([CANCEL, ACTION]);
  });

  it('gatilho e confirmação carregam a variante destrutiva; a saída segura não', () => {
    // Quem escreve a cor de perigo é a variante do botão, nunca uma classe à
    // mão — e o Cancelar fica na hierarquia secundária, porque vermelho na
    // saída gastaria o sinal justamente onde ele precisa alarmar.
    const code = alertDialogPlaygroundSource();
    expect(code).toContain('<button ndsAlertDialogTrigger ndsButton variant="destructive">');
    expect(code).toContain('<button ndsAlertDialogCancel ndsButton variant="outline">');
    expect(code).toContain(
      '<button ndsAlertDialogAction ndsButton variant="destructive" (click)="excluir()">',
    );
    expect(code).not.toContain('nds-button-destructive');
  });
});

// ─── Variantes ────────────────────────────────────────────────────────────────

describe('variantes', () => {
  it('alertDialogHeadingH3Source imprime o título em h3, e SÓ a tag muda', () => {
    // A capacidade que a story exercita é o nível do cabeçalho: a diretiva casa
    // de `h1` a `h6`, e o nível certo é o que a página em volta pede. O que o
    // snippet ensina é isso e nada mais — a igualdade com o painel canônico é
    // cobrada letra por letra, para que uma mudança no canônico não deixe este
    // para trás em silêncio.
    const code = alertDialogHeadingH3Source();
    expect(code).toContain(`<h3 ndsAlertDialogTitle>${TITLE}</h3>`);
    expect(code).not.toContain('<h2 ndsAlertDialogTitle>');
    expect(code).toBe(
      alertDialogPlaygroundSource('', {
        args: {
          triggerLabel: TRIGGER,
          title: TITLE,
          description: DESCRIPTION,
          cancel: CANCEL,
          action: ACTION,
        },
      })
        .replace('<h2 ndsAlertDialogTitle>', '<h3 ndsAlertDialogTitle>')
        .replace('</h2>', '</h3>'),
    );
    // O nível é do DOCUMENTO; o vínculo é do id. Escrever `aria-labelledby` à
    // mão ensinaria a duplicar o que o primitivo já faz, e é o que romperia o
    // nome acessível quando a tag mudasse.
    expect(code).not.toContain('aria-labelledby');
  });

  it('os rótulos saem do conteúdo compartilhado, não de uma cópia local', () => {
    // Cravá-los aqui faria o snippet ficar em português quando a página abrisse
    // em inglês, e divergir do preview ao lado sem uma palavra do portão.
    const code = alertDialogHeadingH3Source();
    expect(code).toContain(TRIGGER);
    expect(code).toContain(DESCRIPTION);
    expect(footerLabels(code)).toEqual([CANCEL, ACTION]);
  });
});
