import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import { Label } from './index';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const meta = {
  title: 'UI/Label/Composicoes',
  component: Label,
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component: 'Composicoes do Label com outros componentes de formulário: Input, Checkbox e campo obrigatório.',
      },
    },
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComInput: Story = {
  render: () => ({
    components: { Label, Input },
    setup() { return {}; },
    template: `
      <div class="flex flex-col gap-2 w-64">
        <Label for="telefone">Telefone</Label>
        <Input id="telefone" type="tel" placeholder="+55 (11) 99999-9999" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Label e Input estão presentes', async () => {
      await expect(canvas.getByText('Telefone')).toBeVisible();
      await expect(canvas.getByPlaceholderText('+55 (11) 99999-9999')).toBeInTheDocument();
    });

    await step('Label associado ao Input via for/id', async () => {
      const label = canvas.getByText('Telefone');
      await expect(label).toHaveAttribute('for', 'telefone');
    });
  },
};

export const ComCheckbox: Story = {
  render: () => ({
    components: { Label, Checkbox },
    setup() { return {}; },
    template: `
      <div class="flex items-center gap-2">
        <Checkbox id="termos" />
        <Label for="termos">Aceito os termos de uso</Label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Label está visível', async () => {
      await expect(canvas.getByText('Aceito os termos de uso')).toBeVisible();
    });

    await step('Label associado ao Checkbox via for/id', async () => {
      const label = canvas.getByText('Aceito os termos de uso');
      await expect(label).toHaveAttribute('for', 'termos');
    });
  },
};

export const CampoObrigatorio: Story = {
  name: 'Com Input obrigatório',
  render: () => ({
    components: { Label, Input },
    setup() { return {}; },
    template: `
      <div class="flex flex-col gap-2 w-64">
        <Label for="email-obrigatorio">
          Email profissional
          <span class="text-destructive" aria-hidden="true">*</span>
        </Label>
        <Input
          id="email-obrigatorio"
          type="email"
          placeholder="voce@empresa.com"
          aria-required="true"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Label com marcador required está visível', async () => {
      await expect(canvas.getByText('Email profissional')).toBeInTheDocument();
    });

    await step('Asterisco tem aria-hidden="true"', async () => {
      const asterisk = canvasElement.querySelector('span[aria-hidden="true"]');
      await expect(asterisk).toBeInTheDocument();
      await expect(asterisk?.textContent).toBe('*');
    });

    await step('Input tem aria-required="true"', async () => {
      const input = canvas.getByPlaceholderText('voce@empresa.com');
      await expect(input).toHaveAttribute('aria-required', 'true');
    });
  },
};
