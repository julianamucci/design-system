import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, waitFor, expect, fn, screen } from 'storybook/test';
import { Root as Command } from '@/components/ui/command';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import CommandInlineStory from './CommandInlineStory.svelte';
import CommandComposicaoLinkItemStory from './CommandComposicaoLinkItemStory.svelte';
import CommandPaletteStory from './CommandPaletteStory.svelte';
import {
  commandWithSeparatorSource,
  commandWithShortcutsSource,
  commandWithDisabledItemsSource,
  commandWithLinkItemSource,
  commandPaletteSource,
  commandSource,
} from './command.source';
import {
  commandItem,
  DISABLED_ITEMS,
  highlightedOf,
  NO_RESULT,
  PALETTE_SHORTCUT,
  PALETTE_TITLE,
  searchOf,
  SEPARATOR_ITEMS,
  separatorsOf,
  SHORTCUT_ITEMS,
} from './command.fixtures';

import { figmaDesign } from '@shared/figma/design-links';
// Espiões de escopo de MÓDULO: dentro do `render` seriam inalcançáveis pela
// play, e a aba Actions nasceria vazia.
const onListSelect = fn();
const onCommandRun = fn();

const meta: Meta = {
  title: 'Components/Overlay/Command/Compositions',
  component: Command,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('command'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com a
      // sua própria composição logo abaixo.
      source: { transform: commandSource },
      description: {
        component:
          'As composições da paleta: com traço declarado, com atalhos, com itens ' +
          'desabilitados, com CommandLinkItem e a paleta dentro de um Dialog (padrão command ' +
          'palette). A paleta em si não flutua — quem flutua é o Dialog, que já existe no ' +
          'sistema. A lista dividida em grupos é VARIANTE (variants.items.withGroups) e mora ' +
          'em Variants; a lista longa é ESTADO (states.longList) e mora em States.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Com traço declarado ──────────────────────────────────────────────────────

export const WithSeparator: Story = {
  parameters: {
    covers: ['functional.item1'],
    docs: {
      source: { transform: commandWithSeparatorSource },
      description: {
        story:
          'Traço entre dois blocos de uma lista sem grupos. Ele é uma QUEBRA na sequência: ' +
          'some junto com os comandos quando o filtro esvazia um dos lados, porque não sobra ' +
          'fronteira para marcar.',
      },
    },
  },
  render: () => ({
    Component: CommandInlineStory,
    props: { placeholder: 'Buscar comando...', emptyMessage: NO_RESULT, items: SEPARATOR_ITEMS },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');

    await userEvent.clear(field);
    await waitFor(async () => {
      await expect(canvas.getAllByRole('option')).toHaveLength(3);
    });

    await step('O traço declarado divide a lista plana em dois blocos', async () => {
      await expect(separatorsOf(canvasElement)).toHaveLength(1);
      // Dentro de um listbox a linha é decorativa: só `option` e `group` são
      // filhos permitidos.
      await expect(separatorsOf(canvasElement)[0]).toHaveAttribute('aria-hidden', 'true');
      await expect(canvas.queryAllByRole('separator')).toHaveLength(0);
      // Nenhum cabeçalho: a divisão aqui não veio de grupo nomeado.
      await expect(canvasElement.querySelectorAll('.nds-command-group-heading')).toHaveLength(0);
      // Cada bloco é um grupo SEM cabeçalho — a caixa do respiro de 4px — e
      // nenhum se anuncia como grupo: sem nome, seria um "grupo" anônimo.
      await expect(canvasElement.querySelectorAll('[data-slot="command-group"]')).toHaveLength(2);
      await expect(canvas.queryAllByRole('group')).toHaveLength(0);
    });

    await step('Filtrando até sobrar um lado só, o traço vai junto', async () => {
      await userEvent.type(field, 'sair');
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(1);
      });
      await expect(separatorsOf(canvasElement)).toHaveLength(0);
    });

    await step('A story termina no estado padrão', async () => {
      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(3);
      });
      await expect(separatorsOf(canvasElement)).toHaveLength(1);
    });
  },
};

// ─── Com atalhos ──────────────────────────────────────────────────────────────

export const WithShortcuts: Story = {
  parameters: {
    docs: { source: { transform: commandWithShortcutsSource } },
  },
  render: () => ({
    Component: CommandInlineStory,
    props: { placeholder: 'Buscar comando...', emptyMessage: NO_RESULT, items: SHORTCUT_ITEMS },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');

    await userEvent.clear(field);
    await waitFor(async () => {
      await expect(canvas.getAllByRole('option')).toHaveLength(4);
    });

    await step('O atalho aparece à direita do comando', async () => {
      const save = commandItem(canvasElement, 'salvar');
      const shortcut = save.querySelector<HTMLElement>('[data-slot="command-shortcut"]')!;
      await expect(shortcut).toHaveTextContent('Ctrl+S');
      await expect(shortcut).toHaveClass(/nds-command-shortcut/);

      const itemBox = save.getBoundingClientRect();
      const shortcutBox = shortcut.getBoundingClientRect();
      await expect(itemBox.right - shortcutBox.right).toBeLessThan(
        shortcutBox.left - itemBox.left,
      );
    });

    await step('O atalho faz parte do nome do comando', async () => {
      // Sem isso o leitor anunciaria "Salvar" e a pessoa nunca saberia que há
      // uma tecla — o atalho é informação, não decoração.
      const save = commandItem(canvasElement, 'salvar');
      const shortcut = save.querySelector<HTMLElement>('[data-slot="command-shortcut"]')!;
      await expect(shortcut.getAttribute('aria-hidden')).toBeNull();
      await expect(save).toHaveAccessibleName(/Ctrl\+S/);
    });

    await step('Comando sem atalho não ganha um espaço vazio', async () => {
      const preferences = commandItem(canvasElement, 'preferencias');
      await expect(preferences.querySelector('[data-slot="command-shortcut"]')).toBeNull();
    });

    await step('Buscando "sal" sobra 1 comando, com o atalho junto', async () => {
      await userEvent.clear(field);
      await userEvent.type(field, 'sal');
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(1);
      });
      await expect(
        commandItem(canvasElement, 'salvar').querySelector('[data-slot="command-shortcut"]'),
      ).not.toBeNull();
    });

    await step('O filtro compara a busca com o RÓTULO, não só com o valor', async () => {
      // O valor de "Novo arquivo" é "novo": só pelo valor, "arq" não acharia
      // nada. A lib pontua o valor e as palavras extras; o componente soma o
      // rótulo a elas (C9, ver `command-context.ts`).
      await userEvent.clear(field);
      await userEvent.type(field, 'arq');
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(1);
      });
      await expect(canvas.getByRole('option', { name: /Novo arquivo/ })).toBeVisible();
      // E é o que um Enter imediato executaria (D11).
      await waitFor(async () => {
        await expect(highlightedOf(field)).toBe(commandItem(canvasElement, 'novo'));
      });
    });

    await step('O atalho não entra no filtro', async () => {
      // Quem busca "ctrl" está procurando a tecla, não o comando: o filtro roda
      // sobre o valor e o rótulo, e o rótulo é o texto do comando SEM o atalho.
      await userEvent.clear(field);
      await userEvent.type(field, 'ctrl');
      await waitFor(async () => {
        await expect(canvas.queryAllByRole('option')).toHaveLength(0);
      });
      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(4);
      });
    });
  },
};

// ─── Com itens desabilitados ──────────────────────────────────────────────────

export const WithDisabledItems: Story = {
  parameters: {
    covers: ['functional.item4', 'accessibility.item2', 'accessibility.item4'],
    docs: { source: { transform: commandWithDisabledItemsSource } },
  },
  render: () => ({
    Component: CommandInlineStory,
    props: {
      placeholder: 'Buscar...',
      emptyMessage: NO_RESULT,
      items: DISABLED_ITEMS,
      onItemSelect: onListSelect,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');

    await userEvent.clear(field);
    await waitFor(async () => {
      await expect(canvas.getAllByRole('option')).toHaveLength(6);
    });

    await step('Os três desabilitados se declaram no markup', async () => {
      for (const value of ['input', 'select', 'clsx']) {
        await expect(commandItem(canvasElement, value)).toHaveAttribute('aria-disabled', 'true');
      }
      // Nesta lib o habilitado declara `aria-disabled="false"` em vez de não ter
      // o atributo — valor de atributo é forma da lib, e o que importa é não
      // ser "true".
      for (const value of ['button', 'badge', 'cn']) {
        await expect(commandItem(canvasElement, value)).toHaveAttribute('aria-disabled', 'false');
      }
    });

    await step('As setas percorrem só os 3 habilitados, em sequência', async () => {
      field.focus();
      // Precondição própria: Home fixa o destaque no primeiro habilitado, seja
      // qual for o que a rodada anterior deixou.
      await userEvent.keyboard('{Home}');
      await waitFor(async () => {
        await expect(highlightedOf(field)).toHaveTextContent('Button');
      });

      for (const expected of ['Badge', 'cn()']) {
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(async () => {
          await expect(highlightedOf(field)).toHaveTextContent(expected);
        });
      }
      // Fim da lista: a seta não volta ao primeiro nem cai num comando
      // desabilitado — o destaque fica no último habilitado.
      await userEvent.keyboard('{ArrowDown}');
      await expect(highlightedOf(field)).toHaveTextContent('cn()');
    });

    await step('Clicar num desabilitado não executa nada', async () => {
      const before = onListSelect.mock.calls.length;
      await userEvent.click(commandItem(canvasElement, 'select'), { pointerEventsCheck: 0 });
      await expect(onListSelect.mock.calls.length).toBe(before);
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
    Component: CommandPaletteStory,
    props: { onCommandRun },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    // O gatilho da paleta é um botão comum (o CommandDialog não expõe trigger),
    // e o `aria-expanded` dele é espelho do estado, escrito à mão — então a
    // idempotência se apoia na presença do painel, que é o que a lib monta.
    const domPanel = () => document.querySelector('[data-slot="dialog-content"]');
    const close = async (): Promise<void> => {
      if (domPanel()) await userEvent.keyboard('{Escape}');
      await waitForPortalGone('dialog');
      // O portal sumir não basta: enquanto o diálogo é modal, a lib põe
      // `pointer-events: none` no `body` para tornar o resto da página inerte, e
      // devolve isso DEPOIS de remover o nó. Clicar no gatilho nesse intervalo
      // falha com "element has pointer-events: none". A espera termina quando a
      // página volta a aceitar ponteiro.
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

    await step('A dica do atalho fica visível DENTRO do gatilho', async () => {
      // Atalho escondido é atalho que ninguém descobre — é a metade "do" do par
      // de Do & Don't deste componente.
      const hint = trigger.querySelector<HTMLElement>('kbd')!;
      await expect(hint).toHaveClass(/nds-kbd/);
      await expect(hint).toHaveTextContent(PALETTE_SHORTCUT);
      await expect(hint).toBeVisible();
      // Sem `aria-label`: o nome sai do texto visível, e é esse texto que quem
      // usa comando de voz vai falar (WCAG 2.5.3).
      await expect(trigger.getAttribute('aria-label')).toBeNull();
      await expect(trigger).toHaveAccessibleName(/^Buscar/);
    });

    await step('O gatilho anuncia que abre um diálogo, e se ele está aberto', async () => {
      // O CommandDialog não expõe gatilho: o botão escreve à mão o par que o
      // Dialog do Vanilla escreve no dele. Fechado, `false`.
      await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('O diálogo é nomeado por um título que só o leitor de tela vê', async () => {
      const panel = await buttonOpen();
      const titleId = panel.getAttribute('aria-labelledby');
      await expect(titleId).toBeTruthy();

      const title = document.getElementById(titleId!)!;
      await expect(title).toHaveTextContent(PALETTE_TITLE);
      // DENTRO do painel: fora dele o título ficava no fluxo da página o tempo
      // todo, mesmo com a paleta fechada.
      await expect(panel.contains(title)).toBe(true);
      const header = title.closest<HTMLElement>('[data-slot="dialog-header"]')!;
      await expect(header).toHaveClass(/nds-sr-only/);
      // Fora da tela, mas dentro da árvore de acessibilidade: `display: none`
      // apagaria o nome do diálogo.
      await expect(header.getBoundingClientRect().width).toBeLessThan(4);
      await expect(panel).toHaveAccessibleName(PALETTE_TITLE);
      // Com o diálogo aberto, o gatilho diz isso.
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('O foco vai direto para a busca, com os 3 comandos na lista', async () => {
      const panel = await buttonOpen();
      await waitFor(async () => {
        await expect(searchOf(panel)).toHaveFocus();
      });
      await expect(within(panel).getAllByRole('option')).toHaveLength(3);
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
      // Fechado de novo, e o gatilho acompanha.
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Cmd+K abre a paleta de qualquer lugar da página', async () => {
      // O passo anterior deixou fechado; a guarda mantém o passo autossuficiente.
      await close();
      await userEvent.keyboard('{Meta>}k{/Meta}');

      const panel = await waitForPortal('dialog');
      await waitFor(async () => {
        await expect(searchOf(panel)).toHaveFocus();
      });
      // Os atalhos de cada comando aparecem à direita, encostados na borda.
      const shortcut = commandItem(panel, 'button').querySelector<HTMLElement>(
        '[data-slot="command-shortcut"]',
      )!;
      await expect(shortcut).toHaveTextContent('Ctrl+B');
      const itemBox = commandItem(panel, 'button').getBoundingClientRect();
      const shortcutBox = shortcut.getBoundingClientRect();
      await expect(itemBox.right - shortcutBox.right).toBeLessThan(
        shortcutBox.left - itemBox.left,
      );
    });

    await step('Escolher um comando executa e fecha', async () => {
      const panel = await waitForPortal('dialog');
      const before = onCommandRun.mock.calls.length;
      await userEvent.click(within(panel).getByRole('option', { name: /Input/ }));

      await waitForPortalGone('dialog');
      await expect(onCommandRun.mock.calls.length).toBe(before + 1);
      await expect(onCommandRun.mock.calls[before][0]).toBe('input');
    });

    await step('A story termina com a paleta ABERTA', async () => {
      // O Chromatic fotografa o estado final e o axe roda depois da play:
      // terminar fechada capturaria só o gatilho, e `visual.item3` descreve o
      // diálogo ABERTO. `waitForPortal` gateia na opacidade, não só na
      // existência do nó — o painel entra transparente e a animação o levanta.
      await close();
      await userEvent.keyboard('{Meta>}k{/Meta}');
      const reopened = await waitForPortal('dialog');
      await waitFor(async () => {
        await expect(searchOf(reopened)).toHaveFocus();
      });
      await expect(screen.getByRole('dialog')).toBeVisible();
      await expect(within(reopened).getAllByRole('option')).toHaveLength(3);
    });
  },
};

// ─── Com CommandLinkItem ──────────────────────────────────────────────────────
//
// Peça só desta stack: o `Command.LinkItem` do bits-ui. Fica declarada no
// contrato da pipeline como story própria, fora do conjunto comum.

export const WithLinkItem: Story = {
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
      const exitIcon = docs.querySelector<HTMLElement>('.nds-spacer-start')!;
      const itemBox = docs.getBoundingClientRect();
      const exitBox = exitIcon.getBoundingClientRect();
      await expect(itemBox.right - exitBox.right).toBeLessThan(exitBox.left - itemBox.left);
    });
  },
};
