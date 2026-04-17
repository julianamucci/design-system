<script lang="ts">
  import { Toaster as SonnerToaster, type ToasterProps } from 'svelte-sonner';

  export let position: ToasterProps['position'] = 'bottom-right';
  export let richColors: boolean = false;
  export let expand: boolean = false;
  export let closeButton: boolean = false;
  export let duration: number = 4000;
  let className: string = '';
  export { className as class };
</script>

<SonnerToaster
  {position}
  {richColors}
  {expand}
  {closeButton}
  {duration}
  class="toaster group {className}"
  toastOptions={{
    classes: {
      toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
      description: 'group-[.toast]:text-muted-foreground',
      actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
      cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
    },
  }}
/>
