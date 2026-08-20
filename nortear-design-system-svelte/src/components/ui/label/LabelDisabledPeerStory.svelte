<script lang="ts">
  import { Label } from '@/components/ui/label';
  import { Input } from '@/components/ui/input';
</script>

<!-- A marca nds-peer vai no CONTROLE; o rótulo não recebe classe nenhuma. -->
<div class="nds-stack nds-w-cap-xs" data-spacing="xs">
  <Input id="cpf-disabled" disabled class="nds-peer" placeholder="000.000.000-00" />
  <Label for="cpf-disabled">CPF</Label>
</div>
