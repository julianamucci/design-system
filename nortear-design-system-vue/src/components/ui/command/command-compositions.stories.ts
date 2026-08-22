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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  commandWithShortcutsSource,
  commandWithGroupsSource,
  commandAsComboboxSource,
  commandPaletteSource,
} from './command.source';

const meta = {
  title: 'UI/Command/Compositions',
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
          'Os arranjos da paleta: grupos nomeados com divisor, atalhos por comando, e os dois '
          + 'formatos flutuantes — Popover (combobox) e Dialog (command palette). Nenhuma peça '
          + 'nova entra aqui: é composição de call site.',
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
    const raiz = canvasElement.querySelector<HTMLElement>('[data-slot="command"]')!;
    const campo = canvas.getByRole('combobox');

    await userEvent.clear(campo);
    await waitFor(async () => {
      // Com o campo vazio, os seis comandos dos dois grupos aparecem.
      await expect(canvas.getAllByRole('option')).toHaveLength(6);
    });

    await step('Cada grupo é um grupo nomeado pelo próprio cabeçalho', async () => {
      const grupos = canvas.getAllByRole('group');
      await expect(grupos).toHaveLength(2);
      await expect(canvas.getByRole('group', { name: 'Componentes' })).toBeVisible();
      await expect(canvas.getByRole('group', { name: 'Utilitários' })).toBeVisible();

      const cabecalhos = raiz.querySelectorAll<HTMLElement>('.nds-command-group-heading');
      await expect(cabecalhos).toHaveLength(2);
      await expect(cabecalhos[0]).toHaveAttribute('data-slot', 'command-group-heading');
      // Cabeçalho não é comando: ele nomeia o grupo, não executa nada.
      await expect(cabecalhos[0].getAttribute('role')).not.toBe('option');
    });

    await step('O divisor não é um comando nem um filho do listbox', async () => {
      const divisor = raiz.querySelector<HTMLElement>('[data-slot="command-separator"]')!;
      await expect(divisor).toHaveClass(/nds-command-separator/);
      // ARIA só admite `option` e `group` dentro de um listbox; o divisor sai da
      // árvore em vez de virar filho ilegal.
      await expect(divisor).toHaveAttribute('aria-hidden', 'true');
      await expect(divisor.getAttribute('role')).not.toBe('separator');
    });

    await step('O filtro atravessa os dois grupos', async () => {
      await userEvent.type(campo, 'a');

      // Buscando "a": Separator, Badge e Avatar (Utilitários) e nada de
      // Componentes — o filtro não respeita fronteira de grupo.
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(3);
      });
      const grupos = raiz.querySelectorAll<HTMLElement>('[data-slot="command-group"]');
      await expect(grupos[0]).not.toBeVisible();
      await expect(grupos[1]).toBeVisible();
    });

    await step('A story termina no estado padrão — é o quadro documentado', async () => {
      await userEvent.clear(campo);
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(6);
      });
      const grupos = raiz.querySelectorAll<HTMLElement>('[data-slot="command-group"]');
      await expect(grupos[0]).toBeVisible();
      await expect(grupos[1]).toBeVisible();
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
    const campo = canvas.getByRole('combobox');

    await userEvent.clear(campo);
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
      await userEvent.type(campo, 'desfazer');
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(1);
      });
      await expect(canvas.getByRole('option', { name: 'Desfazer ⌘Z' })).toBeVisible();

      await userEvent.clear(campo);
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(5);
      });
    });
  },
};

// ─── Combobox ─────────────────────────────────────────────────────────────────

export const AsCombobox: Story = {
  parameters: {
    covers: ['functional.item7', 'accessibility.item5', 'visual.item3'],
    // A paleta entra dentro de um Popover, com gatilho, rótulo costurado e o
    // fechamento ao escolher: é outra composição inteira.
    docs: { source: { transform: commandAsComboboxSource } },
  },
  render: () => ({
    components: {
      Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
      Popover, PopoverContent, PopoverTrigger, Button,
    },
    setup() {
      const open = ref(false);
      const selectedValue = ref('');
      const items = [
        { value: 'button', label: 'Button' },
        { value: 'input', label: 'Input' },
        { value: 'select', label: 'Select' },
        { value: 'textarea', label: 'Textarea' },
        { value: 'badge', label: 'Badge' },
        { value: 'avatar', label: 'Avatar' },
      ];

      function selectItem(value: string) {
        selectedValue.value = value;
        // Fechar aqui é a guideline: sem isso o popover fica aberto por cima do
        // valor que a pessoa acabou de escolher.
        open.value = false;
      }

      return { open, selectedValue, items, selectItem };
    },
    template: `
      <Popover v-model:open="open">
        <!--
          O papel combobox NÃO tira o nome do conteúdo, ao contrário de button: o
          texto visível deixa de nomear o gatilho no instante em que o papel muda.
          O aria-labelledby costura o rótulo invisível (a finalidade) com o valor
          escolhido (o texto que está na tela), que é o que a WCAG 2.5.3 pede.
        -->
        <span id="demo-combobox-rotulo" class="nds-sr-only">Componente</span>
        <PopoverTrigger as-child>
          <Button
            variant="outline"
            role="combobox"
            :aria-expanded="open"
            aria-labelledby="demo-combobox-rotulo demo-combobox-valor"
            class="nds-cluster nds-w-xs"
            data-justify="between"
          >
            <span id="demo-combobox-valor">{{
              selectedValue
                ? items.find(i => i.value === selectedValue)?.label
                : 'Selecione um item...'
            }}</span>
          </Button>
        </PopoverTrigger>

        <PopoverContent class="nds-p-0 nds-w-xs">
          <Command>
            <CommandInput placeholder="Buscar item..." />

            <CommandList>
              <CommandGroup heading="Componentes">
                <CommandItem
                  v-for="item in items"
                  :key="item.value"
                  :value="item.value"
                  @select="selectItem(item.value)"
                >
                  {{ item.label }}
                </CommandItem>
              </CommandGroup>
            </CommandList>

            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          </Command>
        </PopoverContent>
      </Popover>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('combobox');

    // Idempotente: a play REEXECUTA no mesmo DOM, e um clique cego alternaria o
    // popover a partir do estado que a rodada anterior deixou.
    const abrir = async (): Promise<HTMLElement> => {
      if (gatilho.getAttribute('aria-expanded') !== 'true') await userEvent.click(gatilho);
      return await waitForPortal('dialog');
    };

    await step('O gatilho anuncia que abre uma lista para escolher', async () => {
      // É o que o conteúdo compartilhado cobra: o primitivo do Popover trata o
      // gatilho como botão comum, e sem estes atributos o leitor de tela não diz
      // que há uma escolha do outro lado.
      await expect(gatilho).toHaveAttribute('role', 'combobox');
      await expect(gatilho).toHaveAttribute('aria-haspopup', 'dialog');
      await expect(gatilho).toHaveAttribute('aria-expanded');
    });

    await step('Abrir revela a paleta dentro do popover', async () => {
      const painel = await abrir();
      await expect(gatilho).toHaveAttribute('aria-expanded', 'true');

      const dentro = within(painel);
      const lista = dentro.getByRole('listbox');
      await expect(lista).toBeVisible();
      await expect(lista).toHaveClass(/nds-command-list/);
      const search = painel.querySelector<HTMLInputElement>('[data-slot="command-input"]')!;
      // O foco entra no campo de busca: um combobox que abre e deixa o foco no
      // gatilho obriga a pessoa a caçar o campo com Tab.
      await waitFor(async () => {
        await expect(search).toHaveFocus();
      });
      // Dentro do popover o campo continua sendo uma combobox ligada à lista
      // real — o arranjo flutuante não desmonta o par de papéis.
      await expect(search).toHaveAttribute('aria-autocomplete', 'list');
      await expect(document.getElementById(search.getAttribute('aria-controls')!)).toBe(lista);

      await userEvent.clear(search);
      await waitFor(async () => {
        // Com o campo vazio, os seis componentes aparecem.
        await expect(dentro.getAllByRole('option')).toHaveLength(6);
      });
    });

    await step('A busca filtra dentro do popover', async () => {
      const painel = await abrir();
      const dentro = within(painel);
      const search = painel.querySelector<HTMLInputElement>('[data-slot="command-input"]')!;

      await userEvent.clear(search);
      await userEvent.type(search, 'text');
      // Buscando "text": só "Textarea" sobra.
      await waitFor(async () => {
        await expect(dentro.getAllByRole('option')).toHaveLength(1);
      });
      await expect(dentro.getByRole('option', { name: 'Textarea' })).toBeVisible();

      await userEvent.clear(search);
      await userEvent.type(search, 'zzz');
      const vazio = painel.querySelector<HTMLElement>('[data-slot="command-empty"]')!;
      await waitFor(async () => {
        await expect(vazio).toHaveAttribute('data-empty', '');
      });
      await expect(vazio).toHaveTextContent('Nenhum resultado encontrado.');

      await userEvent.clear(search);
      await waitFor(async () => {
        await expect(dentro.getAllByRole('option')).toHaveLength(6);
      });
    });

    await step('Escolher fecha o popover e leva o valor para o gatilho', async () => {
      const painel = await abrir();
      await userEvent.click(within(painel).getByRole('option', { name: 'Input' }));

      await waitForPortalGone('dialog');
      await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
      await expect(gatilho).toHaveTextContent('Input');
    });
  },
};

// ─── Command Palette ──────────────────────────────────────────────────────────

export const CommandPalette: Story = {
  parameters: {
    covers: ['functional.item3', 'functional.item6', 'accessibility.item3', 'visual.item4'],
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
      function aoTeclar(evento: KeyboardEvent) {
        if (evento.key.toLowerCase() !== 'k' || !(evento.metaKey || evento.ctrlKey)) return;
        // Sem isto o navegador leva o Cmd+K para a barra de endereço.
        evento.preventDefault();
        open.value = true;
      }
      onMounted(() => window.addEventListener('keydown', aoTeclar));
      onUnmounted(() => window.removeEventListener('keydown', aoTeclar));

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
    const gatilho = canvas.getByRole('button', { name: /Buscar/ });

    const buttonOpen = async (): Promise<HTMLElement> => {
      if (gatilho.getAttribute('aria-expanded') !== 'true') await userEvent.click(gatilho);
      return await waitForPortal('dialog');
    };

    await step('A dica do atalho fica visível no gatilho', async () => {
      // Atalho escondido é atalho que ninguém descobre — é a metade "do" do par
      // de Do & Don't deste componente.
      const dica = gatilho.querySelector<HTMLElement>('kbd')!;
      await expect(dica).toHaveClass(/nds-kbd/);
      await expect(dica).toHaveTextContent('⌘K');
      await expect(dica).toBeVisible();
    });

    await step('O diálogo é nomeado por um título que só o leitor de tela vê', async () => {
      const painel = await buttonOpen();
      const idTitle = painel.getAttribute('aria-labelledby');
      await expect(idTitle).toBeTruthy();

      const titulo = document.getElementById(idTitle!)!;
      await expect(titulo).toHaveTextContent('Command Palette');
      // Fora da tela, mas dentro da árvore de acessibilidade: `display: none`
      // apagaria o nome do diálogo.
      await expect(titulo.closest('.nds-sr-only')).not.toBeNull();
      await expect(titulo.getBoundingClientRect().width).toBeLessThan(4);
    });

    await step('O foco vai direto para a busca', async () => {
      const painel = await buttonOpen();
      const search = painel.querySelector<HTMLElement>('[data-slot="command-input"]')!;
      await waitFor(async () => {
        await expect(search).toHaveFocus();
      });
      await expect(within(painel).getAllByRole('option')).toHaveLength(3);
    });

    await step('Escape fecha o diálogo e devolve o foco ao gatilho', async () => {
      await buttonOpen();
      await userEvent.keyboard('{Escape}');

      await waitForPortalGone('dialog');
      await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
      await waitFor(async () => {
        await expect(gatilho).toHaveFocus();
      });
    });

    await step('Cmd+K abre a paleta de qualquer lugar da página', async () => {
      await userEvent.keyboard('{Meta>}k{/Meta}');

      const painel = await waitForPortal('dialog');
      const search = painel.querySelector<HTMLElement>('[data-slot="command-input"]')!;
      await waitFor(async () => {
        await expect(search).toHaveFocus();
      });
      // Os atalhos de cada comando aparecem à direita, encostados na borda.
      const atalho = painel.querySelector<HTMLElement>(
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
      const painel = await waitForPortal('dialog');
      await userEvent.click(within(painel).getByRole('option', { name: 'Input ⌘I' }));

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
