import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import { Toggle } from './index';
import { Bold, Italic, Eye, List } from 'lucide-vue-next';

const meta = {
  title: 'UI/Toggle/Variants',
  component: Toggle,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    // Sem argTypes neste arquivo: o painel Controls ficaria vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Variantes visuais do Toggle: default (sem borda), outline (com borda), rótulo visível e a escada de tamanhos.',
      },
    },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: { covers: ['accessibility.item5'] },
  render: () => ({
    components: { Toggle, Bold },
    template: `
      <Toggle aria-label="Negrito">
        <Bold aria-hidden="true" />
      </Toggle>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Negrito' });

    await step('A variante padrão é a AUSÊNCIA do atributo, não "default"', async () => {
      // Emitir `data-variant="default"` faria o mesmo componente ter dois
      // markups conforme a stack — o CSS já trata a ausência como padrão.
      await expect(toggle).toHaveAttribute('data-slot', 'toggle');
      await expect(toggle.getAttribute('data-variant')).toBe(null);
      await expect(toggle.getAttribute('data-size')).toBe(null);
    });

    await step('Sem borda, e sem estado ativo na montagem', async () => {
      await expect(parseFloat(getComputedStyle(toggle).borderTopWidth)).toBe(0);
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    });

    await step('Icon-only tem nome acessível, e o ícone não é lido', async () => {
      await expect(toggle).toHaveAttribute('aria-label', 'Negrito');
      await expect(toggle.textContent?.trim()).toBe('');
      await expect(toggle.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });
  },
};

export const Outline: Story = {
  parameters: { covers: ['visual.item3'] },
  render: () => ({
    components: { Toggle, Bold, Italic },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <Toggle aria-label="Negrito">
          <Bold aria-hidden="true" />
        </Toggle>
        <Toggle variant="outline" aria-label="Itálico">
          <Italic aria-hidden="true" />
        </Toggle>
      </div>
    `,
  }),
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

export const WithLabel: Story = {
  render: () => ({
    components: { Toggle, Eye, List },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <Toggle variant="outline">
          <Eye aria-hidden="true" />
          Mostrar ocultos
        </Toggle>
        <Toggle variant="outline" :default-value="true">
          <List aria-hidden="true" />
          Visão compacta
        </Toggle>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O texto visível já é o nome acessível — aria-label seria ruído', async () => {
      const btn = canvas.getByRole('button', { name: 'Mostrar ocultos' });
      await expect(btn.getAttribute('aria-label')).toBe(null);
      await expect(canvas.getByText('Mostrar ocultos')).toBeVisible();
    });

    await step('O estado inicial não-controlado já nasce refletido', async () => {
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

export const Sizes: Story = {
  render: () => ({
    components: { Toggle, Bold },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <Toggle variant="outline" size="sm" aria-label="Negrito pequeno">
          <Bold aria-hidden="true" />
        </Toggle>
        <Toggle variant="outline" aria-label="Negrito padrão">
          <Bold aria-hidden="true" />
        </Toggle>
        <Toggle variant="outline" size="lg" aria-label="Negrito grande">
          <Bold aria-hidden="true" />
        </Toggle>
      </div>
    `,
  }),
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
