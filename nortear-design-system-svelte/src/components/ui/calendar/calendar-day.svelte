<script lang="ts">
	import { cn } from "@/lib/utils.js";
	import { Calendar as CalendarPrimitive } from "bits-ui";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: CalendarPrimitive.DayProps = $props();
</script>

<CalendarPrimitive.Day
	bind:ref
	class={cn(
		"nds-calendar-day-btn",
		"",
		"",
		"",
		"",
		// Outside months
		"",
		// Disabled
		"",
		// Unavailable
		"",
		// focus
		"",
		// inner spans
		"",
		className
	)}
	{...restProps}
/>
