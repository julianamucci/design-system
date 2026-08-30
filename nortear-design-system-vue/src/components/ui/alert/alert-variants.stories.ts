import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, expect, fn, userEvent, waitFor } from 'storybook/test';
import { Alert, AlertTitle, AlertDescription } from './index';
// `Info as InfoIcon`: a story exportada se chama `Info` nas 4 stacks; sem o
// alias o ícone e o export colidem no mesmo escopo de módulo.
import { AlertCircle, CheckCircle2, Info as InfoIcon, TriangleAlert } from 'lucide-vue-next';
import { themeContrast, themeReprovas } from '@shared/testing/alert-probe';
import {
  alertContrastSource,
  alertDefaultSource,
  alertDestructiveSource,
  keyboardAlertDismissivelSource,
  alertDismissivelSource,
  alertInfoSource,
  alertSuccessSource,
  alertWarningSource,
} from './alert.source';

const meta = {
  title: 'Primitives/Feedback/Alert/Variants',
  component: Alert,
  tags: ['feedback'],
  parameters: {
    design: figmaDesign('alert'),
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: alertDefaultSource } },
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
  parameters: {
    covers: ['functional.item2'],
    // Sem controls, a variante e o par ícone/mensagem que a acompanham só
    // existem no template — a do meta mostraria a variante padrão.
    docs: { source: { transform: alertDestructiveSource } },
  },
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
  parameters: {
    covers: ['functional.item5'],
    // Mesma razão da destructive: variante, ícone e mensagem vivem no template.
    docs: { source: { transform: alertSuccessSource } },
  },
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
  parameters: {
    // Mesma razão da destructive: variante, ícone e mensagem vivem no template.
    docs: { source: { transform: alertWarningSource } },
  },
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
  parameters: {
    // Mesma razão da destructive: variante, ícone e mensagem vivem no template.
    docs: { source: { transform: alertInfoSource } },
  },
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
  parameters: {
    covers: ['functional.item7', 'visual.item5'],
    // A prop de fechar, o rótulo do botão e o evento não existem na do meta — e
    // a remontagem por :key é andaime da story, que o snippet não reproduz.
    docs: { source: { transform: alertDismissivelSource } },
  },
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

export const DismissibleByKeyboard: Story = {
  parameters: {
    // O teclado não tem nada a configurar, e é isso que o snippet precisa
    // mostrar: a mesma raiz fechável, sem handler de tecla nenhum.
    docs: { source: { transform: keyboardAlertDismissivelSource } },
  },
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

/**
 * As cinco variantes juntas, e a medição é de CONTRASTE.
 *
 * As stories por variante conferem a classe e a cor; nenhuma pergunta se o
 * texto é legível sobre o fundo que a variante pinta. É a pergunta que importa
 * num componente cuja função é chamar atenção.
 *
 * A varredura é dos TRÊS temas de marca nos DOIS modos, não só claro × escuro
 * do tema vigente: cada tema redeclara as quatro cores de feedback, e foi num
 * deles que o título do `info` estava em 3.34:1 enquanto os outros dois
 * passavam com folga.
 */
export const Contrast: Story = {
  parameters: {
    covers: ['accessibility.item3'],
    docs: {
      // São as cinco variantes empilhadas, e sem ícone: outra composição
      // inteira, não uma raiz com atributo diferente.
      source: { transform: alertContrastSource },
      description: {
        story:
          'Título e texto de cada variante medidos contra o fundo composto, nos três temas de marca e nos dois modos. O mínimo é 4.5:1 — o título tem 14px semibold, que pela WCAG não conta como texto grande.',
      },
    },
  },
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <Alert>
          <AlertTitle>Título default</AlertTitle>
          <AlertDescription>Texto corrido da variante default.</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertTitle>Título destructive</AlertTitle>
          <AlertDescription>Texto corrido da variante destructive.</AlertDescription>
        </Alert>
        <Alert variant="success">
          <AlertTitle>Título success</AlertTitle>
          <AlertDescription>Texto corrido da variante success.</AlertDescription>
        </Alert>
        <Alert variant="warning">
          <AlertTitle>Título warning</AlertTitle>
          <AlertDescription>Texto corrido da variante warning.</AlertDescription>
        </Alert>
        <Alert variant="info">
          <AlertTitle>Título info</AlertTitle>
          <AlertDescription>Texto corrido da variante info.</AlertDescription>
        </Alert>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    // Contraste é aritmética, não olhômetro: a play calcula a razão entre a cor
    // do texto e o fundo COMPOSTO (o bg do alert tem alfa, então a cor declarada
    // não é a que se vê). A classe de tema vai no `documentElement`, e não na
    // raiz da story, porque quem pinta por baixo do alert translúcido é o
    // `body` — com a classe só na raiz ele ficava no claro e toda variante
    // acusava ~1:1 no escuro, defeito que não existe.
    const reprovas = themeReprovas(themeContrast(canvasElement));
    await expect(reprovas, reprovas.length ? `\n${reprovas.join('\n')}\n` : '').toEqual([]);
  },
};
