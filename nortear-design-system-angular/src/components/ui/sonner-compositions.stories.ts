import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { NdsToaster, toast } from './sonner';
import {
  waitForNoToasts,
  waitForToast,
  clearToasts,
  PERSISTENT,
  TEXTS,
} from './sonner.fixtures';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O que a notificação PODE carregar além do título: descrição, ação, o ciclo de
// uma promessa e o prazo infinito. Cada composição resolve um caso; empilhá-las
// todas na mesma notificação faria uma caixa de diálogo flutuante, que é
// exatamente o que este componente não é.

const undoSpy = fn();

const meta: Meta = {
  title: 'UI/Sonner/Compositions',
  decorators: [moduleMetadata({ imports: [NdsToaster] })],
  parameters: {
    layout: 'padded',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Descrição, ação, ciclo de promessa e prazo infinito. A ação oferecida dentro da notificação precisa existir em outro lugar da interface: a notificação some, e o que só existia nela some junto.',
      },
    },
  },
  render: () => ({
    template: `<div ndsToaster position="top-right" [richColors]="true"></div>`,
  }),
};

export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const WithDescription: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      description: {
        story:
          'Título mais descrição, para quando o título sozinho não orienta. A descrição é uma frase completa — se precisar de três linhas, o lugar da mensagem não é uma notificação.',
      },
    },
  },
  play: async ({ step }) => {
    await clearToasts();

    await step('Título e descrição vivem no mesmo bloco de conteúdo', async () => {
      toast.success(TEXTS.comDescricao, {
        ...PERSISTENT,
        description: TEXTS.comDescricaoDetalhe,
      });
      const toastEl = await waitForToast({ type: 'success' });

      const title = toastEl.querySelector<HTMLElement>('.nds-toast-title')!;
      const description = toastEl.querySelector<HTMLElement>('.nds-toast-description')!;
      await expect(title).toHaveTextContent(TEXTS.comDescricao);
      await expect(description).toHaveTextContent(TEXTS.comDescricaoDetalhe);

      // Os dois dentro do mesmo `.nds-toast-content`: é isso que faz o leitor de
      // tela anunciar a notificação como uma coisa só, e não como dois avisos.
      const content = toastEl.querySelector<HTMLElement>('.nds-toast-content')!;
      await expect(content.contains(title) && content.contains(description)).toBe(true);
    });
  },
};

export const WithAction: Story = {
  parameters: {
    covers: ['functional.item5', 'accessibility.item2', 'visual.item2'],
    docs: {
      description: {
        story:
          'Ação embutida para operação reversível. O botão entra na sequência de foco enquanto a notificação está na tela, e some com ela — por isso desfazer também precisa existir fora daqui.',
      },
    },
  },
  play: async ({ step }) => {
    await clearToasts();
    // O espião é de módulo e sobrevive ao replay da play no painel Interactions;
    // zerá-lo aqui é o que mantém a contagem abaixo verdadeira nas duas rodadas.
    undoSpy.mockClear();

    await step('O botão de ação é alcançável por Tab enquanto a notificação está na tela', async () => {
      // accessibility.item2 — o `<button>` é de verdade e está no fluxo de foco.
      // Sem isso, quem navega por teclado veria a ação e não teria como chegar
      // até ela antes de o prazo vencer (WCAG 2.1.1).
      toast(TEXTS.comAcao, {
        ...PERSISTENT,
        action: { label: TEXTS.comAcaoRotulo, onClick: () => undoSpy() },
      });
      const toastEl = await waitForToast({ type: 'default' });
      const action = toastEl.querySelector<HTMLButtonElement>('.nds-toast-action')!;

      await expect(action.tagName).toBe('BUTTON');
      await expect(action).toHaveTextContent(TEXTS.comAcaoRotulo);

      // Zera o foco antes de tabular: no replay do painel Interactions ele parte
      // de onde a rodada anterior o deixou, e o primeiro Tab cairia noutro lugar.
      (document.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(action).toHaveFocus();
    });

    await step('Escape fecha a notificação em foco, sem acionar a ação', async () => {
      // Quem chegou até aqui por teclado precisa de uma saída que não seja o
      // mouse: sair "pelo lado" deixaria a notificação ocupando a tela.
      await userEvent.keyboard('{Escape}');
      await waitForNoToasts();
      await expect(undoSpy).not.toHaveBeenCalled();
    });

    await step('Enter dispara a ação e retira a notificação', async () => {
      // functional.item5 — a notificação existia para oferecer a ação; cumprida,
      // ela sai na hora em vez de continuar ocupando a pilha.
      toast(TEXTS.comAcao, {
        ...PERSISTENT,
        action: { label: TEXTS.comAcaoRotulo, onClick: () => undoSpy() },
      });
      await waitForToast({ type: 'default' });

      (document.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await userEvent.keyboard('{Enter}');

      await expect(undoSpy).toHaveBeenCalledTimes(1);
      await waitForNoToasts();
      await expect(document.querySelectorAll('.nds-toast').length).toBe(0);
    });
  },
};

export const PromiseResolved: Story = {
  parameters: {
    covers: ['functional.item3', 'visual.item2'],
    docs: {
      description: {
        story:
          'Uma notificação para a operação inteira: nasce em carregamento e vira êxito no mesmo lugar, sem piscar duas caixas.',
      },
    },
  },
  play: async ({ step }) => {
    await clearToasts();

    await step('O carregamento vira êxito no MESMO nó do DOM', async () => {
      // functional.item3 — a promessa é resolvida À MÃO, e não por temporizador.
      // Com prazo fixo, a resolução chegava antes de o carregamento terminar de
      // entrar (a torrada leva um fade para assentar) e o estado intermediário
      // ficava inobservável — o teste falhava por corrida, não por defeito.
      let resolve: () => void = () => undefined;
      const operation = new Promise<void>((res) => {
        resolve = res;
      });
      toast.promise(
        operation,
        {
          loading: TEXTS.promessaCarregando,
          success: TEXTS.promessaSucesso,
          error: TEXTS.promessaErro,
        },
        PERSISTENT,
      );

      const loading = await waitForToast({ type: 'loading' });
      await expect(loading).toHaveTextContent(TEXTS.promessaCarregando);

      resolve();
      const resolved = await waitForToast({ type: 'success' });
      await expect(resolved).toHaveTextContent(TEXTS.promessaSucesso);

      // Mesmo elemento: trocar o nó faria o leitor de tela anunciar duas
      // notificações para um evento só.
      await expect(resolved).toBe(loading);
      await expect(document.querySelectorAll('.nds-toast').length).toBe(1);
    });
  },
};

export const PromiseRejected: Story = {
  parameters: {
    covers: ['functional.item4'],
    docs: {
      description: {
        story:
          'O mesmo ciclo, com a operação falhando: o carregamento vira falha, com o texto que diz o caminho de saída.',
      },
    },
  },
  play: async ({ step }) => {
    await clearToasts();

    await step('O carregamento vira falha quando a operação rejeita', async () => {
      // functional.item4 — `toast.promise` não repropaga a rejeição, então não
      // há rejeição não tratada aqui; quem precisa do erro trata na promessa
      // original. A falha é provocada à mão pelo mesmo motivo do caso resolvido.
      let fail: () => void = () => undefined;
      const operation = new Promise<void>((_resolve, reject) => {
        fail = () => reject(new Error('falha simulada'));
      });
      toast.promise(
        operation,
        {
          loading: TEXTS.promessaCarregando,
          success: TEXTS.promessaSucesso,
          error: TEXTS.promessaErro,
        },
        PERSISTENT,
      );

      const loading = await waitForToast({ type: 'loading' });
      await expect(loading).toHaveAttribute('data-type', 'loading');

      fail();
      const failed = await waitForToast({ type: 'error' });
      await expect(failed).toHaveTextContent(TEXTS.promessaErro);
      await expect(failed).toBe(loading);
    });
  },
};

export const Persistent: Story = {
  parameters: {
    covers: ['functional.item6', 'visual.item2'],
    docs: {
      description: {
        story:
          'Prazo infinito, reservado a falha crítica que exige decisão. Sempre com botão de fechar: uma notificação que não sai sozinha e não pode ser fechada vira obstáculo.',
      },
    },
  },
  render: () => ({
    // Prazo default curtíssimo de propósito: é o que prova que o `Infinity`
    // desta notificação é dela, e não do relógio da página.
    template: `<div ndsToaster position="top-right" [richColors]="true" [duration]="300"></div>`,
  }),
  play: async ({ step }) => {
    await clearToasts();

    await step('A notificação sobrevive ao prazo que valeria para as outras', async () => {
      // functional.item6 — 700ms com prazo default de 300ms: se o `Infinity`
      // fosse ignorado, ela já teria saído duas vezes.
      toast.error(TEXTS.persistente, { ...PERSISTENT, closeButton: true });
      const toastEl = await waitForToast({ type: 'error' });

      await new Promise<void>((resolve) => setTimeout(resolve, 700));
      await expect(document.body.contains(toastEl)).toBe(true);
      await expect(toastEl).toHaveAttribute('data-visible', 'true');
    });

    await step('Fechar manualmente é o único caminho de saída', async () => {
      const close = document.querySelector<HTMLButtonElement>('.nds-toast-close')!;
      await expect(close).toHaveAttribute('aria-label', 'Fechar notificação');
      await userEvent.click(close);
      await waitForNoToasts();
      await expect(document.querySelectorAll('.nds-toast').length).toBe(0);
    });
  },
};
