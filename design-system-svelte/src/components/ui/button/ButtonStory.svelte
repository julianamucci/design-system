<script lang="ts">
  import { Button, type ButtonVariant, type ButtonSize } from '@/components/ui/button';
  import { sanitizeHtml } from '@/lib/sanitize-html';

  let {
    label = 'Botão',
    variant = 'default' as ButtonVariant,
    size = 'default' as ButtonSize,
    disabled = false,
    ...rest
  } = $props();
</script>

<Button {variant} {size} {disabled} {...rest}>
  {@html sanitizeHtml(label)}
</Button>
