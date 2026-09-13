import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';

import { within, expect, userEvent, waitFor, fn } from 'storybook/test';
import PopoverStory from './PopoverStory.svelte';
import { panel } from './popover.fixtures';
import { popoverSource } from './popover.source';

import { figmaDesign } from '@shared/figma/design-links';
// As quatro composições que o conteúdo compartilhado descreve — editar perfil,
// filtro de tabela, seletor de cor e configurações rápidas. Nenhuma acrescenta
// API: todas são arranjo de conteúdo dentro do mesmo `PopoverContent`.

const meta: Meta = {
  title: 'Components/Overlay/Popover/Compositions',
  component: PopoverStory,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('popover'),
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo: cada composição é um valor
      // de `args`, e a transform monta o arranjo interno correspondente.
      source: { transform: popoverSource },
      description: {
        component:
          'Formulário curto, filtros combináveis, paleta restrita e preferências booleanas. Todo gatilho nomeia a ação e o objeto — nunca "Mais" ou "Clique aqui". O lado de abertura entra aqui pelo mesmo motivo: é arranjo do painel, não estado dele.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Espera o foco automático da abertura assentar dentro do painel.
 *
 * A lib move o foco para o primeiro tabulável um quadro depois de o painel
 * aparecer. Mexer no foco antes disso disputa com o próprio componente: a
 * chamada da play é desfeita e a ordem de tabulação medida sai errada.
 */
async function waitForFocus(dialog: HTMLElement): Promise<void> {
  await waitFor(() => {
    if (!dialog.contains(document.activeElement)) {
      throw new Error('foco ainda não entrou no painel');
    }
  });
}

export const EditProfile: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Caso clássico — formulário curto inline com Nome + Email + Atualizar.',
      },
    },
  },
  args: {
    open: true,
    variant: 'form',
    triggerLabel: 'Editar perfil',
    title: 'Editar perfil',
    description: 'Altere o nome e o email da conta.',
    nameLabel: 'Nome',
    emailLabel: 'Email',
    submitLabel: 'Atualizar',
    cancelLabel: 'Cancelar',
    onAction: fn(),
    onCancel: fn(),
  },
  play: async ({ step }) => {
    await step('O formulário abre preenchido e pronto para edição', async () => {
      const dialog = await waitForPortal('dialog', { timeout: 2000 });
      // Escopo no diálogo: o rótulo do gatilho e o título são o mesmo texto, e
      // desde que o painel ganhou nome acessível a busca solta casava com os dois.
      await expect(dialog).toHaveAccessibleName('Editar perfil');
      const ctx = within(dialog);
      await expect(ctx.getByLabelText(/Nome/i)).toHaveValue('Ana Ribeiro');
      await expect(ctx.getByLabelText(/Email/i)).toHaveValue('ana@nortear.com.br');
    });
  },
};

export const TableFilter: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Filtros contextuais de uma listagem — status combináveis e o par Limpar / Aplicar ao final.',
      },
    },
  },
  args: {
    open: true,
    variant: 'tableFilter',
    triggerLabel: 'Filtros',
    title: 'Filtrar por status',
    description: 'Combine quantos status quiser na listagem.',
    onAction: fn(),
  },
  play: async ({ step }) => {
    await step('Os três status são combináveis', async () => {
      const dialog = await waitForPortal('dialog', { timeout: 2000 });
      const ctx = within(dialog);
      await expect(ctx.getAllByRole('checkbox')).toHaveLength(3);
      await expect(ctx.getByLabelText(/Ativo/i)).toBeChecked();
    });

    await step('E marcar outro não fecha o painel', async () => {
      // Filtro é escolha múltipla: fechar no primeiro clique obrigaria a
      // reabrir para cada critério.
      const pendente = within(panel()!).getByLabelText(/Pendente/i) as HTMLInputElement;
      if (!pendente.checked) await userEvent.click(pendente);
      await expect(pendente).toBeChecked();
      await expect(panel()).toBeInTheDocument();
    });
  },
};

export const ColorPicker: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Paleta restrita em grid — cada amostra tem nome acessível próprio.',
      },
    },
  },
  args: {
    open: true,
    variant: 'colorPicker',
    triggerLabel: 'Escolher cor da etiqueta',
    title: 'Cor da etiqueta',
    description: 'Escolha uma cor da paleta do tema.',
  },
  play: async ({ step }) => {
    await step('Cada amostra tem nome acessível próprio', async () => {
      // A cor não é o nome: quem não distingue a cor precisa do rótulo, e sem
      // ele o axe reprova por button-name.
      const dialog = await waitForPortal('dialog', { timeout: 2000 });
      await waitForFocus(dialog);
      const names = within(dialog)
        .getAllByRole('button')
        .map((b) => b.getAttribute('aria-label'))
        .filter((n): n is string => n !== null);
      await expect(names).toHaveLength(6);
      await expect(new Set(names).size).toBe(6);
    });

    await step('E o foco chega a cada uma por Tab', async () => {
      const ctx = within(panel()!);
      const first = ctx.getByRole('button', { name: 'Primária' });
      const segunda = ctx.getByRole('button', { name: 'Secundária' });
      first.focus();
      await userEvent.tab();
      await expect(segunda).toHaveFocus();
    });
  },
};

export const QuickSettings: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Preferências booleanas independentes — alternativa leve ao Dialog para ajustes rápidos.',
      },
    },
  },
  args: {
    open: true,
    variant: 'quickSettings',
    triggerLabel: 'Configurações rápidas',
    title: 'Preferências',
    description: 'Cada linha vale por si — nada aqui depende do resto.',
  },
  play: async ({ step }) => {
    await step('As preferências são independentes entre si', async () => {
      const dialog = await waitForPortal('dialog', { timeout: 2000 });
      const ctx = within(dialog);
      const notificacoes = ctx.getByLabelText(/Notificações/i) as HTMLInputElement;
      const escuro = ctx.getByLabelText(/Modo escuro/i) as HTMLInputElement;

      // Ponto de partida conhecido antes de medir — no replay o painel chega
      // com o que a rodada anterior deixou.
      if (!notificacoes.checked) await userEvent.click(notificacoes);
      if (escuro.checked) await userEvent.click(escuro);
      await expect(notificacoes).toBeChecked();
      await expect(escuro).not.toBeChecked();

      await userEvent.click(escuro);
      await expect(escuro).toBeChecked();
      // A que já estava marcada não se mexe: são preferências, não um grupo de
      // escolha única.
      await expect(notificacoes).toBeChecked();
    });
  },
};

export const SideTop: Story = {
  name: 'Side top (auto-flip)',
  parameters: {
    covers: ['visual.item4'],
    // `padded` e não o `centered` do meta: com o conteúdo centrado na vertical,
    // o espaço acima do gatilho é metade do que SOBRA do viewport, e some ou
    // reaparece conforme a altura da janela. O passo que exige a virada mediria
    // o tamanho da tela, não o auto-flip. Ancorado ao topo, o segundo caso não
    // tem espaço acima em janela nenhuma.
    layout: 'padded',
    docs: {
      description: {
        story:
          'Posicionamento preferido `side="top"`. Se não houver espaço, o popover faz auto-flip para outra direção.',
      },
    },
  },
  args: {
    defaultOpen: true,
    side: 'top',
    sideOffset: 12,
    // A folga acima é um IRMÃO inerte do popover — ver a prop no PopoverStory.
    spaceAbove: true,
    variant: 'withTitle',
    triggerLabel: 'Abrir acima',
    title: 'Ancorado acima',
    description: 'Sem espaço acima, o painel vira para baixo sozinho.',
    saveLabel: 'Salvar',
    cancelLabel: 'Cancelar',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Abrir acima/i });
    const spacer = () => canvasElement.querySelector<HTMLElement>('.nds-min-h-60')!;

    /**
     * Fecha e reabre o painel, para que a lib recalcule a colisão com a folga
     * que existe AGORA. Reabrir é o ponto: a posição é decidida na abertura.
     */
    async function reopen(): Promise<void> {
      if (trigger.getAttribute('aria-expanded') === 'true') {
        await userEvent.click(trigger);
        await waitForPortalGone('dialog');
      }
      await userEvent.click(trigger);
      await waitForPortal('dialog', { timeout: 2000 });
    }

    /**
     * Exige o lado NO ATRIBUTO e na GEOMETRIA — atributo que muda sozinho seria
     * markup mentindo sobre onde o painel ficou.
     *
     * Só leitura pura aqui dentro: `waitFor` reagenda por mutação, e uma sonda
     * que escrevesse no DOM provocaria a própria tentativa seguinte até a aba
     * morrer sem reprovar. O laço existe porque o posicionador da lib nasce com
     * um transform de reserva e só assenta num quadro seguinte.
     */
    async function expectSide(side: 'top' | 'bottom'): Promise<void> {
      await waitFor(() => {
        const dialog = panel();
        expect(dialog).not.toBeNull();
        expect(dialog!.getAttribute('data-side')).toBe(side);
        const rt = trigger.getBoundingClientRect();
        const rp = dialog!.getBoundingClientRect();
        // 12px pedidos, com 1px de folga para arredondamento sub-pixel.
        const distancia = side === 'top' ? rt.top - rp.bottom : rp.top - rt.bottom;
        expect(Math.abs(distancia - 12)).toBeLessThanOrEqual(1);
      }, { timeout: 2000 });
    }

    await step('Com espaço acima, o painel abre EXATAMENTE no lado pedido', async () => {
      // Precondição própria: no replay o irmão pode ter ficado escondido.
      spacer().style.display = '';
      await reopen();
      await expectSide('top');
    });

    await step('E continua alinhado ao gatilho no outro eixo', async () => {
      const rt = trigger.getBoundingClientRect();
      const rp = panel()!.getBoundingClientRect();
      await expect(
        Math.abs(rt.left + rt.width / 2 - (rp.left + rp.width / 2)),
      ).toBeLessThanOrEqual(2);
    });

    // ─── O contrato C9, que esta story afirmava e não media ──────────────────
    //
    // A asserção anterior era `expect(['top','bottom']).toContain(data-side)`:
    // aceitava os dois lados, então passava com ou sem auto-flip. E o passo do
    // offset LIA o `data-side` para escolher de que lado medir, ou seja, se
    // adaptava a qualquer resultado. Este passo tira o espaço, o painel deixa
    // de caber acima, e o lado tem de virar.
    await step('Sem espaço acima, o painel VIRA para baixo e o markup acompanha', async () => {
      spacer().style.display = 'none';
      try {
        await reopen();
        await expectSide('bottom');
      } finally {
        spacer().style.display = '';
      }
    });

    // Termina ABERTA e no lado pedido: é o estado que o Chromatic fotografa, e
    // é o estado em que o próximo replay encontra a story.
    await step('Estado final: de volta ao lado pedido', async () => {
      await reopen();
      await expectSide('top');
    });
  },
};
