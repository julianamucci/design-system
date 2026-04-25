<script lang="ts">
  import { Input } from '@/components/ui/input';

  interface Props {
    type?: string;
    placeholder?: string;
    disabled?: boolean;
    'aria-invalid'?: 'true' | 'false';
    value?: string;
    class?: string;
    [key: string]: unknown;
  }

  let {
    type = 'text',
    placeholder = '',
    disabled = false,
    'aria-invalid': ariaInvalid,
    value = $bindable(''),
    class: className = '',
    ...rest
  }: Props = $props();
</script>

<Input
  {type}
  {placeholder}
  {disabled}
  aria-invalid={ariaInvalid}
  bind:value
  class={className}
  {...rest}
/>
