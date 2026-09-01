import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { useTemplateRef } from 'vue';
import { expect, userEvent } from 'storybook/test';
import { InlineCitation, type InlineCitationCommands } from './index';
import {
  awaitPanel,
  panelOf,
  sentenceCitations,
  sentenceParts,
  useInlineCitationLabels,
} from './inline-citation.fixtures';
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

const meta: Meta = {
  title: 'Primitives/Conversational/InlineCitation/Compositions',
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
type Story = StoryObj;

const markersOf = (canvasElement: HTMLElement) => [
  ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="inline-citation-marker"]'),
];

const rootsOf = (canvasElement: HTMLElement) => [
  ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="inline-citation"]'),
];

// Par idempotente: o painel Interactions repete a `play`, e um clique cego
// partiria do estado que a rodada anterior deixou.
const openMarker = async (el: HTMLElement) => {
  if (el.getAttribute('aria-expanded') !== 'true') await userEvent.click(el);
};

/**
 * Duas marcas na mesma frase, com a numeração vinda de fora.
 *
 * A frase é partida onde as marcas entram, e nenhum pedaço termina em espaço: é
 * assim que a marca não se separa da palavra que a antecede quando a linha
 * quebra. A segunda citação é a MÍNIMA de propósito — numa foto só se vê que a
 * prévia desenha o que veio.
 */
export const InSentence: Story = {
  parameters: {
    covers: ['accessibility.item4', 'accessibility.item6', 'visual.item5'],
  },
  render: () => ({
    components: { InlineCitation },
    setup() {
      return {
        parts: sentenceParts(),
        citations: sentenceCitations(),
        labelsOf: useInlineCitationLabels(),
      };
    },
    // A NUMERAÇÃO CHEGA DE FORA: ela é conteúdo, e é por ela que a frase se
    // refere à lista de fontes do turno.
    template: `<p>{{ parts[0] }}<InlineCitation
      :citation="citations[0]"
      :index="1"
      :labels="labelsOf(1, citations[0])"
    />{{ parts[1] }}<InlineCitation
      :citation="citations[1]"
      :index="2"
      :labels="labelsOf(2, citations[1])"
    />{{ parts[2] }}</p>`,
  }),
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
      const panel = (await awaitPanel(firstRoot))!;

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
 * na página fecha a irmã ao abrir uma — pelo evento que a peça devolve e pelo
 * comando que ela expõe.
 */
export const MutuallyExclusive: Story = {
  parameters: {
    covers: ['functional.item8', 'visual.item6'],
    docs: { source: { transform: inlineCitationMutuallyExclusiveSource } },
  },
  render: () => ({
    components: { InlineCitation },
    setup() {
      // O COMANDO CHEGA POR `ref` DE TEMPLATE, que é a forma desta stack para
      // falar com uma instância montada — a divergência de API registrada no
      // índice da peça.
      const primeira = useTemplateRef<InlineCitationCommands>('primeira');
      const segunda = useTemplateRef<InlineCitationCommands>('segunda');

      // A EXCLUSÃO MÚTUA É DAQUI, e não do componente: ele devolve cada
      // abertura, e quem tem as duas na página decide o que fazer com ela.
      return {
        parts: sentenceParts(),
        citations: sentenceCitations(),
        labelsOf: useInlineCitationLabels(),
        onFirstOpen: (open: boolean) => { if (open) segunda.value?.close(); },
        onSecondOpen: (open: boolean) => { if (open) primeira.value?.close(); },
      };
    },
    template: `<p>{{ parts[0] }}<InlineCitation
      ref="primeira"
      :citation="citations[0]"
      :index="1"
      :labels="labelsOf(1, citations[0])"
      @open-change="onFirstOpen"
    />{{ parts[1] }}<InlineCitation
      ref="segunda"
      :citation="citations[1]"
      :index="2"
      :labels="labelsOf(2, citations[1])"
      @open-change="onSecondOpen"
    />{{ parts[2] }}</p>`,
  }),
  play: async ({ canvasElement, step }) => {
    const [first, second] = markersOf(canvasElement);
    const [firstRoot, secondRoot] = rootsOf(canvasElement);

    await step('Abrir a primeira monta a prévia dela, e só a dela', async () => {
      await openMarker(first);
      await expect(await awaitPanel(firstRoot)).not.toBeNull();
      await expect(panelOf(secondRoot)).toBeNull();
    });

    await step('Abrir a segunda fecha a primeira, pelo evento que a peça devolve', async () => {
      // O componente não procurou a irmã: quem a fechou foi a página, com as
      // duas que só ela tem.
      await openMarker(second);
      await expect(await awaitPanel(secondRoot)).not.toBeNull();

      // O fechamento da irmã chega no ciclo seguinte ao do evento, e a espera é
      // de RELÓGIO com leitura pura: condição que toca o DOM reagenda a si
      // mesma e pendura a aba sem reprovar.
      const deadline = Date.now() + 1000;
      while (panelOf(firstRoot) !== null && Date.now() < deadline) {
        await new Promise((resolve) => { setTimeout(resolve, 16); });
      }

      await expect(panelOf(firstRoot)).toBeNull();
      await expect(first.getAttribute('aria-expanded')).toBe('false');
      await expect(second.getAttribute('aria-expanded')).toBe('true');
    });
  },
};
