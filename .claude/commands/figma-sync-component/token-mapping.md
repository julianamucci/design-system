# Token Mapping — custom properties CSS → variáveis do Figma

Referência do comando `/figma-sync-component`.

**Sincronizado em 2026-09-02** contra `docs/shared/tokens/figma-variables.json`,
comparando as duas pontas por resumo determinístico (token, modo e valor, com o
float32 do Figma arredondado dos dois lados). **As oito coleções batem token a
token, nos seis modos.**

O `--ring-offset-color`, que sobrava no arquivo sem par no CSS, foi removido em
2026-09-02 depois de medido sem uso três vezes — nenhum alias de outra variável,
nenhum estilo local, e ausente nos 1262 nós das dez páginas.

Vale reparar em como a defasagem chegou até aqui. A nota anterior dizia que as
144 variáveis batiam uma a uma em 2026-08-05, e nada avisou quando deixaram de
bater: o `--check` do gerador compara a saída do gerador com o arquivo JSON, os
dois concordavam, e nenhum dos dois olhava para o Figma. Portão que mede
fidelidade entre duas cópias locais não diz nada sobre a terceira ponta. Antes de
confiar nesta linha, refaça o resumo — a data acima envelhece sozinha.

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
`var(--spacing-4)`, e assim por diante — sem exceção.

Casar por `codeSyntax.WEB` é o que torna a sincronia robusta a nome, e vale
lembrar por quê mesmo agora que os nomes batem. Até 2026-09-02 as coleções do
arquivo se chamavam `Color`/`Spacing`/`Radius`/`Motion`/`Elevation`/`z-index`
contra `Cor`/`Dimensao`/`Raio`/`Movimento`/`Elevacao`/`Camada` no export, e a
sincronia daquele dia atravessou a divergência inteira sem tropeçar porque nunca
olhou para o nome da coleção. Depois disso os seis foram renomeados para os do
export — 130 variáveis mudaram de coleção de nome sem que uma única das 932
amarrações de nó se soltasse, porque o id da variável não muda. Alinhar os nomes
foi higiene, não pré-requisito: quem indexar por `codeSyntax.WEB` continua imune
se eles divergirem de novo.

Duas coleções do arquivo **não têm origem no CSS** e não entram em sincronia
nenhuma: `Texto` (54 variáveis × pt-BR/en/es) e `Opacidade` (8 × light/dark,
nenhuma com `codeSyntax.WEB`). São feitas à mão no Figma; qualquer varredura que
apague o que não está no export destrói as duas.

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
| `Cor` | 54 | `default-light`, `default-dark`, `cold-light`, `cold-dark`, `warm-light`, `warm-dark` |
| `Texto` | 54 | `pt-BR`, `en`, `es` |
| `Dimensao` | 31 | `default`, `condensado`, `confortavel` |
| `Tipografia` | 25 | `minor-second`, `minor-third`, `major-second`, `major-third`, `perfect-fourth`, `augmented-fourth`, `perfect-fifth`, `golden` |
| `Movimento` | 19 | `default` |
| `Raio` | 13 | `default`, `warm`, `cold` |
| `Camada` | 8 | `default` |
| `Opacidade` | 8 | `light`, `dark` |
| `Elevacao` | 4 | `light`, `dark` |
| `Fonte` | 1 | `default`, `lexend`, `pt-serif`, `lxgw-wenkai` |

Os nomes e as contagens coincidem com os do export desde 2026-09-02. Se alguma
linha divergir, é defasagem — não há mais exceção conhecida.

`Raio` ganhou os modos `warm` e `cold` na mesma data. Antes tinha só `default`,
o que quer dizer que a identidade de raio de dois dos três temas simplesmente
não existia no arquivo — o `radius` do warm é 24 e o do cold é 0, contra 14 do
default, e nada disso era representável.

## Trocar de tema = trocar SETE modos

No CSS, trocar de tema arrasta os outros eixos junto: `applyTheme` lê
`themeAxisDefaults` e escreve, de uma vez, a cor, o raio, a densidade, a fonte e
a escala tipográfica. No Figma **não existe equivalente nativo**, e vale saber
por quê antes de tentar montar um.

Modo é por coleção, e uma coleção não consegue governar o modo de outra. A
tentativa óbvia — uma coleção `Tema` cujas variáveis fazem alias para as
coleções de eixo — não funciona: alias aponta para uma VARIÁVEL, não para uma
variável num modo, e a resolução usa o modo que o nó tem para a coleção de
destino. Os próprios typings do Plugin API demonstram isso com duas coleções de
dois modos: as quatro combinações dão quatro resultados diferentes. Alias
atravessa coleção, mas não carrega modo.

A herança que EXISTE é outra, e é nela que se apoia: modo explícito num nó
desce para os descendentes (`resolvedVariableModes` soma o que o nó declara ao
que os ancestrais declaram). E `PageNode` também tem `explicitVariableModes` —
não é privilégio de frame. Então o portador do tema pode ser uma página inteira
ou um frame; o que estiver dentro herda sem fazer nada.

O mapa de cada tema, tirado de `themeAxisDefaults`:

| Coleção | `default` | `warm` | `cold` |
|---|---|---|---|
| `Cor` | `default-light` / `default-dark` | `warm-light` / `warm-dark` | `cold-light` / `cold-dark` |
| `Raio` | `default` | `warm` | `cold` |
| `Dimensao` | `default` | `confortavel` | `condensado` |
| `Fonte` | `default` | `lxgw-wenkai` | `pt-serif` |
| `Tipografia` | `minor-third` | `major-third` | `perfect-fourth` |
| `Elevacao` | `light` / `dark` | idem | idem |
| `Opacidade` | `light` / `dark` | idem | idem |

### A coleção `Tema` é uma TABELA, não um interruptor

O arquivo tem uma coleção `Tema` com seis modos (`default-light` … `cold-dark`)
e três variáveis de texto: `tema-ativo` (o nome do modo), `tema-config` (a tabela
acima em JSON, constante nos seis modos, para ler com o olho) e `tema-id-map`
(o mapa `collectionId → modeId` **daquele** modo, pronto para alimentar
`setExplicitVariableModeForCollection` sem mais nenhuma resolução de nome).

**Fixar o modo de `Tema` num nó não move nenhuma outra coleção.** Isto foi
medido, não deduzido: um frame com `Tema=warm-dark` e mais nada fica com
`explicitVariableModes` valendo exatamente `{Tema: 'warm-dark'}` — `Cor`, `Fonte`,
`Raio`, `Dimensao` e `Tipografia` seguem resolvendo pelo modo padrão de cada uma,
que é a combinação do tema default. A coleção guarda a intenção; quem executa é
o script. Vale desconfiar de qualquer descrição que diga que ela "sincroniza
automaticamente" — o Figma não tem esse mecanismo, e a seção acima explica por quê.

O quinto eixo do CSS, `base-tipo`, **não tem contrapartida no Figma**: o
`--type-base` vale 16 em todos os oito modos de `Tipografia`. Hoje isso não
perde nada, porque os três temas usam `typebase: 'm'`. Passa a perder no dia em
que um tema mudar a base.

O análogo de `applyTheme`, lendo o mapa em vez de repetir a tabela — assim a
tabela mora num lugar só, e um tema novo é um modo novo em `Tema`, não uma
edição de script:

```js
async function aplicarTema(no, tema /* 'warm-dark' etc. */) {
  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  const temaCol = cols.find((c) => c.name === 'Tema');
  const modo = temaCol.modes.find((m) => m.name === tema);
  if (!modo) throw new Error('tema desconhecido: ' + tema);

  let idMap = null;
  for (const id of temaCol.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(id);
    if (v && v.name === 'tema-id-map') idMap = v;
  }

  const mapa = JSON.parse(idMap.valuesByMode[modo.modeId]);
  for (const [cid, mid] of Object.entries(mapa)) {
    const col = cols.find((c) => c.id === cid);
    if (!col) throw new Error('coleção do mapa não existe mais: ' + cid);
    no.setExplicitVariableModeForCollection(col, mid);
  }
  no.setExplicitVariableModeForCollection(temaCol, modo.modeId);  // registra a intenção
}
```

**Não confira o resultado na mesma execução.** `resolvedVariableModes` devolve
`{}` logo depois da escrita, no mesmo script — não porque a escrita falhou, mas
porque o getter não reflete o que ainda não assentou. `explicitVariableModes`
responde na hora e é o que interessa; se quiser o resolvido, leia numa chamada
seguinte. Quem conferir pelo resolvido e vir vazio vai concluir que a aplicação
não funcionou, e ela funcionou.

**Fixe os sete ou nenhum.** Fixar um subconjunto é o que produz o defeito mais
difícil de enxergar aqui: o nó fica com uma coleção presa a um tema e as outras
seis resolvendo pelo modo padrão da coleção, o que é uma combinação que nenhum
tema define. Não dá erro, e não parece quebrado — parece uma escolha de design.
Foi assim que o component set `Alert` deste arquivo ficou com `Cor=cold-light` e
o resto em `default`, e o componente `Accordion` com `Tipografia=augmented-fourth`,
que não é o padrão de tema nenhum.

## Prefixos dentro de cada coleção

| Coleção | Prefixos |
|---|---|
| `Cor` | `superficie/`, `marca/`, `feedback/`, `estrutura/`, `grafico/`, `sidebar/`, `codigo/`, `outros/` |
| `Dimensao` | `espacamento/`, `altura/`, `tamanho/`, `traco/` |
| `Tipografia` | `tamanho/`, `escala/`, `peso/`, `entrelinha/`, `espacamento-letra/` |
| `Movimento` | `duracao/`, `curva/`, `deslocamento/` |
| `Texto`, `Opacidade` | `<slug>/` — o conteúdo é por componente |
| `Raio`, `Elevacao`, `Camada`, `Fonte` | sem prefixo |

`Dimensao` guarda mais que espaçamento: `altura/height-*`, `tamanho/size-*` e
`traco/border-width-default` moram lá.

---

## Armadilhas

**Token que muda de SIGNIFICADO quebra o Figma em silêncio.** Sincronizar valor
mantém o vínculo intacto e ainda assim estraga o componente, quando o novo valor
pertence a outra família. Medido em 2026-09-02 com o `--accent`: ele era um tom
claro (`#f5f5f5` no default) usado em força total, e passou a ser a mesma cor do
`--primary` (`#3c6972`), usada **sempre com alfa** no CSS. As dezesseis
sobreposições de hover de `outline` e `ghost` do Button estavam com opacidade de
nó `1` — correto para o token antigo — e viraram uma placa de teal sólido por
cima do rótulo. Nenhum portão viu: o vínculo continua certo, a variável continua
existindo, e a única coisa que mudou foi o que a cor QUER dizer.

A pergunta a fazer depois de cada sincronia não é "algum vínculo quebrou", é
**"algum token passou a ser usado com alfa, ou deixou de ser?"**. Para esses,
varra os consumidores no Figma e confira a opacidade de nó contra o alfa do CSS.
O `--accent` do design system só aparece com `/ 0.1`; qualquer nó amarrado a ele
em força total está errado por construção.

**Vínculo VÁLIDO apontando para o token ERRADO não aparece em portão nenhum.**
Prima da armadilha acima, e mais silenciosa: o token existe, o vínculo resolve, a
cor pintada pode até estar certa. O que mudou foi qual token o CSS manda usar.
Em `886ee7af3` (2026-08-23) o título das quatro variantes do Alert saiu da cor
semântica para o par `-foreground` da própria cor; no Figma, `destructive`,
`success` e `info` continuaram com o título amarrado à cor semântica, e as
descrições apontavam para `foreground` em vez de `destructive-foreground` e
companhia. Os quatro pares valem `--foreground` neste projeto, então metade das
diferenças não pintava um pixel diferente — e some inteira num tema derivado que
divirja os quatro, que é exatamente o motivo de a indireção existir.

**E a deriva costuma ser PARCIAL, o que arruína a sondagem por amostra.** Das
quatro variantes semânticas do Alert, três tinham o título errado e a `warning`
já estava certa. Conferir uma variante e concluir pelas outras teria dado
qualquer resposta, conforme a variante sorteada. Compare as N contra o que o CSS
declara para cada uma, nunca uma contra as demais.

**A variante com ANATOMIA diferente escapa da varredura que procura por
camada.** Corolário do anterior, e pior, porque some antes de ser comparada. No
Badge, as quatro variantes semânticas carregavam o fundo e a borda em duas
camadas absolutas — `badge-bg` e `badge-border` —, montagem que só existia porque
o desenho antigo tinha alfa, e alfa em opacidade de nó apagaria o texto junto. A
`default` era preenchida sólida e **não tinha as duas camadas**. Qualquer sondagem
escrita como "leia `badge-bg` de cada variante" devolveria quatro linhas
plausíveis e nenhuma menção à quinta.

Enumere as variantes pelo CONJUNTO (`componentSet.children`), não pelas camadas
que você espera achar dentro delas, e trate camada ausente como achado, nunca
como linha a pular. E quando o motivo da montagem desaparece — aqui, o alfa —,
verifique se ela ainda vale: o modelo novo é opaco, e as duas camadas viraram
enfeite que sobrevive só por consistência entre irmãs.

**Mas opacidade sozinha não diz o que a camada FAZ — leia a geometria.** Na mesma
varredura eu apliquei a regra acima ao `variant=link` e relatei que ele pintava
uma placa sólida de `primary` sobre o texto: camada chamada `hover-overlay`,
amarrada a cor de marca, opacidade 1. Os três sinais batiam. Só que o nó mede
**1px de altura**, ancorado em `MAX/STRETCH` três pixels abaixo do rótulo — é o
`text-decoration: underline` do CSS, e estava certo desde sempre. Opacidade 1 num
sublinhado é o valor correto; num véu de fundo é defeito. Antes de chamar uma
camada de errada, leia `height`, `layoutPositioning` e `constraints`: nome e alfa
descrevem a intenção de quem criou, não o que o nó desenha.

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

`Opacidade` é coleção separada de `Cor`: para ver o componente no escuro é
preciso trocar os dois modos. `Elevacao` tem a mesma exigência.

**Instância escondida não expõe filhos.** `instancia.children` devolve `[]`
enquanto `visible === false`, então uma varredura que pinta ícones pula todos os
que nascem desligados, sem erro. Ligue, pinte, desligue de volta.

**Keyframe não entra em sublayer de instância.** `applyManualKeyframeTrack` num
filho de instância lança `Cannot write animations to instance sublayers via the
plugin API`. Frame de timeline que precise animar partes separadas (cortina e
painel de um diálogo, por exemplo) tem que usar nós próprios — ou expor a parte
como propriedade booleana e montar o palco com nós de topo.

**Não conte `children` de página que não está ativa** — e não confie na primeira
contagem depois de carregar. Páginas carregam sob demanda:
`figma.root.children[i].children.length` numa página que nunca recebeu
`setCurrentPageAsync` devolve um número menor que o real, sem erro. Parece nó
apagado.

`await pagina.loadAsync()` evita a troca de página, mas **não basta uma vez**.
Medido em 2026-09-02, varrendo as dez páginas atrás de quem usava um token: a
primeira passada viu 1011 nós, a segunda 1262, a terceira 1262 de novo. As
instâncias ainda não estavam expandidas na primeira, e `findAll` não reclama de
subárvore que ainda não chegou — devolve menos.

O que torna isto perigoso é a direção do erro. Uma varredura que procura uso de
token e passa por menos nós devolve **zero uso**, que é a resposta que autoriza
apagar. Quem parou na primeira passada teria concluído "não é usado" com um
terço da árvore por ver. Rode até a contagem repetir, e relate a contagem junto
com o resultado — número de nós varridos é parte da resposta, não estatística
decorativa.

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
`default-dark` da coleção `Cor`. Vincular a variável já cobre os dois.

**Altura fixa só onde o CSS declara.** Componente com texto não tem `height` — a
altura é padding-block + line-height (WCAG 1.4.4, Resize Text 200%). Só os
icon-only declaram width/height, e em `rem`: 1.5 (24px), 2 (32px), 2.25 (36px),
2.5 (40px).

**Alias de componente antes da escala.** Use `var(--radius-button)`, não
`var(--radius)` — é o alias que muda quando o tema muda. O Alert violava isto
amarrando `radius` onde o CSS declara `var(--radius-alert)`: mesmos 14/24/0 nos
três temas, zero diferença visual, e uma bomba armada para o dia em que alguém
mover o alias sem mover a escala.

**Raio aninhado se AMARRA, não se calcula à mão.** Pela regra `Ri = Re − E`, um
elemento recuado 2px dentro de um alerta pede `radius-alert − 2`. No Figma não
dá para escrever `calc`, e cravar o número congela o valor num tema — foi assim
que o anel do frame de movimento do Alert ficou com 10/8 quando o `--radius`
passou de 10 para 14. A saída é procurar na escala o degrau que JÁ vale a
diferença certa: `radius-md` é `radius-alert − 2` nos três temas (14/12, 24/22,
0/0), então o retângulo interno amarra nele e acompanha o tema sozinho. Antes de
usar o atalho, confira o degrau nos três — a escala não é uniforme, e o cold
achata quase tudo em zero.

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
- **A spec vive em anotação de Dev Mode, ancorada no nó a que se refere** — não
  num frame de texto. Ver "Anotações" na skill (Etapa 5b). O frame
  `<Componente> / Documentação` é o formato **antigo**: ainda existe em Accordion,
  Alert, AlertDialog, AspectRatio, Avatar, Breadcrumb e Button, e deve ser
  migrado quando a página for tocada. O Badge já está migrado e é o precedente.
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
