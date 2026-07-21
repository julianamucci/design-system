import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect } from 'storybook/test';
import { Textarea } from './index';
import { Label } from '@/components/ui/label';

const meta = {
  title: 'UI/Textarea/Variantes',
  component: Textarea,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'O Textarea expõe 3 variantes via classes .nds-*: `default` (resize-y), `withCounter` (maxLength + contador com aria-live) e `noResize` (resize-none, ideal para modais).',
      },
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Textarea, Label },
    template: `
      <div class="" data-spacing="xs" style="width: 20rem">
        <Label for="var-default">Descrição</Label>
        <Textarea
          id="var-default"
          placeholder="ex: Descreva o produto..."
          class="resize-y min-h-[120px]"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Textarea default renderiza com data-slot', async () => {
      const textarea = canvas.getByRole('textbox');
      await expect(textarea).toHaveAttribute('data-slot', 'textarea');
    });
    await step('Textarea default permite resize vertical', async () => {
      const textarea = canvas.getByRole('textbox');
      await expect(textarea).toHaveClass('resize-y');
    });
  },
};

export const WithCounter: Story = {
  render: () => ({
    components: { Textarea, Label },
    data() {
      return { value: '', max: 500 };
    },
    template: `
      <div class="" data-spacing="xs" style="width: 20rem">
        <Label for="var-counter">Descrição</Label>
        <Textarea
          id="var-counter"
          v-model="value"
          :maxlength="max"
          placeholder="ex: Descreva o produto..."
          class="resize-y min-h-[120px]"
        />
        <div class="nds-cluster nds-text-caption nds-text-muted-foreground" data-justify="between">
          <span>Descreva com clareza.</span>
          <span
            aria-live="polite"
            :aria-label="\`\${String(value).length} de \${max} caracteres usados\`"
          >
            {{ String(value).length }}/{{ max }}
          </span>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Textarea com maxlength está configurado', async () => {
      const textarea = canvas.getByRole('textbox') as HTMLTextAreaElement;
      await expect(textarea).toHaveAttribute('maxlength', '500');
    });

    await step('Contador inicia em 0/500', async () => {
      await expect(canvas.getByText('0/500')).toBeVisible();
    });

    await step('Contador possui aria-live="polite"', async () => {
      const counter = canvasElement.querySelector('[aria-live="polite"]') as HTMLElement;
      await expect(counter).toBeTruthy();
      await expect(counter).toHaveAttribute('aria-live', 'polite');
    });

    await step('Digitar atualiza contador e aria-label', async () => {
      const textarea = canvas.getByRole('textbox');
      await userEvent.type(textarea, 'Olá');
      await expect(canvas.getByText('3/500')).toBeVisible();
      const counter = canvasElement.querySelector('[aria-live="polite"]') as HTMLElement;
      await expect(counter).toHaveAttribute('aria-label', '3 de 500 caracteres usados');
    });
  },
};

export const NoResize: Story = {
  render: () => ({
    components: { Textarea, Label },
    template: `
      <div class="" data-spacing="xs" style="width: 20rem">
        <Label for="var-noresize">Mensagem</Label>
        <Textarea
          id="var-noresize"
          placeholder="Digite sua mensagem..."
          class="resize-none min-h-[120px]"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Textarea aplica classe resize-none', async () => {
      const textarea = canvas.getByRole('textbox');
      await expect(textarea).toHaveClass('resize-none');
    });
  },
};
