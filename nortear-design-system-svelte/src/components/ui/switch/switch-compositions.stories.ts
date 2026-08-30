import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import SwitchStory from './SwitchStory.svelte';
import SwitchControlledStory from './SwitchControlledStory.svelte';
import SwitchFormStory from './SwitchFormStory.svelte';
import SwitchSettingsListStory from './SwitchSettingsListStory.svelte';
import { definir } from './switch.fixtures';
import {
  switchControlledSource,
  switchFormSource,
  switchSettingsListSource,
  switchSource,
} from './switch.source';

const meta: Meta = {
  title: 'Primitives/Form/Switch/Compositions',
  component: SwitchStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // As duas primeiras composições são args do MESMO controle — a cascata já
      // entrega o snippet certo em cada uma. As três seguintes têm componente
      // próprio, e cada uma declara a sua transform.
      source: { transform: switchSource },
      description: {
        component:
          'Composições do Switch: rótulo associado, nome sem rótulo visível, lista de configurações, formulário e estado controlado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Mesmas três preferências que a docs page e o snippet mostram. */
const PREFERENCIAS = [
  { id: 'pref-email', label: 'Receber novidades por email' },
  { id: 'pref-push', label: 'Receber notificações push' },
  { id: 'pref-sms', label: 'Alertas por SMS' },
];

export const WithLabel: Story = {
  args: {
    checked: false,
    withLabel: true,
    labelText: 'Receber notificações',
    id: 'comp-label',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Par obrigatório Switch + Label. A associação via for/id permite que o clique no rótulo alterne o controle.',
      },
    },
  },
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
  args: {
    checked: false,
    withLabel: false,
    id: 'comp-no-label',
    ariaLabel: 'Ativar modo escuro',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Sem rótulo visível, o nome acessível vive em aria-label. Use apenas quando o contexto ao redor já nomeia a função.',
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
      // visível, o exemplo seria WithLabel com um aria-label redundante.
      await expect(canvas.queryByText('Ativar modo escuro')).toBeNull();
    });
  },
};

export const SettingsList: Story = {
  parameters: {
    docs: {
      source: { transform: switchSettingsListSource },
      description: {
        story:
          'Lista de configurações com vários Switches em painéis empilhados. Padrão para tela de preferências do usuário.',
      },
    },
  },
  render: () => ({ Component: SwitchSettingsListStory, props: {} }),
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
      source: { transform: switchFormSource },
      description: {
        story:
          'Switch dentro de um form, participando do envio pelo nome do campo. O valor acompanha o estado do controle.',
      },
    },
  },
  render: () => ({ Component: SwitchFormStory, props: { checked: true, name: 'newsletter', id: 'comp-newsletter' } }),
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
      source: { transform: switchControlledSource },
      description: {
        story:
          'Switch controlado — o estado vive fora do componente e volta pela ligação de mudança.',
      },
    },
  },
  render: () => ({ Component: SwitchControlledStory, props: { checked: false, id: 'comp-controlled' } }),
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
