import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import { Alert } from './index';
import AlertStory from './AlertStory.svelte';
import AlertSemAnuncioStory from './AlertSemAnuncioStory.svelte';
import {
  alertInsercaoDinamicaSource,
  alertNoAnnouncementSource,
  alertNoIconSource,
  alertNoTitleSource,
  alertSource,
} from './alert.source';

const meta: Meta = {
  parameters: {
    design: figmaDesign('alert'),
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada estado que muda a
      // marcação sobrescreve com a própria composição logo abaixo.
      source: { transform: alertSource },
    },
  },
  title: 'UI/Alert/States',
  component: Alert,
  tags: ['feedback'],
};

export default meta;
type Story = StoryObj;

export const Complete: Story = {
  render: () => ({
    Component: AlertStory,
    props: {
      variant: 'default',
      title: 'Atenção',
      description: 'Suas alterações serão aplicadas na próxima sessão.',
      showIcon: true,
      icon: 'info',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Role alert presente', async () => {
      await expect(canvas.getByRole('alert')).toBeInTheDocument();
    });

    await step('AlertTitle e AlertDescription visíveis', async () => {
      await expect(canvas.getByText('Atenção')).toBeVisible();
      await expect(canvas.getByText(/próxima sessão/)).toBeVisible();
    });
  },
};

export const WithoutTitle: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item3'],
    docs: { source: { transform: alertNoTitleSource } },
  },
  render: () => ({
    Component: AlertStory,
    props: {
      variant: 'default',
      title: '',
      description: 'Suas alterações serão aplicadas na próxima sessão.',
      showIcon: true,
      icon: 'info',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Alert visível sem título', async () => {
      await expect(canvas.getByRole('alert')).toBeVisible();
    });

    await step('Sem elemento de título no DOM', async () => {
      const alert = canvas.getByRole('alert');
      const heading = alert.querySelector('[data-slot="alert-title"]');
      await expect(heading).toBeNull();
    });
  },
};

export const WithoutIcon: Story = {
  parameters: {
    docs: { source: { transform: alertNoIconSource } },
  },
  render: () => ({
    Component: AlertStory,
    props: {
      variant: 'default',
      title: 'Atenção',
      description: 'Suas alterações serão aplicadas na próxima sessão.',
      showIcon: false,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Alert visível sem ícone', async () => {
      await expect(canvas.getByRole('alert')).toBeVisible();
    });

    await step('Sem SVG filho direto no alert', async () => {
      const alert = canvas.getByRole('alert');
      const svg = alert.querySelector(':scope > svg');
      await expect(svg).toBeNull();
    });
  },
};

// Alert estático não pode ser live region: com o `role="alert"` padrão o leitor
// de tela interrompe a leitura e salta para o alert no carregamento da página.
// `role="note"` remove o anúncio sem mexer no visual — e o default segue `alert`.
export const WithoutAnnouncement: Story = {
  parameters: {
    docs: { source: { transform: alertNoAnnouncementSource } },
  },
  render: () => ({
    Component: AlertSemAnuncioStory,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Alert estático usa role="note" — não é live region', async () => {
      const nota = canvas.getByRole('note');
      await expect(nota).toHaveAttribute('role', 'note');
      await expect(canvas.getByText(/não deve ser anunciado/)).toBeVisible();
    });

    await step('Sem a prop, o padrão continua role="alert"', async () => {
      const alerts = canvas.getAllByRole('alert');
      await expect(alerts).toHaveLength(1);
      await expect(alerts[0]).toHaveAttribute('role', 'alert');
    });
  },
};

export const DynamicInsertion: Story = {
  parameters: {
    covers: ['functional.item6'],
    docs: { source: { transform: alertInsercaoDinamicaSource } },
  },
  render: () => ({
    Component: AlertStory,
    props: {
      variant: 'default',
      title: 'Operação concluída',
      description: 'O relatório foi gerado com sucesso.',
      showIcon: true,
      icon: 'success',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Role alert presente', async () => {
      await expect(canvas.getByRole('alert')).toBeInTheDocument();
    });

    await step('Alert está visível', async () => {
      await expect(canvas.getByRole('alert')).toBeVisible();
    });
  },
};
