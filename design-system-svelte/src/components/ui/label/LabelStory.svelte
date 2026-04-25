<script lang="ts">
  import { Label } from '@/components/ui/label';
  import { sanitizeHtml } from '@/lib/sanitize-html';

  let {
    class: className = '',
    for: htmlFor = '',
    children: labelText = 'Label',
    required = false,
    ...rest
  }: {
    class?: string;
    for?: string;
    children?: string;
    required?: boolean;
    [key: string]: unknown;
  } = $props();
</script>

<Label for={htmlFor} class={className} {...rest}>
  {@html sanitizeHtml(labelText)}
  {#if required}
    <span class="text-destructive" aria-hidden="true">*</span>
  {/if}
</Label>
