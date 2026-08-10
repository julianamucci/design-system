import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { NDS_SIDEBAR } from './sidebar';
import { NdsSeparator } from './separator';

const meta: Meta = {
  title: 'UI/Sidebar/Composições',
  decorators: [moduleMetadata({ imports: [...NDS_SIDEBAR, NdsSeparator] })],
  parameters: { layout: 'fullscreen', controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const ComGruposEBusca: Story = {
  parameters: { covers: ['functional.item9', 'accessibility.item6'] },
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
      const faixa = canvasElement.querySelector<HTMLElement>('[data-slot="sidebar-rail"]')!;
      await expect(faixa.tabIndex).toBe(-1);

      const busca = canvas.getByLabelText('Buscar na navegação');
      busca.focus();
      const alcancados: string[] = [];
      for (let i = 0; i < 6; i++) {
        await userEvent.tab();
        const ativo = document.activeElement as HTMLElement | null;
        if (!ativo) continue;
        // `aria-label` ANTES do texto: é ele que vence no cálculo do nome
        // acessível, e o botão de ação do grupo mostra só um "+".
        alcancados.push(ativo.getAttribute('aria-label') ?? ativo.textContent?.trim() ?? '');
      }
      await expect(alcancados).toContain('Painel');
      await expect(alcancados).toContain('Adicionar conta');
      // Nenhuma parada sem nome: um item de navegação que o leitor de tela
      // anuncia como "link" e mais nada é uma parada cega.
      await expect(alcancados).not.toContain('');
    });
  },
};

export const Carregando: Story = {
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
      const primeiro = canvasElement.querySelector<HTMLElement>(
        '[data-slot="sidebar-menu-skeleton"]',
      )!;
      await expect(primeiro.getAttribute('role')).toBe('status');
      await expect(primeiro.getAttribute('aria-label')).toBe('Carregando navegação');
    });

    await step('showIcon monta o quadrado do ícone à esquerda do texto', async () => {
      const comIcone = canvasElement.querySelector<HTMLElement>(
        '[data-slot="sidebar-menu-skeleton"]',
      )!;
      const icone = comIcone.querySelector<HTMLElement>('.nds-sidebar-menu-skeleton-icon')!;
      const texto = comIcone.querySelector<HTMLElement>('.nds-sidebar-menu-skeleton-text')!;
      await expect(icone.getBoundingClientRect().left).toBeLessThan(
        texto.getBoundingClientRect().left,
      );
    });
  },
};
