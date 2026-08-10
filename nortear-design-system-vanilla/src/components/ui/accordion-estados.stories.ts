import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import { createAccordion, type AccordionOptions } from './accordion';

const meta: Meta = {
  tags: ['disclosure'],
  parameters: {
    design: figmaDesign('accordionItem'),
    controls: { disable: true },
    actions: { disable: true },
  },
  title: 'UI/Accordion/States',
};

export default meta;
type Story = StoryObj;

// ─── Items ────────────────────────────────────────────────────────────────────

// Um conjunto por estado, igual às demais stacks — cada story mostra só o que a
// seção Estados da docs page descreve, sem ruído de itens extras.
const SINGLE_ITEM: AccordionOptions['items'] = [
  { value: 'item-1', trigger: 'Item fechado (estado padrão)', content: 'Conteúdo oculto.' },
];

const OPEN_ITEM: AccordionOptions['items'] = [
  { value: 'item-1', trigger: 'Item aberto', content: 'Conteúdo visível. Chevron rotaciona 180°. aria-expanded="true".' },
];

const DISABLED_ITEMS: AccordionOptions['items'] = [
  { value: 'item-1', trigger: 'Item habilitado',   content: 'Este item funciona normalmente.' },
  { value: 'item-2', trigger: 'Item desabilitado', content: 'Este conteúdo não pode ser acessado.', disabled: true },
];

const FOCUS_ITEMS: AccordionOptions['items'] = [
  { value: 'item-1', trigger: 'Navegar com Tab para ver focus ring', content: 'Focus ring visível ao navegar por teclado.' },
  { value: 'item-2', trigger: 'Segundo item',                        content: 'Tab move o foco para este trigger.' },
];

// ─── Estados ──────────────────────────────────────────────────────────────────

export const Closed: Story = {
  render: () => createAccordion({ type: 'single', collapsible: true, items: SINGLE_ITEM }),
  parameters: {
    covers: ['accessibility.item2', 'visual.item3'],
    docs: {
      description: {
        story: 'Estado padrão: todos os itens fechados. O chevron aponta para baixo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    await step('Todos os triggers têm aria-expanded=false', async () => {
      for (const trigger of triggers) {
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      }
    });
  },
};

export const Open: Story = {
  render: () =>
    createAccordion({
      type: 'single',
      collapsible: true,
      defaultValue: 'item-1',
      items: OPEN_ITEM,
    }),
  parameters: {
    covers: ['accessibility.item2', 'visual.item3'],
    docs: {
      description: {
        story: 'Item expandido. O conteúdo é visível e o chevron rotaciona 180°.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    await step('Primeiro trigger tem aria-expanded=true', async () => {
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'true');
    });
  },
};

export const Disabled: Story = {
  render: () => createAccordion({ type: 'single', collapsible: true, items: DISABLED_ITEMS }),
  parameters: {
    covers: ['functional.item5', 'accessibility.item5', 'visual.item5'],
    docs: {
      description: {
        story: 'Item desabilitado. Não responde a cliques e tem opacidade reduzida para sinalizar indisponibilidade.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    await step('Segundo trigger está desabilitado', async () => {
      await expect(triggers[1]).toBeDisabled();
    });

    await step('Clique no item desabilitado não abre o conteúdo', async () => {
      await userEvent.click(triggers[1], { pointerEventsCheck: 0 });
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'false');
    });
  },
};

export const FocusVisible: Story = {
  render: () => createAccordion({ type: 'single', collapsible: true, defaultValue: 'item-1', items: FOCUS_ITEMS }),
  parameters: {
    covers: ['accessibility.item3'],
    docs: {
      description: {
        story: 'Estado de foco via teclado. Use Tab para navegar entre triggers e verificar o focus ring visível.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    // Navegação por setas é coberta no Playground das 4 stacks; aqui a story
    // é sobre o foco em si, com o mesmo roteiro das demais.
    await step('Trigger recebe foco via Tab', async () => {
      triggers[0].focus();
      await expect(triggers[0]).toHaveFocus();
    });

    await step('Tab move foco para próximo trigger', async () => {
      await userEvent.tab();
      await expect(triggers[1]).toHaveFocus();
    });
  },
};
