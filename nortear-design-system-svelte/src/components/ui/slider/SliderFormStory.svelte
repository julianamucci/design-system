<script lang="ts">
  import { Slider } from './index';
  import { Label } from '@/components/ui/label';
  import { Input } from '@/components/ui/input';
  import { Button } from '@/components/ui/button';

  let brightness = $state<number[]>([70]);
  let opacity = $state<number[]>([100]);
  let salvo = $state('');

  // Campo e botão vêm dos primitivos do próprio design system. Antes eram
  // markup à mão com `style` inline (`padding-inline: 0.75rem`, um degrau que
  // nem existe na escala) — o andaime saía do tema, da densidade e da escala,
  // e ainda divergia do que a docs page mostra.
</script>

<form
  class="nds-stack nds-w-sm"
  data-spacing="md"
  aria-label="Configurações de áudio"
  onsubmit={(e) => {
    e.preventDefault();
    salvo = `Brilho ${brightness[0]}% · Opacidade ${opacity[0]}%`;
  }}
>
  <div class="nds-stack" data-spacing="sm">
    <Label for="form-name">Nome do preset</Label>
    <Input id="form-name" placeholder="Meu preset" />
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

  <Button type="submit" size="sm">Salvar preset</Button>
  <p class="nds-text-caption nds-text-muted-foreground" aria-live="polite">{salvo}</p>
</form>
