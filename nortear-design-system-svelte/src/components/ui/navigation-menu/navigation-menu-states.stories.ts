import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import NavigationMenuStory from './NavigationMenuStory.svelte';
import { waitForPanel, panelOpen } from './navigation-menu.fixtures';
import { navigationMenuSource } from './navigation-menu.source';
import { FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';

const meta: Meta = {
  title: 'Primitives/Navigation/NavigationMenu/States',
  component: NavigationMenuStory,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; a composição de cada uma
      // sai dos próprios `args`, que são os mesmos que a demonstração usa.
      source: { transform: navigationMenuSource },
      description: {
        component:
          'Os três estados canônicos: Fechado (só a barra), Aberto (painel do item ativo) e Ativo (o destino da página atual).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Closed: Story = {
  args: {
    defaultValue: undefined,
    demonstration: 'default',
    ariaLabel: 'Navegação principal',
    delayDuration: 100,
  },
  parameters: {
    covers: ['accessibility.item1'],
    docs: {
      description: {
        story: 'Estado padrão — apenas gatilhos e destinos visíveis na barra; nenhum painel aberto.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Fechado, o painel não existe no DOM', async () => {
      // O miolo do painel é DESMONTADO ao fechar. Não é um bloco escondido:
      // quem navega com leitor de tela não o encontra, e nenhum destino dele
      // entra na ordem de tabulação.
      await expect(panelOpen()).toBeNull();
      await expect(canvas.queryByRole('link', { name: 'Plano Inicial' })).toBeNull();
    });

    await step('O gatilho anuncia o estado recolhido', async () => {
      const trigger = canvas.getByRole('button', { name: /Produtos/ });
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toHaveAttribute('data-state', 'closed');
    });
  },
};

export const Open: Story = {
  args: {
    defaultValue: 'produtos',
    demonstration: 'default',
    ariaLabel: 'Navegação principal',
    delayDuration: 100,
    indicator: true,
  },
  parameters: {
    covers: ['accessibility.item3', 'accessibility.item6', 'visual.item4'],
    // Esta story termina com o painel ABERTO; ver a nota da regra.
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      description: {
        story:
          'O item nasce aberto e a seta indicadora aponta para o gatilho. A story termina aberta de propósito: é o estado que a regressão visual precisa capturar.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Produtos/ });
    const content = await waitForPanel();
    const panel = content.closest<HTMLElement>('.nds-navigation-menu-viewport-panel');

    await step('O item nasce aberto e o gatilho reflete o estado', async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(within(content).getAllByRole('link')).toHaveLength(3);
    });

    await step('O gatilho aponta para o painel que abriu', async () => {
      const target = trigger.getAttribute('aria-controls');
      await expect(target).toBeTruthy();
      await expect(document.getElementById(target as string)).toBeTruthy();
    });

    await step('A seta indicadora existe enquanto o painel está aberto', async () => {
      const arrow = document.body.querySelector('[data-slot="navigation-menu-indicator"]');
      await expect(arrow).toBeTruthy();
      await expect(arrow?.querySelector('.nds-navigation-menu-indicator-arrow')).toBeTruthy();
    });

    await step('O fundo do painel é opaco', async () => {
      // O contraste de 4.5:1 que o axe mede entre o texto do destino e o fundo
      // do painel só significa alguma coisa se o fundo for opaco: sobre um
      // painel translúcido a razão medida é a do que estiver por baixo.
      const background = getComputedStyle(panel as HTMLElement).backgroundColor;
      await expect(background).not.toBe('rgba(0, 0, 0, 0)');
      await expect(background.startsWith('rgba(')).toBe(false);
    });
  },
};

export const Active: Story = {
  args: {
    defaultValue: undefined,
    demonstration: 'default',
    ariaLabel: 'Navegação principal',
    delayDuration: 100,
    activeHref: '#inicio',
  },
  parameters: {
    covers: ['functional.item6', 'accessibility.item4', 'visual.item3'],
    docs: {
      description: {
        story:
          'O destino da página atual leva aria-current="page" — o leitor de tela anuncia "página atual" e o fundo muda, porque cor sozinha não informa quem não a distingue.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const current = canvas.getByRole('link', { name: 'Início' });
    const other = canvas.getByRole('link', { name: 'Sobre' });

    await step('A página atual é anunciada como tal', async () => {
      await expect(current).toHaveAttribute('aria-current', 'page');
      await expect(other.hasAttribute('aria-current')).toBe(false);
    });

    await step('O destaque não depende só do texto: o fundo muda', async () => {
      // Critério 1.4.1 na prática. O seletor do CSS é
      // `.nds-navigation-menu-link[aria-current="page"]` — se o atributo não
      // chegasse, esta asserção pegaria o mesmo fundo do destino vizinho.
      await expect(getComputedStyle(current).backgroundColor).not.toBe(
        getComputedStyle(other).backgroundColor,
      );
    });
  },
};
