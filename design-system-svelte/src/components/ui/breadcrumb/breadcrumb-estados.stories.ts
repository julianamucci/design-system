import type { Meta, StoryObj } from '@storybook/svelte';
import { within, expect } from 'storybook/test';
import { Breadcrumb } from './index';
import BreadcrumbStory from './BreadcrumbStory.svelte';

const meta = {
  title: 'UI/Breadcrumb/Estados',
  component: Breadcrumb,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Configurações de composição do Breadcrumb: simples, com ellipsis, separador customizado e link customizado via child snippet (Svelte) para integração com routers.',
      },
    },
  },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Simple: Story = {
  render: () => ({
    Component: BreadcrumbStory,
    props: { variant: 'default' },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('nav aria-label="breadcrumb" está presente', async () => {
      await expect(canvas.getByRole('navigation', { name: 'breadcrumb' })).toBeInTheDocument();
    });

    await step('Último item é BreadcrumbPage com aria-current', async () => {
      const page = canvasElement.querySelector('[data-slot="breadcrumb-page"]');
      await expect(page).toHaveAttribute('aria-current', 'page');
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
