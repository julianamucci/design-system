import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect } from 'storybook/test';
import { NdsSeparator, type SeparatorOrientation } from './separator';
import { NdsSeparatorDocs } from '@/components/docs/SeparatorDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type SeparatorArgs = {
  orientation: SeparatorOrientation;
  decorative: boolean;
};

const meta: Meta<SeparatorArgs> = {
  title: 'UI/Separator',
  tags: ['autodocs', 'layout'],
  decorators: [moduleMetadata({ imports: [NdsSeparator] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsSeparatorDocs) },
  },
  argTypes: {
    orientation: {
      control: { type: 'inline-radio' },
      options: ['horizontal', 'vertical'],
      description: 'Direção do divisor.',
    },
    decorative: {
      control: 'boolean',
      description:
        'Quando true (padrão), aplica role=none e aria-hidden. Quando false, expõe role=separator + aria-orientation.',
    },
  },
  args: {
    orientation: 'horizontal',
    decorative: true,
  },
};

export default meta;
type Story = StoryObj<SeparatorArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: ['functional.item1', 'functional.item2', 'accessibility.item1', 'accessibility.item2'],
  },
  render: (args) => ({
    props: { ...args, isHorizontal: args.orientation === 'horizontal' },
    template: `
      @if (isHorizontal) {
        <div class="nds-stack nds-w-full nds-max-w-md" data-spacing="md">
          <p class="nds-text-body">Seção superior</p>
          <div ndsSeparator [orientation]="orientation" [decorative]="decorative"></div>
          <p class="nds-text-body">Seção inferior</p>
        </div>
      } @else {
        <div class="nds-cluster nds-w-full nds-max-w-md" style="height: 4rem">
          <span class="nds-text-body">Item A</span>
          <div ndsSeparator [orientation]="orientation" [decorative]="decorative"></div>
          <span class="nds-text-body nds-text-muted-foreground">Item B</span>
        </div>
      }
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const _canvas = within(canvasElement);

    await step('Renderiza um divisor com .nds-separator', async () => {
      const separator = canvasElement.querySelector<HTMLElement>('.nds-separator');
      await expect(separator).toBeTruthy();
      // Prova que o input `orientation` chegou ao componente: sem AOT o binding
      // cai em silêncio no default e este atributo não acompanharia o control.
      await expect(separator).toHaveAttribute('data-orientation', args.orientation);
    });

    if (args.decorative) {
      await step('Modo decorativo: role=none e aria-hidden', async () => {
        const separator = canvasElement.querySelector<HTMLElement>('[role="none"]');
        await expect(separator).toBeTruthy();
        await expect(separator).toHaveAttribute('aria-hidden', 'true');
      });
    } else {
      await step('Modo semântico: role=separator e aria-orientation', async () => {
        const separator = canvasElement.querySelector<HTMLElement>('[role="separator"]');
        await expect(separator).toBeTruthy();
        await expect(separator).toHaveAttribute('aria-orientation', args.orientation);
      });
    }
  },
};
