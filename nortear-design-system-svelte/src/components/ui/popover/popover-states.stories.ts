import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import PopoverStory from './PopoverStory.svelte';
import { panel } from './popover.fixtures';
import { popoverSource } from './popover.source';

const meta: Meta = {
  title: 'Primitives/Overlay/Popover/States',
  component: PopoverStory,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo: o estado aberto, o lado e o
      // deslocamento saem dos `args` de cada uma.
      source: { transform: popoverSource },
      description: {
        component:
          'Estados do Popover: fechado (painel fora do DOM), aberto e controlado por estado externo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Um `Tab` de teclado, DESPACHADO À MÃO.
 *
 * Nem `userEvent.tab()` nem `userEvent.keyboard('{Tab}')` servem para medir um
 * laço de tabulação, e não é questão de preferência: os dois MOVEM O FOCO
 * primeiro e só então anunciam a tecla. Medido em 2026-09-03, com um ouvinte de
 * `keydown` em fase de CAPTURA na story `Modal`: no instante do `keydown`, o
 * `document.activeElement` já era o próximo elemento — e o alvo do evento
 * também.
 *
 * Um laço é implementado no `keydown`, e a condição dele é `activeElement ===
 * último`. Com o foco já movido, essa condição é falsa quando o laço roda: ele
 * nunca dispara, o foco segue para fora do painel, a camada de foco da lib o
 * puxa de volta para onde estava, e a asserção lê "não saiu do lugar" — que
 * parece defeito do componente e não é. Nenhum laço, de nenhuma stack, pode ser
 * medido por aqueles dois instrumentos.
 *
 * Despachar a tecla reproduz a ordem do teclado real — `keydown` primeiro,
 * movimento do foco depois —, e é justamente o movimento que o laço substitui.
 * Mesma saída que o gesto de arraste do drawer já usa neste repositório, e pelo
 * mesmo motivo: quando o atalho do runner não reproduz a sequência real,
 * despacha-se o evento.
 */
function pressTab(shift = false): void {
  document.activeElement?.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: shift,
      bubbles: true,
      cancelable: true,
    }),
  );
}

export const Closed: Story = {
  name: 'Closed',
  parameters: {
    docs: { description: { story: 'Estado inicial — apenas o trigger é visível, Content não renderizado.' } },
  },
  args: {
    defaultOpen: false,
    variant: 'withTitle',
    triggerLabel: 'Abrir popover',
    title: 'Configuracoes de exibição',
    description: 'Ajuste a aparência do conteúdo da página.',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Abrir popover/i });

    await step('Fechado, o painel não existe no DOM', async () => {
      // Desmontado, e não escondido: leitor de tela e busca do navegador não
      // encontram conteúdo que não está lá.
      await expect(trigger).toBeVisible();
      await expect(panel()).toBeNull();
    });

    await step('E o gatilho declara o estado fechado', async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toHaveAttribute('data-state', 'closed');
    });
  },
};

export const Open: Story = {
  name: 'Open (defaultOpen)',
  parameters: {
    // Story SEM interação de fechamento: termina aberta de propósito, porque é
    // este estado que o axe varre (ARIA e contraste do painel) e que o
    // Chromatic fotografa.
    covers: ['accessibility.item1', 'accessibility.item2'],
    docs: { description: { story: 'Popover aberto. Captura visual no Chromatic.' } },
  },
  args: {
    defaultOpen: true,
    variant: 'withTitle',
    triggerLabel: 'Abrir popover',
    title: 'Configuracoes de exibição',
    description: 'Ajuste a aparência do conteúdo da página.',
    saveLabel: 'Salvar',
    cancelLabel: 'Cancelar',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Abrir popover/i });

    await step('O painel abre já na primeira renderização', async () => {
      const dialog = await waitForPortal('dialog', { timeout: 2000 });
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute('data-state', 'open');
    });

    await step('E o gatilho e o painel declaram o estado aberto', async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(trigger).toHaveAttribute('data-state', 'open');
      // O painel é anunciado como diálogo e nomeado pelo título que carrega —
      // os dois contratos que o conteúdo compartilhado descreve para o estado
      // aberto. `aria-controls` fica de fora aqui de propósito: neste stack a
      // lib não o emite quando o gatilho é composto por snippet `child`, e o
      // atributo NÃO está na lista de ARIA documentada (role, labelledby,
      // describedby, expanded). Registrado no relatório da rodada.
      await expect(panel()).toHaveAttribute('role', 'dialog');
      await expect(panel()).toHaveAccessibleName(/Configuracoes de exibição/i);
    });
  },
};

export const Controlled: Story = {
  name: 'Controlled (open prop)',
  parameters: {
    docs: {
      description: {
        story:
          'Abertura controlada externamente via `bind:open`. Escape fecha mesmo em modo controlado.',
      },
    },
  },
  args: {
    open: true,
    variant: 'withTitle',
    triggerLabel: 'Abrir via estado externo',
    title: 'Controlado pelo pai',
    description: 'Este popover é comandado por estado externo via bind:open.',
    saveLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    onAction: fn(),
    onCancel: fn(),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: /Abrir via estado externo/i });

    const closed = async () => {
      await waitFor(
        () => {
          const d = body.queryByRole('dialog');
          if (d && d.getAttribute('data-state') !== 'closed') throw new Error('still open');
        },
        { timeout: 2000 }
      );
    };
    const open = async () => {
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      return await waitForPortal('dialog', { timeout: 2000 });
    };

    await step('O estado externo abre o painel na montagem', async () => {
      const dialog = await open();
      await expect(dialog).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Escape fecha mesmo em modo controlado', async () => {
      await userEvent.keyboard('{Escape}');
      await closed();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    // Termina ABERTA: é o estado que o Chromatic fotografa.
    await step('Estado final: painel aberto', async () => {
      await expect(await open()).toBeVisible();
    });
  },
};

export const Modal: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Modo modal — o foco fica preso no painel, a rolagem da página trava e o painel se anuncia como diálogo modal. As três coisas andam juntas: anunciar inércia sem prender o foco engana quem navega por leitor de tela.',
      },
    },
  },
  args: {
    defaultOpen: true,
    modal: true,
    // `withTitle` traz DOIS focáveis no painel. Com um só, "o Tab do último
    // volta ao primeiro" seria verdade sem laço nenhum — primeiro e último
    // seriam o mesmo elemento, e a asserção nasceria sem dentes.
    variant: 'withTitle',
    triggerLabel: 'Abrir modal',
    title: 'Popover modal',
    description: 'O foco fica preso no painel enquanto ele está aberto.',
    saveLabel: 'Salvar',
    cancelLabel: 'Cancelar',
  },
  play: async ({ step }) => {
    await step('O painel abre em modo modal', async () => {
      const dialog = await waitForPortal('dialog', { timeout: 2000 });
      await expect(dialog).toBeVisible();
    });

    await step('O painel anuncia aria-modal', async () => {
      // Tem dentes nos DOIS sentidos: reprova se alguém anunciar `aria-modal`
      // sem prender o foco e reprova se o modo modal deixar de anunciar.
      await expect(panel()).toHaveAttribute('aria-modal', 'true');
    });

    await step('Tab a partir do último focável NÃO sai do painel', async () => {
      // ─── A asserção com CONTROLE NEGATIVO ───────────────────────────────
      //
      // Provar a prisão com `dialog.contains(document.activeElement)` SEM
      // tabular não mede nada: o foco está dentro do painel no modo não-modal
      // também, em todas as stacks — é o contrato `functional.item1`. Essa
      // asserção não pode reprovar, e é a forma exata da asserção que guarda o
      // bug; foi encontrada assim em duas stacks desta família.
      //
      // O controle negativo de verdade é este: partir do ÚLTIMO focável e
      // apertar Tab. Não-modal, o foco SAI do painel e esta asserção reprova;
      // modal, ele volta ao primeiro.
      //
      // O instrumento é o `pressTab` deste arquivo, e o docblock dele explica
      // por que `userEvent.tab()` e `userEvent.keyboard('{Tab}')` não podem medir
      // um laço de tabulação. Esta story nasceu com `tab()` e nunca tinha sido
      // executada, então o instrumento errado nunca tinha aparecido.
      const dialog = panel()!;
      const inside = within(dialog);
      const cancel = inside.getByRole('button', { name: /Cancelar/i });
      const save = inside.getByRole('button', { name: /Salvar/i });

      save.focus();
      await expect(save).toHaveFocus();

      pressTab();

      await expect(dialog.contains(document.activeElement)).toBe(true);
      await expect(cancel).toHaveFocus();
    });

    await step('E Shift+Tab a partir do primeiro volta ao último', async () => {
      const dialog = panel()!;
      const inside = within(dialog);
      const cancel = inside.getByRole('button', { name: /Cancelar/i });
      const save = inside.getByRole('button', { name: /Salvar/i });

      cancel.focus();
      // Mesmo instrumento e mesmo motivo do passo anterior.
      pressTab(true);

      await expect(dialog.contains(document.activeElement)).toBe(true);
      await expect(save).toHaveFocus();
    });
  },
};
