import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createSwitch } from './switch';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Switch/Composicoes',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes de uso do Switch: par básico Switch + Label, painel com descrição, lista de configurações e formulário com envio (sincronizando estado em `<input type="hidden">`, dado que o factory Basecoat não expõe prop `name`).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── ComLabel ─────────────────────────────────────────────────────────────────

export const ComLabel: Story = {
  render: () => {
    const row = document.createElement('div');
    row.className = 'nds-cluster';
    row.dataset.spacing = 'sm';

    const id = 'sw-com-label';
    const sw = createSwitch({ id });

    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = 'Receber notificações por email';
    label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';
    label.addEventListener('click', (e) => { e.preventDefault(); sw.click(); });

    row.append(sw, label);
    return row;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Par obrigatório Switch + Label associados via `id`/`htmlFor`. O Label descreve o estado ATIVO da função ("Receber notificações", não "Notificações").',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Switch presente', async () => {
      await expect(canvas.getByRole('switch')).toBeInTheDocument();
    });
    await step('Label está presente no DOM', async () => {
      await expect(canvas.getByText('Receber notificações por email')).toBeVisible();
    });
  },
};

// ─── ComDescricao ─────────────────────────────────────────────────────────────

export const ComDescricao: Story = {
  render: () => {
    const panel = document.createElement('div');
    panel.className = 'nds-cluster nds-rounded-lg nds-border-default nds-p-3';
    panel.dataset.justify = 'between';
    panel.style.width = '20rem';

    const id = 'sw-com-desc';
    const sw = createSwitch({ id, checked: true });

    const textGroup = document.createElement('div');
    textGroup.className = 'nds-stack';
    textGroup.dataset.spacing = 'xs';
    textGroup.style.paddingRight = '0.75rem';

    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = 'Emails de marketing';
    label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';
    label.addEventListener('click', (e) => { e.preventDefault(); sw.click(); });

    const desc = document.createElement('p');
    desc.className = 'nds-text-body nds-text-muted-foreground';
    desc.textContent = 'Receba novidades e promoções da plataforma.';

    textGroup.append(label, desc);
    panel.append(textGroup, sw);
    return panel;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Switch em painel `flex justify-between` — Label + descrição auxiliar à esquerda, Switch à direita. Use para contextualizar o efeito da configuração.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Switch presente e ativado', async () => {
      await expect(canvas.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    });
    await step('Texto auxiliar visível', async () => {
      await expect(canvas.getByText(/Receba novidades/)).toBeVisible();
    });
  },
};

// ─── ListaDeConfiguracoes ─────────────────────────────────────────────────────

export const ListaDeConfiguracoes: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'sm';
    wrapper.style.width = '24rem';

    const title = document.createElement('p');
    title.className = 'nds-text-body nds-font-semibold nds-mb-3';
    title.textContent = 'Preferências de notificação';
    wrapper.appendChild(title);

    const options = [
      { id: 'pref-email', label: 'Receber novidades por email',  desc: 'Resumo semanal sobre o produto.',           checked: true  },
      { id: 'pref-push',  label: 'Receber notificações push',    desc: 'Alertas no dispositivo em tempo real.',     checked: false },
      { id: 'pref-sms',   label: 'Alertas por SMS',              desc: 'Eventos críticos via mensagem de texto.',   checked: false },
    ];

    options.forEach(({ id, label: labelText, desc: descText, checked }) => {
      const panel = document.createElement('div');
      panel.className = 'nds-cluster nds-rounded-lg nds-border-default nds-p-3';
      panel.dataset.justify = 'between';

      const sw = createSwitch({ id, checked });

      const textGroup = document.createElement('div');
      textGroup.className = 'nds-stack';
    textGroup.dataset.spacing = 'xs';
    textGroup.style.paddingRight = '0.75rem';
      const label = document.createElement('label');
      label.htmlFor = id;
      label.textContent = labelText;
      label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';
      label.addEventListener('click', (e) => { e.preventDefault(); sw.click(); });

      const desc = document.createElement('p');
      desc.className = 'nds-text-body nds-text-muted-foreground';
      desc.textContent = descText;

      textGroup.append(label, desc);
      panel.append(textGroup, sw);
      wrapper.appendChild(panel);
    });

    return wrapper;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Lista de configurações com vários Switches em painéis empilhados. Padrão recomendado para preferências de usuário (notificações, privacidade, recursos opt-in).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Três Switches presentes', async () => {
      const switches = canvas.getAllByRole('switch');
      await expect(switches).toHaveLength(3);
    });
    await step('Um Switch inicia ativado', async () => {
      const switches = canvas.getAllByRole('switch');
      const checked = switches.filter(s => s.getAttribute('aria-checked') === 'true');
      await expect(checked).toHaveLength(1);
    });
  },
};

// ─── EmFormularioComHidden ────────────────────────────────────────────────────

export const EmFormularioComHidden: Story = {
  render: () => {
    // Divergência Basecoat: o factory custom NÃO expõe prop `name`.
    // Para envio em formulário, sincronizamos o estado em um <input type="hidden">.
    const form = document.createElement('form');
    form.className = 'nds-stack';
    form.dataset.spacing = 'sm';
    form.style.width = '20rem';
    form.addEventListener('submit', (e) => e.preventDefault());

    const row = document.createElement('div');
    row.className = 'nds-cluster';
    row.dataset.spacing = 'sm';

    const id = 'sw-form-newsletter';
    const sw = createSwitch({
      id,
      checked: true,
      onCheckedChange: (val) => {
        hidden.value = val ? 'on' : 'off';
      },
    });

    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = 'Aceitar newsletter semanal';
    label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';
    label.addEventListener('click', (e) => { e.preventDefault(); sw.click(); });

    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = 'newsletter';
    hidden.value = 'on';

    row.append(sw, label);

    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.textContent = 'Salvar preferências';
    submit.className = 'btn btn-primary';

    form.append(row, hidden, submit);
    return form;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Padrão para envio em formulário no Basecoat: como o factory custom não expõe prop `name`, sincronize o estado do Switch para um `<input type="hidden" name="...">` via `onCheckedChange`. Em React/Vue/Svelte, basta passar a prop `name` direto no componente.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Form contém Switch e hidden input', async () => {
      await expect(canvas.getByRole('switch')).toBeInTheDocument();
      const hidden = canvasElement.querySelector('input[type="hidden"][name="newsletter"]');
      await expect(hidden).toBeTruthy();
      await expect((hidden as HTMLInputElement).value).toBe('on');
    });
  },
};
