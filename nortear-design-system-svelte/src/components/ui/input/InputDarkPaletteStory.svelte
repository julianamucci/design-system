<script lang="ts">
  import { Input } from '@/components/ui/input';
  import { Label } from '@/components/ui/label';
</script>

<!-- Andaime da story DarkPalette: os três estados que dependem de tokens que
     trocam de valor entre paletas, na mesma captura. -->
<div class="nds-stack nds-w-xs" data-spacing="md">
  <div class="nds-stack" data-spacing="xs">
    <Label for="dk-padrao">Padrão</Label>
    <Input id="dk-padrao" type="text" placeholder="ex: João da Silva" />
  </div>
  <div class="nds-stack" data-spacing="xs">
    <Label for="dk-erro">Com erro</Label>
    <Input id="dk-erro" type="email" aria-invalid="true" aria-describedby="dk-erro-msg" />
    <p id="dk-erro-msg" class="nds-text-body nds-text-destructive">Email inválido</p>
  </div>
  <div class="nds-stack" data-spacing="xs">
    <Label for="dk-off">Desabilitado</Label>
    <Input id="dk-off" type="text" placeholder="Não disponível" disabled />
  </div>
</div>
