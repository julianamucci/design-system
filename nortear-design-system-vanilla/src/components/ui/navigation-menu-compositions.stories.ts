import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import { createNavigationMenu } from './navigation-menu';
import {
  abrir,
  waitForPanel,
  waitForPanelVanish,
  panelOpen,
  wrap,
} from './navigation-menu.fixtures';
import {
  navigationMenuSource,
  navigationMenuSourceWith,
  navigationMenuSourceHighlight,
  navigationMenuSourceMega,
} from './navigation-menu.source';

const meta: Meta = {
  tags: ['navigation'],
  title: 'UI/NavigationMenu/Compositions',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

// A altura da moldura vai explícita em cada chamada de `wrap`: o padrão da
// fixture (240) serve à barra comum, e o painel destas composições é mais alto.

/**
 * Impede a navegação de verdade, como um roteador de cliente faria.
 *
 * Sem isto o clique tira a própria PÁGINA DE TESTE do ar — a conexão do runner
 * com o navegador morre e a story inteira some do resultado, sem asserção
 * nenhuma falhando. O fechamento do painel não depende deste `preventDefault`:
 * o destino fecha a barra de qualquer jeito, justamente porque quem usa roteador
 * chama `preventDefault` e continua querendo o painel fechado.
 */
function impedirNavigation(nav: HTMLElement): void {
  for (const a of nav.querySelectorAll('a')) {
    a.addEventListener('click', (e) => e.preventDefault());
  }
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const SimpleLink: Story = {
  // Sem hierarquia não há painel — e é justamente isso que a story afirma. O
  // snippet do meta, que traz um item com filhos, diria o contrário.
  parameters: {
    docs: {
      source: {
        transform: navigationMenuSourceWith({
          ariaLabel: 'Navegação institucional',
          items: [
            { label: 'Início', href: '#inicio', active: true },
            { label: 'Preços', href: '#precos' },
            { label: 'Contato', href: '#contato' },
          ],
        }),
      },
    },
  },
  render: () => {
    const nav = createNavigationMenu([
      { label: 'Início', href: '#inicio', active: true },
      { label: 'Preços', href: '#precos' },
      { label: 'Contato', href: '#contato' },
    ]);
    nav.setAttribute('aria-label', 'Navegação institucional');
    impedirNavigation(nav);
    return wrap(nav, 160);
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
  parameters: {
    covers: ['functional.item5'],
    docs: {
      source: {
        transform: navigationMenuSourceWith({
          items: [
            { label: 'Início', href: '#inicio' },
            {
              label: 'Planos',
              children: [
                { label: 'Plano Inicial', href: '#inicial' },
                { label: 'Plano Profissional', href: '#profissional' },
                { label: 'Plano Empresarial', href: '#empresarial' },
              ],
            },
            { label: 'Contato', href: '#contato' },
          ],
        }),
      },
    },
  },
  render: () => {
    const nav = createNavigationMenu([
      { label: 'Início', href: '#inicio' },
      {
        label: 'Planos',
        children: [
          { label: 'Plano Inicial', href: '#inicial' },
          { label: 'Plano Profissional', href: '#profissional' },
          { label: 'Plano Empresarial', href: '#empresarial' },
        ],
      },
      { label: 'Contato', href: '#contato' },
    ]);
    nav.setAttribute('aria-label', 'Navegação principal');
    impedirNavigation(nav);
    return wrap(nav, 300);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: /Planos/ });

    await step('O painel abre com os três destinos', async () => {
      const painel = await abrir(gatilho, canvasElement);
      await expect(within(painel).getAllByRole('link')).toHaveLength(3);
    });

    await step('Escolher um destino fecha o painel', async () => {
      // Navegar É sair da página: um painel que sobrevive ao clique fica
      // pendurado sobre a página seguinte.
      const painel = await waitForPanel(canvasElement);
      await userEvent.click(within(painel).getByRole('link', { name: 'Plano Profissional' }));
      await waitForPanelVanish(canvasElement);
      await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
    });

    await step('O foco volta a ser alcançável na barra', async () => {
      await expect(panelOpen(canvasElement)).toBeNull();
      await expect(canvas.getAllByRole('link')).toHaveLength(2);
    });
  },
};

export const MegaMenuGrid: Story = {
  // Forma diferente de snippet: as duas colunas são composição de quem usa, em
  // cima do painel que a fábrica devolve em coluna única.
  parameters: {
    covers: ['visual.item2'],
    docs: {
      source: {
        transform: navigationMenuSourceMega({
          ariaLabel: 'Navegação de soluções',
          items: [
            { label: 'Início', href: '#inicio' },
            {
              label: 'Soluções',
              children: [
                { label: 'Para Marketing', href: '#marketing', description: 'Campanhas, automação e atribuição num lugar só.' },
                { label: 'Para Vendas', href: '#vendas', description: 'Funil, previsão e histórico de cada negociação.' },
                { label: 'Para Suporte', href: '#suporte', description: 'Fila de atendimento, base de conhecimento e métricas.' },
                { label: 'Para Financeiro', href: '#financeiro', description: 'Cobrança recorrente, conciliação e relatórios fiscais.' },
              ],
            },
          ],
        }),
      },
    },
  },
  render: () => {
    const nav = createNavigationMenu([
      { label: 'Início', href: '#inicio' },
      {
        label: 'Soluções',
        children: [
          { label: 'Para Marketing', href: '#marketing', description: 'Campanhas, automação e atribuição num lugar só.' },
          { label: 'Para Vendas', href: '#vendas', description: 'Funil, previsão e histórico de cada negociação.' },
          { label: 'Para Suporte', href: '#suporte', description: 'Fila de atendimento, base de conhecimento e métricas.' },
          { label: 'Para Financeiro', href: '#financeiro', description: 'Cobrança recorrente, conciliação e relatórios fiscais.' },
        ],
      },
    ]);
    nav.setAttribute('aria-label', 'Navegação de soluções');
    impedirNavigation(nav);

    // O painel padrão é uma coluna; duas colunas são composição de quem usa, e
    // saem das utilities compartilhadas — nada de largura em `style` inline,
    // que ficaria de fora do tema e da escala.
    const painel = nav.querySelector<HTMLElement>('.nds-navigation-menu-content');
    painel?.classList.add('nds-grid', 'nds-w-lg');
    painel?.setAttribute('data-fixed', '');
    if (painel) {
      painel.dataset.cols = '2';
      painel.dataset.spacing = 'sm';
    }
    return wrap(nav, 340);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: /Soluções/ });
    // A story TERMINA ABERTA: é o estado que a regressão visual precisa
    // capturar. `abrir` é idempotente e sobrevive ao replay.
    const painel = await abrir(gatilho, canvasElement);

    await step('Quatro destinos em duas colunas', async () => {
      const targets = [...painel.querySelectorAll<HTMLElement>('a')];
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
      const destination = within(painel).getByRole('link', { name: /Para Marketing/ });
      await expect(destination.textContent).toContain('Campanhas');
    });

    await step('O gatilho continua sendo o dono do painel', async () => {
      await expect(gatilho).toHaveAttribute('aria-expanded', 'true');
      await expect(panelOpen(canvasElement)).not.toBeNull();
    });
  },
};

export const WithHighlightedCard: Story = {
  parameters: {
    docs: {
      source: {
        transform: navigationMenuSourceHighlight({
          ariaLabel: 'Navegação de recursos',
          items: [
            { label: 'Início', href: '#inicio' },
            {
              label: 'Recursos',
              children: [
                { label: 'Comece agora', href: '#comece', description: 'Publique o primeiro projeto em menos de cinco minutos.' },
                { label: 'Guias', href: '#guias' },
                { label: 'Referência da API', href: '#api' },
                { label: 'Novidades', href: '#changelog' },
              ],
            },
          ],
        }),
      },
    },
  },
  render: () => {
    const nav = createNavigationMenu([
      { label: 'Início', href: '#inicio' },
      {
        label: 'Recursos',
        children: [
          { label: 'Comece agora', href: '#comece', description: 'Publique o primeiro projeto em menos de cinco minutos.' },
          { label: 'Guias', href: '#guias' },
          { label: 'Referência da API', href: '#api' },
          { label: 'Novidades', href: '#changelog' },
        ],
      },
    ]);
    nav.setAttribute('aria-label', 'Navegação de recursos');
    impedirNavigation(nav);

    const painel = nav.querySelector<HTMLElement>('.nds-navigation-menu-content');
    if (painel) {
      painel.classList.add('nds-grid', 'nds-w-lg');
      painel.setAttribute('data-fixed', '');
      painel.dataset.cols = '2';
      painel.dataset.spacing = 'sm';

      const targets = [...painel.querySelectorAll<HTMLElement>('.nds-navigation-menu-child')];
      const [highlight, ...apoio] = targets;
      // O destaque ocupa a coluna inteira; os complementares empilham na outra.
      highlight.classList.add('nds-h-full');
      const coluna = document.createElement('div');
      coluna.className = 'nds-stack';
      coluna.dataset.spacing = 'xs';
      for (const link of apoio) coluna.appendChild(link);
      painel.appendChild(coluna);
    }
    return wrap(nav, 340);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: /Recursos/ });
    const painel = await abrir(gatilho, canvasElement);

    await step('Um destino em destaque e três de apoio', async () => {
      const targets = [...painel.querySelectorAll<HTMLElement>('a')];
      await expect(targets).toHaveLength(4);
      // O destaque ocupa a coluna inteira: é mais alto que qualquer um dos
      // complementares, que é como a hierarquia aparece sem depender de cor.
      const highlight = targets[0].getBoundingClientRect();
      const apoio = targets[1].getBoundingClientRect();
      await expect(highlight.height).toBeGreaterThan(apoio.height);
    });

    await step('Tab alcança todo o painel', async () => {
      const targets = [...painel.querySelectorAll<HTMLElement>('a')];
      for (const destination of targets) {
        await expect(destination.getAttribute('tabindex')).not.toBe('-1');
      }
      targets[0].focus();
      await expect(document.activeElement).toBe(targets[0]);
      await userEvent.tab();
      await expect(painel.contains(document.activeElement)).toBe(true);
    });
  },
};
