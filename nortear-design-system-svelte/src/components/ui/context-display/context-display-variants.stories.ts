import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect } from 'storybook/test';
import { ContextDisplay, CONTEXT_DISPLAY_FORMS, type ContextDisplayForm } from './index';
import ContextDisplayEveryFormStory from './ContextDisplayEveryFormStory.svelte';
import { contextDisplayLabels, usageOf } from './context-display.fixtures';
import {
  contextDisplayBarSource,
  contextDisplayEveryFormSource,
  contextDisplayRingSource,
  contextDisplayTextSource,
} from './context-display.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// As três formas do MESMO número. O eixo da família 5 inteiro está aqui: anel,
// barra e texto dizem a mesma coisa, e a escolha entre elas é de espaço.

const meta: Meta<typeof ContextDisplay> = {
  title: 'Primitives/Conversational/ContextDisplay/Variants',
  component: ContextDisplay,
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: contextDisplayEveryFormSource },
      description: {
        component:
          'A forma é escolha de espaço, e não de significado: o que é lido em voz é o mesmo nas três.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ContextDisplay>;

const mount = (form: ContextDisplayForm) => ({
  Component: ContextDisplay,
  props: {
    usage: usageOf('warning'),
    form,
    labels: contextDisplayLabels(),
  },
});

const blockOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="context-display"]')!;

/** Os medidores presentes, sem os blocos que não têm. */
function meters(blocks: HTMLElement[]): HTMLElement[] {
  return blocks
    .map((block) => block.querySelector<HTMLElement>('[data-slot="context-display-meter"]'))
    .filter((el): el is HTMLElement => el !== null);
}

/** O que se lê em voz naquele bloco, sem contar o que é decorativo. */
function spokenTextOf(root: HTMLElement): string {
  return [...root.querySelectorAll<HTMLElement>('[data-slot]')]
    .filter((el) => el.getAttribute('aria-hidden') !== 'true')
    .map((el) => el.textContent?.trim() ?? '')
    .filter(Boolean)
    .join(' | ');
}

/**
 * As três, uma abaixo da outra.
 *
 * A lista sai de `CONTEXT_DISPLAY_FORMS`, e não de três linhas escritas à mão:
 * forma nova entra nesta story sozinha, que é exatamente o que aquela constante
 * existe para garantir.
 */
export const EveryForm: Story = {
  parameters: {
    covers: ['functional.item6', 'visual.item2'],
  },
  render: () => ({
    Component: ContextDisplayEveryFormStory,
    props: { usage: usageOf('warning'), labels: contextDisplayLabels() },
  }),
  play: async ({ canvasElement, step }) => {
    const blocks = [
      ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="context-display"]'),
    ];

    await step('Há um bloco por forma, na ordem da lista', async () => {
      await expect(blocks).toHaveLength(CONTEXT_DISPLAY_FORMS.length);
      await expect(blocks.map((block) => block.dataset.form)).toEqual([
        ...CONTEXT_DISPLAY_FORMS,
      ]);
    });

    await step('O que se lê em voz é IDÊNTICO nas três', async () => {
      // É a prova do eixo da família: trocar de forma não troca a informação.
      // Se um dia uma forma passar a dizer algo a mais, é aqui que aparece.
      const spoken = blocks.map(spokenTextOf);
      await expect(new Set(spoken).size).toBe(1);
    });

    await step('O que muda é só o medidor: duas formas têm, uma não', async () => {
      const found = blocks.map((block) =>
        block.querySelector<HTMLElement>('[data-slot="context-display-meter"]'),
      );
      await expect(found[0]).toHaveClass('nds-context-display-ring');
      await expect(found[1]).toHaveClass('nds-context-display-bar');
      await expect(found[2]).toBeNull();
    });

    await step('E todo medidor fica fora do que é lido', async () => {
      for (const meter of meters(blocks)) {
        await expect(meter.getAttribute('aria-hidden')).toBe('true');
      }
    });
  },
};

export const Ring: Story = {
  parameters: { docs: { source: { transform: contextDisplayRingSource } } },
  render: () => mount('ring'),
  play: async ({ canvasElement, step }) => {
    const root = blockOf(canvasElement);

    await step('O anel é a forma compacta, e cabe ao lado do texto', async () => {
      await expect(root.dataset.form).toBe('ring');
      const meter = root.querySelector<HTMLElement>('[data-slot="context-display-meter"]')!;
      await expect(meter).toHaveClass('nds-context-display-ring');
    });
  },
};

export const Bar: Story = {
  parameters: { docs: { source: { transform: contextDisplayBarSource } } },
  render: () => mount('bar'),
  play: async ({ canvasElement, step }) => {
    const root = blockOf(canvasElement);

    await step('A barra toma a linha inteira, abaixo do número', async () => {
      await expect(root.dataset.form).toBe('bar');
      const meter = root.querySelector<HTMLElement>('[data-slot="context-display-meter"]')!;
      await expect(meter).toHaveClass('nds-context-display-bar');
      // O preenchimento não carrega o número: ele HERDA a custom property do
      // trilho, que é o elemento onde ela mora nas duas formas.
      const fill = meter.querySelector<HTMLElement>('.nds-context-display-bar-fill')!;
      await expect(fill.style.getPropertyValue('--nds-context-used')).toBe('');
      await expect(meter.style.getPropertyValue('--nds-context-used')).not.toBe('');
    });
  },
};

export const Text: Story = {
  parameters: { docs: { source: { transform: contextDisplayTextSource } } },
  render: () => mount('text'),
  play: async ({ canvasElement, step }) => {
    const root = blockOf(canvasElement);

    await step('Sem medidor nenhum — e o número continua inteiro', async () => {
      await expect(root.dataset.form).toBe('text');
      await expect(root.querySelector('[data-slot="context-display-meter"]')).toBeNull();
      const value = root.querySelector<HTMLElement>('[data-slot="context-display-value"]')!;
      await expect(value.textContent).toBe('78%');
    });
  },
};
