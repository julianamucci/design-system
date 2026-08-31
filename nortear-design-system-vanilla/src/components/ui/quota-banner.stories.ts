import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, within } from 'storybook/test';
import { createQuotaBanner } from './quota-banner';
import { quotaBannerLabels, renewalIn } from './quota-banner.fixtures';
import { quotaBannerSource } from './quota-banner.source';
import {
  fractionLevel,
  fractionPercent,
  remainingUnits,
  spentFraction,
} from '@shared/primitives/token-budget';
import { createQuotaBannerDocs } from '@/components/docs/QuotaBannerDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

/**
 * Os três eixos desta peça: quanto se usou, contra que teto, e se a cota
 * renova.
 *
 * Os controls mexem em NÚMEROS, e não no resto já calculado — é a peça que tira
 * o resto da conta compartilhada, e um control com o resto pronto ensinaria o
 * contrário do contrato: dois lugares para o mesmo fato, e dois lugares
 * discordam.
 *
 * O horizonte é um interruptor, e não um campo de texto: o que a story precisa
 * mostrar é a LINHA que aparece e some, e a duração em si já chega escrita do
 * andaime, no idioma da página.
 */
type PlaygroundArgs = {
  used: number;
  limit: number;
  renews: boolean;
};

const RENEWAL_MINUTES = 192;

const meta: Meta<PlaygroundArgs> = {
  title: 'Primitives/Conversational/QuotaBanner',
  tags: ['autodocs', 'conversational'],
  parameters: {
    layout: 'padded',
    actions: { disable: true },
    docs: {
      page: withAutoDocsTab(createQuotaBannerDocs),
      source: { transform: quotaBannerSource },
    },
  },
  argTypes: {
    used: {
      control: { type: 'number', min: 0, step: 1 },
      description: 'Quanto da cota já foi usado. A peça tira o resto da conta compartilhada.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
    limit: {
      control: { type: 'number', min: 1, step: 10 },
      description: 'O teto da cota. Sem ele não há resto, e por isso a faixa não teria assunto.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
    renews: {
      control: { type: 'boolean' },
      description: 'A cota renova? Quando não renova, a linha do horizonte não é montada.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
  },
  args: {
    used: 168,
    limit: 200,
    renews: true,
  },
};

export default meta;
type Story = StoryObj<PlaygroundArgs>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2',
      'accessibility.item1', 'accessibility.item2',
      'accessibility.item3', 'accessibility.item4',
      'visual.item1',
    ],
  },
  render: (args) =>
    createQuotaBanner({
      quota: { used: args.used, limit: args.limit },
      renewsIn: args.renews ? renewalIn(RENEWAL_MINUTES) : undefined,
      labels: quotaBannerLabels(),
    }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="quota-banner"]')!;
    const labels = quotaBannerLabels();

    const remaining = remainingUnits(args.used, args.limit);
    const fraction = spentFraction(args.used, args.limit) ?? 1;
    const percent = fractionPercent(fraction);
    const level = fractionLevel(fraction);

    const remainingEl = root.querySelector<HTMLElement>('[data-slot="quota-banner-remaining"]')!;
    const detail = root.querySelector<HTMLElement>('[data-slot="quota-banner-detail"]')!;
    const meter = root.querySelector<HTMLElement>('[data-slot="quota-banner-meter"]')!;

    await step('A faixa NÃO é região viva, e nada nela se reanuncia', async () => {
      // A contagem desce a cada turno, e anunciá-la a cada mudança corta a
      // leitura do que estiver sendo lido (decisão 2 da folha).
      await expect(root.hasAttribute('aria-live')).toBe(false);
      await expect(root.hasAttribute('role')).toBe(false);
      await expect(root.querySelector('[aria-live]')).toBeNull();
      await expect(root.querySelector('[role="status"], [role="alert"], [role="log"]')).toBeNull();
    });

    await step('A manchete diz o que RESTA, e não o que já foi', async () => {
      // É a pergunta que separa esta peça das medições irmãs: o número do
      // titular é `teto − uso`, e é ele que muda a decisão de quem lê.
      await expect(remainingEl.textContent)
        .toBe(`${remaining.toLocaleString()} ${labels.unit} ${labels.left}`);
      await expect(remainingEl.textContent).toContain(String(remaining));
    });

    await step('A cota tem nome, e o nome não aparece na tela', async () => {
      // "32 mensagens restantes" diz o que é contado, mas não de qual cota se
      // trata (decisão 4 da folha).
      const title = root.querySelector<HTMLElement>('[data-slot="quota-banner-title"]')!;
      await expect(title.textContent).toBe(labels.title);
      await expect(title.classList.contains('nds-sr-only')).toBe(true);
    });

    await step('O rodapé mantém a razão EM TEXTO, e ela é uma razão', async () => {
      // Sem este texto a barra viraria a única portadora da fração, e o limiar
      // de contraste de gráfico passaria a valer.
      await expect(detail.textContent).toBe(
        `${args.used.toLocaleString()} ${labels.of} ${args.limit.toLocaleString()} ${labels.unit}`,
      );
    });

    await step('O medidor desenha o MESMO número que a razão descreve', async () => {
      // Uma barra que discordasse do texto ao lado seriam duas respostas para
      // uma pergunta só.
      await expect(meter.style.getPropertyValue('--nds-quota-used')).toBe(String(percent));
    });

    await step('E o medidor fica FORA do que é lido, sem papel e sem valor', async () => {
      // Um segundo portador da mesma fração a faria ser lida duas vezes, uma
      // delas como controle (decisões 1 e 3 da folha).
      await expect(meter.getAttribute('aria-hidden')).toBe('true');
      await expect(meter.hasAttribute('role')).toBe(false);
      await expect(meter.hasAttribute('aria-valuenow')).toBe(false);
      await expect(meter.textContent).toBe('');
    });

    await step('O nível chega em PALAVRA, e a cor apenas acompanha', async () => {
      // Cor sozinha não descreve estado (WCAG 1.4.1, decisão 3 da folha), e
      // aqui ela está em dois lugares — moldura e medidor.
      await expect(root.dataset.level).toBe(level);
      await expect(canvas.getByText(labels.level[level])).toBeInTheDocument();
    });

    if (args.renews) {
      await step('O horizonte traz a palavra dos rótulos e a duração escrita', async () => {
        const renews = root.querySelector<HTMLElement>('[data-slot="quota-banner-renews"]')!;
        await expect(renews.textContent)
          .toBe(`${labels.renews} ${renewalIn(RENEWAL_MINUTES)}`);
      });
      return;
    }

    await step('Sem renovação, a linha do horizonte não é montada', async () => {
      await expect(root.querySelector('[data-slot="quota-banner-renews"]')).toBeNull();
    });
  },
};
