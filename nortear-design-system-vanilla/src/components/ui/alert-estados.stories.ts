import type { Meta, StoryObj } from '@storybook/html-vite';
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
  parameters: { covers: ['functional.item4', 'visual.item3'] },
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

export const SemAnuncio: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'md';

    // Estático: já está na tela quando a página carrega — não pode ser live region.
    const nota = createAlert({ role: 'note' });
    nota.appendChild(createAlertIcon('info'));
    nota.appendChild(createAlertTitle({ text: 'Nota de implementação' }));
    nota.appendChild(createAlertDescription({ text: 'Conteúdo estático: o leitor de tela lê na ordem do documento, sem interromper.' }));

    // Sem `role`, a factory mantém o default 'alert'.
    const padrao = createAlert({ variant: 'destructive' });
    padrao.appendChild(createAlertIcon('error'));
    padrao.appendChild(createAlertTitle({ text: 'Falha no envio' }));
    padrao.appendChild(createAlertDescription({ text: 'Mensagem urgente surgida em tempo de execução: anúncio imediato.' }));

    wrapper.appendChild(nota);
    wrapper.appendChild(padrao);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('role="note" não é live region', async () => {
      const nota = canvas.getByText('Nota de implementação').closest('.nds-alert');
      await expect(nota).toHaveAttribute('role', 'note');
    });

    await step('Sem `role`, o default continua alert', async () => {
      const padrao = canvas.getByText('Falha no envio').closest('.nds-alert');
      await expect(padrao).toHaveAttribute('role', 'alert');
      await expect(canvas.getByRole('alert')).toBe(padrao);
    });

    await step('A nota não aparece como alert para o leitor de tela', async () => {
      await expect(canvas.getAllByRole('alert')).toHaveLength(1);
      await expect(canvas.getByRole('note')).toBeVisible();
    });
  },
};

export const InsercaoDinamica: Story = {
  parameters: { covers: ['functional.item6'] },
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
