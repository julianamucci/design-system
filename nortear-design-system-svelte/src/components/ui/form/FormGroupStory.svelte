<script lang="ts">
	import Input from "@/components/ui/input/input.svelte";
	import FormField from "./form-field.svelte";
	import Fieldset from "./form-fieldset.svelte";
</script>

<Fieldset class="nds-max-w-sm" legend="Endereço de entrega">
	<FormField label="Rua">
		<Input type="text" placeholder="ex: Av. Paulista, 1000" />
	</FormField>
	<FormField label="Cidade">
		<Input type="text" placeholder="ex: São Paulo" />
	</FormField>
</Fieldset>
