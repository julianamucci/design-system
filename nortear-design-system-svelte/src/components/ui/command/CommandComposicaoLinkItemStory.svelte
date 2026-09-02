<script lang="ts">
  import * as Command from '@/components/ui/command';
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import BookOpen from '@lucide/svelte/icons/book-open';
  // O ícone "github" foi removido do @lucide/svelte (questões de marca).
  // Usamos `code-2` como substituto neutro para representar um link de repositório.
  import Github from '@lucide/svelte/icons/code-2';
</script>

<!-- Sem `style` de espaçamento nos ícones: `.nds-command-item` já é um flex com
     `gap: var(--spacing-2)`, e um `margin-right` inline somava 8px ao gap e
     saía da escala quando a densidade muda. -->
<div class="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
  <Command.Root>
    <Command.Input placeholder="Buscar recurso..." />
    <Command.List>
      <Command.Group heading="Documentação">
        <Command.LinkItem href="/docs/button" value="docs-button">
          <BookOpen aria-hidden="true" />
          Button — Docs
          <ExternalLink class="nds-spacer-start nds-opacity-50" aria-hidden="true" />
        </Command.LinkItem>
        <Command.LinkItem href="/docs/input" value="docs-input">
          <BookOpen aria-hidden="true" />
          Input — Docs
          <ExternalLink class="nds-spacer-start nds-opacity-50" aria-hidden="true" />
        </Command.LinkItem>
      </Command.Group>
      <Command.Separator />
      <Command.Group heading="Links Externos">
        <Command.LinkItem
          href="https://github.com"
          value="github"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Github aria-hidden="true" />
          GitHub
          <ExternalLink class="nds-spacer-start nds-opacity-50" aria-hidden="true" />
        </Command.LinkItem>
      </Command.Group>
    </Command.List>
    <Command.Empty>Nenhum resultado encontrado.</Command.Empty>
  </Command.Root>
</div>
