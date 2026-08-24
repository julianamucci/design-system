<script lang="ts">
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { cn } from '@/lib/utils.js';

	let { class: className }: { class?: string } = $props();
</script>

<ChevronDownIcon
	class={cn('nds-combobox-icon', className)}
	data-slot="combobox-icon"
	aria-hidden="true"
/>
