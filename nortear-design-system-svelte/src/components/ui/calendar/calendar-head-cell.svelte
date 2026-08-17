<script lang="ts">
	import { Calendar as CalendarPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: CalendarPrimitive.HeadCellProps = $props();
</script>

<!--
`scope="col"`: a lib devolve um <th> sem escopo, e um <th> sem escopo é
cabeçalho de nada. As outras stacks o declaram; esta ficava de fora.
-->
<CalendarPrimitive.HeadCell
	bind:ref
	scope="col"
	class={cn(
		"nds-calendar-weekday",
		className
	)}
	{...restProps}
/>
