import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal } from '@/lib/wait-for-portal';

import { expect, within } from 'storybook/test';
import SheetStory from './SheetStory.svelte';
import {
  sheetEdicaoDePerfilSource,
  sheetFiltrosAvancadosSource,
  sheetSource,
  sheetTermosComRolagemSource,
} from './sheet.source';

const meta: Meta = {
  title: 'UI/Sheet/Compositions',
  component: SheetStory,
  tags: ['disclosure'],
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
          'perfil e termos com rolagem interna. Renderizadas abertas para a captura visual.',
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
      source: { transform: sheetFiltrosAvancadosSource },
      description: {
        story:
          'Painel lateral direito com formulário de filtros. O rodapé mantém a saída e a ' +
          'ação primária alinhadas à direita.',
      },
    },
  },
  play: async () => {
    const painel = await waitForPortal('dialog');
    await expect(painel).toBeVisible();
    await expect(painel).toHaveAttribute('aria-modal', 'true');
    await expect(painel).toHaveAccessibleName(/Filtros avançados/i);
    await expect(within(painel).getByLabelText(/Nome/i)).toBeVisible();
  },
};

export const ProfileEdit: Story = {
  args: {
    open: true,
    side: 'right',
    variant: 'withForm',
    triggerLabel: 'Editar perfil',
    title: 'Editar perfil',
    description: 'Atualize seu nome e e-mail. As mudanças são salvas ao confirmar.',
    actionLabel: 'Salvar alterações',
    cancelLabel: 'Cancelar',
  },
  parameters: {
    docs: {
      source: { transform: sheetEdicaoDePerfilSource },
      description: {
        story:
          'Edição de perfil em painel lateral. Os campos participam do foco preso; Escape ' +
          'ou a saída do rodapé fecham sem salvar.',
      },
    },
  },
  play: async () => {
    const painel = await waitForPortal('dialog');
    await expect(painel).toBeVisible();
    await expect(painel).toHaveAttribute('aria-modal', 'true');
    await expect(painel).toHaveAccessibleName(/Editar perfil/i);
  },
};

export const TermsWithScroll: Story = {
  args: {
    open: true,
    side: 'right',
    variant: 'withScrollContent',
    triggerLabel: 'Ver termos',
    title: 'Termos e condições',
    description: 'Leia atentamente antes de aceitar.',
    actionLabel: 'Aceitar',
    cancelLabel: 'Recusar',
  },
  parameters: {
    covers: ['visual.item4'],
    docs: {
      source: { transform: sheetTermosComRolagemSource },
      description: {
        story:
          'Corpo mais alto que o painel. O corpo rola sozinho e o rodapé continua visível — ' +
          "é o que separa 'conteúdo longo' de 'ação fora de alcance'.",
      },
    },
  },
  play: async ({ step }) => {
    const painel = await waitForPortal('dialog');
    const corpo = painel.querySelector<HTMLElement>('[data-slot="sheet-body"]')!;
    const rodape = painel.querySelector<HTMLElement>('[data-slot="sheet-footer"]')!;

    await step('O corpo é quem rola, não o painel', async () => {
      await expect(corpo).not.toBeNull();
      await expect(corpo.scrollHeight).toBeGreaterThan(corpo.clientHeight);
      // O painel em si não rola: o `flex` do corpo é o que segura o rodapé.
      await expect(painel.scrollHeight).toBeLessThanOrEqual(painel.clientHeight + 1);
    });

    await step('A região rolável é alcançável por teclado', async () => {
      // WCAG 2.1.1 — sem o tabindex quem navega por teclado não consegue rolar
      // o corpo (é a regra scrollable-region-focusable do axe).
      await expect(corpo).toHaveAttribute('tabindex', '0');
    });

    await step('O rodapé continua visível com o corpo cheio', async () => {
      const caixaRodape = rodape.getBoundingClientRect();
      const caixaPainel = painel.getBoundingClientRect();
      await expect(caixaRodape.bottom).toBeLessThanOrEqual(caixaPainel.bottom + 1);
      await expect(caixaRodape.height).toBeGreaterThan(0);
    });
  },
};
