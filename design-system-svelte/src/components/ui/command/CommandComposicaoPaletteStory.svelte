<script lang="ts">
  import { Button } from '@/components/ui/button';
  import * as Command from '@/components/ui/command';
  import Search from '@lucide/svelte/icons/search';
  import FileText from '@lucide/svelte/icons/file-text';
  import Settings from '@lucide/svelte/icons/settings';
  import Users from '@lucide/svelte/icons/users';
  import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';

  let open = $state(false);

  function handleSelect(value: string) {
    open = false;
    console.info('[Command Palette] selected:', value);
  }

  $effect(() => {
    function onKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        open = !open;
      }
    }
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  });
</script>

<div class="flex flex-col items-center gap-4">
  <Button
    variant="outline"
    class="w-[280px] justify-between text-muted-foreground"
    onclick={() => { open = true; }}
    aria-label="Abrir command palette"
  >
    <span class="flex items-center gap-2">
      <Search class="size-4" aria-hidden="true" />
      Buscar...
    </span>
    <kbd class="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
      <span class="text-xs">⌘</span>K
    </kbd>
  </Button>

  <Command.Dialog bind:open title="Command Palette" description="Busque por um comando ou ação...">
    <Command.Input placeholder="Buscar comando ou ação..." aria-controls="cmd-palette-listbox" />
    <Command.List id="cmd-palette-listbox">
      <Command.Empty>Nenhum resultado encontrado.</Command.Empty>
      <Command.Group heading="Páginas">
        <Command.Item value="dashboard" onselect={() => handleSelect('dashboard')}>
          <LayoutDashboard class="mr-2" aria-hidden="true" />
          Dashboard
          <Command.Shortcut>⌘D</Command.Shortcut>
        </Command.Item>
        <Command.Item value="documents" onselect={() => handleSelect('documents')}>
          <FileText class="mr-2" aria-hidden="true" />
          Documentos
        </Command.Item>
        <Command.Item value="users" onselect={() => handleSelect('users')}>
          <Users class="mr-2" aria-hidden="true" />
          Usuários
        </Command.Item>
      </Command.Group>
      <Command.Separator />
      <Command.Group heading="Configurações">
        <Command.Item value="settings" onselect={() => handleSelect('settings')}>
          <Settings class="mr-2" aria-hidden="true" />
          Configurações
          <Command.Shortcut>⌘,</Command.Shortcut>
        </Command.Item>
      </Command.Group>
    </Command.List>
  </Command.Dialog>
</div>
