import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from './index';
import { SlashIcon } from 'lucide-vue-next';

const meta = {
  title: 'UI/Breadcrumb/Estados',
  component: Breadcrumb,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Configurações de composição do Breadcrumb: simples, com ellipsis, separador customizado e link customizado via asChild (Vue) para integração com routers.',
      },
    },
  },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Simple: Story = {
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
    components: {
      Breadcrumb,
      BreadcrumbList,
      BreadcrumbItem,
      BreadcrumbLink,
      BreadcrumbPage,
      BreadcrumbSeparator,
      BreadcrumbEllipsis,
    },
    template: `
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbEllipsis />
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
    components: {
      Breadcrumb,
      BreadcrumbList,
      BreadcrumbItem,
      BreadcrumbLink,
      BreadcrumbPage,
      BreadcrumbSeparator,
      SlashIcon,
    },
    template: `
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <SlashIcon />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Documentação</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <SlashIcon />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Separador customizado substitui o ChevronRight padrão', async () => {
      const separators = canvasElement.querySelectorAll('[data-slot="breadcrumb-separator"]');
      await expect(separators.length).toBe(2);
      separators.forEach((sep) => {
        // Cada separator deve conter um SVG (SlashIcon)
        expect(sep.querySelector('svg')).toBeInTheDocument();
        expect(sep).toHaveAttribute('aria-hidden', 'true');
      });
    });
  },
};

export const AsChildLink: Story = {
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
            <BreadcrumbLink as-child>
              <a href="#" data-router="true">Início</a>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink as-child>
              <a href="#" data-router="true">Componentes</a>
            </BreadcrumbLink>
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
    await step('asChild renderiza o filho <a> como elemento raiz do BreadcrumbLink', async () => {
      const routerLinks = canvasElement.querySelectorAll('a[data-router="true"]');
      await expect(routerLinks.length).toBe(2);
      routerLinks.forEach((link) => {
        expect(link).toHaveAttribute('data-slot', 'breadcrumb-link');
      });
    });
  },
};
