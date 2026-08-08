import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from './index';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../dropdown-menu';

const meta = {
  title: 'UI/Breadcrumb/Composicoes',
  component: Breadcrumb,
  tags: ['navigation'],
  parameters: {
    design: figmaDesign('breadcrumb'),
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes canônicas do Breadcrumb: trilha completa com evento de navegação e trilha responsiva com DropdownMenu expondo os níveis ocultos.',
      },
    },
  },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onNavigate = fn();

export const Default: Story = {
  parameters: {
    covers: ['functional.item1', 'functional.item3'],
    docs: {
      description: {
        story:
          'Composição padrão com 3 níveis e separador ChevronRight automático. Último item usa BreadcrumbPage.',
      },
    },
  },
  render: () => ({
    components: { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator },
    setup: () => ({
      aoNavegar: (label: string, e: Event) => {
        e.preventDefault();
        onNavigate({ event: 'navigation_click', label });
      },
    }),
    template: `
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#" @click="aoNavegar('Início', $event)">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#" @click="aoNavegar('Componentes', $event)">Componentes</BreadcrumbLink>
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
    const links = canvas.getAllByRole('link');

    await step('Cada nível anterior reporta a própria navegação', async () => {
      // functional.item3 — o rótulo faz parte do evento: sem ele o dado diz que
      // alguém navegou, mas não para onde.
      onNavigate.mockClear();
      await userEvent.click(links[0]);
      await expect(onNavigate).toHaveBeenLastCalledWith({ event: 'navigation_click', label: 'Início' });
      await userEvent.click(links[1]);
      await expect(onNavigate).toHaveBeenLastCalledWith({ event: 'navigation_click', label: 'Componentes' });
      await expect(onNavigate).toHaveBeenCalledTimes(2);
    });

    await step('A página atual não dispara navegação', async () => {
      // functional.item1 — ela fecha a trilha; clicar nela não é ir a lugar
      // nenhum, e por isso ela nem é link.
      onNavigate.mockClear();
      const page = canvasElement.querySelector<HTMLElement>('[data-slot="breadcrumb-page"]')!;
      await userEvent.click(page);
      await expect(onNavigate).not.toHaveBeenCalled();
    });
  },
};

export const Responsive: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item4'],
    docs: {
      description: {
        story:
          'Composição responsiva: BreadcrumbEllipsis envolvido em DropdownMenu para expor níveis ocultos em mobile.',
      },
    },
  },
  render: () => ({
    components: {
      Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage,
      BreadcrumbSeparator, BreadcrumbEllipsis,
      DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
    },
    template: `
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <DropdownMenu>
              <DropdownMenuTrigger class="nds-cluster" data-spacing="xs" aria-label="Expandir níveis ocultos">
                <!-- Sem rótulo aqui: quem nomeia é o gatilho, e dois nomes no
                     mesmo controle viram leitura duplicada. -->
                <BreadcrumbEllipsis />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem>Documentação</DropdownMenuItem>
                <DropdownMenuItem>Guia</DropdownMenuItem>
                <DropdownMenuItem>Componentes</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
    const gatilho = canvas.getByRole('button', { name: /expandir níveis ocultos/i });

    const abrir = async () => {
      if (gatilho.getAttribute('aria-expanded') !== 'true') await userEvent.click(gatilho);
      await waitFor(() => expect(gatilho).toHaveAttribute('aria-expanded', 'true'));
    };
    const fechar = async () => {
      if (gatilho.getAttribute('aria-expanded') === 'true') await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(gatilho).not.toHaveAttribute('aria-expanded', 'true'));
    };

    await step('O gatilho abre a lista dos níveis colapsados', async () => {
      // functional.item5 — é aqui que os níveis ocultos voltam a existir para
      // quem navega: as reticências sozinhas informam, o menu é que leva.
      await fechar();
      await abrir();
      const itens = await waitFor(() => within(document.body).getAllByRole('menuitem'));
      await expect(itens.map((i) => i.textContent?.trim())).toEqual(['Documentação', 'Guia', 'Componentes']);
    });

    await step('Escape fecha e devolve o foco ao gatilho', async () => {
      await abrir();
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(gatilho).not.toHaveAttribute('aria-expanded', 'true'));
      // waitFor aqui não é preguiça: o painel do menu sai animado, e o foco só
      // volta ao gatilho quando ele termina de sair.
      await waitFor(() => expect(gatilho).toHaveFocus());
    });
  },
};
