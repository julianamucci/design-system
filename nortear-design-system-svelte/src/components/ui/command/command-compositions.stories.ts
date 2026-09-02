import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, waitFor, expect, fn, screen } from 'storybook/test';
import { Root as Command } from '@/components/ui/command';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import CommandComposicaoShortcutsStory from './CommandComposicaoShortcutsStory.svelte';
import CommandComposicaoLinkItemStory from './CommandComposicaoLinkItemStory.svelte';
import CommandComposicaoPaletteStory from './CommandComposicaoPaletteStory.svelte';
import {
  commandWithShortcutsSource,
  commandWithLinkItemSource,
  commandPaletteSource,
  commandSource,
} from './command.source';

// Espiões de escopo de MÓDULO: dentro do `render` seriam inalcançáveis pela
// play, e a aba Actions nasceria vazia.
const aoRodarComando = fn();

const meta: Meta = {
  title: 'Primitives/Overlay/Command/Compositions',
  component: Command,
  tags: ['overlay'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com a
      // sua própria composição logo abaixo.
      source: { transform: commandSource },
      description: {
        component:
          'Padrões de composição do Command: com atalhos, com CommandLinkItem e dentro de ' +
          'um Dialog (command palette). A paleta em si não flutua — quem flutua é o ' +
          'Dialog, que já existe no sistema. A lista dividida em grupos é VARIANTE ' +
          '(variants.items.withGroups) e mora em Variants.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Com atalhos ──────────────────────────────────────────────────────────────

export const WithShortcuts: Story = {
  parameters: {
    docs: { source: { transform: commandWithShortcutsSource } },
  },
  render: () => ({
    Component: CommandComposicaoShortcutsStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');

    await userEvent.clear(field);
    await waitFor(async () => {
      await expect(canvas.getAllByRole('option')).toHaveLength(6);
    });

    const newFile = canvas.getByRole('option', { name: /Novo arquivo/ });

    await step('O atalho faz parte do nome do comando', async () => {
      // Sem isso o leitor anunciaria "Novo arquivo" e a pessoa nunca saberia
      // que existe uma tecla — o atalho é informação, não decoração.
      await expect(newFile).toHaveAccessibleName(/Ctrl\+N/);
      const atalho = newFile.querySelector<HTMLElement>('[data-slot="command-shortcut"]')!;
      await expect(atalho.getAttribute('aria-hidden')).toBeNull();
      await expect(atalho).toHaveClass(/nds-command-shortcut/);
    });

    await step('O atalho fica encostado à direita do comando', async () => {
      const atalho = newFile.querySelector<HTMLElement>('[data-slot="command-shortcut"]')!;
      const boxItem = newFile.getBoundingClientRect();
      const boxShortcut = atalho.getBoundingClientRect();
      await expect(boxItem.right - boxShortcut.right).toBeLessThan(
        boxShortcut.left - boxItem.left,
      );
    });

    await step('O atalho não entra no filtro', async () => {
      // Quem busca "Ctrl" está procurando a tecla, não o comando: o filtro roda
      // sobre o `value`, e nenhum deles carrega o texto do atalho.
      await userEvent.type(field, 'Ctrl');
      await waitFor(async () => {
        await expect(canvas.queryByRole('option', { name: /Novo arquivo/ })).toBeNull();
      });
      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(6);
      });
    });
  },
};

// ─── Com CommandLinkItem ──────────────────────────────────────────────────────

export const WithLinkItem: Story = {
  name: 'With CommandLinkItem',
  parameters: {
    docs: { source: { transform: commandWithLinkItemSource } },
  },
  render: () => ({
    Component: CommandComposicaoLinkItemStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');

    await userEvent.clear(field);
    await waitFor(async () => {
      await expect(canvas.getAllByRole('option')).toHaveLength(3);
    });

    await step('O comando de link é uma âncora de verdade', async () => {
      const docs = canvas.getByRole('option', { name: /Button — Docs/ });
      await expect(docs.tagName).toBe('A');
      await expect(docs).toHaveAttribute('href', '/docs/button');
      await expect(docs).toHaveClass(/nds-command-item/);
      await expect(docs).toHaveAttribute('data-slot', 'command-item');
    });

    await step('Link externo abre em outra aba sem entregar a janela', async () => {
      const github = canvas.getByRole('option', { name: /GitHub/ });
      await expect(github).toHaveAttribute('target', '_blank');
      await expect(github).toHaveAttribute('rel', 'noopener noreferrer');
    });

    await step('Os ícones não entram no nome do comando', async () => {
      const docs = canvas.getByRole('option', { name: /Button — Docs/ });
      await expect(docs).toHaveAccessibleName('Button — Docs');
      for (const svg of docs.querySelectorAll('svg')) {
        await expect(svg).toHaveAttribute('aria-hidden', 'true');
      }
    });

    await step('O ícone de saída fica encostado à direita', async () => {
      // Por geometria, não por classe: `ml-auto` (que morava aqui) não existe no
      // CSS e empurrava coisa nenhuma — a asserção precisa cair se a classe
      // certa sair de novo.
      const docs = canvas.getByRole('option', { name: /Button — Docs/ });
      const saida = docs.querySelector<HTMLElement>('.nds-spacer-start')!;
      const boxItem = docs.getBoundingClientRect();
      const boxOutput = saida.getBoundingClientRect();
      await expect(boxItem.right - boxOutput.right).toBeLessThan(
        boxOutput.left - boxItem.left,
      );
    });
  },
};

// ─── Command Palette (Command dentro de Dialog) ───────────────────────────────

export const CommandPalette: Story = {
  parameters: {
    covers: ['functional.item3', 'functional.item6', 'accessibility.item3', 'visual.item3'],
    docs: { source: { transform: commandPaletteSource } },
  },
  render: () => ({
    Component: CommandComposicaoPaletteStory,
    props: { onCommandRun: aoRodarComando },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    // O gatilho da paleta é um botão comum (o CommandDialog não expõe trigger),
    // então a idempotência se apoia na presença do painel, não em aria-expanded.
    const domPanel = () => document.querySelector('[data-slot="dialog-content"]');
    const close = async (): Promise<void> => {
      if (domPanel()) await userEvent.keyboard('{Escape}');
      await waitForPortalGone('dialog');
      // O portal sumir não basta: enquanto o diálogo é modal, a lib põe
      // `pointer-events: none` no `body` para tornar o resto da página inerte, e
      // devolve isso DEPOIS de remover o nó. Clicar no gatilho nesse intervalo
      // falha com "element has pointer-events: none" — que foi exatamente o que
      // reprovou aqui. A espera termina quando a página volta a aceitar ponteiro.
      await waitFor(() => {
        if (getComputedStyle(document.body).pointerEvents === 'none') {
          throw new Error('a página ainda está inerte pelo diálogo');
        }
      });
    };

    // Primeiro de tudo: a story TERMINA aberta, e com o diálogo modal montado o
    // resto da página fica inerte — uma consulta por papel no gatilho falharia
    // na segunda rodada do painel Interactions.
    await close();

    const trigger = canvas.getByRole('button', { name: /Buscar/ });
    const buttonOpen = async (): Promise<HTMLElement> => {
      if (!domPanel()) await userEvent.click(trigger);
      return await waitForPortal('dialog');
    };

    await step('A dica do atalho fica visível no gatilho', async () => {
      // Atalho escondido é atalho que ninguém descobre.
      const dica = trigger.querySelector<HTMLElement>('.nds-kbd')!;
      await expect(dica).toBeVisible();
      await expect(dica).toHaveTextContent('Ctrl+K');
      await expect(dica.tagName).toBe('KBD');
    });

    await step('O diálogo é nomeado por um título que só o leitor de tela vê', async () => {
      const panel = await buttonOpen();
      const idTitle = panel.getAttribute('aria-labelledby');
      await expect(idTitle).toBeTruthy();

      const title = document.getElementById(idTitle!)!;
      await expect(title).toHaveTextContent('Command Palette');
      // DENTRO do painel: fora dele o título ficava no fluxo da página o tempo
      // todo, mesmo com a paleta fechada.
      await expect(panel.contains(title)).toBe(true);
      const header = title.closest<HTMLElement>('[data-slot="dialog-header"]')!;
      await expect(header).toHaveClass(/nds-sr-only/);
      // Fora da tela, mas dentro da árvore de acessibilidade: `display: none`
      // apagaria o nome do diálogo.
      await expect(header.getBoundingClientRect().width).toBeLessThan(4);
    });

    await step('O foco vai direto para a busca', async () => {
      const panel = await buttonOpen();
      const search = panel.querySelector<HTMLElement>('[data-slot="command-input"]')!;
      await waitFor(async () => {
        await expect(search).toHaveFocus();
      });
      await expect(within(panel).getAllByRole('option')).toHaveLength(4);
    });

    await step('Escape fecha o diálogo e devolve o foco ao gatilho', async () => {
      // Par fechar→abrir por CLIQUE: o foco volta para quem estava focado quando
      // o painel montou, então só um clique real nesta rodada prova que o
      // destino é o gatilho.
      await close();
      await userEvent.click(trigger);
      await waitForPortal('dialog');

      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('dialog');
      await waitFor(async () => {
        await expect(trigger).toHaveFocus();
      });
    });

    await step('Cmd+K abre a paleta de qualquer lugar da página', async () => {
      // O passo anterior deixou fechado; a guarda mantém o passo autossuficiente.
      await close();
      await userEvent.keyboard('{Meta>}k{/Meta}');

      const panel = await waitForPortal('dialog');
      const search = panel.querySelector<HTMLElement>('[data-slot="command-input"]')!;
      await waitFor(async () => {
        await expect(search).toHaveFocus();
      });
      // Os atalhos de cada comando aparecem à direita, encostados na borda.
      const atalho = panel.querySelector<HTMLElement>(
        '[data-value="dashboard"] [data-slot="command-shortcut"]',
      )!;
      await expect(atalho).toHaveTextContent('Ctrl+D');
      const boxItem = atalho
        .closest<HTMLElement>('[data-slot="command-item"]')!
        .getBoundingClientRect();
      const boxShortcut = atalho.getBoundingClientRect();
      await expect(boxItem.right - boxShortcut.right).toBeLessThan(
        boxShortcut.left - boxItem.left,
      );
    });

    await step('Escolher um comando executa e fecha', async () => {
      const panel = await waitForPortal('dialog');
      const antes = aoRodarComando.mock.calls.length;
      await userEvent.click(within(panel).getByRole('option', { name: /Documentos/ }));

      await waitForPortalGone('dialog');
      await expect(aoRodarComando.mock.calls.length).toBe(antes + 1);
      await expect(aoRodarComando.mock.calls[antes][0]).toBe('documents');
      await expect(canvas.getByTestId('palette-executado')).toHaveTextContent('documents');

      // A story TERMINA com a paleta ABERTA: é o quadro que o Chromatic captura
      // e é o que `visual.item4` descreve.
      await userEvent.keyboard('{Meta>}k{/Meta}');
      const reaberto = await waitForPortal('dialog');
      await waitFor(async () => {
        await expect(
          reaberto.querySelector<HTMLElement>('[data-slot="command-input"]'),
        ).toHaveFocus();
      });
      await expect(screen.getByRole('dialog')).toBeVisible();
    });
  },
};
