import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, waitFor, expect, fn } from 'storybook/test';
import * as Command from '@/components/ui/command';
import CommandEstadoEmptyStory from './CommandEstadoEmptyStory.svelte';
import CommandEstadoLoadingStory from './CommandEstadoLoadingStory.svelte';
import CommandEstadoDisabledStory from './CommandEstadoDisabledStory.svelte';
import CommandEstadoCheckedStory from './CommandEstadoCheckedStory.svelte';
import {
  commandLoadingSource,
  commandItemDisabledSource,
  commandItemCheckedSource,
  commandNoResultsSource,
  commandSource,
} from './command.source';

// Espião de escopo de MÓDULO: criado dentro do `render` ele seria inalcançável
// pela play, e a aba Actions nasceria vazia.
const onChoose = fn();

const meta: Meta = {
  title: 'UI/Command/States',
  component: Command.Root,
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
          'Os estados que a paleta assume sozinha (sem resultados, carregando) e os que ' +
          'cada comando assume (marcado, desabilitado).',
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
    Component: CommandEstadoEmptyStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const raiz = canvasElement.querySelector<HTMLElement>('[data-slot="command"]')!;
    const campo = canvas.getByRole('combobox');

    // Idempotente: a busca parte sempre do zero.
    await userEvent.clear(campo);
    await waitFor(async () => {
      // Com o campo vazio, os dois comandos da lista.
      await expect(canvas.getAllByRole('option')).toHaveLength(2);
    });

    await step('Buscando "xyz", nenhum comando sobra', async () => {
      await userEvent.type(campo, 'xyz');
      await waitFor(async () => {
        await expect(canvas.queryByRole('option', { name: 'Button' })).toBeNull();
      });
      await expect(canvas.queryByRole('option', { name: 'Input' })).toBeNull();
      // O grupo se recolhe junto — cabeçalho sem itens embaixo é ruído.
      await expect(raiz.querySelector<HTMLElement>('[data-slot="command-group"]'))
        .not.toBeVisible();
    });

    await step('A mensagem de vazio ocupa o lugar da lista', async () => {
      const vazio = raiz.querySelector<HTMLElement>('[data-slot="command-empty"]')!;
      await expect(vazio).toBeVisible();
      await expect(vazio).toHaveTextContent('Nenhum resultado encontrado.');
      await expect(vazio).toHaveClass(/nds-command-empty/);
      // A story TERMINA aqui, sem resultado: é o quadro que o Chromatic captura
      // e é o que `visual.item2` descreve.
    });
  },
};

// ─── Carregando ───────────────────────────────────────────────────────────────

export const LoadingState: Story = {
  name: 'Loading (CommandLoading)',
  parameters: {
    docs: { source: { transform: commandLoadingSource } },
  },
  render: () => ({
    Component: CommandEstadoLoadingStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const raiz = canvasElement.querySelector<HTMLElement>('[data-slot="command"]')!;

    await step('O indicador se anuncia como progresso, com texto visível', async () => {
      const carregando = canvas.getByRole('progressbar');
      await expect(carregando).toBeVisible();
      await expect(carregando).toHaveTextContent('Carregando resultados...');
    });

    await step('O indicador fica FORA do listbox', async () => {
      // `progressbar` não é filho permitido de `role="listbox"`; dentro dele o
      // axe reprova por aria-required-children.
      const lista = canvas.getByRole('listbox');
      await expect(lista.contains(canvas.getByRole('progressbar'))).toBe(false);
      await expect(raiz.contains(canvas.getByRole('progressbar'))).toBe(true);
    });
  },
};

// ─── Comando desabilitado ─────────────────────────────────────────────────────

export const ItemDisabled: Story = {
  parameters: {
    covers: ['functional.item4', 'accessibility.item4', 'visual.item5'],
    docs: { source: { transform: commandItemDisabledSource } },
  },
  render: () => ({
    Component: CommandEstadoDisabledStory,
    props: { onItemSelect: onChoose },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const campo = canvas.getByRole('combobox');

    await userEvent.clear(campo);
    await waitFor(async () => {
      await expect(canvas.getAllByRole('option')).toHaveLength(3);
    });

    const arquivar = canvas.getByRole('option', { name: 'Arquivar' });

    await step('O estado chega ao markup e ao desenho', async () => {
      await expect(arquivar).toHaveAttribute('aria-disabled', 'true');
      // `data-disabled` EXISTE nesta lib: `boolToEmptyStrOrUndef` emite string
      // vazia quando desabilitado. A story anterior afirmava o contrário.
      await expect(arquivar).toHaveAttribute('data-disabled', '');
      const estilo = getComputedStyle(arquivar);
      await expect(estilo.pointerEvents).toBe('none');
      await expect(Number.parseFloat(estilo.opacity)).toBeLessThan(1);
    });

    await step('Clicar não executa o comando', async () => {
      // Clique em elemento desabilitado é idempotente por natureza: ele não muda
      // de estado em rodada nenhuma. `pointerEventsCheck: 0` porque a folha
      // bloqueia o ponteiro e o user-event recusaria o clique antes de o
      // componente ter chance de errar.
      const antes = onChoose.mock.calls.length;
      await userEvent.click(arquivar, { pointerEventsCheck: 0 });
      await expect(onChoose.mock.calls.length).toBe(antes);
    });

    await step('As setas pulam o comando desabilitado', async () => {
      campo.focus();
      await waitFor(async () => {
        const ativo = canvasElement.querySelector<HTMLElement>('[role="option"][aria-selected="true"]')!;
        await expect(ativo).toHaveTextContent('Novo');
      });

      await userEvent.keyboard('{ArrowDown}');
      await waitFor(async () => {
        const ativo = canvasElement.querySelector<HTMLElement>('[role="option"][aria-selected="true"]')!;
        // "Arquivar" não é destino de navegação — quem usa teclado nunca para
        // num comando que não pode executar.
        await expect(ativo).toHaveTextContent('Renomear');
      });
      await expect(arquivar).toHaveAttribute('aria-selected', 'false');
    });
  },
};

// ─── Comando marcado ──────────────────────────────────────────────────────────

export const CheckedItem: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item5'],
    docs: { source: { transform: commandItemCheckedSource } },
  },
  render: () => ({
    Component: CommandEstadoCheckedStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await waitFor(async () => {
      await expect(canvas.getAllByRole('option')).toHaveLength(3);
    });

    const light = canvas.getByRole('option', { name: 'Claro' });
    const escuro = canvas.getByRole('option', { name: 'Escuro' });
    const sistema = canvas.getByRole('option', { name: /Sistema/ });
    const marca = (item: HTMLElement) =>
      getComputedStyle(item.querySelector<HTMLElement>('.nds-command-item-check')!);

    await step('O estado chega ao markup', async () => {
      await expect(light).toHaveAttribute('data-checked', 'true');
      await expect(escuro).toHaveAttribute('data-checked', 'false');
    });

    await step('A marca aparece só no comando marcado', async () => {
      // O ícone fica no DOM nos dois casos — é a opacidade que muda, para a
      // largura do comando não pular a cada troca.
      await expect(marca(light).opacity).toBe('1');
      await expect(marca(escuro).opacity).toBe('0');
    });

    await step('Com atalho no mesmo comando, a marca some', async () => {
      // Os dois disputariam a borda direita; a folha resolve por `:has()`.
      await expect(sistema).toHaveAttribute('data-checked', 'true');
      await expect(marca(sistema).display).toBe('none');
    });

    await step('O atalho faz parte do nome do comando', async () => {
      // Sem isso o leitor anunciaria "Sistema" e a pessoa nunca saberia que há
      // uma tecla — o atalho é informação, não decoração.
      await expect(sistema).toHaveAccessibleName(/⌘S/);
      const atalho = sistema.querySelector<HTMLElement>('[data-slot="command-shortcut"]')!;
      await expect(atalho.getAttribute('aria-hidden')).toBeNull();
      await expect(atalho).toHaveClass(/nds-command-shortcut/);
    });
  },
};
