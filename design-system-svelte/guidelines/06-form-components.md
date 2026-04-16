# Form Components

---

## Button

**Propósito**: elemento de ação primária — dispara submissões, confirmações, navegações e qualquer ação do usuário.

**Variantes**: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`

**Tamanhos**: `default`, `sm`, `lg`, `icon`

**Implementação**:
```svelte
<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Trash2, Plus, Loader2 } from 'lucide-svelte';
  import { track } from '$lib/analytics';

  let enviando = $state(false);
</script>

<!-- Botão simples -->
<Button variant="default" onclick={handleSalvar}>Salvar</Button>

<!-- Botão de submit em form -->
<Button type="submit" disabled={enviando}>
  {#if enviando}
    <Loader2 class="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
    Salvando...
  {:else}
    Salvar
  {/if}
</Button>

<!-- Botão icon-only — aria-label obrigatório -->
<Button size="icon" aria-label="Excluir produto Cadeira Gamer Pro">
  <Trash2 class="h-4 w-4" aria-hidden="true" />
</Button>

<!-- Com analytics -->
<Button
  onclick={() => {
    track('button_click', {
      component: 'button',
      variant: 'default',
      location: 'checkout_form',
      label: 'Finalizar compra'
    });
    handleCheckout();
  }}
>
  Finalizar compra
</Button>
```

**Acessibilidade**:
- `aria-label` **contextual** em botões ambíguos — verbo + objeto + identificador
- Ícones dentro do botão: sempre `aria-hidden="true"`
- Botão icon-only: `aria-label` obrigatório

---

## Form (Superforms + Zod)

**Propósito**: formulários com validação tipada, error handling e UX de acessibilidade.

**Stack obrigatória**: `superforms` (sveltekit-superforms) + `Zod`

**Implementação**:
```svelte
<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { z } from 'zod';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  const schema = z.object({
    email: z.string().email('E-mail inválido'),
    nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  });

  const { form, errors, enhance } = superForm(
    { email: '', nome: '' },
    { validators: zodClient(schema) }
  );
</script>

<form use:enhance>
  <div class="space-y-2">
    <Label for="email">E-mail</Label>
    <Input
      id="email"
      type="email"
      bind:value={$form.email}
      aria-describedby={$errors.email ? 'email-error' : undefined}
      aria-invalid={!!$errors.email}
    />
    {#if $errors.email}
      <p id="email-error" class="text-destructive" role="alert">
        {$errors.email}
      </p>
    {/if}
  </div>

  <Button type="submit">Enviar</Button>
</form>
```

**Acessibilidade**:
- `aria-describedby` apontando para o ID da mensagem de erro
- `aria-invalid="true"` no campo com erro
- `role="alert"` na mensagem de erro para anunciar ao leitor de tela

---

## Input

**Implementação**:
```svelte
<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
</script>

<div class="space-y-2">
  <Label for="nome">Nome completo</Label>
  <Input
    id="nome"
    type="text"
    placeholder="ex: Ana Paula Silva"
    class="bg-input border-input"
  />
</div>
```

**Regras**:
- `Label` sempre associado via `for`/`id`
- Placeholder: exemplo real — nunca instrução ("ex: ana@empresa.com")
- Tokens obrigatórios: `bg-input border-input`

---

## Select

**Implementação**:
```svelte
<script lang="ts">
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
</script>

<Select>
  <SelectTrigger aria-label="Selecione uma categoria">
    <SelectValue placeholder="Selecione..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="layout">Layout</SelectItem>
    <SelectItem value="form">Formulário</SelectItem>
  </SelectContent>
</Select>
```

**Atenção**: Select nativo do Bits UI não possui busca integrada. Para busca: usar **Combobox** (Command + Popover). Ver `10-overlay-components.md`.

---

## Checkbox

```svelte
<script lang="ts">
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Label } from '$lib/components/ui/label';
</script>

<div class="flex items-center space-x-2">
  <Checkbox id="termos" />
  <Label for="termos">Aceito os termos de uso</Label>
</div>
```

---

## Switch

```svelte
<script lang="ts">
  import { Switch } from '$lib/components/ui/switch';
  import { Label } from '$lib/components/ui/label';
</script>

<div class="flex items-center space-x-2">
  <Switch id="notificacoes" />
  <Label for="notificacoes">Receber notificações</Label>
</div>
```

---

## Textarea

```svelte
<script lang="ts">
  import { Textarea } from '$lib/components/ui/textarea';
  import { Label } from '$lib/components/ui/label';
</script>

<div class="space-y-2">
  <Label for="mensagem">Mensagem</Label>
  <Textarea id="mensagem" placeholder="ex: Descreva seu problema detalhadamente" rows={4} />
</div>
```

---

## Calendar

**Propósito**: seletor de data interativo.

**Implementação**:
```svelte
<script lang="ts">
  import { Calendar } from '$lib/components/ui/calendar';
  import type { DateValue } from '@internationalized/date';

  let dataSelecionada: DateValue | undefined = $state(undefined);
</script>

<Calendar bind:value={dataSelecionada} />
```

**Acessibilidade**: navegação completa por teclado (Arrow, Page Up/Down, Home/End) gerenciada automaticamente pelo Bits UI.

---

## Slider

```svelte
<script lang="ts">
  import { Slider } from '$lib/components/ui/slider';
  let valor = $state([50]);
</script>

<Slider
  bind:value={valor}
  min={0}
  max={100}
  step={1}
  aria-label="Ajustar volume"
/>
```
