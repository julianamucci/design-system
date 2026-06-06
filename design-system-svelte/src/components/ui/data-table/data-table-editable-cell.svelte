<script lang="ts">
  import { Input } from '@/components/ui/input';

  const {
    initial,
    columnId,
    onCommit,
  }: {
    initial: string | number | null;
    rowIndex: number;
    columnId: string;
    onCommit: (value: unknown) => void;
  } = $props();

  let value = $state<string>(initial == null ? '' : String(initial));
  let editing = $state(false);

  $effect(() => {
    value = initial == null ? '' : String(initial);
  });

  function commit() {
    const isNumber = typeof initial === 'number';
    const next: unknown = isNumber ? Number(value) : value;
    onCommit(next);
    editing = false;
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      value = initial == null ? '' : String(initial);
      editing = false;
    }
  }
</script>

{#if editing}
  <Input
    autofocus
    {value}
    oninput={(e: Event) => (value = (e.currentTarget as HTMLInputElement).value)}
    onblur={commit}
    onkeydown={handleKeyDown}
    class="h-7"
  />
{:else}
  <button
    type="button"
    onclick={() => (editing = true)}
    class="block w-full rounded-sm px-1 py-0.5 text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    aria-label={`Editar ${columnId}`}
  >
    {#if value === ''}
      <span class="text-muted-foreground">—</span>
    {:else}
      {value}
    {/if}
  </button>
{/if}
