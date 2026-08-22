import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import { Select } from './index';
import SelectStory from './SelectStory.svelte';
import SelectDocs from '@/components/docs/SelectDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { focusMeasureRing, STATES } from '@shared/testing/select-probe';
import { selectSource } from './select.source';

const meta: Meta = {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: {
      page: withAutoDocsTab(SelectDocs),
      source: { transform: selectSource },
      description: {
        component:
          'Campo de seleção única: gatilho com role=combobox, lista em portal com role=listbox, navegação por teclado, busca por digitação e agrupamento por categoria.',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    value: {
      control: 'text',
      description: 'Valor selecionado (controlado).',
      table: { type: { summary: 'string' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o campo e impede a abertura da lista.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    name: {
      control: 'text',
      description: 'Nome do campo no formulário HTML.',
      table: { type: { summary: 'string' } },
    },
    // Espião de evento: o control ficaria vazio e a aba Actions perderia o
    // handler. Com o docgen desligado neste stack, `argTypes` é a ÚNICA fonte
    // da aba API Reference — o que não estiver aqui não existe para o leitor.
    onValueChange: {
      control: false,
      description: 'Disparado ao trocar a seleção; recebe o valor escolhido.',
      table: { type: { summary: '(value: string) => void' } },
    },
  },
  args: {
    value: '',
    disabled: false,
    name: 'estado',
    onValueChange: fn(),
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item2',
      'functional.item3',
      'functional.item4',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item3',
      'accessibility.item4',
      'accessibility.item5',
    ],
  },
  render: (args) => ({
    Component: SelectStory,
    props: {
      value: args.value,
      disabled: args.disabled,
      name: args.name,
      placeholder: 'Selecione...',
      ariaLabel: 'Selecionar estado',
      variant: 'default',
      options: [...STATES],
      onValueChange: args.onValueChange,
    },
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });
    const spy = args.onValueChange as unknown as { mock: { calls: unknown[] } };

    // Cada passo estabelece a própria precondição: o painel Interactions
    // reexecuta a play no MESMO DOM, e um clique cego inverteria o resultado na
    // segunda rodada.
    const abrir = async () => {
      if (trigger.getAttribute('aria-expanded') !== 'true') {
        // Lista fora do DOM não basta: durante a saída o overlay ainda segura
        // `pointer-events`, e o clique falha com uma mensagem que não explica
        // nada. Esperar o ponteiro voltar é o que torna o passo reexecutável.
        await waitFor(() => {
          if (getComputedStyle(trigger).pointerEvents === 'none') {
            throw new Error('overlay ainda bloqueia o ponteiro');
          }
        });
        await userEvent.click(trigger);
      }
      return await waitForPortal('listbox');
    };

    await step('O campo é um combobox nomeado e nasce fechado', async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toHaveTextContent(/Selecione/);
      await expect(within(document.body).queryAllByRole('listbox')).toHaveLength(0);
    });

    await step('O campo tem anel de foco por teclado', async () => {
      // Antes de qualquer abertura: com a lista aberta o primitivo guarda o
      // foco e devolve o gatilho no mesmo instante, então o `blur()` da medição
      // não chega a valer e a comparação sairia entre dois estados focados.
      //
      // `outline: 0` na folha é intencional — o anel é `box-shadow`. Medir a
      // MUDANÇA, e não `boxShadow !== 'none'`, é o que distingue anel de foco
      // de anel de erro, que já existe sem foco.
      await expect(focusMeasureRing(trigger).mudou).toBe(true);
    });

    await step('Abrir mostra a lista, e a seta anda pelas opções', async () => {
      const listbox = await abrir();
      await expect(listbox).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      // `aria-controls` do gatilho tem de apontar para um elemento que EXISTE e
      // que é a lista. Referência quebrada não acende nada na tela e o axe só a
      // pega quando o alvo some do documento — aqui a conta é feita à mão.
      const apontado = document.getElementById(trigger.getAttribute('aria-controls') ?? '');
      await expect(apontado?.getAttribute('role') ?? 'aria-controls aponta para id inexistente')
        .toBe('listbox');
      await expect(apontado).toBe(listbox);
      const opcoes = within(listbox).getAllByRole('option');
      await expect(opcoes).toHaveLength(STATES.length);
      // Onde o teclado fica ao abrir varia por lib: umas movem o foco para
      // dentro do painel, outras o mantêm no campo e comandam a lista por
      // 'aria-activedescendant'. O que NÃO varia é a seta andar pela lista em
      // vez de rolar a página — e é isso que o item do contrato promete.
      const destacada = () =>
        within(listbox)
          .getAllByRole('option')
          .findIndex((o) => o.hasAttribute('data-highlighted'));
      const partida = destacada();
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(async () => {
        await expect(destacada()).toBe(Math.min(partida + 1, opcoes.length - 1));
      });
    });

    await step('Digitar a inicial salta para a opção correspondente', async () => {
      const listbox = await abrir();
      await userEvent.keyboard('m');
      const minas = within(listbox).getByRole('option', { name: /Minas Gerais/i });
      await waitFor(async () => {
        await expect(minas).toHaveAttribute('data-highlighted');
      });
    });

    await step('Enter escolhe a opção destacada, fecha e atualiza o campo', async () => {
      await abrir();
      await userEvent.keyboard('{Enter}');
      await waitForPortalGone('listbox');
      await expect(spy).toHaveBeenCalledWith('mg');
      await expect(trigger).toHaveTextContent(/Minas Gerais/);
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Escape fecha sem trocar a escolha e devolve o foco', async () => {
      await abrir();
      const callsBefore = spy.mock.calls.length;
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('listbox');
      await expect(spy.mock.calls.length).toBe(callsBefore);
      await expect(trigger).toHaveTextContent(/Minas Gerais/);
      await waitFor(async () => {
        await expect(trigger).toHaveFocus();
      });
    });
  },
};
