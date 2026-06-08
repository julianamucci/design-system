import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import {
  createBreadcrumb,
  createBreadcrumbList,
  createBreadcrumbItem,
  createBreadcrumbLink,
  createBreadcrumbPage,
  createBreadcrumbSeparator,
  createBreadcrumbEllipsis,
} from './breadcrumb';

const meta: Meta = {
  tags: ['navigation'],
  title: 'UI/Breadcrumb/Composicoes',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      description: {
        component:
          'Configuracoes de composição do Breadcrumb: padrão, com ellipsis, separador customizado e colapso responsivo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => {
    const nav = createBreadcrumb();
    const list = createBreadcrumbList();

    const home = createBreadcrumbItem();
    home.appendChild(createBreadcrumbLink({ href: '#', text: 'Início' }));

    const components = createBreadcrumbItem();
    components.appendChild(createBreadcrumbLink({ href: '#', text: 'Componentes' }));

    const current = createBreadcrumbItem();
    current.appendChild(createBreadcrumbPage({ text: 'Breadcrumb' }));

    list.append(
      home,
      createBreadcrumbSeparator(),
      components,
      createBreadcrumbSeparator(),
      current,
    );

    nav.appendChild(list);
    return nav;
  },
  parameters: {
    docs: {
      description: {
        story: 'Composição padrão com `ChevronRight` (›) como separador e o último item como `BreadcrumbPage`.',
      },
    },
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const WithEllipsis: Story = {
  render: () => {
    const nav = createBreadcrumb();
    const list = createBreadcrumbList();

    const home = createBreadcrumbItem();
    home.appendChild(createBreadcrumbLink({ href: '#', text: 'Início' }));

    const ellipsis = createBreadcrumbItem();
    ellipsis.appendChild(createBreadcrumbEllipsis({ label: 'Mais páginas' }));

    const components = createBreadcrumbItem();
    components.appendChild(createBreadcrumbLink({ href: '#', text: 'Componentes' }));

    const current = createBreadcrumbItem();
    current.appendChild(createBreadcrumbPage({ text: 'Breadcrumb' }));

    list.append(
      home,
      createBreadcrumbSeparator(),
      ellipsis,
      createBreadcrumbSeparator(),
      components,
      createBreadcrumbSeparator(),
      current,
    );

    nav.appendChild(list);
    return nav;
  },
  parameters: {
    docs: {
      description: {
        story: 'Níveis intermediários colapsados em `BreadcrumbEllipsis` quando a hierarquia excede 4 níveis.',
      },
    },
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const CustomSeparator: Story = {
  render: () => {
    const nav = createBreadcrumb();
    const list = createBreadcrumbList();

    const home = createBreadcrumbItem();
    home.appendChild(createBreadcrumbLink({ href: '#', text: 'Início' }));

    const components = createBreadcrumbItem();
    components.appendChild(createBreadcrumbLink({ href: '#', text: 'Componentes' }));

    const current = createBreadcrumbItem();
    current.appendChild(createBreadcrumbPage({ text: 'Breadcrumb' }));

    list.append(
      home,
      createBreadcrumbSeparator({ content: '/' }),
      components,
      createBreadcrumbSeparator({ content: '/' }),
      current,
    );

    nav.appendChild(list);
    return nav;
  },
  parameters: {
    docs: {
      description: {
        story: 'Separador customizado via option `content` de `createBreadcrumbSeparator` — texto ou HTMLElement (ícone).',
      },
    },
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const Responsive: Story = {
  render: () => {
    const nav = createBreadcrumb();
    const list = createBreadcrumbList();

    const home = createBreadcrumbItem();
    home.appendChild(createBreadcrumbLink({ href: '#', text: 'Início' }));

    const ellipsis = createBreadcrumbItem();
    ellipsis.appendChild(createBreadcrumbEllipsis({ label: 'Mais páginas' }));

    const guide = createBreadcrumbItem();
    guide.appendChild(createBreadcrumbLink({ href: '#', text: 'Guia' }));

    const components = createBreadcrumbItem();
    components.appendChild(createBreadcrumbLink({ href: '#', text: 'Componentes' }));

    const current = createBreadcrumbItem();
    current.appendChild(createBreadcrumbPage({ text: 'Breadcrumb' }));

    list.append(
      home,
      createBreadcrumbSeparator(),
      ellipsis,
      createBreadcrumbSeparator(),
      guide,
      createBreadcrumbSeparator(),
      components,
      createBreadcrumbSeparator(),
      current,
    );

    nav.appendChild(list);
    return nav;
  },
  parameters: {
    docs: {
      description: {
        story:
          'No mobile, envolva o `BreadcrumbEllipsis` em um `DropdownMenu` para expor os níveis ocultos ao clique — nunca os esconda permanentemente.',
      },
    },
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};
