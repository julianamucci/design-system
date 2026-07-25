<script lang="ts" setup>
import type { ToasterProps } from 'vue-sonner'

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-vue-next'
import { Toaster as Sonner } from 'vue-sonner'
import { cn } from '@/lib/utils'

const props = defineProps<ToasterProps>()
</script>

<template>
  <Sonner
    :class="cn('toaster', props.class)"
    :style="{
      '--normal-bg': 'var(--popover)',
      '--normal-text': 'var(--popover-foreground)',
      '--normal-border': 'var(--border)',
      '--border-radius': 'var(--radius)',
    }"
    v-bind="props"
    :toast-options="props.toastOptions ?? {}"
  >
    <template #success-icon>
      <CircleCheckIcon class="nds-toast-icon" />
    </template>
    <template #info-icon>
      <InfoIcon class="nds-toast-icon" />
    </template>
    <template #warning-icon>
      <TriangleAlertIcon class="nds-toast-icon" />
    </template>
    <template #error-icon>
      <OctagonXIcon class="nds-toast-icon" />
    </template>
    <template #loading-icon>
      <div>
        <Loader2Icon class="nds-toast-icon nds-toast-icon-spin" />
      </div>
    </template>
    <template #close-icon>
      <XIcon class="nds-toast-icon" />
    </template>
  </Sonner>
</template>
