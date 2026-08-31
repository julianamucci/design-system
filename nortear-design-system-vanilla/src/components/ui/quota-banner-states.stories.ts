import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, within } from 'storybook/test';
import { createQuotaBanner } from './quota-banner';
import {
  QUOTA_BANNER_USE,
  quotaBannerLabels,
  quotaOf,
  renewalOf,
  type QuotaBannerCase,
} from './quota-banner.fixtures';
import {
  quotaBannerEveryCaseSource,
  quotaBannerSourceAllLevels,
  quotaBannerSourceAtThreshold,
  quotaBannerSourceExhausted,
  quotaBannerSourceNoRenewal,
} from './quota-banner.source';
import {
  BUDGET_WARNING_AT,
  fractionLevel,
  fractionPercent,
  remainingUnits,
  spentFraction,
} from '@shared/primitives/token-budget';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O que a faixa diz nas bordas: o uso que encosta no limiar em ponto, o que
// passa do teto e não deixa nada, e a cota para a qual ninguém prometeu
// renovação. Nas três o desenho sozinho falharia — o trilho fica igual em duas
// delas —, e é o texto ao lado que responde.

const meta: Meta = {
  title: 'Primitives/Conversational/QuotaBanner/States',
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: quotaBannerEveryCaseSource },
      description: {
        component:
          'Nas bordas o desenho sozinho falha: o trilho fica cheio tanto no teto quanto acima dele, e não muda quando falta a renovação. O que responde nas três é o texto ao lado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const bannerOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="quota-banner"]')!;

const textOf = (banner: HTMLElement, slot: string) =>
  banner.querySelector<HTMLElement>(`[data-slot="quota-banner-${slot}"]`)?.textContent;

/** A faixa daquele exemplo, com o horizonte já escrito quando ele existe. */
const quotaBannerOf = (name: QuotaBannerCase) =>
  createQuotaBanner({
    quota: quotaOf(name),
    renewsIn: renewalOf(name),
    labels: quotaBannerLabels(),
  });

/** A fração daquele exemplo, pela mesma conta que a peça lê. */
const fractionOf = (name: QuotaBannerCase) =>
  spentFraction(quotaOf(name).used, quotaOf(name).limit);

/**
 * Os três níveis, do mais folgado ao mais apertado.
 *
 * A cor da moldura e do medidor é a única diferença visual entre os três, e é
 * por isso que a palavra do nível está sempre na faixa: duas superfícies
 * coloridas ainda são zero palavras.
 */
export const AllLevels: Story = {
  parameters: {
    covers: ['functional.item3', 'accessibility.item5', 'visual.item2'],
    docs: { source: { transform: quotaBannerSourceAllLevels } },
  },
  render: () => {
    const stack = document.createElement('div');
    stack.className = 'nds-stack nds-max-w-lg';
    stack.dataset.spacing = 'md';
    for (const name of ['normal', 'warning', 'critical'] as const) {
      stack.appendChild(quotaBannerOf(name));
    }
    return stack;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const labels = quotaBannerLabels();
    const banners = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="quota-banner"]')];
    const names = ['normal', 'warning', 'critical'] as const;

    await step('Cada uso traz a palavra do SEU nível', async () => {
      for (const [i, name] of names.entries()) {
        const level = fractionLevel(fractionOf(name)!);
        await expect(banners[i]!.dataset.level).toBe(level);
        await expect(canvas.getByText(labels.level[level])).toBeInTheDocument();
      }
    });

    await step('E a razão de cada um está em TEXTO, e não só no desenho', async () => {
      // É este texto que dispensa o trilho de carregar o valor — sem ele, o
      // comprimento seria a única pista da fração.
      for (const [i, name] of names.entries()) {
        const { used, limit } = quotaOf(name);
        await expect(textOf(banners[i]!, 'detail'))
          .toBe(`${used.toLocaleString()} ${labels.of} ${limit.toLocaleString()} ${labels.unit}`);
      }
    });

    await step('As três palavras são diferentes entre si', async () => {
      // Se duas coincidissem, o nível deixaria de decidir o que fazer e a cor
      // voltaria a ser a única diferença.
      const words = names.map((name) => labels.level[fractionLevel(fractionOf(name)!)]);
      await expect(new Set(words).size).toBe(3);
    });
  },
};

/**
 * Três quartos do teto EM PONTO.
 *
 * A borda do limiar, e o único uso dos exemplos cujo valor não pode mudar sem
 * mudar o que a story prova: três quartos JÁ é aviso, e não folga.
 */
export const AtThreshold: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item3'],
    docs: { source: { transform: quotaBannerSourceAtThreshold } },
  },
  render: () => quotaBannerOf('threshold'),
  play: async ({ canvasElement, step }) => {
    const banner = bannerOf(canvasElement);
    const meter = banner.querySelector<HTMLElement>('[data-slot="quota-banner-meter"]')!;

    await step('O uso é exatamente o limiar, e não um vizinho dele', async () => {
      await expect(fractionOf('threshold')).toBe(BUDGET_WARNING_AT);
    });

    await step('E o limiar já vale: é aviso, e não folga', async () => {
      // Comparação frouxa faria esta borda cair do outro lado, e as medições da
      // mesma tela passariam a discordar sobre o mesmo número.
      await expect(banner.dataset.level).toBe('warning');
      await expect(meter.style.getPropertyValue('--nds-quota-used')).toBe('75');
    });

    await step('E ainda sobra um quarto da cota, escrito na manchete', async () => {
      const { used, limit } = quotaOf('threshold');
      await expect(remainingUnits(used, limit)).toBe(50);
      await expect(textOf(banner, 'remaining')).toContain('50');
    });
  },
};

/**
 * O uso passou do teto, e não sobra nada.
 *
 * A foto que carrega DUAS travas ao mesmo tempo: o resto para em zero em vez de
 * ficar negativo, e a razão para em uma volta. Nenhuma das duas se vê no
 * desenho, porque um trilho cheio é a mesma imagem de estar no fim sem ter
 * acabado.
 */
export const Exhausted: Story = {
  parameters: {
    covers: ['functional.item5', 'accessibility.item6', 'visual.item4'],
    docs: { source: { transform: quotaBannerSourceExhausted } },
  },
  render: () => quotaBannerOf('exhausted'),
  play: async ({ canvasElement, step }) => {
    const banner = bannerOf(canvasElement);
    const labels = quotaBannerLabels();
    const { used, limit } = quotaOf('exhausted');

    await step('O uso passou do teto de verdade', async () => {
      await expect(used).toBeGreaterThan(limit);
      await expect(limit - used).toBeLessThan(0);
    });

    await step('Mas o resto para em zero, e nunca fica negativo', async () => {
      await expect(remainingUnits(used, limit)).toBe(0);
      // O número que uma subtração escrita à mão colocaria na tela. Ele não
      // pode aparecer em lugar nenhum da faixa.
      await expect(banner.textContent).not.toContain(String(limit - used));
    });

    await step('E a manchete DIZ que acabou, em vez de contar zero', async () => {
      // Zero contado lê como medição, e não como fim (decisão 6 da lista de
      // acessibilidade). O trilho cheio sozinho não distingue as duas coisas.
      await expect(textOf(banner, 'remaining')).toBe(labels.exhausted);
      await expect(textOf(banner, 'remaining')).not.toContain('0');
    });

    await step('A razão para em uma volta, e o medidor para no cheio', async () => {
      await expect(fractionOf('exhausted')).toBe(1);
      await expect(fractionPercent(fractionOf('exhausted')!)).toBe(100);
      const meter = banner.querySelector<HTMLElement>('[data-slot="quota-banner-meter"]')!;
      await expect(meter.style.getPropertyValue('--nds-quota-used')).toBe('100');
    });

    await step('E o rodapé continua dizendo o uso de verdade', async () => {
      // O recorte é do DESENHO, e não da medição: quem precisa saber o quanto
      // passou lê a razão, que nunca foi truncada.
      await expect(textOf(banner, 'detail')).toContain(String(used));
    });
  },
};

/**
 * Nenhuma renovação prometida.
 *
 * Crédito comprado uma vez é caso real, e a linha some em vez de dizer "renova
 * em nunca". Os números são os mesmos do exemplo de aviso de propósito: assim a
 * única diferença entre as duas fotos é a linha que falta.
 */
export const NoRenewal: Story = {
  parameters: {
    covers: ['functional.item6', 'visual.item5'],
    docs: { source: { transform: quotaBannerSourceNoRenewal } },
  },
  render: () => quotaBannerOf('noRenewal'),
  play: async ({ canvasElement, step }) => {
    const banner = bannerOf(canvasElement);
    const labels = quotaBannerLabels();

    await step('O exemplo chega sem horizonte, e não com um horizonte vazio', async () => {
      await expect(QUOTA_BANNER_USE.noRenewal.renewalMinutes).toBeUndefined();
      await expect(renewalOf('noRenewal')).toBeUndefined();
    });

    await step('Então a linha do horizonte não é montada', async () => {
      await expect(banner.querySelector('[data-slot="quota-banner-renews"]')).toBeNull();
      await expect(banner.textContent).not.toContain(labels.renews);
    });

    await step('E o resto da faixa fica igual ao do exemplo com renovação', async () => {
      // A medição não depende do horizonte: o que se sabe é quanto sobra, e não
      // até quando.
      await expect(banner.dataset.level).toBe('warning');
      await expect(textOf(banner, 'remaining'))
        .toBe(`${(32).toLocaleString()} ${labels.unit} ${labels.left}`);
      await expect(banner.querySelector('[data-slot="quota-banner-meter"]')).not.toBeNull();
    });
  },
};
