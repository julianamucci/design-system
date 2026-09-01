import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, userEvent } from 'storybook/test';
import InlineCitationStory from './InlineCitationStory.svelte';
import { awaitPanel, citationOf, panelOf } from './inline-citation.fixtures';
import {
  inlineCitationEveryCaseSource,
  inlineCitationExpandedSource,
  inlineCitationMinimalSource,
  inlineCitationRefusedSource,
} from './inline-citation.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O que a prévia diz nas bordas: a citação inteira, a que só tem fonte e a que
// traz um endereço que não pode virar link. Nas três o desenho da MARCA é o
// mesmo — o número, na mesma superfície —, e o que muda está dentro da caixa.
// É por isso que as três nascem abertas: uma foto da marca recolhida seria a
// mesma foto três vezes.

const meta: Meta<typeof InlineCitationStory> = {
  title: 'Primitives/Conversational/InlineCitation/States',
  component: InlineCitationStory,
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: inlineCitationEveryCaseSource },
      description: {
        component:
          'Nas bordas a marca não muda: o número continua o mesmo sobre a mesma superfície. O que responde está dentro da prévia — o que a citação trouxe, e o que acontece quando o endereço da fonte não pode virar link.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof InlineCitationStory>;

const rootOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="inline-citation"]')!;

const markerOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="inline-citation-marker"]')!;

// Par idempotente: o painel Interactions repete a `play`, e um clique cego
// partiria do estado que a rodada anterior deixou.
const openMarker = async (el: HTMLElement) => {
  if (el.getAttribute('aria-expanded') !== 'true') await userEvent.click(el);
};
const closeMarker = async (el: HTMLElement) => {
  if (el.getAttribute('aria-expanded') !== 'false') await userEvent.click(el);
};

/**
 * A prévia aberta, com a citação inteira.
 *
 * É o exemplo que mostra as quatro linhas de uma vez, e é nele que se vê por
 * que a caixa não precisa de nome próprio: quem chegou até ela veio da marca, e
 * a marca já disse de que fonte se trata.
 */
export const Expanded: Story = {
  parameters: {
    covers: [
      'functional.item3', 'functional.item4', 'functional.item7',
      'accessibility.item5', 'visual.item2',
    ],
    docs: { source: { transform: inlineCitationExpandedSource } },
  },
  render: () => ({
    Component: InlineCitationStory,
    props: { shape: 'full', defaultOpen: true },
  }),
  play: async ({ canvasElement, step }) => {
    const root = rootOf(canvasElement);
    const marker = markerOf(canvasElement);
    const citation = citationOf('full');

    await awaitPanel(root);

    await step('A prévia monta as quatro linhas que a citação trouxe', async () => {
      const panel = panelOf(root)!;
      await expect(panel).not.toBeNull();
      await expect(marker.getAttribute('aria-expanded')).toBe('true');
      const address = panel.querySelector<HTMLElement>(
        '[data-slot="inline-citation-address"]',
      )!;
      const title = panel.querySelector<HTMLElement>('[data-slot="inline-citation-title"]')!;
      const excerpt = panel.querySelector<HTMLElement>(
        '[data-slot="inline-citation-excerpt"]',
      )!;
      const anchor = panel.querySelector<HTMLElement>('[data-slot="inline-citation-anchor"]')!;
      await expect(address.textContent).toBe(citation.source.url);
      await expect(title.textContent).toBe(citation.source.title);
      await expect(excerpt.textContent).toBe(citation.excerpt);
      await expect(anchor.textContent).toBe(citation.anchor);
    });

    await step('O título é um link de verdade, e leva ao endereço da fonte', async () => {
      const title = root.querySelector<HTMLElement>('[data-slot="inline-citation-title"]')!;
      await expect(title.tagName).toBe('A');
      await expect(title.getAttribute('href')).toBe(citation.source.url);
      await expect(title.hasAttribute('data-unsafe')).toBe(false);
    });

    await step('Acionar de novo recolhe a prévia, e ela SAI da árvore', async () => {
      // Fechada, ela não deixa parada de tabulação para trás: o link do título
      // não existe mais, em vez de existir escondido.
      await closeMarker(marker);
      await expect(marker.getAttribute('aria-expanded')).toBe('false');
      await expect(panelOf(root)).toBeNull();
    });

    await step('Escape fecha, e o foco NÃO se move', async () => {
      // Ele já está na marca, que é de onde a prévia saiu (decisão 5 da folha).
      await openMarker(marker);
      await expect(panelOf(root)).not.toBeNull();

      marker.focus();
      await userEvent.keyboard('{Escape}');

      await expect(panelOf(root)).toBeNull();
      await expect(document.activeElement).toBe(marker);
    });
  },
};

/**
 * A citação que só tem fonte.
 *
 * A borda que quem só testar com dado cheio nunca encontra: sem trecho e sem
 * lugar, a prévia mostra o endereço e o título e para aí — sem traço, sem
 * espaço reservado e sem linha vazia.
 */
export const Minimal: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item3'],
    docs: { source: { transform: inlineCitationMinimalSource } },
  },
  render: () => ({
    Component: InlineCitationStory,
    props: { shape: 'minimal', defaultOpen: true },
  }),
  play: async ({ canvasElement, step }) => {
    const root = rootOf(canvasElement);
    const citation = citationOf('minimal');

    await awaitPanel(root);

    await step('A prévia monta só o que veio', async () => {
      const panel = panelOf(root)!;
      const address = panel.querySelector<HTMLElement>(
        '[data-slot="inline-citation-address"]',
      )!;
      const title = panel.querySelector<HTMLElement>('[data-slot="inline-citation-title"]')!;
      await expect(address.textContent).toBe(citation.source.url);
      await expect(title.textContent).toBe(citation.source.title);
    });

    await step('E NADA no lugar do que não veio', async () => {
      // Ausente é ausente: um traço afirmaria que existe um trecho vazio, que é
      // pior do que não dizer nada.
      const panel = panelOf(root)!;
      await expect(panel.querySelector('[data-slot="inline-citation-excerpt"]')).toBeNull();
      await expect(panel.querySelector('[data-slot="inline-citation-anchor"]')).toBeNull();
      await expect(panel.textContent).not.toContain('—');
    });
  },
};

/**
 * A fonte cujo endereço não pode virar link.
 *
 * Endereço de fonte é escrito por quem gerou a resposta, e `javascript:` num
 * `href` executa. O que a peça faz é o oposto de apagar: o título continua
 * legível, e o que sai é o link.
 */
export const Refused: Story = {
  parameters: {
    covers: ['functional.item6', 'visual.item4'],
    docs: { source: { transform: inlineCitationRefusedSource } },
  },
  render: () => ({
    Component: InlineCitationStory,
    props: { shape: 'unsafe', defaultOpen: true },
  }),
  play: async ({ canvasElement, step }) => {
    const root = rootOf(canvasElement);
    const citation = citationOf('unsafe');

    await awaitPanel(root);

    await step('O título continua legível, e DEIXA de ser link', async () => {
      const title = root.querySelector<HTMLElement>('[data-slot="inline-citation-title"]')!;
      await expect(title.textContent).toBe(citation.source.title);
      await expect(title.tagName).not.toBe('A');
      await expect(title.hasAttribute('href')).toBe(false);
      await expect(title.hasAttribute('data-unsafe')).toBe(true);
    });

    await step('O endereço recusado não é impresso — o que entra são as palavras', async () => {
      // Endereço recusado não é um lugar, e imprimi-lo responderia com ruído a
      // pergunta que a linha existe para responder.
      const address = root.querySelector<HTMLElement>(
        '[data-slot="inline-citation-address"]',
      )!;
      await expect(address.textContent).not.toBe(citation.source.url);
      await expect(root.textContent).not.toContain('javascript:');
      // E a linha do endereço perde a monoespaçada e o corte: o que está ali
      // são palavras, não um lugar.
      await expect(address.classList.contains('nds-font-mono')).toBe(false);
      await expect(address.classList.contains('nds-truncate')).toBe(false);
    });

    await step('E nada dentro da prévia carrega o endereço recusado', async () => {
      // O trecho leva `cite` só quando o endereço passou, porque `cite` é um
      // endereço como o `href`.
      const quote = root.querySelector<HTMLElement>('[data-slot="inline-citation-excerpt"]')!;
      await expect(quote.hasAttribute('cite')).toBe(false);
      await expect(root.querySelector('a[href^="javascript:"]')).toBeNull();
    });
  },
};
