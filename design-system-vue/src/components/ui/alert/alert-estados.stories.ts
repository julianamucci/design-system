import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import { Alert, AlertTitle, AlertDescription } from './index';

const meta = {
  title: 'UI/Alert/Estados',
  component: Alert,
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Completo: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription },
    setup() { return {}; },
    template: `
      <Alert>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
        </svg>
        <AlertTitle>Atenção</AlertTitle>
        <AlertDescription>Suas alterações serão aplicadas na próxima sessão.</AlertDescription>
      </Alert>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Role alert presente', async () => {
      await expect(canvas.getByRole('alert')).toBeInTheDocument();
    });

    await step('AlertTitle e AlertDescription visíveis', async () => {
      await expect(canvas.getByText('Atenção')).toBeVisible();
      await expect(canvas.getByText(/próxima sessão/)).toBeVisible();
    });
  },
};

export const SemTitulo: Story = {
  render: () => ({
    components: { Alert, AlertDescription },
    setup() { return {}; },
    template: `
      <Alert>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
        </svg>
        <AlertDescription>Suas alterações serão aplicadas na próxima sessão.</AlertDescription>
      </Alert>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Alert visível sem título', async () => {
      await expect(canvas.getByRole('alert')).toBeVisible();
    });

    await step('Sem elemento de título no DOM', async () => {
      const alert = canvas.getByRole('alert');
      const heading = alert.querySelector('[data-slot="alert-title"]');
      await expect(heading).toBeNull();
    });
  },
};

export const SemIcone: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription },
    setup() { return {}; },
    template: `
      <Alert>
        <AlertTitle>Atenção</AlertTitle>
        <AlertDescription>Suas alterações serão aplicadas na próxima sessão.</AlertDescription>
      </Alert>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Alert visível sem ícone', async () => {
      await expect(canvas.getByRole('alert')).toBeVisible();
    });

    await step('Sem SVG filho direto no alert', async () => {
      const alert = canvas.getByRole('alert');
      const svg = alert.querySelector(':scope > svg');
      await expect(svg).toBeNull();
    });
  },
};

export const InsercaoDinamica: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription },
    setup() { return {}; },
    template: `
      <div aria-live="polite">
        <Alert>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
          </svg>
          <AlertTitle>Operação concluída</AlertTitle>
          <AlertDescription>O relatório foi gerado com sucesso.</AlertDescription>
        </Alert>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Alert dentro de região aria-live', async () => {
      const liveRegion = canvasElement.querySelector('[aria-live="polite"]');
      await expect(liveRegion).toBeInTheDocument();
    });

    await step('Role alert presente na região live', async () => {
      await expect(canvas.getByRole('alert')).toBeVisible();
    });
  },
};
