import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, fn } from 'storybook/test';
import { createCommand, type CommandItem } from './command';
import { commandSource } from './command.source';
import { createCommandDocs } from '@/components/docs/CommandDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type CommandArgs = {
  placeholder: string;
  emptyMessage: string;
  showGroups: boolean;
  onSelect: (value: string) => void;
};

const meta: Meta<CommandArgs> = {
  title: 'UI/Command',
  tags: ['autodocs', 'overlay'],
  parameters: {
    docs: {
      page: withAutoDocsTab(createCommandDocs),
      // O painel Code mostra a chamada da fábrica, e não o `outerHTML` da
      // paleta. A transform cascateia para todas as stories deste arquivo.
      source: { transform: commandSource },
    },
  },
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Texto do campo de busca. Vira também o nome acessível do campo e da lista.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"Search…"' } },
    },
    emptyMessage: {
      control: 'text',
      description: 'Frase anunciada quando a busca não encontra nada.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"No results found."' } },
    },
    showGroups: {
      control: 'boolean',
      description: 'Exibe os itens agrupados, com cabeçalho e divisor entre os grupos.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    onSelect: {
      control: false,
      description: 'Chamado a cada comando escolhido, por clique ou por Enter, com o value do item.',
      table: { type: { summary: '(value: string) => void' } },
    },
  },
  args: {
    placeholder: 'Buscar componente...',
    emptyMessage: 'Nenhum resultado encontrado.',
    showGroups: true,
    onSelect: fn(),
  },
};

export default meta;
type Story = StoryObj<CommandArgs>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Deixa a busca vazia E o destaque zerado.
 *
 * O item em destaque só volta a "nenhum" num re-render do filtro, e
 * `userEvent.clear` num campo JÁ vazio não dispara `input`. No REPLAY (a play
 * reexecuta no mesmo DOM) o destaque da rodada anterior sobreviveria, e a
 * primeira seta partiria do meio da lista.
 */
async function zerarSearch(field: HTMLElement): Promise<void> {
  await userEvent.type(field, 'zzz');
  await userEvent.clear(field);
}

function buildItems(withGroups: boolean): CommandItem[] {
  const componentes = withGroups ? 'Componentes' : undefined;
  const utilitarios = withGroups ? 'Utilitários' : undefined;
  return [
    { value: 'button',    label: 'Button',    group: componentes },
    { value: 'input',     label: 'Input',     group: componentes },
    { value: 'separator', label: 'Separator', group: componentes },
    { value: 'cn',        label: 'cn()',      group: utilitarios },
    { value: 'clsx',      label: 'clsx()',    group: utilitarios },
  ];
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item2',
      'accessibility.item1',
      'accessibility.item2',
    ],
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-sm nds-border-default nds-rounded-md nds-shadow-md';
    wrap.appendChild(
      createCommand({
        placeholder: args.placeholder,
        emptyMessage: args.emptyMessage,
        items: buildItems(args.showGroups),
        onSelect: (value) => args.onSelect(value),
      })
    );
    return wrap;
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="command"]')!;
    const field = canvas.getByRole('combobox');
    const list = canvas.getByRole('listbox');
    const spy = args.onSelect as unknown as ReturnType<typeof fn>;

    // A busca começa sempre vazia: a play REEXECUTA no mesmo DOM.
    await userEvent.clear(field);
    await expect(canvas.getAllByRole('option')).toHaveLength(5);

    await step('O markup é o contrato que as outras stacks copiam', async () => {
      await expect(root).toHaveClass(/nds-command/);
      await expect(field).toHaveClass(/nds-command-input/);
      await expect(field).toHaveAttribute('data-slot', 'command-input');
      await expect(list).toHaveClass(/nds-command-list/);
      await expect(list).toHaveAttribute('data-slot', 'command-list');
      // A lupa é da factory, não do call site — quem escreve a paleta não pode
      // esquecê-la.
      await expect(root.querySelector('.nds-command-input-wrapper > svg')).not.toBeNull();
    });

    await step('O campo é uma combobox ligada à lista REAL', async () => {
      // O par que separa a paleta de um menu: papel de combobox no campo, papel
      // de listbox na lista, e `aria-controls` apontando para o id que a lista
      // tem de verdade — id órfão o axe reprova por aria-valid-attr-value.
      await expect(field).toHaveAttribute('aria-autocomplete', 'list');
      await expect(field).toHaveAttribute('aria-expanded', 'true');
      const controlled = field.getAttribute('aria-controls');
      await expect(controlled).toBeTruthy();
      await expect(document.getElementById(controlled!)).toBe(list);
      // Nome acessível herdado do placeholder, nos dois papéis.
      await expect(field).toHaveAttribute('aria-label', args.placeholder);
      await expect(list).toHaveAttribute('aria-label', args.placeholder);
    });

    await step('Cada comando é uma opção; o cabeçalho de grupo não é', async () => {
      const options = canvas.getAllByRole('option');
      await expect(options).toHaveLength(5);
      await expect(options[0]).toHaveClass(/nds-command-item/);
      await expect(options[0]).toHaveAttribute('data-slot', 'command-item');
      await expect(options[0]).toHaveAttribute('aria-selected', 'false');

      const cabecalhos = root.querySelectorAll<HTMLElement>('.nds-command-group-heading');
      await expect(cabecalhos.length).toBe(args.showGroups ? 2 : 0);

      if (args.showGroups) {
        // O grupo é nomeado pelo próprio cabeçalho, e o cabeçalho continua
        // fora da lista de opções — o erro clássico deste componente.
        await expect(canvas.getByRole('group', { name: 'Componentes' })).toBeVisible();
        await expect(cabecalhos[0].getAttribute('role')).toBeNull();
        // O divisor não entra na lista: ARIA só admite `option` e `group`
        // dentro de um listbox.
        await expect(
          root.querySelector('[data-slot="command-separator"]'),
        ).toHaveAttribute('aria-hidden', 'true');
      }
    });

    await step('Digitar filtra — buscando "sep" sobra 1 comando', async () => {
      await userEvent.clear(field);
      await userEvent.type(field, 'sep');
      await expect(canvas.getAllByRole('option')).toHaveLength(1);
      await expect(canvas.getByRole('option', { name: 'Separator' })).toBeVisible();
    });

    await step('Sem correspondência, a frase é ANUNCIADA e não só desenhada', async () => {
      await userEvent.clear(field);
      await userEvent.type(field, 'zzz');

      const vazio = root.querySelector<HTMLElement>('[data-slot="command-empty"]')!;
      await expect(canvas.queryAllByRole('option')).toHaveLength(0);
      await expect(vazio).toHaveAttribute('data-empty', '');
      await expect(vazio).toHaveTextContent(args.emptyMessage);
      // Região viva montada o tempo todo: é a mudança DENTRO dela que o leitor
      // de tela anuncia. Criá-la só na hora não anunciaria nada.
      await expect(vazio).toHaveAttribute('role', 'status');
      await expect(vazio).toHaveAttribute('aria-live', 'polite');
      await expect(vazio).toHaveAttribute('aria-atomic', 'true');
      await expect(vazio).toHaveClass(/nds-command-empty/);
      // E ela mora FORA do listbox: `role="status"` não é filho permitido de
      // `role="listbox"` (axe: aria-required-children).
      await expect(list.contains(vazio)).toBe(false);
    });

    await step('Com resultado, a região viva volta a ocupar zero', async () => {
      await userEvent.clear(field);
      const vazio = root.querySelector<HTMLElement>('[data-slot="command-empty"]')!;
      await expect(canvas.getAllByRole('option')).toHaveLength(5);
      await expect(vazio).not.toHaveAttribute('data-empty');
      // Continua no DOM (é o que preserva o anúncio), mas sem a classe que traz
      // 24px de respiro em cima e embaixo.
      await expect(vazio).not.toHaveClass(/nds-command-empty/);
      await expect(vazio.getBoundingClientRect().height).toBe(0);
    });

    await step('As setas percorrem a lista sem tirar o foco do campo', async () => {
      await zerarSearch(field);
      field.focus();
      await userEvent.keyboard('{ArrowDown}');

      // O foco NÃO se move: é o que permite continuar digitando enquanto se
      // navega, e é por isso que o destaque precisa de aria-activedescendant.
      await expect(field).toHaveFocus();
      const first = document.getElementById(field.getAttribute('aria-activedescendant')!)!;
      await expect(first).toHaveAttribute('role', 'option');
      await expect(first).toHaveAttribute('aria-selected', 'true');
      await expect(first).toHaveTextContent('Button');

      await userEvent.keyboard('{ArrowDown}');
      const segundo = document.getElementById(field.getAttribute('aria-activedescendant')!)!;
      await expect(segundo).toHaveTextContent('Input');
      // Um destaque por vez.
      await expect(first).toHaveAttribute('aria-selected', 'false');

      await userEvent.keyboard('{ArrowUp}');
      await expect(field.getAttribute('aria-activedescendant')).toBe(first.id);
      await expect(first).toHaveAttribute('aria-selected', 'true');
    });

    await step('Enter escolhe o comando em destaque e zera a busca', async () => {
      // O passo estabelece a própria precondição: nada de herdar o destaque que
      // o passo anterior deixou.
      await zerarSearch(field);
      field.focus();
      await userEvent.keyboard('{ArrowDown}');

      const antes = spy.mock.calls.length;
      await userEvent.keyboard('{Enter}');

      await expect(spy.mock.calls.length).toBe(antes + 1);
      await expect(spy.mock.calls[antes][0]).toBe('button');
      // A busca volta ao zero para o próximo comando — o campo não pode virar o
      // nome do que acabou de rodar.
      await expect(field).toHaveValue('');
      await expect(canvas.getAllByRole('option')).toHaveLength(5);
      await expect(field).not.toHaveAttribute('aria-activedescendant');
      // E a lista continua aberta: a paleta não tem estado fechado.
      await expect(field).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Clicar num comando também o escolhe', async () => {
      await userEvent.clear(field);
      const antes = spy.mock.calls.length;
      await userEvent.click(canvas.getByRole('option', { name: 'cn()' }));

      await expect(spy.mock.calls.length).toBe(antes + 1);
      await expect(spy.mock.calls[antes][0]).toBe('cn');
      await expect(field).toHaveValue('');
      await expect(canvas.getAllByRole('option')).toHaveLength(5);
    });
  },
};
