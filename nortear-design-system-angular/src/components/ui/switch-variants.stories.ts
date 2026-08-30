import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect } from 'storybook/test';
import { NdsSwitch } from './switch';
import { NdsLabel } from './label';

const meta: Meta = {
  title: 'Primitives/Form/Switch/Variants',
  tags: ['form'],
  decorators: [moduleMetadata({ imports: [NdsSwitch, NdsLabel] })],
  parameters: {
    // Sem argTypes neste arquivo: o painel Controls ficaria vazio.
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Variantes visuais do Switch: padrão, com descrição em painel e tamanho compacto.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Switch padrão — trilho de 36×20px com polegar de 16px, rótulo à direita.',
      },
    },
  },
  render: () => ({
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <button ndsSwitch id="var-default"></button>
        <label ndsLabel for="var-default">Receber notificações</label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvasElement.querySelector<HTMLElement>('#var-default')!;

    await step('O degrau padrão vira data-size', async () => {
      // Sem esta asserção, o input `size` perdido no fallback JIT passaria
      // despercebido: o elemento renderiza igual e nada mais denuncia.
      await expect(sw).toHaveAttribute('data-size', 'default');
    });

    await step('O rótulo nomeia o controle', async () => {
      await expect(canvas.getByRole('switch', { name: /Receber notificações/i })).toBe(sw);
    });
  },
};

// ─── WithDescription ──────────────────────────────────────────────────────────

export const WithDescription: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Switch em painel de configurações — texto à esquerda, controle à direita.',
      },
    },
  },
  render: () => ({
    template: `
      <div
        class="nds-cluster nds-w-sm nds-rounded-lg nds-border-default nds-p-4"
        data-align="center"
        data-justify="between"
      >
        <div class="nds-stack" data-spacing="xs">
          <label ndsLabel for="var-marketing">Emails de marketing</label>
          <p class="nds-text-body">Receba novidades e promoções da plataforma.</p>
        </div>
        <button ndsSwitch id="var-marketing"></button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvasElement.querySelector<HTMLElement>('#var-marketing')!;

    await step('O controle e a descrição auxiliar estão visíveis', async () => {
      await expect(sw).toBeVisible();
      await expect(
        canvas.getByText('Receba novidades e promoções da plataforma.'),
      ).toBeVisible();
    });

    await step('Só o rótulo nomeia o controle — a descrição fica de fora', async () => {
      // Se a descrição entrasse no nome, o leitor de tela leria a frase inteira
      // a cada passagem pelo interruptor.
      await expect(canvas.getByRole('switch', { name: /Emails de marketing/i })).toBe(sw);
      await expect(sw).not.toHaveAccessibleName(/Receba novidades/);
    });
  },
};

// ─── Sm ───────────────────────────────────────────────────────────────────────

export const Sm: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      description: {
        story:
          'Degrau compacto — trilho de 24×16px com polegar de 12px, ao lado do padrão para ' +
          'comparação. Indicado para listas e menus densos.',
      },
    },
  },
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="sm">
        <div class="nds-cluster" data-spacing="sm">
          <button ndsSwitch id="var-sm-reference"></button>
          <label ndsLabel for="var-sm-reference">Tamanho padrão</label>
        </div>
        <div class="nds-cluster" data-spacing="sm">
          <button ndsSwitch id="var-sm" size="sm"></button>
          <label ndsLabel class="nds-text-caption" for="var-sm">Tamanho compacto</label>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const padrao = canvasElement.querySelector<HTMLElement>('#var-sm-reference')!;
    const compacto = canvasElement.querySelector<HTMLElement>('#var-sm')!;

    await step('O degrau de tamanho vira data-size', async () => {
      // Sem esta asserção uma story que só renderiza passaria mesmo com o
      // input `size` perdido no fallback JIT — os dois cairiam em "default".
      await expect(padrao).toHaveAttribute('data-size', 'default');
      await expect(compacto).toHaveAttribute('data-size', 'sm');
    });

    await step('O compacto é de fato menor que o padrão', async () => {
      // O atributo sozinho não prova nada: a medida vive no CSS compartilhado,
      // e uma regra ausente deixaria os dois do mesmo tamanho com o data-size
      // certo em ambos.
      await expect(compacto.getBoundingClientRect().width).toBeLessThan(
        padrao.getBoundingClientRect().width,
      );
    });

    await step('O polegar acompanha o degrau do trilho', async () => {
      const knobDefault = padrao.querySelector<HTMLElement>('[data-slot="switch-thumb"]')!;
      const knobCompacto = compacto.querySelector<HTMLElement>('[data-slot="switch-thumb"]')!;
      await expect(knobCompacto.getBoundingClientRect().width).toBeLessThan(
        knobDefault.getBoundingClientRect().width,
      );
    });

    await step('Cada degrau tem rótulo associado ao controle', async () => {
      await expect(canvas.getByLabelText('Tamanho padrão')).toBe(padrao);
      await expect(canvas.getByLabelText('Tamanho compacto')).toBe(compacto);
    });
  },
};
