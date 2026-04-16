// ─── Exemplos de código — Svelte 5 ────────────────────────────────────────────

export const importExample = `import Button from "@/components/ui/button.svelte"`;

export const basicExample = `<script lang="ts">
  import Button from "@/components/ui/button.svelte"
</script>

<Button>Salvar</Button>`;

export const variantsExample = `<script lang="ts">
  import Button from "@/components/ui/button.svelte"
</script>

<div class="flex gap-2 flex-wrap">
  <Button variant="default">Default</Button>
  <Button variant="secondary">Secondary</Button>
  <Button variant="outline">Outline</Button>
  <Button variant="ghost">Ghost</Button>
  <Button variant="link">Link</Button>
  <Button variant="destructive">Destructive</Button>
</div>`;

export const sizesExample = `<script lang="ts">
  import Button from "@/components/ui/button.svelte"
</script>

<div class="flex items-center gap-2">
  <Button size="sm">Small</Button>
  <Button size="default">Default</Button>
  <Button size="lg">Large</Button>
  <Button size="icon">⚡</Button>
</div>`;

export const withIconExample = `<script lang="ts">
  import Button from "@/components/ui/button.svelte"
  import { Mail } from "lucide-svelte"
</script>

<Button>
  <Mail class="mr-2 h-4 w-4" />
  Enviar email
</Button>`;

export const loadingExample = `<script lang="ts">
  import Button from "@/components/ui/button.svelte"

  let loading = $state(false)

  function handleClick() {
    loading = true
    setTimeout(() => (loading = false), 2000)
  }
</script>

<Button disabled={loading} onclick={handleClick}>
  {loading ? "Aguarde..." : "Salvar"}
</Button>`;

export const asChildExample = `<script lang="ts">
  import Button from "@/components/ui/button.svelte"
</script>

<!-- Svelte: use a tag diretamente ou wrappers para roteamento -->
<Button>
  <a href="/dashboard" class="contents">Ir para Dashboard</a>
</Button>`;
