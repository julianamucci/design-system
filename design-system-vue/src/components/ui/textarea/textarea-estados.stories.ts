import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect } from 'storybook/test';
import { Textarea } from './index';
import { Label } from '@/components/ui/label';

const meta = {
  title: 'UI/Textarea/Estados',
  component: Textarea,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'O Textarea possui 6 estados visuais: default, focus, filled, disabled, invalid (aria-invalid) e read-only. Os estilos de cada estado são controlados por tokens de tema.',
      },
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  render: () => ({
    components: { Textarea, Label },
    template: `
      <div class="w-80 space-y-1.5">
        <Label for="estado-default">Descrição</Label>
        <Textarea id="estado-default" placeholder="ex: Descreva o produto..." class="resize-y min-h-[120px]" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Textarea padrão está visível e habilitado', async () => {
      const textarea = canvas.getByRole('textbox');
      await expect(textarea).toBeVisible();
      await expect(textarea).not.toBeDisabled();
    });
  },
};

export const Preenchido: Story = {
  render: () => ({
    components: { Textarea, Label },
    template: `
      <div class="w-80 space-y-1.5">
        <Label for="estado-filled">Biografia</Label>
        <Textarea
          id="estado-filled"
          default-value="Designer e desenvolvedora apaixonada por design systems e acessibilidade."
          class="resize-y min-h-[120px]"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Textarea preenchido tem conteúdo inicial', async () => {
      const textarea = canvas.getByRole('textbox') as HTMLTextAreaElement;
      await expect(textarea.value.length).toBeGreaterThan(0);
    });
  },
};

export const Desabilitado: Story = {
  render: () => ({
    components: { Textarea, Label },
    template: `
      <div class="w-80 space-y-1.5">
        <Label for="estado-disabled">Descrição</Label>
        <Textarea id="estado-disabled" placeholder="Não disponível" disabled class="resize-y min-h-[120px]" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Textarea está desabilitado', async () => {
      const textarea = canvas.getByRole('textbox');
      await expect(textarea).toBeDisabled();
    });
    await step('Não é possível digitar no textarea desabilitado', async () => {
      const textarea = canvas.getByRole('textbox');
      await userEvent.click(textarea, { pointerEventsCheck: 0 });
      await expect(textarea).toHaveValue('');
    });
  },
};

export const Invalido: Story = {
  render: () => ({
    components: { Textarea, Label },
    template: `
      <div class="w-80 space-y-1.5">
        <Label for="estado-invalid">Descrição</Label>
        <Textarea
          id="estado-invalid"
          placeholder="ex: Descreva o produto..."
          aria-invalid="true"
          aria-describedby="estado-invalid-msg"
          class="resize-y min-h-[120px]"
        />
        <p id="estado-invalid-msg" class="text-sm text-destructive">
          A descrição é obrigatória.
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Textarea possui aria-invalid="true"', async () => {
      const textarea = canvas.getByRole('textbox');
      await expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });
    await step('aria-describedby aponta para a mensagem de erro', async () => {
      const textarea = canvas.getByRole('textbox');
      await expect(textarea).toHaveAttribute('aria-describedby', 'estado-invalid-msg');
    });
    await step('Mensagem de erro está visível', async () => {
      await expect(canvas.getByText(/A descrição é obrigatória/)).toBeVisible();
    });
  },
};

export const SomenteLeitura: Story = {
  render: () => ({
    components: { Textarea, Label },
    template: `
      <div class="w-80 space-y-1.5">
        <Label for="estado-readonly">Termo</Label>
        <Textarea
          id="estado-readonly"
          default-value="Este conteúdo é apenas para leitura — selecionável mas não editável."
          readonly
          class="resize-y min-h-[120px]"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Textarea está em modo somente leitura', async () => {
      const textarea = canvas.getByRole('textbox');
      await expect(textarea).toHaveAttribute('readonly');
    });
  },
};
