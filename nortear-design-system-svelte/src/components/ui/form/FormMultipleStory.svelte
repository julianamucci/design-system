<script lang="ts">
	import Input from "@/components/ui/input/input.svelte";
	import Textarea from "@/components/ui/textarea/textarea.svelte";
	import { Button } from "@/components/ui/button/index.js";
	import FormField from "./form-field.svelte";
</script>

<form class="nds-stack nds-max-w-sm" onsubmit={(e: Event) => e.preventDefault()}>
	<FormField label="Nome completo" description="Como aparece em documentos oficiais.">
		<Input type="text" name="nome" placeholder="ex: João da Silva" />
	</FormField>
	<FormField label="Email">
		<Input type="email" name="email" placeholder="ex: joao@empresa.com" />
	</FormField>
	<FormField label="Biografia" description="Máximo 280 caracteres.">
		<Textarea name="bio" rows={3} />
	</FormField>
	<Button type="submit">Salvar</Button>
</form>
