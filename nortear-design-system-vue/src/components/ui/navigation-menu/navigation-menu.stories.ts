import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect, fn, waitFor } from 'storybook/test';
import {
  NavigationMenu,
  NavigationMenuChild,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from './index';
import { waitForPanel, waitForPanelVanish, panelOpen } from './navigation-menu.fixtures';
import NavigationMenuDocs from '@/components/docs/NavigationMenuDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { navigationMenuSource } from './navigation-menu.source';

const meta = {
  title: 'UI/NavigationMenu',
  component: NavigationMenu,
  tags: ['autodocs', 'navigation'],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(NavigationMenuDocs), source: { transform: navigationMenuSource } },
  },
  argTypes: {
    defaultValue: {
      control: 'text',
      description:
        'Item aberto ao montar; use o mesmo identificador declarado no item da barra.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    delayDuration: {
      control: { type: 'number', min: 0, max: 1000, step: 50 },
      description: 'Espera em ms antes de abrir o painel quando o ponteiro entra no gatilho.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '200' } },
    },
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
      description: 'Direção da barra. Vertical serve a barras laterais e gavetas móveis.',
      table: { type: { summary: "'horizontal' | 'vertical'" }, defaultValue: { summary: "'horizontal'" } },
    },
    'onUpdate:modelValue': {
      control: false,
      description: 'Disparado quando o item aberto muda; recebe o identificador do item.',
      table: { type: { summary: '(value: string) => void' } },
    },
  },
  args: {
    defaultValue: '',
    delayDuration: 100,
    orientation: 'horizontal',
    'onUpdate:modelValue': fn(),
  },
} satisfies Meta<typeof NavigationMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

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
  render: (args) => ({
    components: {
      NavigationMenu,
      NavigationMenuChild,
      NavigationMenuContent,
      NavigationMenuItem,
      NavigationMenuLink,
      NavigationMenuList,
      NavigationMenuTrigger,
    },
    setup() {
      return { args };
    },
    // `defaultValue` só é lido na montagem: sem a chave, mexer no control não
    // muda nada na tela e o control parece quebrado.
    template: `
      <div style="contain: layout" class="nds-cluster nds-w-full nds-min-h-80" data-justify="center">
        <NavigationMenu
          :key="String(args.defaultValue) + String(args.orientation)"
          v-bind="args"
          aria-label="Navegação principal"
        >
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="#inicio">Início</NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem value="produtos">
              <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul class="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
                  <li>
                    <NavigationMenuChild href="#inicial">
                      <div class="nds-navigation-menu-child-label">Plano Inicial</div>
                    </NavigationMenuChild>
                  </li>
                  <li>
                    <NavigationMenuChild href="#profissional">
                      <div class="nds-navigation-menu-child-label">Plano Profissional</div>
                    </NavigationMenuChild>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem value="solucoes">
              <NavigationMenuTrigger>Soluções</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul class="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
                  <li>
                    <NavigationMenuChild href="#marketing">
                      <div class="nds-navigation-menu-child-label">Para Marketing</div>
                    </NavigationMenuChild>
                  </li>
                  <li>
                    <NavigationMenuChild href="#vendas">
                      <div class="nds-navigation-menu-child-label">Para Vendas</div>
                    </NavigationMenuChild>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink href="#sobre">Sobre</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    `,
  }),
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
      const content = await waitForPanel();
      await expect(produtos).toHaveAttribute('aria-expanded', 'true');

      const first = within(content).getByRole('link', { name: 'Plano Inicial' });
      // Alcançável por teclado: nenhum destino do painel sai da ordem de foco.
      await expect(first).not.toHaveAttribute('tabindex', '-1');
      first.focus();
      await expect(document.activeElement).toBe(first);
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
      const content = await waitForPanel();
      await expect(content.textContent).toContain('Plano Inicial');
    });

    await step('Passar de um gatilho ao outro troca o painel sem fechá-lo', async () => {
      await userEvent.hover(solucoes);
      await waitFor(async () => {
        const content = document.body.querySelector('.nds-navigation-menu-viewport-content');
        await expect(content?.textContent).toContain('Para Marketing');
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
