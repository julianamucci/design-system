import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect } from 'storybook/test';
import { Textarea } from './index';
import { Label } from '@/components/ui/label';

const meta = {
  title: 'UI/Textarea/Composicoes',
  component: Textarea,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'O Textarea deve sempre ser acompanhado de um Label acessível. Composicoes comuns: com Label, com texto de apoio, com contador de caracteres e com mensagem de erro.',
      },
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComLabel: Story = {
  render: () => ({
    components: { Textarea, Label },
    template: `
      <div class="w-80 space-y-1.5">
        <Label for="comp-label">Descrição</Label>
        <Textarea id="comp-label" placeholder="ex: Descreva o produto..." class="resize-y min-h-[120px]" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Label está visível e associado', async () => {
      const textarea = canvas.getByLabelText('Descrição');
      await expect(textarea).toBeVisible();
    });
    await step('Clicar no Label foca o Textarea', async () => {
      const label = canvas.getByText('Descrição');
      await userEvent.click(label);
      const textarea = canvas.getByLabelText('Descrição');
      await expect(textarea).toHaveFocus();
    });
  },
};

export const ComTextoDeApoio: Story = {
  render: () => ({
    components: { Textarea, Label },
    template: `
      <div class="w-80 space-y-1.5">
        <Label for="comp-apoio">Biografia</Label>
        <Textarea
          id="comp-apoio"
          placeholder="Conte um pouco sobre você..."
          aria-describedby="comp-apoio-help"
          class="resize-y min-h-[120px]"
        />
        <p id="comp-apoio-help" class="text-sm text-muted-foreground">
          Aparece no seu perfil público.
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Textarea, label e texto de apoio estão visíveis', async () => {
      await expect(canvas.getByLabelText('Biografia')).toBeVisible();
      await expect(canvas.getByText(/Aparece no seu perfil/)).toBeVisible();
    });
    await step('aria-describedby vincula ao texto de apoio', async () => {
      const textarea = canvas.getByLabelText('Biografia');
      await expect(textarea).toHaveAttribute('aria-describedby', 'comp-apoio-help');
    });
  },
};

export const ComContador: Story = {
  render: () => ({
    components: { Textarea, Label },
    data() {
      return { value: '', max: 500 };
    },
    template: `
      <div class="w-80 space-y-1.5">
        <Label for="comp-counter">Descrição</Label>
        <Textarea
          id="comp-counter"
          v-model="value"
          :maxlength="max"
          placeholder="ex: Descreva o produto..."
          class="resize-y min-h-[120px]"
        />
        <div class="flex justify-between text-xs text-muted-foreground">
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
    await step('Textarea tem maxlength configurado', async () => {
      const textarea = canvas.getByRole('textbox');
      await expect(textarea).toHaveAttribute('maxlength', '500');
    });
    await step('Contador é anunciado via aria-live', async () => {
      const counter = canvasElement.querySelector('[aria-live="polite"]') as HTMLElement;
      await expect(counter).toBeTruthy();
      await expect(counter.textContent?.trim()).toBe('0/500');
    });
    await step('Digitar atualiza o contador', async () => {
      const textarea = canvas.getByRole('textbox');
      await userEvent.type(textarea, 'Olá mundo');
      await expect(canvas.getByText('9/500')).toBeVisible();
    });
  },
};

export const ComMensagemDeErro: Story = {
  render: () => ({
    components: { Textarea, Label },
    template: `
      <div class="w-80 space-y-1.5">
        <Label for="comp-erro">Descrição</Label>
        <Textarea
          id="comp-erro"
          placeholder="ex: Descreva o produto..."
          aria-invalid="true"
          aria-describedby="comp-erro-msg"
          class="resize-y min-h-[120px]"
        />
        <p id="comp-erro-msg" class="text-sm text-destructive">
          A descrição deve ter no mínimo 20 caracteres.
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Textarea com aria-invalid="true"', async () => {
      const textarea = canvas.getByLabelText('Descrição');
      await expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });
    await step('aria-describedby aponta para a mensagem', async () => {
      const textarea = canvas.getByLabelText('Descrição');
      await expect(textarea).toHaveAttribute('aria-describedby', 'comp-erro-msg');
    });
    await step('Mensagem de erro está visível', async () => {
      await expect(canvas.getByText(/no mínimo 20 caracteres/)).toBeVisible();
    });
  },
};

export const CampoObrigatorio: Story = {
  render: () => ({
    components: { Textarea, Label },
    template: `
      <div class="w-80 space-y-1.5">
        <Label for="comp-obrig">
          Feedback
          <span class="text-destructive" aria-hidden="true">*</span>
        </Label>
        <Textarea
          id="comp-obrig"
          placeholder="O que poderíamos melhorar?"
          aria-required="true"
          class="resize-y min-h-[120px]"
        />
        <p class="text-xs text-muted-foreground">Campos com * são obrigatórios.</p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Textarea obrigatório tem aria-required="true"', async () => {
      const textarea = canvas.getByRole('textbox');
      await expect(textarea).toHaveAttribute('aria-required', 'true');
    });
  },
};
