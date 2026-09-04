import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { NdsApprovalCard } from './approval-card';
import { NdsButton } from './button';
import {
  approvalChoices,
  approvalQuestion,
  approvalScope,
  type ApprovalExampleName,
} from './approval-card.fixtures';
import {
  approvalCardLongDetailSource,
  approvalCardManyChoicesSource,
  approvalCardWithoutActionsSource,
  approvalCardWithoutScopeSource,
  approvalCardWithScopeSource,
} from './approval-card.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// As formas que o cartão toma conforme o que recebe. Não há máquina de estados
// aqui, e isso é decisão da folha: não há prazo, não há nada recolhido e não há
// um "já respondido" — o que a resposta significa é de quem consome, e a peça
// não muda de desenho por causa dela.

const meta: Meta = {
  title: 'Components/Conversational/ApprovalCard/States',
  tags: ['conversational'],
  decorators: [moduleMetadata({ imports: [NdsApprovalCard, NdsButton] })],
  // Sem argTypes nem callbacks: sem isto os painéis Controls e Actions abrem vazios.
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: approvalCardWithScopeSource },
      description: {
        component:
          'O que chega decide a forma: com alcance ou sem, com um valor que cabe na linha ou um que quebra, com duas escolhas ou mais — e sem controle nenhum, que é uma pergunta que o cartão não tem como fazer responder.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onChoose = fn();

/**
 * Os controles da resposta, num template só.
 *
 * Cada entrada de `actions` é um pedaço do espaço da resposta, e a peça
 * instancia o que chega na ordem em que chega — ela não conta controles.
 */
const CHOICE_CONTROLS = `
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
`;

/**
 * Um cartão, com a largura da conversa.
 *
 * A largura é apertada de propósito: é ela que faz o valor comprido quebrar, e a
 * quebra é o assunto de uma das formas.
 */
const mount = (question: string, scope?: ReturnType<typeof approvalScope>) => ({
  props: {
    question,
    scope,
    choices: approvalChoices(),
    onChoose,
  },
  template: `${CHOICE_CONTROLS}
      <div
        ndsApprovalCard
        class="nds-max-w-sm"
        [question]="question"
        [scope]="scope"
        [actions]="[choiceControls]"
        (choose)="onChoose($event)"
      ></div>
    `,
});

const fromExample = (name: ApprovalExampleName) =>
  mount(approvalQuestion(name), approvalScope(name));

const cardOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="approval-card"]')!;

/** O cartão inteiro: a pergunta, o alcance e o espaço da resposta. */
export const WithScope: Story = {
  parameters: {
    covers: ['accessibility.item4', 'visual.item2'],
    docs: { source: { transform: approvalCardWithScopeSource } },
  },
  render: () => fromExample('publish'),
  play: async ({ canvasElement, step }) => {
    const card = cardOf(canvasElement);
    const expected = approvalScope('publish');

    await step('O alcance é uma LISTA DE DEFINIÇÃO', async () => {
      // "Ferramenta: publicar_relatorio" põe o pareamento na pontuação, e
      // pontuação não sobrevive à navegação por lista de um leitor de tela.
      const list = card.querySelector<HTMLElement>('[data-slot="approval-card-scope"]')!;
      await expect(list.tagName).toBe('DL');
    });

    await step('E cada termo é seguido pelo SEU valor, alternando', async () => {
      // O par é filho DIRETO da lista: um invólucro em volta quebraria a grade
      // de duas colunas, que é da lista e não de cada par.
      const list = card.querySelector<HTMLElement>('[data-slot="approval-card-scope"]')!;
      const children = [...list.children];
      await expect(children).toHaveLength(expected.length * 2);
      for (const [i, item] of expected.entries()) {
        const term = children[i * 2]!;
        const detail = children[i * 2 + 1]!;
        await expect(term.tagName).toBe('DT');
        await expect(term.textContent).toBe(item.term);
        await expect(detail.tagName).toBe('DD');
        await expect(detail.textContent).toBe(item.detail);
      }
    });
  },
};

/** Sem alcance: a pergunta já diz tudo o que há para saber. */
export const WithoutScope: Story = {
  parameters: {
    covers: ['functional.item3', 'visual.item3'],
    docs: { source: { transform: approvalCardWithoutScopeSource } },
  },
  render: () => mount(approvalQuestion('publish')),
  play: async ({ canvasElement, step }) => {
    const card = cardOf(canvasElement);

    await step('A lista não é desenhada', async () => {
      // Ausência de alcance é ausência de lista, e não uma lista vazia: uma
      // caixa com afastamento e nada dentro é espaço reservado para quem nunca
      // chegou.
      await expect(card.querySelector('[data-slot="approval-card-scope"]')).toBeNull();
    });

    await step('E a pergunta continua à vista, dentro da região que se anuncia', async () => {
      const ask = card.querySelector<HTMLElement>('[data-slot="approval-card-ask"]')!;
      const question = card.querySelector<HTMLElement>('[data-slot="approval-card-question"]')!;
      await expect(question.textContent).toBe(approvalQuestion('publish'));
      await expect(ask.contains(question)).toBe(true);
    });
  },
};

/**
 * O caminho comprido, que QUEBRA.
 *
 * Alcance pela metade é autorização pela metade: quem lê tem de ver o caminho
 * inteiro, e reticências no fim de um caminho escondem justamente a parte que
 * diz onde ele vai dar.
 */
export const LongDetail: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item4'],
    docs: { source: { transform: approvalCardLongDetailSource } },
  },
  render: () => fromExample('writeFile'),
  play: async ({ canvasElement, step }) => {
    const card = cardOf(canvasElement);
    const expected = approvalScope('writeFile');
    const details = [
      ...card.querySelectorAll<HTMLElement>('[data-slot="approval-card-scope-detail"]'),
    ];

    await step('O valor chega INTEIRO ao documento', async () => {
      await expect(details.map((el) => el.textContent)).toEqual(expected.map((i) => i.detail));
    });

    await step('A folha manda quebrar, e não cortar', async () => {
      // Leitura pura, e medida uma vez: nada aqui mexe no documento.
      const longest = details[details.length - 1]!;
      const style = getComputedStyle(longest);
      await expect(style.overflowWrap).toBe('anywhere');
      await expect(style.textOverflow).not.toBe('ellipsis');
    });

    await step('E nada transborda para os lados', async () => {
      // O elemento que de fato recorta é o valor, e o cartão em volta dele —
      // medir a raiz da página não veria uma barra que nasce aqui dentro.
      const longest = details[details.length - 1]!;
      await expect(longest.scrollWidth).toBeLessThanOrEqual(longest.clientWidth + 1);
      await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth + 1);
    });
  },
};

/** Mais de duas escolhas: os controles quebram de linha e mantêm a ordem. */
export const ManyChoices: Story = {
  parameters: {
    covers: ['accessibility.item5', 'visual.item5'],
    docs: { source: { transform: approvalCardManyChoicesSource } },
  },
  render: () => fromExample('spend'),
  play: async ({ canvasElement, step }) => {
    const card = cardOf(canvasElement);
    const ask = card.querySelector<HTMLElement>('[data-slot="approval-card-ask"]')!;
    const actions = card.querySelector<HTMLElement>('[data-slot="approval-card-actions"]')!;
    const controls = [...actions.querySelectorAll<HTMLButtonElement>('button')];

    await step('A ordem da MARCAÇÃO é pergunta, alcance, controles', async () => {
      await expect(
        ask.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      await expect(card.lastElementChild).toBe(actions);
    });

    await step('E a folha não a inverte', async () => {
      // Controle que é o primeiro para o olho e o último para a tabulação faz
      // duas perguntas diferentes na mesma tela (WCAG 1.3.2 e 2.4.3).
      await expect(getComputedStyle(card).flexDirection).toBe('column');
      await expect(getComputedStyle(actions).flexDirection).toBe('row');
      for (const control of controls) {
        await expect(getComputedStyle(control).order).toBe('0');
        await expect(control.tabIndex).toBe(0);
      }
    });

    await step('A tabulação percorre os controles nessa mesma ordem', async () => {
      await expect(controls.length).toBeGreaterThan(2);
      controls[0]!.focus();
      await expect(document.activeElement).toBe(controls[0]);
      for (let i = 1; i < controls.length; i += 1) {
        await userEvent.tab();
        await expect(document.activeElement).toBe(controls[i]);
      }
    });
  },
};

/**
 * Sem controle nenhum.
 *
 * Não é o caso bonito, e está aqui de propósito: a peça desenha o que recebe, e
 * um cartão sem controles é uma pergunta que quem consome ainda não deu como
 * responder. A caixa da resposta não é desenhada — um vão com afastamento e nada
 * dentro seria espaço reservado para quem nunca chegou.
 */
export const WithoutActions: Story = {
  parameters: {
    covers: ['functional.item7'],
    docs: { source: { transform: approvalCardWithoutActionsSource } },
  },
  render: () => ({
    props: {
      question: approvalQuestion('publish'),
      scope: approvalScope('publish'),
    },
    template: `
      <div
        ndsApprovalCard
        class="nds-max-w-sm"
        [question]="question"
        [scope]="scope"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const card = cardOf(canvasElement);
    const ask = card.querySelector<HTMLElement>('[data-slot="approval-card-ask"]')!;

    await step('A caixa da resposta não é desenhada', async () => {
      await expect(card.querySelector('[data-slot="approval-card-actions"]')).toBeNull();
      await expect(card.querySelectorAll('button')).toHaveLength(0);
    });

    await step('E a pergunta continua à vista, com o alcance inteiro', async () => {
      await expect(card.lastElementChild).toBe(ask);
      await expect(card.querySelectorAll('[data-slot="approval-card-scope-term"]')).toHaveLength(
        approvalScope('publish').length,
      );
    });
  },
};
