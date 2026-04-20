<script setup lang="ts">
import { ref } from 'vue';
import { Image as ImageIcon } from 'lucide-vue-next';

defineOptions({ inheritAttrs: false });

interface Props {
  src?: string;
  alt?: string;
  fallbackText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  fallbackText: 'Image not available',
});

const error = ref(false);

const handleError = () => {
  error.value = true;
};
</script>

<template>
  <div 
    v-if="error || !src" 
    class="flex flex-col items-center justify-center bg-muted/20 text-muted-foreground w-full h-full min-h-[200px] border rounded-md" 
    v-bind="$attrs"
  >
    <ImageIcon class="w-10 h-10 mb-2 opacity-50" />
    <span class="text-sm">{{ fallbackText }}</span>
  </div>
  
  <img 
    v-else
    :src="src" 
    :alt="alt" 
    @error="handleError" 
    v-bind="$attrs"
  />
</template>
