import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { computed } from 'vue';
import { expect, fn } from 'storybook/test';
import { ToolGroup } from './index';
import { toolGroupLabels, useToolGroupLabels } from './tool-group.fixtures';
import { toolGroupSource } from './tool-group.source';
import { TOOL_CALLS_WITH_FAILURE } from '@shared/primitives/tool-group-examples';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import ToolGroupDocs from '@/components/docs/ToolGroupDocs.vue';

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onOpenChange = fn();

/**
 * Os dois eixos do grupo, numa caixa só.
 *
 * A caixa começa fechada ou aberta, e cada chamada traz ou não o detalhe. A
 * grade dos quatro estados mora em `States`; aqui o assunto é o que muda quando
 * se mexe em cada eixo.
 */
type PlaygroundArgs = {
  open: boolean;
  detail: boolean;
};

const meta: Meta<PlaygroundArgs> = {
  title: 'Components/Conversational/ToolGroup',
  tags: ['autodocs', 'conversational'],
  parameters: {
    layout: 'padded',
    actions: { disable: true },
    docs: {
      page: withAutoDocsTab(ToolGroupDocs),
      source: { transform: toolGroupSource },
    },
  },
  argTypes: {
    open: {
      control: 'boolean',
      description:
        'A caixa começa aberta. O padrão é fechada: são detalhes de execução, e não a resposta.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    detail: {
      control: 'boolean',
      description:
        'Cada chamada traz o detalhe — argumento, resultado ou motivo da falha, o que couber ao estado.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: '—' } },
    },
  },
  args: {
    open: false,
    detail: true,
  },
};

export default meta;
type Story = StoryObj<PlaygroundArgs>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item7',
      'accessibility.item3', 'accessibility.item5',
      'visual.item1',
    ],
  },
  render: (args) => ({
    components: { ToolGroup },
    setup() {
      // Os rótulos saem de um composable, então o render passa por um `setup`.
      return {
        args,
        labels: useToolGroupLabels(),
        // O detalhe é campo de cada chamada, e não opção do grupo: o control
        // troca a LISTA, que é o que ele de fato muda.
        calls: computed(() =>
          args.detail
            ? TOOL_CALLS_WITH_FAILURE
            : TOOL_CALLS_WITH_FAILURE.map((call) => ({
                id: call.id,
                name: call.name,
                state: call.state,
              })),
        ),
        onOpenChange,
      };
    },
    template: `<ToolGroup
      :calls="calls"
      :labels="labels"
      :open="args.open"
      @open-change="onOpenChange"
    />`,
  }),
  play: async ({ canvasElement, step, args }) => {
    const root = canvasElement.querySelector<HTMLDetailsElement>('[data-slot="tool-group"]')!;
    const list = root.querySelector<HTMLElement>('[data-slot="tool-group-list"]')!;
    const rotulos = toolGroupLabels();

    await step('A caixa começa como pediram, e fechada é o padrão', async () => {
      // Detalhes de execução não são a resposta. Quem quiser conferir abre.
      await expect(root.open).toBe(args.open);
      if (!args.open) {
        // A lista não desenha nada com a caixa fechada — quem esconde é o
        // navegador, e é justamente por isso que a peça é um `<details>`.
        //
        // A CONTAGEM DE RETÂNGULOS NÃO MEDE ISSO, e deixou de medir sem avisar:
        // o `<details>` fechado passou a esconder o conteúdo por
        // `content-visibility: hidden` no `::details-content`, e essa
        // propriedade PRESERVA a caixa — pula a pintura, não o layout. A lista
        // seguia invisível na tela e a contagem virou 1.
        //
        // `checkVisibility()` é a pergunta certa: ela responde "isto está sendo
        // renderizado?", e responde não para subárvore pulada, para
        // `display: none` e para `visibility: hidden` — as três formas pelas
        // quais uma engine pode fechar a caixa.
        await expect(list.checkVisibility()).toBe(false);
      }
    });

    await step('O resumo traz a contagem e a palavra do conjunto', async () => {
      const title = root.querySelector<HTMLElement>('[data-slot="tool-group-title"]')!;
      const state = root.querySelector<HTMLElement>('[data-slot="tool-group-state"]')!;
      const total = root.querySelectorAll('[data-slot="tool-call"]').length;
      await expect(title.textContent).toBe(rotulos.title(total));
      // Há uma falha na lista de exemplo, e o resumo diz isso mesmo fechado.
      await expect(state.textContent).toBe(rotulos.summary.failed);
    });

    await step('O grupo NÃO é região viva', async () => {
      // As chamadas chegam enquanto a resposta é gerada logo abaixo, e anunciar
      // cada uma corta a leitura do que importa (decisão 3 da folha). Quem
      // quiser anunciar põe a região por fora.
      await expect(root.hasAttribute('aria-live')).toBe(false);
      await expect(root.querySelector('[aria-live]')).toBeNull();
      await expect(root.querySelector('[role="status"], [role="alert"], [role="log"]')).toBeNull();
    });

    await step('Nenhum atributo de expansão é escrito à mão', async () => {
      // O resumo de um bloco que abre e fecha já anuncia sozinho em que estado
      // está. Escrever o atributo por cima é uma segunda fonte de verdade, e
      // uma delas fica para trás.
      await expect(root.querySelector('[aria-expanded]')).toBeNull();
    });

    await step('O alvo de toque do resumo tem pelo menos vinte e quatro pixels', async () => {
      // WCAG 2.5.8. O resumo é o botão inteiro, e é a linha mais estreita da
      // peça — onde a tentação de encolher é maior.
      const summary = root.querySelector<HTMLElement>('[data-slot="tool-group-summary"]')!;
      const box = summary.getBoundingClientRect();
      await expect(box.height).toBeGreaterThanOrEqual(24);
      await expect(box.width).toBeGreaterThanOrEqual(24);
    });

    await step('O detalhe aparece na linha da chamada, abaixo do nome', async () => {
      const item = root.querySelector<HTMLElement>('[data-slot="tool-call"]')!;
      const detail = item.querySelector<HTMLElement>('[data-slot="tool-call-detail"]');
      if (!args.detail) {
        // Sem detalhe não há parágrafo: um `<p>` vazio abriria um vão na grade
        // que se parece com defeito de espaçamento.
        await expect(detail).toBeNull();
        return;
      }
      const name = item.querySelector<HTMLElement>('[data-slot="tool-call-name"]')!;
      await expect(detail!.textContent?.trim()).toBe(TOOL_CALLS_WITH_FAILURE[0]!.detail);
      await expect(
        name.compareDocumentPosition(detail!) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });
  },
};
