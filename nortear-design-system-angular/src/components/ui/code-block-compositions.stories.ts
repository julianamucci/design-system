import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsCodeBlock } from './code-block';
import { root } from './code-block.fixtures';
import { COMPOSITION_CODE } from '@/components/docs/CodeBlockDocs';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os arranjos que a seção Variantes da docs page mostra, sobre o mesmo trecho
// base: o que muda entre eles é só o input passado ao bloco.

const meta: Meta = {
  title: 'UI/CodeBlock/Compositions',
  tags: ['display'],
  decorators: [moduleMetadata({ imports: [NdsCodeBlock] })],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Arranjos canônicos: rótulo no header, linha em destaque, intervalo em destaque e rodapé.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Números 1-based das linhas marcadas. */
function linesChecked(canvasElement: HTMLElement): number[] {
  return [...root(canvasElement).querySelectorAll('.nds-code-block-line')]
    .map((el, i) => (el.getAttribute('data-highlighted') === 'true' ? i + 1 : 0))
    .filter((n) => n > 0);
}

const FOOTER = 'A ação de copiar leva apenas o código.';

/**
 * Seis linhas, porque um intervalo precisa de espaço para existir.
 *
 * `COMPOSITION_CODE` tem três: sobre ele, `'1, 3'` é a única forma de "vários" —
 * e foi exatamente isso que a story de intervalo passou a fazer, afirmando no
 * nome e no comentário um intervalo que a entrada não continha.
 */
const RANGE_CODE = [
  "import { load } from './api';",
  '',
  'const items = await load();',
  'const total = items.length;',
  'render(items, total);',
  'export default total;',
].join('\n');

// ─── Stories ──────────────────────────────────────────────────────────────────

export const WithLabel: Story = {
  render: () => ({
    props: { code: COMPOSITION_CODE },
    template: `<nds-code-block [code]="code" language="ts" title="lista.ts" />`,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O header mostra o nome do arquivo ao lado da ação de copiar', async () => {
      const titulo = root(canvasElement).querySelector<HTMLElement>('.nds-code-block-title')!;
      await expect(titulo).toBeVisible();
      await expect(titulo).toHaveTextContent('lista.ts');
      // data-slot é o contrato que story, teste e ferramenta usam para achar a
      // ação de copiar sem depender de classe — as cinco stacks emitem o mesmo.
      await expect(
        root(canvasElement).querySelector('[data-slot="code-block-copy"]'),
      ).toBeVisible();
    });

    await step('O rótulo longo trunca em vez de empurrar o botão para fora', async () => {
      // É a promessa da variante: o header cabe numa linha e a ação continua
      // no canto direito.
      // Os dois numa asserção só: `text-overflow` sem `nowrap` não trunca nada,
      // então o par é o comportamento — verificar um de cada vez daria a falsa
      // impressão de que qualquer um deles basta.
      const { textOverflow, whiteSpace } = getComputedStyle(
        root(canvasElement).querySelector<HTMLElement>('.nds-code-block-title')!,
      );
      await expect({ textOverflow, whiteSpace }).toEqual({
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      });
    });
  },
};

export const WithoutNumbering: Story = {
  parameters: { covers: ['functional.item6', 'visual.item3'] },
  render: () => ({
    props: { code: COMPOSITION_CODE },
    template: `<nds-code-block [code]="code" language="ts" [showLineNumbers]="false" />`,
  }),
  play: async ({ canvasElement, step }) => {
    await step('A coluna de numeração some', async () => {
      await expect(root(canvasElement)).toHaveAttribute('data-numbered', 'false');
      // O gutter permanece no DOM — aria-hidden e não selecionável; quem o
      // remove da tela é o CSS, via data-numbered.
      await expect(root(canvasElement).querySelector('.nds-code-block-gutter')).not.toBeVisible();
    });
  },
};

// `WithHighlight`, não `WithRowHighlight`: é o nome que as outras quatro stacks
// já usavam, e nome de story é o que o Chromatic e o menu do Storybook casam.
export const WithHighlight: Story = {
  parameters: { covers: ['functional.item5', 'visual.item4'] },
  render: () => ({
    props: { code: COMPOSITION_CODE, highlight: [2] },
    template: `<nds-code-block [code]="code" language="ts" [highlightLines]="highlight" />`,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Só a linha pedida fica marcada, contando a partir de 1', async () => {
      await expect(linesChecked(canvasElement)).toEqual([2]);
      const marcada = root(canvasElement).querySelector<HTMLElement>('[data-highlighted="true"]')!;
      await expect(marcada).toHaveTextContent('const total = items.length;');
    });

    await step('A marcação não é só cor', async () => {
      // Barra de acento na lateral além do fundo — WCAG 1.4.1.
      const marcada = root(canvasElement).querySelector<HTMLElement>('[data-highlighted="true"]')!;
      await expect(getComputedStyle(marcada).boxShadow).not.toBe('none');
    });
  },
};

export const WithHighlightedRange: Story = {
  parameters: { covers: ['functional.item5', 'visual.item4'] },
  render: () => ({
    props: { code: RANGE_CODE },
    template: `<nds-code-block [code]="code" language="ts" [highlightLines]="'1, 4-5'" />`,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Número avulso e intervalo convivem na mesma entrada', async () => {
      // A forma string é a que o control do Playground usa; a forma array já é
      // exercitada em WithHighlight. `1, 4-5` traz de fato um intervalo — a
      // versão anterior passava `'1, 3'`, dois números avulsos, e afirmava no
      // nome e no comentário um intervalo que a entrada não continha.
      await expect(linesChecked(canvasElement)).toEqual([1, 4, 5]);
    });

    await step('As linhas de fora seguem sem marcação', async () => {
      // Sem isto, um componente que marcasse TUDO passaria: a asserção acima
      // conferiria a presença das três pedidas e ignoraria as outras três.
      const total = root(canvasElement).querySelectorAll('.nds-code-block-line').length;
      await expect(total).toBe(RANGE_CODE.split('\n').length);
      await expect(
        root(canvasElement).querySelectorAll(
          '.nds-code-block-line[data-highlighted]:not([data-highlighted="false"])',
        ),
      ).toHaveLength(3);
    });
  },
};

export const WithFooter: Story = {
  render: () => ({
    props: { code: COMPOSITION_CODE, rodape: FOOTER },
    template: `<nds-code-block [code]="code" language="ts" [footer]="rodape" />`,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O rodapé aparece abaixo do código', async () => {
      const rodape = root(canvasElement).querySelector<HTMLElement>('.nds-code-block-footer')!;
      await expect(rodape).toBeVisible();
      await expect(rodape).toHaveTextContent(FOOTER);
    });

    await step('O rodapé fica fora da região que rola', async () => {
      // A observação precisa continuar visível enquanto a pessoa rola o trecho.
      const scroll = root(canvasElement).querySelector<HTMLElement>('.nds-code-block-scroll')!;
      const rodape = root(canvasElement).querySelector<HTMLElement>('.nds-code-block-footer')!;
      await expect(scroll.contains(rodape)).toBe(false);
    });
  },
};

export const WithoutFooter: Story = {
  render: () => ({
    props: { code: COMPOSITION_CODE },
    template: `<nds-code-block [code]="code" language="ts" />`,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Sem observação o bloco não cria a faixa inferior', async () => {
      // Faixa vazia deixaria uma borda solta abaixo do código.
      await expect(root(canvasElement).querySelector('.nds-code-block-footer')).toBeNull();
    });
  },
};
