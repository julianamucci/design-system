import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { createAlert, createAlertAction, createAlertIcon, createAlertTitle, createAlertDescription } from './alert';
import { alertWithActionSourceWith, alertSource, alertSourceWith } from './alert.source';
import { createButton } from './button';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { measureActionDismiss } from '@shared/testing/alert-probe';

const meta: Meta = {
  tags: ['feedback'],
  parameters: {
    design: figmaDesign('alert'),
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: alertSource } },
  },
  title: 'Components/Feedback/Alert/Compositions',
};

export default meta;
type Story = StoryObj;

export const WithIcon: Story = {
  parameters: {
    covers: ['functional.item3', 'accessibility.item2'],
    // Override de story: o snippet do meta cai nos textos padrão da fábrica, e
    // o painel Code tem de mostrar a mensagem que a story renderiza.
    docs: {
      source: {
        transform: alertSourceWith({
          icon: 'info',
          title: 'Informação',
          description: 'Ícone SVG posicionado automaticamente.',
        }),
      },
    },
  },
  render: () => {
    const alert = createAlert();
    alert.appendChild(createAlertIcon('info'));
    alert.appendChild(createAlertTitle({ text: 'Informação' }));
    alert.appendChild(createAlertDescription({ text: 'Ícone SVG posicionado automaticamente.' }));
    return alert;
  },

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');
    await expect(alert.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    await expect(canvas.getByText('Informação')).toBeVisible();
  },
};

// ─── Com Ação ────────────────────────────────────────────────────────────────

export const WithAction: Story = {
  // Override de story: o slot de ação é uma sub-fábrica que nasce vazia, e é
  // ela o assunto — o snippet do meta a esconderia por inteiro.
  parameters: {
    docs: {
      source: {
        transform: alertWithActionSourceWith({
          action: 'Atualizar',
          title: 'Atualização disponível',
          description: 'Uma nova versão está pronta para instalação.',
        }),
      },
    },
  },
  render: () => {
    const alert = createAlert();
    alert.appendChild(createAlertIcon('info'));
    alert.appendChild(createAlertTitle({ text: 'Atualização disponível' }));
    alert.appendChild(createAlertDescription({ text: 'Uma nova versão está pronta para instalação.' }));

    const action = createAlertAction();
    action.appendChild(createButton({ label: 'Atualizar', variant: 'default', size: 'sm' }));
    alert.appendChild(action);

    return alert;
  },

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A ação fica acessível como botão dentro do alert', async () => {
      const alert = canvas.getByRole('alert');
      await expect(within(alert).getByRole('button', { name: 'Atualizar' })).toBeVisible();
    });

    await step('O slot de ação usa a classe do componente', async () => {
      const action = canvasElement.querySelector('[data-slot="alert-action"]');
      await expect(action).toHaveClass('nds-alert-action');
    });

    // `accessibility.keyboard` documenta Tab e Enter. O alert em si não é
    // focável — o Tab tem que chegar direto ao botão interno.
    await step('Tab leva o foco ao botão interno', async () => {
      const alert = canvas.getByRole('alert');
      await expect(alert).not.toHaveAttribute('tabindex');
      await userEvent.tab();
      await expect(within(alert).getByRole('button', { name: 'Atualizar' })).toHaveFocus();
    });
  },
};

/**
 * Extensibilidade documentada: todas as factories aceitam `className`, e ela
 * SOMA às classes do design system — não substitui.
 *
 * `nds-w-full` (block, já ocupa a largura) e `nds-w-auto` no slot de ação
 * (coluna `auto` do grid, já com a largura do botão) são inertes de propósito: a story prova
 * a composição de classes sem mexer no snapshot visual.
 */
export const AdditionalClass: Story = {
  // Override de story: a classe do consumidor É o assunto, e ela só aparece na
  // chamada da fábrica.
  parameters: {
    docs: {
      source: {
        transform: alertWithActionSourceWith({
          className: 'nds-w-full',
          action: 'Ação',
          title: 'Classe adicional',
          description: 'A classe do consumidor convive com as do design system.',
        }),
      },
    },
  },
  render: () => {
    const alert = createAlert({ className: 'nds-w-full' });
    alert.appendChild(createAlertIcon('info'));
    alert.appendChild(createAlertTitle({ text: 'Classe adicional', className: 'nds-w-full' }));
    alert.appendChild(createAlertDescription({
      text: 'A classe do consumidor convive com as do design system.',
      className: 'nds-w-full',
    }));

    const action = createAlertAction({ className: 'nds-w-auto' });
    action.appendChild(createButton({ label: 'Ação', variant: 'default', size: 'sm' }));
    alert.appendChild(action);

    return alert;
  },

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A classe do consumidor soma à do design system', async () => {
      const alert = canvas.getByRole('alert');
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
  // Override de story: a ausência do ícone É o assunto.
  parameters: {
    covers: ['visual.item4'],
    docs: {
      source: {
        transform: alertSourceWith({
          icon: false,
          title: 'Sem ícone',
          description: 'Alert sem ícone mantém layout de coluna única.',
        }),
      },
    },
  },
  render: () => {
    const alert = createAlert();
    alert.appendChild(createAlertTitle({ text: 'Sem ícone' }));
    alert.appendChild(createAlertDescription({ text: 'Alert sem ícone mantém layout de coluna única.' }));
    return alert;
  },

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');
    await expect(alert.querySelector('svg')).toBeNull();
    await expect(canvas.getByText('Sem ícone')).toBeVisible();
  },
};

// ─── Com ação e botão de fechar ──────────────────────────────────────────────

/**
 * Ação e X no mesmo alerta. Até 2026-09-14 a folha os tratava como mutuamente
 * exclusivos. Hoje a ação é a terceira coluna do grid, com a largura do botão, e
 * o X segue no canto, na margem interna que a folha reserva para ele à direita;
 * a sonda lê CAIXAS, não classes, e é ela que prova que nada se sobrepõe.
 */
export const WithActionAndDismiss: Story = {
  parameters: {
    covers: ['functional.item8', 'visual.item6'],
    // Override de story: a ação e o fechamento só aparecem juntos na chamada da
    // fábrica com `dismissible` e na sub-fábrica do slot de ação.
    docs: {
      source: {
        transform: alertWithActionSourceWith({
          dismissible: true,
          action: 'Salvar agora',
          title: 'Sessão expira em 5 minutos',
          description: 'Salve seu trabalho para não perder as alterações.',
        }),
      },
    },
  },
  render: () => {
    const alert = createAlert({ dismissible: true });
    alert.appendChild(createAlertIcon('info'));
    alert.appendChild(createAlertTitle({ text: 'Sessão expira em 5 minutos' }));
    alert.appendChild(createAlertDescription({ text: 'Salve seu trabalho para não perder as alterações.' }));

    const action = createAlertAction();
    action.appendChild(createButton({ label: 'Salvar agora', variant: 'default', size: 'sm' }));
    alert.appendChild(action);

    return alert;
  },

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');

    await step('A ação e o botão de fechar são botões dentro do alerta', async () => {
      await expect(within(alert).getByRole('button', { name: 'Salvar agora' })).toBeInTheDocument();
      await expect(within(alert).getByRole('button', { name: 'Fechar alerta' })).toBeInTheDocument();
      // O X continua o último filho: o leitor encontra conteúdo e ação antes.
      await expect(alert.lastElementChild).toHaveAttribute('data-slot', 'alert-dismiss');
    });

    await step('Ação na coluna do grid e X no canto: nada se sobrepõe', async () => {
      // A entrada animada escala o alerta; mede-se depois que ela assenta
      // (leitura pura dentro do waitFor — a sonda roda fora dele).
      await waitFor(() => expect(alert).not.toHaveClass('nds-animate-in'));
      const layout = measureActionDismiss(alert);
      await expect(layout.overlap).toBe(false);
      await expect(layout.gap).toBeGreaterThanOrEqual(0);
      await expect(layout.textClearsAction).toBe(true);
    });
  },
};
