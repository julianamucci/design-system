import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createNavigationMenu } from './navigation-menu';
import { waitForPanel, waitForPanelVanish, panelOpen } from './navigation-menu.fixtures';
import { navigationMenuSource } from './navigation-menu.source';
import { createNavigationMenuDocs } from '@/components/docs/NavigationMenuDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type NavigationMenuArgs = {
  delayDuration: number;
  orientation: 'horizontal' | 'vertical';
};

const meta: Meta<NavigationMenuArgs> = {
  title: 'UI/NavigationMenu',
  tags: ['autodocs', 'navigation'],
  parameters: {
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(createNavigationMenuDocs),
      source: { transform: navigationMenuSource },
    },
  },
  argTypes: {
    delayDuration: {
      control: { type: 'number', min: 0, max: 1000, step: 50 },
      description: 'Espera em ms antes de abrir o painel quando o ponteiro entra no gatilho.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '200' } },
    },
    orientation: {
      control: { type: 'inline-radio' },
      options: ['horizontal', 'vertical'],
      description: 'Direção da barra. Vertical serve a barras laterais e gavetas móveis.',
      table: { type: { summary: "'horizontal' | 'vertical'" }, defaultValue: { summary: "'horizontal'" } },
    },
  },
  args: {
    delayDuration: 100,
    orientation: 'horizontal',
  },
};

export default meta;
type Story = StoryObj<NavigationMenuArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

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
  render: (args) => {
    const container = document.createElement('div');
    container.style.contain = 'layout';
    container.className = 'nds-cluster nds-w-full nds-p-2';
    container.dataset.justify = 'center';
    container.style.alignItems = 'flex-start';
    container.style.minHeight = '260px';

    const nav = createNavigationMenu(
      [
        { label: 'Início', href: '#inicio' },
        {
          label: 'Produtos',
          children: [
            { label: 'Plano Inicial', href: '#inicial' },
            { label: 'Plano Profissional', href: '#profissional' },
          ],
        },
        {
          label: 'Soluções',
          children: [
            { label: 'Para Marketing', href: '#marketing' },
            { label: 'Para Vendas', href: '#vendas' },
          ],
        },
        { label: 'Sobre', href: '#sobre' },
      ],
      { orientation: args.orientation, delayDuration: args.delayDuration },
    );
    nav.setAttribute('aria-label', 'Navegação principal');
    container.appendChild(nav);
    return container;
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
      // nova aba, entra no histórico e mostra o destino na barra de status. Com
      // `role="menuitem"` — como esta factory fazia — o leitor de tela deixa de
      // anunciar "link" e as três coisas somem.
      const links = within(barra).getAllByRole('link');
      await expect(links).toHaveLength(2);
      for (const link of links) await expect(link.tagName).toBe('A');
    });

    await step('Fechado, o gatilho anuncia apenas que está recolhido', async () => {
      await expect(produtos).toHaveAttribute('aria-expanded', 'false');
      await expect(panelOpen(canvasElement)).toBeNull();
    });

    await step('Setas movem o foco entre os itens da barra', async () => {
      produtos.focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(document.activeElement).toBe(solucoes);
      await userEvent.keyboard('{ArrowLeft}');
      await expect(document.activeElement).toBe(produtos);
    });

    await step('Enter abre o painel e alcança os destinos pelo teclado', async () => {
      await userEvent.keyboard('{Enter}');
      const painel = await waitForPanel(canvasElement);
      await expect(produtos).toHaveAttribute('aria-expanded', 'true');

      const primeiro = within(painel).getByRole('link', { name: 'Plano Inicial' });
      // Alcançável por teclado: nenhum destino do painel sai da ordem de foco.
      await expect(primeiro).not.toHaveAttribute('tabindex', '-1');
      primeiro.focus();
      await expect(document.activeElement).toBe(primeiro);
    });

    await step('Escape fecha e devolve o foco ao gatilho', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForPanelVanish(canvasElement);
      await expect(produtos).toHaveAttribute('aria-expanded', 'false');
      // O foco não pode cair no corpo do documento: quem navega por teclado
      // teria de percorrer a página inteira de novo para voltar ao ponto.
      await expect(document.activeElement).toBe(produtos);
    });

    await step('O ponteiro abre o painel sem clique', async () => {
      await userEvent.hover(produtos);
      const painel = await waitForPanel(canvasElement);
      await expect(painel.textContent).toContain('Plano Inicial');
    });

    await step('Passar de um gatilho ao outro troca o painel sem fechá-lo', async () => {
      await userEvent.hover(solucoes);
      await waitFor(async () => {
        const painel = panelOpen(canvasElement);
        await expect(painel?.textContent).toContain('Para Marketing');
      });
      // Um painel por vez, e a troca é instantânea: reesperar entre dois
      // gatilhos vizinhos faria o painel piscar no caminho.
      await expect(solucoes).toHaveAttribute('aria-expanded', 'true');
      await expect(produtos).toHaveAttribute('aria-expanded', 'false');
    });

    await step('A barra volta ao repouso ao final', async () => {
      // A story termina fechada de propósito: o axe roda depois da play, e um
      // painel flutuante aberto mediria contraste sobre a página inteira.
      await userEvent.keyboard('{Escape}');
      await waitForPanelVanish(canvasElement);
      await expect(solucoes).toHaveAttribute('aria-expanded', 'false');
    });
  },
};
