<script lang="ts">
  import { Switch } from './index';
  import { Label } from '@/components/ui/label';
  import { Button } from '@/components/ui/button';

  interface Props {
    checked?: boolean;
    name?: string;
    id?: string;
    labelText?: string;
    submitLabel?: string;
  }

  let {
    checked = $bindable(true),
    name = 'newsletter',
    id = 'comp-newsletter',
    labelText = 'Aceitar newsletter semanal',
    submitLabel = 'Salvar preferências',
  }: Props = $props();
</script>

<!-- `name` é o que faz o controle entrar no envio nativo: sem ele o campo não
     aparece no FormData, e nada no visual denuncia. -->
<form class="nds-stack nds-w-sm" data-spacing="sm" onsubmit={(e) => e.preventDefault()}>
  <div class="nds-cluster" data-spacing="sm">
    <Switch {id} {name} bind:checked aria-labelledby="{id}-label" />
    <Label id="{id}-label" for={id} class="nds-text-body nds-font-medium">
      {labelText}
    </Label>
  </div>
  <Button type="submit">{submitLabel}</Button>
</form>
