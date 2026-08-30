import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NDS_SIDEBAR } from './sidebar';

// Variantes visuais e modos de recolhimento. Sem argTypes, então o painel
// Controls é desligado — do contrário apareceria vazio.

const meta: Meta = {
  title: 'UI/Sidebar/Types',
  tags: ['layout'],
  decorators: [moduleMetadata({ imports: [...NDS_SIDEBAR] })],
  parameters: { layout: 'fullscreen', controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

/**
 * Miolo comum: o que muda entre as stories é só o wrapper.
 *
 * O nome do `<nav>` é uma expressão de template porque estas stories põem três
 * sidebars na mesma página. Três marcos de navegação com o mesmo nome é
 * `landmark-unique` no axe — e, antes de ser regra, é a lista de marcos do
 * leitor de tela dizendo "navegação" três vezes sem distinguir uma da outra.
 */
const MIOLO = (rotuloNav: string) => `
  <div ndsSidebarHeader>Acme</div>
  <div ndsSidebarContent>
    <nav [attr.aria-label]="${rotuloNav}">
      <div ndsSidebarGroup>
        <div ndsSidebarGroupLabel>Plataforma</div>
        <ul ndsSidebarMenu>
          <li ndsSidebarMenuItem>
            <a ndsSidebarMenuButton href="/painel" [active]="true">Painel</a>
          </li>
          <li ndsSidebarMenuItem>
            <a ndsSidebarMenuButton href="/ajustes">Ajustes</a>
          </li>
        </ul>
      </div>
    </nav>
  </div>
`;

export const Variants: Story = {
  parameters: { covers: ['visual.item3', 'visual.item4', 'functional.item8'] },
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="lg">
        @for (v of ['sidebar', 'floating', 'inset']; track v) {
          <div class="nds-stack" data-spacing="sm">
            <span class="nds-text-caption">{{ v }}</span>
            <div ndsSidebarProvider>
              <div ndsSidebar [variant]="v" [attr.data-testid]="'var-' + v">${MIOLO("'Navegação ' + v")}</div>
            </div>
          </div>
        }
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Cada variante marca data-variant, que é o que o CSS lê', async () => {
      for (const v of ['sidebar', 'floating', 'inset']) {
        const el = canvasElement.querySelector<HTMLElement>(`[data-testid="var-${v}"]`)!;
        await expect(el.getAttribute('data-variant')).toBe(v);
        await expect(el.classList.contains('nds-sidebar-root')).toBe(true);
      }
    });

    await step('floating ganha borda e cantos arredondados no painel interno', async () => {
      // Afirma o pixel, e não só o atributo: a regra é
      // `[data-variant="floating"] .nds-sidebar-inner`, e um atributo no lugar
      // errado passaria despercebido.
      const flutuante = canvasElement.querySelector<HTMLElement>('[data-testid="var-floating"]')!;
      const interno = flutuante.querySelector<HTMLElement>('.nds-sidebar-inner')!;
      await expect(parseFloat(getComputedStyle(interno).borderTopLeftRadius)).toBeGreaterThan(0);

      const simple = canvasElement.querySelector<HTMLElement>('[data-testid="var-sidebar"]')!;
      const simpleInterno = simple.querySelector<HTMLElement>('.nds-sidebar-inner')!;
      await expect(parseFloat(getComputedStyle(simpleInterno).borderTopLeftRadius)).toBe(0);
    });
  },
};

export const Collapse: Story = {
  parameters: { covers: ['functional.item4', 'functional.item5', 'visual.item2'] },
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="lg">
        @for (c of ['offcanvas', 'icon', 'none']; track c) {
          <div class="nds-stack" data-spacing="sm">
            <span class="nds-text-caption">{{ c }}</span>
            <div ndsSidebarProvider [defaultOpen]="false">
              <div ndsSidebar [collapsible]="c" [attr.data-testid]="'col-' + c">${MIOLO("'Navegação ' + c")}</div>
            </div>
          </div>
        }
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('data-collapsible só existe enquanto está recolhida', async () => {
      // Se o atributo fosse fixo, a sidebar nasceria encolhida: as regras de
      // `[data-collapsible="icon"]` são justamente as que escondem rótulo e
      // estreitam o painel.
      for (const c of ['offcanvas', 'icon']) {
        const el = canvasElement.querySelector<HTMLElement>(`[data-testid="col-${c}"]`)!;
        await expect(el.getAttribute('data-state')).toBe('collapsed');
        await expect(el.getAttribute('data-collapsible')).toBe(c);
      }
    });

    await step('collapsible="none" não recolhe nem monta o vão', async () => {
      const nenhum = canvasElement.querySelector<HTMLElement>('[data-testid="col-none"]')!;
      await expect(nenhum.getAttribute('data-collapsible')).toBeNull();
      await expect(nenhum.classList.contains('nds-sidebar-static')).toBe(true);
      // Sem painel fixo, o conteúdo é a própria coluna — nada de reservar vão.
      await expect(nenhum.querySelector('.nds-sidebar-gap')).toBeNull();
      await expect(nenhum.querySelector('[data-slot="sidebar-header"]')).not.toBeNull();
    });

    await step('No modo icon o painel estreita para a largura de ícone', async () => {
      const icone = canvasElement.querySelector<HTMLElement>('[data-testid="col-icon"]')!;
      const panel = icone.querySelector<HTMLElement>('.nds-sidebar-panel')!;
      const widthIcon = parseFloat(
        getComputedStyle(icone).getPropertyValue('--sidebar-width-icon'),
      );
      // A custom property vem em rem; comparar em px exige a raiz.
      const px = widthIcon * parseFloat(getComputedStyle(document.documentElement).fontSize);
      await expect(Math.round(panel.getBoundingClientRect().width)).toBe(Math.round(px));
    });
  },
};

export const Side: Story = {
  parameters: { covers: ['visual.item6'] },
  render: () => ({
    template: `
      <div ndsSidebarProvider>
        <div ndsSidebar side="right" data-testid="direita">${MIOLO("'Navegação principal'")}</div>
        <main ndsSidebarInset></main>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O painel encosta na direita', async () => {
      const root = canvasElement.querySelector<HTMLElement>('[data-testid="direita"]')!;
      await expect(root.getAttribute('data-side')).toBe('right');

      const panel = root.querySelector<HTMLElement>('.nds-sidebar-panel')!;
      const box = panel.getBoundingClientRect();
      // Medida, não atributo: a regra que posiciona é
      // `[data-side="right"] .nds-sidebar-panel { right: 0 }`.
      await expect(Math.round(box.right)).toBe(Math.round(window.innerWidth));
    });
  },
};
