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

<div class="nds-stack" data-align="center" data-spacing="md">
  <Button
    variant="outline"
    class="nds-text-muted-foreground" data-justify="between" style="width: 280px"
    onclick={() => { open = true; }}
    aria-label="Abrir command palette"
  >
    <span class="nds-cluster" data-spacing="sm">
      <Search class="nds-size-4" aria-hidden="true" />
      Buscar...
    </span>
    <kbd class="nds-cluster pointer-events-none nds-rounded nds-border-default nds-bg-muted nds-font-mono nds-font-medium opacity-100" style="user-select: none; height: 1.25rem; padding-inline: 0.375rem; font-size: 10px" data-align="center" data-spacing="xs" >
      <span class="nds-text-caption">⌘</span>K
    </kbd>
  </Button>

  <Command.Dialog bind:open title="Command Palette" description="Busque por um comando ou ação...">
    <Command.Input placeholder="Buscar comando ou ação..." aria-controls="cmd-palette-listbox" />
    <Command.List id="cmd-palette-listbox">
      <Command.Empty>Nenhum resultado encontrado.</Command.Empty>
      <Command.Group heading="Páginas">
        <Command.Item value="dashboard" onselect={() => handleSelect('dashboard')}>
          <LayoutDashboard class="" style="margin-right: 0.5rem" aria-hidden="true" />
          Dashboard
          <Command.Shortcut>⌘D</Command.Shortcut>
        </Command.Item>
        <Command.Item value="documents" onselect={() => handleSelect('documents')}>
          <FileText class="" style="margin-right: 0.5rem" aria-hidden="true" />
          Documentos
        </Command.Item>
        <Command.Item value="users" onselect={() => handleSelect('users')}>
          <Users class="" style="margin-right: 0.5rem" aria-hidden="true" />
          Usuários
        </Command.Item>
      </Command.Group>
      <Command.Separator />
      <Command.Group heading="Configurações">
        <Command.Item value="settings" onselect={() => handleSelect('settings')}>
          <Settings class="" style="margin-right: 0.5rem" aria-hidden="true" />
          Configurações
          <Command.Shortcut>⌘,</Command.Shortcut>
        </Command.Item>
      </Command.Group>
    </Command.List>
  </Command.Dialog>
</div>
