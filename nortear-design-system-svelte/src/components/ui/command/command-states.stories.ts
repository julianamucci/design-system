import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, waitFor, expect, fn } from 'storybook/test';
import * as Command from '@/components/ui/command';
import CommandInlineStory from './CommandInlineStory.svelte';
import CommandEstadoLoadingStory from './CommandEstadoLoadingStory.svelte';
import {
  commandLoadingSource,
  commandItemDisabledSource,
  commandItemCheckedSource,
  commandLongListSource,
  commandNoResultsSource,
  commandSource,
  CHECKED_ITEM_ITEMS,
  DISABLED_ITEM_ITEMS,
  EMPTY_STATE_ITEMS,
  EMPTY_STATE_SEARCH,
  LONG_LIST_ITEMS,
  NO_RESULT,
} from './command.source';
import { commandItem, emptyRegionOf, highlightedOf } from './command.fixtures';

import { figmaDesign } from '@shared/figma/design-links';
// Espião de escopo de MÓDULO: criado dentro do `render` ele seria inalcançável
// pela play, e a aba Actions nasceria vazia.
const onChoose = fn();

const meta: Meta = {
  title: 'Components/Overlay/Command/States',
  component: Command.Root,
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
          'Os estados que a paleta assume sozinha (sem resultados, lista longa, carregando) e ' +
          'os que cada comando assume (marcado, desabilitado).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Sem resultados ───────────────────────────────────────────────────────────

export const EmptyState: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: { source: { transform: commandNoResultsSource } },
  },
  render: () => ({
    Component: CommandInlineStory,
    // A busca já nasce sem correspondência: é o estado que esta story
    // documenta, e o quadro que o Chromatic captura.
    props: {
      placeholder: 'Buscar componente...',
      emptyMessage: NO_RESULT,
      items: EMPTY_STATE_ITEMS,
      search: EMPTY_STATE_SEARCH,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');
    const list = canvas.getByRole('listbox');
    const empty = emptyRegionOf(canvasElement);

    await step('Comando sem grupo mora num grupo sem cabeçalho, que não se anuncia', async () => {
      // Com a lista cheia: a caixa `.nds-command-group` dá aos comandos o
      // respiro de 4px, e sem cabeçalho que a nomeie ela NÃO é `role="group"`
      // — um grupo anônimo seria uma fronteira anunciada sem dizer de quê. A
      // lib põe o papel no nó dos comandos; o componente o tira (ver
      // `command-group.svelte`).
      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(3);
      });
      const group = canvasElement.querySelector<HTMLElement>('[data-slot="command-group"]')!;
      await expect(group).toHaveClass(/nds-command-group/);
      await expect(group.querySelectorAll('[role="option"]')).toHaveLength(3);
      await expect(group.querySelector('.nds-command-group-heading')).toBeNull();
      await expect(canvas.queryAllByRole('group')).toHaveLength(0);
      // O respiro vem da folha (`--spacing-1`); o valor em px muda com a
      // densidade, a existência dele não.
      await expect(Number.parseFloat(getComputedStyle(group).paddingTop)).toBeGreaterThan(0);
    });

    await step(`Buscando "${EMPTY_STATE_SEARCH}" não sobra nenhum comando`, async () => {
      // Idempotente: limpa e digita de novo, parta de onde a rodada anterior
      // tiver deixado a busca.
      await userEvent.clear(field);
      await userEvent.type(field, EMPTY_STATE_SEARCH);
      await waitFor(async () => {
        await expect(canvas.queryAllByRole('option')).toHaveLength(0);
      });
    });

    await step('A frase é anunciada, não só desenhada', async () => {
      await expect(empty).toBeVisible();
      await expect(empty).toHaveTextContent(NO_RESULT);
      await expect(empty).toHaveClass(/nds-command-empty/);
      await expect(empty).toHaveAttribute('data-empty', '');
      // Sem a região viva, quem usa leitor de tela digitaria no vazio sem nunca
      // saber que a busca não achou nada: o foco não sai do campo e não sobra
      // item nenhum para onde navegar.
      await expect(empty).toHaveAttribute('role', 'status');
      await expect(empty).toHaveAttribute('aria-live', 'polite');
      await expect(empty).toHaveAttribute('aria-atomic', 'true');
      // `role="status"` dentro de `role="listbox"` é filho não permitido, e o
      // axe reprova por aria-required-children.
      await expect(list.contains(empty)).toBe(false);
    });

    await step('Apagar a busca traz os 3 comandos de volta', async () => {
      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(3);
      });
      await expect(empty).not.toHaveAttribute('data-empty');
      await expect(empty).not.toHaveClass(/nds-command-empty/);
    });

    await step('A story termina SEM resultados', async () => {
      // O Chromatic fotografa o estado final: terminar com a lista cheia
      // capturaria outra story.
      await userEvent.type(field, EMPTY_STATE_SEARCH);
      await waitFor(async () => {
        await expect(canvas.queryAllByRole('option')).toHaveLength(0);
      });
      await expect(empty).toHaveAttribute('data-empty', '');
    });
  },
};

// ─── Comando desabilitado ─────────────────────────────────────────────────────

export const ItemDisabled: Story = {
  parameters: {
    covers: ['functional.item4', 'accessibility.item4', 'visual.item4'],
    docs: { source: { transform: commandItemDisabledSource } },
  },
  render: () => ({
    Component: CommandInlineStory,
    props: {
      placeholder: 'Buscar comando...',
      emptyMessage: NO_RESULT,
      items: DISABLED_ITEM_ITEMS,
      onItemSelect: onChoose,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');

    await userEvent.clear(field);
    await waitFor(async () => {
      await expect(canvas.getAllByRole('option')).toHaveLength(3);
    });
    const archive = commandItem(canvasElement, 'arquivar');

    await step('O estado chega ao markup e ao desenho', async () => {
      await expect(archive).toHaveAttribute('aria-disabled', 'true');
      // `data-disabled` EXISTE nesta lib: `boolToEmptyStrOrUndef` emite string
      // vazia quando desabilitado.
      await expect(archive).toHaveAttribute('data-disabled', '');
      // Sem asserção de cursor: a folha tirou o `cursor: not-allowed`, que
      // nunca aparecia sob `pointer-events: none`.
      const computedStyle = getComputedStyle(archive);
      await expect(computedStyle.pointerEvents).toBe('none');
      await expect(Number.parseFloat(computedStyle.opacity)).toBeLessThan(1);
    });

    await step('Clicar não executa o comando', async () => {
      // Clique em elemento desabilitado é idempotente por natureza: ele não muda
      // de estado em rodada nenhuma. `pointerEventsCheck: 0` porque a folha
      // bloqueia o ponteiro e o user-event recusaria o clique antes de o
      // componente ter chance de errar.
      const before = onChoose.mock.calls.length;
      await userEvent.click(archive, { pointerEventsCheck: 0 });
      await expect(onChoose.mock.calls.length).toBe(before);
    });

    await step('As setas pulam o comando desabilitado', async () => {
      field.focus();
      // Precondição própria: Home fixa o destaque no primeiro comando
      // habilitado, seja qual for o que a rodada anterior deixou.
      await userEvent.keyboard('{Home}');
      await waitFor(async () => {
        await expect(highlightedOf(field)).toHaveTextContent('Novo');
      });

      await userEvent.keyboard('{ArrowDown}');
      await waitFor(async () => {
        // "Arquivar" não é destino de navegação — quem usa teclado nunca para
        // num comando que não pode executar.
        await expect(highlightedOf(field)).toHaveTextContent('Renomear');
      });
      await expect(archive).toHaveAttribute('aria-selected', 'false');
    });

    await step('Enter no comando habilitado seguinte executa normalmente', async () => {
      const before = onChoose.mock.calls.length;
      await userEvent.keyboard('{Enter}');
      await waitFor(async () => {
        await expect(onChoose.mock.calls.length).toBe(before + 1);
      });
      await expect(onChoose.mock.calls[before][0]).toBe('renomear');
    });

    await step('Depois da busca, o destaque cai no primeiro HABILITADO', async () => {
      // "ar" casa melhor com "Arquivar" (desabilitado) do que com "Renomear":
      // o primeiro da lista é o desabilitado, e o destaque o PULA — um Enter
      // imediato executa o que pode ser executado (D11).
      await userEvent.clear(field);
      await userEvent.type(field, 'ar');
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(2);
      });
      await waitFor(async () => {
        await expect(highlightedOf(field)).toHaveTextContent('Renomear');
      });
      await expect(archive).toHaveAttribute('aria-selected', 'false');

      // A story termina com os 3 comandos.
      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(3);
      });
    });
  },
};

// ─── Comando marcado ──────────────────────────────────────────────────────────

export const CheckedItem: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item4'],
    docs: { source: { transform: commandItemCheckedSource } },
  },
  render: () => ({
    Component: CommandInlineStory,
    props: { placeholder: 'Buscar tema...', emptyMessage: NO_RESULT, items: CHECKED_ITEM_ITEMS },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');

    await userEvent.clear(field);
    await waitFor(async () => {
      await expect(canvas.getAllByRole('option')).toHaveLength(3);
    });

    const light = commandItem(canvasElement, 'claro');
    const dark = commandItem(canvasElement, 'escuro');
    const system = commandItem(canvasElement, 'sistema');
    const mark = (item: HTMLElement) =>
      getComputedStyle(item.querySelector<HTMLElement>('.nds-command-item-check')!);

    await step('O estado chega ao markup', async () => {
      await expect(light).toHaveAttribute('data-checked', 'true');
      await expect(dark).toHaveAttribute('data-checked', 'false');
    });

    await step('A marca aparece só no comando marcado', async () => {
      // O ícone fica no DOM nos dois casos — é a opacidade que muda, para a
      // largura do comando não pular a cada troca.
      await expect(mark(light).opacity).toBe('1');
      await expect(mark(dark).opacity).toBe('0');
    });

    await step('Com atalho no mesmo comando, a marca some', async () => {
      // Os dois disputariam a borda direita; a folha resolve por `:has()`.
      await expect(system).toHaveAttribute('data-checked', 'true');
      await expect(mark(system).display).toBe('none');
    });

    await step('O atalho faz parte do nome do comando', async () => {
      // Sem isso o leitor anunciaria "Sistema" e a pessoa nunca saberia que há
      // uma tecla — o atalho é informação, não decoração.
      await expect(system).toHaveAccessibleName(/Ctrl\+S/);
      const shortcut = system.querySelector<HTMLElement>('[data-slot="command-shortcut"]')!;
      await expect(shortcut.getAttribute('aria-hidden')).toBeNull();
      await expect(shortcut).toHaveClass(/nds-command-shortcut/);
    });
  },
};

// ─── Lista longa ──────────────────────────────────────────────────────────────

export const LongList: Story = {
  parameters: {
    covers: ['functional.item1'],
    docs: { source: { transform: commandLongListSource } },
  },
  render: () => ({
    Component: CommandInlineStory,
    props: { placeholder: 'Buscar componente...', emptyMessage: NO_RESULT, items: LONG_LIST_ITEMS },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');
    const list = canvas.getByRole('listbox');

    await userEvent.clear(field);
    await waitFor(async () => {
      await expect(canvas.getAllByRole('option')).toHaveLength(30);
    });

    await step('A lista rola em vez de esticar a paleta', async () => {
      // Teto na folha: sem ele a paleta cresceria para fora da tela e o campo
      // de busca sairia do alcance.
      await expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
      await expect(getComputedStyle(list).overflowY).toBe('auto');
    });

    await step('Buscando "dialog" sobram 2 — Dialog e AlertDialog', async () => {
      await userEvent.clear(field);
      await userEvent.type(field, 'dialog');
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(2);
      });
      await expect(commandItem(canvasElement, 'dialog')).toBeVisible();
      await expect(commandItem(canvasElement, 'alertdialog')).toBeVisible();
    });

    await step('A story termina com a lista inteira', async () => {
      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(30);
      });
    });
  },
};

// ─── Carregando ───────────────────────────────────────────────────────────────
//
// Peça só desta stack: o `Command.Loading` do bits-ui. Fica declarada no
// contrato da pipeline como story própria, fora do conjunto comum.

export const LoadingState: Story = {
  parameters: {
    docs: { source: { transform: commandLoadingSource } },
  },
  render: () => ({
    Component: CommandEstadoLoadingStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="command"]')!;

    await step('O indicador se anuncia como progresso, com texto visível', async () => {
      const loading = canvas.getByRole('progressbar');
      await expect(loading).toBeVisible();
      await expect(loading).toHaveTextContent('Carregando resultados...');
    });

    await step('O indicador fica FORA do listbox', async () => {
      // `progressbar` não é filho permitido de `role="listbox"`; dentro dele o
      // axe reprova por aria-required-children.
      const list = canvas.getByRole('listbox');
      await expect(list.contains(canvas.getByRole('progressbar'))).toBe(false);
      await expect(root.contains(canvas.getByRole('progressbar'))).toBe(true);
    });
  },
};
