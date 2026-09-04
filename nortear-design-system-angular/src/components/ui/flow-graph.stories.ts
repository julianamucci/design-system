import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { RUN_STATUSES, type RunStatus } from '@shared/primitives/chat-protocol';
import { FLOW_EDGES_ORDER, FLOW_NODES_ORDER } from '@shared/primitives/flow-graph-examples';
import { NdsFlowGraph } from './flow-graph';
import { flowGraphLabels, mountFlowGraph } from './flow-graph.fixtures';
import { flowGraphSource } from './flow-graph.source';
import { NdsFlowGraphDocs } from '@/components/docs/FlowGraphDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os três eixos da peça, numa peça só.
//
// O estado decide se ela se declara ocupada; quantos nós entram decide o quanto
// do grafo aparece — e, de quebra, quais ligações continuam tendo as duas
// pontas; e a presença das ligações decide se o desenho é um grafo ou uma grade
// de caixas soltas.
//
// O EIXO DA REVELAÇÃO É QUANTOS NÓS ENTRAM, e não um contador dentro da peça.
// Ele está aqui como controle porque é assim que quem consome revela um grafo
// aos poucos: passando menos nós. O padrão é QUATRO de propósito — com o grafo
// inteiro não haveria ligação órfã para descartar, e é justamente isso que esta
// story precisa mostrar.

type PlaygroundArgs = {
  status: RunStatus;
  revealed: number;
  withEdges: boolean;
};

const meta: Meta<PlaygroundArgs> = {
  title: 'Components/Conversational/FlowGraph',
  tags: ['autodocs', 'conversational'],
  decorators: [moduleMetadata({ imports: [NdsFlowGraph] })],
  parameters: {
    layout: 'padded',
    actions: { disable: true },
    docs: {
      page: withAutoDocsTab(NdsFlowGraphDocs),
      // O renderer desta stack imprime o `template` da story com os bindings
      // apontando para membros que só existem aqui. A transform devolve o uso
      // real: um componente que declara os nós, as ligações e os rótulos.
      source: { transform: flowGraphSource },
    },
  },
  argTypes: {
    status: {
      control: 'select',
      options: [...RUN_STATUSES],
      description:
        'Em que pé está a execução que escreve o grafo. Decide se a peça se declara ocupada.',
      table: {
        type: { summary: RUN_STATUSES.map((s) => `'${s}'`).join(' | ') },
        defaultValue: { summary: "'idle'" },
      },
    },
    revealed: {
      control: { type: 'range', min: 0, max: FLOW_NODES_ORDER.length, step: 1 },
      description:
        'Quantos nós entram. Revelar aos poucos é passar menos nós: as ligações que perdem uma ponta somem sozinhas, e sem nó nenhum não há grafo.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '4' } },
    },
    withEdges: {
      control: 'boolean',
      description:
        'Houve dependência? Sem ligação nenhuma sobram as caixas nas casas em que foram postas, e nada diz o que depende de quê.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
  },
  args: {
    status: 'running',
    revealed: 4,
    withEdges: true,
  },
};

export default meta;
type Story = StoryObj<PlaygroundArgs>;

/** O invólucro mora nas fixtures: ele é o que dá à asserção um elemento a que
 *  apontar quando a peça não desenha nada. */
const mount = (args: PlaygroundArgs) =>
  mountFlowGraph({
    nodes: FLOW_NODES_ORDER.slice(0, args.revealed),
    edges: args.withEdges ? FLOW_EDGES_ORDER : [],
    status: args.status,
    testid: 'flow-graph-host',
  });

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item4',
      'functional.item5', 'functional.item6',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
      'accessibility.item4', 'accessibility.item5', 'accessibility.item6',
      'accessibility.item7',
      'visual.item1',
    ],
  },
  render: mount,
  play: async ({ canvasElement, step, args }) => {
    const host = canvasElement.querySelector<HTMLElement>('[data-testid="flow-graph-host"]')!;
    const root = host.querySelector<HTMLElement>('[data-slot="flow-graph"]')!;
    const labels = flowGraphLabels();

    if (args.revealed === 0) {
      // Sem nó não há grafo, e a peça não desenha nada — nem moldura, nem camada
      // que rola. Uma parada de teclado que leva a uma caixa vazia é ruído com
      // nome. Nesta stack o host continua no documento, porque quem o escreve é
      // quem consome; o que a peça controla é tudo o que estaria dentro dele.
      await step('Sem nó nenhum, nada é desenhado', async () => {
        await expect(root.children.length).toBe(0);
        await expect(root.querySelector('[data-slot="flow-graph-viewport"]')).toBeNull();
        await expect(root.getAttribute('aria-busy')).toBeNull();
      });
      return;
    }

    const visible = FLOW_NODES_ORDER.slice(0, args.revealed);
    const ids = new Set(visible.map((n) => n.id));

    await step('Há um nó por nó, na ordem em que foram declarados', async () => {
      // A posição na grade é livre; a ordem no DOM não é, porque ela é a ordem
      // de leitura (WCAG 1.3.2).
      const nodes = [...root.querySelectorAll<HTMLElement>('[data-slot="flow-graph-node"]')];
      await expect(nodes.length).toBe(visible.length);
      await expect(nodes.map((n) => n.dataset.nodeId)).toEqual(visible.map((n) => n.id));
      await expect(nodes.map((n) => n.dataset.state)).toEqual(visible.map((n) => n.state));
    });

    await step('Só a ligação com as duas pontas é desenhada', async () => {
      // Ponta que falta não é erro: é o grafo mostrado pela metade, que é como
      // se revela um fluxo aos poucos.
      const expected = args.withEdges
        ? FLOW_EDGES_ORDER.filter((e) => ids.has(e.from) && ids.has(e.to))
        : [];
      const paths = root.querySelectorAll('[data-slot="flow-graph-edge"]');
      await expect(paths.length).toBe(expected.length);
      // E o desenho é IGUAL em todas: sem contador de revelação não existe
      // "ligação adiante", que era a única razão do segundo tom de traço.
      const distinct = new Set([...paths].map((p) => p.getAttribute('vector-effect')));
      await expect([...distinct]).toEqual(paths.length > 0 ? ['non-scaling-stroke'] : []);
    });

    await step('Cada nó diz o estado em palavra, e de quem depende', async () => {
      // É a leitura do grafo, e é o que chega a quem não vê a curva. Só as
      // ligações que CHEGAM: cada uma é dita exatamente uma vez.
      const nodes = [...root.querySelectorAll<HTMLElement>('[data-slot="flow-graph-node"]')];
      for (const [index, element] of nodes.entries()) {
        const declared = visible[index];
        const reading = element.querySelector<HTMLElement>(
          '[data-slot="flow-graph-node-reading"]',
        )!;
        await expect(reading.textContent).toContain(labels.state[declared.state]);
        await expect(reading.classList.contains('nds-sr-only')).toBe(true);

        const sources = args.withEdges
          ? FLOW_EDGES_ORDER.filter((e) => e.to === declared.id && ids.has(e.from))
          : [];
        if (sources.length === 0) {
          await expect(reading.textContent).not.toContain(labels.dependsOn.split('{')[0].trim());
          continue;
        }
        for (const source of sources) {
          const sourceLabel = FLOW_NODES_ORDER.find((n) => n.id === source.from)!.label;
          await expect(reading.textContent).toContain(sourceLabel);
        }
      }
    });

    await step('A camada que rola tem papel, nome e parada de teclado', async () => {
      // O par completo: `tabindex` sem papel deixaria uma parada anônima, e
      // `aria-label` sobre um elemento sem papel é descartado pelo navegador.
      const viewport = root.querySelector<HTMLElement>('[data-slot="flow-graph-viewport"]')!;
      await expect(viewport.getAttribute('role')).toBe('group');
      await expect(viewport.getAttribute('aria-label')).toBe(labels.region);
      await expect(viewport.tabIndex).toBe(0);
      // E é a ÚNICA parada: um nó não faz nada, e uma dúzia de paradas que não
      // levam a lugar nenhum é ruído para quem usa teclado.
      const focusable = root.querySelectorAll('[tabindex]');
      await expect(focusable.length).toBe(1);
    });

    await step('O desenho das ligações fica fora do que é lido em voz', async () => {
      const svg = root.querySelector('[data-slot="flow-graph-edges"]')!;
      await expect(svg.getAttribute('aria-hidden')).toBe('true');
      await expect(svg.getAttribute('focusable')).toBe('false');
    });

    await step('Os nós são uma lista ordenada', async () => {
      const list = root.querySelector<HTMLElement>('[data-slot="flow-graph-nodes"]')!;
      await expect(list.tagName).toBe('OL');
    });

    await step('A peça se declara ocupada só enquanto a execução corre', async () => {
      // Nada aqui é região viva: um fluxo troca de nó mais depressa do que se
      // lê, e narrar cada troca é a mesma armadilha do relógio ao vivo.
      await expect(root.getAttribute('aria-busy')).toBe(
        args.status === 'running' ? 'true' : null,
      );
      const liveRegions = root.querySelectorAll(
        '[role="status"], [role="alert"], [role="log"], [aria-live]',
      );
      await expect([...liveRegions]).toEqual([]);
    });
  },
};
