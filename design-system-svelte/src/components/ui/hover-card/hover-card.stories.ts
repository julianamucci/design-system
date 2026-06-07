import type { Meta, StoryObj } from '@storybook/svelte';
import { waitForPortal } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import HoverCardStory from './HoverCardStory.svelte';
import HoverCardDocs from '@/components/docs/HoverCardDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/HoverCard',
  component: HoverCardStory,
  tags: ['autodocs', 'overlay'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(HoverCardDocs),
      description: {
        component:
          'HoverCard construído sobre bits-ui/LinkPreview. Cartão flutuante exibido em hover/focus com delay configurável, posicionamento side/align e role=dialog.',
      },
    },
  },
  argTypes: {
    side: {
      control: 'inline-radio',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Lado de abertura do Content.',
    },
    align: {
      control: 'inline-radio',
      options: ['start', 'center', 'end'],
      description: 'Alinhamento horizontal do Content.',
    },
    openDelay: {
      control: { type: 'number', min: 0, step: 50 },
      description: 'Delay em ms antes de abrir após hover.',
    },
    closeDelay: {
      control: { type: 'number', min: 0, step: 50 },
      description: 'Delay em ms antes de fechar após cursor sair.',
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial em modo não-controlado.',
    },
    triggerLabel: {
      control: 'text',
      description: 'Texto exibido no trigger (link).',
    },
    variant: {
      control: 'select',
      options: ['default', 'withDelay', 'userProfile', 'linkPreview', 'definition', 'metric'],
      description: 'Composição interna usada na demonstração.',
    },
  },
  args: {
    side: 'bottom',
    align: 'center',
    openDelay: 0,
    closeDelay: 0,
    defaultOpen: false,
    triggerLabel: '@joana',
    variant: 'default',
  },
} satisfies Meta<typeof HoverCardStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    const waitForClose = async () => {
      await waitFor(
        () => {
          const dialog = body.queryByRole('dialog');
          if (dialog && dialog.getAttribute('data-state') !== 'closed') {
            throw new Error('hover-card still open');
          }
        },
        { timeout: 1500 }
      );
    };

    await step('1. Trigger renderiza como link', async () => {
      const trigger = canvas.getByRole('link', { name: /@joana/i });
      await expect(trigger).toBeInTheDocument();
    });

    await step('2. Foco abre Content (WCAG 1.4.13)', async () => {
      const trigger = canvas.getByRole('link', { name: /@joana/i });
      trigger.focus();
      await userEvent.hover(trigger);
      const dialog = await waitForPortal('dialog', { timeout: 2000 });
      await expect(dialog).toBeVisible();
    });

    await step('3. ESC fecha o Content (dismissable)', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForClose();
    });
  },
};
