import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { ContextBreakdown } from './index';
import { ContextDisplay } from '@/components/ui/context-display';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { partsOf, useContextBreakdownLabels } from './context-breakdown.fixtures';
import {
  usageOf,
  useContextDisplayLabels,
} from '@/components/ui/context-display/context-display.fixtures';
import {
  contextBreakdownBesideBudgetSource,
  contextBreakdownInsideDisclosureSource,
} from './context-breakdown.source';
import { contextTotal, usedTokens } from '@shared/primitives/token-budget';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Onde a repartição mora em relação às peças vizinhas. Ela é AUTÔNOMA nos dois
// arranjos: fica ao lado da medição da janela sem que nenhuma das duas saiba da
// outra, e entra dentro de um bloco de expansão sem ganhar estado nenhum por
// isso.
//
// DIVERGÊNCIA DE API a registrar, e ela é do bloco de expansão, não desta peça:
// nesta stack o recolhimento é uma COMPOSIÇÃO de três componentes — raiz,
// gatilho e conteúdo —, e não uma chamada única que recebe gatilho e conteúdo
// por argumento. Divergência de API de framework não se "alinha": registra-se.
// O que não muda é o que importa — o controle continua sendo um botão de
// verdade, por fora da repartição, e a repartição continua sem saber que está
// sendo recolhida.

const meta: Meta = {
  title: 'Primitives/Conversational/ContextBreakdown/Compositions',
  tags: ['conversational'],
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
    components: { ContextBreakdown, ContextDisplay },
    setup() {
      return {
        usage: usageOf('warning'),
        displayLabels: useContextDisplayLabels(),
        parts: partsOf('typical'),
        labels: useContextBreakdownLabels(),
      };
    },
    // As duas são IRMÃS num invólucro, e não pai e filha: é assim que a peça se
    // usa, e é o que prova que nenhuma precisou saber da outra.
    template: `<div class="nds-stack nds-max-w-lg" data-spacing="md">
      <ContextDisplay
        :usage="usage"
        :labels="displayLabels"
      />
      <ContextBreakdown
        :parts="parts"
        :labels="labels"
      />
    </div>`,
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
  render: () => ({
    components: { ContextBreakdown, Collapsible, CollapsibleContent, CollapsibleTrigger },
    setup() {
      return {
        parts: partsOf('typical'),
        labels: useContextBreakdownLabels(),
      };
    },
    // O gatilho recebe as classes do botão em vez de embrulhar um componente:
    // é o idioma desta stack para o disclosure, e é o que mantém o elemento
    // renderizado sendo um <button> de verdade, com `aria-expanded` e
    // `aria-controls` vindos da própria composição.
    template: `<Collapsible
      class="nds-max-w-lg"
      :default-open="true"
    >
      <CollapsibleTrigger class="nds-button nds-button-outline nds-button-sm">
        {{ labels.title }}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ContextBreakdown
          :parts="parts"
          :labels="labels"
        />
      </CollapsibleContent>
    </Collapsible>`,
  }),
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
