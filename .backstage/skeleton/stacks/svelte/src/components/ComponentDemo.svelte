<script lang="ts">
  import type { Snippet } from 'svelte';

  const { children }: { children: Snippet } = $props();
</script>

<div class="flex items-center justify-center p-4 mt-2 border rounded-xl bg-background shadow-sm">
  {@render children()}
</div>
