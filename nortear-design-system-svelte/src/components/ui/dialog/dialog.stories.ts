import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import { Dialog } from './index';
import DialogStory from './DialogStory.svelte';
import DialogDocs from '@/components/docs/DialogDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { dialogSource } from './dialog.source';
import {
  abrir,
  cantoButtonClose,
  checkFocusTrap,
  checkNameEDescricao,
  waitForClosed,
  fechar,
  gatilho,
  overlay,
  painel,
} from './dialog.fixtures';

const meta: Meta = {
  title: 'UI/Dialog',
  component: Dialog,
  tags: ['autodocs', 'overlay'],
  parameters: {
    docs: {
      page: withAutoDocsTab(DialogDocs),
      source: { transform: dialogSource },
    },
  },
  argTypes: {
    open: {
      control: 'boolean',
      description:
        'Estado de abertura. A lib desta stack não tem `defaultOpen`: o valor inicial entra pelo mesmo estado bindável.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    showCloseButton: {
      control: 'boolean',
      description: 'Botão X no canto superior direito do painel.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    triggerLabel: {
      control: 'text',
      description: 'Texto do gatilho. Deve nomear a ação e o objeto, nunca "Abrir".',
      table: { type: { summary: 'string' } },
    },
    onAction: {
      control: false,
      description: 'Chamado ao confirmar a ação primária.',
      table: { type: { summary: '() => void' } },
    },
    onCancel: {
      control: false,
      description: 'Chamado ao cancelar pelo rodapé.',
      table: { type: { summary: '() => void' } },
    },
  },
  args: {
    open: false,
    showCloseButton: true,
    triggerLabel: 'Editar perfil',
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
      'functional.item4', 'functional.item5', 'functional.item6',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
      'accessibility.item4', 'accessibility.item5', 'accessibility.item6',
      'visual.item1',
    ],
  },
  render: (args) => ({
    Component: DialogStory,
    props: { ...args, variant: 'default' },
  }),
  play: async ({ canvasElement, step, args }) => {
    // Pelo contrato de markup e não por papel: enquanto o diálogo está aberto o
    // resto da página fica inerte, e uma consulta por papel depende de como a
    // biblioteca de teste trata `inert`.
    const trigger = gatilho(canvasElement)!;
    const spyCancelar = args.onCancel as unknown as ReturnType<typeof fn>;

    await step('O markup é o mesmo das outras stacks', async () => {
      // O Vanilla é a referência: o gatilho é um `<button>` de verdade, e
      // `type="button"` porque dentro de um `<form>` o submit herdado faria
      // abrir o diálogo enviar o formulário.
      await expect(trigger.tagName).toBe('BUTTON');
      await expect(trigger).toHaveAttribute('type', 'button');
      await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    });

    await step('Fechado, nada do conteúdo existe no DOM', async () => {
      // `fechar()` e não uma leitura do estado de montagem: a story termina
      // ABERTA (último passo), então na segunda rodada do painel Interactions o
      // painel já estaria montado. Quem verifica o estado fechado NA MONTAGEM é
      // a story `Closed`, que não interage com nada.
      await fechar();
      await expect(painel()).toBeNull();
      await expect(overlay()).toBeNull();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Clicar no gatilho abre o diálogo com overlay', async () => {
      const p = await abrir(canvasElement);
      await expect(p).toBeVisible();
      await expect(overlay()).toBeInTheDocument();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('O painel se anuncia como diálogo modal, com nome e descrição', async () => {
      const p = painel()!;
      await expect(p).toHaveAttribute('role', 'dialog');
      await expect(p).toHaveAttribute('aria-modal', 'true');
      await checkNameEDescricao(p);
    });

    await step('O foco entra no painel ao abrir', async () => {
      const p = painel()!;
      await waitFor(async () => {
        await expect(p.contains(document.activeElement)).toBe(true);
      });
    });

    await step('Tab não sai do painel', async () => {
      await checkFocusTrap(painel()!);
    });

    await step('Escape fecha e devolve o foco ao gatilho', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForClosed();
      await waitFor(async () => {
        await expect(document.activeElement).toBe(trigger);
      });
    });

    await step('Clique no overlay fecha e devolve o foco', async () => {
      await abrir(canvasElement);
      // `userEvent.click` e não `.click()` cru: o primitivo desta stack dispensa
      // no `pointerdown` de fora, e o `.click()` programático dispara só o
      // evento de clique — o diálogo continuava aberto.
      await userEvent.click(overlay()!);
      await waitForClosed();
      await waitFor(async () => {
        await expect(document.activeElement).toBe(trigger);
      });
    });

    await step('O botão X fecha, tem nome acessível e devolve o foco', async () => {
      const p = await abrir(canvasElement);
      const x = cantoButtonClose(p)!;
      await expect(x).toHaveAccessibleName();
      await userEvent.click(x);
      await waitForClosed();
      await waitFor(async () => {
        await expect(document.activeElement).toBe(trigger);
      });
    });

    await step('O Cancelar do rodapé fecha e avisa o callback', async () => {
      const p = await abrir(canvasElement);
      const callsBefore = spyCancelar.mock.calls.length;
      const rodape = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      // A ação primária é a última do DOM; o Cancelar é a primeira.
      const botoes = rodape.querySelectorAll<HTMLElement>('button');
      await userEvent.click(botoes[0]);
      await waitForClosed();
      await expect(spyCancelar.mock.calls.length).toBe(callsBefore + 1);
      await waitFor(async () => {
        await expect(document.activeElement).toBe(trigger);
      });
    });

    await step('A story termina aberta', async () => {
      // O Chromatic fotografa o ESTADO FINAL e o axe do test-runner roda depois
      // da play: terminar fechada faria a captura mostrar só o gatilho e a
      // varredura de acessibilidade medir uma página sem diálogo nenhum — o
      // conteúdo compartilhado declara os dois sobre o estado ABERTO
      // (`visual.item1`, `accessibility.item6`).
      const p = await abrir(canvasElement);
      await expect(p).toBeVisible();
      await expect(within(p).getAllByRole('button').length).toBeGreaterThan(0);
    });
  },
};
