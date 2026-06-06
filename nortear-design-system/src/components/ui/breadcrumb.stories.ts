import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import {
  createBreadcrumb,
  createBreadcrumbList,
  createBreadcrumbItem,
  createBreadcrumbLink,
  createBreadcrumbPage,
  createBreadcrumbSeparator,
} from './breadcrumb';
import { createBreadcrumbDocs } from '@/components/docs/BreadcrumbDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'UI/Breadcrumb',
  tags: ['autodocs', 'navigation'],
  parameters: {
    docs: { page: withAutoDocsTab(createBreadcrumbDocs) },
  },
};

export default meta;
type Story = StoryObj;

// ─── Playground ───────────────────────────────────────────────────────────────

function buildPlaygroundBreadcrumb(): HTMLElement {
  const nav = createBreadcrumb({ label: 'breadcrumb' });
  const list = createBreadcrumbList();

  const home = createBreadcrumbItem();
  home.appendChild(createBreadcrumbLink({ href: '#', text: 'Início' }));

  const components = createBreadcrumbItem();
  components.appendChild(createBreadcrumbLink({ href: '#', text: 'Componentes' }));

  const page = createBreadcrumbItem();
  page.appendChild(createBreadcrumbPage({ text: 'Breadcrumb' }));

  list.append(
    home,
    createBreadcrumbSeparator(),
    components,
    createBreadcrumbSeparator(),
    page,
  );

  nav.appendChild(list);
  return nav;
}

export const Playground: Story = {
  render: () => buildPlaygroundBreadcrumb(),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Nav com aria-label="breadcrumb" presente', async () => {
      const nav = canvas.getByRole('navigation', { name: 'breadcrumb' });
      await expect(nav).toBeInTheDocument();
    });

    await step('Lista ordenada <ol> dentro do nav', async () => {
      const nav = canvas.getByRole('navigation', { name: 'breadcrumb' });
      const ol = nav.querySelector('ol');
      await expect(ol).toBeInTheDocument();
    });

    await step('Links de níveis anteriores são navegáveis', async () => {
      await expect(canvas.getByRole('link', { name: 'Início' })).toBeInTheDocument();
      await expect(canvas.getByRole('link', { name: 'Componentes' })).toBeInTheDocument();
    });

    await step('Último item é BreadcrumbPage com aria-current="page"', async () => {
      const nav = canvas.getByRole('navigation', { name: 'breadcrumb' });
      const current = nav.querySelector('[aria-current="page"]');
      await expect(current).toBeInTheDocument();
      await expect(current).toHaveTextContent('Breadcrumb');
    });

    await step('BreadcrumbPage não é um <a>', async () => {
      const nav = canvas.getByRole('navigation', { name: 'breadcrumb' });
      const lastItem = nav.querySelectorAll('li')[nav.querySelectorAll('li').length - 1];
      const anchor = lastItem.querySelector('a');
      await expect(anchor).toBeNull();
    });
  },
};
