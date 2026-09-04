import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import {
  COMPUTER_STEPS_LOGIN,
  COMPUTER_URL,
  COMPUTER_URL_LONG,
} from '@shared/primitives/computer-use-examples';
import { NdsAgentStatus } from './agent-status';
import { agentStatusLabels, elapsedOf } from './agent-status.fixtures';
import { NdsComputerUse } from './computer-use';
import { NdsComputerUseDemoScreen, computerUseLabels } from './computer-use.fixtures';
import {
  computerUseBesideRunSource,
  computerUsePortraitSource,
  computerUseScreenSource,
} from './computer-use.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Onde a peça mora em relação às irmãs, e o que acontece quando o que entra nela
// é maior que o espaço — que é a pergunta de desenho mais difícil de uma
// moldura: o endereço que não cabe na barra, o alvo que não cabe na legenda, e o
// quadro que não tem a proporção que a tela pede.

const meta: Meta = {
  title: 'Components/Conversational/ComputerUse/Compositions',
  tags: ['conversational'],
  decorators: [
    moduleMetadata({ imports: [NdsAgentStatus, NdsComputerUse, NdsComputerUseDemoScreen] }),
  ],
  // Sem argTypes nem callbacks: sem isto os painéis Controls e Actions abrem vazios.
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: computerUseBesideRunSource },
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
    docs: { source: { transform: computerUseBesideRunSource } },
  },
  render: () => ({
    props: {
      url: COMPUTER_URL,
      steps: COMPUTER_STEPS_LOGIN,
      labels: computerUseLabels(),
      runLabels: agentStatusLabels(),
      elapsed: elapsedOf('running'),
    },
    template: `
      <ng-template #tela><nds-computer-use-demo-screen></nds-computer-use-demo-screen></ng-template>

      <div class="nds-stack nds-max-w-md" data-spacing="sm">
        <p
          ndsAgentStatus
          status="running"
          [elapsed]="elapsed"
          [labels]="runLabels"
        ></p>

        <figure
          ndsComputerUse
          [url]="url"
          [screen]="tela"
          [steps]="steps"
          [activeIndex]="3"
          status="running"
          [labels]="labels"
        ></figure>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);

    await step('A ação de parar existe só na linha de estado', async () => {
      // Dois botões de parar para uma execução só fariam quem apertasse um
      // deles não saber qual parou. Esta peça é o REGISTRO do que está sendo
      // feito, não o controle.
      await expect(
        canvasElement.querySelector('[data-slot="agent-status-action"]'),
      ).not.toBeNull();

      // A busca ignora o que está DENTRO da superfície, e é a divergência de
      // instrumento entre as stacks aparecendo numa asserção: aqui a tela é um
      // template projetado, e o que ele desenha é da demonstração — inerte, e
      // portanto fora da ordem de foco. O que se afirma é o que a peça oferece,
      // e a moldura em si não oferece botão nenhum.
      const own = [...piece.querySelectorAll('button')].filter(
        (button) => button.closest('[data-slot="computer-use-surface"]') === null,
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
 * Os dois crescem sem teto — o endereço traz parâmetro de consulta, e o alvo é o
 * que o agente decidiu chamar aquilo. Cortar é a escolha certa aqui, e é o
 * contrário da que o comando do bloco de terminal fez: comando pela metade é
 * instrução pela metade, mas endereço pela metade continua dizendo qual tela é.
 */
export const LongText: Story = {
  parameters: {
    covers: [
      'functional.item11',
      'accessibility.item6', 'accessibility.item7', 'accessibility.item8',
      'visual.item9',
    ],
    docs: { source: { transform: computerUseScreenSource } },
  },
  render: () => ({
    props: {
      url: COMPUTER_URL_LONG,
      steps: COMPUTER_STEPS_LOGIN,
      labels: computerUseLabels(),
    },
    template: `
      <ng-template #tela><nds-computer-use-demo-screen></nds-computer-use-demo-screen></ng-template>

      <div class="nds-stack nds-max-w-2xs">
        <figure
          ndsComputerUse
          [url]="url"
          [screen]="tela"
          [steps]="steps"
          [activeIndex]="3"
          status="running"
          [labels]="labels"
        ></figure>
      </div>
    `,
  }),
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
    docs: { source: { transform: computerUsePortraitSource } },
  },
  render: () => ({
    props: {
      url: 'm.exemplo.com/entrar',
      steps: COMPUTER_STEPS_LOGIN,
      labels: computerUseLabels(),
      // Propriedade PERSONALIZADA, e não valor de desenho: é a mesma porta que a
      // folha abre para quem consome, e aqui a story a usa para fotografar o
      // quadro em retrato. Fosse `aspect-ratio` direto, a declaração venceria a
      // folha e sairia do tema.
      aspect: '9 / 16',
    },
    template: `
      <ng-template #tela><nds-computer-use-demo-screen></nds-computer-use-demo-screen></ng-template>

      <div class="nds-stack nds-max-w-2xs">
        <figure
          ndsComputerUse
          [url]="url"
          [screen]="tela"
          [steps]="steps"
          [activeIndex]="2"
          status="running"
          [labels]="labels"
          [style.--computer-use-aspect]="aspect"
        ></figure>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);

    await step('A proporção do quadro veio da propriedade personalizada', async () => {
      await expect(piece.style.getPropertyValue('--computer-use-aspect').trim()).toBe('9 / 16');
    });
  },
};
