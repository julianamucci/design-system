<script lang="ts">
  // As três semânticas juntas: a story mede se são distinguíveis entre si, e
  // isso só se vê com as três na mesma tela.
  import { Badge } from './index';
</script>

<div class="nds-cluster" data-spacing="sm">
  <Badge variant="warning">Vence hoje</Badge>
  <Badge variant="success">Aprovado</Badge>
  <Badge variant="info">Novidade</Badge>
</div>
