import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { splitWaitingCalls } from '@shared/primitives/tool-group-summary';
import {
  TOOL_CALL_WAITING,
  TOOL_CALLS_WITH_FAILURE,
} from '@shared/primitives/tool-group-examples';
import { NdsToolGroup } from './tool-group';
import { toolGroupLabels } from './tool-group.fixtures';
import {
  toolGroupBeforeAnswerSource,
  toolGroupTogglingSource,
  toolGroupWaitingOutsideSource,
} from './tool-group.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Onde o grupo mora em relação à resposta, o que sai dele quando alguém abre, e
// o que NÃO pode morar dentro dele.

const meta: Meta = {
  title: 'Components/Conversational/ToolGroup/Compositions',
  tags: ['conversational'],
  decorators: [moduleMetadata({ imports: [NdsToolGroup] })],
  // Sem argTypes nem callbacks: sem isto os painéis Controls e Actions abrem vazios.
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: toolGroupBeforeAnswerSource },
      description: {
        component:
          'O grupo fica junto da resposta sem competir com ela, e a chamada que espera por uma pessoa fica fora da caixa recolhida.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onOpenChange = fn();

const groupOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLDetailsElement>('[data-slot="tool-group"]')!;

/**
 * O grupo antes da resposta.
 *
 * As chamadas chegam enquanto o texto é gerado logo abaixo — e é por isso que a
 * caixa não anuncia nada: um aviso por chamada cortaria a leitura do que
 * importa.
 */
export const BeforeAnswer: Story = {
  render: () => ({
    props: {
      calls: TOOL_CALLS_WITH_FAILURE,
      labels: toolGroupLabels(),
      answer:
        'Não publiquei o relatório: o destino recusou por falta de permissão de escrita.',
    },
    template: `
      <div class="nds-stack nds-max-w-lg" data-spacing="sm">
        <details ndsToolGroup [calls]="calls" [labels]="labels"></details>
        <p>{{ answer }}</p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const group = groupOf(canvasElement);
    // Filho direto da pilha: o único `<p>` de lá. Os detalhes das chamadas
    // também são `<p>`, mas moram dentro do grupo.
    const answer = canvasElement.querySelector('.nds-stack > p')!;

    await step('O grupo vem ANTES da resposta na ordem de leitura', async () => {
      await expect(
        group.compareDocumentPosition(answer) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    await step('E a resposta fica FORA da caixa', async () => {
      // Dentro dela, a resposta viraria detalhe de execução — e sumiria junto
      // com o resto quando alguém fechasse o grupo.
      await expect(group.contains(answer)).toBe(false);
    });

    await step('Nada aqui se anuncia sozinho', async () => {
      await expect(group.hasAttribute('aria-live')).toBe(false);
      await expect(group.querySelector('[aria-live]')).toBeNull();
    });
  },
};

/** Abrir e fechar, e o aviso que sai das duas vezes. */
export const Toggling: Story = {
  parameters: {
    covers: ['functional.item2', 'accessibility.item4'],
    docs: { source: { transform: toolGroupTogglingSource } },
  },
  render: () => ({
    props: {
      calls: TOOL_CALLS_WITH_FAILURE,
      labels: toolGroupLabels(),
      onOpenChange,
    },
    template: `
      <details
        ndsToolGroup
        [calls]="calls"
        [labels]="labels"
        (openChange)="onOpenChange($event)"
      ></details>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const group = groupOf(canvasElement);
    const summary = group.querySelector<HTMLElement>('[data-slot="tool-group-summary"]')!;

    await step('O resumo é o controle, e chega pelo teclado sem ARIA à mão', async () => {
      // O navegador já dá o botão e o estado de expansão. Escrever
      // `aria-expanded` por cima é uma segunda fonte de verdade, e uma delas
      // fica para trás na primeira vez que alguém abrir de outro jeito.
      await expect(group.querySelector('[aria-expanded]')).toBeNull();
      summary.focus();
      await expect(canvasElement.ownerDocument.activeElement).toBe(summary);
    });

    await step('Abrir avisa quem consome, com o novo estado junto', async () => {
      onOpenChange.mockClear();
      await userEvent.click(summary);
      // Leitura pura dentro da espera: o evento do elemento é assíncrono, e
      // quem toca no DOM aqui dentro reagenda a si mesmo até o prazo nunca
      // chegar.
      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(true));
      await expect(group.open).toBe(true);
    });

    await step('E fechar avisa de novo, com o estado contrário', async () => {
      onOpenChange.mockClear();
      await userEvent.click(summary);
      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
      await expect(group.open).toBe(false);
    });
  },
};

/**
 * A chamada que espera por uma pessoa, fora da caixa recolhida.
 *
 * Quem separa é quem CONSOME, e a conta vem do vocabulário compartilhado. Um
 * componente que filtrasse sozinho apagaria da tela um dado que recebeu.
 */
export const WaitingOutside: Story = {
  parameters: {
    covers: ['functional.item8', 'accessibility.item6', 'visual.item6'],
    docs: { source: { transform: toolGroupWaitingOutsideSource } },
  },
  render: () => {
    const { grouped, waiting } = splitWaitingCalls([
      TOOL_CALL_WAITING,
      ...TOOL_CALLS_WITH_FAILURE,
    ]);
    return {
      props: { grouped, waiting, labels: toolGroupLabels() },
      // À vista e aberta: pedir autorização dentro de uma caixa fechada é pedir
      // sem mostrar.
      template: `
        <div class="nds-stack nds-max-w-lg" data-spacing="sm">
          <details
            ndsToolGroup
            [calls]="waiting"
            [labels]="labels"
            [open]="true"
          ></details>
          <details ndsToolGroup [calls]="grouped" [labels]="labels"></details>
        </div>
      `,
    };
  },
  play: async ({ canvasElement, step }) => {
    const groups = [
      ...canvasElement.querySelectorAll<HTMLDetailsElement>('[data-slot="tool-group"]'),
    ];
    const inSight = groups[0]!;
    const collapsed = groups[1]!;
    const labels = toolGroupLabels();

    await step('A que espera por uma pessoa está À VISTA, e sozinha', async () => {
      await expect(inSight.open).toBe(true);
      const items = [...inSight.querySelectorAll<HTMLElement>('[data-slot="tool-call"]')];
      await expect(items).toHaveLength(1);
      await expect(items[0]!.dataset.state).toBe('pending');
      // Pela CLASSE: `data-slot` no host do `ndsBadge` disputa com o estático
      // que o template escreve (§8 do RULES.md).
      await expect(inSight.querySelector('.nds-tool-group-state')?.textContent).toBe(
        labels.summary.pending,
      );
    });

    await step('E NÃO está dentro da caixa recolhida', async () => {
      await expect(collapsed.open).toBe(false);
      await expect(
        collapsed.querySelector('[data-slot="tool-call"][data-state="pending"]'),
      ).toBeNull();
    });

    await step('O que sobrou segue no grupo, na ordem em que aconteceu', async () => {
      // A separação tira só quem espera; ela não reordena nem descarta nada.
      const names = [
        ...collapsed.querySelectorAll<HTMLElement>('[data-slot="tool-call-name"]'),
      ].map((el) => el.textContent);
      await expect(names).toEqual(TOOL_CALLS_WITH_FAILURE.map((call) => call.name));
    });
  },
};
