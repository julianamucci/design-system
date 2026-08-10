import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsSeparator } from './separator';
import { NdsCard } from './card';
import { NDS_SIDEBAR } from './sidebar';

const meta: Meta = {
  title: 'UI/Separator/Compositions',
  decorators: [moduleMetadata({ imports: [NdsSeparator, NdsCard, ...NDS_SIDEBAR] })],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

export const InCard: Story = {
  parameters: { covers: ['visual.item3'] },
  render: () => ({
    template: `
      <div ndsCard class="nds-p-4 nds-max-w-md">
        <div class="nds-stack" data-spacing="sm">
          <p class="nds-text-body nds-font-semibold">Resumo do pedido</p>
          <div ndsSeparator></div>
          <p class="nds-text-body nds-text-muted-foreground">
            3 itens · entrega em 5 dias úteis
          </p>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Separa header e conteúdo dentro do Card', async () => {
      const card = canvasElement.querySelector<HTMLElement>('.nds-card')!;
      const sep = card.querySelector<HTMLElement>('.nds-separator');
      await expect(sep).toBeTruthy();
      await expect(sep).toHaveAttribute('data-orientation', 'horizontal');
    });

    await step('Não estoura a largura do Card', async () => {
      // O separador dentro de um container com padding é onde a largura
      // costuma vazar — medir o par prova que ele respeita a caixa.
      const card = canvasElement.querySelector<HTMLElement>('.nds-card')!;
      const sep = card.querySelector<HTMLElement>('.nds-separator')!;
      await expect(sep.getBoundingClientRect().width)
        .toBeLessThanOrEqual(card.getBoundingClientRect().width);
    });
  },
};

export const CustomColor: Story = {
  parameters: { covers: ['visual.item5'] },
  render: () => ({
    template: `
      <div class="nds-stack nds-w-full nds-max-w-md" data-spacing="md">
        <p class="nds-text-body">Antes</p>
        <div ndsSeparator class="nds-bg-primary"></div>
        <p class="nds-text-body">Depois</p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('A classe extra convive com .nds-separator', async () => {
      // Não existe input `class` aqui: o Angular já mescla o `class` escrito no
      // elemento com o que o componente declara. Um input + `cn()` seria hábito
      // de `className` do React, onde a prop sobrescreve.
      const sep = canvasElement.querySelector<HTMLElement>('.nds-separator')!;
      await expect(sep).toHaveClass(/nds-separator/);
      await expect(sep).toHaveClass(/nds-bg-primary/);
    });
  },
};

/**
 * Fecha `visual.item4`, que estava descoberto desde o Bloco 1: o critério pede
 * o separador entre grupos de uma Sidebar, e a Sidebar só existiu no Bloco 3.
 */
export const InSidebar: Story = {
  parameters: { covers: ['visual.item4'] },
  render: () => ({
    template: `
      <div ndsSidebarProvider>
        <div ndsSidebar collapsible="none" data-testid="sb">
          <div ndsSidebarContent>
            <nav aria-label="Navegação principal">
              <div ndsSidebarGroup>
                <div ndsSidebarGroupLabel>Plataforma</div>
                <ul ndsSidebarMenu>
                  <li ndsSidebarMenuItem>
                    <a ndsSidebarMenuButton href="#painel" [active]="true">Painel</a>
                  </li>
                </ul>
              </div>

              <div ndsSidebarSeparator></div>

              <div ndsSidebarGroup>
                <div ndsSidebarGroupLabel>Conta</div>
                <ul ndsSidebarMenu>
                  <li ndsSidebarMenuItem>
                    <a ndsSidebarMenuButton href="#ajustes">Ajustes</a>
                  </li>
                </ul>
              </div>
            </nav>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O separador da sidebar é um separador de verdade', async () => {
      // A sidebar traz a própria peça (`.nds-sidebar-separator`), com a medida
      // e a margem do contexto dela — mas a semântica tem que ser a mesma do
      // `NdsSeparator`, senão o leitor de tela deixa de anunciar a divisão.
      const sep = canvasElement.querySelector<HTMLElement>('[data-slot="sidebar-separator"]')!;
      await expect(sep.getAttribute('role')).toBe('separator');
      await expect(sep.getAttribute('aria-orientation')).toBe('horizontal');
    });

    await step('Ele fica ENTRE os dois grupos, não dentro de um', async () => {
      const grupos = [...canvasElement.querySelectorAll('[data-slot="sidebar-group"]')];
      const sep = canvasElement.querySelector<HTMLElement>('[data-slot="sidebar-separator"]')!;
      await expect(grupos.length).toBe(2);
      await expect(sep.closest('[data-slot="sidebar-group"]')).toBeNull();

      const meioDoSeparador = sep.getBoundingClientRect().top;
      await expect(grupos[0].getBoundingClientRect().bottom).toBeLessThanOrEqual(meioDoSeparador);
      await expect(grupos[1].getBoundingClientRect().top).toBeGreaterThanOrEqual(meioDoSeparador);
    });
  },
};
