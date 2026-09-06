import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal } from '@/lib/wait-for-portal';

import { expect, within } from 'storybook/test';
import SheetStory from './SheetStory.svelte';
import {
  perfilSheetEditSource,
  sheetBottomPanelSource,
  sheetFiltersAvancadosSource,
  sheetNavegacaoSecundariaSource,
  sheetSource,
} from './sheet.source';

const meta: Meta = {
  title: 'Components/Overlay/Sheet/Compositions',
  component: SheetStory,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com a
      // sua própria composição logo abaixo — as três têm corpo, e o corpo é a
      // peça que muda entre elas.
      source: { transform: sheetSource },
      description: {
        component:
          'Composições reais do Sheet em fluxos de produto: filtros avançados, edição de ' +
          'perfil, navegação secundária e painel de ações na base. Renderizadas abertas ' +
          'para a captura visual.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const AdvancedFilters: Story = {
  args: {
    open: true,
    side: 'right',
    variant: 'withForm',
    triggerLabel: 'Filtros avançados',
    title: 'Filtros avançados',
    description: 'Refine os resultados configurando os filtros abaixo.',
    actionLabel: 'Aplicar filtros',
    cancelLabel: 'Cancelar',
  },
  parameters: {
    docs: {
      source: { transform: sheetFiltersAvancadosSource },
      description: {
        story:
          'Painel lateral direito com formulário de filtros. O rodapé mantém a saída e a ' +
          'ação primária alinhadas à direita.',
      },
    },
  },
  play: async () => {
    const panel = await waitForPortal('dialog');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute('aria-modal', 'true');
    await expect(panel).toHaveAccessibleName(/Filtros avançados/i);
    await expect(within(panel).getByLabelText(/Nome/i)).toBeVisible();
  },
};

export const ProfileEdit: Story = {
  args: {
    open: true,
    side: 'right',
    variant: 'profileForm',
    triggerLabel: 'Editar perfil',
    title: 'Editar perfil',
    description: 'Atualize suas informações pessoais. As mudanças são salvas ao confirmar.',
    actionLabel: 'Salvar alterações',
    cancelLabel: 'Cancelar',
  },
  parameters: {
    docs: {
      source: { transform: perfilSheetEditSource },
      description: {
        story:
          'Edição de perfil em painel lateral. Os campos participam do foco preso; Escape ' +
          'ou a saída do rodapé fecham sem salvar.',
      },
    },
  },
  play: async () => {
    const panel = await waitForPortal('dialog');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute('aria-modal', 'true');
    await expect(panel).toHaveAccessibleName(/Editar perfil/i);
    // Ordem conferida por ÍNDICE, e não por presença: o campo do meio já sumiu
    // uma vez, e uma busca solta o aceitaria de volta em qualquer posição — ou
    // casaria dois rótulos, já que um deles começa pelo outro.
    const rotulos = [...panel.querySelectorAll('label')].map((el) => el.textContent?.trim());
    await expect(rotulos).toEqual(['Nome', 'Nome de usuário', 'Bio']);
  },
};

export const SecondaryNavigation: Story = {
  args: {
    open: true,
    side: 'left',
    variant: 'secondaryNav',
    triggerLabel: 'Abrir menu',
    title: 'Menu',
    description: 'Navegue entre as áreas do sistema.',
  },
  parameters: {
    docs: {
      source: { transform: sheetNavegacaoSecundariaSource },
      description: {
        story:
          'Sheet à esquerda como menu de navegação secundária — itens clicáveis dentro do ' +
          'painel, sem rodapé.',
      },
    },
  },
  play: async () => {
    const panel = await waitForPortal('dialog');
    await expect(panel).toHaveAttribute('data-side', 'left');
    const nav = within(panel).getByRole('navigation', { name: /Navegação secundária/i });
    await expect(nav).toBeVisible();
    // As CINCO seções: o conteúdo compartilhado descreve a lista, e quatro
    // documentavam uma composição que não existe.
    await expect(within(nav).getAllByRole('link')).toHaveLength(5);
    await expect(within(nav).getByRole('link', { name: 'Faturas' })).toBeVisible();
    // Sem rodapé: a saída é o X do canto, e é ela que sustenta o painel sem ações.
    await expect(panel.querySelector('[data-slot="sheet-footer"]')).toBeNull();
  },
};

export const BottomPanel: Story = {
  args: {
    open: true,
    side: 'bottom',
    variant: 'actionRow',
    triggerLabel: 'Abrir ações',
    title: 'Ações rápidas',
    description: 'Escolha uma das ações disponíveis para este item.',
    cancelLabel: 'Fechar',
  },
  parameters: {
    docs: {
      source: { transform: sheetBottomPanelSource },
      description: {
        story:
          'Fileira de ações deslizando de baixo — o mesmo desenho do Drawer, sem o gesto ' +
          'de arrastar. Quando o gesto importa, o componente é o Drawer.',
      },
    },
  },
  play: async () => {
    const panel = await waitForPortal('dialog');
    await expect(panel).toHaveAttribute('data-side', 'bottom');
    await expect(panel).toHaveAccessibleName(/Ações rápidas/i);
    await expect(within(panel).getByRole('button', { name: 'Compartilhar' })).toBeVisible();
    // O rodapé existe, mas só com a saída: a decisão foi a ação clicada no
    // corpo. A busca é DENTRO do rodapé porque o X do canto também se chama
    // "Fechar" — no painel inteiro haveria dois.
    const footer = panel.querySelector<HTMLElement>('[data-slot="sheet-footer"]');
    await expect(footer).not.toBeNull();
    await expect(within(footer!).getAllByRole('button')).toHaveLength(1);
    await expect(within(footer!).getByRole('button', { name: 'Fechar' })).toBeVisible();
  },
};
