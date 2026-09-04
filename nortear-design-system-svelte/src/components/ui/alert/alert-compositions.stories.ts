import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, userEvent } from 'storybook/test';
import { Alert } from './index';
import AlertStory from './AlertStory.svelte';
import AlertAcaoStory from './AlertAcaoStory.svelte';
import AlertClasseAdicionalStory from './AlertClasseAdicionalStory.svelte';
import {
  alertClassNameAdicionalSource,
  alertWithActionSource,
  alertNoIconSource,
  alertSource,
} from './alert.source';

const meta: Meta = {
  parameters: {
    design: figmaDesign('alert'),
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; a composição que aninha
      // outro componente sobrescreve com a própria marcação logo abaixo.
      source: { transform: alertSource },
    },
  },
  title: 'Components/Feedback/Alert/Compositions',
  component: Alert,
  tags: ['feedback'],
};

export default meta;
type Story = StoryObj;

export const WithIcon: Story = {
  parameters: { covers: ['functional.item3', 'accessibility.item2'] },
  render: () => ({
    Component: AlertStory,
    props: {
      title: 'Informação',
      description: 'Ícone SVG posicionado automaticamente.',
      showIcon: true,
      icon: 'info',
    },
  }),

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = await canvas.findByRole('alert');
    await expect(alert.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    await expect(canvas.getByText('Informação')).toBeVisible();
  },
};

export const WithAction: Story = {
  parameters: {
    docs: { source: { transform: alertWithActionSource } },
  },
  render: () => ({ Component: AlertAcaoStory }),

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A ação fica acessível como botão dentro do alert', async () => {
      const alert = await canvas.findByRole('alert');
      await expect(within(alert).getByRole('button', { name: 'Atualizar' })).toBeVisible();
    });

    await step('O slot de ação usa a classe do componente', async () => {
      const action = canvasElement.querySelector('[data-slot="alert-action"]');
      await expect(action).toHaveClass('nds-alert-action');
    });

    // `accessibility.keyboard` documenta Tab e Enter. O alert em si não é
    // focável — o Tab tem que chegar direto ao botão interno.
    await step('Tab leva o foco ao botão interno', async () => {
      const alert = await canvas.findByRole('alert');
      await expect(alert).not.toHaveAttribute('tabindex');
      await userEvent.tab();
      await expect(within(alert).getByRole('button', { name: 'Atualizar' })).toHaveFocus();
    });
  },
};

/**
 * Extensibilidade documentada: todos os subcomponentes aceitam classe do
 * consumidor, e ela SOMA às do design system — não substitui.
 */
export const AdditionalClass: Story = {
  parameters: {
    docs: { source: { transform: alertClassNameAdicionalSource } },
  },
  render: () => ({ Component: AlertClasseAdicionalStory }),

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A classe do consumidor soma à do design system', async () => {
      const alert = await canvas.findByRole('alert');
      await expect(alert).toHaveClass('nds-alert', 'nds-w-full');

      const slots = [
        ['alert-title', 'nds-alert-title', 'nds-w-full'],
        ['alert-description', 'nds-alert-description', 'nds-w-full'],
        ['alert-action', 'nds-alert-action', 'nds-w-auto'],
      ] as const;
      for (const [slot, base, extra] of slots) {
        await expect(alert.querySelector(`[data-slot="${slot}"]`)).toHaveClass(base, extra);
      }
    });
  },
};

export const WithoutIcon: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: { source: { transform: alertNoIconSource } },
  },
  render: () => ({
    Component: AlertStory,
    props: {
      title: 'Sem ícone',
      description: 'Alert sem ícone mantém layout de coluna única.',
      showIcon: false,
    },
  }),

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = await canvas.findByRole('alert');
    await expect(alert.querySelector('svg')).toBeNull();
    await expect(canvas.getByText('Sem ícone')).toBeVisible();
  },
};
