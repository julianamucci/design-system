<script lang="ts">
  import { Switch } from './index';
  import { Label } from '@/components/ui/label';

  interface Props {
    checked?: boolean;
    id?: string;
    labelText?: string;
  }

  // O estado vive FORA do componente: `bind:checked` é a ligação de ida e
  // volta. Passar só o valor, sem a volta, deixaria o interruptor inerte.
  let {
    checked = $bindable(false),
    id = 'comp-controlled',
    labelText = 'Receber notificações',
  }: Props = $props();
</script>

<div class="nds-stack nds-w-sm" data-align="start" data-spacing="sm">
  <div class="nds-cluster" data-spacing="sm">
    <Switch {id} bind:checked aria-labelledby="{id}-label" />
    <Label id="{id}-label" for={id} class="nds-text-body nds-font-medium">
      {labelText}
    </Label>
  </div>
  <p class="nds-text-caption nds-text-muted-foreground">
    Estado atual: <code class="nds-font-mono">{checked}</code>
  </p>
</div>
