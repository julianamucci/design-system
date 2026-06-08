import type { Meta, StoryObj } from '@storybook/svelte';
import { waitForPortal } from '@/lib/wait-for-portal';

import { within, expect, waitFor } from 'storybook/test';
import HoverCardStory from './HoverCardStory.svelte';

const meta = {
  title: 'UI/HoverCard/Composicoes',
  component: HoverCardStory,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes do HoverCard: preview de perfil, preview de link, definição de termo e métrica explicada.',
      },
    },
  },
} satisfies Meta<typeof HoverCardStory>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseArgs = {
  defaultOpen: true,
  openDelay: 0,
  closeDelay: 0,
} as const;

const waitOpen = async () => {
  const body = within(document.body);
  await waitFor(
    async () => {
      const dialog = await waitForPortal('dialog');
      expect(dialog).toBeVisible();
    },
    { timeout: 2000 }
  );
};

export const PerfilDeUsuario: Story = {
  name: 'Preview de perfil',
  args: {
    ...baseArgs,
    variant: 'userProfile',
    triggerLabel: '@joana',
  },
  play: async () => {
    await waitOpen();
    const body = within(document.body);
    await expect(body.getByText(/Joana Silva/)).toBeInTheDocument();
    await expect(body.getByText(/142 seguidores/)).toBeInTheDocument();
  },
};

export const PreviewDeLink: Story = {
  name: 'Preview de link externo',
  args: {
    ...baseArgs,
    variant: 'linkPreview',
    triggerLabel: 'design-system.dev',
  },
  play: async () => {
    await waitOpen();
    const body = within(document.body);
    await expect(body.getByText(/Guia de overlays acessíveis/)).toBeInTheDocument();
  },
};

export const DefinicaoDeTermo: Story = {
  name: 'Definição contextual',
  args: {
    ...baseArgs,
    variant: 'definition',
    triggerLabel: 'WCAG 2.1',
  },
  play: async () => {
    await waitOpen();
    const body = within(document.body);
    await expect(body.getByText(/Web Content Accessibility Guidelines/)).toBeInTheDocument();
  },
};

export const MetricaExplicada: Story = {
  name: 'Métrica explicada',
  args: {
    ...baseArgs,
    variant: 'metric',
    triggerLabel: '3,42%',
  },
  play: async () => {
    await waitOpen();
    const body = within(document.body);
    await expect(body.getByText(/Conversão \(últimos 30d\)/)).toBeInTheDocument();
  },
};
