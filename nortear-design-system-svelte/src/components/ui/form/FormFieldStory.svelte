<script lang="ts">
	import Input from "@/components/ui/input/input.svelte";
	import FormField from "./form-field.svelte";

	let {
		label = "Email",
		description = "",
		error = "",
		type = "email",
		placeholder = "",
		value = "",
		disabled = false,
		ariaInvalid = false,
		autocomplete = undefined,
	}: {
		label?: string;
		description?: string;
		error?: string;
		type?: string;
		placeholder?: string;
		value?: string;
		disabled?: boolean;
		ariaInvalid?: boolean;
		autocomplete?: string;
	} = $props();
</script>

<FormField
	class="nds-max-w-sm"
	{label}
	description={description || undefined}
	error={error || undefined}
>
	<Input
		{type}
		{placeholder}
		{disabled}
		{autocomplete}
		{value}
		aria-invalid={ariaInvalid || !!error ? "true" : undefined}
	/>
</FormField>
