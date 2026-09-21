import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, fn, userEvent, waitFor } from 'storybook/test';
import { Alert } from './index';
import AlertStory from './AlertStory.svelte';
import AlertDismissibleStory from './AlertDismissibleStory.svelte';
import { themeContrast, themeReprovas } from '@shared/testing/alert-probe';
import AlertContrastStory from './AlertContrastStory.svelte';
import {
  alertContrastSource,
  alertDestructiveSource,
  alertDismissibleByKeyboardSource,
  alertDismissibleSource,
  alertInfoSource,
  alertSource,
  alertSuccessSource,
  alertWarningSource,
} from './alert.source';

const meta: Meta = {
  parameters: {
    design: figmaDesign('alert'),
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada variante sobrescreve
      // com a própria composição logo abaixo.
      source: { transform: alertSource },
    },
  },
  title: 'Components/Feedback/Alert/Variants',
  component: Alert,
  tags: ['feedback'],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: {
    covers: ['functional.item1', 'accessibility.item3', 'visual.item2'],
    // Própria, e não herdada do meta: a composição canônica é o assunto desta
    // story, e painel herdado acerta por coincidência.
    docs: { source: { transform: alertSource } },
  },
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

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const alert = await canvas.findByRole('alert');

    await step('A variante default não recebe classe de modificador', async () => {
      await expect(alert).toHaveClass('nds-alert');
      await expect(alert).not.toHaveClass('nds-alert-destructive');
      await expect(canvas.getByText('Atenção')).toBeVisible();
    });

    await step('Ícone, título e descrição ocupam os slots que a folha espera', async () => {
      // A folha posiciona por `data-slot`/classe: se um deles não recebesse a
      // classe, o layout de duas colunas colapsaria sem erro nenhum.
      await expect(alert.querySelector(':scope > svg')).toBeTruthy();
      await expect(alert.querySelector('[data-slot="alert-title"]')).toHaveClass('nds-alert-title');
      await expect(alert.querySelector('[data-slot="alert-description"]')).toHaveClass(
        'nds-alert-description',
      );
    });
  },
};

export const Destructive: Story = {
  parameters: {
    covers: ['functional.item2'],
    docs: { source: { transform: alertDestructiveSource } },
  },
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

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const alert = await canvas.findByRole('alert');

    await step('A variante escolhida chega ao DOM', async () => {
      await expect(alert).toHaveClass('nds-alert-destructive');
      await expect(canvas.getByText('Erro ao salvar')).toBeVisible();
    });

    await step('Só o ícone recebe a cor da variante', async () => {
      // Regra dos contêineres coloridos, e a folha a cumpre nas cinco
      // variantes: a cor semântica pinta fundo, borda e ÍCONE (não-textual,
      // limite de 3:1). O título é 14px semibold — pela WCAG não é texto
      // grande, o limite dele é 4.5:1 — e fica em `--foreground` junto com o
      // texto corrido. Afirmar só classe e texto deixava isso sem medição.
      const icon = alert.querySelector<SVGSVGElement>(':scope > svg')!;
      const title = alert.querySelector<HTMLElement>('[data-slot="alert-title"]')!;
      const description = alert.querySelector<HTMLElement>('[data-slot="alert-description"]')!;
      await expect(getComputedStyle(description).color).not.toBe(getComputedStyle(icon).color);
      await expect(getComputedStyle(title).color).not.toBe(getComputedStyle(icon).color);
      await expect(getComputedStyle(title).color).toBe(getComputedStyle(description).color);
    });
  },
};

export const Success: Story = {
  parameters: {
    covers: ['functional.item5'],
    docs: { source: { transform: alertSuccessSource } },
  },
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
  parameters: {
    docs: { source: { transform: alertWarningSource } },
  },
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
  parameters: {
    docs: { source: { transform: alertInfoSource } },
  },
  render: () => ({
    Component: AlertStory,
    props: {
      variant: 'info',
      title: 'Dica',
      description: 'Você pode fixar os filtros mais usados para acessá-los mais rápido.',
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

// As duas stories abaixo usam AlertDismissibleStory: fechar remove o alert e
// remonta um novo em seguida, então o canvas nunca fica vazio (Chromatic
// fotografava a story vazia). A prova da remoção mede o nó ORIGINAL.
export const Dismissible: Story = {
  parameters: {
    covers: ['functional.item7', 'visual.item5'],
    docs: { source: { transform: alertDismissibleSource } },
  },
  args: {
    dismissible: true,
    onDismiss: fn(),
  },
  render: (args) => ({
    Component: AlertDismissibleStory,
    props: {
      title: 'Preferências salvas',
      description: 'Você pode fechar este aviso quando quiser.',
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
          const freshAlert = canvas.getByRole('alert');
          if (!freshAlert.classList.contains('nds-animate-in')) throw new Error('aguardando remontagem');
          return freshAlert;
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
      // não tem mais nada a limpar: nem volta a classe, nem fecha o alerta.
      alert.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
      await waitFor(() => expect(alert).not.toHaveClass('nds-animate-in'));
      alert.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
      await expect(alert).not.toHaveClass('nds-animate-in');
      await expect(alert).toBeInTheDocument();
      await expect(onDismiss).not.toHaveBeenCalled();
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
    // Guardado fora do step: o passo seguinte prova que o remontado é outro nó.
    let alertOriginal: HTMLElement | null = null;
    await step('Clique no X remove o alert e dispara o callback uma única vez', async () => {
      const original = canvas.getByRole('alert');
      alertOriginal = original;
      const dismissButton = canvas.getByRole('button', { name: 'Fechar alerta' });
      await userEvent.click(dismissButton);
      // Segunda ativação com a saída ainda em curso: tem que cair na guarda de
      // fechamento em andamento. Sem ela o `toHaveBeenCalledTimes(1)` abaixo é
      // verdade trivial — nunca houve chance de disparar duas vezes.
      dismissButton.click();
      // E a animação de um descendente também não pode encerrar a saída.
      dismissButton.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
      await expect(original).toBeInTheDocument();
      // waitFor: a saída é animada (.nds-animate-out) e o nó só sai do DOM
      // quando a animação termina — ou no timeout de segurança do primitivo.
      await waitFor(() => expect(original).not.toBeInTheDocument());
      await expect(args.onDismiss).toHaveBeenCalledTimes(1);
    });

    await step('Um alert novo volta ao canvas — a story não fica vazia', async () => {
      // O remontado é OUTRO nó: o original saiu do DOM e o wrapper montou um novo.
      await waitFor(async () => {
        const remounted = canvas.getByRole('alert');
        await expect(remounted).not.toBe(alertOriginal);
        await expect(remounted).toBeVisible();
      });
    });
  },
};

export const DismissibleByKeyboard: Story = {
  parameters: {
    docs: { source: { transform: alertDismissibleByKeyboardSource } },
  },
  args: {
    dismissible: true,
    onDismiss: fn(),
  },
  render: (args) => ({
    Component: AlertDismissibleStory,
    props: {
      variant: 'success',
      icon: 'success',
      title: 'Perfil atualizado',
      description: 'Suas informações foram salvas com sucesso.',
      dismissLabel: 'Fechar confirmação',
      onDismiss: args.onDismiss,
    },
  }),

  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);

    await step('Enter no botão focado remove o alert e dispara o callback uma única vez', async () => {
      const alertOriginal = await canvas.findByRole('alert');
      const dismissButton = within(alertOriginal).getByRole('button', { name: 'Fechar confirmação' });
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
      source: { transform: alertContrastSource },
      description: {
        story:
          'Título e texto de cada variante medidos contra o fundo composto, nos três temas de marca e nos dois modos. O mínimo é 4.5:1 — o título tem 14px semibold, que pela WCAG não conta como texto grande.',
      },
    },
  },
  render: () => ({ Component: AlertContrastStory }),
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
