import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect } from 'storybook/test';
import { ComputerUse } from './index';
import ComputerUseStory from './ComputerUseStory.svelte';
import ComputerUseBesideRunStory from './ComputerUseBesideRunStory.svelte';
import ComputerUsePortraitStory from './ComputerUsePortraitStory.svelte';
import {
  computerUseBesideRunSource,
  computerUsePortraitSource,
  computerUseScreenSource,
} from './computer-use.source';
import { COMPUTER_URL_LONG } from '@shared/primitives/computer-use-examples';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Onde a peça mora em relação às irmãs, e o que acontece quando o que entra
// nela é maior que o espaço — que é a pergunta de desenho mais difícil de uma
// moldura: o endereço que não cabe na barra, o alvo que não cabe na legenda, e
// o quadro que não tem a proporção que a tela pede.

const meta: Meta<typeof ComputerUse> = {
  title: 'Primitives/Conversational/ComputerUse/Compositions',
  component: ComputerUse,
  tags: ['conversational'],
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

/**
 * O tipo acompanha O QUE É MONTADO, e não o `meta`.
 *
 * A TELA entra por `{#snippet}`, e snippet só existe dentro de marcação: cada
 * story monta um invólucro em vez da peça nua, e o invólucro é quem declara o
 * trecho. Mesma divisão que a conversa já usa para as ações do turno.
 */
type Story = StoryObj<typeof ComputerUseStory>;
type BesideRunStory = StoryObj<typeof ComputerUseBesideRunStory>;
type PortraitStory = StoryObj<typeof ComputerUsePortraitStory>;

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
export const BesideRunStatus: BesideRunStory = {
  parameters: {
    covers: ['functional.item12', 'visual.item8'],
    docs: { source: { transform: computerUseBesideRunSource } },
  },
  render: () => ({ Component: ComputerUseBesideRunStory }),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);

    await step('A ação de parar existe só na linha de estado', async () => {
      // Dois botões de parar para uma execução só fariam quem apertasse um
      // deles não saber qual parou. Esta peça é o REGISTRO do que está sendo
      // feito, não o controle.
      await expect(
        canvasElement.querySelector('[data-slot="agent-status-action"]'),
      ).not.toBeNull();
      // A tela de demonstração traz um botão INERTE dentro da moldura: ele não
      // é ação da peça, e a asserção é sobre o que a peça oferece — não sobre o
      // que a foto mostra. Por isso a busca ignora o que está dentro de `inert`.
      const actions = [...piece.querySelectorAll('button')].filter(
        (b) => b.closest('[inert]') === null,
      );
      await expect(actions).toEqual([]);
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
    covers: [
      'functional.item11',
      'accessibility.item6', 'accessibility.item7', 'accessibility.item8',
      'visual.item9',
    ],
    docs: { source: { transform: computerUseScreenSource } },
  },
  render: () => ({
    Component: ComputerUseStory,
    props: {
      url: COMPUTER_URL_LONG,
      // O quarto passo é o do alvo longo — a senha guardada no cofre.
      activeIndex: 3,
      status: 'running',
      wrapperClass: 'nds-max-w-2xs',
    },
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
export const Portrait: PortraitStory = {
  parameters: {
    covers: ['visual.item10'],
    docs: { source: { transform: computerUsePortraitSource } },
  },
  render: () => ({ Component: ComputerUsePortraitStory }),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);

    await step('A proporção do quadro veio da propriedade personalizada', async () => {
      // Leitura pura, e no COMPUTADO: nesta stack a proporção chega por bloco de
      // estilo, não por `style` inline, porque a folha declara a propriedade no
      // próprio elemento — e declaração no elemento vence valor herdado.
      const aspect = getComputedStyle(piece)
        .getPropertyValue('--computer-use-aspect')
        .replace(/\s+/g, '');
      await expect(aspect).toBe('9/16');
    });

    await step('E o quadro de fato ficou mais alto que largo', async () => {
      // A asserção acima sozinha seria portão sem dentes: uma propriedade posta
      // num ANCESTRAL também apareceria no computado do elemento por herança, e
      // ainda assim perderia para a declaração da folha. Medir a caixa é o que
      // prova que a proporção pegou.
      const frame = piece.querySelector<HTMLElement>('[data-slot="computer-use-screen"]')!;
      const { width, height } = frame.getBoundingClientRect();
      await expect(height).toBeGreaterThan(width);
    });
  },
};
