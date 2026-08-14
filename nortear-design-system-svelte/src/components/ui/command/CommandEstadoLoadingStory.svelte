<script lang="ts">
  import * as Command from '@/components/ui/command';
  import Loader2 from '@lucide/svelte/icons/loader-circle';
</script>

<div class="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
  <Command.Root>
    <Command.Input placeholder="Buscar componente..." />
    <!-- Loading FORA da List: o bits-ui da role="progressbar" ao Loading, e
         progressbar nao e filho permitido de role="listbox" (axe
         aria-required-children). Fora da lista ele continua sendo anunciado,
         e a lista mantem a estrutura ARIA valida. -->
    <Command.Loading>
      <div
        class="nds-cluster nds-p-4 nds-text-body nds-text-muted-foreground"
        data-align="center"
        data-justify="center"
        data-spacing="sm"
      >
        <Loader2 class="nds-size-4 nds-animate-spin" aria-hidden="true" />
        <span>Carregando resultados...</span>
      </div>
    </Command.Loading>
    <Command.List>
      <Command.Empty>Nenhum resultado encontrado.</Command.Empty>
    </Command.List>
  </Command.Root>
</div>
