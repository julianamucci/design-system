# Caracteres Especiais em Template (Nortear — Angular)

> Referência completa. Regra rápida em `RULES.md` → seção 4.

O template Angular é parseado como HTML **e** carrega duas sintaxes próprias — interpolação `{{ }}` e blocos `@`. Isso dá três famílias de caractere a escapar, contra uma nas outras stacks.

---

## 1. Caracteres de HTML

Proibidos em nó de texto: `<` `>` `&` `"` `'`

| Caractere | Entidade |
|---|---|
| `<` | `&lt;` |
| `>` | `&gt;` |
| `&` | `&amp;` |
| `"` | `&quot;` |
| `'` | `&#39;` |

```html
<!-- ❌ -->
<p>Arrays > objetos para performance</p>

<!-- ✅ -->
<p>Arrays &gt; objetos para performance</p>
```

`<` e `>` soltos em texto fazem o parser abrir tag: o erro é de compilação de template, não de runtime.

---

## 2. `@` — delimitador de bloco de controle de fluxo

Exclusivo do Angular. `@if`, `@for`, `@switch`, `@defer`, `@let` são blocos de template, então **`@` em texto literal precisa de entidade**:

```html
<!-- ❌ — o parser tenta ler um bloco -->
<a href="/users/joana">@joana</a>

<!-- ✅ -->
<a href="/users/joana">&#64;joana</a>
```

Vale para qualquer `@` visível: menção, e-mail em texto de exemplo, decorator dentro de um trecho ilustrativo escrito direto no template.

Quando o `@` vem de dado — interpolado a partir do `translations.json` ou de um `computed` — **não** precisa de entidade: interpolação é JavaScript, não HTML.

---

## 3. `{{` e `}` — delimitadores de interpolação

```html
<!-- ❌ — abre interpolação -->
<code>{{ valor }}</code>

<!-- ✅ — chave literal -->
<code>&#123;&#123; valor &#125;&#125;</code>
```

Na prática, trecho de código que contém `{{` vive melhor como **constante TypeScript** passada por input ao bloco de código: sai do parser de template e some o problema.

---

## 4. Onde o escape NÃO é necessário

**Interpolação e bindings** são JavaScript puro:

```html
<!-- ✅ — string JS não precisa de entidade -->
<span>{{ rotulo() }}</span>
<span>{{ 'Valor A > Valor B' }}</span>
<button [attr.aria-label]="'Excluir ' + nome()">
```

**Condição em bloco:**

```html
<!-- ✅ — expressão, não texto -->
@if (contagem() > 0) { <span ndsBadge>{{ contagem() }}</span> }
```

**Comentário HTML** — o parser não interpreta caractere especial ali dentro.

---

## 5. Expressão de template não tem globais

Custou tempo, e o sintoma é erro de runtime: `ctx.String is not a function`.

`String(...)`, `Number(...)`, `Object.keys(...)`, `JSON.stringify(...)`, `Math.*` e afins **não existem** no contexto de uma expressão de template — só existem membros da instância do componente.

A saída é expor um `computed` (ou um método `protected`) no componente e chamar esse. Não há alternativa de "importar no template".

---

## 6. `[innerHTML]` — conteúdo com marcação

Conteúdo do `translations.json` que traz `<code>` ou `<strong>` inline vai por `[innerHTML]`, e a sanitização é obrigatória **no próprio binding**:

```html
<!-- ✅ — DOMPurify exposto na classe e chamado no call site -->
<div [innerHTML]="DOMPurify.sanitize(t('anatomy.item1'))"></div>
```

```ts
protected readonly DOMPurify = DOMPurify;   // expõe o módulo ao template
```

Nunca um `computed` `safeAlgo` que devolva o HTML já sanitizado: o wrapper esconde o sanitizador das ferramentas de SAST, que voltam a reportar o fluxo como XSS. Ver `../../docs/shared/guidelines/09-seguranca-xss.md`.

As entidades precisam estar corretas **no HTML da string**, não no template. Se o texto vem do conteúdo compartilhado, a entidade está no JSON:

```json
{ "label": "Opção A &gt; Opção B" }
```

---

## 7. Dois destinos, duas funções

O mesmo `translations.json` alimenta destinos que **renderizam HTML** e destinos que **escrevem texto**. `@/lib/strip-html` tem uma função para cada, e trocá-las quebra de formas opostas:

| Função | O que faz | Destino |
|---|---|---|
| `stripHtml` | tira as tags, **preserva** as entidades | container que renderiza HTML |
| `toPlainText` | tira as tags **e decodifica** as entidades | célula de tabela, texto puro |

Decodificar antes de um destino que renderiza HTML transforma texto em markup vivo: `&lt;img&gt;` vira um `<img>` de verdade, sem `alt`, e o axe reprova a página. Nenhuma das duas é sanitizador.
