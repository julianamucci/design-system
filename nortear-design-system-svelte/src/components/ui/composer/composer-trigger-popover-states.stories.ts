import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Composer } from './index';
import { composerLabels } from './composer.fixtures';
import { mentionSource, triggerLabels } from './composer-trigger-popover.fixtures';
import {
  triggerPopoverBaseSource,
  triggerPopoverClosedSource,
  triggerPopoverEmptySource,
  triggerPopoverFilteredSource,
} from './composer-trigger-popover.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os estados que a docs page lista. O estado aberto é o Playground, e não se
// repete aqui.

const meta: Meta<typeof Composer> = {
  title: 'Primitives/Conversational/ComposerTriggerPopover/States',
  component: Composer,
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: triggerPopoverBaseSource },
      description: {
        component: 'Cada story fixa um estado e verifica o que ele muda no painel.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Composer>;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onSubmit = fn();

const mount = () => ({
  Component: Composer,
  props: {
    labels: composerLabels(),
    triggerLabels: triggerLabels(),
    triggers: [mentionSource()],
    class: 'nds-max-w-lg',
    onSubmit,
  },
});

const panelOf = (root: HTMLElement) =>
  root.querySelector<HTMLElement>('[data-slot="composer-trigger-popover"]')!;

export const Filtered: Story = {
  parameters: {
    covers: ['functional.item3', 'visual.item4'],
    docs: { source: { transform: triggerPopoverFilteredSource } },
  },
  render: mount,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;
    const input = canvas.getByRole('textbox');
    const panel = () => panelOf(root);
    const active = () => panel().querySelector<HTMLElement>('[aria-selected="true"]')!;

    await step('Com termo, a lista filtra', async () => {
      await userEvent.clear(input);
      input.focus();
      await userEvent.type(input, 'avisa a @an');
      await waitFor(() =>
        expect(within(panel()).getAllByRole('option')).toHaveLength(3),
      );
    });

    await step('A seta desce, e o campo aponta a nova opção', async () => {
      await waitFor(() => expect(active()).toHaveTextContent('Ana Souza'));
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(active()).toHaveTextContent('Ângela Reis'));
      // O foco não se move: quem anda é o ponteiro, não o teclado.
      await expect(input).toHaveFocus();
      await expect(input).toHaveAttribute('aria-activedescendant', active().id);
    });

    await step('Passando do fim, ela CIRCULA de volta ao começo', async () => {
      // Uma lista que para na última obriga a subir de volta contando.
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(active()).toHaveTextContent('Joana Lima'));
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(active()).toHaveTextContent('Ana Souza'));
    });
  },
};

export const Empty: Story = {
  parameters: {
    covers: ['accessibility.item5', 'visual.item5'],
    docs: { source: { transform: triggerPopoverEmptySource } },
  },
  render: mount,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;
    const input = canvas.getByRole('textbox');
    const panel = () => panelOf(root);

    await step('Sem resultado, o painel continua aberto', async () => {
      await userEvent.clear(input);
      input.focus();
      await userEvent.type(input, 'avisa a @zzz');
      await waitFor(() => expect(panel().hidden).toBe(false));
    });

    await step('E diz por ESCRITO que não há nada', async () => {
      // Lista vazia é silêncio para quem não vê a tela, e silêncio parece que a
      // busca não respondeu.
      await waitFor(() =>
        expect(within(panel()).queryAllByRole('option')).toHaveLength(0),
      );
      await expect(panel().querySelector('.nds-composer-trigger-empty')).toHaveTextContent(
        triggerLabels().empty,
      );
    });

    await step('E o painel deixa de ser uma LISTA', async () => {
      // Lista de opções sem opção reprova em `aria-required-children` — e com
      // razão: ela promete filhos que não existem, e o leitor de tela anuncia
      // "lista com zero itens" em vez da frase que explica o que houve.
      await expect(panel()).not.toHaveAttribute('role');
      await expect(input).not.toHaveAttribute('aria-activedescendant');
    });
  },
};

export const Closed: Story = {
  parameters: {
    covers: ['functional.item6', 'visual.item6'],
    docs: { source: { transform: triggerPopoverClosedSource } },
  },
  render: mount,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;
    const input = canvas.getByRole('textbox');
    const panel = () => panelOf(root);

    await step('Aberto, e então a tecla de escape', async () => {
      await userEvent.clear(input);
      input.focus();
      await userEvent.type(input, 'avisa a @an');
      await waitFor(() => expect(panel().hidden).toBe(false));

      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(panel().hidden).toBe(true));
    });

    await step('Fecha sem escrever nada, e o texto fica como estava', async () => {
      await expect(input).toHaveValue('avisa a @an');
    });

    await step('Voltar o CURSOR para dentro do gatilho reabre a lista', async () => {
      // É aqui que o gatilho prova depender de ONDE o cursor está, e não do que
      // o texto contém: sem este passo, trocar a posição do cursor pelo fim do
      // texto não reprovaria nada, porque toda play digita e deixa o cursor lá.
      await userEvent.clear(input);
      input.focus();
      await userEvent.type(input, 'avisa a @an fim');
      await waitFor(() => expect(panel().hidden).toBe(true));

      // Quatro passos à esquerda param logo depois do `n` de `@an`.
      await userEvent.keyboard('{ArrowLeft>4/}');
      await waitFor(() => expect(panel().hidden).toBe(false));
      await waitFor(() =>
        expect(within(panel()).getAllByRole('option')).toHaveLength(3),
      );
    });

    await step('E sair dele fecha de novo', async () => {
      await userEvent.keyboard('{ArrowRight>4/}');
      await waitFor(() => expect(panel().hidden).toBe(true));
    });

    await step('E o campo deixa de apontar a lista', async () => {
      // Os atributos só existem enquanto descrevem alguma coisa; deixá-los
      // postos com a lista fechada faria o leitor de tela prometer uma lista
      // que não há, e apontar um elemento que já saiu do documento.
      await expect(input).not.toHaveAttribute('aria-controls');
      await expect(input).not.toHaveAttribute('aria-activedescendant');
    });
  },
};
