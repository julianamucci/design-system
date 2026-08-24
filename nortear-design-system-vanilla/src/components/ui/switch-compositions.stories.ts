// ─── Composições do Switch ────────────────────────────────────────────────────
//
// O conjunto é o mesmo nas cinco stacks: WithLabel, WithoutLabel, SettingsList
// e InForm.
//
// DIVERGÊNCIA REGISTRADA — `Controlled` não existe aqui, e não é lacuna.
// As quatro stacks com lib headless têm uma story `Controlled`: nelas o estado
// do controle pode morar FORA dele, num state ou sinal do framework que a lib
// aceita de volta como entrada, e a story mostra esse contrato. A fábrica desta
// stack não tem contrapartida: `createSwitch` guarda o próprio estado e só o
// publica pelo callback de mudança — não há opção de valor que o dono de fora
// reassuma a cada render. Uma story "controlada" aqui seria encenação, não o
// contrato da peça. Divergência de API de framework se registra; não se alinha.

import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import { createSwitch } from './switch';
import {
  switchSource,
  switchSourceForm,
  switchSourcePanel,
  switchSourceWith,
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
          'Composições de uso do Switch: par básico Switch + Label, controle nomeado só por `aria-label`, lista de configurações e formulário com envio (sincronizando estado em `<input type="hidden">`, dado que a factory não expõe campo oculto próprio).',
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

function label(id: string, text: string, className = 'nds-text-body'): HTMLLabelElement {
  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = text;
  label.className = `${className} nds-font-medium nds-leading-none nds-cursor-pointer`;
  return label;
}

// ─── WithLabel ────────────────────────────────────────────────────────────────

export const WithLabel: Story = {
  render: () => {
    const row = document.createElement('div');
    row.className = 'nds-cluster';
    row.dataset.spacing = 'sm';
    const id = 'sw-com-label';
    row.append(createSwitch({ id }), label(id, 'Receber notificações'));
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
    const label = canvas.getByText('Receber notificações');

    await step('O rótulo nomeia o controle e está visível', async () => {
      await expect(canvas.getByRole('switch', { name: /Receber notificações/i }))
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

// ─── WithoutLabel ─────────────────────────────────────────────────────────────

export const WithoutLabel: Story = {
  render: () => createSwitch({ id: 'sw-sem-rotulo', 'aria-label': 'Ativar modo escuro' }),
  parameters: {
    docs: {
      source: {
        transform: switchSourceWith({ label: '', 'aria-label': 'Ativar modo escuro' }),
      },
      description: {
        story:
          'Sem rótulo visível, o nome acessível vive em `aria-label`. Use apenas quando o contexto ao redor já nomeia a função — célula de tabela sob um cabeçalho, linha de barra de ferramentas.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O controle continua tendo nome, ainda que invisível', async () => {
      // Sem esta medida, um switch sem nome nenhum passaria: ele renderiza,
      // responde ao clique, e o leitor de tela anuncia só "botão".
      await expect(canvas.getByRole('switch', { name: 'Ativar modo escuro' })).toBeVisible();
    });

    await step('Nenhum texto do nome aparece na tela', async () => {
      // É o que separa esta composição da anterior: se o texto estivesse
      // visível, o exemplo seria WithLabel com um `aria-label` redundante.
      await expect(canvas.queryByText('Ativar modo escuro')).toBeNull();
    });
  },
};

// ─── SettingsList ─────────────────────────────────────────────────────────────

export const SettingsList: Story = {
  render: () => {
    // fieldset + legend, e não div + <p>: os três interruptores são UM grupo, e
    // só o fieldset leva esse agrupamento para a árvore de acessibilidade — a
    // legend nomeia o grupo e acompanha cada controle (WCAG 1.3.1). Um <p> é
    // texto ao lado, e deixa os três soltos para quem usa leitor de tela.
    const grupo = document.createElement('fieldset');
    grupo.className = 'nds-border-none nds-p-0 nds-m-0 nds-w-md';

    const title = document.createElement('legend');
    title.className = 'nds-text-body nds-font-semibold nds-mb-2';
    title.textContent = 'Preferências de notificação';
    grupo.appendChild(title);

    // O nds-stack fica neste div INTERNO: fieldset com display flex/grid tem
    // histórico de bug de layout em navegador.
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'sm';
    grupo.appendChild(wrapper);

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

      textGroup.append(label(id, labelText), desc);
      panel.append(textGroup, sw);
      wrapper.appendChild(panel);
    });

    return grupo;
  },
  parameters: {
    docs: {
      source: {
        transform: switchSourcePanel([
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
      const beforeEmail = email.getAttribute('aria-checked');
      await definir(push, true);
      await expect(email.getAttribute('aria-checked')).toBe(beforeEmail);
      await definir(push, false);
    });
  },
};

// ─── InForm ───────────────────────────────────────────────────────────────────

export const InForm: Story = {
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

    row.append(sw, label(id, 'Aceitar newsletter semanal'));

    form.append(row, hidden, createButton({ type: 'submit', label: 'Salvar preferências' }));
    return form;
  },
  parameters: {
    docs: {
      // A fábrica não emite campo oculto: o formulário inteiro é o assunto.
      source: {
        transform: switchSourceForm({
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
