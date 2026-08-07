import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, expect, fn, userEvent, waitFor } from 'storybook/test';
import { Alert, AlertTitle, AlertDescription } from './index';
// `Info as InfoIcon`: a story exportada se chama `Info` nas 4 stacks; sem o
// alias o ícone e o export colidem no mesmo escopo de módulo.
import { AlertCircle, CheckCircle2, Info as InfoIcon, TriangleAlert } from 'lucide-vue-next';

const meta = {
  title: 'UI/Alert/Variantes',
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

export const Default: Story = {
  parameters: { covers: ['functional.item1', 'accessibility.item3', 'visual.item2'] },
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, InfoIcon },
    setup() { return {}; },
    template: `
      <Alert>
        <InfoIcon class="nds-icon" aria-hidden="true" />
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
  parameters: { covers: ['functional.item2'] },
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
  parameters: { covers: ['functional.item5'] },
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

export const Info: Story = {
  name: 'Info',
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, InfoIcon },
    setup() { return {}; },
    template: `
      <Alert variant="info">
        <InfoIcon class="nds-icon" aria-hidden="true" />
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
  parameters: { covers: ['functional.item7', 'visual.item5'] },
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

    // Primeiro step de propósito: só vale enquanto a entrada ainda roda.
    // A entrada só existe logo depois de montar. O painel Interactions
    // reexecuta a play no MESMO DOM, onde o alert já assentou — então, quando a
    // classe não está lá, provocamos uma remontagem (o wrapper remonta ao
    // fechar) e medimos no nó novo. Em montagem limpa nada disso roda.
    await step('Animação de descendente não encerra a entrada antes da hora', async () => {
      let alert = canvas.getByRole('alert');
      if (!alert.classList.contains('nds-animate-in')) {
        await userEvent.click(canvas.getByRole('button', { name: 'Fechar alerta' }));
        alert = await waitFor(() => {
          const novo = canvas.getByRole('alert');
          if (!novo.classList.contains('nds-animate-in')) throw new Error('aguardando remontagem');
          return novo;
        });
        dismissSpy.mockClear(); // o fechamento de preparo não entra na contagem
      }
      await expect(alert).toHaveClass('nds-animate-in');

      // `animationend` borbulha — sem a guarda de `event.target`, a animação de
      // qualquer filho (o botão de fechar, um ícone) encerraria a fase de
      // entrada do alert.
      const dismiss = canvas.getByRole('button', { name: 'Fechar alerta' });
      dismiss.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
      await expect(alert).toHaveClass('nds-animate-in');

      // Já a animação do PRÓPRIO alert encerra a entrada — e um segundo evento
      // não tem mais nada a limpar.
      alert.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
      await waitFor(() => expect(alert).not.toHaveClass('nds-animate-in'));
      alert.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
      await expect(alert).not.toHaveClass('nds-animate-in');
    });

    await step('Botão de fechar é visível e acessível por rótulo', async () => {
      // waitFor: o alert dismissible ENTRA animado (.nds-animate-in, opacidade
      // 0 → 1). Asserção de visibilidade no primeiro quadro é racy em qualquer
      // browser — e no Chromium headless dos testes a animação fica presa no
      // quadro zero até o timeout de segurança limpar a classe.
      await waitFor(() =>
        expect(canvas.getByRole('button', { name: 'Fechar alerta' })).toBeVisible(),
      );
    });


    await step('X é o ÚLTIMO filho — leitor de tela encontra o conteúdo antes', async () => {
      // Mesma verificação do Vanilla e do React: a ordem de leitura é contrato,
      // não detalhe visual. Botão antes do conteúdo faria o leitor anunciar
      // "fechar" antes de dizer o que seria fechado.
      const alert = canvas.getByRole('alert');
      await expect(alert.lastElementChild).toHaveAttribute('data-slot', 'alert-dismiss');
    });
    await step('Clique remove o alert original e dispara o emit uma única vez', async () => {
      const alertOriginal = canvas.getByRole('alert');
      const dismiss = canvas.getByRole('button', { name: 'Fechar alerta' });
      await userEvent.click(dismiss);
      // Segunda ativação com a saída ainda em curso: tem que cair na guarda de
      // fechamento em andamento. Sem ela o `toHaveBeenCalledTimes(1)` abaixo é
      // verdade trivial — nunca houve chance de disparar duas vezes.
      dismiss.click();
      // E a animação de um descendente também não pode encerrar a saída.
      dismiss.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
      await expect(alertOriginal).toBeInTheDocument();
      // waitFor: a saída é animada (.nds-animate-out) e o nó só sai do DOM
      // quando a animação termina — ou no timeout de segurança do primitivo.
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
    components: { Alert, AlertTitle, AlertDescription, InfoIcon },
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
        <InfoIcon class="nds-icon" aria-hidden="true" />
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
      // waitFor: a saída é animada (.nds-animate-out) e o nó só sai do DOM
      // quando a animação termina — ou no timeout de segurança do primitivo.
      await waitFor(() => expect(alertOriginal).not.toBeInTheDocument());
      await expect(dismissKeyboardSpy).toHaveBeenCalledTimes(1);
    });

    await step('Um alert novo assume o lugar — o canvas nunca fica vazio', async () => {
      await waitFor(() => expect(canvas.getByRole('alert')).toBeVisible());
    });
  },
};
