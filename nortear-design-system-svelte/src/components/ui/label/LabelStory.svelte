<script lang="ts">
  import { Label } from '@/components/ui/label';
  import { Input } from '@/components/ui/input';
  import DOMPurify from 'dompurify';

  // O par rótulo + campo é o andaime de todas as stories de estado: sem o campo
  // não há como provar a associação, que é a função inteira do componente.
  let {
    class: className = '',
    for: htmlFor = 'label-story',
    children: labelText = 'Label',
    placeholder = 'ex: João da Silva',
    required = false,
    ...rest
  }: {
    class?: string;
    for?: string;
    children?: string;
    placeholder?: string;
    required?: boolean;
    [key: string]: unknown;
  } = $props();
</script>

<div class="nds-stack nds-w-cap-xs" data-spacing="xs">
  <Label for={htmlFor} class={className} {...rest}>
    {@html DOMPurify.sanitize(labelText)}
    {#if required}
      <span class="nds-text-destructive" aria-hidden="true">*</span>
    {/if}
  </Label>
  <Input
    id={htmlFor}
    type={required ? 'email' : 'text'}
    aria-required={required ? 'true' : undefined}
    {placeholder}
  />
</div>
