<script lang="ts">
  import type { Snippet } from "svelte";
  import { Card } from "@/components/ui/card";

  const { children }: { children: Snippet } = $props();
</script>

<Card class="nds-docs-demo" data-docs-preview="demonstracao">
  {@render children()}
</Card>
