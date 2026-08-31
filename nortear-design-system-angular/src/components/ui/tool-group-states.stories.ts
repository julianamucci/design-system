import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { TOOL_CALL_STATES, type ChatToolCall } from '@shared/primitives/chat-protocol';
import {
  TOOL_CALLS_ALL_DONE,
  TOOL_CALLS_RUNNING,
  TOOL_CALLS_WITH_FAILURE,
} from '@shared/primitives/tool-group-examples';
import { NdsToolGroup } from './tool-group';
import { toolGroupLabels } from './tool-group.fixtures';
import {
  toolGroupDoneSource,
  toolGroupEveryStateSource,
  toolGroupFailedSource,
  toolGroupRunningSource,
} from './tool-group.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os quatro estados de uma chamada, e o que cada conjunto faz o resumo dizer.
// Não há eixo de forma nesta peça: a caixa é sempre a mesma, e o que muda é o
// que aconteceu dentro dela.

const meta: Meta = {
  title: 'Primitives/Conversational/ToolGroup/States',
  tags: ['conversational'],
  decorators: [moduleMetadata({ imports: [NdsToolGroup] })],
  // Sem argTypes nem callbacks: sem isto os painéis Controls e Actions abrem vazios.
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: toolGroupEveryStateSource },
      description: {
        component:
          'O estado de cada chamada é palavra na etiqueta, e o resumo diz o que há dentro sem que ninguém precise abrir.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const mount = (calls: ChatToolCall[], open = false) => ({
  props: { calls, labels: toolGroupLabels(), open },
  template: `
    <details
      ndsToolGroup
      [calls]="calls"
      [labels]="labels"
      [open]="open"
    ></details>
  `,
});

const groupOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLDetailsElement>('[data-slot="tool-group"]')!;

// Pela CLASSE, e não pelo `data-slot`: o `ndsBadge` liga `data-slot` por host
// binding, e o atributo estático do template disputa com ele (§8 do RULES.md).
const summaryStateOf = (group: HTMLElement) =>
  group.querySelector<HTMLElement>('.nds-tool-group-state')!;

/**
 * Os quatro, um abaixo do outro, com a caixa aberta.
 *
 * A lista sai de `TOOL_CALL_STATES`, e não de quatro linhas escritas à mão:
 * estado novo no vocabulário compartilhado entra nesta story sozinho, que é
 * exatamente o que aquela constante existe para garantir.
 */
export const EveryState: Story = {
  parameters: {
    covers: ['functional.item3', 'accessibility.item1', 'visual.item2'],
  },
  render: () =>
    mount(
      TOOL_CALL_STATES.map((state) => ({ id: state, name: `ferramenta_${state}`, state })),
      true,
    ),
  play: async ({ canvasElement, step }) => {
    const group = groupOf(canvasElement);
    const items = [...group.querySelectorAll<HTMLElement>('[data-slot="tool-call"]')];
    const labels = toolGroupLabels();

    await step('Há uma linha por estado, na ordem do vocabulário', async () => {
      await expect(items).toHaveLength(TOOL_CALL_STATES.length);
      await expect(items.map((el) => el.dataset.state)).toEqual([...TOOL_CALL_STATES]);
    });

    await step('Cada uma traz a PALAVRA daquele estado, e não só a cor', async () => {
      // Cor sozinha não descreve estado (WCAG 1.4.1). A etiqueta carrega a
      // palavra; a variante da cor é reforço, e some para quem não a percebe.
      for (const [index, state] of TOOL_CALL_STATES.entries()) {
        const badge = items[index]!.querySelector<HTMLElement>('[data-slot="tool-call-state"]')!;
        await expect(badge.textContent).toBe(labels.call[state]);
        await expect(badge.classList.contains('nds-badge')).toBe(true);
      }
    });

    await step('E as quatro palavras são DIFERENTES entre si', async () => {
      // Dois estados com a mesma palavra colapsariam em um só para quem lê, e o
      // teste acima continuaria passando.
      const words = TOOL_CALL_STATES.map((state) => labels.call[state]);
      await expect(new Set(words).size).toBe(TOOL_CALL_STATES.length);
    });

    await step('Com uma falha na lista, o resumo fala da falha', async () => {
      // A precedência vem do vocabulário compartilhado, e não de uma condição
      // da tela: a falha vence tudo, porque é ela que não pode ficar escondida.
      await expect(summaryStateOf(group).textContent).toBe(labels.summary.failed);
    });
  },
};

export const Failed: Story = {
  parameters: {
    covers: ['functional.item4', 'accessibility.item2', 'visual.item3'],
    docs: { source: { transform: toolGroupFailedSource } },
  },
  render: () => mount(TOOL_CALLS_WITH_FAILURE),
  play: async ({ canvasElement, step }) => {
    const group = groupOf(canvasElement);
    const labels = toolGroupLabels();

    await step('A caixa continua fechada, e o resumo já diz que algo falhou', async () => {
      // É a decisão inteira da peça: grupo fechado que esconde uma falha é uma
      // falha que ninguém vê. A saída não é forçar a abertura, que brigaria com
      // quem acabou de fechar — é o resumo DIZER.
      await expect(group.open).toBe(false);
      await expect(summaryStateOf(group).textContent).toBe(labels.summary.failed);
    });

    await step('E a falha está escrita, não só colorida', async () => {
      const badge = summaryStateOf(group);
      await expect(badge.textContent?.trim().length).toBeGreaterThan(0);
      await expect(badge.textContent).not.toBe(labels.summary.done);
    });

    await step('A linha que falhou traz o motivo no detalhe', async () => {
      const item = group.querySelector<HTMLElement>('[data-slot="tool-call"][data-state="failed"]')!;
      const detail = item.querySelector<HTMLElement>('[data-slot="tool-call-detail"]')!;
      await expect(detail.textContent?.trim().length).toBeGreaterThan(0);
    });
  },
};

export const Done: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item4'],
    docs: { source: { transform: toolGroupDoneSource } },
  },
  render: () => mount(TOOL_CALLS_ALL_DONE),
  play: async ({ canvasElement, step }) => {
    const group = groupOf(canvasElement);
    const labels = toolGroupLabels();

    await step('Com tudo terminado, o resumo não pede atenção', async () => {
      await expect(summaryStateOf(group).textContent).toBe(labels.summary.done);
    });

    await step('E nenhuma linha aparece em erro', async () => {
      await expect(group.querySelector('[data-slot="tool-call"][data-state="failed"]')).toBeNull();
    });
  },
};

export const Running: Story = {
  parameters: {
    covers: ['functional.item6', 'visual.item5'],
    docs: { source: { transform: toolGroupRunningSource } },
  },
  render: () => mount(TOOL_CALLS_RUNNING),
  play: async ({ canvasElement, step }) => {
    const group = groupOf(canvasElement);
    const labels = toolGroupLabels();

    await step('Algo ainda corre, e o resumo não diz que terminou', async () => {
      // Grupo em que uma chamada ainda corre não terminou, por mais que quase
      // tudo já tenha terminado.
      await expect(summaryStateOf(group).textContent).toBe(labels.summary.running);
      await expect(summaryStateOf(group).textContent).not.toBe(labels.summary.done);
    });
  },
};
