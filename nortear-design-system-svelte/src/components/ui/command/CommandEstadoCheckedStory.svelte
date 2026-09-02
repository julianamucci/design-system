<script lang="ts">
  import * as Command from '@/components/ui/command';
</script>

<div class="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
  <Command.Root>
    <Command.Input placeholder="Buscar tema..." />
    <Command.List>
      <Command.Group heading="Aparência">
        <Command.Item value="claro" checked={true}>Claro</Command.Item>
        <Command.Item value="escuro" checked={false}>Escuro</Command.Item>
        <!-- Marca e atalho no mesmo comando: a folha esconde a marca por
             `:has([data-slot="command-shortcut"])`, senão os dois disputariam
             a borda direita. -->
        <Command.Item value="sistema" checked={true}>
          Sistema
          <Command.Shortcut>Ctrl+S</Command.Shortcut>
        </Command.Item>
      </Command.Group>
    </Command.List>
    <Command.Empty>Nenhum resultado encontrado.</Command.Empty>
  </Command.Root>
</div>
