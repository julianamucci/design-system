import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import { createSwitch } from './switch';
import {
  switchSource,
  switchSourceFormulario,
  switchSourcePainel,
} from './switch.source';
import { createButton } from './button';
import { definir } from './switch.fixtures';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Switch/Compositions',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      source: { transform: switchSource },
      description: {
        component:
          'Composicoes de uso do Switch: par básico Switch + Label, painel com descrição, lista de configurações e formulário com envio (sincronizando estado em `<input type="hidden">`, dado que a factory não expõe campo oculto próprio).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helper ───────────────────────────────────────────────────────────────────
//
// Sem listener próprio no rótulo: `<button>` é elemento rotulável, então o
// `<label for>` já encaminha a ativação.

function rotulo(id: string, texto: string, classe = 'nds-text-body'): HTMLLabelElement {
  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = texto;
  label.className = `${classe} nds-font-medium nds-leading-none nds-cursor-pointer`;
  return label;
}

// ─── WithLabel ────────────────────────────────────────────────────────────────

export const WithLabel: Story = {
  render: () => {
    const row = document.createElement('div');
    row.className = 'nds-cluster';
    row.dataset.spacing = 'sm';
    const id = 'sw-com-label';
    row.append(createSwitch({ id }), rotulo(id, 'Receber notificações por email'));
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
    const sw = canvas.getByRole('switch');
    const label = canvas.getByText('Receber notificações por email');

    await step('O rótulo nomeia o controle e está visível', async () => {
      await expect(canvas.getByRole('switch', { name: /Receber notificações por email/i }))
        .toBe(sw);
      await expect(label).toBeVisible();
    });

    await step('Clicar no rótulo liga e desliga o controle', async () => {
      // O par (liga e depois desliga) garante DOIS cliques reais em qualquer
      // rodada e devolve a story ao estado que o Chromatic fotografa.
      await definir(sw, true, label);
      await definir(sw, false, label);
    });
  },
};

// ─── WithDescription ──────────────────────────────────────────────────────────

export const WithDescription: Story = {
  render: () => {
    const panel = document.createElement('div');
    panel.className = 'nds-cluster nds-w-sm nds-rounded-lg nds-border-default nds-p-4';
    panel.dataset.align = 'center';
    panel.dataset.justify = 'between';

    const id = 'sw-com-desc';
    const sw = createSwitch({ id, checked: true });

    const textGroup = document.createElement('div');
    textGroup.className = 'nds-stack nds-pr-4';
    textGroup.dataset.spacing = 'xs';

    const desc = document.createElement('p');
    desc.className = 'nds-text-body';
    desc.textContent = 'Receba novidades e promoções da plataforma.';

    textGroup.append(rotulo(id, 'Emails de marketing'), desc);
    panel.append(textGroup, sw);
    return panel;
  },
  parameters: {
    docs: {
      source: {
        transform: switchSourcePainel([
          {
            id: 'emails-marketing',
            label: 'Emails de marketing',
            description: 'Receba novidades e promoções da plataforma.',
            checked: true,
          },
        ]),
      },
      description: {
        story:
          'Switch em painel — Label + descrição auxiliar à esquerda, controle à direita. Use para contextualizar o efeito da configuração.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('O controle nasce ligado neste painel', async () => {
      await expect(sw).toHaveAttribute('aria-checked', 'true');
    });

    await step('Só o rótulo nomeia o controle — a descrição fica como auxiliar', async () => {
      await expect(canvas.getByRole('switch', { name: /Emails de marketing/i })).toBe(sw);
      await expect(canvas.getByText(/Receba novidades/)).toBeVisible();
    });
  },
};

// ─── SettingsList ─────────────────────────────────────────────────────────────

export const SettingsList: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack nds-w-md';
    wrapper.dataset.spacing = 'sm';

    const title = document.createElement('p');
    title.className = 'nds-text-body nds-font-semibold nds-mb-2';
    title.textContent = 'Preferências de notificação';
    wrapper.appendChild(title);

    const options = [
      { id: 'pref-email', label: 'Receber novidades por email', desc: 'Resumo semanal sobre o produto.',         checked: true  },
      { id: 'pref-push',  label: 'Receber notificações push',   desc: 'Alertas no dispositivo em tempo real.',   checked: false },
      { id: 'pref-sms',   label: 'Alertas por SMS',             desc: 'Eventos críticos via mensagem de texto.', checked: false },
    ];

    options.forEach(({ id, label: labelText, desc: descText, checked }) => {
      const panel = document.createElement('div');
      panel.className = 'nds-cluster nds-rounded-lg nds-border-default nds-p-4';
      panel.dataset.align = 'center';
      panel.dataset.justify = 'between';

      const sw = createSwitch({ id, checked });

      const textGroup = document.createElement('div');
      textGroup.className = 'nds-stack nds-pr-4';
      textGroup.dataset.spacing = 'xs';

      const desc = document.createElement('p');
      desc.className = 'nds-text-body';
      desc.textContent = descText;

      textGroup.append(rotulo(id, labelText), desc);
      panel.append(textGroup, sw);
      wrapper.appendChild(panel);
    });

    return wrapper;
  },
  parameters: {
    docs: {
      source: {
        transform: switchSourcePainel([
          { id: 'pref-email', label: 'Receber novidades por email', description: 'Resumo semanal sobre o produto.', checked: true },
          { id: 'pref-push', label: 'Receber notificações push', description: 'Alertas no dispositivo em tempo real.' },
          { id: 'pref-sms', label: 'Alertas por SMS', description: 'Eventos críticos via mensagem de texto.' },
        ]),
      },
      description: {
        story:
          'Lista de configurações com vários Switches em painéis empilhados. Padrão recomendado para preferências de usuário (notificações, privacidade, recursos opt-in).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Três controles independentes na lista', async () => {
      const switches = canvas.getAllByRole('switch');
      await expect(switches).toHaveLength(3);
      const ligados = switches.filter((s) => s.getAttribute('aria-checked') === 'true');
      await expect(ligados).toHaveLength(1);
    });

    await step('Alternar um item não arrasta os vizinhos', async () => {
      const push = canvas.getByRole('switch', { name: /Receber notificações push/i });
      const email = canvas.getByRole('switch', { name: /Receber novidades por email/i });
      const antesEmail = email.getAttribute('aria-checked');
      await definir(push, true);
      await expect(email.getAttribute('aria-checked')).toBe(antesEmail);
      await definir(push, false);
    });
  },
};

// ─── InFormWithHidden ─────────────────────────────────────────────────────────

export const InFormWithHidden: Story = {
  render: () => {
    // A factory não emite campo oculto próprio: para envio em formulário,
    // sincronizamos o estado num <input type="hidden"> pelo callback de mudança.
    const form = document.createElement('form');
    form.className = 'nds-stack nds-w-sm';
    form.dataset.spacing = 'sm';
    form.addEventListener('submit', (e) => e.preventDefault());

    const row = document.createElement('div');
    row.className = 'nds-cluster';
    row.dataset.spacing = 'sm';

    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = 'newsletter';
    hidden.value = 'on';

    const id = 'sw-form-newsletter';
    const sw = createSwitch({
      id,
      checked: true,
      onCheckedChange: (val) => { hidden.value = val ? 'on' : 'off'; },
    });

    row.append(sw, rotulo(id, 'Aceitar newsletter semanal'));

    form.append(row, hidden, createButton({ type: 'submit', label: 'Salvar preferências' }));
    return form;
  },
  parameters: {
    docs: {
      // A fábrica não emite campo oculto: o formulário inteiro é o assunto.
      source: {
        transform: switchSourceFormulario({
          id: 'newsletter',
          name: 'newsletter',
          label: 'Aceitar newsletter semanal',
          checked: true,
        }),
      },
      description: {
        story:
          'Padrão para envio em formulário: como a factory não emite campo oculto próprio, sincronize o estado do Switch para um `<input type="hidden" name="...">` pelo callback de mudança.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');
    const hidden = canvasElement.querySelector<HTMLInputElement>(
      'input[type="hidden"][name="newsletter"]',
    );

    await step('O formulário reúne o controle, o campo oculto e o envio', async () => {
      await expect(hidden).not.toBeNull();
      await expect(canvas.getByRole('button', { name: 'Salvar preferências' })).toBeVisible();
    });

    await step('O campo oculto acompanha o controle nos dois sentidos', async () => {
      // Só a ida provaria pouco: um valor escrito uma vez passaria igual. É a
      // volta que mostra que o campo é sincronizado a cada mudança.
      await definir(sw, false);
      await expect(hidden!.value).toBe('off');
      await definir(sw, true);
      await expect(hidden!.value).toBe('on');
    });
  },
};
