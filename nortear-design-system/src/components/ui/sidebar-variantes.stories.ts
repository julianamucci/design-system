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
  tags: ['layout'],
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
  topbar.className = 'nds-cluster nds-border-b';
  topbar.dataset.spacing = 'sm';
  topbar.style.height = '3rem';
  topbar.style.paddingLeft = '1rem';
  topbar.style.paddingRight = '1rem';
  topbar.appendChild(createSidebarTrigger(instance.toggle));

  const variantLabel = document.createElement('span');
  variantLabel.className = 'nds-text-caption nds-text-muted-foreground nds-font-mono';
  variantLabel.textContent = `variant="${variant}"`;
  topbar.appendChild(variantLabel);

  const mainContent = document.createElement('div');
  mainContent.className = 'nds-cluster nds-flex-1 nds-text-body nds-text-muted-foreground';
  mainContent.dataset.justify = 'center';
  mainContent.style.padding = '2rem';
  mainContent.textContent = 'Conteúdo principal';

  inset.append(topbar, mainContent);

  const wrapper = createSidebarProvider();
  wrapper.appendChild(instance.element);
  wrapper.appendChild(inset);

  const container = document.createElement('div');
  container.className = 'nds-w-full nds-border-default nds-rounded-lg nds-overflow-hidden';
  container.style.minHeight = '400px';
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
    topbar.className = 'nds-cluster nds-border-b';
    topbar.dataset.spacing = 'sm';
    topbar.dataset.justify = 'end';
    topbar.style.height = '3rem';
    topbar.style.paddingLeft = '1rem';
    topbar.style.paddingRight = '1rem';
    topbar.appendChild(createSidebarTrigger(instance.toggle));

    const mainContent = document.createElement('div');
    mainContent.className = 'nds-cluster nds-flex-1 nds-text-body nds-text-muted-foreground';
  mainContent.dataset.justify = 'center';
  mainContent.style.padding = '2rem';
    mainContent.textContent = 'Conteúdo principal';

    inset.append(topbar, mainContent);

    const wrapper = createSidebarProvider();
    wrapper.appendChild(inset);
    wrapper.appendChild(instance.element);

    const container = document.createElement('div');
    container.className = 'nds-w-full nds-border-default nds-rounded-lg nds-overflow-hidden';
  container.style.minHeight = '400px';
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
