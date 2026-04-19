import type { Meta, StoryObj } from '@storybook/html';
import { createAlert, createAlertIcon, createAlertTitle, createAlertDescription } from './alert';

const meta: Meta = {
  title: 'UI/Alert/Composições',
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
};

export const SemTituloCompacto: Story = {
  render: () => {
    const alert = createAlert({ variant: 'destructive' });
    alert.appendChild(createAlertIcon('error'));
    alert.appendChild(createAlertDescription({ text: 'Formulário incompleto — preencha todos os campos obrigatórios.' }));
    return alert;
  },
};

export const MultiplosTipos: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'space-y-3';

    const a1 = createAlert();
    a1.appendChild(createAlertIcon('info'));
    a1.appendChild(createAlertTitle({ text: 'Informação' }));
    a1.appendChild(createAlertDescription({ text: 'Mensagem informativa e neutra.' }));

    const a2 = createAlert({ variant: 'destructive' });
    a2.appendChild(createAlertIcon('error'));
    a2.appendChild(createAlertTitle({ text: 'Erro' }));
    a2.appendChild(createAlertDescription({ text: 'Erro crítico que bloqueia o fluxo.' }));

    const a3 = createAlert({ className: 'bg-success/10 text-success border-success/30' });
    a3.appendChild(createAlertIcon('success'));
    a3.appendChild(createAlertTitle({ text: 'Sucesso' }));
    a3.appendChild(createAlertDescription({ text: 'Ação concluída com sucesso.' }));

    const a4 = createAlert({ className: 'bg-warning/10 text-warning border-warning/30' });
    a4.appendChild(createAlertIcon('warning'));
    a4.appendChild(createAlertTitle({ text: 'Aviso' }));
    a4.appendChild(createAlertDescription({ text: 'Aviso que requer atenção.' }));

    wrapper.append(a1, a2, a3, a4);
    return wrapper;
  },
};

export const SemIcone: Story = {
  render: () => {
    const alert = createAlert();
    alert.appendChild(createAlertTitle({ text: 'Sem ícone' }));
    alert.appendChild(createAlertDescription({ text: 'Alert sem ícone mantém layout de coluna única.' }));
    return alert;
  },
};
