import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import { Breadcrumb } from './index';
import BreadcrumbStory from './BreadcrumbStory.svelte';
import BreadcrumbDocs from '@/components/docs/BreadcrumbDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs', 'navigation'],
  parameters: {
    docs: {
      page: withAutoDocsTab(BreadcrumbDocs),
      description: {
        component:
          'Breadcrumb exibe a hierarquia de navegação do site com <nav aria-label="breadcrumb"> + <ol>. Composto por 7 subcomponentes; o último item deve ser sempre BreadcrumbPage com aria-current="page".',
      },
    },
  },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => ({
    Component: BreadcrumbStory,
    props: { variant: 'default' },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('nav com aria-label="breadcrumb" está presente', async () => {
      const nav = canvas.getByRole('navigation', { name: 'breadcrumb' });
      await expect(nav).toBeInTheDocument();
    });

    await step('Lista ordenada renderiza como <ol>', async () => {
      const list = canvasElement.querySelector('ol[data-slot="breadcrumb-list"]');
      await expect(list).toBeInTheDocument();
    });

    await step('Links intermediários estão visíveis', async () => {
      await expect(canvas.getByText('Início')).toBeVisible();
      await expect(canvas.getByText('Componentes')).toBeVisible();
    });

    await step('Último item é BreadcrumbPage com aria-current="page"', async () => {
      const page = canvasElement.querySelector('[data-slot="breadcrumb-page"]');
      await expect(page).toBeInTheDocument();
      await expect(page).toHaveAttribute('aria-current', 'page');
      await expect(page).toHaveTextContent('Breadcrumb');
    });

    await step('BreadcrumbPage não contém link <a>', async () => {
      const page = canvasElement.querySelector('[data-slot="breadcrumb-page"]');
      const anchor = page?.querySelector('a');
      await expect(anchor).toBeNull();
    });

    await step('Separadores têm aria-hidden="true" e role="presentation"', async () => {
      const separators = canvasElement.querySelectorAll('[data-slot="breadcrumb-separator"]');
      await expect(separators.length).toBe(2);
      separators.forEach((sep) => {
        expect(sep).toHaveAttribute('aria-hidden', 'true');
        expect(sep).toHaveAttribute('role', 'presentation');
      });
    });
  },
};
