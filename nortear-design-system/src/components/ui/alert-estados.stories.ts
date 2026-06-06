import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createAlert, createAlertIcon, createAlertTitle, createAlertDescription } from './alert';

const meta: Meta = {
  tags: ['feedback'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
  title: 'UI/Alert/Estados',
};

export default meta;
type Story = StoryObj;

export const Completo: Story = {
  render: () => {
    const alert = createAlert();
    alert.appendChild(createAlertIcon('info'));
    alert.appendChild(createAlertTitle({ text: 'Atenção' }));
    alert.appendChild(createAlertDescription({ text: 'Suas alterações serão aplicadas na próxima sessão.' }));
    return alert;
  },
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

export const SemTitulo: Story = {
  render: () => {
    const alert = createAlert();
    alert.appendChild(createAlertIcon('info'));
    alert.appendChild(createAlertDescription({ text: 'Suas alterações serão aplicadas na próxima sessão.' }));
    return alert;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Alert visível sem título', async () => {
      await expect(canvas.getByRole('alert')).toBeVisible();
    });

    await step('Sem elemento de título no DOM', async () => {
      const alert = canvas.getByRole('alert');
      const h5 = alert.querySelector('h5');
      await expect(h5).toBeNull();
    });
  },
};

export const SemIcone: Story = {
  render: () => {
    const alert = createAlert();
    alert.appendChild(createAlertTitle({ text: 'Atenção' }));
    alert.appendChild(createAlertDescription({ text: 'Suas alterações serão aplicadas na próxima sessão.' }));
    return alert;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Alert visível', async () => {
      await expect(canvas.getByRole('alert')).toBeVisible();
    });

    await step('Sem SVG filho direto no alert', async () => {
      const alert = canvas.getByRole('alert');
      const svg = alert.querySelector(':scope > svg');
      await expect(svg).toBeNull();
    });
  },
};

export const InsercaoDinamica: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('aria-live', 'polite');
    const alert = createAlert();
    alert.appendChild(createAlertIcon('success'));
    alert.appendChild(createAlertTitle({ text: 'Operação concluída' }));
    alert.appendChild(createAlertDescription({ text: 'O relatório foi gerado com sucesso.' }));
    wrapper.appendChild(alert);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Alert dentro de região aria-live', async () => {
      const liveRegion = canvasElement.querySelector('[aria-live="polite"]');
      await expect(liveRegion).toBeInTheDocument();
    });

    await step('Role alert presente na região live', async () => {
      await expect(canvas.getByRole('alert')).toBeVisible();
    });
  },
};
