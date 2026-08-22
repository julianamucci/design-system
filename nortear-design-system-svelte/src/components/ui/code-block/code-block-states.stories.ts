import type { Meta, StoryObj } from '@storybook/svelte-vite';
import type { ComponentProps } from 'svelte';

import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import { CodeBlock } from './index';
import CodeBlockRemovivelStory from './CodeBlockRemovivelStory.svelte';
import { codeBlockRemovivelSource, codeBlockSource } from './code-block.source';

/** Mesmo trecho base da seção Composições da docs page. */
const BASE_CODE = `const items = await load();
const total = items.length;
render(items, total);`;

/** Longo nas duas direções: força barra horizontal e vertical ao mesmo tempo. */
const LONG_CODE = Array.from({ length: 40 }, (_, i) => {
  const campos = Array.from({ length: 12 }, (_, j) => `campoBastanteDescritivo${j}: true`).join(', ');
  return `const registro${i} = await repositorio.buscarPorIdentificadorCompletoComRelacionamentos(${i}, { ${campos} });`;
}).join('\n');

const rootOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;

const meta: Meta = {
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      // Cascateia para todas as stories do arquivo; a de remoção sobrescreve
      // com a própria composição logo abaixo.
      source: { transform: codeBlockSource },
      description: {
        component:
          'Configurações do bloco: numeração ligada e desligada, confirmação de cópia, rolagem nos dois eixos, linguagem não reconhecida e o bloco removido antes do fim do feedback.',
      },
    },
  },
  title: 'UI/CodeBlock/States',
  component: CodeBlock,
  tags: ['display'],
};

export default meta;
type Story = StoryObj;

export const WithNumbering: Story = {
  parameters: { covers: ['visual.item3'] },
  args: { code: BASE_CODE, language: 'ts', showLineNumbers: true },
  play: async ({ canvasElement, step }) => {
    await step('A raiz registra a numeração e o gutter aparece', async () => {
      const root = rootOf(canvasElement);
      await expect(root).toHaveAttribute('data-numbered', 'true');
      await expect(canvasElement.querySelectorAll('.nds-code-block-gutter')).toHaveLength(
        BASE_CODE.split('\n').length,
      );
      const gutter = root.querySelector<HTMLElement>('.nds-code-block-gutter')!;
      await expect(gutter).toBeVisible();
      await expect(gutter).toHaveTextContent('1');
    });
  },
};

export const WithoutNumbering: Story = {
  parameters: { covers: ['functional.item6', 'visual.item3'] },
  args: { code: BASE_CODE, language: 'ts', showLineNumbers: false },
  play: async ({ canvasElement, step }) => {
    await step('A raiz registra a ausência de numeração e o gutter some', async () => {
      const root = rootOf(canvasElement);
      await expect(root).toHaveAttribute('data-numbered', 'false');
      // O gutter continua no DOM (aria-hidden) e é o data-numbered que o oculta.
      await expect(root.querySelector('.nds-code-block-gutter')).not.toBeVisible();
    });

    await step('O código recebe o recuo que a coluna ocupava', async () => {
      // Sem este respiro o trecho encosta na borda — é o resultado que a linha
      // "Sem numeração" da tabela de configurações promete.
      const texto = rootOf(canvasElement).querySelector<HTMLElement>('.nds-code-block-text')!;
      await expect(parseFloat(getComputedStyle(texto).paddingInlineStart)).toBeGreaterThan(0);
    });
  },
};

export const Copied: Story = {
  args: { code: BASE_CODE, language: 'ts', showLineNumbers: false },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    // O clipboard real rejeita por permissão no browser de teste; o que
    // interessa aqui é o feedback, não a API do browser.
    const writeText = fn((text: string) => Promise.resolve(text));
    const original = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    try {
      await step('Copiar anuncia a confirmação por aria-live', async () => {
        await userEvent.click(canvas.getByRole('button', { name: /copiar código/i }));
        const status = canvasElement.querySelector('[role="status"]');
        await expect(status).toHaveAttribute('aria-live', 'polite');
        await waitFor(() => expect(status).toHaveTextContent('Copiado!'));
      });

      await step('Um ícone por vez dentro do botão', async () => {
        const button = canvasElement.querySelector('[data-slot="code-block-copy"]');
        await expect(button?.querySelectorAll('svg')).toHaveLength(1);
      });
    } finally {
      Object.defineProperty(navigator, 'clipboard', { value: original, configurable: true });
    }
  },
};

export const DoubleScroll: Story = {
  parameters: { covers: ['visual.item5'] },
  args: { code: LONG_CODE, language: 'ts', showLineNumbers: true },
  play: async ({ canvasElement, step }) => {
    await step('A região rolável é alcançável por teclado e rola nos dois eixos', async () => {
      const scroll = canvasElement.querySelector<HTMLElement>('.nds-code-block-scroll')!;
      await expect(scroll).toHaveAttribute('tabindex', '0');
      await waitFor(() => expect(scroll.scrollWidth).toBeGreaterThan(scroll.clientWidth));
      await expect(scroll.scrollHeight).toBeGreaterThan(scroll.clientHeight);
    });

    await step('Um eixo, um dono: só a região de scroll rola', async () => {
      // Contêineres aninhados com overflow deixam o eixo sem dono claro e a
      // rolagem por teclado inalcançável (WCAG 2.1.1, axe
      // scrollable-region-focusable). Ver guidelines/01-acessibilidade.
      const root = rootOf(canvasElement);
      const rolaveis = [...root.querySelectorAll<HTMLElement>('*')].filter((el) => {
        const cs = getComputedStyle(el);
        return (
          (/(auto|scroll)/.test(cs.overflowX) || /(auto|scroll)/.test(cs.overflowY)) &&
          (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)
        );
      });
      await expect(rolaveis.map((el) => el.className)).toEqual(['nds-code-block-scroll']);
    });

    await step('A numeração continua visível no scroll horizontal', async () => {
      // O gutter é sticky: sem isso, rolar para o lado esconde os números e a
      // linha em destaque ganha uma emenda visível.
      const gutter = rootOf(canvasElement).querySelector<HTMLElement>('.nds-code-block-gutter')!;
      await expect(getComputedStyle(gutter).position).toBe('sticky');
    });
  },
};

export const UnknownLanguage: Story = {
  parameters: { covers: ['functional.item7'] },
  args: { code: BASE_CODE, language: 'cobol', showLineNumbers: false },
  play: async ({ canvasElement, step }) => {
    await step('Linguagem não reconhecida cai em texto simples sem quebrar o bloco', async () => {
      const root = rootOf(canvasElement);
      await expect(root).toHaveAttribute('data-language', 'text');
      await expect(root.querySelectorAll('[data-token]:not([data-token="plain"])')).toHaveLength(0);
      await expect(root.querySelectorAll('.nds-code-block-line')).toHaveLength(
        BASE_CODE.split('\n').length,
      );
    });
  },
};

export const RemovedBeforeFeedback: StoryObj<ComponentProps<typeof CodeBlockRemovivelStory>> = {
  parameters: {
    covers: ['functional.item8'],
    docs: { source: { transform: codeBlockRemovivelSource } },
  },
  render: (args) => ({ Component: CodeBlockRemovivelStory, props: args }),
  args: { code: BASE_CODE },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    // Precondição própria: no replay a rodada anterior deixou o bloco removido.
    await step('O bloco está na tela antes de qualquer coisa', async () => {
      if (!canvasElement.querySelector('[data-slot="code-block"]')) {
        await userEvent.click(canvas.getByRole('button', { name: /restaurar o bloco/i }));
      }
      await waitFor(() =>
        expect(canvasElement.querySelector('[data-slot="code-block"]')).not.toBeNull(),
      );
    });

    // Espiões sobre os temporizadores globais: o componente chama `setTimeout` e
    // `clearTimeout` sem alias, então o que ele usa é o global do momento da
    // chamada. Passa-tudo — só registram.
    const setOriginal = window.setTimeout;
    const clearOriginal = window.clearTimeout;
    let confirmId: number | undefined;
    const limpos: number[] = [];

    window.setTimeout = ((handler: TimerHandler, ms?: number, ...rest: unknown[]) => {
      const id = setOriginal(handler, ms, ...rest);
      // 2000ms é o intervalo do feedback de "copiado".
      if (ms === 2000) confirmId = id;
      return id;
    }) as typeof window.setTimeout;
    window.clearTimeout = ((id?: number) => {
      if (typeof id === 'number') limpos.push(id);
      return clearOriginal(id);
    }) as typeof window.clearTimeout;

    const writeText = fn((text: string) => Promise.resolve(text));
    const originalClipboard = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    try {
      await step('Copiar agenda a volta do rótulo em 2 segundos', async () => {
        await userEvent.click(
          canvasElement.querySelector<HTMLElement>('[data-slot="code-block-copy"]')!,
        );
        await waitFor(() =>
          expect(canvas.getByRole('button', { name: /copiado/i })).toBeInTheDocument(),
        );
        await expect(confirmId).toBeDefined();
      });

      await step('Remover o bloco cancela o temporizador pendente', async () => {
        // Sem o clearTimeout do teardown do $effect, o callback dispararia sobre
        // um componente já destruído — escrita em $state de árvore morta.
        await userEvent.click(canvas.getByRole('button', { name: /remover o bloco/i }));
        await waitFor(() =>
          expect(canvasElement.querySelector('[data-slot="code-block"]')).toBeNull(),
        );
        await expect(limpos).toContain(confirmId);
      });
    } finally {
      window.setTimeout = setOriginal;
      window.clearTimeout = clearOriginal;
      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        configurable: true,
      });
    }
  },
};
