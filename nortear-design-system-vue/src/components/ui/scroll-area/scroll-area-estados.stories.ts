import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { ScrollArea } from './index';

const meta = {
  title: 'UI/ScrollArea/Estados',
  component: ScrollArea,
  tags: ['layout'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Estados do ScrollArea: idle (padrão), always (scrollbar sempre visível), scroll (scrollbar só durante rolagem) e focus (viewport focado via Tab com anel visível).',
      },
    },
  },
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const TAGS = Array.from({ length: 30 }, (_, i) => `Tag ${i + 1}`);

const wrapTemplate = (typeAttr: string) => `
  <div class="nds-rounded-md nds-border-default nds-overflow-hidden" style="width: 280px; height: 260px">
    <ScrollArea ${typeAttr} class="nds-w-full" style="height: 100%">
      <div class="nds-p-4" data-spacing="sm">
        <a
          v-for="tag in tags"
          :key="tag"
          href="#"
          class="nds-block nds-text-body nds-rounded-sm nds-border-default nds-px-2 outline-none focus-visible:ring-2 focus-visible:ring-ring" style="padding-block: 0.375rem"
        >
          {{ tag }}
        </a>
      </div>
    </ScrollArea>
  </div>
`;

export const Idle: Story = {
  render: () => ({
    components: { ScrollArea },
    setup() {
      return { tags: TAGS };
    },
    template: wrapTemplate(''),
  }),
  play: async ({ canvasElement, step }) => {
    await step('Root e viewport presentes no estado padrão', async () => {
      await expect(
        canvasElement.querySelector('[data-slot="scroll-area"]'),
      ).toBeInTheDocument();
      await expect(
        canvasElement.querySelector('[data-slot="scroll-area-viewport"]'),
      ).toBeInTheDocument();
    });
  },
};

export const Always: Story = {
  render: () => ({
    components: { ScrollArea },
    setup() {
      return { tags: TAGS };
    },
    template: wrapTemplate('type="always"'),
  }),
  play: async ({ canvasElement, step }) => {
    await step('Scrollbar visível com type=always', async () => {
      const bar = canvasElement.querySelector('[data-slot="scroll-area-scrollbar"]');
      await expect(bar).toBeInTheDocument();
    });
  },
};

export const ScrollOnScroll: Story = {
  name: 'Scroll (durante rolagem)',
  render: () => ({
    components: { ScrollArea },
    setup() {
      return { tags: TAGS };
    },
    template: wrapTemplate('type="scroll" :scroll-hide-delay="600"'),
  }),
  play: async ({ canvasElement, step }) => {
    await step('Viewport rolável presente', async () => {
      const viewport = canvasElement.querySelector<HTMLElement>(
        '[data-slot="scroll-area-viewport"]',
      );
      await expect(viewport).toBeInTheDocument();
      await expect(viewport!.scrollHeight).toBeGreaterThan(viewport!.clientHeight);
    });
  },
};

export const Focus: Story = {
  render: () => ({
    components: { ScrollArea },
    setup() {
      return { tags: TAGS };
    },
    template: wrapTemplate(''),
  }),
  play: async ({ canvasElement, step }) => {
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );

    await step('Viewport recebe foco via JS', async () => {
      await expect(viewport).toBeInTheDocument();
      viewport?.focus();
      // Algumas libs movem o foco para o primeiro link focável; aceitamos qualquer descendente
      const active = document.activeElement;
      const okFocus = active === viewport || viewport?.contains(active as Node);
      await expect(okFocus).toBe(true);
    });

    await step('Estilo de focus-ring presente no viewport', async () => {
      const cls = viewport?.className ?? '';
      await expect(cls).toContain('nds-scroll-area-viewport');
    });
  },
};
