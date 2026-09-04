import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect } from 'storybook/test';
import { NDS_NAVIGATION_MENU } from './navigation-menu';
import { open, close } from './navigation-menu.fixtures';

const meta: Meta = {
  title: 'Components/Navigation/NavigationMenu/Variants',
  tags: ['navigation'],
  decorators: [moduleMetadata({ imports: [...NDS_NAVIGATION_MENU] })],
  parameters: {
    layout: 'padded',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'As duas direções da barra. `horizontal` é o cabeçalho de site, com os itens em linha e ' +
          'o painel abrindo para baixo; `vertical` é a coluna de uma barra lateral ou gaveta, com ' +
          'os itens empilhados e o painel abrindo para o lado — abrir para baixo numa coluna ' +
          'cobriria os próprios itens seguintes.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Horizontal ───────────────────────────────────────────────────────────────

export const Horizontal: Story = {
  parameters: { covers: ['visual.item1'] },
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
                <li>
                  <a ndsNavigationMenuChild href="#profissional">
                    <div ndsNavigationMenuChildLabel>Plano Profissional</div>
                  </a>
                </li>
              </ul>
            </ng-template>
          </li>

          <li ndsNavigationMenuItem value="recursos">
            <button ndsNavigationMenuTrigger>Recursos</button>

            <ng-template ndsNavigationMenuContent>
              <ul ndsNavigationMenuPanel class="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
                <li>
                  <a ndsNavigationMenuChild href="#guias">
                    <div ndsNavigationMenuChildLabel>Guias</div>
                  </a>
                </li>
                <li>
                  <a ndsNavigationMenuChild href="#api">
                    <div ndsNavigationMenuChildLabel>Referência da API</div>
                  </a>
                </li>
              </ul>
            </ng-template>
          </li>

          <li ndsNavigationMenuItem>
            <a ndsNavigationMenuLink href="#precos">Preços</a>
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
    const list = canvasElement.querySelector<HTMLElement>('[data-slot="navigation-menu-list"]');

    await step('A orientação padrão chega ao markup e à classe da lista', async () => {
      // Afirmar a classe resultante é o que impede o defeito silencioso do
      // fallback JIT: sob JIT os `input()` não são vistos e o componente
      // renderiza com os valores padrão, sem erro nenhum na tela.
      await expect(list).toBeTruthy();
      await expect(list?.getAttribute('data-orientation')).toBe('horizontal');
      await expect(list?.classList.contains('nds-navigation-menu-list')).toBe(true);
      await expect(list?.classList.contains('nds-stack')).toBe(false);
    });

    await step('Cinco itens, dois deles com painel', async () => {
      const items = canvasElement.querySelectorAll('[data-slot="navigation-menu-item"]');
      await expect(items).toHaveLength(5);
      await expect(canvas.getAllByRole('button')).toHaveLength(2);
      await expect(canvas.getAllByRole('link')).toHaveLength(3);
    });

    await step('Os itens ficam lado a lado, na mesma linha', async () => {
      const items = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="navigation-menu-item"]')];
      const first = items[0].getBoundingClientRect();
      const segundo = items[1].getBoundingClientRect();
      await expect(segundo.left).toBeGreaterThan(first.left);
      await expect(Math.abs(segundo.top - first.top)).toBeLessThan(2);
    });

    await step('O painel abre abaixo da barra', async () => {
      const trigger = canvas.getByRole('button', { name: 'Produtos' });
      const panel = await open(trigger);
      const popup = panel.closest<HTMLElement>('.nds-navigation-menu-popup');
      // `data-side` só existe depois de o floating-ui medir — por isso o
      // `open` espera por ele antes de devolver.
      await expect(popup?.getAttribute('data-side')).toBe('bottom');
      await close(trigger);
    });
  },
};

// ─── Vertical ─────────────────────────────────────────────────────────────────

export const Vertical: Story = {
  parameters: { covers: ['visual.item5'] },
  render: () => ({
    template: `
      <nav ndsNavigationMenu aria-label="Navegação da conta" orientation="vertical">
        <ul ndsNavigationMenuList class="nds-w-sm">
          <li ndsNavigationMenuItem>
            <a ndsNavigationMenuLink href="#painel">Painel</a>
          </li>

          <li ndsNavigationMenuItem value="relatorios">
            <button ndsNavigationMenuTrigger>Relatórios</button>

            <ng-template ndsNavigationMenuContent>
              <ul ndsNavigationMenuPanel class="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
                <li>
                  <a ndsNavigationMenuChild href="#vendas">
                    <div ndsNavigationMenuChildLabel>Vendas</div>
                  </a>
                </li>
                <li>
                  <a ndsNavigationMenuChild href="#assinaturas">
                    <div ndsNavigationMenuChildLabel>Assinaturas</div>
                  </a>
                </li>
              </ul>
            </ng-template>
          </li>

          <li ndsNavigationMenuItem>
            <a ndsNavigationMenuLink href="#configuracoes">Configurações</a>
          </li>
        </ul>
      </nav>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const list = canvasElement.querySelector<HTMLElement>('[data-slot="navigation-menu-list"]');

    await step('A orientação vertical troca a classe da lista', async () => {
      // A folha compartilhada só descreve a barra horizontal — não há regra por
      // `data-orientation`. Na vertical a lista vira `.nds-stack`, que é a mesma
      // saída do Vanilla. Se o input não chegasse, esta asserção pegaria a
      // classe horizontal.
      await expect(list?.getAttribute('data-orientation')).toBe('vertical');
      await expect(list?.classList.contains('nds-stack')).toBe(true);
      await expect(list?.classList.contains('nds-navigation-menu-list')).toBe(false);
      await expect(list?.getAttribute('data-spacing')).toBe('xs');
    });

    await step('A classe escrita no elemento convive com a do componente', async () => {
      // Não existe input `class` neste sistema: o Angular já mescla o que quem
      // consome escreve com o que o componente calcula.
      await expect(list?.classList.contains('nds-w-sm')).toBe(true);
    });

    await step('Os itens empilham em coluna', async () => {
      const items = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="navigation-menu-item"]')];
      await expect(items).toHaveLength(3);
      const first = items[0].getBoundingClientRect();
      const segundo = items[1].getBoundingClientRect();
      await expect(segundo.top).toBeGreaterThan(first.top);
    });

    await step('O painel abre ao lado, nunca por baixo', async () => {
      const trigger = canvas.getByRole('button', { name: 'Relatórios' });
      const panel = await open(trigger);
      const popup = panel.closest<HTMLElement>('.nds-navigation-menu-popup');
      // O lado exato depende do espaço disponível (o floating-ui vira para o
      // outro lado quando falta), mas o EIXO é o que a orientação decide.
      await expect(['left', 'right']).toContain(popup?.getAttribute('data-side'));
      await close(trigger);
    });
  },
};
