import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, userEvent } from 'storybook/test';
import { createCodeBlock } from './code-block';
import { createButton } from './button';
import {
  codeBlockHeaderActionsSource,
  codeBlockLineKindsSource,
  codeBlockSource,
  codeBlockSourceWith,
} from './code-block.source';
import { COMPOSITION_CODE } from '@/components/docs/CodeBlockDocs';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os arranjos da seção Composições da docs page, sobre o mesmo trecho base: o
// que muda entre eles é só a opção passada à factory.

const meta: Meta = {
  tags: ['display'],
  title: 'Primitives/Display/CodeBlock/Compositions',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: codeBlockSource },
      description: {
        component:
          'Arranjos canônicos: rótulo no header, sem numeração, com linha destacada, com intervalo destacado, com e sem rodapé.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Seis linhas, porque um intervalo precisa de espaço para existir. Sobre as três
 * de `COMPOSITION_CODE`, `'1, 3'` seriam dois números avulsos — e uma story de
 * intervalo que não contém intervalo é declaração falsa.
 */
const RANGE_CODE = [
  "import { load } from './api';",
  '',
  'const items = await load();',
  'const total = items.length;',
  'render(items, total);',
  'export default total;',
].join('\n');

const FOOTER_NOTE = 'A ação de copiar leva apenas o código.';

/**
 * Trecho de diferencial: a segunda linha sai e a terceira entra no lugar dela.
 *
 * É o menor trecho em que as TRÊS espécies convivem — sem a linha de contexto
 * ao lado das duas marcadas, a story não mostraria que a linha inalterada
 * continua sem marca e sem palavra.
 */
const DIFF_CODE = `const items = await load();
const total = items.length;
const total = items.filter(Boolean).length;
render(items, total);`;

/** Espécie de cada linha de `DIFF_CODE`, na ordem em que elas aparecem. */
const DIFF_KINDS = ['context', 'removed', 'added', 'context'] as const;

/** Texto visível do controle que a composição acrescenta ao cabeçalho. */
const RUN_LABEL = 'Executar';

const root = (canvasElement: HTMLElement): HTMLElement =>
  canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;

/** Números 1-based das linhas marcadas. */
const linesChecked = (canvasElement: HTMLElement): number[] =>
  [...root(canvasElement).querySelectorAll('.nds-code-block-line')]
    .map((el, i) => (el.getAttribute('data-highlighted') === 'true' ? i + 1 : 0))
    .filter((n) => n > 0);

/** Botões da fila do cabeçalho, na ordem em que o DOM os traz. */
const headerControls = (canvasElement: HTMLElement): HTMLButtonElement[] => [
  ...root(canvasElement).querySelectorAll<HTMLButtonElement>('.nds-code-block-actions button'),
];

/** Espécie declarada em cada linha, na ordem do trecho. */
const lineKindsOf = (canvasElement: HTMLElement): Array<string | null> =>
  [...root(canvasElement).querySelectorAll('.nds-code-block-line')].map((el) =>
    el.getAttribute('data-kind'),
  );

/** O que a calha MOSTRA, sem a palavra que só o leitor de tela recebe. */
const gutterMarks = (canvasElement: HTMLElement): string[] =>
  [...root(canvasElement).querySelectorAll('.nds-code-block-gutter')].map((el) => {
    const word = el.querySelector('.nds-sr-only')?.textContent ?? '';
    return (el.textContent ?? '').replace(word, '').trim();
  });

/** O que a calha ANUNCIA. Vazio na linha de contexto, que não fala. */
const gutterWords = (canvasElement: HTMLElement): string[] =>
  [...root(canvasElement).querySelectorAll('.nds-code-block-gutter')].map(
    (el) => el.querySelector('.nds-sr-only')?.textContent ?? '',
  );

// ─── Stories ──────────────────────────────────────────────────────────────────

export const WithLabel: Story = {
  // Cada arranjo desta seção É uma opção da fábrica: sem override, o snippet do
  // meta mostraria a mesma chamada nas seis stories.
  parameters: {
    docs: { source: { transform: codeBlockSourceWith({ language: 'ts', title: 'lista.ts' }) } },
  },
  render: () =>
    createCodeBlock({ code: COMPOSITION_CODE, language: 'ts', title: 'lista.ts' }),
  play: async ({ canvasElement, step }) => {
    await step('O header mostra o nome do arquivo ao lado da ação de copiar', async () => {
      const title = root(canvasElement).querySelector('.nds-code-block-title')!;
      await expect(title).toBeVisible();
      await expect(title).toHaveTextContent('lista.ts');
      await expect(root(canvasElement).querySelector('[data-slot="code-block-copy"]')).toBeVisible();
    });

    await step('O rótulo longo trunca em vez de empurrar o botão para fora', async () => {
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
  parameters: {
    docs: {
      source: { transform: codeBlockSourceWith({ language: 'ts', showLineNumbers: false }) },
    },
  },
  render: () =>
    createCodeBlock({ code: COMPOSITION_CODE, language: 'ts', showLineNumbers: false }),
  play: async ({ canvasElement, step }) => {
    await step('A coluna de numeração some', async () => {
      await expect(root(canvasElement)).toHaveAttribute('data-numbered', 'false');
      // O gutter permanece no DOM — aria-hidden e não selecionável; quem o
      // remove da tela é o CSS, via data-numbered.
      await expect(root(canvasElement).querySelector('.nds-code-block-gutter')).not.toBeVisible();
    });
  },
};

export const WithHighlight: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item4'],
    docs: {
      source: { transform: codeBlockSourceWith({ language: 'ts', highlightLines: [2] }) },
    },
  },
  render: () =>
    createCodeBlock({ code: COMPOSITION_CODE, language: 'ts', highlightLines: [2] }),
  play: async ({ canvasElement, step }) => {
    await step('Só a linha pedida fica marcada, contando a partir de 1', async () => {
      await expect(linesChecked(canvasElement)).toEqual([2]);
      const marcada = root(canvasElement).querySelector<HTMLElement>(
        '[data-highlighted]:not([data-highlighted="false"])',
      )!;
      await expect(marcada).toHaveTextContent('const total = items.length;');
    });

    await step('A marcação não é só cor', async () => {
      // Barra de acento na lateral além do fundo — WCAG 1.4.1.
      const marcada = root(canvasElement).querySelector<HTMLElement>(
        '[data-highlighted]:not([data-highlighted="false"])',
      )!;
      await expect(getComputedStyle(marcada).boxShadow).not.toBe('none');
    });
  },
};

export const WithHighlightedRange: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item4'],
    docs: {
      source: {
        transform: codeBlockSourceWith({
          code: RANGE_CODE,
          language: 'ts',
          highlightLines: '1, 4-5',
        }),
      },
    },
  },
  render: () =>
    createCodeBlock({ code: RANGE_CODE, language: 'ts', highlightLines: '1, 4-5' }),
  play: async ({ canvasElement, step }) => {
    await step('Número avulso e intervalo convivem na mesma entrada', async () => {
      // A forma string é a que o control do Playground usa; a forma array já é
      // exercitada em WithHighlight.
      await expect(linesChecked(canvasElement)).toEqual([1, 4, 5]);
    });

    await step('As linhas de fora seguem sem marcação', async () => {
      // Sem isto, um componente que marcasse TUDO passaria: a asserção acima
      // conferiria a presença das três pedidas e ignoraria as outras três.
      await expect(root(canvasElement).querySelectorAll('.nds-code-block-line')).toHaveLength(
        RANGE_CODE.split('\n').length,
      );
      await expect(
        root(canvasElement).querySelectorAll(
          '.nds-code-block-line[data-highlighted]:not([data-highlighted="false"])',
        ),
      ).toHaveLength(3);
    });
  },
};

export const WithFooter: Story = {
  parameters: {
    docs: {
      source: { transform: codeBlockSourceWith({ language: 'ts', footer: FOOTER_NOTE }) },
    },
  },
  render: () =>
    createCodeBlock({ code: COMPOSITION_CODE, language: 'ts', footer: FOOTER_NOTE }),
  play: async ({ canvasElement, step }) => {
    await step('O rodapé aparece abaixo do código', async () => {
      const footer = root(canvasElement).querySelector('.nds-code-block-footer')!;
      await expect(footer).toBeVisible();
      await expect(footer).toHaveTextContent(FOOTER_NOTE);
    });

    await step('O rodapé fica fora da região que rola', async () => {
      // A observação precisa continuar visível enquanto a pessoa rola o trecho.
      const scroll = root(canvasElement).querySelector<HTMLElement>('.nds-code-block-scroll')!;
      const footer = root(canvasElement).querySelector<HTMLElement>('.nds-code-block-footer')!;
      await expect(scroll.contains(footer)).toBe(false);
    });
  },
};

export const WithoutFooter: Story = {
  parameters: {
    docs: { source: { transform: codeBlockSourceWith({ language: 'ts' }) } },
  },
  render: () => createCodeBlock({ code: COMPOSITION_CODE, language: 'ts' }),
  play: async ({ canvasElement, step }) => {
    await step('Sem observação o bloco não cria a faixa inferior', async () => {
      // Faixa vazia deixaria uma borda solta abaixo do código.
      await expect(root(canvasElement).querySelector('.nds-code-block-footer')).toBeNull();
    });
  },
};

export const WithHeaderActions: Story = {
  parameters: {
    // Forma própria: `actions` recebe elementos, e elemento não cabe num
    // control do Playground — o snippet do meta esconderia a opção inteira.
    docs: { source: { transform: codeBlockHeaderActionsSource } },
  },
  render: () =>
    createCodeBlock({
      code: COMPOSITION_CODE,
      language: 'ts',
      title: 'lista.ts',
      actions: [createButton({ variant: 'ghost', size: 'sm', label: RUN_LABEL })],
    }),
  play: async ({ canvasElement, step }) => {
    await step('Os controles de quem compõe entram na fila, antes do copiar', async () => {
      const controls = headerControls(canvasElement);
      await expect(controls).toHaveLength(2);
      await expect(controls[0]).toHaveTextContent(RUN_LABEL);
      // O copiar segue ANCORADO no fim da fila: quem aprendeu que ele é o
      // último controle do cabeçalho continua com essa verdade quando a
      // composição acrescenta outro (WCAG 3.2.4).
      await expect(controls[1]).toHaveAttribute('data-slot', 'code-block-copy');
    });

    await step('A ordem de foco segue a visual', async () => {
      // O foco é posto na mão a cada rodada, e não herdado do passo anterior: o
      // painel Interactions reexecuta no MESMO DOM, e um Tab que partisse de
      // onde a rodada passada parou inverteria o resultado na segunda vez.
      const controls = headerControls(canvasElement);
      controls[0].focus();
      await userEvent.tab();
      await expect(controls[1]).toHaveFocus();
    });

    await step('O rótulo do arquivo continua no cabeçalho, ao lado da fila', async () => {
      await expect(root(canvasElement).querySelector('.nds-code-block-title')).toHaveTextContent(
        'lista.ts',
      );
    });
  },
};

export const WithLineKinds: Story = {
  parameters: {
    // `lineKinds` é indexado por linha: o snippet só ensina alguma coisa com a
    // lista e o trecho juntos, e o do meta separaria os dois.
    docs: { source: { transform: codeBlockLineKindsSource } },
  },
  render: () => createCodeBlock({ code: DIFF_CODE, language: 'ts', lineKinds: DIFF_KINDS }),
  play: async ({ canvasElement, step }) => {
    await step('Cada linha carrega a espécie que a entrada declarou', async () => {
      await expect(root(canvasElement)).toHaveAttribute('data-line-kinds', 'true');
      await expect(lineKindsOf(canvasElement)).toEqual([...DIFF_KINDS]);
    });

    await step('A calha troca o número pelo sinal, e o sinal é lido', async () => {
      await expect(gutterMarks(canvasElement)).toEqual(['', '−', '+', '']);
      // Contexto não fala: marca vazia e palavra vazia. Anunciar "contexto" em
      // cada linha inalterada tornaria o bloco ilegível por voz.
      await expect(gutterWords(canvasElement)).toEqual([
        '',
        'Linha removida',
        'Linha adicionada',
        '',
      ]);
      // Número de linha é redundante com a posição e sai da leitura; sinal de
      // diferencial não é redundante com nada, e por isso a calha deixa de ser
      // aria-hidden no modo de espécie.
      const gutter = root(canvasElement).querySelectorAll('.nds-code-block-gutter')[2];
      await expect(gutter).not.toHaveAttribute('aria-hidden');
    });

    await step('A distinção não é só cor', async () => {
      // Barra de acento na lateral além do fundo, nas duas espécies marcadas — e
      // nenhuma na de contexto, senão a barra deixaria de distinguir (WCAG 1.4.1).
      const lines = [
        ...root(canvasElement).querySelectorAll<HTMLElement>('.nds-code-block-line'),
      ];
      await expect(getComputedStyle(lines[1]).boxShadow).not.toBe('none');
      await expect(getComputedStyle(lines[2]).boxShadow).not.toBe('none');
      await expect(getComputedStyle(lines[0]).boxShadow).toBe('none');
    });
  },
};
