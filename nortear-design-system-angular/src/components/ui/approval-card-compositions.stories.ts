import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { NdsApprovalCard } from './approval-card';
import { NdsToolGroup } from './tool-group';
import { NdsButton } from './button';
import {
  approvalAsideLabel,
  approvalChoices,
  approvalQuestion,
  approvalScope,
  approvalScopeOfWaiting,
  approvalWaitingQuestion,
} from './approval-card.fixtures';
import { toolGroupLabels } from './tool-group.fixtures';
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

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Onde o cartão mora em relação à caixa recolhida de onde ele saiu, e o que
// acontece quando alguém aperta um controle — que, do lado de cá, é só um aviso.

const meta: Meta = {
  title: 'Components/Conversational/ApprovalCard/Compositions',
  tags: ['conversational'],
  decorators: [moduleMetadata({ imports: [NdsApprovalCard, NdsToolGroup, NdsButton] })],
  // Sem argTypes nem callbacks: sem isto os painéis Controls e Actions abrem vazios.
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
 * fechada é pedir sem mostrar. A separação vem do vocabulário compartilhado, e é
 * feita aqui — um componente que filtrasse sozinho apagaria da tela um dado que
 * recebeu.
 */
export const OutsideTheGroup: Story = {
  parameters: {
    covers: ['functional.item8', 'visual.item6'],
    docs: { source: { transform: approvalCardOutsideTheGroupSource } },
  },
  render: () => {
    const { grouped, waiting } = splitWaitingCalls([
      TOOL_CALL_WAITING,
      ...TOOL_CALLS_WITH_FAILURE,
    ]);

    return {
      props: {
        // Quem monta o alcance é quem consome: a peça receberia o vocabulário de
        // outra e passaria a conhecer as duas.
        cards: waiting.map((call) => ({
          question: approvalWaitingQuestion(),
          scope: approvalScopeOfWaiting(call),
        })),
        grouped,
        choices: approvalChoices(),
        groupLabels: toolGroupLabels(),
        onChoose,
      },
      template: `
        <ng-template #choiceControls>
          @for (choice of choices; track choice.value) {
            <button
              ndsButton
              type="button"
              variant="outline"
              size="sm"
              [attr.data-approval-choice]="choice.value"
            >{{ choice.label }}</button>
          }
        </ng-template>

        <div class="nds-stack nds-max-w-lg" data-spacing="sm">
          @for (card of cards; track $index) {
            <div
              ndsApprovalCard
              [question]="card.question"
              [scope]="card.scope"
              [actions]="[choiceControls]"
              (choose)="onChoose($event)"
            ></div>
          }

          <details ndsToolGroup [calls]="grouped" [labels]="groupLabels"></details>
        </div>
      `,
    };
  },
  play: async ({ canvasElement, step }) => {
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="approval-card"]')!;
    const group = canvasElement.querySelector<HTMLDetailsElement>('[data-slot="tool-group"]')!;

    await step('A que espera por uma pessoa virou um cartão, e ele está À VISTA', async () => {
      await expect(group.contains(card)).toBe(false);
      await expect(card.querySelector('[data-slot="approval-card-question"]')?.textContent).toBe(
        approvalWaitingQuestion(),
      );
    });

    await step('O alcance dele carrega o que a execução dizia', async () => {
      // Quem faz essa tradução é quem consome: a peça receberia o vocabulário de
      // outra e passaria a conhecer as duas.
      const details = [
        ...card.querySelectorAll<HTMLElement>('[data-slot="approval-card-scope-detail"]'),
      ].map((el) => el.textContent);
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
    props: {
      question: approvalQuestion('publish'),
      scope: approvalScope('publish'),
      answer: approvalChoices([APPROVAL_CHOICE_ALLOW_ONCE])[0]!,
      asideLabel: approvalAsideLabel(),
      onChoose,
    },
    template: `
      <ng-template #answerControl>
        <button
          ndsButton
          type="button"
          variant="outline"
          size="sm"
          [attr.data-approval-choice]="answer.value"
        >{{ answer.label }}</button>
      </ng-template>

      <ng-template #asideControl>
        <button ndsButton type="button" variant="ghost" size="sm">{{ asideLabel }}</button>
      </ng-template>

      <div
        ndsApprovalCard
        class="nds-max-w-md"
        [question]="question"
        [scope]="scope"
        [actions]="[answerControl, asideControl]"
        (choose)="onChoose($event)"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="approval-card"]')!;
    const actions = card.querySelector<HTMLElement>('[data-slot="approval-card-actions"]')!;
    const answer = actions.querySelector<HTMLButtonElement>('[data-approval-choice]')!;
    const aside = [...actions.querySelectorAll<HTMLButtonElement>('button')].find(
      (control) => !control.hasAttribute('data-approval-choice'),
    )!;

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
      await expect(card.querySelector('[data-slot="approval-card-question"]')?.textContent).toBe(
        approvalQuestion('publish'),
      );
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
