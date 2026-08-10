import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import { Accordion } from './index';
import AccordionStory from './AccordionStory.svelte';

const meta: Meta = {
  parameters: {
    design: figmaDesign('accordionItem'),
    controls: { disable: true },
    actions: { disable: true },
  },
  title: 'UI/Accordion/States',
  component: Accordion,
  tags: ['disclosure'],
};

export default meta;
type Story = StoryObj;

const SINGLE_ITEM = [
  { value: 'item-1', q: 'Item fechado (estado padrão)', a: 'Conteúdo oculto.' },
];

const OPEN_ITEM = [
  { value: 'item-1', q: 'Item aberto', a: 'Conteúdo visível. Chevron rotaciona 180°. aria-expanded="true".' },
];

const DISABLED_ITEMS = [
  { value: 'item-1', q: 'Item habilitado', a: 'Este item funciona normalmente.' },
  { value: 'item-2', q: 'Item desabilitado', a: 'Este conteúdo não pode ser acessado.' },
];

const FOCUS_ITEMS = [
  { value: 'item-1', q: 'Navegar com Tab para ver focus ring', a: 'Focus ring visível ao navegar por teclado.' },
  { value: 'item-2', q: 'Segundo item', a: 'Tab move o foco para este trigger.' },
];

export const Closed: Story = {
  render: () => ({
    Component: AccordionStory,
    props: { type: 'single', items: SINGLE_ITEM },
  }),
  parameters: {
    covers: ['accessibility.item2', 'visual.item3'],
    docs: {
      description: {
        story: 'Estado fechado. aria-expanded="false" no trigger. Chevron aponta para baixo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');

    await step('Trigger tem aria-expanded=false', async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  },
};

export const Open: Story = {
  render: () => ({
    Component: AccordionStory,
    props: { type: 'single', defaultValue: 'item-1', items: OPEN_ITEM },
  }),
  parameters: {
    covers: ['accessibility.item2', 'visual.item3'],
    docs: {
      description: {
        story: 'Estado aberto. aria-expanded="true" no trigger. Conteúdo visível e acessível.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');

    await step('Trigger tem aria-expanded=true', async () => {
      await waitFor(
        () => expect(trigger).toHaveAttribute('aria-expanded', 'true'),
        { timeout: 500 }
      );
    });
  },
};

export const Disabled: Story = {
  render: () => ({
    Component: AccordionStory,
    props: { type: 'single', items: DISABLED_ITEMS, disabledItem: 'item-2' },
  }),
  parameters: {
    covers: ['functional.item5', 'accessibility.item5', 'visual.item5'],
    docs: {
      description: {
        story: 'Estado disabled. Trigger não responde a cliques. Use para seções temporariamente indisponíveis.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    await step('Segundo trigger está desabilitado', async () => {
      await expect(triggers[1]).toHaveAttribute('aria-disabled', 'true');
    });

    await step('Clicar no disabled não abre o item', async () => {
      await userEvent.click(triggers[1], { pointerEventsCheck: 0 });
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'false');
    });
  },
};

export const FocusVisible: Story = {
  render: () => ({
    Component: AccordionStory,
    props: { type: 'single', defaultValue: 'item-1', items: FOCUS_ITEMS },
  }),
  parameters: {
    covers: ['accessibility.item3'],
    docs: {
      description: {
        story: 'Navegação por teclado. Tab move entre triggers. Enter e Space abrem/fecham. Focus ring ring-[3px] visível.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

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
