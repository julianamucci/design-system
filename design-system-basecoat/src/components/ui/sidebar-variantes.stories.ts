import type { Meta, StoryObj } from '@storybook/html';
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

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'UI/Sidebar/Variantes',
  parameters: {
    actions: { disable: true },
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
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
  logoRow.className = 'px-2 py-1 text-sm font-semibold text-sidebar-foreground';
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
        { label: 'Configurações', href: '#' },
      ],
    }),
  );
  inner.appendChild(content);

  const footer = createSidebarFooter();
  const userRow = document.createElement('div');
  userRow.className = 'px-2 py-1 text-sm text-sidebar-foreground';
  userRow.textContent = 'Usuário';
  footer.appendChild(userRow);
  inner.appendChild(footer);

  const inset = document.createElement('div');
  inset.className = 'flex flex-1 flex-col';

  const topbar = document.createElement('div');
  topbar.className = 'flex h-12 items-center gap-2 border-b border-border px-4';
  topbar.appendChild(createSidebarTrigger(instance.toggle));

  const variantLabel = document.createElement('span');
  variantLabel.className = 'text-xs text-muted-foreground font-mono';
  variantLabel.textContent = `variant="${variant}"`;
  topbar.appendChild(variantLabel);

  const mainContent = document.createElement('div');
  mainContent.className = 'flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground';
  mainContent.textContent = 'Conteúdo principal';

  inset.append(topbar, mainContent);

  const wrapper = createSidebarProvider();
  wrapper.appendChild(instance.element);
  wrapper.appendChild(inset);

  const container = document.createElement('div');
  container.className = 'min-h-[400px] w-full border border-border rounded-lg overflow-hidden';
  container.appendChild(wrapper);
  return container;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const VarianteSidebar: Story = {
  name: 'sidebar (padrão)',
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
    await step('SidebarTrigger presente e acessível', async () => {
      const trigger = canvas.getByRole('button', { name: /toggle sidebar/i });
      await expect(trigger).toBeInTheDocument();
    });
    await step('Sidebar tem data-variant="sidebar"', async () => {
      const sidebar = canvasElement.querySelector('[data-variant="sidebar"]');
      await expect(sidebar).toBeInTheDocument();
    });
  },
};

export const VarianteFloating: Story = {
  name: 'floating',
  render: () => buildVariantDemo('floating'),
  parameters: {
    docs: {
      description: {
        story: 'Sidebar com borda arredondada e sombra, flutuando sobre um pequeno padding. Não empurra o conteúdo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Sidebar tem data-variant="floating"', async () => {
      const sidebar = canvasElement.querySelector('[data-variant="floating"]');
      await expect(sidebar).toBeInTheDocument();
    });
  },
};

export const VarianteInset: Story = {
  name: 'inset',
  render: () => buildVariantDemo('inset'),
  parameters: {
    docs: {
      description: {
        story: 'Sidebar integrada ao layout com o conteúdo em container arredondado adjacente.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Sidebar tem data-variant="inset"', async () => {
      const sidebar = canvasElement.querySelector('[data-variant="inset"]');
      await expect(sidebar).toBeInTheDocument();
    });
  },
};

export const LadoDireito: Story = {
  name: 'side="right"',
  play: async ({ canvasElement, step }) => {
    await step('Sidebar tem data-side="right"', async () => {
      const sidebar = canvasElement.querySelector('[data-side="right"]');
      await expect(sidebar).toBeInTheDocument();
    });
  },
  render: () => {
    const instance = createSidebar({ defaultOpen: true, side: 'right', variant: 'sidebar' });
    const inner = instance.element.querySelector('[data-sidebar="sidebar"]')!;

    const header = createSidebarHeader();
    const logoRow = document.createElement('div');
    logoRow.className = 'px-2 py-1 text-sm font-semibold text-sidebar-foreground';
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
    inset.className = 'flex flex-1 flex-col';

    const topbar = document.createElement('div');
    topbar.className = 'flex h-12 items-center justify-end gap-2 border-b border-border px-4';
    topbar.appendChild(createSidebarTrigger(instance.toggle));

    const mainContent = document.createElement('div');
    mainContent.className = 'flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground';
    mainContent.textContent = 'Conteúdo principal';

    inset.append(topbar, mainContent);

    const wrapper = createSidebarProvider();
    wrapper.appendChild(inset);
    wrapper.appendChild(instance.element);

    const container = document.createElement('div');
    container.className = 'min-h-[400px] w-full border border-border rounded-lg overflow-hidden';
    container.appendChild(wrapper);
    return container;
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar posicionada na direita. Usada para painéis de detalhes ou contexto.',
      },
    },
  },
};
