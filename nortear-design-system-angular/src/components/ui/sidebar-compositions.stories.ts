import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { waitForPortal } from '@/lib/wait-for-portal';
import { NDS_SIDEBAR, NDS_SIDEBAR_MOBILE_QUERY } from './sidebar';
import { NdsSeparator } from './separator';
import { NDS_TOOLTIP } from './tooltip';
import { NdsButtonIcon } from './button';

const meta: Meta = {
  title: 'Primitives/Layout/Sidebar/Compositions',
  tags: ['layout'],
  decorators: [moduleMetadata({ imports: [...NDS_SIDEBAR, NdsSeparator] })],
  parameters: { layout: 'fullscreen', controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const WithGroupsAndSearch: Story = {
  // `functional.item9` (skeleton com ícone) NÃO é desta story — ela não monta
  // nenhum skeleton. Quem o verifica é `Loading`, logo abaixo.
  parameters: { covers: ['accessibility.item6'] },
  render: () => ({
    template: `
      <div ndsSidebarProvider>
        <div ndsSidebar data-testid="sb">
          <div ndsSidebarHeader>
            <input
              ndsSidebarInput
              type="search"
              placeholder="Buscar"
              aria-label="Buscar na navegação"
            />
          </div>

          <div ndsSidebarContent>
            <nav aria-label="Navegação principal">
              <div ndsSidebarGroup>
                <div ndsSidebarGroupLabel>Plataforma</div>
                <ul ndsSidebarMenu>
                  <li ndsSidebarMenuItem>
                    <a ndsSidebarMenuButton href="/painel" [active]="true">Painel</a>
                    <span ndsSidebarMenuBadge>3</span>
                  </li>
                  <li ndsSidebarMenuItem>
                    <a ndsSidebarMenuButton href="/componentes">Componentes</a>
                    <ul ndsSidebarMenuSub>
                      <li ndsSidebarMenuSubItem>
                        <a ndsSidebarMenuSubButton href="/componentes/botao">Botão</a>
                      </li>
                      <li ndsSidebarMenuSubItem>
                        <a ndsSidebarMenuSubButton href="/componentes/campo">Campo</a>
                      </li>
                    </ul>
                  </li>
                </ul>
              </div>

              <div ndsSidebarSeparator></div>

              <div ndsSidebarGroup>
                <div ndsSidebarGroupLabel>Conta</div>
                <button ndsSidebarGroupAction aria-label="Adicionar conta">+</button>
                <ul ndsSidebarMenu>
                  <li ndsSidebarMenuItem>
                    <a ndsSidebarMenuButton href="/ajustes">Ajustes</a>
                  </li>
                </ul>
              </div>
            </nav>
          </div>

          <button ndsSidebarRail></button>
        </div>

        <main ndsSidebarInset>
          <button ndsSidebarTrigger aria-label="Alternar barra lateral">Alternar</button>
        </main>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O contador não é lido solto pelo leitor de tela', async () => {
      // Um "3" anunciado depois de "Painel" não diz do quê. A contagem, quando
      // importa, entra no nome acessível do item — não num elemento à parte.
      const badge = canvasElement.querySelector<HTMLElement>('[data-slot="sidebar-menu-badge"]')!;
      await expect(badge.getAttribute('aria-hidden')).toBe('true');
    });

    await step('O submenu é uma lista aninhada de verdade', async () => {
      const sub = canvasElement.querySelector<HTMLElement>('[data-slot="sidebar-menu-sub"]')!;
      await expect(sub.tagName).toBe('UL');
      await expect(sub.closest('[data-slot="sidebar-menu-item"]')).not.toBeNull();
      await expect(sub.querySelectorAll('[data-slot="sidebar-menu-sub-item"]').length).toBe(2);
    });

    await step('O separador é anunciado como separador', async () => {
      const sep = canvasElement.querySelector<HTMLElement>('[data-slot="sidebar-separator"]')!;
      await expect(sep.getAttribute('role')).toBe('separator');
      await expect(sep.getAttribute('aria-orientation')).toBe('horizontal');
    });

    await step('O Tab alcança busca, itens e ações — e não a faixa', async () => {
      // A faixa faz o mesmo que o gatilho, que já está na ordem de tabulação.
      // Duas paradas para uma ação só é ruído para quem navega sem mouse.
      const range = canvasElement.querySelector<HTMLElement>('[data-slot="sidebar-rail"]')!;
      await expect(range.tabIndex).toBe(-1);

      const search = canvas.getByLabelText('Buscar na navegação');
      search.focus();
      const alcancados: string[] = [];
      for (let i = 0; i < 6; i++) {
        await userEvent.tab();
        const active = document.activeElement as HTMLElement | null;
        if (!active) continue;
        // `aria-label` ANTES do texto: é ele que vence no cálculo do nome
        // acessível, e o botão de ação do grupo mostra só um "+".
        alcancados.push(active.getAttribute('aria-label') ?? active.textContent?.trim() ?? '');
      }
      await expect(alcancados).toContain('Painel');
      await expect(alcancados).toContain('Adicionar conta');
      // Nenhuma parada sem nome: um item de navegação que o leitor de tela
      // anuncia como "link" e mais nada é uma parada cega.
      await expect(alcancados).not.toContain('');
    });
  },
};

export const Loading: Story = {
  parameters: { covers: ['functional.item9'] },
  render: () => ({
    template: `
      <div ndsSidebarProvider>
        <div ndsSidebar>
          <div ndsSidebarContent>
            <div ndsSidebarGroup>
              <ul ndsSidebarMenu>
                @for (i of [1, 2, 3]; track i) {
                  <li ndsSidebarMenuItem>
                    <div
                      ndsSidebarMenuSkeleton
                      [showIcon]="true"
                      loadingLabel="Carregando navegação"
                    ></div>
                  </li>
                }
              </ul>
            </div>
          </div>
        </div>
        <main ndsSidebarInset></main>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O carregamento é anunciado, não só desenhado', async () => {
      // Um bloco cinza pulsando não diz nada para quem não o vê. `role="status"`
      // porque `aria-label` num elemento sem papel é atributo proibido.
      const first = canvasElement.querySelector<HTMLElement>(
        '[data-slot="sidebar-menu-skeleton"]',
      )!;
      await expect(first.getAttribute('role')).toBe('status');
      await expect(first.getAttribute('aria-label')).toBe('Carregando navegação');
    });

    await step('showIcon monta o quadrado do ícone à esquerda do texto', async () => {
      const withIcon = canvasElement.querySelector<HTMLElement>(
        '[data-slot="sidebar-menu-skeleton"]',
      )!;
      const icone = withIcon.querySelector<HTMLElement>('.nds-sidebar-menu-skeleton-icon')!;
      const text = withIcon.querySelector<HTMLElement>('.nds-sidebar-menu-skeleton-text')!;
      await expect(icone.getBoundingClientRect().left).toBeLessThan(
        text.getBoundingClientRect().left,
      );
    });
  },
};

/**
 * Fecha `functional.item3` e `visual.item5`, abertos desde o Bloco 3: eles
 * pedem a barra em viewport móvel, que só existe agora que o Sheet existe.
 *
 * O breakpoint vem do token, e não do tamanho da janela: redimensionar o
 * navegador dentro do teste é lento e frágil, e a regra de virada é a mesma.
 */
export const Mobile: Story = {
  parameters: { covers: ['functional.item3', 'visual.item5'] },
  decorators: [
    moduleMetadata({
      imports: [...NDS_SIDEBAR, NdsSeparator],
      providers: [{ provide: NDS_SIDEBAR_MOBILE_QUERY, useValue: '(min-width: 0px)' }],
    }),
  ],
  render: () => ({
    template: `
      <div ndsSidebarProvider>
        <!-- Sem o input de título: o nome da gaveta tem padrão em português
             vindo do conteúdo compartilhado, e é ele que a asserção guarda. -->
        <div ndsSidebar data-testid="sb">
          <div ndsSidebarContent>
            <nav aria-label="Navegação principal">
              <div ndsSidebarGroup>
                <div ndsSidebarGroupLabel>Plataforma</div>
                <ul ndsSidebarMenu>
                  <li ndsSidebarMenuItem>
                    <a ndsSidebarMenuButton href="#painel" [active]="true">Painel</a>
                  </li>
                  <li ndsSidebarMenuItem>
                    <a ndsSidebarMenuButton href="#ajustes">Ajustes</a>
                  </li>
                </ul>
              </div>
            </nav>
          </div>
        </div>

        <main ndsSidebarInset>
          <button ndsSidebarTrigger aria-label="Abrir navegação">Abrir</button>
        </main>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = () => canvas.getByRole('button', { name: 'Abrir navegação' });
    // O painel vive num portal no fim do <body>, fora do canvasElement.
    const panel = () => document.querySelector<HTMLElement>('.nds-sidebar-mobile');

    await step('Em tela estreita a barra não é coluna: não há painel fixo', async () => {
      const root = canvasElement.querySelector<HTMLElement>('[data-testid="sb"]')!;
      await expect(root.getAttribute('data-mobile')).toBe('true');
      await expect(root.querySelector('.nds-sidebar-panel')).toBeNull();
      await expect(panel()).toBeNull();
    });

    await step('O gatilho abre a gaveta', async () => {
      await userEvent.click(trigger());
      await waitFor(() => expect(panel()).not.toBeNull());
    });

    await step('A gaveta é um diálogo COM nome — não um painel anônimo', async () => {
      // Sem título o leitor de tela anuncia "diálogo" e mais nada. O par
      // título/descrição é sr-only: aparece para quem ouve, não para quem vê.
      const dialogo = panel()!;
      await expect(dialogo.getAttribute('role')).toBe('dialog');
      const labelledBy = dialogo.getAttribute('aria-labelledby');
      await expect(labelledBy).toBeTruthy();
      await expect(document.getElementById(labelledBy!)?.textContent?.trim()).toBe('Barra lateral');
    });

    await step('A navegação inteira foi para dentro da gaveta', async () => {
      const dialogo = panel()!;
      await expect(dialogo.querySelector('[data-slot="sidebar-menu"]')).not.toBeNull();
      await expect(dialogo.querySelectorAll('[data-slot="sidebar-menu-item"]').length).toBe(2);
    });

    await step('A gaveta usa a largura móvel, não a da coluna', async () => {
      // Mede o pixel: as regras de lado do sheet.css são (0,2,0) e a classe
      // .nds-sidebar-mobile é (0,1,0) — por classe ela perderia. Quem entrega a
      // medida é a custom property, e é isso que esta asserção guarda.
      const dialogo = panel()!;
      const esperado = parseFloat(
        getComputedStyle(dialogo).getPropertyValue('--sidebar-width-mobile'),
      ) * parseFloat(getComputedStyle(document.documentElement).fontSize);
      await expect(Math.round(dialogo.getBoundingClientRect().width)).toBe(Math.round(esperado));
    });

    await step('Escape fecha e devolve o foco ao gatilho', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(panel()).toBeNull());
      // O foco volta depois da animação de saída, não junto com a desmontagem.
      await waitFor(() => expect(document.activeElement).toBe(trigger()));
    });

    await step('Termina ABERTA: é este o estado que a foto registra', async () => {
      // `visual.item5` promete "gaveta sobreposta ABERTA", e o Chromatic
      // fotografa o estado final da play. Enquanto ela terminava fechada, o
      // item estava coberto no papel e em foto nenhuma.
      //
      // O replay continua honesto: o passo de abertura acima parte da gaveta
      // fechada e o Escape a fechou de novo, então o clique daqui acontece
      // NESTA rodada. Este passo prova só o estado final.
      await userEvent.click(trigger());
      // `waitForPortal` gateia na opacidade computada: afirmar no primeiro
      // quadro leria a gaveta no meio do fade de entrada.
      const dialogo = await waitForPortal('dialog', { name: /barra lateral/i });
      await expect(dialogo).toBeVisible();
      await expect(dialogo).toBe(panel());
    });
  },
};

/**
 * Fecha `functional.item7`: tooltip no item quando a barra está recolhida em
 * ícones — sem rótulo visível, é o que resta para quem usa mouse.
 *
 * DIVERGÊNCIA DE API, registrada e não "alinhada": o conteúdo compartilhado
 * documenta `tooltip` como PROP do menu button, que é o que React, Vue e Svelte
 * fazem. Aqui o menu button é uma diretiva de atributo — ela aplica classe e
 * ARIA ao elemento que já existe e não tem como envolvê-lo em outro componente.
 * Em Angular isso é composição: o tooltip abraça o item.
 */
export const TooltipInIconMode: Story = {
  parameters: { covers: ['functional.item7'] },
  decorators: [moduleMetadata({ imports: [...NDS_SIDEBAR, NdsSeparator, ...NDS_TOOLTIP, NdsButtonIcon] })],
  render: () => ({
    template: `
      <div ndsSidebarProvider [defaultOpen]="false">
        <div ndsSidebar collapsible="icon" data-testid="sb">
          <div ndsSidebarContent>
            <nav aria-label="Navegação principal">
              <div ndsSidebarGroup>
                <div ndsSidebarGroupLabel>Plataforma</div>
                <ul ndsSidebarMenu>
                  <li ndsSidebarMenuItem>
                    <span ndsTooltip>
                      <button ndsSidebarMenuButton ndsTooltipTrigger aria-label="Painel">
                        <svg ndsButtonIcon kind="chevron-right" class="nds-icon"></svg>
                      </button>
                      <ng-template ndsTooltipContent side="right">Painel</ng-template>
                    </span>
                  </li>
                </ul>
              </div>
            </nav>
          </div>
        </div>
        <main ndsSidebarInset></main>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    // Busca por CLASSE, e não por data-slot: as duas diretivas no mesmo
    // elemento ligam `attr.data-slot` e uma sobrescreve a outra (ver a
    // asserção de colisão abaixo).
    const item = () =>
      canvasElement.querySelector<HTMLElement>('.nds-sidebar-menu-button')!;
    const balao = () => document.querySelector<HTMLElement>('[data-slot="tooltip-content"]');

    await step('A barra está recolhida em ícones: não há rótulo visível', async () => {
      const root = canvasElement.querySelector<HTMLElement>('[data-testid="sb"]')!;
      await expect(root.getAttribute('data-collapsible')).toBe('icon');
      await expect(item().textContent?.trim()).toBe('');
    });

    await step('O item continua tendo nome — o tooltip não é o único portador', async () => {
      // Um tooltip que some no teclado não pode ser a única fonte do rótulo.
      await expect(item().getAttribute('aria-label')).toBe('Painel');
    });

    await step('O elemento é as duas coisas: item de menu E gatilho do balão', async () => {
      // Colisão conhecida: as duas diretivas ligam `attr.data-slot` no mesmo
      // host e uma sobrescreve a outra, então `data-slot` NÃO serve para
      // identificar o item nesta composição. O que prova a dupla identidade é
      // a classe (do menu button) mais a fiação do tooltip.
      await expect(item().classList.contains('nds-sidebar-menu-button')).toBe(true);
      await expect(item().hasAttribute('data-slot')).toBe(true);
    });

    await step('O foco abre o balão, não só o ponteiro', async () => {
      item().focus();
      await waitFor(() => expect(balao()).not.toBeNull());
      await expect(balao()!.textContent?.trim()).toBe('Painel');
      await expect(balao()!.getAttribute('role')).toBe('tooltip');
    });

    await step('Escape fecha o balão sem tirar o foco do item', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(balao()).toBeNull());
      await expect(document.activeElement).toBe(item());
    });
  },
};
