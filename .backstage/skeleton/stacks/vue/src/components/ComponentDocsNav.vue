<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Section {
  id: string
  label: string
  block: number
}

const props = defineProps<{
  sections: Section[]
}>()

const blockLabels: Record<number, string> = {
  1: 'Visão Geral',
  2: 'Referência Técnica',
  3: 'Contexto',
  4: 'Qualidade',
}

const activeId = ref(props.sections[0]?.id ?? '')

let observers: IntersectionObserver[] = []

onMounted(() => {
  observers = props.sections.map((section) => {
    const el = document.getElementById(section.id)
    if (!el) return null as unknown as IntersectionObserver

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          activeId.value = section.id
        }
      },
      { rootMargin: '0px 0px -60% 0px', threshold: 0 }
    )
    observer.observe(el)
    return observer
  }).filter(Boolean)
})

onUnmounted(() => {
  observers.forEach((obs) => obs.disconnect())
})

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    activeId.value = id
  }
}

// Group sections by block
const grouped = props.sections.reduce<Record<number, Section[]>>((acc, s) => {
  if (!acc[s.block]) acc[s.block] = []
  acc[s.block].push(s)
  return acc
}, {})
</script>

<template>
  <nav
    class="hidden xl:flex flex-col w-52 shrink-0 sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto space-y-4"
    aria-label="Navegação das seções"
  >
    <div
      v-for="(items, block) in grouped"
      :key="block"
      class="space-y-1"
    >
      <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-1">
        {{ blockLabels[Number(block)] }}
      </p>
      <button
        v-for="section in items"
        :key="section.id"
        class="w-full text-left px-2 py-1 text-sm rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :class="activeId === section.id
          ? 'text-foreground font-medium bg-accent'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'"
        :aria-current="activeId === section.id ? 'location' : undefined"
        @click="scrollTo(section.id)"
      >
        {{ section.label }}
      </button>
    </div>
  </nav>
</template>
