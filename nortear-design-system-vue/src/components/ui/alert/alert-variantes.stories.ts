import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, expect, fn, userEvent, waitFor } from 'storybook/test';
import { Alert, AlertTitle, AlertDescription } from './index';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-vue-next';

const meta = {
  title: 'UI/Alert/Variantes',
  component: Alert,
  tags: ['feedback'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
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
  play: async ({ canvasElement }) => {
    const alert = within(canvasElement).getByRole('alert');
    await expect(alert).toHaveClass('nds-alert');
    await expect(alert).not.toHaveClass('nds-alert-destructive');
    await expect(within(canvasElement).getByText('Atenção')).toBeVisible();
  },
};

export const Destructive: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, AlertCircle },
    setup() { return {}; },
    template: `
      <Alert variant="destructive">
        <AlertCircle class="nds-icon" aria-hidden="true" />
        <AlertTitle>Erro ao salvar</AlertTitle>
        <AlertDescription>Não foi possível salvar. Verifique sua conexão e tente novamente.</AlertDescription>
      </Alert>
    `,
  }),
  play: async ({ canvasElement }) => {
    const alert = within(canvasElement).getByRole('alert');
    await expect(alert).toHaveClass('nds-alert-destructive');
    await expect(within(canvasElement).getByText('Erro ao salvar')).toBeVisible();
  },
};

export const Success: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, CheckCircle2 },
    setup() { return {}; },
    template: `
      <Alert variant="success">
        <CheckCircle2 class="nds-icon" aria-hidden="true" />
        <AlertTitle>Perfil atualizado</AlertTitle>
        <AlertDescription>Suas informações foram salvas com sucesso.</AlertDescription>
      </Alert>
    `,
  }),
  play: async ({ canvasElement }) => {
    const alert = within(canvasElement).getByRole('alert');
    await expect(alert).toHaveClass('nds-alert-success');
    await expect(within(canvasElement).getByText('Perfil atualizado')).toBeVisible();
  },
};

export const Warning: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, TriangleAlert },
    setup() { return {}; },
    template: `
      <Alert variant="warning">
        <TriangleAlert class="nds-icon" aria-hidden="true" />
        <AlertTitle>Assinatura expirando</AlertTitle>
        <AlertDescription>Sua assinatura expira em 3 dias. Renove para evitar interrupções.</AlertDescription>
      </Alert>
    `,
  }),
  play: async ({ canvasElement }) => {
    const alert = within(canvasElement).getByRole('alert');
    await expect(alert).toHaveClass('nds-alert-warning');
    await expect(within(canvasElement).getByText('Assinatura expirando')).toBeVisible();
  },
};

export const InfoVariant: Story = {
  name: 'Info',
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, Info },
    setup() { return {}; },
    template: `
      <Alert variant="info">
        <Info class="nds-icon" aria-hidden="true" />
        <AlertTitle>Dica</AlertTitle>
        <AlertDescription>Você pode personalizar os atalhos de teclado nas configurações.</AlertDescription>
      </Alert>
    `,
  }),
  play: async ({ canvasElement }) => {
    const alert = within(canvasElement).getByRole('alert');
    await expect(alert).toHaveClass('nds-alert-info');
    await expect(within(canvasElement).getByText('Dica')).toBeVisible();
  },
};

const dismissSpy = fn();

// O fechamento é definitivo por instância (o Alert desmonta a si mesmo). Para que
// o canvas nunca fique vazio — e o Chromatic não fotografe nada — o wrapper
// remonta um alert NOVO via :key após o dismiss. A play mede o nó ORIGINAL, então
// a prova da remoção continua válida.
export const Dismissible: Story = {
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, CheckCircle2 },
    setup() {
      const instanceKey = ref(0);
      function onDismiss() {
        dismissSpy();
        instanceKey.value += 1;
      }
      return { instanceKey, onDismiss };
    },
    template: `
      <Alert :key="instanceKey" variant="success" dismissible dismiss-label="Fechar alerta" @dismiss="onDismiss">
        <CheckCircle2 class="nds-icon" aria-hidden="true" />
        <AlertTitle>Perfil atualizado</AlertTitle>
        <AlertDescription>Suas informações foram salvas com sucesso.</AlertDescription>
      </Alert>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    dismissSpy.mockClear();
    const canvas = within(canvasElement);

    await step('Botão de fechar é visível e acessível por rótulo', async () => {
      const closeButton = canvas.getByRole('button', { name: 'Fechar alerta' });
      await expect(closeButton).toBeVisible();
    });

    await step('Clique remove o alert original e dispara o emit uma única vez', async () => {
      const alertOriginal = canvas.getByRole('alert');
      await userEvent.click(canvas.getByRole('button', { name: 'Fechar alerta' }));
      await waitFor(() => expect(alertOriginal).not.toBeInTheDocument());
      await expect(dismissSpy).toHaveBeenCalledTimes(1);
    });

    await step('Um alert novo assume o lugar — o canvas nunca fica vazio', async () => {
      await waitFor(() => expect(canvas.getByRole('alert')).toBeVisible());
    });
  },
};

const dismissKeyboardSpy = fn();

export const DismissibleTeclado: Story = {
  name: 'Dismissible (teclado)',
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, Info },
    setup() {
      const instanceKey = ref(0);
      function onDismiss() {
        dismissKeyboardSpy();
        instanceKey.value += 1;
      }
      return { instanceKey, onDismiss };
    },
    template: `
      <Alert :key="instanceKey" dismissible dismiss-label="Fechar alerta" @dismiss="onDismiss">
        <Info class="nds-icon" aria-hidden="true" />
        <AlertTitle>Atenção</AlertTitle>
        <AlertDescription>Suas alterações serão aplicadas na próxima sessão.</AlertDescription>
      </Alert>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    dismissKeyboardSpy.mockClear();
    const canvas = within(canvasElement);

    await step('Enter no botão focado remove o alert original e dispara o emit uma única vez', async () => {
      const alertOriginal = canvas.getByRole('alert');
      const closeButton = canvas.getByRole('button', { name: 'Fechar alerta' });
      closeButton.focus();
      await expect(closeButton).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await waitFor(() => expect(alertOriginal).not.toBeInTheDocument());
      await expect(dismissKeyboardSpy).toHaveBeenCalledTimes(1);
    });

    await step('Um alert novo assume o lugar — o canvas nunca fica vazio', async () => {
      await waitFor(() => expect(canvas.getByRole('alert')).toBeVisible());
    });
  },
};
