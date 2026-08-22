<script lang="ts">
  import { Button } from '@/components/ui/button';
  import * as Command from '@/components/ui/command';
  import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
  import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';

  let { onValueChange }: { onValueChange?: (value: string) => void } = $props();

  let open = $state(false);
  let selecionado = $state('');

  // Mesmos itens do exemplo "combobox" da docs page.
  const itens = [
    { value: 'button',   label: 'Button'   },
    { value: 'input',    label: 'Input'    },
    { value: 'select',   label: 'Select'   },
    { value: 'textarea', label: 'Textarea' },
    { value: 'badge',    label: 'Badge'    },
  ];

  const rotulo = $derived(itens.find((i) => i.value === selecionado)?.label ?? 'Selecione um item...');

  function choose(value: string) {
    selecionado = value;
    // Fechar aqui é a guideline: sem isso o popover fica por cima do valor que
    // a pessoa acabou de escolher.
    open = false;
    onValueChange?.(value);
  }
</script>

<Popover bind:open>
  <!-- bits-ui não tem asChild: o padrão é o snippet child. `role="combobox"`
       não aceita nome vindo do conteúdo, então o nome é costurado por
       `aria-labelledby` — o rótulo invisível (a finalidade) mais o texto que
       está na tela (o valor). É o que WCAG 2.5.3 pede: o nome contém o rótulo
       visível, e um `aria-label` fixo o perderia assim que algo fosse escolhido. -->
  <span id="combobox-story-rotulo" class="nds-sr-only">Componente</span>
  <PopoverTrigger>
    {#snippet child({ props })}
      <Button
        variant="outline"
        role="combobox"
        aria-labelledby="combobox-story-rotulo combobox-story-valor"
        class="nds-cluster nds-w-xs"
        data-justify="between"
        {...props}
      >
        <span id="combobox-story-valor">{rotulo}</span>
        <ChevronsUpDown class="nds-text-muted-foreground" aria-hidden="true" />
      </Button>
    {/snippet}
  </PopoverTrigger>
  <PopoverContent class="nds-p-0 nds-w-xs">
    <Command.Root>
      <Command.Input placeholder="Buscar item..." />
      <Command.List>
        <Command.Empty>Nenhum resultado encontrado.</Command.Empty>
        <Command.Group>
          {#each itens as item (item.value)}
            <Command.Item
              value={item.value}
              checked={selecionado === item.value}
              onSelect={() => choose(item.value)}
            >
              {item.label}
            </Command.Item>
          {/each}
        </Command.Group>
      </Command.List>
    </Command.Root>
  </PopoverContent>
</Popover>
