import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, userEvent, waitFor } from 'storybook/test';
import { Alert } from './index';
import AlertStory from './AlertStory.svelte';
import AlertWithoutAnnouncementStory from './AlertWithoutAnnouncementStory.svelte';
import AlertDynamicInsertionStory from './AlertDynamicInsertionStory.svelte';
import {
  alertDynamicInsertionSource,
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
  title: 'Components/Feedback/Alert/States',
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

    // Nenhum heading de nível nenhum — conferir só `h5` passaria com um título
    // renderizado em outro nível pela prop `as`.
    await step('Nenhum heading no DOM', async () => {
      const alert = canvas.getByRole('alert');
      await expect(alert.querySelector('[data-slot="alert-title"]')).toBeNull();
      await expect(alert.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
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
    Component: AlertWithoutAnnouncementStory,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('role="note" não é live region', async () => {
      const note = canvas.getByText('Nota de implementação').closest('.nds-alert');
      await expect(note).toHaveAttribute('role', 'note');
    });

    await step('Sem `role`, o default continua alert', async () => {
      const defaultAlert = canvas.getByText('Falha no envio').closest('.nds-alert');
      await expect(defaultAlert).toHaveAttribute('role', 'alert');
      await expect(canvas.getByRole('alert')).toBe(defaultAlert);
    });

    await step('A nota não aparece como alert para o leitor de tela', async () => {
      await expect(canvas.getAllByRole('alert')).toHaveLength(1);
      await expect(canvas.getByRole('note')).toBeVisible();
    });
  },
};

/**
 * O alerta entra DEPOIS de uma ação, com `role="alert"` na própria raiz. Montado
 * de saída ele provaria só a presença do papel, e não a inserção que o estado
 * descreve — por isso a story espera o clique.
 */
export const DynamicInsertion: Story = {
  parameters: {
    covers: ['functional.item6'],
    docs: { source: { transform: alertDynamicInsertionSource } },
  },
  render: () => ({ Component: AlertDynamicInsertionStory }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Antes da ação não há alerta', async () => {
      // Replay do painel Interactions: o alerta da rodada anterior ainda está
      // no DOM. A play volta ao estado inicial antes de afirmar a ausência.
      const trigger = canvas.getByRole('button', { name: 'Gerar relatório' });
      trigger.dispatchEvent(new CustomEvent('alert-story-reset', { bubbles: true }));
      await waitFor(() => expect(canvas.queryByRole('alert')).toBeNull());
    });

    await step('Depois do clique o alerta aparece com role="alert"', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Gerar relatório' }));
      const alert = await canvas.findByRole('alert');
      await expect(alert).toHaveAttribute('role', 'alert');
      await expect(alert).toBeVisible();
      await expect(within(alert).getByText('Operação concluída')).toBeVisible();
    });

    await step('Nenhum ancestral embrulha o alerta em aria-live', async () => {
      // Região viva em volta de `role="alert"` aninharia duas regiões, e o leitor
      // anunciaria a mesma mensagem duas vezes.
      const alert = canvas.getByRole('alert');
      await expect(alert.parentElement?.closest('[aria-live]') ?? null).toBeNull();
      await expect(alert).not.toHaveAttribute('aria-live');
    });
  },
};
