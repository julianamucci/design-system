---
description: Lê o componente Vue do projeto, importa tokens da biblioteca Vue Tokens e cria (ou atualiza) o component set no arquivo Vue-components do Figma.
argument-hint: <component-name> [figma-components-file-key]
allowed-tools: [Read, Glob, Grep, mcp__claude_ai_Figma__use_figma]
---

# figma-sync-component

Sincroniza um componente do projeto Vue com o arquivo de design Figma, criando um component set fiel ao código-fonte.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-name`** (obrigatório) — nome da pasta em `src/components/ui/`. Ex: `button`, `badge`, `input`.
- **`figma-components-file-key`** (opcional) — chave do arquivo Figma destino. Padrão: `4LdwZd2uksGto7PIiGsz0A` (Vue-components).

---

## Instruções

Siga **exatamente** estas etapas em ordem. Não pule etapas.

### Etapa 1 — Ler o código-fonte do componente

Leia **todos** os arquivos dentro de `design-system-vue/src/components/ui/<component-name>/`:

- `index.ts` — contém o `cva()` com todas as **variantes**, **tamanhos** e **tokens CSS** (ex: `bg-primary`, `text-destructive-foreground`)
- `*.vue` — todos os sub-componentes; observe os nomes das camadas/slots usados no `<template>` (ex: `data-slot="button"`, `<slot />`, nomes de elementos internos)

Extraia:
- Lista de **props** (variant, size, state, etc.)
- Todos os **valores possíveis** de cada prop (vindos das chaves do objeto `variants` no `cva`)
- As **classes CSS** aplicadas por variante → mapear para tokens (ver referência)
- A **estrutura de camadas** do template Vue → os nomes das camadas Figma devem espelhar os elementos do template

### Etapa 2 — Importar variáveis da biblioteca Vue Tokens

Execute via `mcp__claude_ai_Figma__use_figma` no arquivo destino:

```js
const collections = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
const coll = collections.find(c => c.libraryName === "Vue Tokens");
const libVars = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(coll.key);
const varMap = {};
for (const lv of libVars) {
  try { varMap[lv.name] = await figma.variables.importVariableByKeyAsync(lv.key); } catch(_) {}
}
```

Use `varMap` para vincular variáveis em fills, strokes e cores de texto via `figma.variables.setBoundVariableForPaint`.

### Etapa 3 — Mapear classes Tailwind → variáveis de token

Consulte a referência em [token-mapping.md](./figma-sync-component/token-mapping.md) para converter as classes CSS do `cva` nos nomes exatos das variáveis da biblioteca (ex: `bg-primary` → `light/color/primary`).

### Etapa 4 — Construir o component set no Figma

Execute um único bloco JavaScript via `mcp__claude_ai_Figma__use_figma` no arquivo destino que:

1. **Carrega fontes** necessárias com `figma.loadFontAsync`
2. **Apaga versão anterior** do component set, se existir:
   ```js
   const existing = figma.currentPage.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'NomeDoComponente');
   if (existing) existing.remove();
   ```
3. **Cria um `figma.createComponent()`** para **cada combinação** de props (produto cartesiano de todas as variantes × tamanhos × estados)
4. Nomeia cada componente como `prop1=valor1, prop2=valor2` (sintaxe de variantes Figma)
5. **Estrutura de camadas** — os nomes das camadas devem ser **idênticos** aos nomes dos elementos no template Vue:
   - Elemento raiz → nome do `data-slot` (ex: `button`, `badge`, `input`)
   - Sub-camadas → nomes dos elementos internos no template (ex: `label`, `icon`, `indicator`, `thumb`)
6. **Aplica tokens** via `figma.variables.setBoundVariableForPaint` para fills, strokes e texto
7. **Aplica dimensões** via auto-layout com os valores exatos do `cva` (padding, gap, height, border-radius — ver tabela de conversão Tailwind → px em [token-mapping.md](./figma-sync-component/token-mapping.md))
8. Combina com `figma.combineAsVariants(components, figma.currentPage)`
9. Nomeia o component set com o nome **PascalCase** do componente (ex: `Button`, `Badge`, `Input`)
10. Adiciona `description` com props disponíveis e referência aos tokens usados
11. Posiciona abaixo de component sets existentes na página

### Etapa 5 — Confirmar

Informe ao usuário:
- Nome e posição do component set criado
- Número de variantes geradas
- Quantas variáveis de biblioteca foram vinculadas
- Quais props/variantes foram criadas

---

## Regras obrigatórias

- **Nunca** invente tokens — use apenas variáveis existentes na biblioteca ou o hex fallback correto
- **Nunca** use nomes de camadas genéricos como `Frame`, `Rectangle`, `Text` — sempre use os nomes do código
- Para componentes com sub-componentes (ex: `Card`, `Dialog`), crie um component set por sub-componente
- Para componentes sem variantes (ex: `Separator`), crie um único componente com suas propriedades de configuração
- Se o componente tiver estados (`:disabled`, `aria-invalid`), modele-os como propriedade booleana Figma (`disabled=false/true`)
