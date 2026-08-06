---
description: Lê o CSS compartilhado do componente, importa as variáveis de token do Figma e cria (ou atualiza) o component set no arquivo Nortear-DS.
argument-hint: <component-slug> [figma-file-key]
allowed-tools: [Read, Glob, Grep, mcp__claude_ai_Figma__use_figma]
---

# figma-sync-component

Sincroniza um componente do design system com o arquivo Figma, criando um
component set fiel ao CSS compartilhado.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (obrigatório) — slug em kebab-case. Ex: `button`, `alert`, `input`.
- **`figma-file-key`** (opcional) — arquivo destino. Padrão: `XXAmIFVBKHClzx7YdUSkEb` (Nortear-DS).

---

## Fonte de verdade

O contrato visual vive no **CSS compartilhado**, não em nenhuma stack:

| O que extrair | Onde |
|---|---|
| Variantes, tamanhos, estados, tokens | `docs/shared/styles/nds/<slug>.css` |
| Estrutura de camadas (`data-slot`) | `nortear-design-system-vanilla/src/components/ui/<slug>.ts` |
| Nomes e descrições em pt-BR | `docs/shared/content/<slug>/translations.json` |

O Vanilla é a referência de markup do projeto: não tem lib headless escondendo o
contrato, então o que está lá é o que o design system define. Não leia o `cva()`
de nenhuma stack para extrair variante — ele repete o CSS e pode divergir.

---

## Etapa 1 — Extrair o contrato do CSS

De `docs/shared/styles/nds/<slug>.css`, liste:

- **Variantes** — cada `.nds-<slug>-<variante>` no bloco "Variantes".
- **Tamanhos** — cada `.nds-<slug>-<tamanho>`, incluindo os icon-only.
- **Estados** — os seletores do bloco "Estados": `:hover`, `:focus-visible`,
  `:disabled` / `[aria-disabled="true"]`, `[aria-pressed="true"]`,
  `[aria-invalid="true"]`, `[aria-expanded="true"]`.
- **Tokens** — cada `var(--*)` usada, com a propriedade CSS onde aparece.
- **Animação** — as regras de `transition` e `animation` e os tokens de
  `--duration-*` / `--ease-*` que elas consomem.

Anote as combinações que o CSS trata de forma especial (ex.: `.nds-button-link`
zera o padding; `.dark .nds-button-outline` muda fundo e borda).

## Etapa 2 — Importar as variáveis de token

As coleções do Figma são **`Cor`**, **`Dimensao`**, **`Raio`**, **`Tipografia`**,
**`Movimento`**, **`Fonte`**, **`Elevacao`** e **`Camada`** — os nomes e os
caminhos das variáveis estão em [token-mapping.md](./figma-sync-component/token-mapping.md).

As variáveis podem estar em dois lugares, e o código precisa cobrir os dois:
**locais** no próprio arquivo destino, ou **publicadas** como biblioteca de
equipe. Procure primeiro no arquivo — se as coleções foram criadas ali e ainda
não publicadas, `teamLibrary` não devolve nada e a busca falharia sem motivo.

Descubra pelas coleções, nunca pelo nome da biblioteca:

```js
const alvo = new Set(['Cor','Dimensao','Raio','Tipografia','Movimento','Fonte','Elevacao','Camada']);
const varMap = {};

// 1. locais do arquivo destino
for (const coll of await figma.variables.getLocalVariableCollectionsAsync()) {
  if (!alvo.has(coll.name)) continue;
  for (const id of coll.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(id);
    if (v) varMap[`${coll.name}/${v.name}`] = v;
  }
}

// 2. biblioteca publicada, só para o que faltou
for (const coll of await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync()) {
  if (!alvo.has(coll.name)) continue;
  for (const lv of await figma.teamLibrary.getVariablesInLibraryCollectionAsync(coll.key)) {
    const chave = `${coll.name}/${lv.name}`;
    if (varMap[chave]) continue;
    try { varMap[chave] = await figma.variables.importVariableByKeyAsync(lv.key); } catch (_) {}
  }
}
```

Antes de construir qualquer coisa, **reporte o que achou**: nomes de coleção,
modos de cada uma e a contagem de variáveis. Se algum nome divergir do mapa,
pare — corrigir [token-mapping.md](./figma-sync-component/token-mapping.md) vem
antes de desenhar, senão o component set nasce vinculado a nada.

Se nenhuma coleção casar, **pare e reporte** — não caia para hex solto: o
component set ficaria sem vínculo com o tema e não seguiria a troca de modo.

## Etapa 3 — Mapear tokens CSS → variáveis Figma

Consulte [token-mapping.md](./figma-sync-component/token-mapping.md). Duas
armadilhas que o mapa detalha:

- **Cor com alfa** (`hsl(var(--primary) / 0.9)`) — vincule a variável de cor e
  aplique o alfa no `opacity` do paint. Variável não carrega alfa por uso.
- **Modo claro/escuro** — as regras `.dark .nds-*` não viram variante: são o
  outro modo da coleção `Cor`. Vincular a variável já resolve os dois.

## Etapa 4 — Construir o component set

Um único bloco JavaScript via `mcp__claude_ai_Figma__use_figma` que:

1. Carrega as fontes com `figma.loadFontAsync`.
2. Remove o component set anterior de mesmo nome, se existir.
3. Cria um `figma.createComponent()` por combinação de props.
4. Nomeia cada um como `variant=X, size=Y, state=Z` (lowercase, vírgula+espaço).
5. Nomeia as camadas com o `data-slot` do Vanilla — nunca `Frame`, `Rectangle`
   ou `Text`.
6. Vincula tokens com `figma.variables.setBoundVariableForPaint` em fills,
   strokes e cor de texto.
7. Monta as dimensões com auto-layout.
8. `figma.combineAsVariants(components, figma.currentPage)`.
9. Nomeia o set em PascalCase e escreve a `description` com as props e os tokens.

**Altura é resultado, não medida.** Componentes com texto não recebem `height`
fixa: a altura sai de padding-block + line-height, para o componente crescer com
o tamanho de fonte do navegador (WCAG 1.4.4). No Figma isso é auto-layout com
`primaryAxisSizingMode: 'AUTO'`. A exceção são os icon-only, que declaram
width/height em rem no próprio CSS por não terem texto — esses vão com medida
fixa.

## Etapa 5 — Estados e animação

Os estados do CSS viram propriedade de variante; as transições viram interação
de protótipo.

| Estado no CSS | No Figma |
|---|---|
| `:hover` | variante `state=hover` |
| `:focus-visible` | variante `state=focus` (o anel é o `box-shadow` do CSS) |
| `:disabled` / `[aria-disabled]` | propriedade booleana `disabled` |
| `[aria-pressed="true"]` | propriedade booleana `pressed` |
| `[aria-invalid="true"]` | propriedade booleana `invalid` |

Para a animação, ligue as variantes com Smart Animate usando os valores que o
CSS já declara — duração de `--duration-*` e curva de `--ease-*`, ambas
disponíveis na coleção `Movimento` (a curva é string, colar no custom easing).
Transformações de `:hover` / `:active` (ex.: `scale`) entram como escala do frame
na variante correspondente.

Não invente estado que o CSS não tem, e não deixe de fora estado que ele tem.

## Etapa 6 — Confirmar

Reporte: nome e posição do component set, número de variantes, quantas variáveis
foram vinculadas e quais estados foram modelados.

---

## Regras obrigatórias

- **Nunca invente token** — só variável existente nas coleções. Sem coleção, pare.
- **Nunca use nome de camada genérico** — sempre o `data-slot` do código.
- Componente com sub-componentes (`Card`, `Dialog`) → um component set por
  sub-componente.
- Componente sem variantes (`Separator`) → um componente único.
- O que estiver no CSS mas não no component set deve ser reportado, não omitido
  em silêncio.
