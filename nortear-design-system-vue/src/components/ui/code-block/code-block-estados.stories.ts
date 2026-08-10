import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import { CodeBlock } from './index';

/** Mesmo trecho base da seção "Composições" da docs page. */
const BASE_CODE = `const items = await load();
const total = items.length;
render(items, total);`;

/** Query longa o bastante para o conteúdo estourar a largura do container. */
const LONG_QUERY =
  'formato=json&incluirDetalhes=true&ordenarPor=dataCriacao&limite=100&pagina=1&agruparPor=categoria&incluirTotais=true&idioma=pt-BR';

/** Longo nos dois eixos: força scroll vertical e horizontal ao mesmo tempo. */
const SCROLL_CODE = Array.from({ length: 40 }, (_, i) =>
  `const rota${i} = "/api/v1/relatorios/consolidado/por-periodo/${i}?${LONG_QUERY}&${LONG_QUERY}";`,
).join('\n');

const meta = {
  title: 'UI/CodeBlock/States',
  component: CodeBlock,
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
  args: { code: BASE_CODE, language: 'ts' },
  render: (args) => ({
    components: { CodeBlock },
    setup() { return { args }; },
    template: '<CodeBlock v-bind="args" />',
  }),
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithNumbering: Story = {
  args: { showLineNumbers: true },
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;

    await step('A raiz registra a numeração e a coluna aparece', async () => {
      await expect(root).toHaveAttribute('data-numbered', 'true');
      await expect(root.querySelector('.nds-code-block-gutter')).toBeVisible();
    });
  },
};

export const WithoutNumbering: Story = {
  args: { showLineNumbers: false },
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;

    await step('A raiz registra a ausência de numeração', async () => {
      await expect(root).toHaveAttribute('data-numbered', 'false');
      await expect(root.querySelector('.nds-code-block-gutter')).not.toBeVisible();
    });
  },
};

export const Copied: Story = {
  args: { showLineNumbers: true, title: 'lista.ts' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;

    // Stub do writeText: no browser de teste o clipboard real rejeita por
    // permissão e o fallback via execCommand exige user activation. O que
    // interessa aqui é o feedback, não a API do browser.
    const writeText = fn((text: string) => Promise.resolve(text));
    const original = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    try {
      await step('Clicar em copiar confirma por uma região aria-live', async () => {
        await userEvent.click(canvasElement.querySelector<HTMLElement>('[data-slot="code-block-copy"]')!);
        const status = root.querySelector('[role="status"]');
        await waitFor(() => expect(status).toHaveTextContent('Copiado!'));
        await expect(status).toHaveAttribute('aria-live', 'polite');
      });

      await step('Um ícone por vez dentro do botão', async () => {
        const button = canvasElement.querySelector('[data-slot="code-block-copy"]')!;
        await expect(button.querySelectorAll('svg')).toHaveLength(1);
        await expect(canvas.getByRole('button', { name: /copiado/i })).toBeInTheDocument();
      });
    } finally {
      Object.defineProperty(navigator, 'clipboard', { value: original, configurable: true });
    }
  },
};

export const DoubleScroll: Story = {
  args: { code: SCROLL_CODE, language: 'ts', showLineNumbers: true },
  play: async ({ canvasElement, step }) => {
    const scroll = canvasElement.querySelector<HTMLElement>('.nds-code-block-scroll')!;

    await step('A região de scroll é focável e de fato transborda na horizontal', async () => {
      await expect(scroll).toHaveAttribute('tabindex', '0');
      await expect(scroll.scrollWidth).toBeGreaterThan(scroll.clientWidth);
    });
  },
};

export const UnknownLanguage: Story = {
  args: { code: BASE_CODE, language: 'cobol', showLineNumbers: true },
  play: async ({ canvasElement, step }) => {
    await step('Linguagem desconhecida cai em texto simples sem quebrar o bloco', async () => {
      await expect(canvasElement.querySelectorAll('[data-token]')).toHaveLength(0);
      await expect(canvasElement.querySelectorAll('.nds-code-block-line'))
        .toHaveLength(BASE_CODE.split('\n').length);
    });
  },
};
