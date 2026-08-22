import type { Meta, StoryObj } from '@storybook/html-vite';
import { toggleSource, toggleSourceRow } from './toggle.source';
import { within, expect } from 'storybook/test';
import { Bold, Italic, Eye, List } from 'lucide';
import { createToggle, type ToggleOptions } from './toggle';
import { buildLucideSvg, cluster } from './toggle.fixtures';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Toggle/Variants',
  parameters: {
    layout: 'centered',
    // Sem argTypes neste arquivo: os painéis ficariam vazios.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: toggleSource },
      description: {
        component:
          'Variantes visuais do Toggle: default (sem borda), outline (com borda), rótulo visível e a escada de tamanhos.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers locais ───────────────────────────────────────────────────────────

function iconToggle(opts: {
  icon: unknown;
  'aria-label'?: string;
  texto?: string;
  pressed?: boolean;
  variant?: ToggleOptions['variant'];
  size?: ToggleOptions['size'];
}): HTMLButtonElement {
  // Ícone e texto são filhos DIRETOS: o espaço vem do `gap` do `.nds-toggle` e
  // a medida do ícone da regra `.nds-toggle > svg`.
  const filhos = opts.texto
    ? [buildLucideSvg(opts.icon), opts.texto]
    : [buildLucideSvg(opts.icon)];
  return createToggle({
    pressed: opts.pressed ?? false,
    variant: opts.variant ?? 'default',
    size: opts.size ?? 'default',
    children: filhos,
    // Texto visível dispensa aria-label — o leitor usa o conteúdo do botão.
    'aria-label': opts['aria-label'],
  });
}

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  parameters: { covers: ['accessibility.item5'] },
  render: () => iconToggle({ icon: Bold, 'aria-label': 'Negrito' }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Negrito' });

    await step('A variante padrão é a AUSÊNCIA do atributo, não "default"', async () => {
      await expect(toggle).toHaveAttribute('data-slot', 'toggle');
      await expect(toggle.getAttribute('data-variant')).toBe(null);
      await expect(toggle.getAttribute('data-size')).toBe(null);
    });

    await step('Sem borda, e sem estado ativo na montagem', async () => {
      await expect(parseFloat(getComputedStyle(toggle).borderTopWidth)).toBe(0);
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
      await expect(toggle).toHaveAttribute('data-state', 'off');
    });

    await step('Icon-only tem nome acessível, e o ícone não é lido', async () => {
      await expect(toggle).toHaveAttribute('aria-label', 'Negrito');
      await expect(toggle.textContent?.trim()).toBe('');
      await expect(toggle.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });
  },
};

// ─── Outline ──────────────────────────────────────────────────────────────────

export const Outline: Story = {
  parameters: {
    covers: ['visual.item3'],
    // Override: a story mostra o PAR (padrão ao lado de outline), e a variante
    // não passa por control nenhum neste arquivo.
    docs: {
      source: {
        transform: toggleSourceRow([
          { icon: 'Bold', 'aria-label': 'Negrito' },
          { icon: 'Italic', 'aria-label': 'Itálico', variant: 'outline' },
        ]),
      },
    },
  },
  render: () =>
    cluster(
      iconToggle({ icon: Bold, 'aria-label': 'Negrito' }),
      iconToggle({ icon: Italic, 'aria-label': 'Itálico', variant: 'outline' }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const padrao = canvas.getByRole('button', { name: 'Negrito' });
    const contorno = canvas.getByRole('button', { name: 'Itálico' });

    await step('"outline" vira data-variant; a padrão fica sem atributo', async () => {
      await expect(contorno).toHaveAttribute('data-variant', 'outline');
      await expect(padrao.getAttribute('data-variant')).toBe(null);
    });

    await step('A borda só aparece na variante outline', async () => {
      // O que separa as duas variantes é uma regra do CSS compartilhado; sem
      // esta medida, um `data-variant` correto com CSS ausente passaria.
      await expect(parseFloat(getComputedStyle(padrao).borderTopWidth)).toBe(0);
      await expect(parseFloat(getComputedStyle(contorno).borderTopWidth)).toBeGreaterThan(0);
    });
  },
};

// ─── WithLabel ────────────────────────────────────────────────────────────────

export const WithLabel: Story = {
  parameters: {
    // Override: com texto visível o nome acessível SAI — o conteúdo do botão já
    // é o nome —, e o snippet precisa mostrar exatamente isso.
    docs: {
      source: {
        transform: toggleSourceRow([
          { icon: 'Eye', label: 'Mostrar ocultos', variant: 'outline' },
          { icon: 'List', label: 'Visão compacta', variant: 'outline', pressed: true },
        ]),
      },
    },
  },
  render: () =>
    cluster(
      iconToggle({ icon: Eye, texto: 'Mostrar ocultos', variant: 'outline' }),
      iconToggle({ icon: List, texto: 'Visão compacta', variant: 'outline', pressed: true }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O texto visível já é o nome acessível — aria-label seria ruído', async () => {
      const btn = canvas.getByRole('button', { name: 'Mostrar ocultos' });
      await expect(btn.getAttribute('aria-label')).toBe(null);
      await expect(canvas.getByText('Mostrar ocultos')).toBeVisible();
    });

    await step('O estado inicial já nasce refletido nos dois atributos', async () => {
      const ativo = canvas.getByRole('button', { name: 'Visão compacta' });
      await expect(ativo).toHaveAttribute('aria-pressed', 'true');
      await expect(ativo).toHaveAttribute('data-state', 'on');
    });

    await step('O toggle com rótulo é mais largo que alto', async () => {
      const caixa = canvas
        .getByRole('button', { name: 'Mostrar ocultos' })
        .getBoundingClientRect();
      await expect(caixa.width).toBeGreaterThan(caixa.height);
    });
  },
};

// ─── Sizes ────────────────────────────────────────────────────────────────────

export const Sizes: Story = {
  parameters: {
    // Override: a escada é o assunto da story — são três chamadas, não uma.
    docs: {
      source: {
        transform: toggleSourceRow([
          { icon: 'Bold', 'aria-label': 'Negrito pequeno', size: 'sm', variant: 'outline' },
          { icon: 'Bold', 'aria-label': 'Negrito padrão', variant: 'outline' },
          { icon: 'Bold', 'aria-label': 'Negrito grande', size: 'lg', variant: 'outline' },
        ]),
      },
    },
  },
  render: () =>
    cluster(
      iconToggle({ icon: Bold, 'aria-label': 'Negrito pequeno', size: 'sm', variant: 'outline' }),
      iconToggle({ icon: Bold, 'aria-label': 'Negrito padrão', variant: 'outline' }),
      iconToggle({ icon: Bold, 'aria-label': 'Negrito grande', size: 'lg', variant: 'outline' }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sm = canvas.getByRole('button', { name: 'Negrito pequeno' });
    const md = canvas.getByRole('button', { name: 'Negrito padrão' });
    const lg = canvas.getByRole('button', { name: 'Negrito grande' });

    await step('Cada degrau emite seu data-size, e o padrão não emite nenhum', async () => {
      await expect(sm).toHaveAttribute('data-size', 'sm');
      await expect(md.getAttribute('data-size')).toBe(null);
      await expect(lg).toHaveAttribute('data-size', 'lg');
    });

    await step('A escada cresce de verdade na tela', async () => {
      const alturas = [sm, md, lg].map((b) => b.getBoundingClientRect().height);
      await expect(alturas[0]).toBeLessThan(alturas[1]);
      await expect(alturas[1]).toBeLessThan(alturas[2]);
    });

    await step('Sem texto, o toggle é ao menos quadrado e cabe no alvo de toque', async () => {
      for (const btn of [sm, md, lg]) {
        const caixa = btn.getBoundingClientRect();
        await expect(caixa.width).toBeGreaterThanOrEqual(caixa.height - 1);
        await expect(caixa.height).toBeGreaterThanOrEqual(24);
      }
    });
  },
};
