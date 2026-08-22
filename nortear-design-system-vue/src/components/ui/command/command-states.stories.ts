import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, userEvent, waitFor, expect } from 'storybook/test';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';
import {
  commandItemDisabledSource,
  commandItemCheckedSource,
  commandEmptySource,
} from './command.source';

const meta = {
  title: 'UI/Command/States',
  component: Command,
  tags: ['overlay'],
  parameters: {
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: commandEmptySource },
      description: {
        component:
          'Os estados que a paleta assume sozinha (sem resultados) e os que cada comando '
          + 'assume (marcado, desabilitado).',
      },
    },
  },
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Sem resultados ───────────────────────────────────────────────────────────

export const EmptyState: Story = {
  parameters: { covers: ['visual.item2'] },
  render: () => ({
    components: { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList },
    template: `
      <div class="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
        <Command>
          <CommandInput placeholder="Buscar componente..." />

          <CommandList>
            <CommandGroup heading="Componentes">
              <CommandItem value="button">Button</CommandItem>
              <CommandItem value="input">Input</CommandItem>
            </CommandGroup>
          </CommandList>

          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        </Command>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const raiz = canvasElement.querySelector<HTMLElement>('[data-slot="command"]')!;
    const campo = canvas.getByRole('combobox');
    const vazio = raiz.querySelector<HTMLElement>('[data-slot="command-empty"]')!;

    // Idempotente: a busca parte sempre do zero.
    await userEvent.clear(campo);
    await waitFor(async () => {
      // Com o campo vazio, os dois comandos aparecem.
      await expect(canvas.getAllByRole('option')).toHaveLength(2);
    });

    await step('Nenhum comando sobra e o grupo se recolhe', async () => {
      await userEvent.type(campo, 'xyz');

      // Buscando "xyz": nada casa.
      await waitFor(async () => {
        await expect(canvas.queryAllByRole('option')).toHaveLength(0);
      });
      // Cabeçalho sem itens embaixo é ruído.
      await expect(raiz.querySelector<HTMLElement>('[data-slot="command-group"]'))
        .not.toBeVisible();
    });

    await step('A frase é anunciada, não só desenhada', async () => {
      await expect(vazio).toBeVisible();
      await expect(vazio).toHaveTextContent('Nenhum resultado encontrado.');
      await expect(vazio).toHaveClass(/nds-command-empty/);
      await expect(vazio).toHaveAttribute('data-empty', '');
      // Sem a região viva, quem usa leitor de tela digitaria no vazio sem nunca
      // saber que a busca não achou nada.
      await expect(vazio).toHaveAttribute('role', 'status');
      await expect(vazio).toHaveAttribute('aria-live', 'polite');
      await expect(vazio).toHaveAttribute('aria-atomic', 'true');
    });

    await step('A região viva não é filha do listbox', async () => {
      // `role="status"` dentro de `role="listbox"` é filho não permitido, e o
      // axe reprova por aria-required-children.
      const lista = canvas.getByRole('listbox');
      await expect(lista.contains(vazio)).toBe(false);
    });

    await step('Apagar a busca traz os comandos de volta', async () => {
      await userEvent.clear(campo);
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(2);
      });
      await expect(vazio).not.toHaveAttribute('data-empty');
    });

    await step('A story termina SEM resultados — é o quadro documentado', async () => {
      await userEvent.type(campo, 'xyz');
      await waitFor(async () => {
        await expect(vazio).toHaveAttribute('data-empty', '');
      });
      await expect(canvas.queryAllByRole('option')).toHaveLength(0);
    });
  },
};

// ─── Comando desabilitado ─────────────────────────────────────────────────────

export const ItemDisabled: Story = {
  parameters: {
    covers: ['functional.item4', 'accessibility.item4', 'visual.item5'],
    // `disabled` no item e o estado externo que prova que ele não executa: a do
    // meta mostraria uma paleta sem comando desabilitado nenhum.
    docs: { source: { transform: commandItemDisabledSource } },
  },
  render: () => ({
    components: { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList },
    setup() {
      const last = ref('');
      return { last };
    },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <div class="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
          <Command>
            <CommandInput placeholder="Buscar comando..." />

            <CommandList>
              <CommandGroup heading="Arquivo">
                <CommandItem value="novo" @select="last = 'novo'">Novo</CommandItem>
                <CommandItem value="arquivar" :disabled="true" @select="last = 'arquivar'">Arquivar</CommandItem>
                <CommandItem value="renomear" @select="last = 'renomear'">Renomear</CommandItem>
              </CommandGroup>
            </CommandList>

            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          </Command>
        </div>

        <p class="nds-text-body nds-text-muted-foreground" data-testid="escolhido">{{ last }}</p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const campo = canvas.getByRole('combobox');
    const escolhido = canvas.getByTestId('escolhido');

    await userEvent.clear(campo);
    await waitFor(async () => {
      // Com o campo vazio, os três comandos aparecem.
      await expect(canvas.getAllByRole('option')).toHaveLength(3);
    });

    const arquivar = canvas.getByRole('option', { name: 'Arquivar' });

    await step('O estado chega ao markup e ao desenho', async () => {
      await expect(arquivar).toHaveAttribute('aria-disabled', 'true');
      await expect(arquivar).toHaveAttribute('data-disabled', '');
      const estilo = getComputedStyle(arquivar);
      await expect(estilo.pointerEvents).toBe('none');
      await expect(estilo.opacity).toBe('0.5');
    });

    await step('Clicar não executa o comando', async () => {
      // `pointerEventsCheck: 0` porque a folha bloqueia o ponteiro: sem isso o
      // user-event recusa o clique antes de o componente ter chance de errar.
      // Clique em elemento desabilitado é idempotente por natureza — ele não
      // muda de estado em rodada nenhuma.
      await userEvent.click(arquivar, { pointerEventsCheck: 0 });
      await expect(escolhido.textContent).toBe('');
    });

    await step('As setas pulam o comando desabilitado', async () => {
      campo.focus();
      // Home fixa a precondição do passo: destaque no primeiro comando.
      await userEvent.keyboard('{Home}');
      await waitFor(async () => {
        const active = canvasElement.querySelector<HTMLElement>('[role="option"][aria-selected="true"]')!;
        return expect(active).toHaveTextContent('Novo');
      });

      await userEvent.keyboard('{ArrowDown}');
      await waitFor(async () => {
        const active = canvasElement.querySelector<HTMLElement>('[role="option"][aria-selected="true"]')!;
        // "Arquivar" não é destino de navegação — quem usa teclado nunca para
        // num comando que não pode executar.
        return expect(active).toHaveTextContent('Renomear');
      });
      await waitFor(async () => {
        await expect(arquivar).toHaveAttribute('aria-selected', 'false');
      });
      await expect(arquivar).not.toHaveAttribute('data-highlighted');
    });
  },
};

// ─── Comando marcado ──────────────────────────────────────────────────────────

export const CheckedItem: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item5'],
    // `checked` ausente e `checked` falso são coisas diferentes, e é isso que a
    // story ensina — a do meta não escreve a prop em item nenhum.
    docs: { source: { transform: commandItemCheckedSource } },
  },
  render: () => ({
    components: {
      Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut,
    },
    template: `
      <div class="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
        <Command>
          <CommandInput placeholder="Buscar tema..." />

          <CommandList>
            <CommandGroup heading="Aparência">
              <CommandItem value="claro" :checked="true">Claro</CommandItem>
              <CommandItem value="escuro" :checked="false">Escuro</CommandItem>
              <CommandItem value="sistema" :checked="true">
                Sistema
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>

          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        </Command>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const campo = canvas.getByRole('combobox');

    await userEvent.clear(campo);
    await waitFor(async () => {
      // Com o campo vazio, os três temas aparecem.
      await expect(canvas.getAllByRole('option')).toHaveLength(3);
    });

    const light = canvas.getByRole('option', { name: 'Claro' });
    const escuro = canvas.getByRole('option', { name: 'Escuro' });
    const sistema = canvas.getByRole('option', { name: 'Sistema ⌘S' });
    const marca = (item: HTMLElement) =>
      getComputedStyle(item.querySelector<HTMLElement>('.nds-command-item-check')!);

    await step('O estado chega ao markup', async () => {
      await expect(light).toHaveAttribute('data-checked', 'true');
      await expect(escuro).toHaveAttribute('data-checked', 'false');
    });

    await step('A marca aparece só no comando marcado', async () => {
      // O ícone fica no DOM nos dois casos — é a opacidade que muda, para a
      // largura do item não pular a cada troca.
      await expect(marca(light).opacity).toBe('1');
      await expect(marca(escuro).opacity).toBe('0');
    });

    await step('Com atalho no item, a marca some', async () => {
      // Os dois disputariam a borda direita. A folha resolve por `:has()`, e a
      // guideline é escolher um dos dois por item.
      await expect(sistema).toHaveAttribute('data-checked', 'true');
      await expect(marca(sistema).display).toBe('none');
    });

    await step('O atalho faz parte do nome do comando', async () => {
      // Sem isso o leitor anunciaria "Sistema" e a pessoa nunca saberia que há
      // uma tecla — o atalho é informação, não decoração.
      const atalho = sistema.querySelector<HTMLElement>('[data-slot="command-shortcut"]')!;
      await expect(atalho.getAttribute('aria-hidden')).toBeNull();
      await expect(atalho).toHaveClass(/nds-command-shortcut/);
    });
  },
};
