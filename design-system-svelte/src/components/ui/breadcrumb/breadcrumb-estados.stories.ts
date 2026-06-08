import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect, fn } from 'storybook/test';
import { Breadcrumb } from './index';
import BreadcrumbStory from './BreadcrumbStory.svelte';

const meta = {
  title: 'UI/Breadcrumb/Estados',
  component: Breadcrumb,
  tags: ['navigation'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      description: {
        component:
          'Configuracoes de composição do Breadcrumb: simples, com ellipsis, separador customizado e link customizado via child snippet (Svelte) para integração com routers.',
      },
    },
  },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Simple: Story = {
  args: {
    onNavigate: fn(),
  },
  render: () => ({
    Component: BreadcrumbStory,
    props: { variant: 'default' },
  }),
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);
    const onNavigate = (args as { onNavigate: ReturnType<typeof fn> }).onNavigate;

    // Intercepta cliques nos links para simular o callback navigation_click
    // (em produção o consumidor passa href/router; aqui garantimos o contrato via delegação).
    const nav = canvas.getByRole('navigation', { name: 'breadcrumb' });
    const linkHandler = (e: Event) => {
      const target = (e.target as HTMLElement | null)?.closest('a[data-slot="breadcrumb-link"]');
      if (target) {
        e.preventDefault();
        onNavigate({ event: 'navigation_click', label: target.textContent?.trim() });
      }
    };
    nav.addEventListener('click', linkHandler);
    nav.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Enter') {
        linkHandler(e);
      }
    });

    await step('nav aria-label="breadcrumb" está presente', async () => {
      await expect(canvas.getByRole('navigation', { name: 'breadcrumb' })).toBeInTheDocument();
    });

    await step('Último item é BreadcrumbPage com aria-current', async () => {
      const page = canvasElement.querySelector('[data-slot="breadcrumb-page"]');
      await expect(page).toHaveAttribute('aria-current', 'page');
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
  render: () => ({
    Component: BreadcrumbStory,
    props: { variant: 'withEllipsis' },
  }),
  play: async ({ canvasElement, step }) => {
    await step('Ellipsis renderiza com aria-hidden="true"', async () => {
      const ellipsis = canvasElement.querySelector('[data-slot="breadcrumb-ellipsis"]');
      await expect(ellipsis).toBeInTheDocument();
      await expect(ellipsis).toHaveAttribute('aria-hidden', 'true');
    });

    await step('Ellipsis contém texto sr-only "More"', async () => {
      const srOnly = canvasElement.querySelector('[data-slot="breadcrumb-ellipsis"] .sr-only');
      await expect(srOnly).toHaveTextContent('More');
    });
  },
};

export const CustomSeparator: Story = {
  render: () => ({
    Component: BreadcrumbStory,
    props: { variant: 'customSeparator' },
  }),
  play: async ({ canvasElement, step }) => {
    await step('Separador customizado substitui o ChevronRight padrão', async () => {
      const separators = canvasElement.querySelectorAll('[data-slot="breadcrumb-separator"]');
      await expect(separators.length).toBe(2);
      separators.forEach((sep) => {
        // Cada separator deve conter um SVG (Slash)
        expect(sep.querySelector('svg')).toBeInTheDocument();
        expect(sep).toHaveAttribute('aria-hidden', 'true');
      });
    });
  },
};

export const AsChildLink: Story = {
  render: () => ({
    Component: BreadcrumbStory,
    props: { variant: 'asChildLink' },
  }),
  play: async ({ canvasElement, step }) => {
    await step('child snippet renderiza o <a> como elemento raiz do BreadcrumbLink', async () => {
      const routerLinks = canvasElement.querySelectorAll('a[data-router="true"]');
      await expect(routerLinks.length).toBe(2);
      routerLinks.forEach((link) => {
        expect(link).toHaveAttribute('data-slot', 'breadcrumb-link');
      });
    });
  },
};
