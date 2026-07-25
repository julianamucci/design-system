# Feedback Components

---

## Alert

**Propósito**: mensagem estática e persistente que comunica informações importantes ao usuário. Para mensagens temporárias, usar **Sonner**.

**API e exemplos**: `src/components/ui/alert/alert.svelte` + stories + `AlertDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Quando usar**:

| Situação | Componente |
|----------|------------|
| Mensagem persistente, requer atenção ou ação | Alert |
| Confirmação temporária (salvo, enviado) | Sonner |
| Erro crítico que bloqueia o fluxo | Alert |
| Notificação não bloqueante | Sonner |

**Estrutura**:

```
Alert (variant)
├── <Icon aria-hidden />
├── AlertTitle
└── AlertDescription
```

**Variantes**:

| Variante | Fonte | Token / class |
|---|---|---|
| `default` | cva nativa | `bg-background text-foreground` |
| `destructive` | cva nativa | `text-destructive border-destructive/30` |
| `success` | via `class` | `bg-success/10 text-success border-success/30` |
| `warning` | via `class` | `bg-warning/10 text-warning border-warning/30` |

**Regras**:
- Sempre acompanhado de ícone + texto — a cor nunca é o único indicador de estado
- Em containers semânticos, mantenha `AlertDescription` em `--foreground` para WCAG AA 4.5:1

**Acessibilidade**:
- `role="alert"` aplicado automaticamente pelo Bits UI
- Ícone sempre `aria-hidden="true"`

---

## Badge

**Propósito**: rótulo compacto para status, categorias ou metadados.

**API e exemplos**: `src/components/ui/badge/badge.svelte` + stories + `BadgeDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Variantes**:

| Variante | Fonte |
|---|---|
| `default`, `secondary`, `outline`, `destructive` | cva nativa |
| `success` / `warning` | via `class` com tokens `success`/`warning` |

**Regras**:
- Máximo 2-3 palavras — badges são rótulos, não frases
- Nunca usar prop `size` (não existe) — customizar tamanho via `class`
- Cor nunca é o único indicador de estado — incluir texto significativo
- Nunca altura fixa em primitivos (WCAG 1.4.4)

---

## Progress

**Propósito**: indicador visual de progresso de um processo mensurável.

**API e exemplos**: `src/components/ui/progress/progress.svelte` + stories + `ProgressDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Props relevantes**: `value` (0-100).

**Acessibilidade**:
- `aria-label` descritivo do processo
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax` no elemento de progresso

---

## Skeleton

**Propósito**: placeholder animado enquanto o conteúdo está carregando.

**API e exemplos**: `src/components/ui/skeleton/skeleton.svelte` + stories + `SkeletonDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Regras**:
- Estrutura do skeleton deve refletir a estrutura do conteúdo final (preserva layout)
- Animação respeita `motion-reduce`

**Acessibilidade**:
- `aria-busy="true"` no container pai enquanto carregando
- `role="status"` ou `aria-label="Carregando..."` no wrapper

---

## Sonner (Toast)

**Propósito**: notificações temporárias não bloqueantes.

**API e exemplos**: `src/components/ui/sonner/` + stories + `SonnerDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Stack**: `svelte-sonner` — `<Toaster />` montado no root do app; emissão via `toast.success`, `toast.error`, etc.

**Regras**:
- Posição obrigatória: `top-right`
- Mensagens curtas e acionáveis — para conteúdo que requer ação, usar Alert
- Duração padrão respeita `prefers-reduced-motion`
