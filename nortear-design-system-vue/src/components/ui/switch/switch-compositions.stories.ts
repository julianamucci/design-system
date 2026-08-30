import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, expect } from 'storybook/test';
import { Switch } from './index';
import { definir } from './switch.fixtures';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  configSwitchPanelSource,
  formSwitchSource,
  switchControlledSource,
  switchDefaultSource,
  switchSemRotuloSource,
} from './switch.source';

const meta = {
  title: 'Primitives/Form/Switch/Compositions',
  component: Switch,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: switchDefaultSource },
      description: {
        component:
          'Composições do Switch: rótulo associado, nome sem rótulo visível, lista de configurações, formulário e estado controlado.',
      },
    },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Mesmas três preferências que a docs page e o snippet mostram. */
const PREFERENCIAS = [
  { id: 'pref-email', label: 'Receber novidades por email', desc: 'Resumo semanal sobre o produto.' },
  { id: 'pref-push', label: 'Receber notificações push', desc: 'Alertas no dispositivo em tempo real.' },
  { id: 'pref-sms', label: 'Alertas por SMS', desc: 'Eventos críticos via mensagem de texto.' },
];

export const WithLabel: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Par obrigatório Switch + Label. A associação via for/id permite que o clique no rótulo alterne o controle.',
      },
    },
  },
  render: () => ({
    components: { Switch, Label },
    setup() { return {}; },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <Switch id="comp-label" />
        <Label :for="'comp-label'">Receber notificações</Label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');
    const label = canvas.getByText('Receber notificações');

    await step('O rótulo nomeia o controle', async () => {
      await expect(canvas.getByRole('switch', { name: /Receber notificações/i })).toBe(sw);
    });

    await step('Clicar no rótulo liga e desliga o controle', async () => {
      // O par (liga e depois desliga) garante DOIS cliques reais em qualquer
      // rodada e devolve a story ao estado que o Chromatic fotografa.
      await definir(sw, true, label);
      await definir(sw, false, label);
    });
  },
};

export const WithoutLabel: Story = {
  parameters: {
    docs: {
      source: { transform: switchSemRotuloSource },
      description: {
        story:
          'Sem rótulo visível, o nome acessível vive em aria-label. Use apenas quando o contexto ao redor já nomeia a função.',
      },
    },
  },
  render: () => ({
    components: { Switch },
    setup() { return {}; },
    template: `<Switch id="comp-no-label" aria-label="Ativar modo escuro" />`,
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

export const SettingsList: Story = {
  parameters: {
    docs: {
      // Os três painéis são composição do render; o do meta imprimiria só o par.
      source: { transform: configSwitchPanelSource },
      description: {
        story:
          'Lista de configurações com vários Switches em painéis empilhados. Padrão para tela de preferências do usuário.',
      },
    },
  },
  render: () => ({
    components: { Switch, Label },
    setup() { return { preferencias: PREFERENCIAS }; },
    // É `fieldset` + `legend`, e não `div` + `<p>`, porque os três interruptores
    // são UM grupo: só o fieldset amarra os controles ao título, e é assim que o
    // leitor de tela anuncia "Preferências de notificação" ao entrar em cada um
    // (WCAG 1.3.1). Com `<p>` o título é texto solto e os três ficam órfãos.
    // O `nds-stack` mora no div INTERNO: fieldset com display flex/grid tem
    // histórico de bug de layout em navegador.
    template: `
      <fieldset class="nds-border-none nds-p-0 nds-m-0 nds-w-md">
        <legend class="nds-text-body nds-font-semibold nds-mb-2">Preferências de notificação</legend>
        <div class="nds-stack" data-spacing="sm">
          <div
            v-for="(item, indice) in preferencias"
            :key="item.id"
            class="nds-cluster nds-rounded-lg nds-border-default nds-p-4"
            data-align="center"
            data-justify="between"
          >
            <div class="nds-stack nds-pr-4" data-spacing="xs">
              <Label :for="item.id">{{ item.label }}</Label>
              <p class="nds-text-body">{{ item.desc }}</p>
            </div>
            <Switch :id="item.id" :default-value="indice === 0" />
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
      for (const { label } of PREFERENCIAS) {
        await expect(canvas.getByRole('switch', { name: label })).toBeVisible();
      }
    });

    await step('A descrição fica fora do nome do controle', async () => {
      // Se ela entrasse no rótulo, o leitor de tela anunciaria a frase inteira
      // a cada passagem pelo interruptor.
      await expect(
        canvas.getByRole('switch', { name: 'Receber novidades por email' }),
      ).not.toHaveAccessibleName(/Resumo semanal/);
    });
  },
};

export const InForm: Story = {
  parameters: {
    docs: {
      // O `form` traz o botão e o `name`, que é o que faz o switch entrar no
      // envio nativo — nada disso está no par do meta.
      source: { transform: formSwitchSource },
      description: {
        story:
          'Switch dentro de um form, participando do envio pelo nome do campo. O valor acompanha o estado do controle.',
      },
    },
  },
  render: () => ({
    components: { Switch, Label, Button },
    setup() { return {}; },
    template: `
      <form class="nds-stack nds-w-sm" data-spacing="sm" @submit.prevent>
        <div class="nds-cluster" data-spacing="sm">
          <Switch id="comp-newsletter" name="newsletter" :default-value="true" />
          <Label :for="'comp-newsletter'">Aceitar newsletter semanal</Label>
        </div>
        <Button type="submit">Salvar preferências</Button>
      </form>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');
    const form = canvasElement.querySelector('form')!;

    await step('O formulário reúne o controle e o envio', async () => {
      await expect(canvas.getByRole('button', { name: 'Salvar preferências' })).toBeVisible();
    });

    await step('O campo entra no envio e acompanha o controle nos dois sentidos', async () => {
      // Só a ida provaria pouco: um valor escrito uma vez passaria igual. É a
      // volta que mostra que o envio reflete o estado a cada mudança — e o par
      // devolve a story ao estado inicial, que é o que o Chromatic fotografa.
      await expect(new FormData(form).get('newsletter')).not.toBeNull();
      await definir(sw, false);
      await expect(new FormData(form).get('newsletter')).toBeNull();
      await definir(sw, true);
      await expect(new FormData(form).get('newsletter')).not.toBeNull();
    });
  },
};

export const Controlled: Story = {
  parameters: {
    docs: {
      // O estado externo vive num `ref` do setup.
      source: { transform: switchControlledSource },
      description: {
        story:
          'Switch controlado — o componente pai mantém o estado e o atualiza pela ligação de mudança.',
      },
    },
  },
  render: () => ({
    components: { Switch, Label },
    setup() {
      const ativo = ref(false);
      return { ativo };
    },
    template: `
      <div class="nds-stack nds-w-sm" data-align="start" data-spacing="sm">
        <div class="nds-cluster" data-spacing="sm">
          <Switch id="comp-controlled" v-model="ativo" />
          <Label :for="'comp-controlled'">Receber notificações</Label>
        </div>
        <p class="nds-text-caption nds-text-muted-foreground">
          Estado atual: <code class="nds-font-mono">{{ ativo }}</code>
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('O estado externo acompanha o controle', async () => {
      // Ligar o valor sem a volta deixaria o interruptor inerte: ele deixa de
      // ser dono do próprio estado e ninguém assume o lugar. É esse defeito
      // que o texto refletido na tela denuncia.
      await definir(sw, true);
      await expect(canvas.getByText('true')).toBeVisible();
      await definir(sw, false);
      await expect(canvas.getByText('false')).toBeVisible();
    });
  },
};
