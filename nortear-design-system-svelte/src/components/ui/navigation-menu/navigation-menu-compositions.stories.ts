import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, userEvent } from 'storybook/test';
import NavigationMenuStory from './NavigationMenuStory.svelte';
import { abrir, waitForPanel, waitForPanelVanish, panelOpen } from './navigation-menu.fixtures';
import { navigationMenuSource } from './navigation-menu.source';
import { FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';

const meta: Meta = {
  title: 'UI/NavigationMenu/Compositions',
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
          'As quatro formas canônicas do painel, do mais simples ao mais denso: só destinos diretos, um item com lista vertical, um mega-menu em duas colunas com descrição e um painel com destino em destaque ao lado dos complementares.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const SimpleLink: Story = {
  args: {
    demonstration: 'simpleLink',
    ariaLabel: 'Navegação institucional',
    delayDuration: 100,
    activeHref: '#inicio',
  },
  parameters: {
    docs: {
      description: {
        story: 'Apenas destinos diretos, sem painel — ideal para três a cinco categorias planas.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Sem gatilho: cada item navega no clique', async () => {
      // É a diferença que decide se o NavigationMenu vale a pena. Sem hierarquia
      // não há painel — e sem painel não há botão nenhum na barra.
      await expect(canvas.getAllByRole('link')).toHaveLength(3);
      await expect(canvas.queryAllByRole('button')).toHaveLength(0);
    });

    await step('O foco percorre a barra pelas setas', async () => {
      const links = canvas.getAllByRole('link');
      links[0].focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(document.activeElement).toBe(links[1]);
    });
  },
};

export const WithDropdown: Story = {
  args: {
    demonstration: 'withDropdown',
    ariaLabel: 'Navegação principal',
    delayDuration: 100,
  },
  parameters: {
    covers: ['functional.item5'],
    docs: {
      description: {
        story:
          'Um gatilho com lista vertical de destinos — padrão comum para três a oito páginas relacionadas.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: /Planos/ });

    await step('O painel abre com os três destinos', async () => {
      const conteudo = await abrir(gatilho);
      await expect(within(conteudo).getAllByRole('link')).toHaveLength(3);
    });

    await step('Escolher um destino fecha o painel', async () => {
      // Navegar É sair da página: um painel que sobrevive ao clique fica
      // pendurado sobre a página seguinte.
      const conteudo = await waitForPanel();
      await userEvent.click(within(conteudo).getByRole('link', { name: 'Plano Profissional' }));
      await waitForPanelVanish();
      await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
    });

    await step('O foco volta a ser alcançável na barra', async () => {
      await expect(panelOpen()).toBeNull();
      await expect(canvas.getAllByRole('link')).toHaveLength(2);
    });
  },
};

export const MegaMenuGrid: Story = {
  args: {
    demonstration: 'megaMenuGrid',
    ariaLabel: 'Navegação de soluções',
    defaultValue: 'solucoes',
    delayDuration: 100,
  },
  parameters: {
    covers: ['visual.item2'],
    // Esta story termina com o painel ABERTO; ver a nota da regra.
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      description: {
        story:
          'Painel em duas colunas, com título e uma linha de contexto por destino — útil para apresentar soluções sem obrigar o leitor a adivinhar o que há do outro lado.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const conteudo = await waitForPanel();

    await step('Quatro destinos em duas colunas', async () => {
      const targets = [...conteudo.querySelectorAll<HTMLElement>('a')];
      await expect(targets).toHaveLength(4);
      // Duas colunas de verdade: o segundo destino está à direita do primeiro,
      // na mesma linha; o terceiro desce.
      const [a, b, c] = targets.map((d) => d.getBoundingClientRect());
      await expect(b.left).toBeGreaterThan(a.left);
      await expect(Math.abs(b.top - a.top)).toBeLessThan(2);
      await expect(c.top).toBeGreaterThan(a.top);
    });

    await step('A descrição faz parte do nome do destino', async () => {
      // Critério 2.4.4 (Link Purpose): "Para Marketing" sozinho não diz o que
      // há do outro lado. Por isso a descrição NÃO recebe aria-hidden.
      const destination = within(conteudo).getByRole('link', { name: /Para Marketing/ });
      await expect(destination.textContent).toContain('Campanhas');
    });

    await step('O gatilho continua sendo o dono do painel', async () => {
      const gatilho = canvas.getByRole('button', { name: /Soluções/ });
      await expect(gatilho).toHaveAttribute('aria-expanded', 'true');
      // Esta story termina ABERTA de propósito: é o estado que a regressão
      // visual precisa capturar.
      await expect(panelOpen()).not.toBeNull();
    });
  },
};

export const WithHighlightedCard: Story = {
  args: {
    demonstration: 'withFeatured',
    ariaLabel: 'Navegação de recursos',
    delayDuration: 100,
  },
  parameters: {
    // Esta story termina com o painel ABERTO; ver a nota da regra.
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      description: {
        story:
          'Um destino em destaque ao lado dos complementares — a hierarquia aparece pelo tamanho do bloco, não por cor.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: /Recursos/ });
    const conteudo = await abrir(gatilho);

    await step('Um destino em destaque e três de apoio', async () => {
      const targets = [...conteudo.querySelectorAll<HTMLElement>('a')];
      await expect(targets).toHaveLength(4);
      // O destaque ocupa a coluna inteira: é mais alto que qualquer um dos
      // complementares, que é como a hierarquia aparece sem depender de cor.
      const highlight = targets[0].getBoundingClientRect();
      const helper = targets[1].getBoundingClientRect();
      await expect(highlight.height).toBeGreaterThan(helper.height);
    });

    await step('Tab alcança todo o painel', async () => {
      const targets = [...conteudo.querySelectorAll<HTMLElement>('a')];
      for (const destination of targets) {
        await expect(destination.getAttribute('tabindex')).not.toBe('-1');
      }
      targets[0].focus();
      await expect(document.activeElement).toBe(targets[0]);
      await userEvent.tab();
      await expect(conteudo.contains(document.activeElement)).toBe(true);
    });
  },
};
