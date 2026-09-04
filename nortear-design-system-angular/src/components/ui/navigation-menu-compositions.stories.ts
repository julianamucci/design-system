import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { NDS_NAVIGATION_MENU } from './navigation-menu';
import { open, waitForPanel, waitForPanelVanish, popupOpen } from './navigation-menu.fixtures';

const meta: Meta = {
  title: 'Components/Navigation/NavigationMenu/Compositions',
  tags: ['navigation'],
  decorators: [moduleMetadata({ imports: [...NDS_NAVIGATION_MENU] })],
  parameters: {
    layout: 'padded',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'As quatro formas canônicas do painel, do mais simples ao mais denso: só links diretos, ' +
          'um item com lista vertical, um mega-menu em duas colunas com descrição e um painel com ' +
          'destino em destaque ao lado dos complementares.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Impede a navegação de verdade, como um roteador de cliente faria.
 *
 * Sem isto o clique tira a própria PÁGINA DE TESTE do ar — a conexão do runner
 * com o navegador morre e a story inteira some do resultado, sem asserção
 * nenhuma falhando. O fechamento do painel não depende deste `preventDefault`:
 * o destino do painel fecha a barra de qualquer jeito, justamente porque quem
 * usa roteador chama `preventDefault` e continua querendo o painel fechado.
 */
function aoNavegar(event: Event): void {
  event.preventDefault();
}

// ─── SimpleLink ───────────────────────────────────────────────────────────────

export const SimpleLink: Story = {
  render: () => ({
    template: `
      <nav ndsNavigationMenu aria-label="Navegação institucional">
        <ul ndsNavigationMenuList>
          <li ndsNavigationMenuItem>
            <a ndsNavigationMenuLink href="#inicio" active>Início</a>
          </li>
          <li ndsNavigationMenuItem>
            <a ndsNavigationMenuLink href="#precos">Preços</a>
          </li>
          <li ndsNavigationMenuItem>
            <a ndsNavigationMenuLink href="#contato">Contato</a>
          </li>
        </ul>
      </nav>
    `,
  }),
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

// ─── WithDropdown ─────────────────────────────────────────────────────────────

export const WithDropdown: Story = {
  parameters: { covers: ['functional.item5'] },
  render: () => ({
    props: { aoNavegar },
    template: `
      <nav ndsNavigationMenu aria-label="Navegação principal">
        <ul ndsNavigationMenuList>
          <li ndsNavigationMenuItem>
            <a ndsNavigationMenuLink href="#inicio" (click)="aoNavegar($event)">Início</a>
          </li>

          <li ndsNavigationMenuItem value="planos">
            <button ndsNavigationMenuTrigger>Planos</button>

            <ng-template ndsNavigationMenuContent>
              <ul ndsNavigationMenuPanel class="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
                <li>
                  <a ndsNavigationMenuChild href="#inicial" (click)="aoNavegar($event)">
                    <div ndsNavigationMenuChildLabel>Plano Inicial</div>
                  </a>
                </li>
                <li>
                  <a ndsNavigationMenuChild href="#profissional" (click)="aoNavegar($event)">
                    <div ndsNavigationMenuChildLabel>Plano Profissional</div>
                  </a>
                </li>
                <li>
                  <a ndsNavigationMenuChild href="#empresarial" (click)="aoNavegar($event)">
                    <div ndsNavigationMenuChildLabel>Plano Empresarial</div>
                  </a>
                </li>
              </ul>
            </ng-template>
          </li>

          <li ndsNavigationMenuItem>
            <a ndsNavigationMenuLink href="#contato" (click)="aoNavegar($event)">Contato</a>
          </li>
        </ul>
      </nav>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Planos' });

    await step('O painel abre com os três destinos', async () => {
      const panel = await open(trigger);
      await expect(within(panel).getAllByRole('link')).toHaveLength(3);
    });

    await step('Escolher um destino fecha o painel', async () => {
      // Navegar É sair da página: um painel que sobrevive ao clique fica
      // pendurado sobre a página seguinte.
      const panel = await waitForPanel();
      await userEvent.click(within(panel).getByRole('link', { name: 'Plano Profissional' }));
      await waitForPanelVanish();
      await expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    await step('O foco volta a ser alcançável na barra', async () => {
      await expect(popupOpen()).toBeNull();
      await expect(canvas.getAllByRole('link')).toHaveLength(2);
    });
  },
};

// ─── MegaMenuGrid ─────────────────────────────────────────────────────────────

export const MegaMenuGrid: Story = {
  parameters: { covers: ['visual.item2'] },
  render: () => ({
    template: `
      <nav ndsNavigationMenu aria-label="Navegação de soluções" defaultValue="solucoes">
        <ul ndsNavigationMenuList>
          <li ndsNavigationMenuItem>
            <a ndsNavigationMenuLink href="#inicio">Início</a>
          </li>

          <li ndsNavigationMenuItem value="solucoes">
            <button ndsNavigationMenuTrigger>Soluções</button>

            <ng-template ndsNavigationMenuContent>
              <ul
                ndsNavigationMenuPanel
                class="nds-grid nds-list-none nds-w-lg"
                data-fixed
                data-cols="2"
                data-spacing="sm"
              >
                <li>
                  <a ndsNavigationMenuChild href="#marketing">
                    <div ndsNavigationMenuChildLabel>Para Marketing</div>
                    <p ndsNavigationMenuChildDescription>
                      Campanhas, automação e atribuição num lugar só.
                    </p>
                  </a>
                </li>
                <li>
                  <a ndsNavigationMenuChild href="#vendas">
                    <div ndsNavigationMenuChildLabel>Para Vendas</div>
                    <p ndsNavigationMenuChildDescription>
                      Funil, previsão e histórico de cada negociação.
                    </p>
                  </a>
                </li>
                <li>
                  <a ndsNavigationMenuChild href="#suporte">
                    <div ndsNavigationMenuChildLabel>Para Suporte</div>
                    <p ndsNavigationMenuChildDescription>
                      Fila de atendimento, base de conhecimento e métricas.
                    </p>
                  </a>
                </li>
                <li>
                  <a ndsNavigationMenuChild href="#financeiro">
                    <div ndsNavigationMenuChildLabel>Para Financeiro</div>
                    <p ndsNavigationMenuChildDescription>
                      Cobrança recorrente, conciliação e relatórios fiscais.
                    </p>
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
    const panel = await waitForPanel();

    await step('Quatro destinos em duas colunas', async () => {
      const targets = [...panel.querySelectorAll<HTMLElement>('a')];
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
      const destination = within(panel).getByRole('link', { name: /Para Marketing/ });
      await expect(destination.textContent).toContain('Campanhas');
    });

    await step('O gatilho continua sendo o dono do painel', async () => {
      const trigger = canvas.getByRole('button', { name: 'Soluções' });
      await expect(trigger.getAttribute('aria-expanded')).toBe('true');
      // Esta story termina ABERTA de propósito: é o estado que a regressão
      // visual precisa capturar.
      await expect(popupOpen()).not.toBeNull();
    });
  },
};

// ─── WithHighlightedCard ──────────────────────────────────────────────────────

export const WithHighlightedCard: Story = {
  render: () => ({
    template: `
      <nav ndsNavigationMenu aria-label="Navegação de recursos">
        <ul ndsNavigationMenuList>
          <li ndsNavigationMenuItem>
            <a ndsNavigationMenuLink href="#inicio">Início</a>
          </li>

          <li ndsNavigationMenuItem value="recursos">
            <button ndsNavigationMenuTrigger>Recursos</button>

            <ng-template ndsNavigationMenuContent>
              <div
                ndsNavigationMenuPanel
                class="nds-grid nds-w-lg"
                data-fixed
                data-cols="2"
                data-spacing="sm"
              >
                <a ndsNavigationMenuChild href="#comece" class="nds-h-full">
                  <div ndsNavigationMenuChildLabel>Comece agora</div>
                  <p ndsNavigationMenuChildDescription>
                    Publique o primeiro projeto em menos de cinco minutos.
                  </p>
                </a>

                <ul class="nds-stack nds-list-none" data-spacing="xs">
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
                  <li>
                    <a ndsNavigationMenuChild href="#changelog">
                      <div ndsNavigationMenuChildLabel>Novidades</div>
                    </a>
                  </li>
                </ul>
              </div>
            </ng-template>
          </li>
        </ul>
      </nav>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Recursos' });
    const panel = await open(trigger);

    await step('Um destino em destaque e três de apoio', async () => {
      const targets = [...panel.querySelectorAll<HTMLElement>('a')];
      await expect(targets).toHaveLength(4);
      // O destaque ocupa a coluna inteira: é mais alto que qualquer um dos
      // complementares, que é como a hierarquia aparece sem depender de cor.
      const highlight = targets[0].getBoundingClientRect();
      const helper = targets[1].getBoundingClientRect();
      await expect(highlight.height).toBeGreaterThan(helper.height);
    });

    await step('Tab alcança todo o painel portalizado', async () => {
      // O painel mora no <body>, fora do canvas — se os destinos não fossem
      // tabuláveis, o conteúdo ficaria inalcançável por teclado.
      const targets = [...panel.querySelectorAll<HTMLElement>('a')];
      for (const destination of targets) {
        await expect(destination.getAttribute('tabindex')).not.toBe('-1');
      }
      targets[0].focus();
      await expect(document.activeElement).toBe(targets[0]);
      await userEvent.tab();
      await expect(panel.contains(document.activeElement)).toBe(true);
    });
  },
};
