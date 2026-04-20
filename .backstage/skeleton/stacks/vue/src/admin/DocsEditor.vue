<script setup lang="ts">
/**
 * DocsEditor.vue — editor visual de documentação com Quill.js.
 * Acesse em: http://localhost:5173/?view=admin  (modo dev)
 */
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { useDocs } from './useDocs';
import type { Locale } from '@/lib/i18n';

const LOCALES: Locale[] = ['pt-BR', 'en', 'es'];
const LOCALE_LABELS: Record<Locale, string> = { 'pt-BR': '🇧🇷 PT', en: '🇺🇸 EN', es: '🇪🇸 ES' };

// ─── Estado ───────────────────────────────────────────────────────────────────
const components = ref<string[]>([]);
const activeComponent = ref('button');
const { data, loading, saving, dirty, error, locale, setComponent, updateField, save } =
  useDocs(activeComponent.value);

const localeData = computed(() => data.value?.[locale.value] ?? {});

function changeComponent(name: string) {
  activeComponent.value = name;
  setComponent(name);
}

// ─── Lista de componentes ─────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const r = await fetch('/api/docs/__components');
    components.value = await r.json() as string[];
  } catch {
    components.value = [activeComponent.value];
  }

  // Atalho Ctrl+S
  window.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

function handleKeyDown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    save();
  }
}
</script>

<template>
  <div class="flex h-screen bg-background text-foreground font-sans">

    <!-- Sidebar -->
    <aside class="w-56 shrink-0 border-r border-border flex flex-col">
      <div class="flex h-14 items-center gap-2 border-b border-border px-4">
        <span class="font-semibold text-sm">Docs Editor</span>
        <span v-if="dirty" class="ml-auto h-2 w-2 rounded-full bg-warning" title="Não salvo" />
      </div>

      <nav class="flex-1 overflow-y-auto py-2">
        <p v-if="!components.length" class="px-4 text-xs text-muted-foreground">Carregando...</p>
        <button
          v-for="comp in components"
          :key="comp"
          @click="changeComponent(comp)"
          class="w-full px-4 py-2 text-left text-sm transition-colors"
          :class="activeComponent === comp
            ? 'bg-muted font-medium text-foreground'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'"
        >
          {{ comp }}
        </button>
      </nav>

      <!-- Locale switcher -->
      <div class="border-t border-border p-3 flex gap-1">
        <button
          v-for="l in LOCALES"
          :key="l"
          @click="locale = l"
          class="flex-1 rounded py-1 text-xs transition-colors"
          :class="locale === l
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'"
        >
          {{ LOCALE_LABELS[l] }}
        </button>
      </div>
    </aside>

    <!-- Editor area -->
    <div class="flex flex-1 flex-col overflow-hidden">

      <!-- Toolbar -->
      <header class="flex h-14 items-center gap-3 border-b border-border px-6">
        <h1 class="text-sm font-semibold">{{ activeComponent }}</h1>
        <span class="text-xs text-muted-foreground">{{ LOCALE_LABELS[locale] }}</span>
        <span v-if="error" class="text-xs text-destructive">Erro: {{ error }}</span>
        <div class="ml-auto flex items-center gap-2">
          <span v-if="dirty" class="text-xs text-warning">Alterações não salvas</span>
          <button
            @click="save"
            :disabled="saving || !dirty"
            class="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50"
          >
            {{ saving ? 'Salvando...' : 'Salvar' }}
          </button>
          <span class="text-xs text-muted-foreground">Ctrl+S</span>
        </div>
      </header>

      <!-- Fields -->
      <main class="flex-1 overflow-y-auto p-6">
        <div v-if="loading" class="flex h-32 items-center justify-center">
          <div class="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
        <div v-else class="max-w-2xl space-y-6">
          <FieldEditor
            v-for="(value, key) in localeData"
            :key="key"
            :field-key="String(key)"
            :value="value"
            @change="updateField"
          />
        </div>
      </main>
    </div>
  </div>
</template>

<script lang="ts">
// ─── FieldEditor sub-component ───────────────────────────────────────────────
import { defineComponent, h, ref, watch, onMounted, onBeforeUnmount, type PropType } from 'vue';

export const FieldEditor = defineComponent({
  name: 'FieldEditor',
  props: {
    fieldKey: { type: String, required: true },
    value:    { type: [String, Object, Array] as PropType<unknown>, required: true },
    depth:    { type: Number, default: 0 },
  },
  emits: ['change'],
  setup(props, { emit }) {
    const isHtml   = () => typeof props.value === 'string' && /<[a-z]/i.test(props.value as string);
    const isNested = () => typeof props.value === 'object' && props.value !== null && !Array.isArray(props.value);
    const label    = () => props.fieldKey.split('.').at(-1) ?? props.fieldKey;

    const containerRef = ref<HTMLDivElement | null>(null);
    const quillRef     = ref<Quill | null>(null);

    onMounted(() => {
      if (!isHtml() || !containerRef.value) return;

      const quill = new Quill(containerRef.value, {
        theme: 'snow',
        modules: { toolbar: [['bold', 'italic', 'code'], ['link', 'clean']] },
      });
      quill.root.innerHTML = (props.value as string) ?? '';
      quill.on('text-change', () => emit('change', props.fieldKey, quill.root.innerHTML));
      quillRef.value = quill;
    });

    onBeforeUnmount(() => quillRef.value?.off('text-change'));

    watch(() => props.value, (v) => {
      const q = quillRef.value;
      if (q && typeof v === 'string' && q.root.innerHTML !== v) q.root.innerHTML = v;
    });

    return { isHtml, isNested, label, containerRef };
  },
  render() {
    const { fieldKey, value, depth } = this;
    const label = fieldKey.split('.').at(-1) ?? fieldKey;

    if (this.isNested()) {
      return h('div', { class: `space-y-3 ${depth > 0 ? 'pl-4 border-l border-border' : ''}` }, [
        h('p', { class: 'text-xs font-semibold uppercase tracking-wide text-muted-foreground' }, label),
        ...Object.entries(value as Record<string, unknown>).map(([k, v]) =>
          h(FieldEditor, {
            fieldKey: `${fieldKey}.${k}`,
            value: v,
            depth: depth + 1,
            onChange: (key: string, val: string) => this.$emit('change', key, val),
          })
        ),
      ]);
    }

    if (this.isHtml()) {
      return h('div', { class: 'space-y-1' }, [
        h('label', { class: 'text-xs font-medium text-muted-foreground' }, label),
        h('div', {
          ref: 'containerRef',
          class: 'rounded-md border border-border bg-background [&_.ql-editor]:min-h-[80px] [&_.ql-editor]:text-foreground',
        }),
      ]);
    }

    return h('div', { class: 'space-y-1' }, [
      h('label', { class: 'text-xs font-medium text-muted-foreground' }, label),
      h('input', {
        type: 'text',
        value: String(value ?? ''),
        class: 'w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring',
        onInput: (e: Event) => this.$emit('change', fieldKey, (e.target as HTMLInputElement).value),
      }),
    ]);
  },
});
</script>
