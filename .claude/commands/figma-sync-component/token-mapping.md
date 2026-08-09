# Token Mapping — custom properties CSS → variáveis do Figma

Referência do comando `/figma-sync-component`.

**Verificado no arquivo em 2026-08-05** lendo as coleções locais via Plugin API.
As 144 variáveis batem uma a uma com o export em `docs/shared/tokens/figma/`.

---

## Arquivo destino

| Arquivo | File key |
|---|---|
| Nortear-DS | `XXAmIFVBKHClzx7YdUSkEb` |

As variáveis são **locais deste arquivo**, não uma biblioteca publicada — só
aparecem em `figma.variables.getLocalVariableCollectionsAsync()`. `get_libraries`
lista apenas UI kits da comunidade (Material 3, Simple Design System, kits da
Apple) e nenhum deles é fonte de token do projeto.

## A regra que dispensa tabela de nomes

**Toda variável tem `codeSyntax.WEB` igual à custom property do CSS.**
`marca/primary` tem `var(--primary)`, `espacamento/spacing-4` tem
`var(--spacing-4)`, e assim por diante — sem exceção nas 144.

Então o mapa não é uma tabela a decorar: é uma busca. Indexe por `codeSyntax.WEB`
e procure pela própria string que está no CSS.

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
// uso: varMap['var(--primary)']
```

Se algum dia uma variável aparecer sem `codeSyntax`, o caminho continua servindo
— por isso as duas chaves.

## Coleções e modos

| Coleção | Vars | Modos |
|---|---|---|
| `Color` | 51 | `default-light`, `default-dark`, `cold-light`, `cold-dark`, `warm-light`, `warm-dark` |
| `Spacing` | 30 | `default`, `condensado`, `confortavel` |
| `Tipografia` | 19 | `minor-third`, `augmented-fourth`, `golden`, `major-second`, `major-third`, `minor-second`, `perfect-fifth`, `perfect-fourth` |
| `Motion` | 19 | `default` |
| `Radius` | 13 | `default` |
| `z-index` | 7 | `default` |
| `Elevation` | 4 | `light`, `dark` |
| `Fonte` | 1 | `default`, `lexend`, `pt-serif`, `lxgw-wenkai` |
| `Texto` | 54 | `pt-BR`, `en`, `es` |
| `Opacidade` | 4 | `light`, `dark` |

Os nomes **não** seguem as pastas do export: lá são `Cor`, `Dimensao`, `Raio`,
`Movimento`, `Elevacao`, `Camada`; aqui são `Color`, `Spacing`, `Radius`,
`Motion`, `Elevation`, `z-index`. Só `Tipografia` e `Fonte` coincidem. Nunca
derive nome de coleção do nome da pasta.

`Tipografia` tem um modo a mais que o export: `perfect-fourth` existe no Figma e
não tem arquivo em `figma/Tipografia/`.

## Prefixos dentro de cada coleção

| Coleção | Prefixos |
|---|---|
| `Color` | `superficie/`, `marca/`, `feedback/`, `estrutura/`, `grafico/`, `sidebar/`, `codigo/` |
| `Spacing` | `espacamento/`, `altura/`, `tamanho/`, `traco/` |
| `Tipografia` | `tamanho/`, `escala/`, `peso/`, `entrelinha/`, `espacamento-letra/` |
| `Motion` | `duracao/`, `curva/`, `deslocamento/` |
| `Texto`, `Opacidade` | `<slug>/` — o conteúdo é por componente |
| `Radius`, `Elevation`, `z-index`, `Fonte` | sem prefixo |

`Spacing` guarda mais que espaçamento: `altura/height-*`, `tamanho/size-*` e
`traco/border-width-default` moram lá.

---

## Armadilhas

**Cor com alfa.** `hsl(var(--primary) / 0.9)` é uma cor com opacidade, não outro
token. Vincule `var(--primary)` e ponha `0.9` no `opacity` do paint — variável do
Figma não carrega alfa por uso. Vale para os hovers do button (`/0.9`, `/0.8`),
os fundos soft das variantes semânticas (`/0.1`, `/0.15`) e as bordas (`/0.3`).

**Nunca clone paint por JSON.** `JSON.parse(JSON.stringify(fills))` descarta o
`boundVariables`, e o nó passa a render a cor literal — sem erro nenhum, só a cor
errada. Clone por spread (`fills.map(f => ({ ...f, opacity }))`), que preserva o
vínculo.

**Alfa de paint não sobrevive à instanciação — use opacidade de NÓ.** Esta é a
armadilha mais cara do lote. `fill.opacity` funciona no componente e é descartado
na instância: o componente mostra `0.1`, a instância nasce com `1`. Sem erro, sem
aviso, e a conferência no componente passa — o defeito só aparece ao arrastar uma
instância para a tela.

```js
// ERRADO — o componente fica certo e toda instância nasce opaca
no.fills = [Object.assign({}, paint, { opacity: 0.1 })];

// CERTO — alfa no nó, cor no fill
no.fills = [paint];
no.opacity = 0.1;
```

Quando o alfa é do FUNDO de um componente que tem conteúdo (o `destructive` do
button, `hsl(var(--destructive) / 0.1)`), opacidade de nó no componente apagaria
o texto junto. Aí o fundo vira uma **camada** absoluta com `STRETCH` nos dois
eixos, ela leva a opacidade de nó, e o componente fica sem fill.

**A camada de alfa fica ATRÁS do conteúdo.** Ela é o fundo: acima do texto, uma
camada de 12% tinge o rótulo — e é o texto neutro que sustenta o 4.5:1 que a
variante semântica promete. `insertChild(0, fundo)` depois de criá-la; a ordem
correta é `badge-bg`, `badge-border`, ícone, texto.

**Alfa que muda no tema escuro é VARIÁVEL, não número.** O CSS sobe o alfa do
fundo no `.dark` (badge: 10%→15% e 12%→18%). Opacidade de nó é vinculável
(`no.setBoundVariable('opacity', v)`), então isso mora na coleção `Opacidade`,
modos `light`/`dark`, com o mesmo valor que o CSS guarda numa custom property de
alfa — os dois lados leem o mesmo número em vez de dois números parecidos.

**Variável de escopo `OPACITY` é PORCENTAGEM.** Guardar `0.1` dá 0,1% e apaga o
fundo; o valor é `10`. Não confie na aparência — leia `no.opacity` de volta
depois de vincular, porque um fundo quase invisível passa por "sutil".

`Opacidade` é coleção separada de `Color`: para ver o componente no escuro é
preciso trocar os dois modos. `Elevation` tem a mesma exigência.

**Instância escondida não expõe filhos.** `instancia.children` devolve `[]`
enquanto `visible === false`, então uma varredura que pinta ícones pula todos os
que nascem desligados, sem erro. Ligue, pinte, desligue de volta.

**Keyframe não entra em sublayer de instância.** `applyManualKeyframeTrack` num
filho de instância lança `Cannot write animations to instance sublayers via the
plugin API`. Frame de timeline que precise animar partes separadas (cortina e
painel de um diálogo, por exemplo) tem que usar nós próprios — ou expor a parte
como propriedade booleana e montar o palco com nós de topo.

**Não conte `children` de página que não está ativa.** Páginas carregam sob
demanda: `figma.root.children[i].children.length` numa página que nunca recebeu
`setCurrentPageAsync` devolve um número menor que o real, sem erro. Parece nó
apagado. Ative a página antes de contar.

**Retângulos sobrepostos viram um VECTOR.** Dois retângulos dentro de um
componente saem fundidos num único nó `Vector`. Contar filhos para inferir o que
existe leva a "reparar" o que não estava quebrado.

**Ao revincular, passe a cor resolvida junto.** `setBoundVariableForPaint` anexa o
vínculo mas mantém a cor concreta que você mandou; se ela for preta, o nó fica
preto mesmo com o vínculo certo — e a leitura de `boundVariables` confirma o
vínculo, então o bug não aparece na verificação. Leia
`variavel.valuesByMode[modoId]` e monte o paint com essa cor:

```js
const col = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId);
const modo = col.modes.find(m => m.name === 'default-light').modeId;
const { r, g, b } = v.valuesByMode[modo];
node.fills = [figma.variables.setBoundVariableForPaint(
  { type: 'SOLID', color: { r, g, b }, opacity: 0.1 }, 'color', v)];
```

**Modo claro/escuro não é variante.** As regras `.dark .nds-*` do CSS são o modo
`default-dark` da coleção `Color`. Vincular a variável já cobre os dois.

**Altura fixa só onde o CSS declara.** Componente com texto não tem `height` — a
altura é padding-block + line-height (WCAG 1.4.4, Resize Text 200%). Só os
icon-only declaram width/height, e em `rem`: 1.5 (24px), 2 (32px), 2.25 (36px),
2.5 (40px).

**Alias de componente antes da escala.** Use `var(--radius-button)`, não
`var(--radius)` — é o alias que muda quando o tema muda.

**Font-size de controle é literal.** O button declara `0.75rem` / `0.875rem` /
`1rem` direto; a escala `Tipografia` governa texto de conteúdo. Não force token
onde o CSS não usa um — transcreva o rem em px (1rem = 16px).

**Sombra sem token.** `box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)` está literal no
CSS e não tem variável. Reproduza como effect e registre na `description` que é
literal.

---

## Convenções já estabelecidas no arquivo

A página **Accordion** (`6:2`) é o precedente — siga o que está lá.

- **Uma página por componente**, com o nome do componente.
- Um frame `<Componente> / Documentação` com a spec em texto: estrutura, slots,
  variantes, tipografia, medidas e movimento.
- Componentes nomeados por caminho: `Accordion`, `Accordion/Item`,
  `Accordion/Trigger`, `Accordion/Content`. Prefixo `.` marca componente privado
  (`.Accordion/Conteúdo padrão`), ícones em `Icon/*`.
- **Eixo de variante único** sempre que possível (`Estado` = Fechado, Aberto,
  Focado, Desabilitado). O que é 1px vira booleano em vez de eixo: um eixo
  inteiro para uma divisória dobra a matriz e produz duas colunas idênticas.
- Slots por troca de instância e booleano, não por variante.
- **Movimento vive nos componentes**, não num frame de spec — assim viaja com a
  biblioteca. O frame de timeline é documentação visível, e a animação real não
  depende dele.
- **Keyframe em nó aninhado dentro de outra instância é descartado em silêncio.**
  Coloque a animação no componente que possui o nó (a rotação do chevron mora no
  Trigger, não no Item) — que é onde o CSS também a coloca.
- PT Serif e LXGW WenKai TC não têm peso Medium; nesses modos de `Fonte` o rótulo
  cai para Regular, igual ao navegador.

## Nomes de camada

O `data-slot` do Vanilla, sem exceção: `button`, `alert`, `alert-title`,
`alert-description`, `alert-action`, `alert-dismiss`, `card`, `card-header`,
`card-content`, `card-footer`. Sem `data-slot` correspondente: `label` para o
texto, `icon` para o SVG, `indicator` para bolinha de estado, `thumb` para
switch/slider.

## Estrutura do component set

```
Button (COMPONENT_SET)
├── variant=default, size=default, state=default
│   └── button
│       ├── icon (16×16)
│       └── label (text)
└── variant=outline, size=lg, state=default, disabled=true
```

Nome do set em PascalCase; variante em `prop=valor` lowercase; ordem `variant`,
`size`, `state`, depois os booleanos (`disabled`, `pressed`, `invalid` — um por
atributo ARIA do CSS).
