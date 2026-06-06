import type { Meta, StoryObj } from '@storybook/vue3';
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
  <div class="w-[280px] h-[260px] rounded-md border overflow-hidden">
    <ScrollArea ${typeAttr} class="h-full w-full">
      <div class="p-4 space-y-2">
        <a
          v-for="tag in tags"
          :key="tag"
          href="#"
          class="block text-sm rounded-sm border px-2 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

    await step('Classes de focus-ring presentes no viewport', async () => {
      const cls = viewport?.className ?? '';
      await expect(cls).toContain('focus-visible:ring');
    });
  },
};
