import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import PopoverStory from './PopoverStory.svelte';
import PopoverDocs from '@/components/docs/PopoverDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { panel } from './popover.fixtures';
import { popoverSource } from './popover.source';

const meta: Meta = {
  title: 'UI/Popover',
  component: PopoverStory,
  tags: ['autodocs', 'overlay'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(PopoverDocs),
      // Cascateia para todas as stories do arquivo, e monta a composição a
      // partir dos `args` de cada uma.
      source: { transform: popoverSource },
      description: {
        component:
          'Overlay flutuante ativado por clique, com auto-flip por colisão, role=dialog e foco gerenciado. Sempre forneça PopoverTitle para acessibilidade.',
      },
    },
  },
  // O docgen está desligado neste stack: `argTypes` é a ÚNICA fonte da aba
  // API Reference, e arg sem entrada aqui fica invisível para quem consome.
  argTypes: {
    side: {
      control: 'inline-radio',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Lado preferido do Content em relação ao trigger.',
      table: { type: { summary: '"top" | "bottom" | "left" | "right"' }, defaultValue: { summary: '"bottom"' } },
    },
    align: {
      control: 'inline-radio',
      options: ['start', 'center', 'end'],
      description: 'Alinhamento do Content ao longo do eixo do side.',
      table: { type: { summary: '"start" | "center" | "end"' }, defaultValue: { summary: '"center"' } },
    },
    sideOffset: {
      control: { type: 'number', min: 0, step: 1 },
      description: 'Distância em pixels entre trigger e Content.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '4' } },
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial em modo não-controlado.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    triggerLabel: {
      control: 'text',
      description: 'Texto exibido no trigger. Verbo e objeto — nunca "Clique aqui".',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'Abrir popover' } },
    },
    title: {
      control: 'text',
      description: 'Título do painel. Vira o nome acessível do diálogo.',
      table: { type: { summary: 'string' } },
    },
    description: {
      control: 'text',
      description: 'Descrição abaixo do título, ligada por aria-describedby.',
      table: { type: { summary: 'string' } },
    },
    saveLabel: {
      control: 'text',
      description: 'Texto do botão de confirmação da demonstração.',
      table: { type: { summary: 'string' } },
    },
    cancelLabel: {
      control: 'text',
      description: 'Texto do botão que fecha o painel por dentro.',
      table: { type: { summary: 'string' } },
    },
    variant: {
      control: 'select',
      options: ['default', 'withTitle', 'form', 'tableFilter', 'colorPicker', 'quickSettings'],
      description: 'Composição interna usada na demonstração.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"default"' } },
    },
    onAction: {
      control: false,
      description: 'Callback do botão de confirmação.',
      table: { type: { summary: '() => void' } },
    },
    onCancel: {
      control: false,
      description: 'Callback do botão que fecha o painel por dentro.',
      table: { type: { summary: '() => void' } },
    },
  },
  args: {
    side: 'bottom',
    align: 'center',
    sideOffset: 4,
    defaultOpen: false,
    triggerLabel: 'Abrir popover',
    title: 'Configuracoes de exibição',
    description: 'Ajuste a aparência do conteúdo da página.',
    saveLabel: 'Salvar',
    cancelLabel: 'Cancelar',
    variant: 'withTitle',
    onAction: fn(),
    onCancel: fn(),
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3',
      'accessibility.item4',
    ],
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: /Abrir popover/i });

    const closed = async () => {
      await waitFor(
        () => {
          const dialog = body.queryByRole('dialog');
          if (dialog && dialog.getAttribute('data-state') !== 'closed') {
            throw new Error('popover still open');
          }
        },
        { timeout: 2000 }
      );
    };

    const open = async () => {
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      return await waitForPortal('dialog');
    };

    const close = async () => {
      if (trigger.getAttribute('aria-expanded') === 'true') await userEvent.click(trigger);
      await closed();
    };

    await step('1. O gatilho anuncia que abre um diálogo', async () => {
      await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      await expect(trigger).toHaveAttribute('data-slot', 'popover-trigger');
    });

    await step('2. Clicar no gatilho abre o painel com role=dialog', async () => {
      await close();
      const p = await open();
      await expect(p).toBeVisible();
      await expect(p).toHaveClass(/nds-popover-content/);
      await expect(p).toHaveAccessibleName(/Configuracoes de exibição/i);
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('3. O painel não é modal', async () => {
      // Popover não bloqueia o resto da página: `aria-modal` faria o leitor de
      // tela esconder tudo o que está fora dele, que é contrato de Dialog.
      await expect(panel()).not.toHaveAttribute('aria-modal');
    });

    await step('4. O foco entra no painel ao abrir', async () => {
      await waitFor(() => {
        if (!panel()!.contains(document.activeElement)) {
          throw new Error('foco não entrou no painel');
        }
      });
    });

    await step('5. Escape fecha o popover e retorna foco ao trigger', async () => {
      await open();
      await userEvent.keyboard('{Escape}');
      await closed();
      await waitFor(() => {
        if (document.activeElement !== trigger) {
          throw new Error('focus did not return to trigger');
        }
      });
    });

    await step('6. Clicar fora fecha o painel', async () => {
      await open();
      // O clique de fora é REEMITIDO até a dispensa acontecer. A camada de
      // dispensa da lib só passa a escutar `pointerdown` um tick depois de o
      // painel montar (`afterSleep(1)` + `debounce(10)` na fonte), e o
      // `waitForPortal` pode retornar dentro dessa janela — um clique único
      // caía no vazio em ~1 de 3 execuções, sem erro nenhum. Reemitir mede o
      // COMPORTAMENTO ("clicar fora fecha") sem depender do instante do clique.
      await waitFor(
        async () => {
          if (!body.queryByRole('dialog')) return;
          await userEvent.click(canvas.getByTestId('area-externa'));
          throw new Error('popover still open');
        },
        { timeout: 3000, interval: 100 }
      );
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('7. Cancelar (PopoverClose) fecha o painel por dentro', async () => {
      await open();
      const cancelar = body.getByRole('button', { name: args.cancelLabel as string });
      await expect(cancelar).toHaveAttribute('data-slot', 'popover-close');
      await userEvent.click(cancelar);
      await closed();
      await expect(args.onCancel).toHaveBeenCalled();
    });

    // A story termina ABERTA: é o estado que o axe varre e o Chromatic fotografa.
    await step('8. Estado final: painel aberto', async () => {
      await expect(await open()).toBeVisible();
    });
  },
};
