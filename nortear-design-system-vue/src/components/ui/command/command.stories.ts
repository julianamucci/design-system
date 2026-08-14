import type { Meta, StoryObj } from '@storybook/vue3-vite';
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

type CommandArgs = {
  placeholder: string;
  emptyMessage: string;
  showGroups: boolean;
  highlightOnHover: boolean;
  onSelect: (value: string) => void;
};

/**
 * O painel Code imprime o `template` da story literalmente — com o
 * `args.showGroups ? … : ''` que alterna os cabeçalhos e com o espião ligado ao
 * `@select`. O `transform` devolve o uso real, montado a partir dos controls.
 */
function playgroundSource(_gerado: string, ctx: { args?: Partial<CommandArgs> }): string {
  const {
    placeholder = 'Buscar componente...',
    emptyMessage = 'Nenhum resultado encontrado.',
    showGroups = true,
  } = ctx.args ?? {};

  const grupo = showGroups ? ' heading="Componentes"' : '';

  return `<script setup lang="ts">
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';

function executar(valor: string) {
  // roda o comando e devolve o foco para onde ele age
}
</script>

<template>
  <Command>
    <CommandInput placeholder="${placeholder}" />

    <CommandList>
      <CommandGroup${grupo}>
        <CommandItem value="button" @select="executar('button')">Button</CommandItem>
        <CommandItem value="input" @select="executar('input')">Input</CommandItem>
      </CommandGroup>
    </CommandList>

    <CommandEmpty>${emptyMessage}</CommandEmpty>
  </Command>
</template>`;
}

const meta = {
  title: 'UI/Command',
  component: Command,
  tags: ['autodocs', 'overlay'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(CommandDocs),
      description: {
        component:
          'Interface de busca e seleção rápida com filtro por texto integrado. Suporta padrões inline, combobox e command palette.',
      },
    },
  },
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Texto do campo de busca. Vira também o nome acessível do campo.',
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
    highlightOnHover: {
      control: 'boolean',
      description: 'Move o destaque para o comando sob o ponteiro, além das setas.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    onSelect: {
      control: false,
      description: 'Emitido a cada comando escolhido, por clique ou por Enter.',
      table: { type: { summary: '(value: string) => void' } },
    },
  },
  args: {
    placeholder: 'Buscar componente...',
    emptyMessage: 'Nenhum resultado encontrado.',
    showGroups: true,
    highlightOnHover: false,
    onSelect: fn(),
  },
} satisfies Meta<CommandArgs>;

export default meta;
type Story = StoryObj<CommandArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: playgroundSource } },
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
      return { args };
    },
    template: `
      <div class="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
        <Command :highlight-on-hover="args.highlightOnHover">
          <CommandInput :placeholder="args.placeholder" />

          <CommandList>
            <CommandGroup :heading="args.showGroups ? 'Componentes' : ''">
              <CommandItem value="button" @select="args.onSelect('button')">
                Button
                <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>
              <CommandItem value="input" @select="args.onSelect('input')">Input</CommandItem>
              <CommandItem value="separator" @select="args.onSelect('separator')">Separator</CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup :heading="args.showGroups ? 'Utilitários' : ''">
              <CommandItem value="cn" @select="args.onSelect('cn')">cn()</CommandItem>
              <CommandItem value="clsx" @select="args.onSelect('clsx')">clsx()</CommandItem>
            </CommandGroup>
          </CommandList>

          <CommandEmpty>{{ args.emptyMessage }}</CommandEmpty>
        </Command>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const raiz = canvasElement.querySelector<HTMLElement>('[data-slot="command"]')!;
    const campo = canvas.getByRole('combobox') as HTMLInputElement;
    const lista = canvas.getByRole('listbox');
    const espiao = args.onSelect as ReturnType<typeof fn>;

    // A busca começa sempre vazia: a play REEXECUTA no mesmo DOM.
    await userEvent.clear(campo);
    await waitFor(async () => {
      await expect(canvas.getAllByRole('option')).toHaveLength(5);
    });

    await step('O markup é o mesmo das outras stacks', async () => {
      await expect(raiz).toHaveClass(/nds-command/);
      await expect(campo).toHaveClass(/nds-command-input/);
      await expect(campo).toHaveAttribute('data-slot', 'command-input');
      await expect(lista).toHaveClass(/nds-command-list/);
      await expect(lista).toHaveAttribute('data-slot', 'command-list');
      // A lupa é do componente, não do call site — quem escreve a paleta não
      // pode esquecê-la.
      await expect(raiz.querySelector('.nds-command-input-wrapper > svg')).not.toBeNull();
    });

    await step('O campo é uma combobox ligada à lista REAL', async () => {
      // É o par que separa a paleta de um menu: papel de combobox no campo,
      // papel de listbox na lista, e o `aria-controls` apontando para o id que
      // a lista tem de verdade — id órfão o axe reprova.
      await expect(campo).toHaveAttribute('aria-autocomplete', 'list');
      await expect(campo).toHaveAttribute('aria-expanded', 'true');
      const controlado = campo.getAttribute('aria-controls');
      await expect(controlado).toBeTruthy();
      await expect(document.getElementById(controlado!)).toBe(lista);
      await expect(campo).toHaveAttribute('aria-label', args.placeholder);
    });

    await step('O rótulo do grupo vem do control, não do default', async () => {
      const cabecalhos = raiz.querySelectorAll('.nds-command-group-heading');
      await expect(cabecalhos.length).toBe(args.showGroups ? 2 : 0);
      if (args.showGroups) {
        await expect(canvas.getByRole('group', { name: 'Componentes' })).toBeTruthy();
        // A classe é o que dá 12px e `--muted-foreground` ao cabeçalho; sem ela
        // ele sai do tamanho e da cor que o resto do sistema mostra.
        await expect(cabecalhos[0]).toHaveClass('nds-command-group-heading');
      }
    });

    await step('Cada comando é uma opção da lista', async () => {
      const opcoes = canvas.getAllByRole('option');
      await expect(opcoes).toHaveLength(5);
      await expect(opcoes[0]).toHaveClass(/nds-command-item/);
      await expect(opcoes[0]).toHaveAttribute('data-slot', 'command-item');
      // O divisor não entra na lista de opções — ARIA só admite `option` e
      // `group` dentro de um listbox.
      const divisor = raiz.querySelector<HTMLElement>('[data-slot="command-separator"]')!;
      await expect(divisor).toHaveAttribute('aria-hidden', 'true');
      await expect(divisor).not.toHaveAttribute('role', 'separator');
    });

    await step('Digitar filtra, e o que não casa sai da árvore', async () => {
      await userEvent.type(campo, 'sep');

      // Buscando "sep": só "Separator" sobra.
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(1);
      });
      await expect(canvas.getByRole('option', { name: 'Separator' })).toBeVisible();
      // O primitivo desta stack DESMONTA o item que não casa (as outras o
      // escondem por atributo) — o efeito para o leitor de tela é o mesmo.
      await expect(canvas.queryByRole('option', { name: /^Button/ })).toBeNull();
      // O grupo inteiro se recolhe quando nenhum item dele passa no filtro —
      // sem isso a paleta mostraria "Utilitários" com nada embaixo.
      const grupos = raiz.querySelectorAll<HTMLElement>('[data-slot="command-group"]');
      await expect(grupos[1]).not.toBeVisible();
    });

    await step('Sem resultado, a frase é ANUNCIADA e não só desenhada', async () => {
      await userEvent.clear(campo);
      await userEvent.type(campo, 'zzz');

      const vazio = raiz.querySelector<HTMLElement>('[data-slot="command-empty"]')!;
      await waitFor(async () => {
        await expect(vazio).toHaveAttribute('data-empty', '');
      });
      await expect(vazio).toHaveTextContent(args.emptyMessage);
      // Região viva montada o tempo todo: é a mudança DENTRO dela que o leitor
      // de tela anuncia. Criá-la só na hora não anunciaria nada.
      await expect(vazio).toHaveAttribute('role', 'status');
      await expect(vazio).toHaveAttribute('aria-live', 'polite');
      await expect(vazio).toHaveClass(/nds-command-empty/);
      await expect(canvas.queryAllByRole('option')).toHaveLength(0);
    });

    await step('Com resultado, a região viva volta a ocupar zero', async () => {
      await userEvent.clear(campo);
      const vazio = raiz.querySelector<HTMLElement>('[data-slot="command-empty"]')!;
      await waitFor(async () => {
        await expect(vazio).not.toHaveAttribute('data-empty');
      });
      // Continua no DOM (é o que preserva o anúncio), mas sem a classe que traz
      // 24px de respiro em cima e embaixo.
      await expect(vazio).not.toHaveClass(/nds-command-empty/);
      await expect(vazio.getBoundingClientRect().height).toBe(0);
    });

    await step('As setas percorrem a lista sem tirar o foco do campo', async () => {
      campo.focus();
      // Home leva o destaque para o primeiro comando: a precondição é do passo,
      // não do que a rodada anterior deixou.
      await userEvent.keyboard('{Home}');
      await waitFor(async () => {
        const primeiro = canvasElement.querySelector<HTMLElement>('[role="option"][aria-selected="true"]')!;
        return expect(primeiro).toHaveTextContent('Button');
      });

      await userEvent.keyboard('{ArrowDown}');

      await waitFor(async () => {
        await expect(campo.getAttribute('aria-activedescendant')).toBeTruthy();
      });
      // O foco NÃO se move: é o que separa a paleta de um menu, e é o que
      // permite continuar digitando enquanto se navega.
      await expect(campo).toHaveFocus();

      const segundo = canvasElement.querySelector<HTMLElement>('[role="option"][aria-selected="true"]')!;
      await expect(segundo).toHaveAttribute('role', 'option');
      await expect(segundo).toHaveTextContent('Input');
      // O primitivo desta stack marca o destaque com `data-highlighted`; o
      // `aria-selected` que a folha pinta é escrito pelo componente, senão
      // navegar por teclado não acenderia nada.
      await expect(segundo).toHaveAttribute('data-highlighted');
      await waitFor(async () => {
        await expect(segundo).toHaveAttribute('aria-selected', 'true');
      });

      await userEvent.keyboard('{ArrowUp}');
      await waitFor(async () => {
        const anterior = canvasElement.querySelector<HTMLElement>('[role="option"][aria-selected="true"]')!;
        return expect(anterior).toHaveTextContent('Button');
      });
      // Um destaque por vez: o que saiu deixou de estar em destaque.
      await waitFor(async () => {
        await expect(segundo).toHaveAttribute('aria-selected', 'false');
      });
    });

    await step('Enter escolhe o comando em destaque e zera a busca', async () => {
      const antes = espiao.mock.calls.length;
      await userEvent.keyboard('{Enter}');

      await waitFor(async () => {
        await expect(espiao.mock.calls.length).toBe(antes + 1);
      });
      await expect(espiao.mock.calls[antes][0]).toBe('button');
      // A busca volta ao zero para o próximo comando — o campo não pode virar
      // o nome do que acabou de rodar.
      await waitFor(async () => {
        await expect(campo).toHaveValue('');
        await expect(canvas.getAllByRole('option')).toHaveLength(5);
      });
      // E a lista continua aberta: a paleta não tem estado fechado.
      await expect(campo).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Clicar num comando também o escolhe', async () => {
      const antes = espiao.mock.calls.length;
      await userEvent.click(canvas.getByRole('option', { name: 'cn()' }));

      await waitFor(async () => {
        await expect(espiao.mock.calls.length).toBe(antes + 1);
      });
      await expect(espiao.mock.calls[antes][0]).toBe('cn');
      await waitFor(async () => {
        await expect(campo).toHaveValue('');
      });
    });
  },
};
