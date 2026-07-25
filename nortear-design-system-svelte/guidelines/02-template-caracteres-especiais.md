# Caracteres Especiais em Templates Svelte

## Regra

Proibidos em conteúdo de texto literal em templates Svelte: `<` `>` `&` `"` `'`

Usar entidades HTML: `&lt;` `&gt;` `&amp;` `&quot;` `&#39;`

```svelte
<!-- ❌ INCORRETO -->
<span>Valor A > Valor B</span>
<p>Use o operador & para concatenar</p>

<!-- ✅ CORRETO -->
<span>Valor A &gt; Valor B</span>
<p>Use o operador &amp; para concatenar</p>
```

## Expressões Svelte são seguras

Expressões `{variavel}` são seguras — o compilador Svelte escapa automaticamente o HTML:

```svelte
<script lang="ts">
  let titulo = $state('Produto <Especial> & Oferta');
</script>

<!-- ✅ SEGURO — Svelte escapa automaticamente -->
<h1>{titulo}</h1>

<!-- ❌ PERIGOSO — não escapado -->
{@html titulo}
```

## `{@html}` — uso restrito

A diretiva `{@html}` injeta HTML bruto sem escape. **Usar somente com conteúdo sanitizado.**

```svelte
<script lang="ts">
  import { sanitizeHtml } from '$lib/sanitize-html';
  let conteudo = $state('');
  let conteudoSanitizado = $derived(sanitizeHtml(conteudo));
</script>

<!-- ✅ OK — conteúdo sanitizado -->
{@html conteudoSanitizado}

<!-- ❌ NUNCA com input do usuário -->
{@html inputDoUsuario}
```

## Atributos dinâmicos

Atributos dinâmicos via `{expressao}` são seguros — Svelte escapa automaticamente:

```svelte
<!-- ✅ SEGURO — Svelte escapa o atributo -->
<img alt={descricao} src={url} />
<button aria-label={`Excluir ${nomeItem}`}>...</button>
```

## Casos comuns

| Caractere | Em texto literal | Em expressão |
|-----------|-----------------|-------------|
| `<` | `&lt;` | `{valor}` — seguro |
| `>` | `&gt;` | `{valor}` — seguro |
| `&` | `&amp;` | `{valor}` — seguro |
| `"` | `&quot;` | `{valor}` — seguro |
| `'` | `&#39;` | `{valor}` — seguro |
