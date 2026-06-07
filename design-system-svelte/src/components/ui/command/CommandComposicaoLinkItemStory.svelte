<script lang="ts">
  import * as Command from '@/components/ui/command';
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import BookOpen from '@lucide/svelte/icons/book-open';
  // O ícone "github" foi removido do @lucide/svelte (questões de marca).
  // Usamos `code-2` como substituto neutro para representar um link de repositório.
  import Github from '@lucide/svelte/icons/code-2';
</script>

<div class="w-full max-w-sm rounded-xl border shadow-md">
  <Command.Root>
    <Command.Input placeholder="Buscar recurso..." aria-controls="cmd-link-listbox" />
    <Command.List id="cmd-link-listbox">
      <Command.Empty>Nenhum resultado encontrado.</Command.Empty>
      <Command.Group heading="Documentação">
        <Command.LinkItem href="/docs/button" value="docs-button">
          <BookOpen class="mr-2" aria-hidden="true" />
          Button — Docs
          <ExternalLink class="ml-auto opacity-50" aria-hidden="true" />
        </Command.LinkItem>
        <Command.LinkItem href="/docs/input" value="docs-input">
          <BookOpen class="mr-2" aria-hidden="true" />
          Input — Docs
          <ExternalLink class="ml-auto opacity-50" aria-hidden="true" />
        </Command.LinkItem>
      </Command.Group>
      <Command.Separator />
      <Command.Group heading="Links Externos">
        <Command.LinkItem href="https://github.com" value="github" target="_blank">
          <Github class="mr-2" aria-hidden="true" />
          GitHub
          <ExternalLink class="ml-auto opacity-50" aria-hidden="true" />
        </Command.LinkItem>
      </Command.Group>
    </Command.List>
  </Command.Root>
</div>
