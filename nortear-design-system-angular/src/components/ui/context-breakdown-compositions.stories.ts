import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { contextTotal, usedTokens } from '@shared/primitives/token-budget';
import { NdsContextBreakdown } from './context-breakdown';
import { NdsContextDisplay } from './context-display';
import { NDS_COLLAPSIBLE } from './collapsible';
import { NdsButton } from './button';
import { contextBreakdownLabels, partsOf } from './context-breakdown.fixtures';
import { contextDisplayLabels, usageOf } from './context-display.fixtures';
import {
  contextBreakdownBesideBudgetSource,
  contextBreakdownInsideDisclosureSource,
} from './context-breakdown.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Onde a repartição mora em relação às peças vizinhas. Ela é AUTÔNOMA nos dois
// arranjos: fica ao lado da medição da janela sem que nenhuma das duas saiba da
// outra, e entra dentro de um bloco de expansão sem ganhar estado nenhum por
// isso.
//
// DIVERGÊNCIA DE FORMA, e é de framework: aqui o gatilho do bloco de expansão JÁ
// É o botão — `ndsCollapsibleTrigger` e `ndsButton` moram no mesmo `<button>`,
// em vez de um botão pronto ser passado como conteúdo de uma opção. É o que
// mantém `aria-expanded` no elemento que se aperta, sem código de ligação.

const meta: Meta = {
  title: 'Components/Conversational/ContextBreakdown/Compositions',
  tags: ['conversational'],
  decorators: [
    moduleMetadata({
      imports: [NdsContextBreakdown, NdsContextDisplay, ...NDS_COLLAPSIBLE, NdsButton],
    }),
  ],
  // Sem argTypes nem callbacks: sem isto os painéis Controls e Actions abrem vazios.
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: contextBreakdownBesideBudgetSource },
      description: {
        component:
          'A repartição é autônoma: ela convive com a medição da janela sem que nenhuma saiba da outra, e recolher é composição, nunca recurso da peça.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const blockOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="context-breakdown"]')!;

/**
 * As duas perguntas, uma acima da outra.
 *
 * "Quanto ainda cabe" precisa de teto; "de onde veio" não precisa de teto
 * nenhum. As duas medem o MESMO consumo — vinte e cinco mil —, e é por isso que
 * elas podem dividir a tela sem parecer que discordam.
 */
export const BesideBudget: Story = {
  parameters: { covers: ['functional.item7', 'visual.item6'] },
  render: () => ({
    props: {
      usage: usageOf('warning'),
      budgetLabels: contextDisplayLabels(),
      parts: partsOf('typical'),
      labels: contextBreakdownLabels(),
    },
    template: `
      <div class="nds-stack nds-max-w-lg" data-spacing="md">
        <p
          ndsContextDisplay
          [usage]="usage"
          [labels]="budgetLabels"
        ></p>

        <div
          ndsContextBreakdown
          [parts]="parts"
          [labels]="labels"
        ></div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const breakdown = blockOf(canvasElement);
    const display = canvasElement.querySelector<HTMLElement>('[data-slot="context-display"]')!;

    await step('As duas medem o MESMO consumo', async () => {
      // Totais diferentes fariam parecer que elas medem coisas diferentes,
      // quando o que difere é a pergunta.
      await expect(contextTotal(partsOf('typical'))).toBe(usedTokens(usageOf('warning')));
    });

    await step('E só a vizinha fala de teto', async () => {
      // "De onde veio" se responde sem saber quanto cabe. Se um dia esta peça
      // ganhar nível ou fração de teto, é aqui que aparece.
      await expect(display.dataset.level).toBe('warning');
      await expect(breakdown.dataset.level).toBeUndefined();
      await expect(breakdown.querySelector('[data-slot="context-display-meter"]')).toBeNull();
    });

    await step('Nenhuma das duas vive dentro da outra', async () => {
      await expect(display.contains(breakdown)).toBe(false);
      await expect(breakdown.contains(display)).toBe(false);
    });
  },
};

/**
 * A repartição dentro de um bloco que expande.
 *
 * Recolher é COMPOSIÇÃO, e não recurso da peça: esconder a legenda esconderia
 * justamente o texto que dispensa a cor, e a peça deixaria de responder sem
 * clique. Quem precisa dela recolhida põe o controle por fora, onde o teclado já
 * sabe encontrá-lo.
 */
export const InsideDisclosure: Story = {
  parameters: {
    covers: ['functional.item8', 'visual.item7'],
    docs: { source: { transform: contextBreakdownInsideDisclosureSource } },
  },
  render: () => {
    const labels = contextBreakdownLabels();
    return {
      props: {
        parts: partsOf('typical'),
        labels,
        triggerLabel: labels.title,
      },
      template: `
        <div ndsCollapsible [defaultOpen]="true" class="nds-max-w-lg">
          <button
            ndsCollapsibleTrigger
            ndsButton
            variant="outline"
            size="sm"
          >{{ triggerLabel }}</button>

          <div ndsCollapsiblePanel>
            <div
              ndsContextBreakdown
              [parts]="parts"
              [labels]="labels"
            ></div>
          </div>
        </div>
      `,
    };
  },
  play: async ({ canvasElement, step }) => {
    const breakdown = blockOf(canvasElement);
    const trigger = canvasElement.querySelector<HTMLElement>(
      '[data-slot="collapsible-trigger"]',
    )!;
    const content = canvasElement.querySelector<HTMLElement>(
      '[data-slot="collapsible-content"]',
    )!;

    await step('O controle é um botão de verdade, e ele é de fora', async () => {
      // Disclosure é botão com aria-expanded, nunca um bloco com clique
      // (regra 5 da §8 da guideline 17). O controle mora no hospedeiro.
      await expect(trigger.tagName).toBe('BUTTON');
      await expect(trigger.getAttribute('aria-expanded')).toBe('true');
      await expect(trigger.getAttribute('aria-controls')).toBe(content.id);
      await expect(breakdown.contains(trigger)).toBe(false);
    });

    await step('A repartição vive dentro do conteúdo, e não ganha estado por isso', async () => {
      await expect(content.contains(breakdown)).toBe(true);
      await expect(breakdown.hasAttribute('aria-expanded')).toBe(false);
      await expect(breakdown.querySelector('button')).toBeNull();
    });

    await step('E o texto de cada parcela continua inteiro dentro dela', async () => {
      // A legenda é o que dispensa a cor; recolhida ou não, ela continua sendo
      // a resposta assim que o bloco abre.
      const rows = [
        ...breakdown.querySelectorAll<HTMLElement>('[data-slot="context-breakdown-part"]'),
      ];
      await expect(rows).toHaveLength(partsOf('typical').length);
      for (const row of rows) {
        const name = row.querySelector<HTMLElement>('[data-slot="context-breakdown-name"]')!;
        await expect(name.textContent?.trim()).not.toBe('');
      }
    });
  },
};
