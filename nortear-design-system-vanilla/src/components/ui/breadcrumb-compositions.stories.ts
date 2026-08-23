import { figmaDesign } from '@shared/figma/design-links';
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
import {
  breadcrumbWithMenuSourceWith,
  breadcrumbSource,
  breadcrumbSourceWith,
} from './breadcrumb.source';
import { createDropdownMenu } from './dropdown-menu';

const meta: Meta = {
  tags: ['navigation'],
  title: 'UI/Breadcrumb/Compositions',
  parameters: {
    design: figmaDesign('breadcrumb'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      source: { transform: breadcrumbSource },
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
      // Override de story: o ouvinte que reporta a navegação é o assunto aqui, e
      // control nenhum o alcança.
      source: {
        transform: breadcrumbSourceWith({ onNavigate: 'registrarNavegacao(text);' }),
      },
      description: {
        story:
          'Composição padrão com 3 níveis e separador ChevronRight automático. Último item usa BreadcrumbPage.',
      },
    },
  },
  render: () => {
    const nav = createBreadcrumb();
    const list = createBreadcrumbList();

    const createLevel = (label: string) => {
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
      createLevel('Início'),
      createBreadcrumbSeparator(),
      createLevel('Componentes'),
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
      // Override de story: a forma do snippet é outra — o menu que expõe os
      // níveis ocultos é uma segunda fábrica, e é ela o assunto.
      source: { transform: breadcrumbWithMenuSourceWith() },
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
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'nds-cluster nds-rounded-md';
    trigger.style.background = 'transparent';
    trigger.style.border = '0';
    trigger.style.padding = '0';
    trigger.dataset.spacing = 'xs';
    trigger.setAttribute('aria-label', 'Expandir níveis ocultos');
    trigger.appendChild(createBreadcrumbEllipsis());

    const ellipsis = createBreadcrumbItem();
    ellipsis.appendChild(
      createDropdownMenu({
        trigger: trigger,
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
    const trigger = canvas.getByRole('button', { name: /expandir níveis ocultos/i });

    const open = async () => {
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
    };
    const close = async () => {
      if (trigger.getAttribute('aria-expanded') === 'true') await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(trigger).not.toHaveAttribute('aria-expanded', 'true'));
    };

    await step('O gatilho abre a lista dos níveis colapsados', async () => {
      // functional.item5 — é aqui que os níveis ocultos voltam a existir para
      // quem navega: as reticências sozinhas informam, o menu é que leva.
      await close();
      await open();
      const items = await waitFor(() => within(document.body).getAllByRole('menuitem'));
      await expect(items.map((i) => i.textContent?.trim())).toEqual(['Documentação', 'Guia', 'Componentes']);
    });

    await step('Escape fecha e devolve o foco ao gatilho', async () => {
      await open();
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(trigger).not.toHaveAttribute('aria-expanded', 'true'));
      await waitFor(() => expect(trigger).toHaveFocus());
    });
  },
};
