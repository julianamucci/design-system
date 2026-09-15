<script lang="ts">
  // As cinco variantes juntas: o que elas prometem é serem distinguíveis entre
  // si, e isso só se vê com todas na mesma tela.
  import { Badge } from './index';
</script>

<div class="nds-cluster" data-spacing="sm">
  <Badge variant="default">Novo</Badge>
  <Badge variant="destructive">Urgente</Badge>
  <Badge variant="warning">Vence hoje</Badge>
  <Badge variant="success">Aprovado</Badge>
  <Badge variant="info">Novidade</Badge>
</div>
