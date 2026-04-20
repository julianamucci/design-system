# Feedback Components

---

## Alert

**Propósito**: mensagem estática e persistente que comunica informações importantes ao usuário.

**Quando usar**: mensagens que o usuário precisa ver e potencialmente agir. Para mensagens temporárias, usar **Sonner**.

| Situação | Componente |
|----------|------------|
| Mensagem persistente, requer atenção ou ação | Alert |
| Confirmação temporária (salvo, enviado) | Sonner |
| Erro crítico que bloqueia o fluxo | Alert |
| Notificação não bloqueante | Sonner |

**Variantes nativas**: `default` e `destructive`. `warning` e `success` via `class`.

**Implementação**:
```svelte
<script lang="ts">
  import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
  import { Info, XCircle, CheckCircle2, AlertTriangle } from 'lucide-svelte';
</script>

<!-- Default — informativo -->
<Alert>
  <Info class="h-4 w-4" aria-hidden="true" />
  <AlertTitle>Atenção</AlertTitle>
  <AlertDescription>Suas alterações serão aplicadas na próxima sessão.</AlertDescription>
</Alert>

<!-- Destructive — variante nativa -->
<Alert variant="destructive">
  <XCircle class="h-4 w-4" aria-hidden="true" />
  <AlertTitle>Erro ao salvar</AlertTitle>
  <AlertDescription>Não foi possível salvar. Verifique sua conexão e tente novamente.</AlertDescription>
</Alert>

<!-- Success — via class com token do projeto -->
<Alert class="bg-success/10 text-success border-success/30">
  <CheckCircle2 class="h-4 w-4" aria-hidden="true" />
  <AlertTitle>Perfil atualizado</AlertTitle>
  <AlertDescription>Suas informações foram salvas com sucesso.</AlertDescription>
</Alert>

<!-- Warning — via class com token do projeto -->
<Alert class="bg-warning/10 text-warning border-warning/30">
  <AlertTriangle class="h-4 w-4" aria-hidden="true" />
  <AlertTitle>Atenção</AlertTitle>
  <AlertDescription>Prazo expira em 3 dias.</AlertDescription>
</Alert>
```

**Acessibilidade**:
- `role="alert"` é aplicado automaticamente pelo Bits UI
- Ícone sempre `aria-hidden="true"` — a cor nunca é o único indicador de estado (sempre acompanhado de ícone + texto)

---

## Badge

**Propósito**: rótulo compacto para status, categorias ou metadados.

**Variantes nativas**: `default`, `secondary`, `outline`, `destructive`. `warning` e `success` via `class`.

**Implementação**:
```svelte
<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
</script>

<Badge>Publicado</Badge>
<Badge variant="secondary">Rascunho</Badge>
<Badge variant="outline">Layout</Badge>
<Badge variant="destructive">Expirado</Badge>

<!-- Warning — via class -->
<Badge class="bg-warning/10 text-warning border-warning/30">Pendente</Badge>

<!-- Success — via class -->
<Badge class="bg-success/10 text-success border-success/30">Ativo</Badge>
```

**Regras**:
- Máximo 2-3 palavras — badgs são rótulos, não frases
- Nunca usar `size` prop (não existe) — usar `class` para tamanho customizado
- Cor nunca é o único indicador de estado — incluir texto significativo

---

## Progress

**Propósito**: indicador visual de progresso de um processo mensurável.

**Implementação**:
```svelte
<script lang="ts">
  import { Progress } from '$lib/components/ui/progress';
  let progresso = $state(45);
</script>

<Progress
  value={progresso}
  aria-label="Carregando dados do relatório"
  aria-valuenow={progresso}
  aria-valuemin={0}
  aria-valuemax={100}
/>
```

---

## Skeleton

**Propósito**: placeholder animado enquanto o conteúdo está carregando.

**Implementação**:
```svelte
<script lang="ts">
  import { Skeleton } from '$lib/components/ui/skeleton';
</script>

<!-- Simular um Card carregando -->
<div class="flex flex-col space-y-3">
  <Skeleton class="h-[125px] w-[250px] rounded-xl" />
  <div class="space-y-2">
    <Skeleton class="h-4 w-[250px]" />
    <Skeleton class="h-4 w-[200px]" />
  </div>
</div>
```

**Acessibilidade**:
- Adicionar `aria-busy="true"` no container pai enquanto carregando
- Adicionar `aria-label="Carregando..."` ou `role="status"` no wrapper

---

## Sonner (Toast)

**Propósito**: notificações temporárias não bloqueantes.

**Configuração** (root do app):
```svelte
<!-- App.svelte ou layout principal -->
<script lang="ts">
  import { Toaster } from 'svelte-sonner';
</script>

<Toaster position="top-right" />
```

**Uso**:
```svelte
<script lang="ts">
  import { toast } from 'svelte-sonner';
</script>

<button onclick={() => toast.success('Perfil salvo com sucesso!')}>
  Salvar
</button>
<button onclick={() => toast.error('Erro ao salvar. Tente novamente.')}>
  Simular erro
</button>
```

**Posição obrigatória**: `top-right`
