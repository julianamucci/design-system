import type { Meta, StoryObj } from '@storybook/html-vite';
import { createAlert, createAlertIcon, createAlertTitle, createAlertDescription } from './alert';
import { within, expect, fn, userEvent } from 'storybook/test';

const meta: Meta = {
  tags: ['feedback'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
  title: 'UI/Alert/Variantes',
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => {
    const alert = createAlert({ variant: 'default' });
    alert.appendChild(createAlertIcon('info'));
    alert.appendChild(createAlertTitle({ text: 'Atenção' }));
    alert.appendChild(createAlertDescription({ text: 'Suas alterações serão aplicadas na próxima sessão.' }));
    return alert;
  },

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');
    await expect(alert).toHaveClass('nds-alert');
    await expect(alert).not.toHaveClass('nds-alert-destructive');
    await expect(canvas.getByText('Atenção')).toBeVisible();
  },
};

export const Destructive: Story = {
  render: () => {
    const alert = createAlert({ variant: 'destructive' });
    alert.appendChild(createAlertIcon('error'));
    alert.appendChild(createAlertTitle({ text: 'Erro ao salvar' }));
    alert.appendChild(createAlertDescription({ text: 'Não foi possível salvar. Verifique sua conexão e tente novamente.' }));
    return alert;
  },

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');
    await expect(alert).toHaveClass('nds-alert-destructive');
    await expect(canvas.getByText('Erro ao salvar')).toBeVisible();
  },
};

export const Success: Story = {
  render: () => {
    const alert = createAlert({ className: 'nds-alert-success' });
    alert.appendChild(createAlertIcon('success'));
    alert.appendChild(createAlertTitle({ text: 'Perfil atualizado' }));
    alert.appendChild(createAlertDescription({ text: 'Suas informações foram salvas com sucesso.' }));
    return alert;
  },

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');
    await expect(alert).toHaveClass('nds-alert-success');
    await expect(canvas.getByText('Perfil atualizado')).toBeVisible();
  },
};

export const Warning: Story = {
  render: () => {
    const alert = createAlert({ className: 'nds-alert-warning' });
    alert.appendChild(createAlertIcon('warning'));
    alert.appendChild(createAlertTitle({ text: 'Assinatura expirando' }));
    alert.appendChild(createAlertDescription({ text: 'Sua assinatura expira em 3 dias. Renove para evitar interrupções.' }));
    return alert;
  },

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');
    await expect(alert).toHaveClass('nds-alert-warning');
    await expect(canvas.getByText('Assinatura expirando')).toBeVisible();
  },
};

// Spies em escopo de módulo: o render (re)cria o DOM a cada run e zera os
// contadores, então o play sempre parte de 0 chamadas.
const onDismissClick = fn();
const onDismissKeyboard = fn();

export const Dismissible: Story = {
  render: () => {
    onDismissClick.mockClear();
    onDismissKeyboard.mockClear();

    // Dois alerts dismissible: fechar remove o elemento do DOM, então o caso
    // de clique e o de teclado precisam cada um do seu próprio mount.
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack';
    wrap.dataset.spacing = 'sm';

    const byClick = createAlert({ variant: 'default', dismissible: true, onDismiss: onDismissClick });
    byClick.appendChild(createAlertIcon('info'));
    byClick.appendChild(createAlertTitle({ text: 'Preferências salvas' }));
    byClick.appendChild(createAlertDescription({ text: 'Você pode fechar este aviso quando quiser.' }));

    const byKeyboard = createAlert({
      variant: 'success',
      dismissible: true,
      dismissLabel: 'Fechar confirmação',
      onDismiss: onDismissKeyboard,
    });
    byKeyboard.appendChild(createAlertIcon('success'));
    byKeyboard.appendChild(createAlertTitle({ text: 'Perfil atualizado' }));
    byKeyboard.appendChild(createAlertDescription({ text: 'Suas informações foram salvas com sucesso.' }));

    wrap.append(byClick, byKeyboard);
    return wrap;
  },

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('X visível, acessível por rótulo e registrado na raiz', async () => {
      const alerts = canvas.getAllByRole('alert');
      await expect(alerts).toHaveLength(2);
      await expect(alerts[0]).toHaveAttribute('data-dismissible', 'true');
      await expect(canvas.getByRole('button', { name: 'Fechar alerta' })).toBeVisible();
      await expect(canvas.getByRole('button', { name: 'Fechar confirmação' })).toBeVisible();
    });

    await step('Clique no X remove o alert e dispara o callback uma vez', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Fechar alerta' }));
      await expect(canvas.queryByText('Preferências salvas')).not.toBeInTheDocument();
      await expect(onDismissClick).toHaveBeenCalledTimes(1);
      await expect(onDismissKeyboard).not.toHaveBeenCalled();
    });

    await step('Enter no X focado remove o alert e dispara o callback uma vez', async () => {
      canvas.getByRole('button', { name: 'Fechar confirmação' }).focus();
      await userEvent.keyboard('{Enter}');
      await expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
      await expect(onDismissKeyboard).toHaveBeenCalledTimes(1);
      await expect(onDismissClick).toHaveBeenCalledTimes(1);
    });
  },
};
