import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './index';
import BreadcrumbDocs from '@/components/docs/BreadcrumbDocs.vue';
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
          'Breadcrumb exibe a hierarquia de navegação do site com <nav aria-label="breadcrumb"> + <ol>. O último item é sempre BreadcrumbPage com aria-current="page".',
      },
    },
  },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item2',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item3',
      'accessibility.item4',
      'accessibility.item6',
      'visual.item1',
    ],
  },
  render: () => ({
    components: {
      Breadcrumb,
      BreadcrumbList,
      BreadcrumbItem,
      BreadcrumbLink,
      BreadcrumbPage,
      BreadcrumbSeparator,
    },
    template: `
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Componentes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A trilha é um landmark de navegação nomeado', async () => {
      // accessibility.item1 — sem o nome, o leitor de tela anuncia só
      // "navegação" e a pessoa não sabe qual das navegações da página é esta.
      const nav = canvas.getByRole('navigation', { name: 'breadcrumb' });
      await expect(nav).toHaveAttribute('data-slot', 'breadcrumb');
      // functional.item1 — a hierarquia é uma lista ordenada, não um punhado
      // de links soltos: é a ordem que dá o sentido do caminho.
      const list = nav.querySelector('[data-slot="breadcrumb-list"]');
      await expect(list?.tagName).toBe('OL');
      await expect(list!.children.length).toBeGreaterThan(0);
    });

    await step('Só os níveis anteriores são links', async () => {
      // functional.item2 — é a asserção que pega o defeito antigo: a página
      // atual tinha role="link" e entrava nesta conta, então o leitor de tela
      // anunciava três links num caminho que só tem dois navegáveis.
      const links = canvas.getAllByRole('link');
      await expect(links.length).toBe(2);
      await expect(links.map((l) => l.textContent?.trim())).toEqual(['Início', 'Componentes']);
      for (const link of links) await expect(link).toHaveAttribute('href', '#');
    });

    await step('A página atual é marcada, e não é navegável', async () => {
      // accessibility.item2
      const page = canvasElement.querySelector('[data-slot="breadcrumb-page"]')!;
      await expect(page).toHaveAttribute('aria-current', 'page');
      await expect(page).toHaveTextContent('Breadcrumb');
      await expect(page.hasAttribute('href')).toBe(false);
      await expect(page.querySelector('a')).toBeNull();
    });

    await step('Separadores ficam fora da árvore de acessibilidade', async () => {
      // accessibility.item3 — o chevron é desenho; lido em voz alta viraria
      // ruído entre os níveis.
      const separadores = canvasElement.querySelectorAll('[data-slot="breadcrumb-separator"]');
      await expect(separadores.length).toBe(2);
      for (const sep of separadores) {
        await expect(sep).toHaveAttribute('aria-hidden', 'true');
        await expect(sep).toHaveAttribute('role', 'presentation');
      }
    });
  },
};
