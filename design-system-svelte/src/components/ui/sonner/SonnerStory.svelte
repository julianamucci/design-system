<script lang="ts">
  import { Toaster } from './index.ts';
  import type { ToasterProps } from 'svelte-sonner';

  let { ...args }: ToasterProps = $props();
</script>

<Toaster {...args} />
