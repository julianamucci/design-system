import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect } from 'storybook/test';
import { Input } from './index';
import { Label } from '@/components/ui/label';

const meta = {
  title: 'UI/Input/Composicoes',
  component: Input,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'O Input deve ser sempre acompanhado de um Label acessível. Composicoes comuns: com Label, com texto de apoio (hint), e com mensagem de erro. O InputGroup (React-only) não está disponível nesta stack.',
      },
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComLabel: Story = {
  render: () => ({
    components: { Input, Label },
    template: `
      <div class="w-64 space-y-1.5">
        <Label for="nome-completo">Nome completo</Label>
        <Input id="nome-completo" type="text" placeholder="ex: João da Silva" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Label está visível', async () => {
      const label = canvas.getByText('Nome completo');
      await expect(label).toBeVisible();
    });
    await step('Input associado ao Label via getByLabelText', async () => {
      const input = canvas.getByLabelText('Nome completo');
      await expect(input).toBeVisible();
    });
    await step('Digitar no input associado ao label funciona', async () => {
      const input = canvas.getByLabelText('Nome completo');
      await userEvent.type(input, 'Maria Silva');
      await expect(input).toHaveValue('Maria Silva');
    });
  },
};

export const ComTextoDeApoio: Story = {
  render: () => ({
    components: { Input, Label },
    template: `
      <div class="w-64 space-y-1.5">
        <Label for="email-apoio">Email</Label>
        <Input id="email-apoio" type="email" placeholder="ex: joao@empresa.com" />
        <p class="text-sm text-muted-foreground">Usaremos este endereço para notificações.</p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Label, input e texto de apoio estão visíveis', async () => {
      await expect(canvas.getByLabelText('Email')).toBeVisible();
      await expect(canvas.getByText(/Usaremos este endereço/)).toBeVisible();
    });
  },
};

export const ComMensagemDeErro: Story = {
  render: () => ({
    components: { Input, Label },
    template: `
      <div class="w-64 space-y-1.5">
        <Label for="email-erro">Email</Label>
        <Input
          id="email-erro"
          type="email"
          placeholder="ex: joao@empresa.com"
          aria-invalid="true"
          aria-describedby="email-erro-msg"
        />
        <p id="email-erro-msg" class="text-sm text-destructive">
          Email inválido. Use o formato nome@dominio.com
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input com estado de erro está visível', async () => {
      const input = canvas.getByLabelText('Email');
      await expect(input).toHaveAttribute('aria-invalid', 'true');
    });
    await step('aria-describedby aponta para a mensagem de erro', async () => {
      const input = canvas.getByLabelText('Email');
      await expect(input).toHaveAttribute('aria-describedby', 'email-erro-msg');
    });
    await step('Mensagem de erro está visível', async () => {
      await expect(canvas.getByText(/Email inválido/)).toBeVisible();
    });
  },
};

export const CampoObrigatorio: Story = {
  render: () => ({
    components: { Input, Label },
    template: `
      <div class="w-64 space-y-1.5">
        <Label for="nome-obrig">
          Nome completo
          <span class="text-destructive" aria-hidden="true">*</span>
        </Label>
        <Input
          id="nome-obrig"
          type="text"
          placeholder="ex: João da Silva"
          aria-required="true"
        />
        <p class="text-xs text-muted-foreground">Campos com * são obrigatórios.</p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Input obrigatório possui aria-required="true"', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).toHaveAttribute('aria-required', 'true');
    });
  },
};
