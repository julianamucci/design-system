import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { signal } from '@angular/core';
import { within, expect, userEvent } from 'storybook/test';
import { NdsSwitch } from './switch';
import { NdsLabel } from './label';
import { NdsButton } from './button';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// As cinco composições canônicas do conteúdo compartilhado: par com rótulo,
// controle sem rótulo visível, lista de preferências, formulário e estado
// controlado de fora.
//
// Sem `covers` aqui de propósito. O contrato do Switch já fecha nas stories de
// Playground, States e Variants; declarar item nesta camada criaria divergência
// de contrato entre as stacks (`contract_divergent` no audit.mjs).

const meta: Meta = {
  title: 'UI/Switch/Compositions',
  tags: ['form'],
  decorators: [moduleMetadata({ imports: [NdsSwitch, NdsLabel, NdsButton] })],
  parameters: {
    // Sem argTypes neste arquivo: o painel Controls ficaria vazio.
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Composições do Switch: rótulo associado, nome sem rótulo visível, lista de ' +
          'configurações, formulário e estado controlado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Alterna o controle até o estado pedido e confere que ele chegou lá. */
async function setChecked(
  sw: HTMLElement,
  on: boolean,
  target: HTMLElement = sw,
): Promise<void> {
  if ((sw.getAttribute('aria-checked') === 'true') !== on) {
    await userEvent.click(target);
  }
  await expect(sw.getAttribute('aria-checked')).toBe(String(on));
}

// ─── WithLabel ────────────────────────────────────────────────────────────────

export const WithLabel: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Par obrigatório Switch + Label associados por `for`/`id`. O rótulo descreve o ' +
          'estado ATIVO da função ("Receber notificações", não "Notificações").',
      },
    },
  },
  render: () => ({
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <button ndsSwitch id="comp-label"></button>
        <label ndsLabel for="comp-label">Receber notificações</label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvasElement.querySelector<HTMLElement>('#comp-label')!;
    const label = canvas.getByText('Receber notificações');

    await step('O rótulo nomeia o controle e está visível', async () => {
      await expect(canvas.getByRole('switch', { name: /Receber notificações/i })).toBe(sw);
      await expect(label).toBeVisible();
    });

    await step('Clicar no rótulo liga e desliga o controle', async () => {
      // O par (liga e depois desliga) garante DOIS cliques reais em qualquer
      // rodada, deixa a play idempotente para o replay do painel Interactions e
      // devolve a story ao estado que o Chromatic fotografa.
      await setChecked(sw, true, label);
      await setChecked(sw, false, label);
    });
  },
};

// ─── WithoutLabel ─────────────────────────────────────────────────────────────

export const WithoutLabel: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Sem rótulo visível, o nome acessível vive em `aria-label`. Use apenas quando o ' +
          'contexto ao redor já nomeia a função.',
      },
    },
  },
  // O `aria-label` fica como atributo estático porque o `RdxSwitchRoot` NÃO liga
  // `[attr.aria-label]` no host — o input homônimo do primitivo alimenta apenas
  // o input nativo escondido. É o oposto do `aria-invalid`, que o primitivo liga
  // por host binding e apaga se escrito à mão (ver switch-states.stories.ts).
  render: () => ({
    template: `
      <button ndsSwitch id="comp-no-label" aria-label="Ativar modo escuro"></button>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O controle continua tendo nome, ainda que invisível', async () => {
      // Sem esta medida, um switch sem nome nenhum passaria: ele renderiza,
      // responde ao clique, e o leitor de tela anuncia só "botão".
      await expect(canvas.getByRole('switch', { name: 'Ativar modo escuro' })).toBeVisible();
    });

    await step('Nenhum texto do nome aparece na tela', async () => {
      // É o que separa esta composição da anterior: se o texto estivesse
      // visível, o exemplo seria WithLabel com um aria-label redundante.
      await expect(canvas.queryByText('Ativar modo escuro')).toBeNull();
    });
  },
};

// ─── SettingsList ─────────────────────────────────────────────────────────────

/** As mesmas três preferências que a docs page e as outras stacks mostram. */
const PREFERENCES = [
  {
    id: 'pref-email',
    label: 'Receber novidades por email',
    description: 'Resumo semanal sobre o produto.',
  },
  {
    id: 'pref-push',
    label: 'Receber notificações push',
    description: 'Alertas no dispositivo em tempo real.',
  },
  {
    id: 'pref-sms',
    label: 'Alertas por SMS',
    description: 'Eventos críticos via mensagem de texto.',
  },
] as const;

export const SettingsList: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Lista de configurações com vários Switches em painéis empilhados. Padrão para ' +
          'tela de preferências do usuário.',
      },
    },
  },
  render: () => ({
    template: `
      <!-- fieldset + legend, e não div + p: o agrupamento precisa existir na árvore
           de acessibilidade. A legend nomeia os três interruptores como um conjunto
           único (WCAG 1.3.1); um <p> apenas parece um título, não agrupa nada. O
           nds-stack fica no div INTERNO porque fieldset com display flex/grid tem
           histórico de bug de layout em navegador. -->
      <fieldset class="nds-border-none nds-p-0 nds-m-0 nds-w-md">
        <legend class="nds-text-body nds-font-semibold nds-mb-2">Preferências de notificação</legend>
        <div class="nds-stack" data-spacing="sm">
          <div
            class="nds-cluster nds-rounded-lg nds-border-default nds-p-4"
            data-align="center"
            data-justify="between"
          >
            <div class="nds-stack nds-pr-4" data-spacing="xs">
              <label ndsLabel for="pref-email">Receber novidades por email</label>
              <p class="nds-text-body">Resumo semanal sobre o produto.</p>
            </div>
            <button ndsSwitch id="pref-email" [checked]="true"></button>
          </div>

          <div
            class="nds-cluster nds-rounded-lg nds-border-default nds-p-4"
            data-align="center"
            data-justify="between"
          >
            <div class="nds-stack nds-pr-4" data-spacing="xs">
              <label ndsLabel for="pref-push">Receber notificações push</label>
              <p class="nds-text-body">Alertas no dispositivo em tempo real.</p>
            </div>
            <button ndsSwitch id="pref-push"></button>
          </div>

          <div
            class="nds-cluster nds-rounded-lg nds-border-default nds-p-4"
            data-align="center"
            data-justify="between"
          >
            <div class="nds-stack nds-pr-4" data-spacing="xs">
              <label ndsLabel for="pref-sms">Alertas por SMS</label>
              <p class="nds-text-body">Eventos críticos via mensagem de texto.</p>
            </div>
            <button ndsSwitch id="pref-sms"></button>
          </div>
        </div>
      </fieldset>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A lista tem três controles, cada um no seu estado de partida', async () => {
      const switches = canvas.getAllByRole('switch');
      await expect(switches).toHaveLength(3);
      await expect(switches[0]).toHaveAttribute('aria-checked', 'true');
      await expect(switches[1]).toHaveAttribute('aria-checked', 'false');
      await expect(switches[2]).toHaveAttribute('aria-checked', 'false');
    });

    await step('Cada linha nomeia o próprio controle', async () => {
      // Três interruptores com o mesmo nome seriam indistinguíveis para quem
      // navega por lista de controles.
      for (const { id, label } of PREFERENCES) {
        await expect(canvas.getByRole('switch', { name: label })).toBe(
          canvasElement.querySelector('#' + id),
        );
      }
    });

    await step('A descrição fica fora do nome do controle', async () => {
      // Se ela entrasse no rótulo, o leitor de tela anunciaria a frase inteira
      // a cada passagem pelo interruptor.
      await expect(
        canvas.getByRole('switch', { name: 'Receber novidades por email' }),
      ).not.toHaveAccessibleName(/Resumo semanal/);
    });

    await step('Alternar um item não arrasta os vizinhos', async () => {
      const email = canvasElement.querySelector<HTMLElement>('#pref-email')!;
      const push = canvasElement.querySelector<HTMLElement>('#pref-push')!;
      await setChecked(push, true);
      await expect(email).toHaveAttribute('aria-checked', 'true');
      await setChecked(push, false);
    });
  },
};

// ─── InForm ───────────────────────────────────────────────────────────────────

export const InForm: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Switch dentro de um form, participando do envio pelo nome do campo. Com `name` e ' +
          'sem input nativo próprio, o primitivo mantém um `<input type="hidden">` irmão do ' +
          'controle com o valor corrente, e o retira quando o switch está desligado.',
      },
    },
  },
  render: () => ({
    template: `
      <form class="nds-stack nds-w-sm" data-spacing="sm" (submit)="$event.preventDefault()">
        <div class="nds-cluster" data-spacing="sm">
          <button ndsSwitch id="comp-newsletter" name="newsletter" [checked]="true"></button>
          <label ndsLabel for="comp-newsletter">Aceitar newsletter semanal</label>
        </div>
        <button ndsButton type="submit">Salvar preferências</button>
      </form>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvasElement.querySelector<HTMLElement>('#comp-newsletter')!;
    const form = canvasElement.querySelector<HTMLFormElement>('form')!;

    await step('O formulário reúne o controle e o envio', async () => {
      await expect(canvas.getByRole('button', { name: 'Salvar preferências' })).toBeVisible();
    });

    await step('O campo entra no envio e acompanha o controle nos dois sentidos', async () => {
      // Só a ida provaria pouco: um valor escrito uma vez passaria igual. É a
      // volta que mostra que o envio reflete o estado a cada mudança — e o par
      // devolve a story ao estado inicial, que é o que o Chromatic fotografa e
      // o que o replay do painel Interactions reencontra.
      await expect(new FormData(form).get('newsletter')).not.toBeNull();
      await setChecked(sw, false);
      await expect(new FormData(form).get('newsletter')).toBeNull();
      await setChecked(sw, true);
      await expect(new FormData(form).get('newsletter')).not.toBeNull();
    });
  },
};

// ─── Controlled ───────────────────────────────────────────────────────────────

export const Controlled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Switch controlado — quem compõe mantém o estado e o atualiza pelo callback de ' +
          'mudança. O valor refletido na tela vem do estado externo, não do controle.',
      },
    },
  },
  // O estado vive FORA do componente: um signal do escopo da story, lido pelo
  // `[checked]` e escrito pelo `(checkedChange)`. É a forma de duas vias aberta
  // à mão, que é o que o exemplo precisa mostrar.
  render: () => {
    const enabled = signal(false);
    return {
      props: {
        enabled,
        setEnabled: (value: boolean) => enabled.set(value),
      },
      template: `
        <div class="nds-stack nds-w-sm" data-align="start" data-spacing="sm">
          <div class="nds-cluster" data-spacing="sm">
            <button
              ndsSwitch
              id="comp-controlled"
              [checked]="enabled()"
              (checkedChange)="setEnabled($event)"
            ></button>
            <label ndsLabel for="comp-controlled">Receber notificações</label>
          </div>
          <p class="nds-text-caption nds-text-muted-foreground">
            Estado atual: <code class="nds-font-mono">{{ enabled() }}</code>
          </p>
        </div>
      `,
    };
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvasElement.querySelector<HTMLElement>('#comp-controlled')!;

    await step('O estado externo acompanha o controle', async () => {
      // Passar só `[checked]` sem o callback deixaria o interruptor inerte: ele
      // deixa de ser dono do próprio estado e ninguém assume o lugar. É esse
      // defeito que o texto refletido na tela denuncia.
      await setChecked(sw, true);
      await expect(canvas.getByText('true')).toBeVisible();
      await setChecked(sw, false);
      await expect(canvas.getByText('false')).toBeVisible();
    });
  },
};
