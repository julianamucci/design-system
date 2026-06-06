# Form Components (Nortear — Vanilla TypeScript)

---

## Button

**Propósito**: elemento de ação — dispara submissões, confirmações e ações do usuário. Para navegação, usar `<a>`.

**API e exemplos**: `src/components/ui/button.ts` + stories + `ButtonDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
button
├── icon opcional (lucide SVG, aria-hidden="true")
└── label (texto)
```

**Variantes**:

| Variante | Uso |
|---|---|
| `default` | Ação primária |
| `destructive` | Ação irreversível (delete) |
| `outline` | Ação secundária |
| `secondary` | Ação alternativa |
| `ghost` | Ação terciária / icon-only |
| `link` | Ação textual |

**Tamanhos**: `sm`, `default`, `lg`, `icon`.

**Regras**:
- Padding vertical via `--spacing-*`, nunca altura fixa (ver memória "nunca usar altura fixa em primitivos")
- Icon-only requer `aria-label` descritivo
- Ícone interno: `aria-hidden="true"`, dimensões `h-4 w-4` (ou `h-5 w-5` em `lg`)
- Ação destrutiva: confirmação por Dialog antes da execução
- Gap entre ícone e label em `--spacing-2`

**Acessibilidade**:
- `<button>` semântico (nunca `<div onclick>`)
- `aria-label` obrigatório quando não há texto visível
- Estado `disabled` reflete `aria-disabled` quando necessário

**Analytics**: emitir `button_click` com `{ component, variant, location, label }`.

---

## Input

**Propósito**: campo de texto de linha única.

**API e exemplos**: `src/components/ui/input.ts` + stories + `InputDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
wrapper (space-y-2)
├── label (htmlFor=id)
├── input (id, type, name)
└── p#<id>-error (role="alert", quando há erro)
```

**Opts da factory**:

| Nome | Default | Função |
|---|---|---|
| `id` | — | Obrigatório (link label↔input) |
| `label` | — | Texto do `<label>` |
| `type` | `text` | Tipo HTML do input |
| `placeholder` | — | Exemplo real (não instrução) |
| `required` | `false` | Marca campo obrigatório |
| `errorId` | — | ID do elemento de erro (vincula via `aria-describedby`) |

**Regras**:
- `<label>` sempre associado via `htmlFor`/`id` (nunca placeholder como label)
- Placeholder deve ser exemplo real — `'ex: ana@empresa.com'`, não `'Digite seu e-mail'`
- Padding vertical em `--spacing-1`, horizontal em `--spacing-3`; nunca altura fixa
- Tokens obrigatórios: `bg-input`, `border-input`
- Foco visível: `ring-2 ring-ring ring-offset-2`
- Estado de erro: `aria-invalid="true"` + `aria-describedby` para a mensagem

**Acessibilidade**:
- Label visível e associado
- Erros com `role="alert"` (anunciados imediatamente)
- `aria-required="true"` quando aplicável

---

## Form (HTML nativo + Zod)

**Propósito**: agrupar inputs e validar via Zod. Forms em vanilla TS usam `<form>` nativo + validação manual no submit.

**API e exemplos**: `src/components/ui/form.ts` + stories + `FormDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
form (noValidate, space-y-4)
├── Input fields (cada um com errorId)
├── submit button
└── erros inline (inseridos via showFieldError)
```

**Regras**:
- `form.noValidate = true` — validação é responsabilidade do Zod, não do browser
- Schema Zod com mensagens em português
- No submit: `e.preventDefault()` → limpar erros anteriores → `schema.safeParse()` → exibir erros por campo ou chamar `onSubmit`
- Erros são `<p role="alert" id="${fieldId}-error">` inseridos imediatamente após o input
- Limpar `aria-invalid` e `aria-describedby` ao limpar erros
- Estado de loading durante submit: desabilitar botão + exibir spinner

**Acessibilidade**:
- Cada erro com `role="alert"` (live region)
- `aria-invalid="true"` no campo com erro
- `aria-describedby` apontando ao ID do erro
- Foco no primeiro campo com erro após submit inválido

**Analytics**: emitir `form_submit` com `{ form_id, valid: boolean, error_fields?: string[] }`.

---

## Checkbox

**Propósito**: seleção booleana ou múltipla em listas.

**API e exemplos**: `src/components/ui/checkbox.ts` + stories + `CheckboxDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
wrapper (flex items-center space-x-2)
├── input[type=checkbox] (id)
└── label (htmlFor=id, cursor-pointer)
```

**Opts da factory**:

| Nome | Default | Função |
|---|---|---|
| `id` | — | Obrigatório |
| `label` | — | Texto do label |
| `checked` | `false` | Estado inicial |
| `indeterminate` | `false` | Estado tri-state (parent de grupo) |

**Regras**:
- `<input type="checkbox">` nativo — não recriar como `<div role="checkbox">` em vanilla
- Label sempre associado via `htmlFor`/`id`
- Tamanho fixo `h-4 w-4` (ícone, não texto — segue 8-grid via tokens)
- Gap label↔checkbox em `--spacing-2`
- Tri-state (indeterminate): apenas em parent de grupo, definido via JS (`input.indeterminate = true`)
- Foco visível: `ring-2 ring-ring ring-offset-2`

**Acessibilidade**:
- Label clicável (cobre o input via `htmlFor`)
- `aria-checked` é gerenciado nativamente
- Grupo de checkboxes: envolver em `<fieldset>` + `<legend>`
