import type { Meta, StoryObj } from '@storybook/html-vite';
import { createAlert, createAlertAction, createAlertIcon, createAlertTitle, createAlertDescription } from './alert';
import { createButton } from './button';
import { within, expect } from 'storybook/test';

const meta: Meta = {
  tags: ['feedback'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
  title: 'UI/Alert/Composicoes',
};

export default meta;
type Story = StoryObj;

export const ComIcone: Story = {
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

export const ComAcao: Story = {
  render: () => {
    const alert = createAlert();
    alert.appendChild(createAlertIcon('info'));
    alert.appendChild(createAlertTitle({ text: 'Atualização disponível' }));
    alert.appendChild(createAlertDescription({ text: 'Uma nova versão está pronta para instalação.' }));

    const action = createAlertAction();
    action.appendChild(createButton({ label: 'Atualizar', variant: 'outline', size: 'sm' }));
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
  },
};

export const SemIcone: Story = {
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

// ─── Token indivisível ────────────────────────────────────────────────────────

/**
 * Regressão: sem reset global de box-sizing, o `width: 100%` do .nds-alert
 * media só a caixa de conteúdo e os 32px de padding-inline mais os 2px de
 * borda saíam por fora. O card ficava 34px mais largo que o container e gerava
 * rolagem horizontal — visível na seção "Notas de implementação" das docs
 * pages, onde o alert ocupa a largura toda.
 *
 * Só nesta stack: o CSS é compartilhado (docs/shared/styles/nds/alert.css),
 * então uma story guarda as quatro. Vanilla é a referência cross-stack.
 */
export const TokenIndivisivel: Story = {
  render: () => {
    const frame = document.createElement('div');
    // Estreito de propósito: reproduz a largura útil de uma tela pequena.
    frame.style.width = '240px';
    frame.dataset.testid = 'alert-frame';

    const alert = createAlert();
    alert.appendChild(createAlertTitle({ text: 'Animação por keyframes' }));

    const desc = createAlertDescription();
    const p = document.createElement('p');
    // Montado nó a nó: o conteúdo é literal e seguro, mas atribuir HTML como
    // string dispara o check de XSS do audit de qualquer forma.
    const code = (text: string) => {
      const el = document.createElement('code');
      el.textContent = text;
      return el;
    };
    p.append(
      'A entrada usa ', code('nds-accordion-expand'),
      ' e a saída ', code('nds-accordion-collapse'),
      ', ambas animando ', code('grid-template-rows'), '.',
    );
    desc.appendChild(p);
    alert.appendChild(desc);

    frame.appendChild(alert);
    return frame;
  },

  play: async ({ canvasElement, step }) => {
    const frame = canvasElement.querySelector<HTMLElement>('[data-testid="alert-frame"]')!;
    const alert = frame.querySelector<HTMLElement>('.nds-alert')!;

    await step('O card não ultrapassa a largura do container', async () => {
      await expect(alert.getBoundingClientRect().width).toBeLessThanOrEqual(
        frame.getBoundingClientRect().width,
      );
    });

    await step('O container não ganha rolagem horizontal', async () => {
      await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
    });
  },
};
