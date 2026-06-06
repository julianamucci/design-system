import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import { Table } from './index';
import TableVarianteBasica from './TableVarianteBasica.svelte';
import TableVarianteComRodape from './TableVarianteComRodape.svelte';
import TableVarianteCaptionSrOnly from './TableVarianteCaptionSrOnly.svelte';
import TableVarianteComAcoes from './TableVarianteComAcoes.svelte';

const meta = {
  title: 'UI/Table/Variantes',
  component: Table,
  tags: ['tables'],
  parameters: {
    controls: { disable: true },
  },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basica: Story = {
  render: () => ({
    Component: TableVarianteBasica,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    await step('table presente com thead e tbody', async () => {
      await expect(canvasElement.querySelector('table')).toBeInTheDocument();
      await expect(canvasElement.querySelector('thead')).toBeInTheDocument();
      await expect(canvasElement.querySelector('tbody')).toBeInTheDocument();
    });
    await step('TableHead tem scope="col"', async () => {
      const ths = canvasElement.querySelectorAll('th');
      for (const th of ths) {
        await expect(th).toHaveAttribute('scope', 'col');
      }
    });
  },
};

export const ComRodape: Story = {
  render: () => ({
    Component: TableVarianteComRodape,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    await step('tfoot presente', async () => {
      const tfoot = canvasElement.querySelector('tfoot');
      await expect(tfoot).toBeInTheDocument();
    });
    await step('Total visível no rodapé', async () => {
      const canvas = within(canvasElement);
      await expect(canvas.getByText('Total')).toBeVisible();
    });
  },
};

export const CaptionSrOnly: Story = {
  render: () => ({
    Component: TableVarianteCaptionSrOnly,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    await step('caption presente no DOM com classe sr-only', async () => {
      const caption = canvasElement.querySelector('caption');
      await expect(caption).toBeInTheDocument();
      await expect(caption).toHaveClass('sr-only');
    });
  },
};

export const ComAcoesPorLinha: Story = {
  render: () => ({
    Component: TableVarianteComAcoes,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    await step('Botões de ação com aria-label contextual', async () => {
      const buttons = canvasElement.querySelectorAll('button[aria-label]');
      await expect(buttons.length).toBeGreaterThan(0);
      for (const btn of buttons) {
        await expect(btn.getAttribute('aria-label')).toMatch(/fatura/i);
      }
    });
  },
};
