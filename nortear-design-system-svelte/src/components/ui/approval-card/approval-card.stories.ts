import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, fn } from 'storybook/test';
import ApprovalCardStory from './ApprovalCardStory.svelte';
import {
  approvalCardLabels,
  approvalCardLabelsFor,
  approvalScopeOf,
  APPROVAL_EXAMPLE_NAMES,
  type ApprovalExampleName,
} from './approval-card.fixtures';
import { approvalCardSource } from './approval-card.source';
import ApprovalCardDocs from '@/components/docs/ApprovalCardDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onChoose = fn();

/**
 * Os dois eixos do cartão, num cartão só.
 *
 * A pergunta e o alcance são INDEPENDENTES de propósito: quem escreve a
 * pergunta é quem consome, e uma peça que a compusesse a partir do alcance
 * produziria uma frase que ninguém faria. A grade das formas mora em `States`;
 * aqui o assunto é o que muda quando se mexe em cada eixo.
 */
type PlaygroundArgs = {
  question: string;
  scope: ApprovalExampleName | 'none';
};

const SCOPE_OPTIONS = [...APPROVAL_EXAMPLE_NAMES, 'none'] as const;

// O docgen do Svelte está desligado no .storybook/main.ts: a aba
// "API Reference" sai só destes argTypes.
const meta: Meta<PlaygroundArgs> = {
  title: 'Components/Conversational/ApprovalCard',
  component: ApprovalCardStory,
  tags: ['autodocs', 'conversational'],
  parameters: {
    layout: 'padded',
    actions: { disable: true },
    docs: {
      page: withAutoDocsTab(ApprovalCardDocs),
      // Sem docgen, o gerador de source monta a tag a partir do nome interno da
      // função compilada. A transform devolve o uso real.
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
        type: { summary: SCOPE_OPTIONS.map((name) => `'${name}'`).join(' | ') },
        defaultValue: { summary: "'publish'" },
      },
    },
  },
  args: {
    // O idioma vem escrito, e não da store: o control guarda o texto que alguém
    // digitou, e trocá-lo por baixo quando a barra de idioma mudasse apagaria a
    // edição. O cartão em si continua acompanhando o idioma, pelo invólucro.
    question: approvalCardLabelsFor('pt-BR').question.publish,
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
  render: (args) => ({
    Component: ApprovalCardStory,
    props: { ...args, onChoose },
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
      const expected = approvalScopeOf(approvalCardLabels(), args.scope);
      const terms = [...card.querySelectorAll('[data-slot="approval-card-scope-term"]')];
      const details = [...card.querySelectorAll('[data-slot="approval-card-scope-detail"]')];
      await expect(terms.map((el) => el.textContent)).toEqual(expected.map((item) => item.term));
      await expect(details.map((el) => el.textContent)).toEqual(
        expected.map((item) => item.detail),
      );
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
      // Botão dentro de anúncio é rótulo recitado que ninguém pode apertar
      // dali, e alonga o anúncio justamente na hora de respondê-lo.
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
