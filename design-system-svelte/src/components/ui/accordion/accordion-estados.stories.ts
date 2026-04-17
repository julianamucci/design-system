import type { Meta, StoryObj } from '@storybook/svelte';
import { userEvent, within, expect } from 'storybook/test';
import AccordionStory from './AccordionStory.svelte';

const meta = {
  title: 'UI/Accordion/Estados',
  component: AccordionStory,
  args: {
    type: 'single',
    collapsible: true,
  },
} satisfies Meta<typeof AccordionStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ItemDisabled: Story = {
  name: 'Item Desabilitado',
  args: {
    items: [
      { value: 'item-1', trigger: 'Item habilitado', content: 'Conteúdo do item habilitado.' },
      { value: 'item-2', trigger: 'Item desabilitado', content: 'Este conteúdo não pode ser acessado.', disabled: true },
      { value: 'item-3', trigger: 'Outro item habilitado', content: 'Conteúdo do terceiro item.' },
    ],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    await step('Item desabilitado tem atributo disabled no DOM', async () => {
      await expect(triggers[1]).toBeDisabled();
      await expect(triggers[1]).toHaveAttribute('disabled');
    });

    await step('Clicar no item disabled não o abre', async () => {
      await userEvent.click(triggers[1], { pointerEventsCheck: 0 });
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Itens habilitados continuam funcionais', async () => {
      await userEvent.click(triggers[0]);
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'true');
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Item individual desabilitado via prop `disabled`. O trigger fica inativo enquanto os demais itens permanecem funcionais.',
      },
    },
  },
};

export const DefaultOpen: Story = {
  name: 'Aberto por Padrão',
  args: {
    defaultValue: 'item-2',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    await step('Segundo item começa aberto (defaultValue="item-2")', async () => {
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Demais itens começam fechados', async () => {
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'false');
      await expect(triggers[2]).toHaveAttribute('aria-expanded', 'false');
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Estado inicial com um item aberto via `defaultValue`. Ideal para guiar o usuário ao conteúdo mais relevante.',
      },
    },
  },
};
