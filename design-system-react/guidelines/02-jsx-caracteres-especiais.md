# Regras de JSX e Caracteres Especiais - OBRIGATÓRIO

## ❌ NUNCA use caracteres reservados diretamente no JSX
* **Caracteres proibidos no JSX**: `<`, `>`, `&`, `"`, `'`
* **Problema comum**: Usar `>` diretamente em texto causa erro de build
* **Exemplo INCORRETO**: `{/* Separadores inconsistentes > problemas */}`
* **Exemplo CORRETO**: `{/* Separadores inconsistentes > problemas */}`

## ✅ SEMPRE use entidades HTML para caracteres especiais
* **`<` = `<`** (less than)
* **`>` = `>`** (greater than) 
* **`&` = `&`** (ampersand)
* **`"` = `&quot;`** (double quote)
* **`'` = `&#39;`** ou `&apos;` (single quote)

## Exemplos Corretos de Uso
```tsx
// ❌ INCORRETO - Causa erro de build
<p>Use arrays em vez de objetos > melhor performance</p>

// ✅ CORRETO - Use entidades HTML
<p>Use arrays em vez de objetos > melhor performance</p>

// ✅ CORRETO - Para símbolos matemáticos
<span>5 < 10 & 10 > 5</span>

// ✅ CORRETO - Para aspas em strings
<p>O usuário disse &quot;Hello World&quot;</p>
```

## Contextos Onde Aplicar
* **Textos em elementos HTML**: `<p>`, `<span>`, `<div>`, etc.
* **Comentários JSX**: `{/* texto com > aqui */}` → `{/* texto com > aqui */}`
* **Conteúdo de labels**: `<label>Campo obrigatório > preenchimento</label>`
* **Descrições em tabelas**: células de tabela com símbolos de comparação
* **Mensagens de erro/sucesso**: textos informativos com símbolos

## ⚠️ ATENÇÃO: Não confundir com JSX válido
```tsx
// ✅ CORRETO - JSX estrutural válido
<div>
  <Component prop="value" />
  {condition && <span>texto</span>}
</div>

// ❌ INCORRETO - Caractere > no conteúdo de texto
<span>Valor A > Valor B</span>

// ✅ CORRETO - Entidade HTML no conteúdo
<span>Valor A > Valor B</span>
```
