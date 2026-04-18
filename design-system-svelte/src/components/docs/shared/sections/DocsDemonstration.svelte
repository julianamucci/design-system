<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Card, CardContent } from '@/components/ui/card';

  const { title, children }: { title: string; children: Snippet } = $props();
</script>

<section id="demonstracao">
  <h2 class="text-xl font-semibold mb-4">{title}</h2>
  <Card>
    <CardContent class="p-10 mt-6 flex items-center justify-center">
      {@render children()}
    </CardContent>
  </Card>
</section>
