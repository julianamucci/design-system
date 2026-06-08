import type { Meta, StoryObj } from '@storybook/html';
import { within, expect, fn, userEvent } from 'storybook/test';
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
  title: 'UI/Breadcrumb/Estados',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      description: {
        component:
          'Configuracoes do Breadcrumb: simples, com ellipsis, separador customizado e link como router (asChild-like).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Simple: Story = {
  args: {
    onNavigate: fn(),
  },
  render: (args) => {
    const nav = createBreadcrumb();
    const list = createBreadcrumbList();
    const onNavigate = (args as { onNavigate: (payload: unknown) => void }).onNavigate;

    const home = createBreadcrumbItem();
    const homeLink = createBreadcrumbLink({ href: '#', text: 'Início' });
    homeLink.addEventListener('click', (e) => {
      e.preventDefault();
      onNavigate({ event: 'navigation_click', label: 'Início' });
    });
    home.appendChild(homeLink);

    const components = createBreadcrumbItem();
    const componentsLink = createBreadcrumbLink({ href: '#', text: 'Componentes' });
    componentsLink.addEventListener('click', (e) => {
      e.preventDefault();
      onNavigate({ event: 'navigation_click', label: 'Componentes' });
    });
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
          'Sequência básica de `BreadcrumbItem` + `BreadcrumbSeparator`; último item em `BreadcrumbPage` com `aria-current="page"`.',
      },
    },
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);
    const onNavigate = (args as { onNavigate: ReturnType<typeof fn> }).onNavigate;

    await step('Nav com aria-label="breadcrumb"', async () => {
      await expect(canvas.getByRole('navigation', { name: 'breadcrumb' })).toBeInTheDocument();
    });

    await step('Último item tem aria-current="page" e não é <a>', async () => {
      const nav = canvas.getByRole('navigation', { name: 'breadcrumb' });
      const current = nav.querySelector('[aria-current="page"]');
      await expect(current).toBeInTheDocument();
      await expect(current?.tagName.toLowerCase()).not.toBe('a');
    });

    const links = canvas.getAllByRole('link');

    await step('F3: clicar em BreadcrumbLink dispara navigation_click', async () => {
      await userEvent.click(links[0]);
      await expect(onNavigate).toHaveBeenCalled();
    });

    await step('F6: Tab foca links em ordem e Enter ativa o link focado', async () => {
      (links[0] as HTMLElement).blur();
      onNavigate.mockClear();
      await userEvent.tab();
      await expect(links[0]).toHaveFocus();
      await userEvent.tab();
      await expect(links[1]).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await expect(onNavigate).toHaveBeenCalled();
    });

    await step('A5: focus ring visível — link aceita foco programático', async () => {
      (links[0] as HTMLElement).focus();
      await expect(links[0]).toHaveFocus();
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
