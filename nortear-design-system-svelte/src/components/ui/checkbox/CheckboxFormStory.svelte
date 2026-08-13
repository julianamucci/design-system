<script lang="ts">
  import { Checkbox } from './index';
  import { Label } from '@/components/ui/label';
  import { Button } from '@/components/ui/button';

  interface Props {
    checked?: boolean;
    name?: string;
    value?: string;
    labelText?: string;
    id?: string;
    onSubmit?: (data: FormData) => void;
  }

  let {
    checked = $bindable(false),
    name = 'termos',
    value = 'aceito',
    labelText = 'Aceito os termos e condições',
    id = 'cb-in-form',
    onSubmit = undefined,
  }: Props = $props();

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    onSubmit?.(new FormData(form));
  }
</script>

<form onsubmit={handleSubmit} class="nds-stack" data-spacing="md">
  <div class="nds-cluster" data-spacing="sm">
    <Checkbox {id} bind:checked {name} {value} />
    <Label for={id}>{labelText}</Label>
  </div>
  <Button type="submit">Enviar</Button>
</form>
