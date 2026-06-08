import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect, fn, userEvent } from 'storybook/test';
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
  tags: ['navigation'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      description: {
        component:
          'Configuracoes de composição do Breadcrumb: simples, com ellipsis, separador customizado e link customizado via asChild (Vue) para integração com routers.',
      },
    },
  },
} satisfies Meta<any>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Simple: Story = {
  args: {
    onNavigate: fn(),
  } as any,
  render: (args) => ({
    components: {
      Breadcrumb,
      BreadcrumbList,
      BreadcrumbItem,
      BreadcrumbLink,
      BreadcrumbPage,
      BreadcrumbSeparator,
    },
    setup() {
      const onNavigate = (args as { onNavigate: (payload: unknown) => void }).onNavigate;
      const handleClick = (label: string, e: Event) => {
        e.preventDefault();
        onNavigate({ event: 'navigation_click', label });
      };
      return { handleClick };
    },
    template: `
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#" @click="(e) => handleClick('Início', e)">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#" @click="(e) => handleClick('Componentes', e)">Componentes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    `,
  }),
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);
    const onNavigate = (args as { onNavigate: ReturnType<typeof fn> }).onNavigate;

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
