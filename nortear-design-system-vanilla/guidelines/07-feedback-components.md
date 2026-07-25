# Feedback Components (Nortear — Vanilla TypeScript)

---

## Alert

**Propósito**: mensagem estática e persistente que comunica informações importantes ao usuário. Para mensagens temporárias, usar **Toast**.

**API e exemplos**: `src/components/ui/alert.ts` + stories + `AlertDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Quando usar**:

| Situação | Componente |
|---|---|
| Mensagem persistente, requer atenção ou ação | Alert |
| Confirmação temporária (salvo, enviado) | Toast |
| Erro crítico que bloqueia o fluxo | Alert |

**Estrutura**:

```
div role="alert"
├── icon (opcional, aria-hidden, posicionado absolute left)
└── content (pl-7 quando há icon)
    ├── h5 title (opcional)
    └── div description
```

**Variantes**:

| Variante | Uso |
|---|---|
| `default` | Informativo neutro |
| `destructive` | Erro / atenção crítica |
| `success` | Sucesso (ex: dados salvos) |
| `warning` | Alerta não bloqueante |

**Regras**:
- `role="alert"` no container raiz
- Padding fixo em `--spacing-4`; gap interno em `--spacing-1` entre título e descrição
- Cor nunca é o único indicador — sempre acompanhar com ícone + texto (WCAG 1.4.1)
- Description sempre em `--foreground` (ver memória "Containers coloridos: texto corrido sempre foreground")
- Ícone e título podem usar cor da variante; corpo do texto não

**Acessibilidade**:
- `role="alert"` (live region implícita)
- Ícone com `aria-hidden="true"`
- Contraste mínimo 4.5:1 em todo texto

---

## Badge

**Propósito**: rótulo curto para status, contagem ou categoria.

**API e exemplos**: `src/components/ui/badge.ts` + stories + `BadgeDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
span (inline-flex, rounded-full)
└── label (texto curto)
```

**Variantes**:

| Variante | Uso |
|---|---|
| `default` | Destaque primário |
| `secondary` | Categoria neutra |
| `outline` | Baixo destaque |
| `destructive` | Status negativo |

**Regras**:
- Padding horizontal em `--spacing-2.5`, vertical em `--spacing-0.5`; nunca altura fixa
- `rounded-full` para badges de status; `rounded-md` para chips de categoria
- Font-weight `semibold` para legibilidade em tamanho pequeno
- Tokens semânticos: `bg-success/10 text-success border-success/30` para variantes warning/success customizadas
- Não usar emojis dentro do badge — usar ícone lucide (`h-3 w-3`) antes do label se necessário

**Acessibilidade**:
- Se o badge representa status visualmente colorido, garantir 4.5:1 e incluir texto descritivo
- Badge informativo (ex: "3 novas mensagens"): usar `aria-label` no elemento pai quando apenas o número for visível

---

## Progress

**Propósito**: indicar progresso determinado de uma operação (0–100%).

**API e exemplos**: `src/components/ui/progress.ts` + stories + `ProgressDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
div role="progressbar" (aria-valuenow, aria-valuemin=0, aria-valuemax=100)
└── bar interno (largura = valor%)
```

**Regras**:
- Altura fixa em `--spacing-2` (8px) — é elemento gráfico, não textual
- `aria-label` obrigatório descrevendo o que está progredindo
- `aria-valuenow` reflete progresso real (não animação visual)
- Para progresso indeterminado, usar Skeleton ou Spinner — não Progress

**Acessibilidade**:
- `role="progressbar"` + `aria-valuenow`/`aria-valuemin`/`aria-valuemax`
- `aria-label` contextual obrigatório

---

## Skeleton

**Propósito**: placeholder visual durante carregamento de conteúdo.

**API e exemplos**: `src/components/ui/skeleton.ts` + stories + `SkeletonDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
div (animate-pulse, bg-muted, rounded-md)
```

**Regras**:
- Dimensões devem aproximar o conteúdo real (evita layout shift)
- Usar `bg-muted` + `animate-pulse` (não criar gradientes customizados)
- `motion-reduce`: respeitar `prefers-reduced-motion` — usar `.nds-animate-pulse` ou keyframe próprio que zere a animação dentro de `@media (prefers-reduced-motion: reduce)`
- Para listas, repetir Skeleton com o mesmo shape do item real

**Acessibilidade**:
- Container pai com `aria-busy="true"`
- `aria-label="Carregando..."` no wrapper da seção (não em cada skeleton)

---

## Toast

**Propósito**: notificação temporária não bloqueante (3–5s) confirmando uma ação.

**API e exemplos**: `src/components/ui/toast.ts` + stories + `ToastDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
div role="status" aria-live="polite" (fixed top-4 right-4, z-50)
├── icon opcional
└── message
```

**Tipos**: `default`, `success`, `error`, `warning`.

**Regras**:
- Posição padrão: `fixed top-4 right-4` (top-right)
- Duração default 4000ms; nunca inferior a 3000ms (acessibilidade de leitura)
- Erros críticos: usar Alert ou Dialog, não Toast
- Z-index `50` (acima de overlays normais, abaixo de Dialog modal)
- Não empilhar mais de 3 toasts simultâneos — enfileirar

**Acessibilidade**:
- `role="status"` + `aria-live="polite"` para mensagens neutras/sucesso
- `role="alert"` + `aria-live="assertive"` apenas para erros
- Não capturar foco (não bloqueante)

**Analytics**: emitir `toast_shown` com `{ type, message_key }`.
