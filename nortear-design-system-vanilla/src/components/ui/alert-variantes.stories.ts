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

// Duas stories separadas, como nas outras 3 stacks (Dismissible +
// DismissibleTeclado): mesma matriz de cobertura por nome de story nas 4, e o
// Chromatic fotografa os mesmos casos.
export const Dismissible: Story = {
  render: () => {
    onDismissClick.mockClear();
    const el = createAlert({ variant: 'default', dismissible: true, onDismiss: onDismissClick });
    el.appendChild(createAlertIcon('info'));
    el.appendChild(createAlertTitle({ text: 'Preferências salvas' }));
    el.appendChild(createAlertDescription({ text: 'Você pode fechar este aviso quando quiser.' }));
    return el;
  },

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('X visível, acessível por rótulo e registrado na raiz', async () => {
      await expect(canvas.getByRole('alert')).toHaveAttribute('data-dismissible', 'true');
      await expect(canvas.getByRole('button', { name: 'Fechar alerta' })).toBeVisible();
    });

    await step('X é o ÚLTIMO filho — leitor de tela encontra o conteúdo antes', async () => {
      // O consumidor appenda o conteúdo depois do createAlert; sem o microtask
      // de reposicionamento o botão ficaria como primeiro filho, divergindo
      // da ordem de leitura das outras 3 stacks.
      const alert = canvas.getByRole('alert');
      await expect(alert.lastElementChild).toHaveAttribute('data-slot', 'alert-dismiss');
    });

    await step('Clique no X remove o alert e dispara o callback uma vez', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Fechar alerta' }));
      await expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
      await expect(onDismissClick).toHaveBeenCalledTimes(1);
    });
  },
};

export const DismissibleTeclado: Story = {
  render: () => {
    onDismissKeyboard.mockClear();
    const el = createAlert({
      variant: 'success',
      dismissible: true,
      dismissLabel: 'Fechar confirmação',
      onDismiss: onDismissKeyboard,
    });
    el.appendChild(createAlertIcon('success'));
    el.appendChild(createAlertTitle({ text: 'Perfil atualizado' }));
    el.appendChild(createAlertDescription({ text: 'Suas informações foram salvas com sucesso.' }));
    return el;
  },

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Enter no X focado remove o alert e dispara o callback uma vez', async () => {
      canvas.getByRole('button', { name: 'Fechar confirmação' }).focus();
      await userEvent.keyboard('{Enter}');
      await expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
      await expect(onDismissKeyboard).toHaveBeenCalledTimes(1);
    });
  },
};
