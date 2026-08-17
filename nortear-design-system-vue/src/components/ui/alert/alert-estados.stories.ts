import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import { Alert, AlertTitle, AlertDescription } from './index';
import { Info } from 'lucide-vue-next';

const meta = {
  title: 'UI/Alert/States',
  component: Alert,
  tags: ['feedback'],
  parameters: {
    design: figmaDesign('alert'),
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Complete: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, Info },
    setup() { return {}; },
    template: `
      <Alert>
        <Info class="nds-icon" aria-hidden="true" />
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

export const WithoutTitle: Story = {
  parameters: { covers: ['functional.item4', 'visual.item3'] },
  render: () => ({
    components: { Alert, AlertDescription, Info },
    setup() { return {}; },
    template: `
      <Alert>
        <Info class="nds-icon" aria-hidden="true" />
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

export const WithoutIcon: Story = {
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

// Regressão do bug em que TODA docs page tinha suas notas de implementação
// anunciadas de imediato: o Alert marcava `role="alert"` fixo, e alert é live
// region assertiva. Conteúdo estático pede `role="note"`, que não anuncia.
// A story prova os dois lados no mesmo canvas — o valor explícito e o default
// intacto para quem depende do anúncio.
export const WithoutAnnouncement: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, Info },
    setup() { return {}; },
    template: `
      <div class="nds-stack" data-spacing="md">
        <Alert role="note" data-testid="alert-nota">
          <Info class="nds-icon" aria-hidden="true" />
          <AlertTitle>Nota de implementação</AlertTitle>
          <AlertDescription>Conteúdo estático, já presente no carregamento: o leitor de tela lê na ordem da página, sem interromper.</AlertDescription>
        </Alert>
        <Alert data-testid="alert-padrao">
          <Info class="nds-icon" aria-hidden="true" />
          <AlertTitle>Falha ao salvar</AlertTitle>
          <AlertDescription>Sem role explícito o alert segue como live region assertiva.</AlertDescription>
        </Alert>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('role="note" chega na raiz do alert', async () => {
      await expect(canvas.getByTestId('alert-nota')).toHaveAttribute('role', 'note');
    });

    await step('O alert com role="note" não é live region', async () => {
      // Um único elemento com role alert no canvas: o da direita. Se o valor da
      // prop não vencesse o `role` fixo do template, aqui seriam dois.
      await expect(canvas.getAllByRole('alert')).toHaveLength(1);
      await expect(canvas.getByRole('note')).toBe(canvas.getByTestId('alert-nota'));
    });

    await step('Sem a prop, o default continua alert', async () => {
      await expect(canvas.getByTestId('alert-padrao')).toHaveAttribute('role', 'alert');
      await expect(canvas.getByRole('alert')).toBe(canvas.getByTestId('alert-padrao'));
    });
  },
};

export const DynamicInsertion: Story = {
  parameters: { covers: ['functional.item6'] },
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, Info },
    setup() { return {}; },
    template: `
      <div aria-live="polite">
        <Alert>
          <Info class="nds-icon" aria-hidden="true" />
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
