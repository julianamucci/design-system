import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, fn, userEvent, waitFor } from 'storybook/test';
import { Alert } from './index';
import AlertStory from './AlertStory.svelte';
import AlertDismissivelStory from './AlertDismissivelStory.svelte';
import { contrasteNosDoisTemas, descreverFalhas } from '@shared/testing/alert-probe';
import AlertContrasteStory from './AlertContrasteStory.svelte';

const meta: Meta = {
  parameters: {
    design: figmaDesign('alert'),
    controls: { disable: true },
    actions: { disable: true },
  },
  title: 'UI/Alert/Variantes',
  component: Alert,
  tags: ['feedback'],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: { covers: ['functional.item1', 'accessibility.item3', 'visual.item2'] },
  render: () => ({
    Component: AlertStory,
    props: {
      variant: 'default',
      title: 'Atenção',
      description: 'Suas alterações serão aplicadas na próxima sessão.',
      showIcon: true,
      icon: 'info',
    },
  }),

  play: async ({ canvasElement }) => {
    const alert = await within(canvasElement).findByRole('alert');
    await expect(alert).toHaveClass('nds-alert');
    await expect(alert).not.toHaveClass('nds-alert-destructive');
    await expect(within(canvasElement).getByText('Atenção')).toBeVisible();
  },
};

export const Destructive: Story = {
  parameters: { covers: ['functional.item2'] },
  render: () => ({
    Component: AlertStory,
    props: {
      variant: 'destructive',
      title: 'Erro ao salvar',
      description: 'Não foi possível salvar. Verifique sua conexão e tente novamente.',
      showIcon: true,
      icon: 'error',
    },
  }),

  play: async ({ canvasElement }) => {
    const alert = await within(canvasElement).findByRole('alert');
    await expect(alert).toHaveClass('nds-alert-destructive');
    await expect(within(canvasElement).getByText('Erro ao salvar')).toBeVisible();
  },
};

export const Success: Story = {
  parameters: { covers: ['functional.item5'] },
  render: () => ({
    Component: AlertStory,
    props: {
      variant: 'success',
      title: 'Perfil atualizado',
      description: 'Suas informações foram salvas com sucesso.',
      showIcon: true,
      icon: 'success',
    },
  }),

  play: async ({ canvasElement }) => {
    const alert = await within(canvasElement).findByRole('alert');
    await expect(alert).toHaveClass('nds-alert-success');
    await expect(within(canvasElement).getByText('Perfil atualizado')).toBeVisible();
  },
};

export const Warning: Story = {
  render: () => ({
    Component: AlertStory,
    props: {
      variant: 'warning',
      title: 'Assinatura expirando',
      description: 'Sua assinatura expira em 3 dias. Renove para evitar interrupções.',
      showIcon: true,
      icon: 'warning',
    },
  }),

  play: async ({ canvasElement }) => {
    const alert = await within(canvasElement).findByRole('alert');
    await expect(alert).toHaveClass('nds-alert-warning');
    await expect(within(canvasElement).getByText('Assinatura expirando')).toBeVisible();
  },
};

export const Info: Story = {
  render: () => ({
    Component: AlertStory,
    props: {
      variant: 'info',
      title: 'Dica',
      description: 'Você pode fixar seus filtros favoritos para acessá-los mais rápido.',
      showIcon: true,
      icon: 'info',
    },
  }),

  play: async ({ canvasElement }) => {
    const alert = await within(canvasElement).findByRole('alert');
    await expect(alert).toHaveClass('nds-alert-info');
    await expect(within(canvasElement).getByText('Dica')).toBeVisible();
  },
};

// As duas stories abaixo usam AlertDismissivelStory: fechar remove o alert e
// remonta um novo em seguida, então o canvas nunca fica vazio (Chromatic
// fotografava a story vazia). A prova da remoção mede o nó ORIGINAL.
export const Dismissible: Story = {
  parameters: { covers: ['functional.item7', 'visual.item5'] },
  args: {
    dismissible: true,
    onDismiss: fn(),
  },
  render: (args) => ({
    Component: AlertDismissivelStory,
    props: {
      onDismiss: args.onDismiss,
    },
  }),

  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    const onDismiss = args.onDismiss as unknown as ReturnType<typeof fn>;

    // Primeiro step de propósito: só vale enquanto a entrada ainda roda.
    // A entrada só existe logo depois de montar. O painel Interactions
    // reexecuta a play no MESMO DOM, onde o alert já assentou — então, quando a
    // classe não está lá, provocamos uma remontagem (o wrapper remonta ao
    // fechar) e medimos no nó novo. Em montagem limpa nada disso roda.
    await step('Animação de descendente não encerra a entrada antes da hora', async () => {
      let alert = await canvas.findByRole('alert');
      if (!alert.classList.contains('nds-animate-in')) {
        await userEvent.click(canvas.getByRole('button', { name: 'Fechar alerta' }));
        alert = await waitFor(() => {
          const novo = canvas.getByRole('alert');
          if (!novo.classList.contains('nds-animate-in')) throw new Error('aguardando remontagem');
          return novo;
        });
        onDismiss.mockClear(); // o fechamento de preparo não entra na contagem
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

    await step('Botão de fechar visível e acessível por rótulo', async () => {
      // waitFor: o alert dismissible ENTRA animado (.nds-animate-in, opacidade
      // 0 → 1). Asserção de visibilidade no primeiro quadro é racy em qualquer
      // browser — e no Chromium headless dos testes a animação fica presa no
      // quadro zero até o timeout de segurança limpar a classe.
      await waitFor(async () => {
        const dismissButton = await canvas.findByRole('button', { name: 'Fechar alerta' });
        await expect(dismissButton).toBeVisible();
      });
    });


    await step('X é o ÚLTIMO filho — leitor de tela encontra o conteúdo antes', async () => {
      // Mesma verificação do Vanilla e do React: a ordem de leitura é contrato,
      // não detalhe visual. Botão antes do conteúdo faria o leitor anunciar
      // "fechar" antes de dizer o que seria fechado.
      const alert = canvas.getByRole('alert');
      await expect(alert.lastElementChild).toHaveAttribute('data-slot', 'alert-dismiss');
    });
    await step('Clique no X remove o alert e dispara o callback uma única vez', async () => {
      const alertOriginal = canvas.getByRole('alert');
      const dismissButton = canvas.getByRole('button', { name: 'Fechar alerta' });
      await userEvent.click(dismissButton);
      // Segunda ativação com a saída ainda em curso: tem que cair na guarda de
      // fechamento em andamento. Sem ela o `toHaveBeenCalledTimes(1)` abaixo é
      // verdade trivial — nunca houve chance de disparar duas vezes.
      dismissButton.click();
      // E a animação de um descendente também não pode encerrar a saída.
      dismissButton.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
      await expect(alertOriginal).toBeInTheDocument();
      // waitFor: a saída é animada (.nds-animate-out) e o nó só sai do DOM
      // quando a animação termina — ou no timeout de segurança do primitivo.
      await waitFor(() => expect(alertOriginal).not.toBeInTheDocument());
      await expect(args.onDismiss).toHaveBeenCalledTimes(1);
    });

    await step('Um alert novo volta ao canvas — a story não fica vazia', async () => {
      await waitFor(() => expect(canvas.getByRole('alert')).toBeVisible());
    });
  },
};

export const DismissibleTeclado: Story = {
  args: {
    dismissible: true,
    onDismiss: fn(),
  },
  render: (args) => ({
    Component: AlertDismissivelStory,
    props: {
      onDismiss: args.onDismiss,
    },
  }),

  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);

    await step('Enter no botão focado remove o alert e dispara o callback uma única vez', async () => {
      const alertOriginal = await canvas.findByRole('alert');
      const dismissButton = canvas.getByRole('button', { name: 'Fechar alerta' });
      // waitFor: o alert entra animado (.nds-animate-in) — medir o botão no
      // meio da animação é racy, e no headless ela fica presa no quadro zero
      // até o timeout de segurança limpar a classe.
      await waitFor(() => expect(dismissButton).toBeVisible());
      dismissButton.focus();
      await expect(dismissButton).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      // waitFor: a saída é animada (.nds-animate-out) e o nó só sai do DOM
      // quando a animação termina — ou no timeout de segurança do primitivo.
      await waitFor(() => expect(alertOriginal).not.toBeInTheDocument());
      await expect(args.onDismiss).toHaveBeenCalledTimes(1);
    });

    await step('Um alert novo volta ao canvas — a story não fica vazia', async () => {
      await waitFor(() => expect(canvas.getByRole('alert')).toBeVisible());
    });
  },
};

/**
 * As cinco variantes juntas, e a medição é de CONTRASTE.
 *
 * As stories por variante conferem a classe e a cor; nenhuma perguntava se o
 * texto é legível sobre o fundo que a variante pinta. É a pergunta que importa
 * num componente cuja função é chamar atenção — e a que estava sem resposta no
 * tema escuro.
 */
export const Contraste: Story = {
  parameters: {
    covers: ['accessibility.item3'],
    docs: {
      description: {
        story:
          'Título e texto de cada variante medidos contra o fundo composto, no tema claro e no escuro. O mínimo é 4.5:1 — o título tem 14px semibold, que pela WCAG não conta como texto grande.',
      },
    },
  },
  render: () => ({ Component: AlertContrasteStory }),
  play: async ({ canvasElement }) => {
    // Contraste é aritmética, não olhômetro: a play calcula a razão entre a cor
    // do texto e o fundo COMPOSTO (o bg do alert tem alfa, então a cor declarada
    // não é a que se vê). O tema escuro entra junto porque é metade do produto e
    // não era medido em lugar nenhum — foi lá que o título do info estava em
    // 3.19:1, enquanto no claro marcava 6.16.
    const problemas = contrasteNosDoisTemas(canvasElement);
    await expect(
      problemas,
      problemas.length ? `\n${descreverFalhas(problemas)}\n` : '',
    ).toEqual([]);
  },
};
