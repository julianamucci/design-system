import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createCodeBlock } from './code-block';
import { COMPOSITION_CODE } from '@/components/docs/CodeBlockDocs';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Configurações que a docs page lista na tabela de Estados: numeração ligada e
// desligada, confirmação de cópia, scroll nos dois eixos e linguagem que a
// classificação não conhece.

const meta: Meta = {
  tags: ['display'],
  title: 'UI/CodeBlock/Estados',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Cada story fixa uma configuração do bloco e verifica o que ela muda no DOM.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Roda `run` com `navigator.clipboard.writeText` substituído.
 *
 * O clipboard real não funciona no browser de teste: a Clipboard API rejeita por
 * permissão e o fallback via `execCommand` exige user activation, que evento
 * sintético não tem. Sem o stub, `copyText` devolve `false` e o componente —
 * corretamente — não confirma nada.
 */
async function withClipboardStub(run: () => Promise<void>): Promise<void> {
  const original = navigator.clipboard;
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: () => Promise.resolve() },
    configurable: true,
  });
  try {
    await run();
  } finally {
    Object.defineProperty(navigator, 'clipboard', { value: original, configurable: true });
  }
}

/** Código comprido nos dois eixos: 60 linhas e uma delas bem larga. */
const LONG_CODE = Array.from({ length: 60 }, (_, i) =>
  i === 0
    ? `const rotulos = [${Array.from({ length: 24 }, (_, n) => `'coluna-${n}'`).join(', ')}];`
    : `console.log('linha ${i + 1}');`,
).join('\n');

// ─── Stories ──────────────────────────────────────────────────────────────────

export const ComNumeracao: Story = {
  render: () =>
    createCodeBlock({ code: COMPOSITION_CODE, language: 'ts', showLineNumbers: true }),
  play: async ({ canvasElement, step }) => {
    await step('A numeração aparece e fica registrada na raiz', async () => {
      const root = canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;
      await expect(root).toHaveAttribute('data-numbered', 'true');
      const gutter = root.querySelector<HTMLElement>('.nds-code-block-gutter')!;
      await expect(gutter).toBeVisible();
      await expect(gutter).toHaveTextContent('1');
    });
  },
};

export const SemNumeracao: Story = {
  render: () =>
    createCodeBlock({ code: COMPOSITION_CODE, language: 'ts', showLineNumbers: false }),
  play: async ({ canvasElement, step }) => {
    await step('Sem numeração a coluna some da tela', async () => {
      const root = canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;
      await expect(root).toHaveAttribute('data-numbered', 'false');
      // O gutter continua no DOM (é aria-hidden e não selecionável); quem o
      // remove é o CSS, via data-numbered.
      await expect(root.querySelector('.nds-code-block-gutter')).not.toBeVisible();
    });
  },
};

export const Copiado: Story = {
  render: () =>
    createCodeBlock({ code: COMPOSITION_CODE, language: 'ts' }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;

    await step('Copiar confirma e a confirmação é anunciada', async () => {
      await withClipboardStub(async () => {
        await userEvent.click(canvasElement.querySelector('[data-slot="code-block-copy"]')!);
        await waitFor(() =>
          expect(canvas.getByRole('button', { name: /copiado/i })).toBeInTheDocument(),
        );
      });
      const live = root.querySelector('[role="status"]')!;
      await expect(live).toHaveAttribute('aria-live', 'polite');
      await expect(live).toHaveTextContent('Copiado!');
    });

    await step('Um ícone por vez no botão', async () => {
      // A primeira versão mantinha os dois SVGs no DOM alternando `hidden`, que
      // não esconde elemento de outro namespace — e os dois apareciam juntos.
      const button = root.querySelector('[data-slot="code-block-copy"]')!;
      await expect(button.querySelectorAll('svg')).toHaveLength(1);
    });
  },
};

export const ScrollDuplo: Story = {
  render: () => createCodeBlock({ code: LONG_CODE, language: 'ts' }),
  play: async ({ canvasElement, step }) => {
    await step('A região rola nos dois eixos e aceita foco', async () => {
      const scroll = canvasElement.querySelector<HTMLElement>('.nds-code-block-scroll')!;
      await expect(scroll).toHaveAttribute('tabindex', '0');
      await expect(scroll.scrollWidth).toBeGreaterThan(scroll.clientWidth);
      await expect(scroll.scrollHeight).toBeGreaterThan(scroll.clientHeight);
    });
  },
};

export const LinguagemDesconhecida: Story = {
  render: () => createCodeBlock({ code: COMPOSITION_CODE, language: 'cobol' }),
  play: async ({ canvasElement, step }) => {
    await step('Linguagem desconhecida cai em texto simples sem quebrar o bloco', async () => {
      const root = canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;
      await expect(root).toHaveAttribute('data-language', 'text');
      await expect(
        root.querySelectorAll('[data-token]:not([data-token="plain"])').length,
      ).toBe(0);
      // O conteúdo continua todo lá: uma linha por linha do código.
      await expect(root.querySelectorAll('.nds-code-block-line')).toHaveLength(
        COMPOSITION_CODE.split('\n').length,
      );
    });
  },
};
