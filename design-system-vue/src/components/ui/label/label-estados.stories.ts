import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import { Label } from './index';

const meta = {
  title: 'UI/Label/Estados',
  component: Label,
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component: 'Estados do Label: padrão, disabled (via peer-disabled ou group-data-[disabled=true]) e required (via span com aria-hidden).',
      },
    },
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  render: () => ({
    components: { Label },
    setup() { return {}; },
    template: `
      <div class="flex flex-col gap-2">
        <Label for="input-padrao">Nome completo</Label>
        <input id="input-padrao" type="text" class="border rounded px-3 py-1 text-sm" placeholder="Digite aqui" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Label padrão está visível', async () => {
      const label = canvas.getByText('Nome completo');
      await expect(label).toBeVisible();
    });

    await step('Label tem data-slot="label"', async () => {
      const label = canvas.getByText('Nome completo');
      await expect(label).toHaveAttribute('data-slot', 'label');
    });
  },
};

export const Disabled: Story = {
  render: () => ({
    components: { Label },
    setup() { return {}; },
    template: `
      <div class="flex flex-col gap-2">
        <Label for="input-disabled" class="peer-disabled:opacity-50 peer-disabled:cursor-not-allowed">CPF</Label>
        <input
          id="input-disabled"
          type="text"
          class="border rounded px-3 py-1 text-sm peer"
          placeholder="000.000.000-00"
          disabled
        />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Input está desabilitado', async () => {
      const input = canvas.getByPlaceholderText('000.000.000-00');
      await expect(input).toBeDisabled();
    });

    await step('Label está presente', async () => {
      const label = canvas.getByText('CPF');
      await expect(label).toBeInTheDocument();
    });
  },
};

export const DisabledViaGrupo: Story = {
  name: 'Disabled (via group)',
  render: () => ({
    components: { Label },
    setup() { return {}; },
    template: `
      <div class="group flex flex-col gap-2" data-disabled="true">
        <Label for="input-group-disabled">CPF</Label>
        <input
          id="input-group-disabled"
          type="text"
          class="border rounded px-3 py-1 text-sm"
          placeholder="000.000.000-00"
          disabled
        />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Grupo pai tem data-disabled="true"', async () => {
      const group = canvasElement.querySelector('[data-disabled="true"]');
      await expect(group).toBeInTheDocument();
    });

    await step('Label está presente no grupo', async () => {
      const label = canvas.getByText('CPF');
      await expect(label).toBeInTheDocument();
    });
  },
};

export const Required: Story = {
  render: () => ({
    components: { Label },
    setup() { return {}; },
    template: `
      <div class="flex flex-col gap-2">
        <Label for="input-required">
          Email profissional
          <span class="text-destructive" aria-hidden="true">*</span>
        </Label>
        <input
          id="input-required"
          type="email"
          class="border rounded px-3 py-1 text-sm"
          placeholder="voce@empresa.com"
          aria-required="true"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Label com texto está visível', async () => {
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
