import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, fn, userEvent } from 'storybook/test';
import ApprovalCardShapeStory from './ApprovalCardShapeStory.svelte';
import { approvalCardLabels, approvalScopeOf } from './approval-card.fixtures';
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

const meta: Meta<typeof ApprovalCardShapeStory> = {
  title: 'Primitives/Conversational/ApprovalCard/States',
  component: ApprovalCardShapeStory,
  tags: ['conversational'],
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
type Story = StoryObj<typeof ApprovalCardShapeStory>;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onChoose = fn();

const cardOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="approval-card"]')!;

/** O cartão inteiro: a pergunta, o alcance e o espaço da resposta. */
export const WithScope: Story = {
  parameters: {
    covers: ['accessibility.item4', 'visual.item2'],
    docs: { source: { transform: approvalCardWithScopeSource } },
  },
  render: () => ({
    Component: ApprovalCardShapeStory,
    props: { name: 'publish', onChoose },
  }),
  play: async ({ canvasElement, step }) => {
    const card = cardOf(canvasElement);
    const expected = approvalScopeOf(approvalCardLabels(), 'publish');

    await step('O alcance é uma LISTA DE DEFINIÇÃO', async () => {
      // "Ferramenta: publicar_relatorio" põe o pareamento na pontuação, e
      // pontuação não sobrevive à navegação por lista de um leitor de tela.
      const list = card.querySelector<HTMLElement>('[data-slot="approval-card-scope"]')!;
      await expect(list.tagName).toBe('DL');
    });

    await step('E cada termo é seguido pelo SEU valor, alternando', async () => {
      const list = card.querySelector<HTMLElement>('[data-slot="approval-card-scope"]')!;
      const children = [...list.children];
      await expect(children).toHaveLength(expected.length * 2);
      for (const [index, item] of expected.entries()) {
        const term = children[index * 2]!;
        const detail = children[index * 2 + 1]!;
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
  render: () => ({
    Component: ApprovalCardShapeStory,
    props: { name: 'publish', withScope: false, onChoose },
  }),
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
      await expect(question.textContent).toBe(approvalCardLabels().question.publish);
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
  render: () => ({
    Component: ApprovalCardShapeStory,
    props: { name: 'writeFile', onChoose },
  }),
  play: async ({ canvasElement, step }) => {
    const card = cardOf(canvasElement);
    const expected = approvalScopeOf(approvalCardLabels(), 'writeFile');
    const details = [
      ...card.querySelectorAll<HTMLElement>('[data-slot="approval-card-scope-detail"]'),
    ];

    await step('O valor chega INTEIRO ao documento', async () => {
      await expect(details.map((el) => el.textContent)).toEqual(
        expected.map((item) => item.detail),
      );
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
  render: () => ({
    Component: ApprovalCardShapeStory,
    props: { name: 'spend', onChoose },
  }),
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
      for (let index = 1; index < controls.length; index += 1) {
        await userEvent.tab();
        await expect(document.activeElement).toBe(controls[index]);
      }
    });
  },
};

/**
 * Sem controle nenhum.
 *
 * Não é o caso bonito, e está aqui de propósito: a peça desenha o que recebe, e
 * um cartão sem controles é uma pergunta que quem consome ainda não deu como
 * responder. A caixa da resposta não é desenhada — um vão com afastamento e
 * nada dentro seria espaço reservado para quem nunca chegou.
 */
export const WithoutActions: Story = {
  parameters: {
    covers: ['functional.item7'],
    docs: { source: { transform: approvalCardWithoutActionsSource } },
  },
  render: () => ({
    Component: ApprovalCardShapeStory,
    props: { name: 'publish', withActions: false },
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
        approvalScopeOf(approvalCardLabels(), 'publish').length,
      );
    });
  },
};
