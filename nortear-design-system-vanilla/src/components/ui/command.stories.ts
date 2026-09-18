import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, fn } from 'storybook/test';
import { createCommand, type CommandItem } from './command';
import { commandSource } from './command.source';
import { separadores, zerarSearch } from './command.fixtures';
import { createCommandDocs } from '@/components/docs/CommandDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

import { figmaDesign } from '@shared/figma/design-links';
// ─── Meta ─────────────────────────────────────────────────────────────────────

type CommandArgs = {
  placeholder: string;
  emptyMessage: string;
  showGroups: boolean;
  onSelect: (value: string) => void;
};

const meta: Meta<CommandArgs> = {
  title: 'Components/Overlay/Command',
  tags: ['autodocs', 'overlay'],
  parameters: {
    design: figmaDesign('command'),
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
    /** O item que o `aria-activedescendant` do campo aponta — ou `null`. */
    const highlighted = (): HTMLElement | null => {
      const id = field.getAttribute('aria-activedescendant');
      return id ? document.getElementById(id) : null;
    };

    await step('O campo inline não rouba o foco ao montar', async () => {
      // C12. Espera de RELÓGIO, e não `waitFor`: a condição é a AUSÊNCIA do
      // foco, e o `waitFor` passaria na primeira tentativa, antes de um foco
      // agendado para depois da montagem ter chance de chegar. 50ms cobrem com
      // folga esse foco tardio. Vem antes de tudo porque o primeiro `userEvent`
      // da play já foca o campo. Só a paleta aberta num Dialog foca a busca
      // sozinha — o lado que a story CommandPalette prova.
      await new Promise((resolve) => setTimeout(resolve, 50));
      await expect(field).not.toHaveFocus();
      await expect(root.contains(document.activeElement)).toBe(false);
    });

    await step('Ao montar, o primeiro comando já está em destaque', async () => {
      // D11: digitar e apertar Enter executa, sem seta no meio. O destaque é o
      // atributo que a folha pinta E o item que o `aria-activedescendant`
      // aponta — os dois juntos, senão o anel mente para um dos lados.
      const options = canvas.getAllByRole('option');
      await expect(options).toHaveLength(5);
      await expect(options[0]).toHaveTextContent('Button');
      await expect(options[0]).toHaveAttribute('aria-selected', 'true');
      await expect(highlighted()).toBe(options[0]);
      // Um destaque por vez.
      for (const other of options.slice(1)) {
        await expect(other).toHaveAttribute('aria-selected', 'false');
      }
    });

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
      // C1: toda opção CARREGA `aria-selected`. Qual está em destaque é assunto
      // do passo de montagem, das setas e do ponteiro.
      for (const option of options) {
        await expect(option).toHaveAttribute('aria-selected');
      }

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
      const onlyMatch = canvas.getByRole('option', { name: 'Separator' });
      await expect(onlyMatch).toBeVisible();
      // E o que sobrou já está em destaque (D11).
      await expect(highlighted()).toBe(onlyMatch);
    });

    await step('Cada busca destaca o primeiro resultado, e Enter logo depois executa', async () => {
      // D11. A seta tira o destaque do lugar ANTES, para provar que a busca o
      // repõe — e não que ele só ficou onde a montagem o deixou.
      await zerarSearch(field);
      await userEvent.keyboard('{ArrowDown}{ArrowDown}');
      await expect(highlighted()).toHaveTextContent('Separator');

      // "c" casa só com os utilitários: cn() e clsx().
      await userEvent.type(field, 'c');
      await expect(canvas.getAllByRole('option')).toHaveLength(2);
      const firstMatch = canvas.getByRole('option', { name: 'cn()' });
      await expect(firstMatch).toHaveAttribute('aria-selected', 'true');
      await expect(highlighted()).toBe(firstMatch);

      const antes = spy.mock.calls.length;
      await userEvent.keyboard('{Enter}');
      await expect(spy.mock.calls.length).toBe(antes + 1);
      await expect(spy.mock.calls[antes][0]).toBe('cn');
      // A escolha zera a busca, e a lista inteira volta com o primeiro em
      // destaque.
      await expect(field).toHaveValue('');
      await expect(canvas.getAllByRole('option')).toHaveLength(5);
      await expect(highlighted()).toHaveTextContent('Button');
    });

    await step('O separador some quando um dos lados esvazia', async () => {
      // C11. O traço marca a fronteira entre dois blocos: sem comando de um dos
      // lados, não sobra fronteira. Sem grupos (control desligado) a lista é um
      // bloco só e não há traço em momento nenhum.
      const bothSidesCount = args.showGroups ? 1 : 0;
      await zerarSearch(field);
      await expect(separadores(root)).toHaveLength(bothSidesCount);

      // "n" casa com Button, Input e cn(): os dois lados ficam, o traço fica.
      await userEvent.type(field, 'n');
      await expect(canvas.getAllByRole('option')).toHaveLength(3);
      await expect(separadores(root)).toHaveLength(bothSidesCount);

      // "sep" esvazia os utilitários; "cn" esvazia os componentes.
      for (const query of ['sep', 'cn']) {
        await userEvent.clear(field);
        await userEvent.type(field, query);
        await expect(canvas.getAllByRole('option')).toHaveLength(1);
        await expect(separadores(root)).toHaveLength(0);
      }

      await userEvent.clear(field);
      await expect(separadores(root)).toHaveLength(bothSidesCount);
    });

    await step('Sem correspondência, a frase é ANUNCIADA e não só desenhada', async () => {
      await userEvent.clear(field);
      await userEvent.type(field, 'zzz');

      const empty = root.querySelector<HTMLElement>('[data-slot="command-empty"]')!;
      await expect(canvas.queryAllByRole('option')).toHaveLength(0);
      // Sem item na tela não há destaque — e `aria-activedescendant` apontando
      // para um nó que o filtro removeu é violação de verdade.
      await expect(field).not.toHaveAttribute('aria-activedescendant');
      await expect(empty).toHaveAttribute('data-empty', '');
      await expect(empty).toHaveTextContent(args.emptyMessage);
      // Região viva montada o tempo todo: é a mudança DENTRO dela que o leitor
      // de tela anuncia. Criá-la só na hora não anunciaria nada.
      await expect(empty).toHaveAttribute('role', 'status');
      await expect(empty).toHaveAttribute('aria-live', 'polite');
      await expect(empty).toHaveAttribute('aria-atomic', 'true');
      await expect(empty).toHaveClass(/nds-command-empty/);
      // E ela mora FORA do listbox: `role="status"` não é filho permitido de
      // `role="listbox"` (axe: aria-required-children).
      await expect(list.contains(empty)).toBe(false);
    });

    await step('Com resultado, a região viva volta a ocupar zero', async () => {
      await userEvent.clear(field);
      const empty = root.querySelector<HTMLElement>('[data-slot="command-empty"]')!;
      await expect(canvas.getAllByRole('option')).toHaveLength(5);
      await expect(empty).not.toHaveAttribute('data-empty');
      // Continua no DOM (é o que preserva o anúncio), mas sem a classe que traz
      // 24px de respiro em cima e embaixo.
      await expect(empty).not.toHaveClass(/nds-command-empty/);
      await expect(empty.getBoundingClientRect().height).toBe(0);
    });

    await step('As setas percorrem a lista sem tirar o foco do campo', async () => {
      // A precondição é do passo: com a busca zerada o destaque parte do
      // primeiro comando (D11), e não do que a rodada anterior deixou.
      await zerarSearch(field);
      field.focus();
      const first = highlighted()!;
      await expect(first).toHaveTextContent('Button');

      await userEvent.keyboard('{ArrowDown}');

      // O foco NÃO se move: é o que permite continuar digitando enquanto se
      // navega, e é por isso que o destaque precisa de aria-activedescendant.
      await expect(field).toHaveFocus();
      const segundo = highlighted()!;
      await expect(segundo).toHaveAttribute('role', 'option');
      await expect(segundo).toHaveAttribute('aria-selected', 'true');
      await expect(segundo).toHaveTextContent('Input');
      // Um destaque por vez.
      await expect(first).toHaveAttribute('aria-selected', 'false');

      await userEvent.keyboard('{ArrowUp}');
      await expect(field.getAttribute('aria-activedescendant')).toBe(first.id);
      await expect(first).toHaveAttribute('aria-selected', 'true');
    });

    await step('O item em destaque mostra o anel', async () => {
      // Aqui o item nunca recebe foco do DOM — quem o mantém é o campo, e o
      // destaque é apontado por `aria-activedescendant`. Por isso o anel é
      // ligado ao ATRIBUTO, e não a `:focus-visible`, que nunca dispararia.
      //
      // O passo estabelece a própria precondição: a busca zerada põe o
      // destaque no primeiro comando, e o anel tem de aparecer já ali, sem
      // seta nenhuma.
      await zerarSearch(field);
      const inHighlight = highlighted()!;
      await expect(getComputedStyle(inHighlight).outlineStyle).toBe('solid');
      await expect(getComputedStyle(inHighlight).outlineWidth).toBe('2px');
    });

    await step('O ponteiro move o destaque', async () => {
      // D1: o item sob o ponteiro é o que o Enter ativa — o desenho e o teclado
      // apontam para o mesmo comando.
      await zerarSearch(field);
      const target = canvas.getByRole('option', { name: 'clsx()' });
      await userEvent.hover(target);
      await expect(target).toHaveAttribute('aria-selected', 'true');
      await expect(highlighted()).toBe(target);
      await expect(canvas.getByRole('option', { name: 'Button' })).toHaveAttribute(
        'aria-selected',
        'false',
      );
      // Pousar o ponteiro não é clicar: o foco segue no campo.
      await expect(field).toHaveFocus();

      const antes = spy.mock.calls.length;
      await userEvent.keyboard('{Enter}');
      await expect(spy.mock.calls.length).toBe(antes + 1);
      await expect(spy.mock.calls[antes][0]).toBe('clsx');
    });

    await step('Enter escolhe o comando em destaque e zera a busca', async () => {
      // O passo estabelece a própria precondição: nada de herdar o destaque que
      // o passo anterior deixou. A seta leva o destaque ao segundo comando —
      // Enter escolhe o que está em destaque, e não o primeiro da lista.
      await zerarSearch(field);
      field.focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(highlighted()).toHaveTextContent('Input');

      const antes = spy.mock.calls.length;
      await userEvent.keyboard('{Enter}');

      await expect(spy.mock.calls.length).toBe(antes + 1);
      await expect(spy.mock.calls[antes][0]).toBe('input');
      // A busca volta ao zero para o próximo comando — o campo não pode virar o
      // nome do que acabou de rodar.
      await expect(field).toHaveValue('');
      await expect(canvas.getAllByRole('option')).toHaveLength(5);
      // A busca zerada é uma busca nova: o destaque volta ao primeiro (D11), e
      // o `aria-activedescendant` aponta para um nó da lista REDESENHADA.
      const afterReset = highlighted()!;
      await expect(afterReset).toHaveTextContent('Button');
      await expect(list.contains(afterReset)).toBe(true);
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

    await step('Escape no uso inline não tira o foco do campo', async () => {
      // Sem hospedeiro não há o que fechar: a pessoa continua onde estava. O
      // Escape é do Dialog que hospeda a paleta, e quem prova esse lado é a
      // story CommandPalette.
      await userEvent.clear(field);
      await userEvent.type(field, 'in');
      await userEvent.keyboard('{Escape}');
      await expect(field).toHaveFocus();

      await userEvent.clear(field);
      await expect(canvas.getAllByRole('option')).toHaveLength(5);
    });

    await step('Tab sai da paleta: a lista não é parada de Tab', async () => {
      // Quem percorre os comandos são as setas, com o foco no campo. Uma lista
      // com `tabindex="0"` virava uma segunda parada sem função — dentro dela
      // as setas não fazem nada, porque quem as escuta é o campo.
      //
      // É o ÚLTIMO passo de propósito: a play termina com o foco fora da
      // paleta, e é isso que deixa o passo de C12, o primeiro, valer também no
      // replay, que reexecuta no mesmo DOM.
      await expect(list.tabIndex).toBeLessThan(0);
      field.focus();
      await userEvent.tab();
      await expect(list).not.toHaveFocus();
      await expect(root.contains(document.activeElement)).toBe(false);
    });
  },
};
