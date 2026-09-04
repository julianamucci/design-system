import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { computed } from 'vue';
import { expect, fn, userEvent } from 'storybook/test';
import { ApprovalCard } from './index';
import { ToolGroup } from '@/components/ui/tool-group';
import { Button } from '@/components/ui/button';
import { useToolGroupLabels } from '@/components/ui/tool-group/tool-group.fixtures';
import {
  approvalCardLabels,
  approvalChoicesOf,
  approvalScopeOf,
  approvalScopeOfWaiting,
  useApprovalCardLabels,
} from './approval-card.fixtures';
import {
  approvalCardAnsweringSource,
  approvalCardOutsideTheGroupSource,
} from './approval-card.source';
import { splitWaitingCalls } from '@shared/primitives/tool-group-summary';
import {
  TOOL_CALL_WAITING,
  TOOL_CALLS_WITH_FAILURE,
} from '@shared/primitives/tool-group-examples';
import { APPROVAL_CHOICE_ALLOW_ONCE } from '@shared/primitives/approval-card-examples';
import type { ChatToolCall } from '@shared/primitives/chat-protocol';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Onde o cartão mora em relação à caixa recolhida de onde ele saiu, e o que
// acontece quando alguém aperta um controle — que, do lado de cá, é só um
// aviso.

const meta: Meta = {
  title: 'Components/Conversational/ApprovalCard/Compositions',
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: approvalCardOutsideTheGroupSource },
      description: {
        component:
          'A execução que espera por uma pessoa sai da caixa recolhida e vira este cartão; quem separa é quem consome, e quem decide o que a escolha significa também.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onChoose = fn();

/**
 * A execução que espera por uma pessoa, FORA da caixa recolhida.
 *
 * É o outro lado da decisão do grupo: pedir autorização dentro de uma caixa
 * fechada é pedir sem mostrar. A separação vem do vocabulário compartilhado, e
 * é feita aqui — um componente que filtrasse sozinho apagaria da tela um dado
 * que recebeu.
 */
export const OutsideTheGroup: Story = {
  parameters: {
    covers: ['functional.item8', 'visual.item6'],
    docs: { source: { transform: approvalCardOutsideTheGroupSource } },
  },
  render: () => ({
    components: { ApprovalCard, ToolGroup, Button },
    setup() {
      const labels = useApprovalCardLabels();
      const { grouped, waiting } = splitWaitingCalls([
        TOOL_CALL_WAITING,
        ...TOOL_CALLS_WITH_FAILURE,
      ]);

      return {
        grouped,
        waiting,
        question: computed(() => labels.value.question.grant),
        // Quem monta o alcance da execução é QUEM CONSOME: a peça receberia o
        // vocabulário de outra e passaria a conhecer as duas.
        scopeOfWaiting: (call: ChatToolCall) => approvalScopeOfWaiting(labels.value, call),
        choices: computed(() => approvalChoicesOf(labels.value)),
        groupLabels: useToolGroupLabels(),
        onChoose,
      };
    },
    // O cartão vem ANTES do grupo: sem a resposta, nada mais acontece.
    template: `<div class="nds-stack nds-max-w-lg" data-spacing="sm">
      <ApprovalCard
        v-for="call in waiting"
        :key="call.id"
        :question="question"
        :scope="scopeOfWaiting(call)"
        @choose="onChoose"
      >
        <template #actions>
          <Button
            v-for="choice in choices"
            :key="choice.value"
            variant="outline"
            size="sm"
            :data-approval-choice="choice.value"
          >{{ choice.label }}</Button>
        </template>
      </ApprovalCard>
      <ToolGroup
        :calls="grouped"
        :labels="groupLabels"
      />
    </div>`,
  }),
  play: async ({ canvasElement, step }) => {
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="approval-card"]')!;
    const group = canvasElement.querySelector<HTMLDetailsElement>('[data-slot="tool-group"]')!;
    const labels = approvalCardLabels();

    await step('A que espera por uma pessoa virou um cartão, e ele está À VISTA', async () => {
      await expect(group.contains(card)).toBe(false);
      // `trim`, e em toda leitura de texto desta peça: o texto de bloco desta
      // stack nasce entre quebras de linha, e o que se compara é a palavra.
      await expect(
        card.querySelector('[data-slot="approval-card-question"]')?.textContent?.trim(),
      ).toBe(labels.question.grant);
    });

    await step('O alcance dele carrega o que a execução dizia', async () => {
      // Quem faz essa tradução é quem consome: a peça receberia um dado do
      // vocabulário de outra e passaria a conhecer as duas.
      const details = [
        ...card.querySelectorAll<HTMLElement>('[data-slot="approval-card-scope-detail"]'),
      ].map((el) => el.textContent?.trim());
      await expect(details).toContain(TOOL_CALL_WAITING.name);
      await expect(details).toContain(TOOL_CALL_WAITING.detail);
    });

    await step('E a caixa recolhida continua fechada, sem ela dentro', async () => {
      await expect(group.open).toBe(false);
      await expect(group.querySelector('[data-slot="tool-call"][data-state="pending"]')).toBeNull();
    });

    await step('O que sobrou segue no grupo, na ordem em que aconteceu', async () => {
      // A separação tira só quem espera; ela não reordena nem descarta nada.
      const names = [...group.querySelectorAll<HTMLElement>('[data-slot="tool-call-name"]')].map(
        (el) => el.textContent,
      );
      await expect(names).toEqual(TOOL_CALLS_WITH_FAILURE.map((call) => call.name));
    });

    await step('O cartão vem ANTES do grupo na ordem de leitura', async () => {
      // Sem a resposta, nada mais acontece — então ela é a primeira coisa que
      // quem percorre a tela encontra.
      await expect(
        card.compareDocumentPosition(group) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });
  },
};

/**
 * Quem responde, e quem só estava ali.
 *
 * O atributo é o único pedaço do contrato que atravessa a fronteira do que a
 * peça desenha. Controle que não o traz não é resposta, e o cartão não inventa
 * uma escolha que ninguém marcou.
 */
export const Answering: Story = {
  parameters: {
    covers: ['functional.item5', 'functional.item6', 'accessibility.item6'],
    docs: { source: { transform: approvalCardAnsweringSource } },
  },
  render: () => ({
    components: { ApprovalCard, Button },
    setup() {
      const labels = useApprovalCardLabels();
      return {
        question: computed(() => labels.value.question.publish),
        scope: computed(() => approvalScopeOf(labels.value, 'publish')),
        choices: computed(() => approvalChoicesOf(labels.value, [APPROVAL_CHOICE_ALLOW_ONCE])),
        // O controle que NÃO se declara resposta. Ele prova a fronteira no
        // outro sentido: o cartão não relata escolha nenhuma por causa dele.
        learnMore: computed(() => labels.value.learnMore),
        onChoose,
      };
    },
    template: `<ApprovalCard
      :question="question"
      :scope="scope"
      class="nds-max-w-md"
      @choose="onChoose"
    >
      <template #actions>
        <Button
          v-for="choice in choices"
          :key="choice.value"
          variant="outline"
          size="sm"
          :data-approval-choice="choice.value"
        >{{ choice.label }}</Button>
        <Button
          variant="ghost"
          size="sm"
        >{{ learnMore }}</Button>
      </template>
    </ApprovalCard>`,
  }),
  play: async ({ canvasElement, step }) => {
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="approval-card"]')!;
    const actions = card.querySelector<HTMLElement>('[data-slot="approval-card-actions"]')!;
    const answer = actions.querySelector<HTMLButtonElement>('[data-approval-choice]')!;
    const aside = [...actions.querySelectorAll<HTMLButtonElement>('button')].find(
      (control) => !control.hasAttribute('data-approval-choice'),
    )!;
    const labels = approvalCardLabels();

    await step('Cada controle tem pelo menos vinte e quatro pixels de alvo', async () => {
      // WCAG 2.5.8. A folha dá o lugar e o afastamento; o tamanho vem de cada
      // controle, e é aqui que se confere que ele chegou.
      for (const control of [answer, aside]) {
        const box = control.getBoundingClientRect();
        await expect(box.width).toBeGreaterThanOrEqual(24);
        await expect(box.height).toBeGreaterThanOrEqual(24);
      }
    });

    await step('Acionar quem se declara resposta avisa QUAL foi a escolha', async () => {
      onChoose.mockClear();
      await userEvent.click(answer);
      await expect(onChoose).toHaveBeenCalledTimes(1);
      await expect(onChoose).toHaveBeenCalledWith(APPROVAL_CHOICE_ALLOW_ONCE);
    });

    await step('E o cartão continua como estava — ele não decide o que aquilo significa', async () => {
      // O que acontece ao recusar, se a escolha vale para as próximas e o que
      // uma autorização permanente abrange são decisões de produto. A peça
      // relata e para aí.
      await expect(
        card.querySelector('[data-slot="approval-card-question"]')?.textContent?.trim(),
      ).toBe(labels.question.publish);
      await expect(answer.disabled).toBe(false);
      await expect(actions.querySelectorAll('button')).toHaveLength(2);
    });

    await step('Acionar quem NÃO se declara resposta não relata nada', async () => {
      onChoose.mockClear();
      await userEvent.click(aside);
      await expect(onChoose).not.toHaveBeenCalled();
    });
  },
};
