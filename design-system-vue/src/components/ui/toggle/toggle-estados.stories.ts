import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect } from 'storybook/test';
import { Toggle } from './index';
import { Bold, Underline } from 'lucide-vue-next';

const meta = {
  title: 'UI/Toggle/Estados',
  component: Toggle,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Toggle: off, on (pressed), focus, disabled e invalid (aria-invalid).',
      },
    },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {
  render: () => ({
    components: { Toggle, Bold },
    setup() { return {}; },
    template: `
      <Toggle aria-label="Negrito">
        <Bold aria-hidden="true" />
      </Toggle>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Negrito' });
    await step('aria-pressed=false por padrão', async () => {
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
      await expect(toggle).toHaveAttribute('data-state', 'off');
    });
  },
};

export const On: Story = {
  render: () => ({
    components: { Toggle, Bold },
    setup() { return {}; },
    template: `
      <Toggle :default-value="true" aria-label="Negrito">
        <Bold aria-hidden="true" />
      </Toggle>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Negrito' });
    await step('aria-pressed=true (data-state=on)', async () => {
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
      await expect(toggle).toHaveAttribute('data-state', 'on');
    });
  },
};

export const FocoVisivel: Story = {
  render: () => ({
    components: { Toggle, Underline },
    setup() { return {}; },
    template: `
      <Toggle aria-label="Sublinhado">
        <Underline aria-hidden="true" />
      </Toggle>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Foco via teclado: Tab move o foco ao Toggle; o anel ring-3 ring-ring/50 fica visível.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Sublinhado' });
    await step('Toggle recebe foco programaticamente', async () => {
      (toggle as HTMLElement).focus();
      await expect(toggle).toHaveFocus();
    });
  },
};

export const Disabled: Story = {
  render: () => ({
    components: { Toggle, Bold },
    setup() { return {}; },
    template: `
      <Toggle :disabled="true" aria-label="Negrito">
        <Bold aria-hidden="true" />
      </Toggle>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Negrito' });
    await step('Toggle tem disabled e data-disabled', async () => {
      await expect(toggle).toBeDisabled();
      await expect(toggle).toHaveAttribute('data-disabled');
    });
    await step('Clicar não altera o estado', async () => {
      await userEvent.click(toggle, { pointerEventsCheck: 0 });
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    });
  },
};

export const Invalid: Story = {
  render: () => ({
    components: { Toggle, Bold },
    setup() { return {}; },
    template: `
      <div class="space-y-2">
        <Toggle aria-label="Negrito" aria-invalid="true" aria-describedby="toggle-invalid-err">
          <Bold aria-hidden="true" />
        </Toggle>
        <p id="toggle-invalid-err" class="text-sm text-destructive">
          Este campo é obrigatório.
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Negrito' });
    await step('Toggle tem aria-invalid=true', async () => {
      await expect(toggle).toHaveAttribute('aria-invalid', 'true');
    });
    await step('Mensagem de erro visível', async () => {
      await expect(canvas.getByText('Este campo é obrigatório.')).toBeVisible();
    });
  },
};
