import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { createAlert, createAlertIcon, createAlertTitle, createAlertDescription } from './alert';
import { alertDynamicInsertionSourceWith, alertSource, alertSourceWith } from './alert.source';
import { createButton } from './button';

const meta: Meta = {
  tags: ['feedback'],
  parameters: {
    design: figmaDesign('alert'),
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: alertSource } },
  },
  title: 'Components/Feedback/Alert/States',
};

export default meta;
type Story = StoryObj;

export const Complete: Story = {
  render: () => {
    const alert = createAlert();
    alert.appendChild(createAlertIcon('info'));
    alert.appendChild(createAlertTitle({ text: 'Atenção', as: 'h4' }));
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

export const WithoutTitle: Story = {
  // Override de story: a ausência do título É o assunto, e o snippet do meta
  // mostraria a composição completa.
  parameters: {
    covers: ['functional.item4', 'visual.item3'],
    docs: { source: { transform: alertSourceWith({ title: '' }) } },
  },
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

    await step('Sem título no DOM, em nenhum nível de heading', async () => {
      // Não basta procurar `h5`: o nível é configurável por `as`, e um título
      // em `h4` passaria por uma busca presa ao default.
      const alert = canvas.getByRole('alert');
      await expect(alert.querySelector('[data-slot="alert-title"]')).toBeNull();
      await expect(within(alert).queryByRole('heading')).toBeNull();
      await expect(alert.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
    });
  },
};

export const WithoutIcon: Story = {
  // Override de story: a ausência do ícone É o assunto.
  parameters: {
    docs: { source: { transform: alertSourceWith({ icon: false }) } },
  },
  render: () => {
    const alert = createAlert();
    alert.appendChild(createAlertTitle({ text: 'Atenção', as: 'h4' }));
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

export const WithoutAnnouncement: Story = {
  // Override de story: a semântica de anúncio é o assunto, e `role` não passa
  // por control neste arquivo. O snippet mostra a nota estática — o alerta
  // padrão ao lado dela é a comparação, e já é o que o meta produz.
  parameters: {
    docs: {
      source: {
        transform: alertSourceWith({
          role: 'note',
          title: 'Nota de implementação',
          description:
            'Conteúdo estático: o leitor de tela lê na ordem do documento, sem interromper.',
        }),
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'md';

    // Estático: já está na tela quando a página carrega — não pode ser live region.
    const noteAlert = createAlert({ role: 'note' });
    noteAlert.appendChild(createAlertIcon('info'));
    noteAlert.appendChild(createAlertTitle({ text: 'Nota de implementação', as: 'h4' }));
    noteAlert.appendChild(createAlertDescription({ text: 'Conteúdo estático: o leitor de tela lê na ordem do documento, sem interromper.' }));

    // Sem `role`, a factory mantém o default 'alert'.
    const defaultAlert = createAlert({ variant: 'destructive' });
    defaultAlert.appendChild(createAlertIcon('error'));
    defaultAlert.appendChild(createAlertTitle({ text: 'Falha no envio', as: 'h4' }));
    defaultAlert.appendChild(createAlertDescription({ text: 'Mensagem urgente surgida em tempo de execução: anúncio imediato.' }));

    wrapper.appendChild(noteAlert);
    wrapper.appendChild(defaultAlert);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('role="note" não é live region', async () => {
      const noteAlert = canvas.getByText('Nota de implementação').closest('.nds-alert');
      await expect(noteAlert).toHaveAttribute('role', 'note');
      await expect(noteAlert).not.toHaveAttribute('aria-live');
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

export const DynamicInsertion: Story = {
  // Override de story: aqui o assunto não é o alerta, é QUANDO ele entra — a
  // inserção em tempo de execução é outra FORMA de snippet, não uma opção da
  // fábrica.
  parameters: {
    covers: ['functional.item6'],
    docs: {
      source: {
        transform: alertDynamicInsertionSourceWith({
          icon: 'success',
          title: 'Operação concluída',
          description: 'O relatório foi gerado com sucesso.',
        }),
      },
    },
  },
  render: () => {
    // Sem contêiner `aria-live`: a raiz do alerta, com `role="alert"`, já é a
    // região viva. Envolvê-la aninharia duas regiões anunciando a mesma coisa.
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'sm';

    const trigger = createButton({
      label: 'Gerar relatório',
      variant: 'default',
      size: 'sm',
      onClick: () => {
        // Um alerta por vez: clicar de novo substitui, não empilha.
        wrapper.querySelector('[data-slot="alert"]')?.remove();
        const alert = createAlert();
        alert.appendChild(createAlertIcon('success'));
        alert.appendChild(createAlertTitle({ text: 'Operação concluída', as: 'h4' }));
        alert.appendChild(createAlertDescription({ text: 'O relatório foi gerado com sucesso.' }));
        wrapper.appendChild(alert);
      },
    });
    const triggerRow = document.createElement('div');
    triggerRow.appendChild(trigger);
    wrapper.appendChild(triggerRow);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Antes do clique não há alerta na tela', async () => {
      // Reexecução no mesmo DOM (painel Interactions): remove o alerta da rodada
      // anterior. A espera só LÊ o DOM — quem o altera é a remoção acima dela.
      canvasElement.querySelector('[data-slot="alert"]')?.remove();
      await waitFor(() => expect(canvas.queryByRole('alert')).toBeNull());
    });

    await step('Depois do clique o alerta surge com role="alert"', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Gerar relatório' }));
      const alert = await canvas.findByRole('alert');
      await expect(alert).toHaveAttribute('role', 'alert');
      await expect(alert).toBeVisible();
      await expect(within(alert).getByText('Operação concluída')).toBeVisible();
    });

    await step('Nenhum ancestral do alerta tem aria-live', async () => {
      const alert = canvas.getByRole('alert');
      await expect(alert).not.toHaveAttribute('aria-live');
      await expect(alert.parentElement?.closest('[aria-live]') ?? null).toBeNull();
    });
  },
};
