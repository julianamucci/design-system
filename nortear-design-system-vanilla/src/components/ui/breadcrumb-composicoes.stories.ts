import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  createBreadcrumb,
  createBreadcrumbList,
  createBreadcrumbItem,
  createBreadcrumbLink,
  createBreadcrumbPage,
  createBreadcrumbSeparator,
  createBreadcrumbEllipsis,
} from './breadcrumb';
import { createDropdownMenu } from './dropdown-menu';

const meta: Meta = {
  tags: ['navigation'],
  title: 'UI/Breadcrumb/Composicoes',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      description: {
        component:
          'Composicoes canônicas do Breadcrumb: trilha completa com evento de navegação e trilha responsiva com DropdownMenu expondo os níveis ocultos.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

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
  render: () => {
    const nav = createBreadcrumb();
    const list = createBreadcrumbList();

    const criarNivel = (label: string) => {
      const item = createBreadcrumbItem();
      const link = createBreadcrumbLink({ href: '#', text: label });
      link.addEventListener('click', (e) => {
        e.preventDefault();
        onNavigate({ event: 'navigation_click', label });
      });
      item.appendChild(link);
      return item;
    };

    const current = createBreadcrumbItem();
    current.appendChild(createBreadcrumbPage({ text: 'Breadcrumb' }));

    list.append(
      criarNivel('Início'),
      createBreadcrumbSeparator(),
      criarNivel('Componentes'),
      createBreadcrumbSeparator(),
      current,
    );

    nav.appendChild(list);
    return nav;
  },
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
  render: () => {
    const nav = createBreadcrumb();
    const list = createBreadcrumbList();

    const home = createBreadcrumbItem();
    home.appendChild(createBreadcrumbLink({ href: '#', text: 'Início' }));

    // O gatilho é quem nomeia e quem recebe o foco; as reticências dentro dele
    // ficam decorativas, senão o controle teria dois nomes.
    const gatilho = document.createElement('button');
    gatilho.type = 'button';
    gatilho.className = 'nds-cluster nds-rounded-md';
    gatilho.style.background = 'transparent';
    gatilho.style.border = '0';
    gatilho.style.padding = '0';
    gatilho.dataset.spacing = 'xs';
    gatilho.setAttribute('aria-label', 'Expandir níveis ocultos');
    gatilho.appendChild(createBreadcrumbEllipsis());

    const ellipsis = createBreadcrumbItem();
    ellipsis.appendChild(
      createDropdownMenu({
        trigger: gatilho,
        items: [
          { label: 'Documentação' },
          { label: 'Guia' },
          { label: 'Componentes' },
        ],
      }),
    );

    const current = createBreadcrumbItem();
    current.appendChild(createBreadcrumbPage({ text: 'Breadcrumb' }));

    list.append(
      home,
      createBreadcrumbSeparator(),
      ellipsis,
      createBreadcrumbSeparator(),
      current,
    );

    nav.appendChild(list);
    return nav;
  },
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
      await waitFor(() => expect(gatilho).toHaveFocus());
    });
  },
};
