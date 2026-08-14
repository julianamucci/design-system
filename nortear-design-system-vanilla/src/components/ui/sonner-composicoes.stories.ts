import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { toast, ROTULO_FECHAR } from './sonner';
import {
  esperarSemTorradas,
  esperarTorrada,
  limparTorradas,
  montarToaster,
  PERSISTENTE,
  TEXTOS,
} from './sonner.fixtures';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O que a notificação PODE carregar além do título: descrição, ação, o ciclo de
// uma promessa e o prazo infinito. Cada composição resolve um caso; empilhá-las
// todas na mesma notificação faria uma caixa de diálogo flutuante, que é
// exatamente o que este componente não é.

const espiaoDesfazer = fn();

const meta: Meta = {
  title: 'UI/Sonner/Compositions',
  tags: ['feedback'],
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
  render: () => montarToaster(),
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
    await limparTorradas();

    await step('Título e descrição vivem no mesmo bloco de conteúdo', async () => {
      toast.success(TEXTOS.comDescricao, {
        ...PERSISTENTE,
        description: TEXTOS.comDescricaoDetalhe,
      });
      const torrada = await esperarTorrada({ tipo: 'success' });

      const titulo = torrada.querySelector<HTMLElement>('.nds-toast-title')!;
      const descricao = torrada.querySelector<HTMLElement>('.nds-toast-description')!;
      await expect(titulo).toHaveTextContent(TEXTOS.comDescricao);
      await expect(descricao).toHaveTextContent(TEXTOS.comDescricaoDetalhe);

      // Os dois dentro do mesmo `.nds-toast-content`: é isso que faz o leitor de
      // tela anunciar a notificação como uma coisa só, e não como dois avisos.
      const conteudo = torrada.querySelector<HTMLElement>('.nds-toast-content')!;
      await expect(conteudo.contains(titulo) && conteudo.contains(descricao)).toBe(true);
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
    await limparTorradas();
    // O espião é de módulo e sobrevive ao replay da play no painel Interactions;
    // zerá-lo aqui é o que mantém a contagem abaixo verdadeira nas duas rodadas.
    espiaoDesfazer.mockClear();

    await step('O botão de ação é alcançável por Tab enquanto a notificação está na tela', async () => {
      // accessibility.item2 — o `<button>` é de verdade e está no fluxo de foco.
      // Sem isso, quem navega por teclado veria a ação e não teria como chegar
      // até ela antes de o prazo vencer (WCAG 2.1.1).
      toast(TEXTOS.comAcao, {
        ...PERSISTENTE,
        action: { label: TEXTOS.comAcaoRotulo, onClick: () => espiaoDesfazer() },
      });
      const torrada = await esperarTorrada({ tipo: 'default' });
      const acao = torrada.querySelector<HTMLButtonElement>('.nds-toast-action')!;

      await expect(acao.tagName).toBe('BUTTON');
      await expect(acao).toHaveTextContent(TEXTOS.comAcaoRotulo);

      // Zera o foco antes de tabular: no replay do painel Interactions ele parte
      // de onde a rodada anterior o deixou, e o primeiro Tab cairia noutro lugar.
      (document.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(acao).toHaveFocus();
    });

    await step('Escape fecha a notificação em foco, sem acionar a ação', async () => {
      // Quem chegou até aqui por teclado precisa de uma saída que não seja o
      // mouse: sair "pelo lado" deixaria a notificação ocupando a tela.
      await userEvent.keyboard('{Escape}');
      await esperarSemTorradas();
      await expect(espiaoDesfazer).not.toHaveBeenCalled();
    });

    await step('Enter dispara a ação e retira a notificação', async () => {
      // functional.item5 — a notificação existia para oferecer a ação; cumprida,
      // ela sai na hora em vez de continuar ocupando a pilha.
      toast(TEXTOS.comAcao, {
        ...PERSISTENTE,
        action: { label: TEXTOS.comAcaoRotulo, onClick: () => espiaoDesfazer() },
      });
      await esperarTorrada({ tipo: 'default' });

      (document.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await userEvent.keyboard('{Enter}');

      await expect(espiaoDesfazer).toHaveBeenCalledTimes(1);
      await esperarSemTorradas();
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
    await limparTorradas();

    await step('O carregamento vira êxito no MESMO nó do DOM', async () => {
      // functional.item3 — a promessa é resolvida À MÃO, e não por temporizador.
      // Com prazo fixo, a resolução chegava antes de o carregamento terminar de
      // entrar (a notificação leva um fade para assentar) e o estado
      // intermediário ficava inobservável — o teste falharia por corrida.
      let concluir: () => void = () => undefined;
      const operacao = new Promise<void>((resolve) => {
        concluir = resolve;
      });
      toast.promise(
        operacao,
        {
          loading: TEXTOS.promessaCarregando,
          success: TEXTOS.promessaSucesso,
          error: TEXTOS.promessaErro,
        },
        PERSISTENTE,
      );

      const carregando = await esperarTorrada({ tipo: 'loading' });
      await expect(carregando).toHaveTextContent(TEXTOS.promessaCarregando);

      concluir();
      const concluida = await esperarTorrada({ tipo: 'success' });
      await expect(concluida).toHaveTextContent(TEXTOS.promessaSucesso);

      // Mesmo elemento: trocar o nó faria o leitor de tela anunciar duas
      // notificações para um evento só.
      await expect(concluida).toBe(carregando);
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
    await limparTorradas();

    await step('O carregamento vira falha quando a operação rejeita', async () => {
      // functional.item4 — `toast.promise` não repropaga a rejeição, então não
      // há rejeição não tratada aqui; quem precisa do erro trata na promessa
      // original. A falha é provocada à mão pelo mesmo motivo do caso resolvido.
      let falhar: () => void = () => undefined;
      const operacao = new Promise<void>((_resolve, reject) => {
        falhar = () => reject(new Error('falha simulada'));
      });
      toast.promise(
        operacao,
        {
          loading: TEXTOS.promessaCarregando,
          success: TEXTOS.promessaSucesso,
          error: TEXTOS.promessaErro,
        },
        PERSISTENTE,
      );

      const carregando = await esperarTorrada({ tipo: 'loading' });
      await expect(carregando).toHaveAttribute('data-type', 'loading');

      falhar();
      const falhou = await esperarTorrada({ tipo: 'error' });
      await expect(falhou).toHaveTextContent(TEXTOS.promessaErro);
      await expect(falhou).toBe(carregando);
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
  // Prazo default curtíssimo de propósito: é o que prova que o `Infinity` desta
  // notificação é dela, e não do relógio da página.
  render: () => montarToaster({ duration: 300 }),
  play: async ({ step }) => {
    await limparTorradas();

    await step('A notificação sobrevive ao prazo que valeria para as outras', async () => {
      // functional.item6 — 700ms com prazo default de 300ms: se o `Infinity`
      // fosse ignorado, ela já teria saído duas vezes. `setTimeout(fn, Infinity)`
      // vira delay 0 no navegador, então este é o teste que segura a regressão.
      toast.error(TEXTOS.persistente, { ...PERSISTENTE, closeButton: true });
      const torrada = await esperarTorrada({ tipo: 'error' });

      await new Promise<void>((resolve) => setTimeout(resolve, 700));
      await expect(document.body.contains(torrada)).toBe(true);
      await expect(torrada).toHaveAttribute('data-visible', 'true');
    });

    await step('Fechar manualmente é o único caminho de saída', async () => {
      const fechar = document.querySelector<HTMLButtonElement>('.nds-toast-close')!;
      await expect(fechar).toHaveAttribute('aria-label', ROTULO_FECHAR);
      await userEvent.click(fechar);
      await esperarSemTorradas();
      await expect(document.querySelectorAll('.nds-toast').length).toBe(0);
    });
  },
};
