import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, waitFor, within, expect, fn } from 'storybook/test';
import { Switch } from './index';
import { definir } from './switch.fixtures';
import SwitchStory from './SwitchStory.svelte';
import SwitchDocs from '@/components/docs/SwitchDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { switchSource } from './switch.source';

const meta: Meta = {
  title: 'UI/Switch',
  component: Switch,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: {
      page: withAutoDocsTab(SwitchDocs),
      source: { transform: switchSource },
    },
    layout: 'centered',
  },
  // O docgen está desligado neste stack: `argTypes` é a ÚNICA fonte da aba
  // API Reference, então cada prop pública precisa de entrada com type e
  // default — sem isso as colunas saem vazias.
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Estado do switch. É bindável — aceita a forma de duas vias.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o componente.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    ariaInvalid: {
      control: 'boolean',
      description: 'Aplica aria-invalid para estado de erro.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    name: {
      control: 'text',
      description: 'Nome do campo no formulário HTML.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    size: {
      control: 'select',
      options: ['default', 'sm'],
      description: 'Degrau de tamanho — vira data-size, onde o CSS guarda a medida.',
      table: { type: { summary: "'default' | 'sm'" }, defaultValue: { summary: "'default'" } },
    },
    onCheckedChange: {
      control: false,
      description: 'Callback disparado ao alternar.',
      table: { type: { summary: '(checked: boolean) => void' } },
    },
    withLabel: {
      control: 'boolean',
      description: 'Renderiza com Label associada.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    withDescription: {
      control: 'boolean',
      description: 'Renderiza com Label e texto descritivo (layout em painel).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    labelText: {
      control: 'text',
      description: 'Texto da label associada.',
      table: { type: { summary: 'string' } },
    },
  },
  args: {
    checked: false,
    disabled: false,
    ariaInvalid: false,
    name: 'notificacoes',
    size: 'default',
    withLabel: true,
    withDescription: false,
    labelText: 'Receber notificações',
    onCheckedChange: fn(),
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3',
      'accessibility.item1', 'accessibility.item4', 'accessibility.item5',
    ],
  },
  render: (args) => ({
    Component: SwitchStory,
    props: { ...args, id: 'pg-switch' },
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');
    const spy = args.onCheckedChange as ReturnType<typeof fn>;

    await step('O controle é anunciado como switch e nomeado pelo rótulo', async () => {
      await expect(sw).toHaveAttribute('data-slot', 'switch');
      await expect(sw).toHaveAttribute('role', 'switch');
      await expect(canvas.getByRole('switch', { name: /Receber notificações/i }))
        .toBe(sw);
    });

    await step('aria-checked acompanha o estado, em vez de ficar fixo', async () => {
      // Comparação com o estado imediatamente anterior, e não com um valor
      // absoluto: o replay parte de onde a rodada anterior parou.
      const antes = sw.getAttribute('aria-checked');
      await expect(antes).toMatch(/^(true|false)$/);
      await definir(sw, antes !== 'true');
      await definir(sw, antes === 'true');
    });

    await step('Clicar no controle alterna e dispara o callback de mudança', async () => {
      // A precondição fica FORA da contagem: `definir` só clica quando precisa,
      // então contar a partir de um estado desconhecido daria 1 ou 2 conforme a
      // rodada. Fixado o ponto de partida, o par abaixo são sempre dois cliques.
      await definir(sw, false);
      const callsBefore = spy.mock.calls.length;
      await definir(sw, true);
      await definir(sw, false);
      await expect(spy.mock.calls.length).toBe(callsBefore + 2);
      await expect(spy).toHaveBeenLastCalledWith(false);
    });

    await step('Space com o controle focado alterna o estado', async () => {
      await definir(sw, false);
      sw.focus();
      await expect(sw).toHaveFocus();
      await userEvent.keyboard(' ');
      await waitFor(() => expect(sw).toHaveAttribute('aria-checked', 'true'));
    });

    await step('Tab leva o foco ao controle e deixa anel visível', async () => {
      // Foco por Tab, não `focus()`: o anel vive no `:focus-visible`, que a
      // heurística do navegador só liga em interação de teclado. E um
      // `outline: 0` sem substituto passaria em qualquer teste de estado — é
      // preciso olhar o estilo computado.
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(sw).toHaveFocus();
      const estilo = getComputedStyle(sw);
      await expect(estilo.outlineStyle !== 'none' || estilo.boxShadow !== 'none').toBe(true);
    });

    await step('Clicar no rótulo alterna o controle associado', async () => {
      const label = canvas.getByText('Receber notificações');
      await definir(sw, false, label);
      await definir(sw, true, label);
    });
  },
};
