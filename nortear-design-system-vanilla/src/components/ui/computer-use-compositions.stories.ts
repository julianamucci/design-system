import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createAgentStatus } from './agent-status';
import { createComputerUse } from './computer-use';
import { agentStatusLabels, elapsedOf } from './agent-status.fixtures';
import { computerUseLabels, createDemoScreen } from './computer-use.fixtures';
import {
  computerUseBesideRunSnippet,
  computerUsePortraitSnippet,
  computerUseScreenSnippet,
} from './computer-use.source';
import {
  COMPUTER_STEPS_LOGIN,
  COMPUTER_URL,
  COMPUTER_URL_LONG,
} from '@shared/primitives/computer-use-examples';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Onde a peça mora em relação às irmãs, e o que acontece quando o que entra
// nela é maior que o espaço — que é a pergunta de desenho mais difícil de uma
// moldura: o endereço que não cabe na barra, o alvo que não cabe na legenda, e
// o quadro que não tem a proporção que a tela pede.

const meta: Meta = {
  title: 'Primitives/Conversational/ComputerUse/Compositions',
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: computerUseBesideRunSnippet },
      description: {
        component:
          'A peça é autônoma: ela não sabe que as irmãs existem, não dirige nada e não oferece ação — parar e repetir são do estado da execução.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const pieceOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="computer-use"]')!;

/**
 * A tela abaixo da linha de estado da execução.
 *
 * As duas são AUTÔNOMAS e respondem a perguntas diferentes: uma diz em que pé
 * está a resposta inteira e carrega as ações de parar e repetir, a outra mostra
 * onde o agente está tocando agora. Por isso a story monta as duas em sequência
 * em vez de passar uma para dentro da outra.
 */
export const BesideRunStatus: Story = {
  parameters: {
    covers: ['functional.item12', 'visual.item8'],
    docs: { source: { transform: computerUseBesideRunSnippet } },
  },
  render: () => {
    const stack = document.createElement('div');
    stack.className = 'nds-stack nds-max-w-md';
    stack.dataset.spacing = 'sm';
    stack.append(
      createAgentStatus({
        status: 'running',
        elapsed: elapsedOf('running'),
        labels: agentStatusLabels(),
      }),
      createComputerUse({
        url: COMPUTER_URL,
        screen: createDemoScreen(),
        steps: COMPUTER_STEPS_LOGIN,
        activeIndex: 3,
        status: 'running',
        labels: computerUseLabels(),
      }),
    );
    return stack;
  },
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);

    await step('A ação de parar existe só na linha de estado', async () => {
      // Dois botões de parar para uma execução só fariam quem apertasse um
      // deles não saber qual parou. Esta peça é o REGISTRO do que está sendo
      // feito, não o controle.
      await expect(
        canvasElement.querySelector('[data-slot="agent-status-action"]'),
      ).not.toBeNull();
      // A tela de demonstração tem um botão dentro, e ele é da FOTO: `inert` o
      // tira da ordem de foco e da árvore de acessibilidade. O que a asserção
      // cobra é que a peça não ofereça ação PRÓPRIA — nada fora da tela.
      //
      // A versão anterior perguntava por qualquer `button` e teria reprovado na
      // primeira vez que a suíte de navegador rodasse, acusando a foto. As
      // quatro portas acharam isto ao traduzir; aqui ficou porque a referência
      // já estava commitada.
      const own = [...piece.querySelectorAll('button')].filter(
        (el) => el.closest('[inert]') === null,
      );
      await expect(own).toEqual([]);
    });

    await step('Nenhuma contém a outra', async () => {
      const status = canvasElement.querySelector<HTMLElement>('[data-slot="agent-status"]')!;
      await expect(status.contains(piece)).toBe(false);
      await expect(piece.contains(status)).toBe(false);
    });
  },
};

/**
 * O endereço e o alvo longos, cortados.
 *
 * Os dois crescem sem teto — o endereço traz parâmetro de consulta, e o alvo é
 * o que o agente decidiu chamar aquilo. Cortar é a escolha certa aqui, e é o
 * contrário da que o comando do bloco de terminal fez: comando pela metade é
 * instrução pela metade, mas endereço pela metade continua dizendo qual tela é.
 */
export const LongText: Story = {
  parameters: {
    covers: ['functional.item11', 'accessibility.item6', 'accessibility.item7', 'accessibility.item8', 'visual.item9'],
    docs: { source: { transform: computerUseScreenSnippet } },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack nds-max-w-2xs';
    wrapper.appendChild(
      createComputerUse({
        url: COMPUTER_URL_LONG,
        screen: createDemoScreen(),
        steps: COMPUTER_STEPS_LOGIN,
        // O quarto passo é o do alvo longo — a senha guardada no cofre.
        activeIndex: 3,
        status: 'running',
        labels: computerUseLabels(),
      }),
    );
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);

    await step('O endereço e o alvo levam a utilitária que corta', async () => {
      // A classe mora na MARCAÇÃO, e some em silêncio quando alguém copia a
      // árvore pela metade — nenhum portão a alcança, então a asserção é ela.
      const url = piece.querySelector<HTMLElement>('[data-slot="computer-use-url"]')!;
      const target = piece.querySelector<HTMLElement>('[data-slot="computer-use-target"]')!;
      await expect(url.classList.contains('nds-truncate')).toBe(true);
      await expect(target.classList.contains('nds-truncate')).toBe(true);
    });

    await step('O texto inteiro continua no elemento, ainda que cortado na tela', async () => {
      // Cortar é desenho, e não perda: quem lê com leitor de tela recebe o
      // endereço completo, porque o corte é do CSS e não do conteúdo.
      const url = piece.querySelector<HTMLElement>('[data-slot="computer-use-url"]')!;
      await expect(url.textContent).toBe(COMPUTER_URL_LONG);
    });

    await step('Nada dentro da peça entra na ordem de foco', async () => {
      // A tela é uma FOTO: parada de tabulação para dentro de um retrato daria
      // ao teclado um caminho para uma tela que ninguém está usando. O quadro
      // recorta em vez de rolar, então também não há região rolável a nomear.
      const focusable = piece.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]',
      );
      await expect([...focusable].every((el) => el.closest('[inert]') !== null)).toBe(true);
    });
  },
};

/**
 * O quadro em retrato.
 *
 * Tela de telefone não é dezesseis por nove, e a peça não tem como saber. A
 * proporção é propriedade personalizada justamente para que quem consome a mude
 * na folha dele, sem tirar o valor do tema e da escala de tipo.
 */
export const Portrait: Story = {
  parameters: {
    covers: ['visual.item10'],
    docs: { source: { transform: computerUsePortraitSnippet } },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack nds-max-w-2xs';
    const piece = createComputerUse({
      url: 'm.exemplo.com/entrar',
      screen: createDemoScreen(),
      steps: COMPUTER_STEPS_LOGIN,
      activeIndex: 2,
      status: 'running',
      labels: computerUseLabels(),
    });
    // Propriedade PERSONALIZADA, e não valor de desenho em `style`: é a mesma
    // porta que a folha abre para quem consome, e aqui a story a usa para
    // fotografar o caso. Fosse `aspect-ratio` direto, a declaração venceria a
    // folha e sairia do tema.
    piece.style.setProperty('--computer-use-aspect', '9 / 16');
    wrapper.appendChild(piece);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);

    await step('A proporção do quadro veio da propriedade personalizada', async () => {
      await expect(piece.style.getPropertyValue('--computer-use-aspect').trim()).toBe('9 / 16');
    });
  },
};
