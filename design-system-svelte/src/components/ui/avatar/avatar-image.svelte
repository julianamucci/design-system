<script lang="ts">
	import { Avatar as AvatarPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: AvatarPrimitive.ImageProps = $props();
</script>

<!-- PATCH: bugfix — object-cover evita distorção de imagens não-quadradas em container circular (ver PATCHES.md#avatar-object-cover) -->
<AvatarPrimitive.Image
	bind:ref
	data-slot="avatar-image"
	class={cn("aspect-square h-full w-full object-cover", className)}
	{...restProps}
/>
