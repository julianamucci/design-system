import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect } from 'storybook/test';
import { Textarea } from './index';
import { Label } from '@/components/ui/label';
import TextareaDocs from '@/components/docs/TextareaDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Textarea',
  component: Textarea,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(TextareaDocs) },
    layout: 'centered',
  },
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Texto de exemplo do conteúdo esperado',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o textarea',
    },
  },
  args: {
    placeholder: 'ex: Descreva o produto...',
    disabled: false,
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    components: { Textarea, Label },
    setup() { return { args }; },
    template: `
      <div class="w-80 space-y-1.5">
        <Label for="playground-textarea">Descrição</Label>
        <Textarea id="playground-textarea" v-bind="args" class="resize-y min-h-[120px]" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Textarea está presente no DOM', async () => {
      const textarea = canvas.getByRole('textbox');
      await expect(textarea).toBeInTheDocument();
    });

    await step('Textarea possui data-slot="textarea"', async () => {
      const textarea = canvas.getByRole('textbox');
      await expect(textarea).toHaveAttribute('data-slot', 'textarea');
    });

    await step('Clicar no Label foca o Textarea', async () => {
      const label = canvas.getByText('Descrição');
      await userEvent.click(label);
      const textarea = canvas.getByLabelText('Descrição');
      await expect(textarea).toHaveFocus();
    });

    await step('Digitar texto atualiza o valor', async () => {
      const textarea = canvas.getByRole('textbox');
      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'Camiseta de algodão');
      await expect(textarea).toHaveValue('Camiseta de algodão');
    });
  },
};
