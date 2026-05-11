<script lang="ts">
  import { Slider } from './index';
  import { Label } from '@/components/ui/label';

  let brightness = $state<number[]>([70]);
  let opacity = $state<number[]>([100]);
</script>

<form class="space-y-6 w-80" onsubmit={(e) => e.preventDefault()}>
  <div class="space-y-2">
    <Label for="form-name">Nome do preset</Label>
    <input
      id="form-name"
      type="text"
      placeholder="Meu preset"
      class="w-full h-(--height-default) px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    />
  </div>

  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <Label>Brilho</Label>
      <span class="text-sm tabular-nums" aria-live="polite">{brightness[0]}%</span>
    </div>
    <Slider bind:value={brightness} min={0} max={100} aria-label="Brilho" />
  </div>

  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <Label>Opacidade</Label>
      <span class="text-sm tabular-nums" aria-live="polite">{opacity[0]}%</span>
    </div>
    <Slider bind:value={opacity} min={0} max={100} aria-label="Opacidade" />
  </div>

  <button
    type="submit"
    class="w-full h-(--height-default) px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
  >
    Salvar preset
  </button>
</form>
