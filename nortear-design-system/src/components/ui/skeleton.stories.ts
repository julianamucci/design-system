import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createSkeleton } from './skeleton';
import { createSkeletonDocs } from '@/components/docs/SkeletonDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type SkeletonArgs = {
  className: string;
};

const meta: Meta<SkeletonArgs> = {
  title: 'UI/Skeleton',
  tags: ['autodocs', 'feedback'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createSkeletonDocs) },
  },
  argTypes: {
    className: {
      control: 'text',
      description:
        'Classes Tailwind para definir dimensões e arredondamento do placeholder (ex: h-4 w-[250px], h-12 w-12 rounded-full).',
    },
  },
  args: {
    className: 'nds-skeleton-line',
  },
};

export default meta;
type Story = StoryObj<SkeletonArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const container = document.createElement('div');
    container.className = 'nds-w-full nds-max-w-md';
    container.setAttribute('role', 'status');
    container.setAttribute('aria-busy', 'true');
    container.setAttribute('aria-label', 'Carregando conteúdo');

    const skeleton = createSkeleton({ className: args.className });
    skeleton.setAttribute('aria-hidden', 'true');
    skeleton.setAttribute('data-slot', 'skeleton');

    container.appendChild(skeleton);
    return container;
  },
  play: async ({ canvasElement, step }) => {
    const _canvas = within(canvasElement);

    await step('Renderiza um Skeleton com classe nds-skeleton', async () => {
      const skeleton = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]');
      await expect(skeleton).toBeTruthy();
      await expect(skeleton).toHaveClass('nds-skeleton');
    });

    await step('Skeleton recebe aria-hidden=true', async () => {
      const skeleton = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton"]');
      await expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    });

    await step('Container pai expõe aria-busy=true', async () => {
      const container = canvasElement.querySelector<HTMLElement>('[aria-busy="true"]');
      await expect(container).toBeTruthy();
      await expect(container).toHaveAttribute('aria-label');
    });
  },
};
