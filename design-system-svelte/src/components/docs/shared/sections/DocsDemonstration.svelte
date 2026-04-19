<script lang="ts">
  import type { Snippet } from 'svelte';
  import ComponentDemo from '@/components/ComponentDemo.svelte';

  const { title, children }: { title: string; children: Snippet } = $props();
</script>

<section id="demonstracao">
  <h2 class="text-xl font-semibold mb-4">{title}</h2>
  <ComponentDemo>
    {@render children()}
  </ComponentDemo>
</section>
