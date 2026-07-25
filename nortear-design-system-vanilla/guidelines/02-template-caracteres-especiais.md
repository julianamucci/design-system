# Caracteres Especiais — Template Literals e innerHTML (Nortear)

## Regra

Proibidos em conteúdo de texto inserido via `innerHTML` ou template literals: `<` `>` `&` `"` `'`

Usar entidades HTML: `&lt;` `&gt;` `&amp;` `&quot;` `&#39;`

```ts
// ❌ INCORRETO — caractere bruto em template literal com innerHTML
btn.innerHTML = `<span>Valor A > Valor B</span>`;

// ✅ CORRETO — entidade HTML
btn.innerHTML = `<span>Valor A &gt; Valor B</span>`;
```

## Regra de ouro: `textContent` para dados do usuário

`textContent` escapa automaticamente — preferir sempre para inserir texto dinâmico:

```ts
// ✅ SEMPRE SEGURO — textContent escapa automaticamente
const span = document.createElement('span');
span.textContent = 'Valor A > Valor B'; // renderiza o > como caractere literal

// ❌ NUNCA com dados externos
span.innerHTML = dadoDoUsuario;
```

## Conteúdo controlado vs. dados externos

```ts
// ✅ OK — conteúdo interno controlado (sem dados do usuário)
el.innerHTML = `
  <div class="flex items-center gap-2">
    <span class="font-mono">variant=&quot;default&quot;</span>
  </div>
`;

// ❌ PERIGOSO — dados externos não sanitizados
el.innerHTML = `<span>${api.response.nome}</span>`;

// ✅ CORRETO — dados externos via textContent
const span = document.createElement('span');
span.textContent = api.response.nome;
el.appendChild(span);
```

## Atributos dinâmicos — usar `setAttribute`

```ts
// ✅ CORRETO — setAttribute escapa automaticamente
btn.setAttribute('aria-label', `Excluir ${nomeItem}`);
btn.setAttribute('title', 'Valor A > Valor B');

// ❌ INCORRETO — template literal em atributo via innerHTML
el.innerHTML = `<button aria-label="Excluir ${nomeItem}">`;
// Se nomeItem contiver ", quebra o HTML
```

## Casos comuns em docs pages

```ts
// Exibir código de exemplo
const codeEl = document.createElement('code');
codeEl.textContent = `<Button variant="default">Label</Button>`; // ✅ textContent

// Ou em innerHTML com entidades
el.innerHTML = `<code>&lt;Button variant=&quot;default&quot;&gt;Label&lt;/Button&gt;</code>`;
```
