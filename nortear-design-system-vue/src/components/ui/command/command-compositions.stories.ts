import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { onMounted, onUnmounted, ref } from 'vue';
import { within, userEvent, waitFor, expect } from 'storybook/test';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import {
  commandWithShortcutsSource,
  commandWithGroupsSource,
  commandPaletteSource,
} from './command.source';

const meta = {
  title: 'Primitives/Overlay/Command/Compositions',
  component: Command,
  tags: ['overlay'],
  parameters: {
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: commandWithGroupsSource },
      description: {
        component:
          'Os arranjos da paleta: grupos nomeados com divisor, atalhos por comando e a paleta '
          + 'dentro de um Dialog (command palette). Nenhuma peça nova entra aqui: é composição '
          + 'de call site.',
      },
    },
  },
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Grupos e divisor ─────────────────────────────────────────────────────────

export const WithGroups: Story = {
  parameters: { covers: ['visual.item1'] },
  render: () => ({
    components: {
      Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
    },
    template: `
      <div class="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
        <Command>
          <CommandInput placeholder="Buscar componente..." />

          <CommandList>
            <CommandGroup heading="Componentes">
              <CommandItem value="button">Button</CommandItem>
              <CommandItem value="input">Input</CommandItem>
              <CommandItem value="select">Select</CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Utilitários">
              <CommandItem value="separator">Separator</CommandItem>
              <CommandItem value="badge">Badge</CommandItem>
              <CommandItem value="avatar">Avatar</CommandItem>
            </CommandGroup>
          </CommandList>

          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        </Command>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="command"]')!;
    const field = canvas.getByRole('combobox');

    await userEvent.clear(field);
    await waitFor(async () => {
      // Com o campo vazio, os seis comandos dos dois grupos aparecem.
      await expect(canvas.getAllByRole('option')).toHaveLength(6);
    });

    await step('Cada grupo é um grupo nomeado pelo próprio cabeçalho', async () => {
      const groups = canvas.getAllByRole('group');
      await expect(groups).toHaveLength(2);
      await expect(canvas.getByRole('group', { name: 'Componentes' })).toBeVisible();
      await expect(canvas.getByRole('group', { name: 'Utilitários' })).toBeVisible();

      const cabecalhos = root.querySelectorAll<HTMLElement>('.nds-command-group-heading');
      await expect(cabecalhos).toHaveLength(2);
      await expect(cabecalhos[0]).toHaveAttribute('data-slot', 'command-group-heading');
      // Cabeçalho não é comando: ele nomeia o grupo, não executa nada.
      await expect(cabecalhos[0].getAttribute('role')).not.toBe('option');
    });

    await step('O divisor não é um comando nem um filho do listbox', async () => {
      const divisor = root.querySelector<HTMLElement>('[data-slot="command-separator"]')!;
      await expect(divisor).toHaveClass(/nds-command-separator/);
      // ARIA só admite `option` e `group` dentro de um listbox; o divisor sai da
      // árvore em vez de virar filho ilegal.
      await expect(divisor).toHaveAttribute('aria-hidden', 'true');
      await expect(divisor.getAttribute('role')).not.toBe('separator');
    });

    await step('O filtro atravessa os dois grupos', async () => {
      await userEvent.type(field, 'a');

      // Buscando "a": Separator, Badge e Avatar (Utilitários) e nada de
      // Componentes — o filtro não respeita fronteira de grupo.
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(3);
      });
      const groups = root.querySelectorAll<HTMLElement>('[data-slot="command-group"]');
      await expect(groups[0]).not.toBeVisible();
      await expect(groups[1]).toBeVisible();
    });

    await step('A story termina no estado padrão — é o quadro documentado', async () => {
      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(6);
      });
      const groups = root.querySelectorAll<HTMLElement>('[data-slot="command-group"]');
      await expect(groups[0]).toBeVisible();
      await expect(groups[1]).toBeVisible();
    });
  },
};

// ─── Atalhos por comando ──────────────────────────────────────────────────────

export const WithShortcuts: Story = {
  // O atalho mora DENTRO do item, que é o que o faz entrar no nome acessível —
  // a do meta mostra comandos sem atalho nenhum.
  parameters: { docs: { source: { transform: commandWithShortcutsSource } } },
  render: () => ({
    components: {
      Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
      CommandSeparator, CommandShortcut,
    },
    template: `
      <div class="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
        <Command>
          <CommandInput placeholder="Buscar ação..." />

          <CommandList>
            <CommandGroup heading="Ações">
              <CommandItem value="novo-arquivo">
                Novo arquivo
                <CommandShortcut>⌘N</CommandShortcut>
              </CommandItem>
              <CommandItem value="abrir">
                Abrir
                <CommandShortcut>⌘O</CommandShortcut>
              </CommandItem>
              <CommandItem value="salvar">
                Salvar
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Editar">
              <CommandItem value="desfazer">
                Desfazer
                <CommandShortcut>⌘Z</CommandShortcut>
              </CommandItem>
              <CommandItem value="refazer">
                Refazer
                <CommandShortcut>⌘⇧Z</CommandShortcut>
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
    const field = canvas.getByRole('combobox');

    await userEvent.clear(field);
    await waitFor(async () => {
      // Com o campo vazio, as cinco ações aparecem.
      await expect(canvas.getAllByRole('option')).toHaveLength(5);
    });

    await step('O atalho faz parte do nome acessível do comando', async () => {
      // Sem isso o leitor anunciaria "Salvar" e a pessoa nunca saberia que há
      // uma tecla — o atalho é informação, não decoração.
      const salvar = canvas.getByRole('option', { name: 'Salvar ⌘S' });
      const atalho = salvar.querySelector<HTMLElement>('[data-slot="command-shortcut"]')!;
      await expect(atalho).toHaveClass(/nds-command-shortcut/);
      await expect(atalho.getAttribute('aria-hidden')).toBeNull();
      await expect(atalho).toHaveTextContent('⌘S');
    });

    await step('O atalho fica encostado na borda direita do comando', async () => {
      const salvar = canvas.getByRole('option', { name: 'Salvar ⌘S' });
      const atalho = salvar.querySelector<HTMLElement>('[data-slot="command-shortcut"]')!;
      const boxItem = salvar.getBoundingClientRect();
      const boxShortcut = atalho.getBoundingClientRect();
      // A distância até a borda direita é menor que até a esquerda: é o
      // `margin-left: auto` da folha empurrando o atalho para o fim da linha.
      await expect(boxItem.right - boxShortcut.right).toBeLessThan(
        boxShortcut.left - boxItem.left,
      );
    });

    await step('Buscar pelo nome reduz a lista a um único comando', async () => {
      await userEvent.type(field, 'desfazer');
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(1);
      });
      await expect(canvas.getByRole('option', { name: 'Desfazer ⌘Z' })).toBeVisible();

      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(5);
      });
    });
  },
};

// ─── Command Palette ──────────────────────────────────────────────────────────

export const CommandPalette: Story = {
  parameters: {
    covers: ['functional.item3', 'functional.item6', 'accessibility.item3', 'visual.item3'],
    // `CommandDialog` já traz a raiz por dentro, e o atalho de janela é código
    // de quem consome — nada disso aparece na do meta.
    docs: { source: { transform: commandPaletteSource } },
  },
  render: () => ({
    components: {
      CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
      CommandSeparator, CommandShortcut, Button,
    },
    setup() {
      const open = ref(false);
      const last = ref('');

      // O Cmd+K não é nativo de componente nenhum — é um listener de janela, e é
      // o consumidor que o registra. `onUnmounted` remove: sem isso o atalho de
      // uma story vaza para a seguinte.
      function onKeyDown(evento: KeyboardEvent) {
        if (evento.key.toLowerCase() !== 'k' || !(evento.metaKey || evento.ctrlKey)) return;
        // Sem isto o navegador leva o Cmd+K para a barra de endereço.
        evento.preventDefault();
        open.value = true;
      }
      onMounted(() => window.addEventListener('keydown', onKeyDown));
      onUnmounted(() => window.removeEventListener('keydown', onKeyDown));

      function executar(value: string) {
        last.value = value;
        open.value = false;
      }

      return { open, last, executar };
    },
    template: `
      <div class="nds-stack" data-align="center" data-spacing="md">
        <Button
          variant="outline"
          aria-haspopup="dialog"
          :aria-expanded="open"
          @click="open = true"
        >
          Buscar
          <kbd class="nds-kbd">⌘K</kbd>
        </Button>

        <CommandDialog
          v-model:open="open"
          title="Command Palette"
          description="Busque por um comando ou ação..."
        >
          <CommandInput placeholder="Buscar componente..." />

          <CommandList>
            <CommandGroup heading="Componentes">
              <CommandItem value="button" @select="executar('button')">
                Button
                <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>
              <CommandItem value="input" @select="executar('input')">
                Input
                <CommandShortcut>⌘I</CommandShortcut>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Utilitários">
              <CommandItem value="separator" @select="executar('separator')">Separator</CommandItem>
            </CommandGroup>
          </CommandList>

          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        </CommandDialog>

        <p class="nds-text-body nds-text-muted-foreground" data-testid="executado">{{ last }}</p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Buscar/ });

    const buttonOpen = async (): Promise<HTMLElement> => {
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      return await waitForPortal('dialog');
    };

    await step('A dica do atalho fica visível no gatilho', async () => {
      // Atalho escondido é atalho que ninguém descobre — é a metade "do" do par
      // de Do & Don't deste componente.
      const dica = trigger.querySelector<HTMLElement>('kbd')!;
      await expect(dica).toHaveClass(/nds-kbd/);
      await expect(dica).toHaveTextContent('⌘K');
      await expect(dica).toBeVisible();
    });

    await step('O diálogo é nomeado por um título que só o leitor de tela vê', async () => {
      const panel = await buttonOpen();
      const idTitle = panel.getAttribute('aria-labelledby');
      await expect(idTitle).toBeTruthy();

      const title = document.getElementById(idTitle!)!;
      await expect(title).toHaveTextContent('Command Palette');
      // Fora da tela, mas dentro da árvore de acessibilidade: `display: none`
      // apagaria o nome do diálogo.
      await expect(title.closest('.nds-sr-only')).not.toBeNull();
      await expect(title.getBoundingClientRect().width).toBeLessThan(4);
    });

    await step('O foco vai direto para a busca', async () => {
      const panel = await buttonOpen();
      const search = panel.querySelector<HTMLElement>('[data-slot="command-input"]')!;
      await waitFor(async () => {
        await expect(search).toHaveFocus();
      });
      await expect(within(panel).getAllByRole('option')).toHaveLength(3);
    });

    await step('Escape fecha o diálogo e devolve o foco ao gatilho', async () => {
      await buttonOpen();
      await userEvent.keyboard('{Escape}');

      await waitForPortalGone('dialog');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await waitFor(async () => {
        await expect(trigger).toHaveFocus();
      });
    });

    await step('Cmd+K abre a paleta de qualquer lugar da página', async () => {
      await userEvent.keyboard('{Meta>}k{/Meta}');

      const panel = await waitForPortal('dialog');
      const search = panel.querySelector<HTMLElement>('[data-slot="command-input"]')!;
      await waitFor(async () => {
        await expect(search).toHaveFocus();
      });
      // Os atalhos de cada comando aparecem à direita, encostados na borda.
      const atalho = panel.querySelector<HTMLElement>(
        '[data-value="button"] [data-slot="command-shortcut"]',
      )!;
      await expect(atalho).toHaveTextContent('⌘B');
      const boxItem = atalho.closest<HTMLElement>('[data-slot="command-item"]')!
        .getBoundingClientRect();
      const boxShortcut = atalho.getBoundingClientRect();
      await expect(boxItem.right - boxShortcut.right).toBeLessThan(
        boxShortcut.left - boxItem.left,
      );
    });

    await step('Escolher um comando executa e fecha', async () => {
      const panel = await waitForPortal('dialog');
      await userEvent.click(within(panel).getByRole('option', { name: 'Input ⌘I' }));

      await waitForPortalGone('dialog');
      await expect(canvas.getByTestId('executado')).toHaveTextContent('input');
    });

    await step('A story termina com a paleta ABERTA — é o quadro documentado', async () => {
      await userEvent.keyboard('{Meta>}k{/Meta}');
      const reaberto = await waitForPortal('dialog');
      await waitFor(async () => {
        await expect(
          reaberto.querySelector<HTMLElement>('[data-slot="command-input"]'),
        ).toHaveFocus();
      });
      await expect(reaberto).toBeVisible();
    });
  },
};
