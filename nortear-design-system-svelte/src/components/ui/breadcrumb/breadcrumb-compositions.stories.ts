import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Breadcrumb } from './index';
import BreadcrumbStory from './BreadcrumbStory.svelte';
import { breadcrumbResponsivoSource, breadcrumbSource } from './breadcrumb.source';

const meta: Meta = {
  title: 'Components/Navigation/Breadcrumb/Compositions',
  component: Breadcrumb,
  tags: ['navigation'],
  parameters: {
    design: figmaDesign('breadcrumb'),
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para a trilha completa, que é a composição canônica; a
      // responsiva sobrescreve com a sua logo abaixo.
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
      description: {
        story:
          'Composição padrão com 3 níveis e separador ChevronRight automático. Último item usa BreadcrumbPage.',
      },
    },
  },
  render: () => ({ Component: BreadcrumbStory, props: { variant: 'default', onNavigate } }),
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
      source: { transform: breadcrumbResponsivoSource },
      description: {
        story:
          'Composição responsiva: BreadcrumbEllipsis envolvido em DropdownMenu para expor níveis ocultos em mobile.',
      },
    },
  },
  render: () => ({ Component: BreadcrumbStory, props: { variant: 'responsive' } }),
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
      // waitFor aqui não é preguiça: o painel do menu sai animado, e o foco só
      // volta ao gatilho quando ele termina de sair.
      await waitFor(() => expect(trigger).toHaveFocus());
    });
  },
};
