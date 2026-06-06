import type { Meta, StoryObj } from '@storybook/html';
import { expect } from 'storybook/test';
import { createSkeleton } from './skeleton';

const meta: Meta = {
  tags: ['feedback'],
  title: 'UI/Skeleton/Variantes',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Patterns de uso do Skeleton via className: Retângulo (rounded-md, padrão), ' +
          'Círculo (rounded-full para avatares) e Linha de texto (h-3 a h-5 com largura variável).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

function buildContainer(label: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-stack nds-w-full nds-max-w-md';
  wrap.dataset.spacing = 'sm';
  wrap.setAttribute('role', 'status');
  wrap.setAttribute('aria-busy', 'true');
  wrap.setAttribute('aria-label', label);
  return wrap;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Retangulo: Story = {
  name: 'Retângulo',
  render: () => {
    const wrap = buildContainer('Carregando bloco retangular');
    const skeleton = createSkeleton({ height: '6rem', width: '100%' });
    skeleton.setAttribute('aria-hidden', 'true');
    skeleton.setAttribute('data-slot', 'skeleton');
    wrap.appendChild(skeleton);
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    await step('Skeleton retângulo renderiza com classe base nds-skeleton', async () => {
      const skeleton = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]');
      await expect(skeleton).toBeTruthy();
      await expect(skeleton).toHaveClass('nds-skeleton');
    });
  },
};

export const Circulo: Story = {
  name: 'Círculo',
  render: () => {
    const wrap = buildContainer('Carregando avatar');
    const skeleton = createSkeleton({ className: 'nds-rounded-full nds-size-12' });
    skeleton.setAttribute('aria-hidden', 'true');
    skeleton.setAttribute('data-slot', 'skeleton');
    wrap.appendChild(skeleton);
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    await step('Skeleton círculo aplica rounded-full', async () => {
      const skeleton = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]');
      await expect(skeleton).toBeTruthy();
      await expect(skeleton).toHaveClass('nds-rounded-full');
    });
  },
};

export const LinhaDeTexto: Story = {
  name: 'Linha de Texto',
  render: () => {
    const wrap = buildContainer('Carregando linhas de texto');

    const widths = ['250px', '200px', '160px'];
    widths.forEach((w) => {
      const skeleton = createSkeleton({ height: '1rem', width: w });
      skeleton.setAttribute('aria-hidden', 'true');
      skeleton.setAttribute('data-slot', 'skeleton');
      wrap.appendChild(skeleton);
    });

    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    await step('Linhas de texto: três skeletons renderizados', async () => {
      const skeletons = canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]');
      await expect(skeletons.length).toBe(3);
      await expect(skeletons[0]).toHaveClass('nds-skeleton');
    });
  },
};
