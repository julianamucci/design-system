import type { Meta, StoryObj } from '@storybook/html';
import { createAlert, createAlertIcon, createAlertTitle, createAlertDescription } from './alert';
import { within, expect } from 'storybook/test';

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
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
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
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
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
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
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
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};
