import type { Meta, StoryObj } from '@storybook/svelte';

import { expect } from 'storybook/test';
import SkeletonStory from './SkeletonStory.svelte';
import SkeletonDocs from '@/components/docs/SkeletonDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Skeleton',
  component: SkeletonStory,
  tags: ['autodocs', 'feedback'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(SkeletonDocs),
      description: {
        component:
          'Placeholder visual com animate-pulse que replica a estrutura do conteúdo enquanto ele carrega.',
      },
    },
  },
  argTypes: {
    class: {
      control: { type: 'text' },
      description:
        'Classes Tailwind para definir dimensões e arredondamento (ex: h-4 w-[250px], h-12 w-12 rounded-full).',
    },
  },
  args: {
    class: 'h-4 w-[250px]',
  },
} satisfies Meta<typeof SkeletonStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ canvasElement, step }) => {
    await step('Skeleton com data-slot está presente', async () => {
      const sk = canvasElement.querySelector('[data-slot="skeleton"]');
      await expect(sk).toBeInTheDocument();
    });

    await step('Aplica classes base (animate-pulse, rounded-md, bg-muted)', async () => {
      const sk = canvasElement.querySelector('[data-slot="skeleton"]') as HTMLElement;
      await expect(sk.className).toMatch(/animate-pulse/);
      await expect(sk.className).toMatch(/rounded-md/);
      await expect(sk.className).toMatch(/bg-muted/);
    });

    await step('Skeleton possui aria-hidden=true', async () => {
      const sk = canvasElement.querySelector('[data-slot="skeleton"]');
      await expect(sk).toHaveAttribute('aria-hidden', 'true');
    });

    await step('Container pai possui aria-busy=true', async () => {
      const container = canvasElement.querySelector('[aria-busy="true"]');
      await expect(container).toBeInTheDocument();
    });
  },
};
