import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { QuotaBanner } from './index';
import { ContextDisplay } from '@/components/ui/context-display';
import { Button } from '@/components/ui/button';
import {
  quotaOf,
  useQuotaBannerActionLabel,
  useQuotaBannerLabels,
  useQuotaRenewals,
} from './quota-banner.fixtures';
import { useContextDisplayLabels } from '@/components/ui/context-display/context-display.fixtures';
import {
  quotaBannerBesideContextSource,
  quotaBannerWithActionSource,
} from './quota-banner.source';
import type { TokenUsage } from '@shared/primitives/chat-protocol';
import { budgetLevel, spentFraction, usedFraction } from '@shared/primitives/token-budget';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O que entra na faixa vindo de fora, e o que convive com ela ao lado. Nos dois
// ela é AUTÔNOMA: recebe o controle sem saber o que ele faz, e divide a tela com
// a medição da janela sem que nenhuma das duas saiba da outra (§4.2 da
// guideline 17).

const meta: Meta = {
  title: 'Primitives/Conversational/QuotaBanner/Compositions',
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: quotaBannerWithActionSource },
      description: {
        component:
          'A faixa recebe o controle pronto e não decide o que ele faz, e convive com a medição da janela sem que nenhuma das duas vire propriedade da outra.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const bannerOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="quota-banner"]')!;

/**
 * A faixa com um controle vindo de quem consome.
 *
 * O teste de §7 da guideline 17: a peça desenha o LUGAR de quem responde, e o
 * que a resposta significa fica do lado de fora. O controle é o último tanto na
 * marcação quanto no foco, e nenhum `order` desfaz isso.
 */
export const WithAction: Story = {
  parameters: { covers: ['functional.item7', 'accessibility.item7', 'visual.item6'] },
  render: () => ({
    components: { QuotaBanner, Button },
    setup() {
      // O controle nasce na MARCAÇÃO desta story, no papel de quem consome: é
      // ela que sabe o que o botão faz, e a faixa apenas hospeda o lugar dele.
      // O andaime entrega só a PALAVRA, que é texto de interface.
      return {
        quota: quotaOf('warning'),
        renewals: useQuotaRenewals(),
        actionLabel: useQuotaBannerActionLabel(),
        labels: useQuotaBannerLabels(),
      };
    },
    template: `<QuotaBanner
      class="nds-max-w-lg"
      :quota="quota"
      :renews-in="renewals.warning"
      :labels="labels"
    >
      <template #actions>
        <Button variant="outline" size="sm">{{ actionLabel }}</Button>
      </template>
    </QuotaBanner>`,
  }),
  play: async ({ canvasElement, step }) => {
    const banner = bannerOf(canvasElement);
    const actions = banner.querySelector<HTMLElement>('[data-slot="quota-banner-actions"]')!;
    const control = actions.querySelector('button')!;

    await step('O controle chega inteiro, e a faixa não o reescreve', async () => {
      // Ação é ESPAÇO, e não política: o que o botão diz e o que ele faz vieram
      // de fora, e a peça só o hospedou.
      await expect(actions.children.length).toBe(1);
      await expect(control.textContent?.trim().length).toBeGreaterThan(0);
    });

    await step('E a faixa não decide o que ele faz', async () => {
      // Nenhum manipulador nosso, nenhum atributo de escolha: o que acontece ao
      // acionar é de quem passou o controle (§7 da guideline 17).
      await expect(control.getAttribute('type')).toBe('button');
      await expect(control.hasAttribute('aria-disabled')).toBe(false);
      await expect(banner.hasAttribute('aria-live')).toBe(false);
    });

    await step('O controle é o ÚLTIMO na marcação, e portanto no foco', async () => {
      // Controle que é o primeiro para o olho e o último para a tabulação faz
      // duas perguntas diferentes na mesma tela (decisão 5 da folha).
      const focusables = [...banner.querySelectorAll<HTMLElement>('button, a[href], [tabindex]')];
      await expect(focusables.at(-1)).toBe(control);

      // E a marcação não é desfeita por `order` — quem vem depois no DOM vem
      // depois na tela.
      const meter = banner.querySelector<HTMLElement>('[data-slot="quota-banner-meter"]')!;
      await expect(
        meter.compareDocumentPosition(control) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeGreaterThan(0);
      await expect(getComputedStyle(control).order).toBe('0');
    });
  },
};

/**
 * Uma janela gasta na MESMA fração da cota do exemplo de aviso.
 *
 * Vinte e seis mil oitocentos e oitenta de trinta e dois mil são exatamente
 * oitenta e quatro centésimos — o mesmo que cento e sessenta e oito de
 * duzentas mensagens. É esse pareamento que faz a story provar o que ela existe
 * para provar: o limiar vem do mesmo lugar, então a palavra é a mesma.
 */
const MATCHING_USAGE: TokenUsage = { input: 20_000, output: 6_880, limit: 32_000 };

/**
 * As duas medições da mesma conversa, uma acima da outra.
 *
 * Uma mede o que já foi ocupado contra uma janela, a outra mede o que sobra de
 * uma cota. São perguntas opostas e nada obrigaria três quartos a significar
 * "aviso" nas duas — mas elas dividem a tela e a palavra, e é por isso que o
 * limiar vem do primitivo compartilhado.
 */
export const BesideContext: Story = {
  parameters: {
    covers: ['functional.item8', 'visual.item7'],
    docs: { source: { transform: quotaBannerBesideContextSource } },
  },
  render: () => ({
    components: { QuotaBanner, ContextDisplay },
    setup() {
      return {
        usage: MATCHING_USAGE,
        quota: quotaOf('warning'),
        renewals: useQuotaRenewals(),
        labels: useQuotaBannerLabels(),
        contextLabels: useContextDisplayLabels(),
      };
    },
    // As duas são IRMÃS num invólucro, e não pai e filho: é assim que a peça se
    // usa, e é o que prova que nada precisou ser acrescentado à vizinha.
    template: `<div class="nds-stack nds-max-w-lg" data-spacing="md">
      <ContextDisplay
        :usage="usage"
        form="bar"
        :labels="contextLabels"
      />
      <QuotaBanner
        :quota="quota"
        :renews-in="renewals.warning"
        :labels="labels"
      />
    </div>`,
  }),
  play: async ({ canvasElement, step }) => {
    const banner = bannerOf(canvasElement);
    const display = canvasElement.querySelector<HTMLElement>('[data-slot="context-display"]')!;
    const { used, limit } = quotaOf('warning');

    await step('As duas estão na MESMA fração, em grandezas diferentes', async () => {
      await expect(usedFraction(MATCHING_USAGE)).toBe(spentFraction(used, limit));
    });

    await step('E por isso desenham a mesma palavra de nível', async () => {
      // O limiar vem do mesmo lugar. Dois limiares fariam "perto do fim"
      // significar uma coisa acima e outra abaixo na mesma tela.
      await expect(banner.dataset.level).toBe(budgetLevel(MATCHING_USAGE));
      await expect(display.dataset.level).toBe(banner.dataset.level);
    });

    await step('Nenhuma das duas vive dentro da outra', async () => {
      await expect(display.contains(banner)).toBe(false);
      await expect(banner.contains(display)).toBe(false);
    });
  },
};
