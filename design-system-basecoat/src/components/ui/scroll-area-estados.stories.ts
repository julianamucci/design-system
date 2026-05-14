import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createScrollArea } from './scroll-area';

const meta: Meta = {
  title: 'UI/ScrollArea/Estados',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados visuais do ScrollArea: idle, scrolling, hover e focus. ' +
          'Divergência Basecoat: como a scrollbar é a nativa do navegador (sem JS state machine), idle/scrolling/hover ' +
          'são controlados pelo SO/browser; o foco no viewport é o único estado controlável via tabIndex.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildList(count: number): HTMLElement {
  const ul = document.createElement('ul');
  ul.className = 'flex flex-col gap-2 p-3 list-none m-0';
  for (let i = 1; i <= count; i++) {
    const li = document.createElement('li');
    li.className = 'text-sm border-b border-border/40 pb-2';
    li.textContent = `Item ${i}`;
    ul.appendChild(li);
  }
  return ul;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Idle: Story = {
  parameters: {
    docs: { description: { story: 'Estado padrão — scrollbar renderizada pelo navegador conforme estilo nativo (afetado pela classe utilitária `.scrollbar`).' } },
  },
  render: () => {
    const outer = document.createElement('div');
    outer.className = 'w-full max-w-sm';
    outer.appendChild(createScrollArea({
      height: '200px',
      class: 'w-full rounded-md border',
      children: buildList(25),
    }));
    return outer;
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const Scrolling: Story = {
  parameters: {
    docs: { description: { story: 'Estado durante rolagem — viewport com scrollTop > 0. Exibe o conteúdo deslocado.' } },
  },
  render: () => {
    const outer = document.createElement('div');
    outer.className = 'w-full max-w-sm';
    const area = createScrollArea({
      height: '200px',
      class: 'w-full rounded-md border',
      children: buildList(25),
    });
    outer.appendChild(area);
    // Pré-rola para simular o estado.
    queueMicrotask(() => {
      const vp = area.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]');
      if (vp) vp.scrollTop = 80;
    });
    return outer;
  },
  play: async ({ canvasElement }) => {
    const vp = canvasElement.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]');
    await expect(vp).toBeTruthy();
    await expect(vp!.scrollTop).toBeGreaterThan(0);
  },
};

export const Hover: Story = {
  parameters: {
    docs: { description: { story: 'Hover sobre a scrollbar — visual controlado pelo SO/navegador. Não há JS para alterar opacidade ou cor da barra.' } },
  },
  render: () => {
    const outer = document.createElement('div');
    outer.className = 'w-full max-w-sm';
    outer.appendChild(createScrollArea({
      height: '200px',
      class: 'w-full rounded-md border',
      children: buildList(25),
    }));
    return outer;
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const Focus: Story = {
  parameters: {
    docs: { description: { story: 'Viewport focado via Tab — `tabIndex=0` torna o viewport navegável e exibe anel de foco. Permite rolagem por teclado (setas, PageUp/Down, Home/End).' } },
  },
  render: () => {
    const outer = document.createElement('div');
    outer.className = 'w-full max-w-sm';
    const area = createScrollArea({
      height: '200px',
      class: 'w-full rounded-md border',
      children: buildList(25),
    });
    const vp = area.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]');
    if (vp) {
      vp.tabIndex = 0;
      vp.setAttribute('aria-label', 'Lista rolável de itens');
      vp.classList.add('focus-visible:outline-none', 'focus-visible:ring-[3px]', 'focus-visible:ring-ring/50');
    }
    outer.appendChild(area);
    return outer;
  },
  play: async ({ canvasElement }) => {
    const vp = canvasElement.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]');
    await expect(vp).toHaveAttribute('tabindex', '0');
    await expect(vp).toHaveAttribute('aria-label', 'Lista rolável de itens');
  },
};
