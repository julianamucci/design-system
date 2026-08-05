<script lang="ts">
  import { Slider } from './index';
  import { Label } from '@/components/ui/label';

  let brightness = $state<number[]>([70]);
  let opacity = $state<number[]>([100]);
</script>

<form class="" data-spacing="lg" style="width: 20rem" onsubmit={(e) => e.preventDefault()}>
  <div class="nds-stack" data-spacing="sm">
    <Label for="form-name">Nome do preset</Label>
    <input
      id="form-name"
      type="text"
      placeholder="Meu preset"
      class="nds-w-full nds-rounded-md nds-border-default nds-border-default nds-bg-background nds-text-body nds-focus-ring" style="height: var(--height-default); padding-inline: 0.75rem" 
    />
  </div>

  <div class="nds-stack" data-spacing="sm">
    <div class="nds-cluster" data-justify="between">
      <Label>Brilho</Label>
      <span class="nds-text-body nds-tabular-nums" aria-live="polite">{brightness[0]}%</span>
    </div>
    <Slider bind:value={brightness} min={0} max={100} aria-label="Brilho" />
  </div>

  <div class="nds-stack" data-spacing="sm">
    <div class="nds-cluster" data-justify="between">
      <Label>Opacidade</Label>
      <span class="nds-text-body nds-tabular-nums" aria-live="polite">{opacity[0]}%</span>
    </div>
    <Slider bind:value={opacity} min={0} max={100} aria-label="Opacidade" />
  </div>

  <button
    type="submit"
    class="nds-w-full nds-px-4 nds-rounded-md nds-bg-primary nds-text-primary-foreground nds-text-body nds-font-medium nds-hover-bg-primary-90 nds-transition-colors" style="height: var(--height-default)"
  >
    Salvar preset
  </button>
</form>
