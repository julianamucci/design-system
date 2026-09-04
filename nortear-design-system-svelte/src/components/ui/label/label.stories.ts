import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect } from 'storybook/test';
import { Label } from './index';
import LabelStory from './LabelStory.svelte';
import LabelDocs from '@/components/docs/LabelDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { labelSource } from './label.source';

const meta: Meta = {
  title: 'Components/Form/Label',
  component: Label,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: {
      page: withAutoDocsTab(LabelDocs),
      source: { transform: labelSource },
    },
    layout: 'centered',
  },
  argTypes: {
    class: {
      control: 'text',
      description: 'Classes utilitárias .nds-* adicionais para personalização do rótulo.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    required: {
      control: 'boolean',
      description:
        'Acrescenta o marcador visual de obrigatório e o aria-required no campo. Não é uma prop do rótulo — é composição do código consumidor.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
  },
  args: {
    class: '',
    required: false,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    covers: ['functional.item1', 'accessibility.item2'],
  },
  render: (args) => ({
    Component: LabelStory,
    props: {
      children: 'Nome completo',
      for: 'playground-label',
      class: args.class,
      required: (args as unknown as { required: boolean }).required,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const label = canvasElement.querySelector<HTMLLabelElement>('label[data-slot="label"]')!;

    await step('O rótulo é um <label> com a classe do design system', async () => {
      await expect(label.tagName.toLowerCase()).toBe('label');
      await expect(label).toHaveClass('nds-label');
    });

    await step('O campo é alcançável pelo texto do rótulo', async () => {
      // É o que `accessibility.item2` promete: `getByLabelText` só encontra o
      // campo se a associação `for`/`id` estiver de pé. Conferir o atributo
      // sozinho passaria com um id que não aponta para nada.
      const field = canvas.getByLabelText('Nome completo');
      await expect(field).toBe(canvasElement.querySelector('#playground-label'));
    });

    await step('Clicar no rótulo move o foco para o campo', async () => {
      // Precondição própria: o replay reexecuta no mesmo DOM, e sem tirar o
      // foco daqui a asserção passaria pelo estado que a rodada anterior deixou.
      const field = canvasElement.querySelector<HTMLInputElement>('#playground-label')!;
      field.blur();
      await expect(field).not.toHaveFocus();
      await userEvent.click(label);
      await expect(field).toHaveFocus();
    });
  },
};
