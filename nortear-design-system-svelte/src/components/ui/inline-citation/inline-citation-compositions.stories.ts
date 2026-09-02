import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, userEvent } from 'storybook/test';
import InlineCitationInSentenceStory from './InlineCitationInSentenceStory.svelte';
import InlineCitationMutuallyExclusiveStory from './InlineCitationMutuallyExclusiveStory.svelte';
import { awaitExpanded, awaitPanel, awaitPanelGone, panelOf } from './inline-citation.fixtures';
import {
  inlineCitationInSentenceSource,
  inlineCitationMutuallyExclusiveSource,
} from './inline-citation.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// As duas composições respondem ao que a peça deliberadamente NÃO faz. Ela não
// escreve a frase, então a primeira mostra quem escreve; e ela não conhece as
// vizinhas, então a segunda mostra quem as conhece. As duas coisas são §2 da
// guideline 17 lida em voz alta: o componente desenha o que recebe.

const meta: Meta<typeof InlineCitationInSentenceStory> = {
  title: 'Primitives/Conversational/InlineCitation/Compositions',
  component: InlineCitationInSentenceStory,
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: inlineCitationInSentenceSource },
      description: {
        component:
          'A frase é de quem escreve, e a exclusão mútua entre prévias é de quem monta a página. As duas composições mostram o que a peça entrega a quem a usa em vez de decidir sozinha.',
      },
    },
  },
};

export default meta;

/**
 * O tipo acompanha O QUE É MONTADO, e não o `meta`.
 *
 * A FRASE é marcação, e marcação não mora num `*.stories.ts`: cada story monta
 * um invólucro em vez da peça nua, e o invólucro é quem intercala os pedaços da
 * frase com as marcas.
 */
type SentenceStory = StoryObj<typeof InlineCitationInSentenceStory>;
type ExclusiveStory = StoryObj<typeof InlineCitationMutuallyExclusiveStory>;

const markersOf = (canvasElement: HTMLElement) => [
  ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="inline-citation-marker"]'),
];

const rootsOf = (canvasElement: HTMLElement) => [
  ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="inline-citation"]'),
];

// Par idempotente: o painel Interactions repete a `play`, e um clique cego
// partiria do estado que a rodada anterior deixou.
//
// E ele ESPERA a marca assentar antes de devolver, pelo motivo escrito em
// `awaitExpanded`: quem escreve `aria-expanded` é o primitivo, num efeito que
// corre depois que o clique já retornou. Aqui a corrida ainda não tinha
// reprovado — a mesma corrida reprovou o fechamento nas stories de estado, e
// latente é como ela viveu lá até a primeira rodada de navegador.
const openMarker = async (el: HTMLElement) => {
  if (el.getAttribute('aria-expanded') !== 'true') await userEvent.click(el);
  await awaitExpanded(el, 'true');
};

/**
 * Duas marcas na mesma frase, com a numeração vinda de fora.
 *
 * A frase é partida onde as marcas entram, e nenhum pedaço termina em espaço: é
 * assim que a marca não se separa da palavra que a antecede quando a linha
 * quebra. A segunda citação é a MÍNIMA de propósito — numa foto só se vê que a
 * prévia desenha o que veio.
 */
export const InSentence: SentenceStory = {
  parameters: {
    covers: ['accessibility.item4', 'accessibility.item6', 'visual.item5'],
  },
  render: () => ({ Component: InlineCitationInSentenceStory }),
  play: async ({ canvasElement, step }) => {
    const [first, second] = markersOf(canvasElement);
    const [firstRoot] = rootsOf(canvasElement);

    await step('As duas marcas trazem a própria numeração, na ordem da frase', async () => {
      await expect(first.textContent).toBe('1');
      await expect(second.textContent).toBe('2');
    });

    await step('Receber o FOCO não abre a prévia', async () => {
      // Percorrer com tabulação uma frase de cinco citações abriria cinco
      // prévias, uma por parada (decisão 4 da folha).
      first.focus();
      await expect(document.activeElement).toBe(first);
      await expect(panelOf(firstRoot)).toBeNull();
      await expect(first.getAttribute('aria-expanded')).toBe('false');
    });

    await step('Aberta, a prévia entra LOGO DEPOIS da marca, dentro da mesma raiz', async () => {
      // É o que faz o percurso do teclado alcançar o link do título sem nada
      // mover o foco (decisão 6 da folha): portalada para o fim do documento, a
      // próxima parada seria a palavra seguinte do parágrafo.
      await openMarker(first);
      await awaitPanel(firstRoot);
      const panel = panelOf(firstRoot)!;

      await expect(panel.parentElement).toBe(firstRoot);
      await expect(first.nextElementSibling).toBe(panel);

      const title = panel.querySelector<HTMLElement>('[data-slot="inline-citation-title"]')!;
      await expect(title.tagName).toBe('A');
      await expect(firstRoot.contains(title)).toBe(true);
    });
  },
};

/**
 * Duas prévias que não ficam abertas ao mesmo tempo.
 *
 * A peça não conhece as vizinhas, e não conhecê-las é o que permite que duas
 * marcas da mesma frase venham de lugares diferentes da resposta. Quem as tem
 * numa lista fecha as outras ao abrir uma — e é a própria peça que devolve a
 * abertura e aceita a ordem de fechar.
 */
export const MutuallyExclusive: ExclusiveStory = {
  parameters: {
    covers: ['functional.item8', 'visual.item6'],
    docs: { source: { transform: inlineCitationMutuallyExclusiveSource } },
  },
  render: () => ({ Component: InlineCitationMutuallyExclusiveStory }),
  play: async ({ canvasElement, step }) => {
    const [first, second] = markersOf(canvasElement);
    const [firstRoot, secondRoot] = rootsOf(canvasElement);

    await step('Abrir a primeira monta a prévia dela, e só a dela', async () => {
      await openMarker(first);
      await awaitPanel(firstRoot);
      await expect(panelOf(firstRoot)).not.toBeNull();
      await expect(panelOf(secondRoot)).toBeNull();
    });

    await step('Abrir a segunda fecha a primeira, pelo evento que a peça devolve', async () => {
      // O componente não procurou a irmã: quem a fechou foi a página, com a
      // lista que só ela tem.
      await openMarker(second);
      await awaitPanel(secondRoot);
      // A primeira fecha por ordem da PÁGINA, um passo depois de a segunda
      // abrir: esperar as duas pontas é o que separa "a página fechou" de "a
      // leitura chegou antes da página".
      await awaitPanelGone(firstRoot);
      await awaitExpanded(first, 'false');
      await expect(panelOf(secondRoot)).not.toBeNull();
      await expect(panelOf(firstRoot)).toBeNull();
      await expect(first.getAttribute('aria-expanded')).toBe('false');
      await expect(second.getAttribute('aria-expanded')).toBe('true');
    });
  },
};
