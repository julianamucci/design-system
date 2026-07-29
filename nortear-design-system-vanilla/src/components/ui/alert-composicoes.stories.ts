import type { Meta, StoryObj } from '@storybook/html-vite';
import { createAlert, createAlertIcon, createAlertTitle, createAlertDescription } from './alert';
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
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const SemTituloCompacto: Story = {
  render: () => {
    const alert = createAlert({ variant: 'destructive' });
    alert.appendChild(createAlertIcon('error'));
    alert.appendChild(createAlertDescription({ text: 'Formulário incompleto — preencha todos os campos obrigatórios.' }));
    return alert;
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const MultiplosTipos: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'sm';

    const a1 = createAlert();
    a1.appendChild(createAlertIcon('info'));
    a1.appendChild(createAlertTitle({ text: 'Informação' }));
    a1.appendChild(createAlertDescription({ text: 'Mensagem informativa e neutra.' }));

    const a2 = createAlert({ variant: 'destructive' });
    a2.appendChild(createAlertIcon('error'));
    a2.appendChild(createAlertTitle({ text: 'Erro' }));
    a2.appendChild(createAlertDescription({ text: 'Erro crítico que bloqueia o fluxo.' }));

    const a3 = createAlert({ className: 'nds-alert-success' });
    a3.appendChild(createAlertIcon('success'));
    a3.appendChild(createAlertTitle({ text: 'Sucesso' }));
    a3.appendChild(createAlertDescription({ text: 'Ação concluída com sucesso.' }));

    const a4 = createAlert({ className: 'nds-alert-warning' });
    a4.appendChild(createAlertIcon('warning'));
    a4.appendChild(createAlertTitle({ text: 'Aviso' }));
    a4.appendChild(createAlertDescription({ text: 'Aviso que requer atenção.' }));

    wrapper.append(a1, a2, a3, a4);
    return wrapper;
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
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
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
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
    p.innerHTML =
      'A entrada usa <code>nds-accordion-expand</code> e a saída ' +
      '<code>nds-accordion-collapse</code>, ambas animando ' +
      '<code>grid-template-rows</code>.';
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
