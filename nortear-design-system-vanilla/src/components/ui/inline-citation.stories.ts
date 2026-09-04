import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, within } from 'storybook/test';
import { createInlineCitation } from './inline-citation';
import {
  awaitPanel,
  citationOf,
  inlineCitationLabels,
  panelOf,
  sentenceParts,
  type InlineCitationCase,
} from './inline-citation.fixtures';
import { inlineCitationSource } from './inline-citation.source';
import { createInlineCitationDocs } from '@/components/docs/InlineCitationDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

/**
 * Os dois eixos desta peça: o que a citação traz, e se a prévia nasce aberta.
 *
 * O control da citação é uma ESCOLHA entre os três casos que a peça desenha
 * diferente, e não um campo por campo: o que a story precisa mostrar é que a
 * prévia monta o que veio e nada no lugar do que não veio, e isso só se vê
 * trocando a citação inteira.
 *
 * Não há control de posição, e a ausência é o assunto de uma das composições: a
 * prévia escolhe o lado pelo espaço que tem, e quem a coloca na frase é quem
 * escreve a frase.
 */
type PlaygroundArgs = {
  shape: InlineCitationCase;
  defaultOpen: boolean;
};

const meta: Meta<PlaygroundArgs> = {
  title: 'Components/Conversational/InlineCitation',
  tags: ['autodocs', 'conversational'],
  parameters: {
    layout: 'padded',
    actions: { disable: true },
    docs: {
      page: withAutoDocsTab(createInlineCitationDocs),
      source: { transform: inlineCitationSource },
    },
  },
  argTypes: {
    shape: {
      control: { type: 'inline-radio' },
      options: ['full', 'minimal', 'unsafe'],
      description:
        'Qual citação chega: a inteira, a que só tem fonte, ou a que traz um endereço que não pode virar link.',
      table: { type: { summary: "'full' | 'minimal' | 'unsafe'" }, defaultValue: { summary: 'full' } },
    },
    defaultOpen: {
      control: { type: 'boolean' },
      description:
        'Nasce com a prévia aberta. Serve para fotografar o estado; no uso corrente quem abre é quem lê.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
  },
  args: {
    shape: 'full',
    defaultOpen: false,
  },
};

export default meta;
type Story = StoryObj<PlaygroundArgs>;

/** A frase que hospeda a marca, montada por quem escreve — nunca pela peça. */
function playgroundSentence(args: PlaygroundArgs): HTMLElement {
  const parts = sentenceParts();
  const citation = citationOf(args.shape);

  const sentence = document.createElement('p');
  // SEM ESPAÇO ANTES DA MARCA: é assim que ela não se separa da palavra que a
  // antecede quando a linha quebra.
  sentence.append(
    parts[0],
    createInlineCitation({
      citation,
      index: 1,
      defaultOpen: args.defaultOpen,
      labels: inlineCitationLabels(1, citation),
    }),
    parts[1] + parts[2],
  );
  return sentence;
}

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
      'accessibility.item7', 'accessibility.item8',
      'visual.item1',
    ],
  },
  render: (args) => playgroundSentence(args),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="inline-citation"]')!;
    const marker = canvasElement.querySelector<HTMLElement>('[data-slot="inline-citation-marker"]')!;
    const citation = citationOf(args.shape);
    const labels = inlineCitationLabels(1, citation);

    // `defaultOpen` abre no quadro SEGUINTE ao da montagem. Esperar por relógio
    // antes de ler é o que mantém a asserção honesta nos dois valores do
    // control, e o que a mantém fora da armadilha da espera por observador.
    if (args.defaultOpen) await awaitPanel(root);

    await step('A marca vive DENTRO do parágrafo, e o texto corre em volta dela', async () => {
      // A peça é a marca, e não a frase: quem escreve a frase decide onde cada
      // afirmação precisa de apoio.
      await expect(root.closest('p')).not.toBeNull();
      await expect(marker.textContent).toBe('1');
      await expect(canvas.getByText(/doze por cento/)).toBeInTheDocument();
    });

    await step('A marca é um botão que EXPANDE, e a prévia não é um diálogo', async () => {
      // Papel de diálogo exigiria nome acessível, e o texto do gatilho é "1"
      // (decisão 1 da folha).
      await expect(marker.tagName).toBe('BUTTON');
      await expect(marker.getAttribute('type')).toBe('button');
      await expect(marker.hasAttribute('aria-expanded')).toBe(true);
      await expect(root.querySelector('[role="dialog"]')).toBeNull();
    });

    await step('O nome acessível diz de QUAL fonte se trata, e traz o número', async () => {
      // "1" sozinho não descreve fonte nenhuma; e o nome contém o rótulo
      // visível, que é o que a WCAG 2.5.3 pede (decisão 2 da folha).
      const accessibleName = marker.getAttribute('aria-label')!;
      await expect(accessibleName).toBe(labels.marker);
      await expect(accessibleName).toContain('1');
      await expect(accessibleName).toContain(citation.source.title);
    });

    await step('O botão aponta para a prévia por identificador', async () => {
      const controls = marker.getAttribute('aria-controls');
      await expect(controls).toBeTruthy();
      const panel = panelOf(root);
      // A ligação só se PROVA com a prévia montada; fechada, o que existe é a
      // promessa do atributo, e é ela que a linha acima cobra.
      if (panel) await expect(panel.id).toBe(controls);
    });

    await step('O alvo de toque é maior que a marca, e vive FORA do fluxo', async () => {
      // Aumentar a marca em si esticaria a entrelinha do parágrafo em toda linha
      // que trouxesse uma citação (decisão 7 da folha). Leitura pura de estilo
      // calculado, uma vez — nada aqui espera por nada.
      const hitArea = window.getComputedStyle(marker, '::after');
      await expect(hitArea.position).toBe('absolute');

      const width = Number.parseFloat(hitArea.width);
      const height = Number.parseFloat(hitArea.height);
      if (Number.isFinite(width)) await expect(width).toBeGreaterThanOrEqual(24);
      if (Number.isFinite(height)) await expect(height).toBeGreaterThanOrEqual(24);
    });

    await step('Nada aqui é região viva, e o estado aberto não é só cor', async () => {
      // Evidência chega junto com a resposta, e a resposta está sendo lida ao
      // lado (regra 3 da folha). Quem ouve recebe o estado do botão.
      await expect(root.hasAttribute('aria-live')).toBe(false);
      await expect(root.querySelector('[aria-live]')).toBeNull();
      await expect(root.querySelector('[role="status"], [role="alert"], [role="log"]')).toBeNull();
      await expect(marker.getAttribute('aria-expanded')).toBe(args.defaultOpen ? 'true' : 'false');
    });
  },
};
