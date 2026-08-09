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
| Texto renderizado dentro do componente | `demonstration.labels` do mesmo JSON — vira variável na coleção `Texto`, um modo por idioma (Etapa 4b) |

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

As variáveis são **locais do arquivo destino** — não uma biblioteca publicada.
São 8 coleções e 144 variáveis; a lista está em
[token-mapping.md](./figma-sync-component/token-mapping.md).

**Toda variável tem `codeSyntax.WEB` igual à custom property do CSS** — a
tradução é uma busca, não uma tabela a decorar:

```js
const varMap = {};
for (const c of await figma.variables.getLocalVariableCollectionsAsync()) {
  for (const id of c.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(id);
    if (!v) continue;
    const web = v.codeSyntax && v.codeSyntax.WEB;   // "var(--primary)"
    if (web) varMap[web] = v;
    varMap[`${c.name}/${v.name}`] = v;              // caminho, como reserva
  }
}
// uso direto com o que está no CSS: varMap['var(--spacing-4)']
```

Não filtre por nome de coleção. Os nomes no Figma (`Color`, `Spacing`, `Radius`,
`Motion`, `Elevation`, `z-index`) não são os das pastas do export (`Cor`,
`Dimensao`, `Raio`…), e filtrar por palpite descarta tudo em silêncio.

Se `varMap` vier vazio, **pare e reporte** — não caia para hex solto: o component
set ficaria sem vínculo com o tema e não seguiria a troca de modo.

## Etapa 3 — Mapear tokens CSS → variáveis Figma

Consulte [token-mapping.md](./figma-sync-component/token-mapping.md). Duas
armadilhas que o mapa detalha:

- **Cor com alfa** (`hsl(var(--primary) / 0.9)`) — vincule a variável de cor e
  aplique o alfa no `opacity` do paint. Variável não carrega alfa por uso.
- **Modo claro/escuro** — as regras `.dark .nds-*` não viram variante: são o modo
  `default-dark` da coleção `Color`. Vincular a variável já resolve os dois.

## Etapa 4 — Construir o component set

O arquivo já tem um precedente: a página **Badge**. Leia as convenções em
[token-mapping.md](./figma-sync-component/token-mapping.md) e siga — uma página
por componente, spec em anotação ancorada (Etapa 5b), eixo de variante único,
movimento dentro dos componentes.

Em blocos de no máximo 10 operações por chamada de `mcp__claude_ai_Figma__use_figma`:

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

## Etapa 4b — Texto do componente vem de variável, nunca digitado

Nenhum texto de component set é string literal. O idioma vem de uma variável
`STRING` da coleção **`Texto`**, que tem um modo por idioma (`pt-BR`, `en`, `es`).
Quem consome troca o modo no frame; o arquivo inteiro acompanha.

**Vincule a PROPRIEDADE, não a camada.** Camada de texto que expõe uma
propriedade de componente (`Rótulo`, `Título`, `Descrição`) usa
`componentPropertyReferences.characters` — e `setBoundVariable('characters', v)`
**apaga essa referência**: as duas disputam o mesmo slot. A propriedade some do
painel, a instância para de aceitar texto do consumidor, e nada avisa. Foi assim
que 9 propriedades morreram de uma vez em 6 páginas, com o arquivo parecendo
correto.

O vínculo vai no `defaultValue` da propriedade:

```js
conjunto.editComponentProperty('Rótulo#333:0', {
  defaultValue: figma.variables.createVariableAlias(textos['badge/defaultLabel']),
});
```

Assim a camada continua ligada à propriedade, a propriedade segue o idioma, e a
instância ainda sobrescreve — com literal ou com outra variável:

```js
instancia.setProperties({
  'Rótulo#333:0': figma.variables.createVariableAlias(textos['badge/destructiveLabel']),
});
```

`setBoundVariable('characters', v)` na camada só é correto onde **não existe**
propriedade de texto — conteúdo fixo de composição, como o corpo do Accordion.

**Consequência para a grade de variantes:** a propriedade é uma só para o set
inteiro, então todas as colunas mostram o mesmo rótulo. Isso é o certo — ali se
compara estilo, não conteúdo. O rótulo específico de cada variante mora nos
frames de exemplo, uma instância por variante, cada uma com sua variável.

**A fonte é `demonstration.labels` do `translations.json`** — os três idiomas já
estão lá, completos e auditados. Não invente rótulo para o Figma e não crie
placeholder genérico: o texto tem que ser o mesmo que as 5 stacks renderizam.
Digitar "Botão" nas 24 variantes do Button foi o que deixou o Figma divergir do
código, e a divergência só apareceu quando alguém foi medir, meses depois.

```js
// A coleção Texto guarda o caminho no JSON em codeSyntax.WEB, do mesmo jeito
// que as coleções de token guardam `var(--x)`. A tradução é uma busca.
const textos = {};
const colTexto = (await figma.variables.getLocalVariableCollectionsAsync())
  .find(c => c.name === 'Texto');
for (const id of colTexto.variableIds) {
  const v = await figma.variables.getVariableByIdAsync(id);
  if (v) textos[v.name] = v;            // textos['button/primary']
}

// Camada SEM propriedade de texto: aí sim o vínculo é nela. A fonte precisa
// estar carregada antes de vincular, não só antes de escrever.
for (const seg of no.getStyledTextSegments(['fontName'])) {
  await figma.loadFontAsync(seg.fontName);
}
no.setBoundVariable('characters', textos['accordion/a1']);
```

Regras:

- **Uma variável por chave de `demonstration.labels`**, nomeada `<slug>/<chave>`,
  com `scopes: ['TEXT_CONTENT']` e `setVariableCodeSyntax('WEB', '<slug>.demonstration.labels.<chave>')`.
  Sem o scope, a variável polui todo seletor de string do arquivo.
- **Chave que falta no JSON não se resolve no Figma.** Se a variante existe no
  produto e não tem par de rótulo, acrescente ao `translations.json` nos três
  idiomas — foi o caso do `variant=default` do Alert. O Figma nunca é a fonte.
- **Instância com conteúdo próprio usa `setProperties`, não vínculo na camada.**
  Os botões Cancelar/Excluir do AlertDialog e o "Componentes" da trilha do
  Breadcrumb são override de instância: sem vínculo próprio ficam presos ao
  idioma em que foram digitados enquanto o resto da tela troca. Instância sem
  conteúdo próprio não precisa de nada — herda.
- **Texto que não é traduzível não vira variável de idioma**: iniciais de avatar,
  contadores (`+3`), siglas. Deixe literal e reporte na Etapa 6.
- Só texto **dentro** de component set. Texto de spec não entra na coleção: ele
  vira anotação (Etapa 5b), e anotação não é conteúdo traduzível.

Antes de fechar, rode o detector de propriedade órfã. Ele é barato e pega
exatamente o defeito que não aparece na tela:

```js
const defs = conjunto.componentPropertyDefinitions;
const usadas = new Set();
for (const t of conjunto.query('TEXT')) {
  const r = t.componentPropertyReferences && t.componentPropertyReferences.characters;
  if (r) usadas.add(r);
}
const orfas = Object.keys(defs)
  .filter(k => defs[k].type === 'TEXT' && !usadas.has(k));   // tem que sair vazio
```

E confira o idioma trocando o modo e lendo de volta, em vez de confiar na
aparência:

```js
conjunto.setExplicitVariableModeForCollection(colTexto, modoEn);
// … ler characters …
conjunto.clearExplicitVariableModeForCollection(colTexto);   // volta a herdar
```

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
disponíveis na coleção `Motion` (a curva é string, colar no custom easing).
Transformações de `:hover` / `:active` (ex.: `scale`) entram como escala do frame
na variante correspondente.

Não invente estado que o CSS não tem, e não deixe de fora estado que ele tem.

## Etapa 5b — A spec vive em anotação, ancorada no nó

Nada de frame de texto solto na página. A spec vai em **anotação de Dev Mode**
(`no.annotations`), presa ao nó a que se refere — e, quando existir propriedade
correspondente, presa também à propriedade (`opacity`, `fills`, `strokes`,
`padding`, `cornerRadius`, `mainComponent`, `width`…).

O motivo é de leitura por máquina: `get_design_context` devolve cada anotação
como atributo **no elemento certo** do código de referência
(`data-<categoria>-annotations`), e instrui explicitamente o leitor a não
ignorá-la. Frame de texto vira um bloco solto que não se liga a nó nenhum — e
que envelhece sem ninguém notar, como aconteceu com a lista de variantes do
Badge.

```js
const cats = {};
for (const c of await figma.annotations.getAnnotationCategoriesAsync()) cats[c.label] = c.id;

no.annotations = [{
  labelMarkdown: 'Soft surface. Alpha from `Opacidade/badge/fundo-semantica`…',
  properties: [{ type: 'opacity' }, { type: 'fills' }],
  categoryId: cats['Tokens'],
}];
```

Regras:

- **Escreva em inglês.** A anotação é superfície de máquina, lida por quem for
  portar o componente. `description` de componente continua em pt-BR: essa é a
  superfície do designer, no painel de assets.
- **Categorias já criadas**, e o nome vira o nome do atributo no
  `get_design_context`: `Contract` (azul), `Tokens` (violeta), `Accessibility`
  (verde), `Authoring trap` (laranja). Reuse; não crie sinônimo.
- **Sem negrito markdown.** `**x**` volta como `****x****` no atributo, e negrito
  em volta de trecho em crase sai destruído. Crase sozinha passa limpa — use só
  ela.
- **`properties` é validado contra o tipo do nó E contra o que ele tem.** O
  script é atômico: uma âncora inválida derruba a chamada inteira. Rejeições
  medidas nesta migração:

  | Âncora | Rejeitada em | Onde ela cabe |
  |---|---|---|
  | `padding`, `height` | `COMPONENT_SET` (sem auto-layout) | na variante |
  | `opacity` | `RECTANGLE` | em `FRAME` |
  | `mainComponent` | `COMPONENT` | em `INSTANCE` |
  | `strokes` | moldura **sem traço** | moldura que tem traço |

  Não adivinhe nó a nó — tente ancorado e caia para solto:

  ```js
  function anotar(no, base, props) {
    try { no.annotations = [{ ...base, properties: props.map(t => ({ type: t })) }]; }
    catch { no.annotations = [base]; }   // âncora rejeitada, texto preservado
  }
  ```
- **Ancore no nó certo, não no set inteiro.** Regra de alfa vai no `badge-bg`;
  regra do rótulo vai no `label`; eixo de variante vai no set. Quem lê o código
  de referência recebe cada nota junto do elemento que ela governa.
- **Anotação registra o "porquê", não o "o quê".** O que dá para ler do nó
  (cor, raio, padding) já vem no design context. Anote a decisão e a armadilha:
  por que existe camada em vez de fill, por que não há eixo de estado, o que
  quebra se alguém vincular a camada em vez da propriedade.

## Etapa 6 — Confirmar

Reporte: nome e posição do component set, número de variantes, quantas variáveis
foram vinculadas, quais estados foram modelados e quantas anotações ficaram em
cada categoria.

---

## Regras obrigatórias

- **Nunca invente token** — só variável existente nas coleções. Sem coleção, pare.
- **Nunca digite texto dentro de component set** — string literal numa camada de
  componente é o mesmo defeito que hex solto num fill: sai do tema. Vincule à
  coleção `Texto` (Etapa 4b) — na **propriedade** quando a camada expõe uma,
  porque vincular a camada mata a propriedade em silêncio.
- **`clone()` não preserva `componentPropertyReferences` dos filhos.** Variante
  criada a partir de outra fica surda às propriedades booleanas e de troca de
  instância — o ícone não liga, e nada acusa até alguém olhar. Reatribua as
  referências no clone e confira ligando a propriedade.
- **Nunca use nome de camada genérico** — sempre o `data-slot` do código.
- **Nunca escreva spec em frame de texto** — a spec é anotação ancorada no nó
  (Etapa 5b). Frame solto não se liga a nó nenhum e não chega a quem lê o
  componente pelo MCP.
- Componente com sub-componentes (`Card`, `Dialog`) → um component set por
  sub-componente.
- Componente sem variantes (`Separator`) → um componente único.
- O que estiver no CSS mas não no component set deve ser reportado, não omitido
  em silêncio.
