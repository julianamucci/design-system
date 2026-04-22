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
  title: 'UI/Breadcrumb/Estados',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Configurações do Breadcrumb: simples, com ellipsis, separador customizado e link como router (asChild-like).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Simple: Story = {
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
        story:
          'Sequência básica de `BreadcrumbItem` + `BreadcrumbSeparator`; último item em `BreadcrumbPage` com `aria-current="page"`.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Nav com aria-label="breadcrumb"', async () => {
      await expect(canvas.getByRole('navigation', { name: 'breadcrumb' })).toBeInTheDocument();
    });

    await step('Último item tem aria-current="page" e não é <a>', async () => {
      const nav = canvas.getByRole('navigation', { name: 'breadcrumb' });
      const current = nav.querySelector('[aria-current="page"]');
      await expect(current).toBeInTheDocument();
      await expect(current?.tagName.toLowerCase()).not.toBe('a');
    });
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
        story: 'Insere `BreadcrumbEllipsis` entre níveis para ocultar intermediários quando a hierarquia excede 4 níveis.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Ellipsis presente com aria-label', async () => {
      const nav = canvas.getByRole('navigation', { name: 'breadcrumb' });
      const ellipsis = nav.querySelector('[aria-label="Mais páginas"]');
      await expect(ellipsis).toBeInTheDocument();
    });
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
        story: 'Passa texto ou `HTMLElement` como `content` em `createBreadcrumbSeparator`; mantém `aria-hidden="true"`.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Separadores permanecem aria-hidden', async () => {
      const nav = canvas.getByRole('navigation', { name: 'breadcrumb' });
      const seps = nav.querySelectorAll('[role="presentation"][aria-hidden="true"]');
      await expect(seps.length).toBeGreaterThan(0);
    });

    await step('Separador customizado "/" é visível no texto', async () => {
      const nav = canvas.getByRole('navigation', { name: 'breadcrumb' });
      await expect(nav.textContent).toContain('/');
    });
  },
};

export const AsChildLink: Story = {
  render: () => {
    const nav = createBreadcrumb();
    const list = createBreadcrumbList();

    // Simula integração com router: um <a> com data-slot customizado
    // que preserva o comportamento do router (data-router-link).
    const home = createBreadcrumbItem();
    const homeLink = createBreadcrumbLink({ href: '/', text: 'Início' });
    homeLink.setAttribute('data-router-link', 'true');
    home.appendChild(homeLink);

    const components = createBreadcrumbItem();
    const componentsLink = createBreadcrumbLink({ href: '/components', text: 'Componentes' });
    componentsLink.setAttribute('data-router-link', 'true');
    components.appendChild(componentsLink);

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
        story:
          'Em frameworks com router (Next.js, React Router), os links podem ser renderizados com atributos do router (aqui simulado com `data-router-link`) para preservar o prefetch.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Links possuem atributo de router', async () => {
      const nav = canvas.getByRole('navigation', { name: 'breadcrumb' });
      const routerLinks = nav.querySelectorAll('a[data-router-link="true"]');
      await expect(routerLinks.length).toBe(2);
    });
  },
};
