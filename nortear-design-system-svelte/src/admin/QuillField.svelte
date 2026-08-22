<script lang="ts">
/**
 * QuillField — campo de texto rico do editor de documentação.
 *
 * O `DocsEditor` já o invocava, e ele não existia em lugar nenhum: o Svelte
 * compila componente desconhecido sem reclamar, então o ramo de conteúdo HTML
 * do editor abria vazio e o único aviso era o do verificador de tipos, que a
 * stack não rodava. React e Vue têm o equivalente desde sempre; aqui ele
 * faltava.
 *
 * Quill entra por importação dinâmica no `onMount`: o pacote toca `document` ao
 * ser avaliado, e o editor só é montado sob `?view=admin`.
 */
import { onMount } from 'svelte';

const {
  fieldKey,
  value = '',
  onchange,
}: {
  fieldKey: string;
  value?: string;
  onchange: (fieldKey: string, valor: string) => void;
} = $props();

let container = $state<HTMLDivElement | null>(null);
/** Tipado pelo que este arquivo usa, e não pelo tipo do pacote: a importação é
 *  dinâmica e o editor só existe depois de montado. */
let editor: { root: HTMLElement; on: (e: string, f: () => void) => void; off: (e: string, f?: () => void) => void } | null =
  null;

onMount(() => {
  let vivo = true;
  let onChange: (() => void) | null = null;

  void (async () => {
    const { default: Quill } = await import('quill');
    if (!vivo || !container) return;

    const quill = new Quill(container, {
      theme: 'snow',
      modules: {
        toolbar: [['bold', 'italic', 'code'], [{ list: 'ordered' }, { list: 'bullet' }], ['link', 'clean']],
      },
    });

    quill.root.innerHTML = value;
    onChange = () => onchange(fieldKey, quill.root.innerHTML);
    quill.on('text-change', onChange);
    editor = quill;

    // O reset de CSS do design system zera a altura mínima da área de edição,
    // e um editor de altura zero não recebe clique.
    container.querySelector<HTMLElement>('.ql-editor')?.style.setProperty('min-height', '80px');
  })();

  return () => {
    vivo = false;
    if (onChange) editor?.off('text-change', onChange);
    editor = null;
  };
});

// Troca de idioma reescreve o conteúdo por fora; sem isto o editor continuaria
// mostrando o texto do idioma anterior.
$effect(() => {
  const atual = value;
  if (editor && editor.root.innerHTML !== atual) editor.root.innerHTML = atual;
});
</script>

<div
  bind:this={container}
  class="rounded-md border border-border bg-background"
></div>
