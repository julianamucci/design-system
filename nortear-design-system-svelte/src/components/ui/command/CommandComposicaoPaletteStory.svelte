<script lang="ts">
  import { Button } from '@/components/ui/button';
  import * as Command from '@/components/ui/command';
  import Search from '@lucide/svelte/icons/search';
  import FileText from '@lucide/svelte/icons/file-text';
  import Settings from '@lucide/svelte/icons/settings';
  import Users from '@lucide/svelte/icons/users';
  import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';

  let { onCommandRun }: { onCommandRun?: (value: string) => void } = $props();

  let open = $state(false);
  let last = $state('');

  function handleSelect(value: string) {
    last = value;
    open = false;
    onCommandRun?.(value);
  }

  $effect(() => {
    function onKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        // Sem isto o navegador leva o Cmd+K para a barra de endereço.
        e.preventDefault();
        // `= true`, e não um alternador: o atalho existe para ABRIR a paleta, e
        // repetir a tecla não pode fechar o que se acabou de pedir.
        open = true;
      }
    }
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  });
</script>

<div class="nds-stack" data-align="center" data-spacing="md">
  <!-- Sem aria-label: o texto visivel e "Buscar...", e um aria-label diferente
       troca o nome acessivel — quem usa comando de voz fala o que ve e nao
       aciona nada (WCAG 2.5.3, Label in Name). O nome vem do texto. -->
  <Button
    variant="outline"
    class="nds-cluster nds-w-xs nds-text-muted-foreground" data-spacing="md"
    data-justify="between"
    onclick={() => { open = true; }}
  >
    <span class="nds-cluster" data-spacing="sm">
      <Search class="nds-size-4" aria-hidden="true" />
      Buscar...
    </span>
    <kbd class="nds-kbd">Ctrl+K</kbd>
  </Button>

  <Command.Dialog bind:open title="Command Palette" description="Busque por um comando ou ação...">
    <Command.Input placeholder="Buscar comando ou ação..." />
    <Command.List>
      <Command.Group heading="Páginas">
        <Command.Item value="dashboard" onSelect={() => handleSelect('dashboard')}>
          <LayoutDashboard aria-hidden="true" />
          Dashboard
          <Command.Shortcut>Ctrl+D</Command.Shortcut>
        </Command.Item>
        <Command.Item value="documents" onSelect={() => handleSelect('documents')}>
          <FileText aria-hidden="true" />
          Documentos
        </Command.Item>
        <Command.Item value="users" onSelect={() => handleSelect('users')}>
          <Users aria-hidden="true" />
          Usuários
        </Command.Item>
      </Command.Group>
      <Command.Separator />
      <Command.Group heading="Configurações">
        <Command.Item value="settings" onSelect={() => handleSelect('settings')}>
          <Settings aria-hidden="true" />
          Configurações
          <Command.Shortcut>Ctrl+,</Command.Shortcut>
        </Command.Item>
      </Command.Group>
    </Command.List>
    <Command.Empty>Nenhum resultado encontrado.</Command.Empty>
  </Command.Dialog>
</div>

<p data-testid="palette-executado">{last}</p>
