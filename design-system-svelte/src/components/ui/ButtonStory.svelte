<script lang="ts">
  import Button from './Button.svelte';
  import type { ButtonVariants } from './Button.svelte';
  import { sanitizeHtml } from '@/lib/sanitize-html';

  let {
    label = 'Botão',
    variant = 'default' as ButtonVariants['variant'],
    size = 'default' as ButtonVariants['size'],
    disabled = false,
    ...rest
  } = $props();
</script>

<Button {variant} {size} {disabled} {...rest}>
  {@html sanitizeHtml(label)}
</Button>
