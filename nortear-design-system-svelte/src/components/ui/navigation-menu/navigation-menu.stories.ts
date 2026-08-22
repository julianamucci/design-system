import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import NavigationMenuStory from './NavigationMenuStory.svelte';
import { waitForPanel, waitForPanelVanish, panelOpen } from './navigation-menu.fixtures';
import NavigationMenuDocs from '@/components/docs/NavigationMenuDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { navigationMenuSource } from './navigation-menu.source';

const meta: Meta = {
  title: 'UI/NavigationMenu',
  component: NavigationMenuStory,
  tags: ['autodocs', 'navigation'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(NavigationMenuDocs),
      source: { transform: navigationMenuSource },
    },
  },
  argTypes: {
    defaultValue: {
      control: 'text',
      description: 'Item aberto ao montar; use o mesmo identificador declarado no item da barra.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    delayDuration: {
      control: { type: 'number', min: 0, max: 1000, step: 50 },
      description: 'Espera em ms antes de abrir o painel quando o ponteiro entra no gatilho.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '100' } },
    },
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
      description: 'Direção da barra. Vertical serve a barras laterais e gavetas móveis.',
      table: { type: { summary: "'horizontal' | 'vertical'" }, defaultValue: { summary: "'horizontal'" } },
    },
    ariaLabel: {
      control: 'text',
      description: 'Nome do landmark de navegação. Obrigatório: sem ele o leitor anuncia só "navegação".',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'Navegação principal'" } },
    },
    demonstration: {
      control: 'select',
      options: ['default', 'bar', 'simpleLink', 'withDropdown', 'megaMenuGrid', 'withFeatured'],
      description: 'Composição interna usada na demonstração.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'default'" } },
    },
    activeHref: {
      control: 'text',
      description: 'Destino marcado como página atual.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    indicator: {
      control: 'boolean',
      description: 'Seta apontando para o gatilho ativo.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
  },
  args: {
    defaultValue: undefined,
    delayDuration: 100,
    orientation: 'horizontal',
    ariaLabel: 'Navegação principal',
    demonstration: 'default',
    activeHref: undefined,
    indicator: false,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item2',
      'functional.item3',
      'functional.item4',
      'functional.item7',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item5',
    ],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const barra = canvas.getByRole('navigation', { name: 'Navegação principal' });
    const produtos = canvas.getByRole('button', { name: /Produtos/ });
    const solucoes = canvas.getByRole('button', { name: /Soluções/ });

    await step('A barra é um landmark com nome próprio', async () => {
      // Sem nome, o leitor de tela anuncia só "navegação"; com dois landmarks
      // homônimos na mesma página o axe reprova em landmark-unique.
      await expect(barra.tagName).toBe('NAV');
      await expect(barra).toHaveAttribute('aria-label', 'Navegação principal');
    });

    await step('Os destinos da barra são links de verdade', async () => {
      // É o que distingue navegação de menu de comandos: um `<a href>` abre em
      // nova aba, entra no histórico e mostra o destino na barra de status.
      const links = within(barra).getAllByRole('link');
      await expect(links).toHaveLength(2);
      for (const link of links) await expect(link.tagName).toBe('A');
    });

    await step('Fechado, o gatilho anuncia apenas que está recolhido', async () => {
      await expect(produtos).toHaveAttribute('aria-expanded', 'false');
      await expect(panelOpen()).toBeNull();
    });

    await step('Setas movem o foco entre os itens da barra', async () => {
      produtos.focus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(solucoes);
      });
      await userEvent.keyboard('{ArrowLeft}');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(produtos);
      });
    });

    await step('Enter abre o painel e alcança os destinos pelo teclado', async () => {
      await userEvent.keyboard('{Enter}');
      const conteudo = await waitForPanel();
      await expect(produtos).toHaveAttribute('aria-expanded', 'true');

      const primeiro = within(conteudo).getByRole('link', { name: 'Plano Inicial' });
      // Alcançável por teclado: nenhum destino do painel sai da ordem de foco.
      await expect(primeiro).not.toHaveAttribute('tabindex', '-1');
      primeiro.focus();
      await expect(document.activeElement).toBe(primeiro);
    });

    await step('Escape fecha e devolve o foco ao gatilho', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForPanelVanish();
      await expect(produtos).toHaveAttribute('aria-expanded', 'false');
      // O foco não pode cair no corpo do documento: quem navega por teclado
      // teria de percorrer a página inteira de novo para voltar ao ponto.
      await waitFor(async () => {
        await expect(document.activeElement).toBe(produtos);
      });
    });

    await step('O ponteiro abre o painel sem clique', async () => {
      await userEvent.hover(produtos);
      const conteudo = await waitForPanel();
      await expect(conteudo.textContent).toContain('Plano Inicial');
    });

    await step('Passar de um gatilho ao outro troca o painel sem fechá-lo', async () => {
      await userEvent.hover(solucoes);
      await waitFor(async () => {
        const conteudo = document.body.querySelector('.nds-navigation-menu-viewport-content');
        await expect(conteudo?.textContent).toContain('Para Marketing');
      });
      // O painel é um só e nunca desmontou: a troca é instantânea, sem reabrir
      // a espera de hover.
      await expect(panelOpen()).not.toBeNull();
      await expect(solucoes).toHaveAttribute('aria-expanded', 'true');
    });

    await step('A barra volta ao repouso ao final', async () => {
      // A story termina fechada de propósito: o axe roda depois da play, e um
      // painel flutuante aberto mediria contraste sobre a página inteira.
      await userEvent.keyboard('{Escape}');
      await waitForPanelVanish();
      await expect(solucoes).toHaveAttribute('aria-expanded', 'false');
    });
  },
};
