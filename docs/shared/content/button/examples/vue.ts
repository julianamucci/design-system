// ─── Exemplos de código — Vue 3 ───────────────────────────────────────────────

export const importExample = `import { Button } from "@/components/ui/button"`;

export const basicExample = `<script setup lang="ts">
import { Button } from "@/components/ui/button"
</script>

<template>
  <Button>Salvar</Button>
</template>`;

export const variantsExample = `<script setup lang="ts">
import { Button } from "@/components/ui/button"
</script>

<template>
  <div class="flex gap-2 flex-wrap">
    <Button variant="default">Default</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="link">Link</Button>
    <Button variant="destructive">Destructive</Button>
  </div>
</template>`;

export const sizesExample = `<script setup lang="ts">
import { Button } from "@/components/ui/button"
</script>

<template>
  <div class="flex items-center gap-2">
    <Button size="sm">Small</Button>
    <Button size="default">Default</Button>
    <Button size="lg">Large</Button>
    <Button size="icon">⚡</Button>
  </div>
</template>`;

export const withIconExample = `<script setup lang="ts">
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-vue-next"
</script>

<template>
  <Button>
    <Mail class="mr-2 h-4 w-4" />
    Enviar email
  </Button>
</template>`;

export const loadingExample = `<script setup lang="ts">
import { ref } from "vue"
import { Button } from "@/components/ui/button"

const loading = ref(false)

function handleClick() {
  loading.value = true
  setTimeout(() => (loading.value = false), 2000)
}
</script>

<template>
  <Button :disabled="loading" @click="handleClick">
    {{ loading ? "Aguarde..." : "Salvar" }}
  </Button>
</template>`;

export const asChildExample = `<script setup lang="ts">
import { Button } from "@/components/ui/button"
import { RouterLink } from "vue-router"
</script>

<template>
  <Button as-child>
    <RouterLink to="/dashboard">Ir para Dashboard</RouterLink>
  </Button>
</template>`;
