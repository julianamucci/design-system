import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import {
  createSidebarProvider,
  createSidebar,
  createSidebarTrigger,
  createSidebarContent,
  createSidebarHeader,
  createSidebarFooter,
  createSidebarGroup,
  type SidebarVariant,
} from './sidebar';
import { envolverEmNav } from './sidebar.fixtures';
import { sidebarSource, sidebarSourceWith } from './sidebar.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['layout'],
  title: 'UI/Sidebar/Variants',
  parameters: {
    actions: { disable: true },
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      source: { transform: sidebarSource },
      description: {
        component:
          'Três variantes visuais da Sidebar: <code>sidebar</code> (padrão colada na borda), <code>floating</code> (com sombra e borda arredondada) e <code>inset</code> (integrada ao layout com conteúdo arredondado adjacente).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildVariantDemo(variant: SidebarVariant): HTMLElement {
  const instance = createSidebar({ defaultOpen: true, variant });
  const inner = instance.element.querySelector('[data-sidebar="sidebar"]')!;

  const header = createSidebarHeader();
  const logoRow = document.createElement('div');
  logoRow.className = 'nds-text-body nds-font-semibold';
  logoRow.style.padding = '0.25rem 0.5rem';
  logoRow.style.color = 'var(--sidebar-foreground)';
  logoRow.textContent = 'Design System';
  header.appendChild(logoRow);
  inner.appendChild(header);

  const content = createSidebarContent();
  content.appendChild(
    createSidebarGroup({
      label: 'Menu',
      items: [
        { label: 'Dashboard', active: true, href: '#' },
        { label: 'Componentes', href: '#' },
        { label: 'Tokens', href: '#' },
        { label: 'Configuracoes', href: '#' },
      ],
    }),
  );
  inner.appendChild(content);

  const footer = createSidebarFooter();
  const userRow = document.createElement('div');
  userRow.className = 'nds-text-body';
  userRow.style.padding = '0.25rem 0.5rem';
  userRow.style.color = 'var(--sidebar-foreground)';
  userRow.textContent = 'Usuário';
  footer.appendChild(userRow);
  inner.appendChild(footer);

  const inset = document.createElement('div');
  inset.className = 'nds-flex-1';
  inset.style.display = 'flex';
  inset.style.flexDirection = 'column';

  const topbar = document.createElement('div');
  topbar.className = 'nds-cluster nds-border-b nds-pl-4 nds-pr-4';
  topbar.dataset.spacing = 'sm';
  topbar.style.height = '3rem';
  topbar.appendChild(createSidebarTrigger(instance.toggle));

  const variantLabel = document.createElement('span');
  variantLabel.className = 'nds-text-caption nds-text-muted-foreground nds-font-mono';
  variantLabel.textContent = `variant="${variant}"`;
  topbar.appendChild(variantLabel);

  const mainContent = document.createElement('div');
  mainContent.className = 'nds-cluster nds-flex-1 nds-text-body nds-text-muted-foreground nds-p-8';
  mainContent.dataset.justify = 'center';
  mainContent.textContent = 'Conteúdo principal';

  inset.append(topbar, mainContent);

  const wrapper = createSidebarProvider();
  wrapper.appendChild(envolverEmNav(instance.element));
  wrapper.appendChild(inset);

  const container = document.createElement('div');
  container.className = 'nds-w-full nds-border-default nds-rounded-lg nds-overflow-hidden';
  container.classList.add('nds-min-h-100');
  container.appendChild(wrapper);
  return container;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const VariantSidebar: Story = {
  name: 'sidebar (default)',
  render: () => buildVariantDemo('sidebar'),
  parameters: {
    docs: {
      description: {
        story: 'Sidebar padrão colada na borda da viewport. Empurra o conteúdo ao expandir (push mode).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O gatilho tem nome acessível', async () => {
      await expect(canvas.getByRole('button', { name: /alternar barra lateral/i })).toBeInTheDocument();
    });

    await step('A variante padrão não arredonda o painel interno', async () => {
      const raiz = canvasElement.querySelector<HTMLElement>('[data-variant="sidebar"]')!;
      await expect(raiz).toBeInTheDocument();
      const interno = raiz.querySelector<HTMLElement>('.nds-sidebar-inner')!;
      await expect(parseFloat(getComputedStyle(interno).borderTopLeftRadius)).toBe(0);
    });
  },
};

export const VariantFloating: Story = {
  name: 'floating',
  render: () => buildVariantDemo('floating'),
  parameters: {
    covers: ['functional.item8', 'visual.item3'],
    docs: {
      // A variante é o assunto, e `sidebar` é o padrão da fábrica.
      source: { transform: sidebarSourceWith({ variant: 'floating' }) },
      description: {
        story: 'Sidebar com borda arredondada e sombra, flutuando sobre um pequeno padding. Não empurra o conteúdo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('floating ganha borda, cantos e sombra no painel interno', async () => {
      // Afirma o pixel, e não só o atributo: a regra é
      // `[data-variant="floating"] .nds-sidebar-inner`, e um atributo no lugar
      // errado passaria despercebido.
      const raiz = canvasElement.querySelector<HTMLElement>('[data-variant="floating"]')!;
      const interno = raiz.querySelector<HTMLElement>('.nds-sidebar-inner')!;
      const estilo = getComputedStyle(interno);
      await expect(parseFloat(estilo.borderTopLeftRadius)).toBeGreaterThan(0);
      await expect(parseFloat(estilo.borderTopWidth)).toBeGreaterThan(0);
      await expect(estilo.boxShadow).not.toBe('none');
    });
  },
};

export const VariantInset: Story = {
  name: 'inset',
  render: () => buildVariantDemo('inset'),
  parameters: {
    covers: ['visual.item4'],
    docs: {
      source: { transform: sidebarSourceWith({ variant: 'inset' }) },
      description: {
        story: 'Sidebar integrada ao layout com o conteúdo em container arredondado adjacente.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('inset marca a variante, e o painel interno fica liso', async () => {
      const raiz = canvasElement.querySelector<HTMLElement>('[data-variant="inset"]')!;
      await expect(raiz).toBeInTheDocument();
      // O arredondamento do inset é do conteúdo adjacente, não do painel: se
      // aparecer aqui, alguém copiou a regra do floating para o lugar errado.
      const interno = raiz.querySelector<HTMLElement>('.nds-sidebar-inner')!;
      await expect(parseFloat(getComputedStyle(interno).borderTopLeftRadius)).toBe(0);
    });
  },
};

export const SideRight: Story = {
  name: 'side="right"',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O painel encosta na direita', async () => {
      const raiz = canvasElement.querySelector<HTMLElement>('[data-side="right"]')!;
      await expect(raiz).toBeInTheDocument();
      // Medida, não atributo: a regra que posiciona é
      // `[data-side="right"] .nds-sidebar-panel { right: 0 }`.
      const painel = raiz.querySelector<HTMLElement>('.nds-sidebar-panel')!;
      await expect(getComputedStyle(painel).right).toBe('0px');
    });

    await step('O painel de contexto tem nome próprio de marco', async () => {
      // Dois marcos de navegação com o mesmo nome é `landmark-unique` no axe —
      // e, antes de ser regra, é o leitor dizendo "navegação" duas vezes.
      await expect(canvas.getByRole('navigation', { name: 'Detalhes' })).toBeInTheDocument();
    });
  },
  render: () => {
    const instance = createSidebar({ defaultOpen: true, side: 'right', variant: 'sidebar' });
    const inner = instance.element.querySelector('[data-sidebar="sidebar"]')!;

    const header = createSidebarHeader();
    const logoRow = document.createElement('div');
    logoRow.className = 'nds-text-body nds-font-semibold';
  logoRow.style.padding = '0.25rem 0.5rem';
  logoRow.style.color = 'var(--sidebar-foreground)';
    logoRow.textContent = 'Painel de Detalhes';
    header.appendChild(logoRow);
    inner.appendChild(header);

    const content = createSidebarContent();
    content.appendChild(
      createSidebarGroup({
        items: [
          { label: 'Informações', active: true, href: '#' },
          { label: 'Histórico', href: '#' },
          { label: 'Comentários', badge: '3', href: '#' },
        ],
      }),
    );
    inner.appendChild(content);

    const inset = document.createElement('div');
    inset.className = 'nds-flex-1';
  inset.style.display = 'flex';
  inset.style.flexDirection = 'column';

    const topbar = document.createElement('div');
    topbar.className = 'nds-cluster nds-border-b nds-pl-4 nds-pr-4';
    topbar.dataset.spacing = 'sm';
    topbar.dataset.justify = 'end';
    topbar.style.height = '3rem';
    topbar.appendChild(createSidebarTrigger(instance.toggle));

    const mainContent = document.createElement('div');
    mainContent.className = 'nds-cluster nds-flex-1 nds-text-body nds-text-muted-foreground nds-p-8';
  mainContent.dataset.justify = 'center';
    mainContent.textContent = 'Conteúdo principal';

    inset.append(topbar, mainContent);

    const wrapper = createSidebarProvider();
    wrapper.appendChild(inset);
    wrapper.appendChild(envolverEmNav(instance.element, 'Detalhes'));

    const container = document.createElement('div');
    container.className = 'nds-w-full nds-border-default nds-rounded-lg nds-overflow-hidden';
  container.classList.add('nds-min-h-100');
    container.appendChild(wrapper);
    return container;
  },
  parameters: {
    covers: ['visual.item6'],
    docs: {
      // O lado é o assunto, e o marco ganha nome próprio: dois marcos de
      // navegação com o mesmo nome são indistinguíveis para quem os lista.
      source: {
        transform: sidebarSourceWith({
          side: 'right',
          navLabel: 'Detalhes',
          rodape: false,
          grupos: [
            {
              items: [
                { label: 'Informações', href: '#', active: true },
                { label: 'Histórico', href: '#' },
                { label: 'Comentários', href: '#', badge: '3' },
              ],
            },
          ],
        }),
      },
      description: {
        story: 'Sidebar posicionada na direita. Usada para painéis de detalhes ou contexto.',
      },
    },
  },
};
