import { ChangeDetectionStrategy, Component, ViewEncapsulation, viewChildren } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';
import { NdsInlineCitation } from './inline-citation';
import {
  awaitNoPanel,
  awaitPanel,
  panelOf,
  sentenceParts,
  sentenceSlots,
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
  decorators: [moduleMetadata({ imports: [NdsInlineCitation] })],
  // Sem argTypes nem callbacks: sem isto os painéis Controls e Actions abrem vazios.
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
// partiria do estado que a rodada anterior deixou. A espera é por RELÓGIO, com
// leitura pura.
const openMarker = async (el: HTMLElement, root: HTMLElement) => {
  if (el.getAttribute('aria-expanded') !== 'true') await userEvent.click(el);
  await awaitPanel(root);
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
    props: {
      antes: sentenceParts()[0],
      // A NUMERAÇÃO CHEGA DE FORA: ela é conteúdo, e é por ela que a frase se
      // refere à lista de fontes do turno. O pedaço de texto que SEGUE cada
      // marca viaja junto com ela, e é o que permite intercalar sem espaço.
      slots: sentenceSlots(),
    },
    template: `
      <p>{{ antes }}@for (slot of slots; track slot.index) {<span
            ndsInlineCitation
            [citation]="slot.citation"
            [index]="slot.index"
            [labels]="slot.labels"
          ></span>{{ slot.tail }}}</p>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const [first, second] = markersOf(canvasElement);
    const [firstRoot] = rootsOf(canvasElement);

    await step('As duas marcas trazem a própria numeração, na ordem da frase', async () => {
      await expect(first!.textContent).toBe('1');
      await expect(second!.textContent).toBe('2');
    });

    await step('Receber o FOCO não abre a prévia', async () => {
      // Percorrer com tabulação uma frase de cinco citações abriria cinco
      // prévias, uma por parada (decisão 4 da folha).
      first!.focus();
      await expect(document.activeElement).toBe(first);
      await expect(panelOf(firstRoot!)).toBeNull();
      await expect(first!.getAttribute('aria-expanded')).toBe('false');
    });

    await step('Aberta, a prévia entra LOGO DEPOIS da marca, dentro da mesma raiz', async () => {
      // É o que faz o percurso do teclado alcançar o link do título sem nada
      // mover o foco (decisão 6 da folha): portalada para o fim do documento, a
      // próxima parada seria a palavra seguinte do parágrafo.
      await openMarker(first!, firstRoot!);
      const panel = panelOf(firstRoot!)!;

      await expect(panel.parentElement).toBe(firstRoot);
      await expect(first!.nextElementSibling).toBe(panel);

      const title = panel.querySelector<HTMLElement>('[data-slot="inline-citation-title"]')!;
      await expect(title.tagName).toBe('A');
      await expect(firstRoot!.contains(title)).toBe(true);
    });
  },
};

// ── A exclusão mútua ──────────────────────────────────────────────────────────
//
// O andaime é um COMPONENTE porque o comando desta stack chega por consulta de
// vista: as instâncias só existem depois que a vista foi criada, e um objeto de
// `props` é montado antes. É também o desenho que a peça pede — ela devolve cada
// abertura por `openChange` e aceita a ordem de fechar por método, e quem tem a
// lista é a página.

@Component({
  selector: 'nds-inline-citation-exclusive-demo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NdsInlineCitation],
  template: `
    <p>{{ antes }}@for (slot of slots; track slot.index) {<span
          ndsInlineCitation
          [citation]="slot.citation"
          [index]="slot.index"
          [labels]="slot.labels"
          (openChange)="aoMudar($event, slot.index)"
        ></span>{{ slot.tail }}}</p>
  `,
})
class MutuallyExclusiveDemo {
  protected readonly antes = sentenceParts()[0]!;
  protected readonly slots = sentenceSlots();

  private readonly marcas = viewChildren(NdsInlineCitation);

  /**
   * A EXCLUSÃO MÚTUA É DAQUI, e não do componente.
   *
   * A peça devolve cada abertura, e quem tem a lista decide o que fazer com ela.
   * Fechar as irmãs é o COMANDO, chamado nas instâncias que a consulta de vista
   * entrega — a marca continua sem conhecer as vizinhas.
   */
  protected aoMudar(aberta: boolean, index: number): void {
    if (!aberta) return;
    for (const marca of this.marcas()) {
      if (marca.index() !== index) marca.close();
    }
  }
}

/**
 * Duas prévias que não ficam abertas ao mesmo tempo.
 *
 * A peça não conhece as vizinhas, e não conhecê-las é o que permite que duas
 * marcas da mesma frase venham de lugares diferentes da resposta. Quem as tem
 * numa lista fecha as outras ao abrir uma — e é a própria peça que devolve a
 * abertura e aceita a ordem de fechar.
 */
export const MutuallyExclusive: Story = {
  parameters: {
    covers: ['functional.item8', 'visual.item6'],
    docs: { source: { transform: inlineCitationMutuallyExclusiveSource } },
  },
  decorators: [moduleMetadata({ imports: [MutuallyExclusiveDemo] })],
  render: () => ({ template: '<nds-inline-citation-exclusive-demo />' }),
  play: async ({ canvasElement, step }) => {
    const [first, second] = markersOf(canvasElement);
    const [firstRoot, secondRoot] = rootsOf(canvasElement);

    await step('Abrir a primeira monta a prévia dela, e só a dela', async () => {
      await openMarker(first!, firstRoot!);
      await expect(panelOf(firstRoot!)).not.toBeNull();
      await expect(panelOf(secondRoot!)).toBeNull();
    });

    await step('Abrir a segunda fecha a primeira, pelo evento que a peça devolve', async () => {
      // O componente não procurou a irmã: quem a fechou foi a página, com a
      // lista que só ela tem.
      await openMarker(second!, secondRoot!);
      await awaitNoPanel(firstRoot!);

      await expect(panelOf(secondRoot!)).not.toBeNull();
      await expect(panelOf(firstRoot!)).toBeNull();
      await expect(first!.getAttribute('aria-expanded')).toBe('false');
      await expect(second!.getAttribute('aria-expanded')).toBe('true');
    });
  },
};
