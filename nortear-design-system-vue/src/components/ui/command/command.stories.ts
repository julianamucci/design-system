import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { computed } from 'vue';
import { within, fn, userEvent, waitFor, expect } from 'storybook/test';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import CommandDocs from '@/components/docs/CommandDocs.vue';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { commandSource } from './command.source';
import { FRAME, LIST_TEMPLATE, NO_RESULT, PLAYGROUND_BLOCKS, highlighted, visibleSeparators } from './command.fixtures';

import { figmaDesign } from '@shared/figma/design-links';
type CommandArgs = {
  placeholder: string;
  emptyMessage: string;
  showGroups: boolean;
  onSelect: (value: string) => void;
};

const meta = {
  title: 'Components/Overlay/Command',
  component: Command,
  tags: ['autodocs', 'overlay'],
  parameters: {
    design: figmaDesign('command'),
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(CommandDocs),
      source: { transform: commandSource },
      description: {
        component:
          'Interface de busca e seleção rápida com filtro por texto integrado. Suporta padrões inline e command palette.',
      },
    },
  },
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Texto do campo de busca. Vira também o nome acessível do campo e da lista.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    emptyMessage: {
      control: 'text',
      description: 'Frase anunciada quando a busca não encontra nada.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    showGroups: {
      control: 'boolean',
      description: 'Exibe o cabeçalho de cada grupo. Grupo único costuma dispensar rótulo.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    onSelect: {
      control: false,
      description: 'Emitido a cada comando escolhido, por clique ou por Enter, com o value do item.',
      table: { type: { summary: '(value: string) => void' } },
    },
  },
  args: {
    placeholder: 'Buscar componente...',
    emptyMessage: NO_RESULT,
    showGroups: true,
    onSelect: fn(),
  },
} satisfies Meta<CommandArgs>;

export default meta;
type Story = StoryObj<CommandArgs>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item2',
      'accessibility.item1',
      'accessibility.item2',
    ],
  },
  render: (args) => ({
    components: {
      Command,
      CommandEmpty,
      CommandGroup,
      CommandInput,
      CommandItem,
      CommandList,
      CommandSeparator,
      CommandShortcut,
    },
    setup() {
      // Sem grupos o cabeçalho some — o bloco continua, só perde o nome.
      const blocks = computed(() =>
        PLAYGROUND_BLOCKS.map((block) => ({
          ...block,
          heading: args.showGroups ? block.heading : undefined,
        })),
      );
      const select = (value: string) => args.onSelect(value);
      return { args, blocks, select };
    },
    template: `
      <div class="${FRAME}">
        <Command>
          <CommandInput :placeholder="args.placeholder" />
          ${LIST_TEMPLATE}
          <CommandEmpty>{{ args.emptyMessage }}</CommandEmpty>
        </Command>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="command"]')!;
    const field = canvas.getByRole('combobox') as HTMLInputElement;
    const list = canvas.getByRole('listbox');
    const spy = args.onSelect as ReturnType<typeof fn>;

    await step('O campo inline não rouba o foco ao montar', async () => {
      // Quando o foco automático está ligado, a lib foca o campo num
      // `setTimeout` de 1ms depois de montar. A espera passa disso com folga:
      // se o campo tivesse o foco, já o teria agora. Só a paleta aberta num
      // Dialog foca o campo sozinha.
      await new Promise((resolve) => setTimeout(resolve, 50));
      await expect(field).not.toHaveFocus();
    });

    await step('Ao montar, o primeiro comando já está em destaque', async () => {
      // PRD, D11. Medido ANTES de qualquer tecla: o `clear` logo abaixo dispara
      // `input`, e a busca também destaca o primeiro — medir depois dele
      // provaria só a metade da busca.
      await waitFor(async () => {
        await expect(highlighted(canvasElement)).toHaveTextContent('Button');
      });
      const first = highlighted(canvasElement)!;
      await expect(field.getAttribute('aria-activedescendant')).toBe(first.id);
      // Um destaque só, e o anel junto: é o que o Enter vai ativar.
      await expect(list.querySelectorAll('[role="option"][aria-selected="true"]')).toHaveLength(1);
      await expect(getComputedStyle(first).outlineStyle).toBe('solid');
      // Destacar não é focar: o campo inline continua sem o foco (C12).
      await expect(field).not.toHaveFocus();
    });

    // A busca começa sempre vazia: a play REEXECUTA no mesmo DOM.
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
      // A lupa é do componente, não do call site — quem escreve a paleta não
      // pode esquecê-la.
      await expect(root.querySelector('.nds-command-input-wrapper > svg')).not.toBeNull();
    });

    await step('O campo é uma combobox ligada à lista REAL', async () => {
      // É o par que separa a paleta de um menu: papel de combobox no campo,
      // papel de listbox na lista, e o `aria-controls` apontando para o id que
      // a lista tem de verdade — id órfão o axe reprova.
      await expect(field).toHaveAttribute('aria-autocomplete', 'list');
      await expect(field).toHaveAttribute('aria-expanded', 'true');
      const controlled = field.getAttribute('aria-controls');
      await expect(controlled).toBeTruthy();
      await expect(document.getElementById(controlled!)).toBe(list);
      // Nome acessível herdado do placeholder, nos DOIS papéis: a lista se
      // chama pelo que se está buscando.
      await expect(field).toHaveAttribute('aria-label', args.placeholder);
      await expect(list).toHaveAttribute('aria-label', args.placeholder);
    });

    await step('Cada comando é uma opção; o cabeçalho de grupo não é', async () => {
      const options = canvas.getAllByRole('option');
      await expect(options).toHaveLength(5);
      await expect(options[0]).toHaveClass(/nds-command-item/);
      await expect(options[0]).toHaveAttribute('data-slot', 'command-item');
      // Presença, e não valor: o contrato (C1) é cada opção CARREGAR
      // `aria-selected`; qual está em destaque é assunto dos passos de destaque
      // automático (D11), de seta e de ponteiro.
      await expect(options[0]).toHaveAttribute('aria-selected');
      // Comando que não é marcável não ganha marca — nem invisível, ocupando a
      // borda direita da linha.
      await expect(root.querySelector('.nds-command-item-check')).toBeNull();

      const headings = root.querySelectorAll<HTMLElement>('.nds-command-group-heading');
      await expect(headings.length).toBe(args.showGroups ? 2 : 0);
      if (args.showGroups) {
        await expect(canvas.getByRole('group', { name: 'Componentes' })).toBeVisible();
        await expect(headings[0].getAttribute('role')).not.toBe('option');
        // A classe é o que dá 12px e `--muted-foreground` ao cabeçalho.
        await expect(headings[0]).toHaveClass('nds-command-group-heading');
      }
      // O traço não entra na lista de opções — ARIA só admite `option` e
      // `group` dentro de um listbox.
      const separator = root.querySelector<HTMLElement>('[data-slot="command-separator"]')!;
      await expect(separator).toHaveAttribute('aria-hidden', 'true');
      await expect(separator).not.toHaveAttribute('role', 'separator');
    });

    await step('Digitar filtra — buscando "sep" sobra 1 comando', async () => {
      await userEvent.type(field, 'sep');
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(1);
      });
      await expect(canvas.getByRole('option', { name: 'Separator' })).toBeVisible();
      // O primitivo desta stack DESMONTA o item que não casa (as outras o
      // escondem por atributo) — o efeito para o leitor de tela é o mesmo.
      await expect(canvas.queryByRole('option', { name: 'Button' })).toBeNull();
      // O grupo inteiro se recolhe quando nenhum item dele passa no filtro, e o
      // traço vai junto: sem nada de um dos lados, não há fronteira a marcar.
      const groups = root.querySelectorAll<HTMLElement>('[data-slot="command-group"]');
      await expect(groups[1]).not.toBeVisible();
      await waitFor(async () => {
        await expect(visibleSeparators(root)).toHaveLength(0);
      });
    });

    await step('A cada busca, o primeiro RESULTADO fica em destaque', async () => {
      // PRD, D11. "c" deixa cn() e clsx(): o destaque vai para o primeiro que
      // sobrou, e não fica no Button de antes, que saiu da lista.
      await userEvent.clear(field);
      await userEvent.type(field, 'c');
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(2);
      });
      await waitFor(async () => {
        await expect(highlighted(canvasElement)).toHaveTextContent('cn()');
      });
      await expect(field.getAttribute('aria-activedescendant')).toBe(highlighted(canvasElement)!.id);
      await expect(canvas.getByRole('option', { name: 'clsx()' })).toHaveAttribute('aria-selected', 'false');
    });

    await step('Digitar e apertar Enter executa, sem seta no meio', async () => {
      // A tecla vai na MESMA digitação da busca: é o gesto de quem conhece o
      // comando e não quer navegar até ele.
      const before = spy.mock.calls.length;
      await userEvent.clear(field);
      await userEvent.type(field, 'clsx{Enter}');
      await waitFor(async () => {
        await expect(spy.mock.calls.length).toBe(before + 1);
      });
      await expect(spy.mock.calls[before][0]).toBe('clsx');
      await waitFor(async () => {
        await expect(field).toHaveValue('');
        await expect(canvas.getAllByRole('option')).toHaveLength(5);
      });
    });

    await step('Sem correspondência, a frase é ANUNCIADA e não só desenhada', async () => {
      await userEvent.clear(field);
      await userEvent.type(field, 'zzz');

      const empty = root.querySelector<HTMLElement>('[data-slot="command-empty"]')!;
      await waitFor(async () => {
        await expect(empty).toHaveAttribute('data-empty', '');
      });
      await expect(canvas.queryAllByRole('option')).toHaveLength(0);
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
      await waitFor(async () => {
        await expect(empty).not.toHaveAttribute('data-empty');
      });
      await expect(canvas.getAllByRole('option')).toHaveLength(5);
      // Continua no DOM (é o que preserva o anúncio), mas sem a classe que traz
      // 24px de respiro em cima e embaixo.
      await expect(empty).not.toHaveClass(/nds-command-empty/);
      await expect(empty.getBoundingClientRect().height).toBe(0);
      // Os dois lados de volta, o traço de volta.
      await expect(visibleSeparators(root)).toHaveLength(1);
    });

    await step('As setas percorrem a lista sem tirar o foco do campo', async () => {
      field.focus();
      // Home leva o destaque para o primeiro comando: a precondição é do passo,
      // não do que a rodada anterior deixou.
      await userEvent.keyboard('{Home}');
      await waitFor(async () => {
        await expect(highlighted(canvasElement)).toHaveTextContent('Button');
      });
      const first = highlighted(canvasElement)!;

      await userEvent.keyboard('{ArrowDown}');
      await waitFor(async () => {
        await expect(highlighted(canvasElement)).toHaveTextContent('Input');
      });
      // O foco NÃO se move: é o que separa a paleta de um menu, e é o que
      // permite continuar digitando enquanto se navega.
      await expect(field).toHaveFocus();
      const second = highlighted(canvasElement)!;
      await expect(field.getAttribute('aria-activedescendant')).toBe(second.id);
      // O primitivo desta stack marca o destaque com `data-highlighted`; o
      // `aria-selected` que a folha pinta é escrito pelo componente, senão
      // navegar por teclado não acenderia nada.
      await expect(second).toHaveAttribute('data-highlighted');
      // Um destaque por vez.
      await expect(first).toHaveAttribute('aria-selected', 'false');

      await userEvent.keyboard('{ArrowUp}');
      await waitFor(async () => {
        await expect(field.getAttribute('aria-activedescendant')).toBe(first.id);
      });
      await expect(first).toHaveAttribute('aria-selected', 'true');
    });

    await step('O item em destaque mostra o anel', async () => {
      // Aqui o item nunca recebe foco do DOM — quem o mantém é o campo, e o
      // destaque é apontado por `aria-activedescendant`. Por isso o anel é
      // ligado ao ATRIBUTO, e não a `:focus-visible`, que nunca dispararia.
      const inHighlight = highlighted(canvasElement)!;
      await expect(getComputedStyle(inHighlight).outlineStyle).toBe('solid');
      await expect(getComputedStyle(inHighlight).outlineWidth).toBe('2px');
    });

    await step('Enter escolhe o comando em destaque e zera a busca', async () => {
      field.focus();
      await userEvent.keyboard('{Home}');
      await waitFor(async () => {
        await expect(highlighted(canvasElement)).toHaveTextContent('Button');
      });
      const before = spy.mock.calls.length;
      await userEvent.keyboard('{Enter}');

      await waitFor(async () => {
        await expect(spy.mock.calls.length).toBe(before + 1);
      });
      await expect(spy.mock.calls[before][0]).toBe('button');
      // A busca volta ao zero para o próximo comando — o campo não pode virar
      // o nome do que acabou de rodar.
      await waitFor(async () => {
        await expect(field).toHaveValue('');
        await expect(canvas.getAllByRole('option')).toHaveLength(5);
      });
      // E a lista continua aberta: a paleta não tem estado fechado.
      await expect(field).toHaveAttribute('aria-expanded', 'true');
    });

    await step('O ponteiro também move o destaque', async () => {
      // O item sob o ponteiro é o que o Enter ativa — o desenho e o teclado
      // apontam para o mesmo comando (PRD, D1).
      const target = canvas.getByRole('option', { name: 'clsx()' });
      await userEvent.hover(target);
      await waitFor(async () => {
        await expect(target).toHaveAttribute('aria-selected', 'true');
      });
      await expect(field.getAttribute('aria-activedescendant')).toBe(target.id);
      await expect(highlighted(canvasElement)).toBe(target);
    });

    await step('Clicar num comando também o escolhe', async () => {
      const before = spy.mock.calls.length;
      await userEvent.click(canvas.getByRole('option', { name: 'cn()' }));

      await waitFor(async () => {
        await expect(spy.mock.calls.length).toBe(before + 1);
      });
      await expect(spy.mock.calls[before][0]).toBe('cn');
      await waitFor(async () => {
        await expect(field).toHaveValue('');
      });
      await expect(canvas.getAllByRole('option')).toHaveLength(5);
      // O clique não leva o foco para o comando: ele continua no campo, e a
      // pessoa segue digitando.
      await expect(field).toHaveFocus();
    });

    await step('Tab sai da paleta: a lista não é parada de Tab', async () => {
      // Quem percorre os comandos são as setas, com o foco no campo. Uma lista
      // parada de Tab seria uma segunda parada sem função — dentro dela as
      // setas não fazem nada, porque quem as escuta é o campo.
      await expect(list.tabIndex).toBeLessThan(0);
      field.focus();
      await userEvent.tab();
      await expect(list).not.toHaveFocus();
      await expect(root.contains(document.activeElement)).toBe(false);
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
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(5);
      });
    });
  },
};
