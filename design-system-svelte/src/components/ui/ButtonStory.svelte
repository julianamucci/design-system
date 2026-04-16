<script lang="ts">
  import Button from './Button.svelte';
  import type { ButtonVariants } from './Button.svelte';

  let {
    label = 'Botão',
    variant = 'default' as ButtonVariants['variant'],
    size = 'default' as ButtonVariants['size'],
    disabled = false,
    ...rest
  } = $props();
</script>

<Button {variant} {size} {disabled} {...rest}>
  {@html label}
</Button>
