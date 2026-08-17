<script lang="ts">
	import Input from "@/components/ui/input/input.svelte";
	import FormField from "./form-field.svelte";
	import Fieldset from "./form-fieldset.svelte";
</script>

<div class="nds-stack nds-max-w-sm">
	<FormField label="Nome completo">
		<Input type="text" placeholder="ex: João da Silva" />
	</FormField>
	<FormField
		label="Email"
		description="Usaremos apenas para contato."
		error="Endereço de email incompleto."
	>
		<Input type="email" value="joao@" aria-invalid="true" />
	</FormField>
	<Fieldset legend="Endereço de entrega">
		<FormField label="Cidade">
			<Input type="text" value="São Paulo" disabled />
		</FormField>
	</Fieldset>
</div>
