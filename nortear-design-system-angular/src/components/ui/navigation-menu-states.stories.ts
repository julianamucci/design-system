import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect } from 'storybook/test';
import { NDS_NAVIGATION_MENU } from './navigation-menu';
import { waitForPanel, popupOpen } from './navigation-menu.fixtures';

const meta: Meta = {
  title: 'Components/Navigation/NavigationMenu/States',
  tags: ['navigation'],
  decorators: [moduleMetadata({ imports: [...NDS_NAVIGATION_MENU] })],
  parameters: {
    layout: 'padded',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Os três estados canônicos: Fechado (só a barra), Aberto (painel do item ativo no ' +
          'popup compartilhado) e Ativo (o destino da página atual, marcado com ' +
          '`aria-current="page"`).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Closed ───────────────────────────────────────────────────────────────────

export const Closed: Story = {
  parameters: { covers: ['accessibility.item1'] },
  render: () => ({
    template: `
      <nav ndsNavigationMenu aria-label="Navegação principal">
        <ul ndsNavigationMenuList>
          <li ndsNavigationMenuItem>
            <a ndsNavigationMenuLink href="#inicio">Início</a>
          </li>

          <li ndsNavigationMenuItem value="produtos">
            <button ndsNavigationMenuTrigger>Produtos</button>

            <ng-template ndsNavigationMenuContent>
              <ul ndsNavigationMenuPanel class="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
                <li>
                  <a ndsNavigationMenuChild href="#inicial">
                    <div ndsNavigationMenuChildLabel>Plano Inicial</div>
                  </a>
                </li>
              </ul>
            </ng-template>
          </li>

          <li ndsNavigationMenuItem>
            <a ndsNavigationMenuLink href="#sobre">Sobre</a>
          </li>
        </ul>
      </nav>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Fechado, o painel não existe no DOM', async () => {
      // O portal DESMONTA ao fechar. O painel não é um bloco escondido: quem
      // navega com leitor de tela não o encontra, e nenhum link dele entra na
      // ordem de tabulação.
      await expect(popupOpen()).toBeNull();
      await expect(canvas.queryByRole('link', { name: 'Plano Inicial' })).toBeNull();
    });

    await step('O gatilho anuncia o estado recolhido', async () => {
      const trigger = canvas.getByRole('button', { name: 'Produtos' });
      await expect(trigger.getAttribute('aria-expanded')).toBe('false');
      await expect(trigger.hasAttribute('data-popup-open')).toBe(false);
    });
  },
};

// ─── Open ─────────────────────────────────────────────────────────────────────

export const Open: Story = {
  parameters: { covers: ['accessibility.item3', 'visual.item4', 'accessibility.item6'] },
  render: () => ({
    template: `
      <nav
        ndsNavigationMenu
        aria-label="Navegação principal"
        defaultValue="produtos"
        indicator
      >
        <ul ndsNavigationMenuList>
          <li ndsNavigationMenuItem>
            <a ndsNavigationMenuLink href="#inicio">Início</a>
          </li>

          <li ndsNavigationMenuItem value="produtos">
            <button ndsNavigationMenuTrigger>Produtos</button>

            <ng-template ndsNavigationMenuContent>
              <ul ndsNavigationMenuPanel class="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
                <li>
                  <a ndsNavigationMenuChild href="#inicial">
                    <div ndsNavigationMenuChildLabel>Plano Inicial</div>
                  </a>
                </li>
                <li>
                  <a ndsNavigationMenuChild href="#profissional">
                    <div ndsNavigationMenuChildLabel>Plano Profissional</div>
                  </a>
                </li>
                <li>
                  <a ndsNavigationMenuChild href="#empresarial">
                    <div ndsNavigationMenuChildLabel>Plano Empresarial</div>
                  </a>
                </li>
              </ul>
            </ng-template>
          </li>
        </ul>
      </nav>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Produtos' });
    const panel = await waitForPanel();
    const popup = panel.closest<HTMLElement>('.nds-navigation-menu-popup');

    await step('O item nasce aberto e o gatilho reflete o estado', async () => {
      // `defaultValue` é o único input em jogo aqui: se ele não chegasse, a
      // barra nasceria fechada e o `waitForPanel` acima já teria estourado.
      await expect(trigger.getAttribute('aria-expanded')).toBe('true');
      await expect(trigger.hasAttribute('data-popup-open')).toBe(true);
      await expect(within(panel).getAllByRole('link')).toHaveLength(3);
    });

    await step('O gatilho aponta para o painel que abriu', async () => {
      const target = trigger.getAttribute('aria-controls');
      await expect(target).toBeTruthy();
      await expect(popup?.id).toBe(target);
    });

    await step('A seta indicadora existe enquanto o painel está aberto', async () => {
      // `indicator` é um input booleano: sem ele a seta não é renderizada. A
      // asserção prova que o input chegou (e não que o default mudou).
      const arrow = popup?.querySelector('[data-slot="navigation-menu-indicator"]');
      await expect(arrow).toBeTruthy();
      // Decorativa: quem lê a tela já tem `aria-expanded` no gatilho.
      await expect(arrow?.getAttribute('aria-hidden')).toBe('true');
    });

    await step('O fundo do painel é opaco', async () => {
      // O contraste de 4.5:1 que o axe mede entre o texto do destino e o fundo
      // do painel só significa alguma coisa se o fundo for opaco: sobre um
      // painel translúcido a razão medida é a do que estiver por baixo.
      const background = getComputedStyle(popup as HTMLElement).backgroundColor;
      await expect(background).not.toBe('rgba(0, 0, 0, 0)');
      await expect(background).not.toBe('transparent');
      await expect(background.startsWith('rgba(')).toBe(false);
    });
  },
};

// ─── Active ───────────────────────────────────────────────────────────────────

export const Active: Story = {
  parameters: { covers: ['functional.item6', 'accessibility.item4', 'visual.item3'] },
  render: () => ({
    template: `
      <nav ndsNavigationMenu aria-label="Navegação principal">
        <ul ndsNavigationMenuList>
          <li ndsNavigationMenuItem>
            <a ndsNavigationMenuLink href="#inicio" active>Início</a>
          </li>
          <li ndsNavigationMenuItem>
            <a ndsNavigationMenuLink href="#produtos">Produtos</a>
          </li>
          <li ndsNavigationMenuItem>
            <a ndsNavigationMenuLink href="#sobre">Sobre</a>
          </li>
        </ul>
      </nav>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const current = canvas.getByRole('link', { name: 'Início' });
    const other = canvas.getByRole('link', { name: 'Sobre' });

    await step('A página atual é anunciada como tal', async () => {
      // `aria-current="page"` é o que faz o leitor de tela dizer "página
      // atual". Sem o input `active` chegando ao componente, o atributo não
      // existiria — e o defeito seria invisível na tela.
      await expect(current.getAttribute('aria-current')).toBe('page');
      await expect(other.hasAttribute('aria-current')).toBe(false);
    });

    await step('O destaque não depende só do texto: o fundo muda', async () => {
      // Critério 1.4.1 na prática. O seletor do CSS é
      // `.nds-navigation-menu-link[data-active]` — se o atributo não chegasse,
      // esta asserção pegaria o mesmo fundo do link vizinho.
      await expect(current.hasAttribute('data-active')).toBe(true);
      await expect(getComputedStyle(current).backgroundColor).not.toBe(
        getComputedStyle(other).backgroundColor,
      );
    });
  },
};
