import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { userEvent, within, expect } from 'storybook/test';
import { Label } from './index';
import { Input } from '@/components/ui/input';
import LabelDocs from '@/components/docs/LabelDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { labelSource } from './label.source';

const meta = {
  title: 'UI/Label',
  component: Label,
  tags: ['autodocs', 'form'],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(LabelDocs), source: { transform: labelSource } },
  },
  argTypes: {
    for: {
      control: 'text',
      description: 'Associa o rótulo ao campo com o id correspondente.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    class: {
      control: 'text',
      description: 'Classes utilitárias .nds-* adicionais para personalização do rótulo.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
  },
  args: {
    for: 'playground-label',
    class: '',
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    covers: ['functional.item1', 'accessibility.item2'],
  },
  render: (args) => ({
    components: { Label, Input },
    setup() { return { args }; },
    template: `
      <div class="nds-stack nds-w-full nds-max-w-xs" data-spacing="xs">
        <Label v-bind="args">Nome completo</Label>
        <Input id="playground-label" type="text" placeholder="ex: João da Silva" />
      </div>
    `,
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
      const campo = canvas.getByLabelText('Nome completo');
      await expect(campo).toBe(canvasElement.querySelector('#playground-label'));
    });

    await step('Clicar no rótulo move o foco para o campo', async () => {
      // Precondição própria: o replay reexecuta no mesmo DOM, e sem tirar o
      // foco daqui a asserção passaria pelo estado que a rodada anterior deixou.
      const campo = canvasElement.querySelector<HTMLInputElement>('#playground-label')!;
      campo.blur();
      await expect(campo).not.toHaveFocus();
      await userEvent.click(label);
      await expect(campo).toHaveFocus();
    });
  },
};
