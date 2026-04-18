<script lang="ts">
  import type { Snippet } from 'svelte';
  const { title, children }: { title: string; children: Snippet } = $props();
</script>

<section id="demonstracao">
  <h2 class="text-xl font-semibold mb-4">{title}</h2>
  <div class="flex items-center justify-center p-10 mt-6 border rounded-xl bg-background shadow-sm">
    {@render children()}
  </div>
</section>
