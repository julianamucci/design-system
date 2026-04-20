import type { Meta, StoryObj } from '@storybook/html';
import { createAlert, createAlertIcon, createAlertTitle, createAlertDescription } from './alert';

const meta: Meta = {
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
};

export const Destructive: Story = {
  render: () => {
    const alert = createAlert({ variant: 'destructive' });
    alert.appendChild(createAlertIcon('error'));
    alert.appendChild(createAlertTitle({ text: 'Erro ao salvar' }));
    alert.appendChild(createAlertDescription({ text: 'Não foi possível salvar. Verifique sua conexão e tente novamente.' }));
    return alert;
  },
};

export const Success: Story = {
  render: () => {
    const alert = createAlert({ className: 'bg-success/10 text-success border-success/30' });
    alert.appendChild(createAlertIcon('success'));
    alert.appendChild(createAlertTitle({ text: 'Perfil atualizado' }));
    alert.appendChild(createAlertDescription({ text: 'Suas informações foram salvas com sucesso.' }));
    return alert;
  },
};

export const Warning: Story = {
  render: () => {
    const alert = createAlert({ className: 'bg-warning/10 text-warning border-warning/30' });
    alert.appendChild(createAlertIcon('warning'));
    alert.appendChild(createAlertTitle({ text: 'Assinatura expirando' }));
    alert.appendChild(createAlertDescription({ text: 'Sua assinatura expira em 3 dias. Renove para evitar interrupções.' }));
    return alert;
  },
};
