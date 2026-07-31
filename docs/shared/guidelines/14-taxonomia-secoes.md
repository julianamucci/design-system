# 14 — Taxonomia das seções: Variantes, Estados e Composições

**Fonte canônica.** As outras referências (`translations-schema.md`,
`08-docs-pages-foundations.md` §11, `_dev-shared.md`, `scripts/audit.mjs`)
apontam para cá em vez de repetir a regra.

---

## Por que esta guideline existe

As três seções nunca tiveram critério escrito. O resultado, medido em 159
entradas de `variants.compositions` em 50 componentes:

- **35 entradas (22%) eram duplicata** — repetiam, quase palavra por palavra, o
  que a seção Variantes do mesmo componente já mostrava. Em `avatar`,
  `breadcrumb`, `radio-group`, `select` e `alert-dialog` a duplicação era integral.
- **7 entradas descreviam estado**, não composição.
- Havia o problema inverso: composições morando dentro de Variantes.

A causa: quando o container `DocsCompositions` nasceu, a regra antiga
("componente sem `cva()` usa `DocsVariants` para composições") nunca foi
revogada. As duas passaram a valer ao mesmo tempo.

---

## As três definições

**ESTADO** — dá para chegar nisso **sem tocar no código**: mexendo na tela, no
teclado ou nos dados.
*hover, foco, aberto, desabilitado, carregando, vazio, última página, copiado.*

**VARIANTE** — o autor escolhe **no código**, e nada de fora entra:
- valor de um eixo fechado (`variant`, `size`, `side`, `type`, `language`,
  `direction`, `numberOfMonths`, `step`); **ou**
- arranjo das **partes do próprio componente** (`CardFooter`,
  `AccordionTrigger`, `PaginationEllipsis`, `SelectGroup`, `DrawerHeader`,
  `MenubarShortcut`).

**COMPOSIÇÃO** — o componente aparece junto de **algo que não é dele**:
- outro componente do design system (Table + Pagination, Alert + Badge);
- **ícone**, quando o ícone é o que a entrada demonstra;
- HTML nativo **estrutural** que é o ponto do exemplo: `<img>` como primeiro
  filho do Card, `<fieldset>`/`<legend>` agrupando Checkboxes, `<span>` de
  prefixo no Input, `<a>` envolvendo o componente, mensagem de erro externa;
- **várias instâncias do próprio componente** formando um padrão (vários
  Checkboxes numa lista, par de Buttons, vários Toggles como filtros).

## Ordem de aplicação

1. Alcançável sem mudar o código? → **ESTADO**
2. Entra algo que não é do componente? → **COMPOSIÇÃO**
3. Sobrou → **VARIANTE**

Aplicada nesta ordem, uma entrada não pode cair em duas seções.

---

## Regra de não-duplicação

Antes de criar uma entrada, verifique se ela já é demonstrada em **outra seção do
mesmo componente** — Variantes, Estados ou Composições. Se for, não crie: a
entrada existente é a canônica.

O teste prático: se a descrição da nova entrada puder ser trocada pela de uma
entrada existente sem que o leitor perceba, é duplicata.

Vale nos dois sentidos. Composição que descreve `Button` + `DropdownMenu` não
pode morar em Variantes só porque o componente não tem `cva()`.

---

## Quatro armadilhas

Todas apareram na reclassificação. Nenhuma é detectável por busca de texto.

1. **Nome da chave não é evidência.** `hover-card.definitionTooltip` não combina
   com o componente Tooltip; `data-table.editableSheet` não combina com Sheet.
   A palavra está no nome da chave, não no exemplo.
2. **Menção negativa ou comparativa não conta.** *"Equivalente ao Drawer"*,
   *"prefira AlertDialog"*, *"sem paginação"* — o outro componente é citado para
   contrastar, não para compor.
3. **`use` é orientação, não descrição do exemplo.** Componente citado só no
   campo `use` costuma ser recomendação de quando usar outra coisa. Julgue pelo
   `name` + `description`.
4. **"Lado a lado" pode ser layout interno.** `calendar.rangeTwoMonths` é UM
   Calendar exibindo dois meses (prop `numberOfMonths`), não dois Calendars.

## Duas distinções finas

- `<a>` **envolvendo** o componente (Badge dentro de um link) → **Composição**.
  O componente **renderizado como** `<a>` (Button com `asChild`) → **Variante**:
  é o mesmo componente trocando o elemento raiz.
- **Ícone citado de passagem não faz composição.** Se o assunto da entrada é o
  arranjo de partes próprias e o ícone só aparece na descrição do arranjo, é
  Variante. O ícone conta quando é o que a entrada demonstra.

---

## Nomes e ids

O **`id` da seção é fixo**: `variantes`, `estados`, `composicoes`. O **título é
livre** e vem do `translations.json` — "Modos de Operação", "Linguagens
Suportadas", "Configurações" e "Ratios Canônicos" são títulos legítimos da seção
`variantes` quando descrevem melhor o eixo daquele componente.

## Omissão

Uma seção é obrigatória **se, e só se,** existir a chave correspondente no
`translations.json`. Componente sem eixo de variação não tem seção Variantes;
componente estrutural não tem Estados. O `audit.mjs` confere nos dois sentidos —
chave sem seção é seção esquecida, seção sem chave é placeholder.

---

## Forma dos dados

```jsonc
"variants": {
  "title": "...",                    // título livre
  "items":        { "<key>": { "name": "...", "description": "...", "use": "..." } },
  "sizes":        { "<key>": { ... } },   // segundo eixo, quando houver
  "compositionsTitle": "Composições",
  "compositions": { "<key>": { "name": "...", "description": "...", "use": "..." } }
},
"states": {
  "title": "...",
  "cols":  { "state": "...", "trigger": "...", "behavior": "..." },
  "<key>": { "label": "...", "trigger": "...", "behavior": "..." }
}
```

- Variantes **sempre** sob `variants.items` — nunca como chaves irmãs soltas de
  `variants`. O inventário do `/product` só enxerga `items`/`styles`.
- Entradas de `states` **sempre** `{label, trigger, behavior}`. Faltando `trigger`,
  a docs page acaba hardcodando a coluna em português e o texto some em `en`/`es`
  (foi o que aconteceu no `accordion`).
- **Toda entrada de Composições nomeia na `description` com o que o componente é
  combinado.** Composição cujo texto não nomeia nada externo é classificação
  errada ou descrição incompleta — e o `audit.mjs` reporta.
