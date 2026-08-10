import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect } from 'storybook/test';
import { NdsToggle, NdsToggleIcon } from './toggle';

const meta: Meta = {
  title: 'UI/Toggle/Variantes',
  decorators: [moduleMetadata({ imports: [NdsToggle, NdsToggleIcon] })],
  parameters: {
    layout: 'padded',
    // Sem argTypes nesta story: o painel Controls ficaria vazio.
    controls: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

export const Variants: Story = {
  parameters: { covers: ['visual.item3', 'accessibility.item5'] },
  render: () => ({
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <button ndsToggle aria-label="Negrito">
          <svg ndsToggleIcon kind="bold"></svg>
        </button>
        <button ndsToggle variant="outline" aria-label="Itálico">
          <svg ndsToggleIcon kind="italic"></svg>
        </button>
        <button ndsToggle variant="outline" class="nds-w-full" aria-label="Sublinhado">
          <svg ndsToggleIcon kind="underline"></svg>
        </button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('"outline" vira data-variant; "default" é a ausência do atributo', async () => {
      // Esta é a asserção que prova o binding de input: se `variant` não
      // chegasse ao componente, os três ficariam sem `data-variant` e a linha
      // do default sozinha passaria.
      const padrao = canvas.getByRole('button', { name: 'Negrito' });
      const contorno = canvas.getByRole('button', { name: 'Itálico' });
      await expect(padrao.getAttribute('data-variant')).toBe(null);
      await expect(contorno).toHaveAttribute('data-variant', 'outline');
    });

    await step('A borda só aparece na variante outline', async () => {
      // O que separa as duas variantes é uma regra de CSS compartilhado; sem
      // esta medida, um `data-variant` correto com CSS ausente passaria.
      const padrao = canvas.getByRole('button', { name: 'Negrito' });
      const contorno = canvas.getByRole('button', { name: 'Itálico' });
      await expect(parseFloat(getComputedStyle(padrao).borderTopWidth)).toBe(0);
      await expect(parseFloat(getComputedStyle(contorno).borderTopWidth)).toBeGreaterThan(0);
    });

    await step('Toggle icon-only tem nome acessível, e o ícone não é lido', async () => {
      for (const nome of ['Negrito', 'Itálico', 'Sublinhado']) {
        const btn = canvas.getByRole('button', { name: nome });
        await expect(btn).toHaveAttribute('aria-label', nome);
        await expect(btn.textContent?.trim()).toBe('');
        await expect(btn.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
      }
    });

    await step('A classe de quem usa convive com a classe do componente', async () => {
      // O Angular mescla o `class` escrito no elemento com o `class` estático
      // do host. Sem esta asserção, um input `class` redundante (hábito de
      // `className` do React) passaria despercebido.
      const btn = canvas.getByRole('button', { name: 'Sublinhado' });
      await expect(btn).toHaveClass(/nds-toggle/);
      await expect(btn).toHaveClass(/nds-w-full/);
    });
  },
};

export const Sizes: Story = {
  render: () => ({
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <button ndsToggle variant="outline" size="sm" aria-label="Negrito pequeno">
          <svg ndsToggleIcon kind="bold"></svg>
        </button>
        <button ndsToggle variant="outline" aria-label="Negrito padrão">
          <svg ndsToggleIcon kind="bold"></svg>
        </button>
        <button ndsToggle variant="outline" size="lg" aria-label="Negrito grande">
          <svg ndsToggleIcon kind="bold"></svg>
        </button>
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
      // `data-size` certo com CSS ausente daria três caixas idênticas — é o
      // defeito que só a medida pega.
      const alturas = [sm, md, lg].map((b) => b.getBoundingClientRect().height);
      await expect(alturas[0]).toBeLessThan(alturas[1]);
      await expect(alturas[1]).toBeLessThan(alturas[2]);
    });

    await step('Sem texto, o toggle é ao menos quadrado', async () => {
      // O icon-only não tem frase para ditar a largura: quem garante a caixa é
      // o `min-width` da regra compartilhada.
      for (const btn of [sm, md, lg]) {
        const caixa = btn.getBoundingClientRect();
        await expect(caixa.width).toBeGreaterThanOrEqual(caixa.height - 1);
      }
    });
  },
};

export const WithLabel: Story = {
  render: () => ({
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <button ndsToggle variant="outline">
          <svg ndsToggleIcon kind="eye"></svg>
          Mostrar ocultos
        </button>
        <button ndsToggle variant="outline" [defaultPressed]="true">
          <svg ndsToggleIcon kind="list"></svg>
          Visão compacta
        </button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O texto visível já é o nome acessível — aria-label seria ruído', async () => {
      const btn = canvas.getByRole('button', { name: 'Mostrar ocultos' });
      await expect(btn.getAttribute('aria-label')).toBe(null);
    });

    await step('defaultPressed já nasce refletido nos dois atributos', async () => {
      // É o caso que expõe a diferença entre `pressed` (o model, ainda
      // indefinido antes do primeiro clique) e o estado real do primitivo:
      // lendo o model, este toggle sairia com data-state="off".
      const ativo = canvas.getByRole('button', { name: 'Visão compacta' });
      await expect(ativo.getAttribute('aria-pressed')).toBe('true');
      await expect(ativo).toHaveAttribute('data-state', 'on');
    });

    await step('O toggle com rótulo é mais largo que alto', async () => {
      const btn = canvas.getByRole('button', { name: 'Mostrar ocultos' });
      const caixa = btn.getBoundingClientRect();
      await expect(caixa.width).toBeGreaterThan(caixa.height);
    });
  },
};
