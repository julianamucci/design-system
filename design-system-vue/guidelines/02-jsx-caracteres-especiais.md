# Regras de Templates Vue e Caracteres Especiais - OBRIGATÓRIO

## ❌ NUNCA use caracteres reservados diretamente em templates Vue
* **Caracteres proibidos em conteúdo de texto**: `<`, `>`, `&`, `"`, `'`
* **Problema comum**: Usar `>` diretamente em texto pode causar erro de parse
* **Exemplo INCORRETO**: `<span>Valor A > Valor B</span>`
* **Exemplo CORRETO**: `<span>Valor A &gt; Valor B</span>`

## ✅ SEMPRE use entidades HTML para caracteres especiais
* **`<` = `&lt;`** (less than)
* **`>` = `&gt;`** (greater than)
* **`&` = `&amp;`** (ampersand)
* **`"` = `&quot;`** (double quote)
* **`'` = `&#39;`** ou `&apos;` (single quote)

## Exemplos Corretos de Uso

```html
<!-- ❌ INCORRETO -->
<p>Use arrays em vez de objetos > melhor performance</p>

<!-- ✅ CORRETO -->
<p>Use arrays em vez de objetos &gt; melhor performance</p>

<!-- ✅ CORRETO — expressões Vue com interpolação são seguras -->
<span>{{ valorA }} &gt; {{ valorB }}</span>

<!-- ✅ CORRETO — v-html exige entidades -->
<p v-html="'Valor A &gt; Valor B'" />
```

## ⚠️ ATENÇÃO: v-html

Ao usar `v-html`, o conteúdo é inserido como HTML bruto — certifique-se de sanitizar ou usar entidades adequadas. Nunca inserir input do usuário via `v-html`.
