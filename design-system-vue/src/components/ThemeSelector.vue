<script setup lang="ts">
import { ref } from 'vue'
import { Palette, Check } from 'lucide-vue-next'

defineProps<{
  currentTheme: string
}>()

const emit = defineEmits<{
  themeChange: [theme: string]
}>()

const open = ref(false)

const themes = [
  { id: 'default', name: 'Padrão' },
  { id: 'tema-personalizado', name: 'Tema Personalizado' },
]

function select(id: string) {
  emit('themeChange', id)
  open.value = false
}
</script>

<template>
  <div class="relative">
    <button
      class="h-8 w-8 p-0 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
      aria-label="Selecionar tema"
      :aria-expanded="open"
      @click="open = !open"
    >
      <Palette class="h-4 w-4" aria-hidden="true" />
    </button>

    <div
      v-if="open"
      class="absolute right-0 mt-1 w-44 rounded-md border border-border bg-popover text-popover-foreground shadow-md z-50"
      role="menu"
    >
      <button
        v-for="theme in themes"
        :key="theme.id"
        class="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
        role="menuitem"
        @click="select(theme.id)"
      >
        <span>{{ theme.name }}</span>
        <Check v-if="currentTheme === theme.id" class="h-4 w-4" aria-hidden="true" />
      </button>
    </div>

    <!-- Backdrop to close dropdown -->
    <div
      v-if="open"
      class="fixed inset-0 z-40"
      aria-hidden="true"
      @click="open = false"
    />
  </div>
</template>
