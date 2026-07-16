# 09 — Segurança: Prevenção de XSS e Injeção de Conteúdo

Este arquivo define as regras de segurança para o design system. O foco principal é prevenir Cross-Site Scripting (XSS) — a vulnerabilidade mais comum em aplicações frontend — mas também cobre outros vetores de ataque relevantes para componentes de UI.

---

## Princípios

**Nenhum dado do usuário é confiável** — todo conteúdo que não é literal no código-fonte deve ser tratado como potencialmente malicioso. Isso inclui: traduções carregadas de JSON, conteúdo de APIs, query params, localStorage e clipboard.

**Sanitizar na entrada, escapar na saída** — sanitize o conteúdo o mais cedo possível, e escape na renderização como camada adicional de defesa.

**Menor superfície de ataque possível** — se não precisa de HTML, não use HTML. Prefira `textContent` a `innerHTML`, `{text}` a `{@html text}`.

---

## Vetores de Ataque em Design Systems

### 1. innerHTML / dangerouslySetInnerHTML / {@html}

O vetor mais perigoso. Renderiza strings como HTML, executando qualquer `<script>`, `<img onerror>`, `<svg onload>`, etc.

**Onde aparece no projeto:**

| Stack | Sintaxe perigosa | Uso seguro |
|-------|------------------|------------|
| React | `dangerouslySetInnerHTML={{ __html: content }}` | Sempre via `sanitizeHtml(content)` |
| Vue | `v-html="content"` | Sempre via `sanitizeHtml(content)` |
| Svelte | `{@html content}` | Sempre via `sanitizeHtml(content)` |
| Basecoat | `el.innerHTML = content` | Sempre via `sanitizeHtml(content)` |

### 2. URLs dinâmicos

Links com `href` dinâmico podem executar JavaScript:

```html
<!-- PERIGOSO -->
<a href="javascript:alert('xss')">Click</a>
<a href="data:text/html,<script>alert('xss')</script>">Click</a>
```

**Regra**: URLs dinâmicos DEVEM ser validados antes da renderização. Apenas `http:`, `https:`, `mailto:` e `tel:` são permitidos. Nunca `javascript:`, `data:` ou `vbscript:`.

### 3. Event handlers dinâmicos

Strings usadas como handlers de evento:

```html
<!-- PERIGOSO -->
<div onmouseover="userContent">...</div>
```

**Regra**: Nunca construa event handlers a partir de strings. Use sempre funções tipadas.

### 4. CSS injection

```html
<!-- PERIGOSO -->
<div style="background: url('javascript:alert(1)')">
```

**Regra**: Evite `style` dinâmico com conteúdo de usuário. Quando necessário, valide que os valores são apenas cores, dimensões ou propriedades CSS seguras.

### 5. SVG injection

SVGs podem conter `<script>`, `<foreignObject>` e event handlers:

```html
<svg><script>alert('xss')</script></svg>
<svg onload="alert('xss')">
```

**Regra**: SVGs de fontes externas devem ser sanitizados. SVGs inline hardcoded no código são seguros.

---

## Função `sanitizeHtml` — Implementação Obrigatória

Localização: `src/lib/sanitize-html.ts` em cada stack.

A implementação é um **wrapper fino sobre o [DOMPurify](https://github.com/cure53/DOMPurify)** — o sanitizador de referência do ecossistema (mantido pela Cure53, auditado, usado por Google e Microsoft, reconhecido pelas ferramentas SAST como sanitizador de taint):

```typescript
import DOMPurify from 'dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}
```

**Nunca chame `DOMPurify.sanitize` diretamente nos componentes** — sempre via `sanitizeHtml`, pra manter um único ponto de configuração por stack.

### O que o perfil default do DOMPurify garante

- Mantém tags semânticas de conteúdo (`<strong>`, `<code>`, `<a>`, `<table>`, headings, listas) e também `<svg>`/MathML seguros (necessário para os ícones SVG das factories vanilla)
- Remove `<script>`, `<style>`, `<iframe>`, `<object>`, `<embed>`, `<form>` e demais tags executáveis
- Remove todos os event handlers `on*` (`onclick`, `onerror`, `onload`, …)
- Neutraliza URLs `javascript:` (e outros protocolos perigosos) em `href`/`src`/`action`
- Remove comentários HTML e vetores de mXSS (mutation XSS) — classe de ataque que sanitizadores regex caseiros não cobrem

### Por que uma biblioteca e não regex próprio

A versão anterior deste guideline especificava um sanitizador regex caseiro. Foi substituído porque: (1) regex não acompanha o parser HTML real do browser — vetores de mutation XSS passam; (2) toda mudança de allowlist vira manutenção nossa; (3) ferramentas de análise estática (Qwiet, CodeQL) reconhecem DOMPurify como sanitizador e param de acusar falso-positivo nos fluxos `dado → innerHTML`.

---

## Regras por Contexto

### Traduções (`translations.json`)

O conteúdo de translations é controlado pelo time de desenvolvimento — não é input de usuário externo. Porém, como é renderizado via `dangerouslySetInnerHTML` / `v-html` / `{@html}`, DEVE ser sanitizado como camada de defesa em profundidade.

```tsx
// React — CORRETO
<p dangerouslySetInnerHTML={{ __html: sanitizeHtml(t('anatomy.item1')) }} />

// React — INCORRETO (sem sanitização)
<p dangerouslySetInnerHTML={{ __html: t('anatomy.item1') }} />
```

```vue
<!-- Vue — CORRETO -->
<p v-html="sanitizeHtml(t('anatomy.item1'))" />
```

```svelte
<!-- Svelte — CORRETO -->
<p>{@html sanitizeHtml(t('anatomy.item1'))}</p>
```

### Props de componentes

Props que aceitam conteúdo de texto NUNCA devem renderizar como HTML:

```tsx
// CORRETO — textContent é seguro
<Button>{children}</Button>

// PERIGOSO — se children vier de input externo
<Button dangerouslySetInnerHTML={{ __html: children }} />
```

### Story labels e descriptions

Story descriptions em `parameters.docs.description.story` são renderizadas como Markdown pelo Storybook — o Storybook já sanitiza internamente. Sem ação necessária.

Labels no `ButtonStory.svelte` que usam `{@html label}` são controlados pelo desenvolvedor nas stories — são seguros porque o input é literal no código-fonte, não dinâmico.

### Analytics payloads

Nunca inclua HTML ou conteúdo de usuário em payloads de analytics:

```typescript
// CORRETO
track('button_click', { label: 'Salvar', component: 'button' });

// PERIGOSO — label pode conter HTML se vier de props
track('button_click', { label: element.innerHTML });
```

---

## Cabeçalhos de Segurança (Storybook build)

Para deploys do Storybook em produção, configure os cabeçalhos HTTP:

```
Content-Security-Policy: default-src 'self'; script-src 'self' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://www.google-analytics.com
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
```

---

## Checklist de Segurança por Componente

### Antes de publicar qualquer componente:

- [ ] Nenhum uso de `innerHTML` / `dangerouslySetInnerHTML` / `v-html` / `{@html}` sem `sanitizeHtml()`
- [ ] Nenhum `href` dinâmico sem validação de protocolo
- [ ] Nenhum event handler construído a partir de strings
- [ ] Nenhum `style` dinâmico com conteúdo externo
- [ ] SVGs inline são hardcoded (não dinâmicos de fontes externas)
- [ ] `sanitizeHtml.ts` existe e está atualizado em cada stack
- [ ] Payloads de analytics não contêm HTML ou dados sensíveis

### Antes de publicar qualquer docs page:

- [ ] Todo conteúdo de translations renderizado como HTML passa por `sanitizeHtml()`
- [ ] Links externos usam `rel="noopener noreferrer"` e `target="_blank"`
- [ ] Nenhum dado de query params renderizado sem escaping

---

## Testes de Segurança

### Teste manual — payload XSS

Ao testar componentes que aceitam conteúdo dinâmico, tente os seguintes payloads:

```
<script>alert('xss')</script>
<img src=x onerror=alert('xss')>
<svg onload=alert('xss')>
<a href="javascript:alert('xss')">click</a>
"><script>alert('xss')</script>
' onerror='alert("xss")
```

Se algum payload executar JavaScript, há uma vulnerabilidade.

### Teste automatizado

O sanitizeHtml deve ter testes unitários cobrindo todos os payloads acima.
