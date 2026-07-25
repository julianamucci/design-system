<script lang="ts">
  import type { Snippet } from "svelte";
  import { Card } from "@/components/ui/card";

  const { children }: { children: Snippet } = $props();
</script>

<Card class="flex items-center justify-center p-4 mt-2 bg-background">
  {@render children()}
</Card>
