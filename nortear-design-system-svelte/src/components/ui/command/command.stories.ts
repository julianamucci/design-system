import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, waitFor, expect, fn } from 'storybook/test';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import CommandDocs from '@/components/docs/CommandDocs.svelte';
import { Root as Command } from '@/components/ui/command';
import CommandStory from './CommandStory.svelte';
import { commandSource } from './command.source';

const meta: Meta = {
  title: 'UI/Command',
  component: Command,
  tags: ['autodocs', 'overlay'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(CommandDocs),
      source: { transform: commandSource },
      description: {
        component:
          'Interface de busca e seleção rápida com filtro fuzzy integrado. Suporta uso inline e command palette.',
      },
    },
  },
  // O docgen está desligado nesta stack: este bloco é a ÚNICA fonte da aba
  // API Reference.
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Texto do campo de busca. Vira também o nome acessível do campo.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    emptyMessage: {
      control: 'text',
      description: 'Frase exibida quando a busca não encontra nada.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    loop: {
      control: 'boolean',
      description: 'Navegação por teclado cicla do último para o primeiro item.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    shouldFilter: {
      control: 'boolean',
      description: 'Habilita o filtro interno por texto (desative para filtro externo).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    onItemSelect: {
      control: false,
      description: 'Chamado a cada comando escolhido, por clique ou por Enter.',
      table: { type: { summary: '(value: string) => void' } },
    },
  },
  args: {
    placeholder: 'Buscar componente...',
    emptyMessage: 'Nenhum resultado encontrado.',
    loop: false,
    shouldFilter: true,
    onItemSelect: fn(),
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    covers: ['functional.item1', 'functional.item2', 'accessibility.item1', 'accessibility.item2'],
  },
  render: (args) => ({
    Component: CommandStory,
    props: { ...args },
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="command"]')!;
    const field = canvas.getByRole('combobox');
    const list = canvas.getByRole('listbox');
    const spy = args.onItemSelect as unknown as ReturnType<typeof fn>;

    // A play REEXECUTA no mesmo DOM: a busca parte sempre do zero.
    await userEvent.clear(field);
    await waitFor(async () => {
      await expect(canvas.getAllByRole('option')).toHaveLength(5);
    });

    await step('O markup é o mesmo das outras stacks', async () => {
      await expect(root).toHaveClass(/nds-command/);
      await expect(field).toHaveClass(/nds-command-input/);
      await expect(field).toHaveAttribute('data-slot', 'command-input');
      await expect(list).toHaveClass(/nds-command-list/);
      await expect(list).toHaveAttribute('data-slot', 'command-list');
    });

    await step('A lupa é do componente e o invólucro dela existe de fato', async () => {
      const involucro = root.querySelector<HTMLElement>('[data-slot="command-input-wrapper"]')!;
      await expect(involucro).toHaveClass(/nds-command-input-wrapper/);
      const lupa = involucro.querySelector('svg')!;
      // Filha DIRETA: o seletor da folha é `.nds-command-input-wrapper > svg`, e
      // enquanto o campo era montado por dentro do InputGroup a lupa vivia
      // dentro de um addon — fora do alcance da regra, com o tamanho do lucide.
      await expect(lupa.parentElement).toBe(involucro);
      // Prova que a regra casou: a opacidade de 50% só vem dela.
      await expect(getComputedStyle(lupa).opacity).toBe('0.5');
      // E uma borda só: `.nds-input-group` desenhava a moldura completa por cima
      // da borda de baixo do invólucro.
      await expect(root.querySelector('.nds-input-group')).toBeNull();
    });

    await step('O campo é uma combobox ligada à lista REAL', async () => {
      await expect(field).toHaveAttribute('aria-autocomplete', 'list');
      await expect(field).toHaveAttribute('aria-expanded', 'true');
      const controlled = field.getAttribute('aria-controls');
      await expect(controlled).toBeTruthy();
      // Id órfão o axe reprova, e era o que acontecia quando o `aria-controls`
      // vinha do wrapper da story em vez do componente.
      await expect(document.getElementById(controlled!)).toBe(list);
      // Nome da lista em português: o default da lib é "Suggestions...".
      await expect(list).toHaveAttribute('aria-label', 'Resultados da busca');
    });

    await step('Cada comando é uma opção, e o divisor não é', async () => {
      // Por NOME e não por posição: o filtro reordena os grupos pelo melhor
      // resultado, e a ordem de DOM não volta sozinha depois de uma busca.
      const button = canvas.getByRole('option', { name: 'Button' });
      await expect(button).toHaveClass(/nds-command-item/);
      await expect(button).toHaveAttribute('data-slot', 'command-item');
      await expect(button).toHaveAttribute('data-value', 'button');
      const divisor = root.querySelector<HTMLElement>('[data-slot="command-separator"]')!;
      await expect(divisor).toHaveClass(/nds-command-separator/);
      // ARIA só admite `option` e `group` dentro de um listbox.
      await expect(divisor).toHaveAttribute('aria-hidden', 'true');
      await expect(canvas.queryAllByRole('separator')).toHaveLength(0);
      // Comando não marcável não carrega marca — ela roubaria 16px à direita.
      await expect(button.querySelector('.nds-command-item-check')).toBeNull();
    });

    await step('Digitar filtra, e o que não casa sai da árvore', async () => {
      await userEvent.type(field, 'sep');

      await waitFor(async () => {
        // Buscando "sep": só o comando de value "separator" pontua.
        await expect(canvas.getAllByRole('option')).toHaveLength(1);
      });
      await expect(canvas.getByRole('option', { name: 'Separator' })).toBeVisible();
      await expect(canvas.queryByText('Button')).toBeNull();
      // O grupo inteiro se recolhe quando nenhum item dele passa — sem isso a
      // paleta mostraria "Utilitários" com nada embaixo.
      const utilitarios = root.querySelector<HTMLElement>(
        '[data-slot="command-group"][data-value="Utilitários"]',
      )!;
      await expect(utilitarios).not.toBeVisible();
    });

    await step('Sem correspondência, a mensagem de vazio aparece', async () => {
      await userEvent.clear(field);
      await userEvent.type(field, 'zzz');

      const vazio = await waitFor(async () => {
        const el = root.querySelector<HTMLElement>('[data-slot="command-empty"]');
        await expect(el).not.toBeNull();
        return el!;
      });
      await expect(vazio).toBeVisible();
      await expect(vazio).toHaveTextContent(args.emptyMessage as string);
      await expect(vazio).toHaveClass(/nds-command-empty/);
      // Nenhum comando sobra: a única "opção" restante É a mensagem, que carrega
      // `role="option"` porque um `<div>` de texto solto dentro de um listbox
      // reprova no axe (aria-required-children). Ver command-empty.svelte.
      const remaining = canvas.getAllByRole('option');
      await expect(remaining).toHaveLength(1);
      await expect(remaining[0]).toBe(vazio);
      await expect(remaining[0]).toHaveAttribute('aria-disabled', 'true');
    });

    await step('Apagar a busca traz os comandos de volta', async () => {
      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(5);
      });
      await expect(root.querySelector('[data-slot="command-empty"]')).toBeNull();
    });

    await step('As setas percorrem a lista sem tirar o foco do campo', async () => {
      field.focus();
      // Precondição própria: Home fixa o destaque no primeiro comando da ordem
      // de DOM, seja qual for o estado que a rodada anterior deixou.
      await userEvent.keyboard('{Home}');
      const options = () => canvas.getAllByRole('option');
      await waitFor(async () => {
        await expect(options()[0]).toHaveAttribute('aria-selected', 'true');
      });
      const first = options()[0];
      const segundo = options()[1];

      await userEvent.keyboard('{ArrowDown}');
      await waitFor(async () => {
        await expect(segundo).toHaveAttribute('aria-selected', 'true');
      });
      // O foco NÃO se move: é o que separa a paleta de um menu, e é o que
      // permite continuar digitando enquanto se navega.
      await expect(field).toHaveFocus();
      // E o leitor de tela sabe onde está o destaque — sem este apontamento a
      // seta não anuncia nada.
      const active = canvasElement.querySelector<HTMLElement>('[role="option"][aria-selected="true"]')!;
      await expect(active).toBe(segundo);
      await expect(active).toHaveAttribute('role', 'option');
      // Um destaque por vez.
      await expect(first).toHaveAttribute('aria-selected', 'false');

      await userEvent.keyboard('{ArrowUp}');
      await waitFor(async () => {
        await expect(first).toHaveAttribute('aria-selected', 'true');
      });
    });

    await step('Enter escolhe o comando em destaque', async () => {
      const inHighlight = canvas.getAllByRole('option')[0];
      const valueEsperado = inHighlight.getAttribute('data-value');
      const antes = spy.mock.calls.length;
      await userEvent.keyboard('{Enter}');

      await waitFor(async () => {
        await expect(spy.mock.calls.length).toBe(antes + 1);
      });
      await expect(spy.mock.calls[antes][0]).toBe(valueEsperado);
      // A lista continua aberta: a paleta inline não tem estado fechado.
      await expect(field).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Clicar num comando também o escolhe', async () => {
      const antes = spy.mock.calls.length;
      await userEvent.click(canvas.getByRole('option', { name: 'cn()' }));

      await waitFor(async () => {
        await expect(spy.mock.calls.length).toBe(antes + 1);
      });
      await expect(spy.mock.calls[antes][0]).toBe('cn');
    });
  },
};
