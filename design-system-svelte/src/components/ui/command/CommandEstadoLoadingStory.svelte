<script lang="ts">
  import * as Command from '@/components/ui/command';
  import { Loader2 } from 'lucide-svelte';
</script>

<div class="w-full max-w-sm rounded-xl border shadow-md">
  <Command.Root>
    <Command.Input placeholder="Buscar componente..." aria-controls="cmd-loading-listbox" />
    <Command.List id="cmd-loading-listbox">
      <Command.Empty>Nenhum resultado encontrado.</Command.Empty>
      <Command.Loading>
        <div class="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 class="size-4 animate-spin" aria-hidden="true" />
          <span>Carregando resultados...</span>
        </div>
      </Command.Loading>
    </Command.List>
  </Command.Root>
</div>
