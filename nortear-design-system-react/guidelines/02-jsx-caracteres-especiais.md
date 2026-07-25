# JSX — Caracteres Especiais

> Referência completa. Regra rápida em `RULES.md` → seção 4.

---

## Regra

Caracteres `<` `>` `&` `"` `'` são **proibidos em nós de texto JSX**. Use entidades HTML:

| Caractere | Entidade | Nome |
|-----------|----------|------|
| `<` | `&lt;` | less than |
| `>` | `&gt;` | greater than |
| `&` | `&amp;` | ampersand |
| `"` | `&quot;` | double quote |
| `'` | `&#39;` | single quote |

---

## Contextos onde o escape É obrigatório

**Nós de texto em elementos HTML:**
```tsx
// ❌
<p>Arrays > objetos para performance</p>

// ✅
<p>Arrays &gt; objetos para performance</p>
```

**Conteúdo de label, `<td>`, `<span>`, qualquer elemento com texto visível:**
```tsx
// ❌
<td>A & B</td>
<label>Campo obrigatório > preenchimento</label>

// ✅
<td>A &amp; B</td>
<label>Campo obrigatório &gt; preenchimento</label>
```

**Aspas dentro de atributos com o mesmo tipo de delimitador:**
```tsx
// ❌ — a " interna quebra o atributo
<input placeholder="Digite "algo" aqui" />

// ✅
<input placeholder="Digite &quot;algo&quot; aqui" />

// ✅ alternativa — usar template literal ou variável
<input placeholder={`Digite "algo" aqui`} />
```

---

## Contextos onde o escape NÃO é necessário

**Comentários JSX** — o parser não interpreta caracteres especiais dentro de `{/* */}`:
```tsx
// ✅ Sem escape necessário em comentários
{/* Valor A > Valor B — isso é válido */}
{/* Fórmula: a & b */}
```

**Expressões JSX `{}`** — são JavaScript puro, não HTML:
```tsx
// ✅ Strings JS não precisam de entidades HTML
const label = "Valor A > Valor B";
<span>{label}</span>

// ✅ Comparações em expressões
{count > 0 && <Badge>{count}</Badge>}
```

**Valores de atributos entre aspas simples/duplas** (sem conflito com o delimitador):
```tsx
// ✅ — a string não contém o delimitador usado
<Button aria-label="Excluir item">
<Button aria-label='Excluir item'>
```

**Props booleanas e numéricas:**
```tsx
// ✅ — não são texto
<Input maxLength={100} required />
```

---

## Caso especial: `dangerouslySetInnerHTML`

Conteúdo HTML injetado via `dangerouslySetInnerHTML` não passa pelo parser JSX — as entidades devem estar corretas no **HTML da string**, não no JSX. Além disso, sempre sanitize:

```tsx
// ✅
import { sanitizeHtml } from '@/lib/sanitize-html';

<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlString) }} />
```

Se o `htmlString` vier de `translations.json`, a entidade deve estar na string JSON:
```json
{ "label": "Opção A &gt; Opção B" }
```

---

## Erro de build vs erro silencioso

`<` e `>` soltos em texto causam **erro de build** (o parser os interpreta como tags):
```tsx
// ❌ — erro de build: "Adjacent JSX elements must be wrapped"
<p>5 < 10 > 3</p>
```

`&` solto em texto causa **warning** (não erro) em alguns parsers, mas deve ser escapado:
```tsx
// ❌ warning
<p>React & TypeScript</p>

// ✅
<p>React &amp; TypeScript</p>
```

`"` e `'` em conteúdo de texto são aceitos pelo parser mas devem ser escapados para HTML semântico correto.
