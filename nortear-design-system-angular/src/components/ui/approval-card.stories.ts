import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn } from 'storybook/test';
import { NdsApprovalCard } from './approval-card';
import { NdsButton } from './button';
import {
  approvalChoices,
  approvalQuestion,
  approvalScope,
  APPROVAL_EXAMPLE_NAMES,
  type ApprovalExampleName,
} from './approval-card.fixtures';
import { approvalCardSource } from './approval-card.source';
import { NdsApprovalCardDocs } from '@/components/docs/ApprovalCardDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os dois eixos do cartão, num cartão só.
//
// A pergunta e o alcance são INDEPENDENTES de propósito: quem escreve a pergunta
// é quem consome, e uma peça que a compusesse a partir do alcance produziria uma
// frase que ninguém faria. A grade das formas mora em `States`; aqui o assunto é
// o que muda quando se mexe em cada eixo.

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onChoose = fn();

type PlaygroundArgs = {
  question: string;
  scope: ApprovalExampleName | 'none';
};

const SCOPE_OPTIONS = [...APPROVAL_EXAMPLE_NAMES, 'none'] as const;

const meta: Meta<PlaygroundArgs> = {
  title: 'Components/Conversational/ApprovalCard',
  tags: ['autodocs', 'conversational'],
  decorators: [moduleMetadata({ imports: [NdsApprovalCard, NdsButton] })],
  parameters: {
    layout: 'padded',
    actions: { disable: true },
    docs: {
      page: withAutoDocsTab(NdsApprovalCardDocs),
      // O renderer desta stack imprime o `template` da story com os bindings
      // apontando para `props` que só existem aqui. A transform devolve o uso
      // real: um componente que declara os controles e trata a escolha.
      source: { transform: approvalCardSource },
    },
  },
  argTypes: {
    question: {
      control: 'text',
      description:
        'A pergunta que precisa de resposta. Diz o que vai acontecer se a resposta for sim, e é a primeira coisa que o anúncio carrega.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    scope: {
      control: 'select',
      options: [...SCOPE_OPTIONS],
      description:
        'O alcance do que se aprova, em pares de termo e valor. Sem ele, a lista não é desenhada.',
      table: {
        type: { summary: SCOPE_OPTIONS.map((s) => `'${s}'`).join(' | ') },
        defaultValue: { summary: "'publish'" },
      },
    },
  },
  args: {
    question: approvalQuestion('publish'),
    scope: 'publish',
  },
};

export default meta;
type Story = StoryObj<PlaygroundArgs>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item4',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
      'visual.item1',
    ],
  },
  // Os rótulos vêm do andaime compartilhado, e não de literais: eles têm três
  // idiomas, e uma palavra escrita à mão aqui congelaria um deles.
  render: (args) => ({
    props: {
      question: args.question,
      // "Sem alcance" é ausência de lista, e não uma lista vazia: um array sem
      // itens desenharia uma caixa com afastamento e nada dentro.
      scope: args.scope === 'none' ? undefined : approvalScope(args.scope),
      choices: approvalChoices(),
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

      <div
        ndsApprovalCard
        class="nds-max-w-md"
        [question]="question"
        [scope]="scope"
        [actions]="[choiceControls]"
        (choose)="onChoose($event)"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="approval-card"]')!;
    const ask = card.querySelector<HTMLElement>('[data-slot="approval-card-ask"]')!;

    await step('A pergunta abre o cartão', async () => {
      const question = card.querySelector<HTMLElement>('[data-slot="approval-card-question"]')!;
      await expect(question.textContent).toBe(args.question);
    });

    await step('E cada termo do alcance chega pareado com o seu valor', async () => {
      // Lista de definição, e não uma frase com dois-pontos: o pareamento fica
      // na estrutura, que sobrevive à navegação item a item.
      const list = card.querySelector<HTMLElement>('[data-slot="approval-card-scope"]');
      if (args.scope === 'none') {
        await expect(list).toBeNull();
        return;
      }
      const expected = approvalScope(args.scope);
      const terms = [...card.querySelectorAll('[data-slot="approval-card-scope-term"]')];
      const details = [...card.querySelectorAll('[data-slot="approval-card-scope-detail"]')];
      await expect(terms.map((el) => el.textContent)).toEqual(expected.map((i) => i.term));
      await expect(details.map((el) => el.textContent)).toEqual(expected.map((i) => i.detail));
    });

    await step('Os controles estão na caixa da resposta, que vem por último', async () => {
      // A ordem de leitura é a ordem do foco, e a folha não move nada.
      const actions = card.querySelector<HTMLElement>('[data-slot="approval-card-actions"]')!;
      await expect(actions.querySelectorAll('button')).toHaveLength(3);
      await expect(card.lastElementChild).toBe(actions);
    });

    await step('A pergunta e o alcance estão DENTRO da região que se anuncia', async () => {
      // Uma pergunta que aparece e não se anuncia é uma pergunta que ninguém
      // responde: a máquina parou e espera por uma pessoa, e o silêncio é
      // indistinguível de demora.
      const question = card.querySelector<HTMLElement>('[data-slot="approval-card-question"]')!;
      await expect(ask.getAttribute('role')).toBe('status');
      await expect(ask.contains(question)).toBe(true);
      const list = card.querySelector<HTMLElement>('[data-slot="approval-card-scope"]');
      if (list) await expect(ask.contains(list)).toBe(true);
    });

    await step('E os controles ficam FORA dela, que é a única do cartão', async () => {
      // Botão dentro de anúncio é rótulo recitado que ninguém pode apertar dali,
      // e alonga o anúncio justamente na hora de respondê-lo.
      const actions = card.querySelector<HTMLElement>('[data-slot="approval-card-actions"]')!;
      await expect(ask.contains(actions)).toBe(false);
      const live = [
        ...card.querySelectorAll('[role="status"], [role="alert"], [role="log"], [aria-live]'),
      ];
      await expect(live).toEqual([ask]);
      await expect(card.hasAttribute('role')).toBe(false);
    });

    await step('O anúncio é POLIDO, e nunca de emergência', async () => {
      // Pedir autorização não é erro, e cortar o que estiver sendo lido é a
      // armadilha com que a regra de região viva desta família abre.
      await expect(ask.getAttribute('role')).not.toBe('alert');
      await expect(ask.getAttribute('aria-live')).not.toBe('assertive');
    });
  },
};
