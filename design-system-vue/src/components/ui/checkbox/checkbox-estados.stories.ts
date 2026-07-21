import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, userEvent } from 'storybook/test';
import { Checkbox } from './index';

const meta = {
  title: 'UI/Checkbox/Estados',
  component: Checkbox,
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Estados do Checkbox: unchecked (padrão), checked, disabled e error (aria-invalid). O estado indeterminate está disponível apenas no Svelte (prop `indeterminate` bindable).',
      },
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {
  render: () => ({
    components: { Checkbox },
    setup() { return {}; },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <Checkbox id="unchecked" />
        <label
          for="unchecked"
          class="nds-text-body nds-font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70" style="line-height: 1"
        >
          Aceito os termos e condições
        </label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox presente e desmarcado', async () => {
      await expect(checkbox).toBeInTheDocument();
      await expect(checkbox).not.toBeChecked();
    });

    await step('aria-checked é false', async () => {
      await expect(checkbox).toHaveAttribute('aria-checked', 'false');
    });
  },
};

export const Checked: Story = {
  render: () => ({
    components: { Checkbox },
    setup() { return {}; },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <Checkbox id="checked" :checked="true" />
        <label
          for="checked"
          class="nds-text-body nds-font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70" style="line-height: 1"
        >
          Aceito os termos e condições
        </label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox presente e marcado', async () => {
      await expect(checkbox).toBeInTheDocument();
      await expect(checkbox).toBeChecked();
    });

    await step('aria-checked é true', async () => {
      await expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });
  },
};

export const Disabled: Story = {
  render: () => ({
    components: { Checkbox },
    setup() { return {}; },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <Checkbox id="disabled" :disabled="true" />
        <label
          for="disabled"
          class="nds-text-body nds-font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70" style="line-height: 1"
        >
          Manter sessão ativa
        </label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox presente e desabilitado', async () => {
      await expect(checkbox).toBeInTheDocument();
      await expect(checkbox).toBeDisabled();
    });

    await step('Clique não altera o estado', async () => {
      await userEvent.click(checkbox, { pointerEventsCheck: 0 });
      await expect(checkbox).not.toBeChecked();
    });
  },
};

export const DisabledChecked: Story = {
  render: () => ({
    components: { Checkbox },
    setup() { return {}; },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <Checkbox id="disabled-checked" :disabled="true" :checked="true" />
        <label
          for="disabled-checked"
          class="nds-text-body nds-font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70" style="line-height: 1"
        >
          Receber notificações push
        </label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox marcado e desabilitado', async () => {
      await expect(checkbox).toBeChecked();
      await expect(checkbox).toBeDisabled();
    });
  },
};

export const Error: Story = {
  render: () => ({
    components: { Checkbox },
    setup() { return {}; },
    template: `
      <div class="nds-stack" data-spacing="xs">
        <div class="nds-cluster" data-spacing="sm">
          <Checkbox id="error" aria-invalid="true" aria-describedby="error-msg" />
          <label
            for="error"
            class="nds-text-body nds-font-medium" style="line-height: 1"
          >
            Aceito os termos e condições
          </label>
        </div>
        <p id="error-msg" class="nds-text-body nds-text-destructive" style="padding-left: 1.5rem">
          Você precisa aceitar os termos para continuar.
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox com aria-invalid presente', async () => {
      await expect(checkbox).toBeInTheDocument();
      await expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    });

    await step('aria-describedby aponta para mensagem de erro', async () => {
      await expect(checkbox).toHaveAttribute('aria-describedby', 'error-msg');
    });

    await step('Mensagem de erro visível', async () => {
      await expect(canvas.getByText(/precisa aceitar/)).toBeVisible();
    });
  },
};

export const FocoVisivel: Story = {
  render: () => ({
    components: { Checkbox },
    setup() { return {}; },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <Checkbox id="focus" />
        <label
          for="focus"
          class="nds-text-body nds-font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70" style="line-height: 1"
        >
          Foco visível via teclado
        </label>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Estado de foco via teclado. Use Tab para navegar e verificar o ring de foco --ring.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox recebe foco via teclado', async () => {
      (checkbox as HTMLElement).focus();
      await expect(checkbox).toHaveFocus();
    });
  },
};
