import type { Meta, StoryObj } from '@storybook/vue3';
import { expect } from 'storybook/test';
import { Skeleton } from './index';
import SkeletonDocs from '@/components/docs/SkeletonDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta: Meta<any> = {
  title: 'UI/Skeleton',
  component: Skeleton,
  tags: ['autodocs', 'feedback'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(SkeletonDocs),
      description: {
        component:
          'Skeleton é um placeholder visual com animate-pulse e bg-muted que replica a forma do conteúdo enquanto ele carrega. Componente passivo e decorativo (aria-hidden), sem variantes próprias — customização via className.',
      },
    },
  },
  argTypes: {
    class: {
      control: { type: 'text' },
      description: 'Classes Tailwind para definir dimensões e arredondamento (ex: h-4 w-[250px] rounded-full).',
    },
  },
  args: {
    class: 'h-4 w-[250px]',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    components: { Skeleton },
    setup() {
      return { args };
    },
    template: `
      <div
        role="status"
        aria-busy="true"
        aria-label="Carregando conteúdo de exemplo"
        class="w-[320px] space-y-3"
      >
        <Skeleton :class="args.class + ' motion-reduce:animate-none'" aria-hidden="true" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Skeleton com data-slot=skeleton está presente', async () => {
      const skeleton = canvasElement.querySelector('[data-slot="skeleton"]');
      await expect(skeleton).toBeInTheDocument();
    });

    await step('Skeleton aplica classes base animate-pulse, rounded-md, bg-muted', async () => {
      const skeleton = canvasElement.querySelector('[data-slot="skeleton"]') as HTMLElement;
      await expect(skeleton.className).toContain('animate-pulse');
      await expect(skeleton.className).toContain('rounded-md');
      await expect(skeleton.className).toContain('bg-muted');
    });

    await step('Skeleton tem aria-hidden=true', async () => {
      const skeleton = canvasElement.querySelector('[data-slot="skeleton"]');
      await expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    });

    await step('Container pai expõe aria-busy=true', async () => {
      const container = canvasElement.querySelector('[aria-busy="true"]');
      await expect(container).toBeInTheDocument();
      await expect(container).toHaveAttribute('aria-label');
    });
  },
};
