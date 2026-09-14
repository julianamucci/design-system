# PRD — Progress

> **Estado descrito**: 2026-09-13, escrito a partir do código, antes da revisão
> serial deste componente. A revisão de código usará este documento como base:
> tudo que está aqui foi lido nos cinco primitivos, nas cinco árvores de stories,
> na folha compartilhada, no conteúdo compartilhado e na fonte das quatro libs —
> não na documentação delas.
>
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto.

## 1. Identidade

Barra linear **passiva** que diz quanto de uma operação mensurável já andou. Sem
valor conhecido, ela troca o preenchimento por um traço curto que percorre o
trilho e passa a dizer apenas "em andamento, sem estimativa".

Não recebe foco, não tem ação, não anuncia nada por conta própria: quem fala com
o leitor de tela é a família `aria-value*` da raiz, lida quando a pessoa chega
ali, e o texto ao lado quando quem compõe o marca como região viva.

O que o separa dos vizinhos, em uma linha cada:

| vizinho | diferença que decide |
|---|---|
| Skeleton | a estrutura do conteúdo é conhecida e o tempo não; aqui é o contrário |
| Sonner / Alert | avisam do FIM; o progresso é o meio |
| medidor de contexto (`.nds-context-display`) | é reforço de um número que o texto já diz — sem `role`, fora da leitura, e por isso aceita `--warning`, que aqui foi recusado (D3). A decisão está escrita em `medicao.css` |
| job-progress | é CONSUMIDOR deste componente, não vizinho: monta a mesma barra com uma classe própria ao lado (`agent-run.css`, §Andamento de trabalho longo) |

A pergunta que decide entre determinado e indeterminado: **existe denominador?**
Se dá para dizer "de quanto", é valor; se só dá para dizer "ainda", é o traço.

## 2. Contrato de comportamento

Cada linha é verificável. A coluna do portão diz quem reprova se ela deixar de
valer — e `—` é dívida declarada, não ausência de risco.

| # | o contrato | portão |
|---|---|---|
| C1 | A raiz é anunciada como `role="progressbar"`, nas cinco | `testes.accessibility.item3` + play do `Playground` nas cinco |
| C2 | `aria-valuemin` e `aria-valuemax` estão SEMPRE presentes, inclusive sem valor | o `Playground` das cinco afirma os dois com valor; **só a `Indeterminate` do angular afirma que eles SOBREVIVEM sem valor**, que é a metade em risco |
| C3 | `aria-valuenow` existe com valor e DESAPARECE no indeterminado | `testes.functional.item4` + `Indeterminate` nas cinco |
| C4 | `value: 0` desenha zero e **não** é indeterminado | `testes.functional.item1` — a `Default` das cinco tem o passo "zero não é o mesmo que indeterminate" |
| C5 | Metade do valor é metade DESENHADA, medida em pixel | `testes.functional.item2`, pela sonda `percentualDesenhado` |
| C6 | `value` no máximo preenche a trilha inteira | `testes.functional.item3` |
| C7 | `data-indeterminate` vai no elemento que carrega `.nds-progress` — é o único gancho do desenho sem valor | `Indeterminate` nas cinco; no angular ela cobra as TRÊS partes |
| C8 | O traço em ciclo é a animação `nds-progress-indeterminate` do design system, e ela desloca a margem deixando `transform` em `none` | `Indeterminate` nas cinco, em dois passos — o segundo é o discriminador do homônimo já morto |
| C9 | TODA barra na tela tem nome acessível — `aria-labelledby` quando há rótulo associado, `aria-label` quando não | `testes.accessibility.item5` + `WithLabel` nas cinco, pela sonda `accessibleName` |
| C10 | A trilha não acompanha a variante, e a barra mantém 3:1 contra ela | `SemanticColor` de react, vue, vanilla e angular — **no svelte a story tem uma barra só** |
| C11 | Não é parada de teclado: nada de `tabindex`, nada de foco | — (nenhuma story afirma a ausência; a folha não dá `tabindex` a peça nenhuma) |
| C12 | Valor fora da faixa é limitado antes de ser anunciado e antes de ser desenhado | `Complete` do vanilla, no passo "o valor é limitado pela escala" — **e só ela**; ver D5 |
| C13 | Sob `prefers-reduced-motion` o traço PARA e fica no início do trilho | — (nenhum; a folha tem a guarda e nada a exercita) |
| C14 | O número visível não é lido duas vezes: ou nasce `aria-hidden`, ou é região viva FORA da barra | `WithLabel` do angular (`aria-hidden`); os passos de `aria-live` em vue, svelte e vanilla |

## 3. Decisões fixadas

A tabela existe para que reverter custe uma leitura. Reverter é permitido; fazer
sem saber, não.

### D1 · Sem valor, `aria-valuenow` não é escrito — e o gancho do desenho é `data-indeterminate`

**Estado**: as cinco stacks omitem o atributo quando não há valor, e as cinco
publicam `data-indeterminate` na raiz. É o padrão do APG, e o motivo está escrito
em três lugares independentes com a mesma frase: zero mentiria, porque diria "0%"
quando a verdade é "não sei quanto falta".

**Medição, na fonte de cada lib**: três publicam o atributo sozinhas — a
`@base-ui/react` pelo mapeamento de estado (`status` → `data-indeterminate`, que
cai na raiz, na trilha E no indicador), a `bits-ui` na raiz
(`data-indeterminate: value === null ? "" : undefined`) e o `@radix-ng`
igualmente. As outras duas escrevem à mão: a `reka-ui` publica só
`data-state="indeterminate"`, e o `Progress.vue` TRADUZ para o vocabulário da
casa num `computed` — com o comentário de que `undefined` remove o atributo,
porque `data-indeterminate="false"` casaria o seletor do mesmo jeito; o
`createProgress` do vanilla escreve `root.dataset.indeterminate = ''`.

**Por que o gancho é atributo e não classe**: está escrito no topo do bloco
indeterminado de `progress.css` — classe aplicada pela story deixava o estado do
DOM e o desenho livres para divergir, e foi assim que o indeterminado passou um
tempo desenhando uma barra vazia e parada, com duas classes
(`animate-indeterminate w-1/3`) que não existiam em CSS nenhum do projeto.

**Para revisitar**: voltar a escrever um número exige responder o que ele
significa. Hoje não há resposta.

### D2 · O desenho sai de `--value`, e a folha tem DUAS técnicas de propósito

**Estado medido em 2026-09-13, uma stack por vez:**

| stack | quem escreve | o quê | classe do indicador |
|---|---|---|---|
| vanilla | a fábrica | `--value` (0–100) | `.nds-progress-indicator` |
| angular | host binding da diretiva | `--value`, string e nunca número | `.nds-progress-indicator` |
| vue | o wrapper da stack | `transform: translateX(-X%)` inline | `.nds-progress-indicator` |
| svelte | o wrapper da stack | `transform: translateX(-X%)` inline | `.nds-progress-indicator` |
| react | a LIB | `width: X%` inline (mais `inset-inline-start` e `height: inherit`) | `.nds-progress-bar` |

A folha declara as duas: `.nds-progress-indicator` tem
`transform: translateX(calc((var(--value, 0) - 100) * 1%))` e transiciona
`transform`; `.nds-progress-bar` não tem transform e transiciona `width`. A
segunda existe porque a `@base-ui/react` calcula a largura dentro do
`ProgressIndicator` e a escreve inline — não há como pedir a ela que alimente uma
custom property.

**A referência é o `--value`**, e é o que o docblock do primitivo do angular
defende por extenso: escrever `width` ou `transform` inline "sobrescreveria a
regra do design system em vez de alimentá-la".

**DECIDIDO em 2026-09-13, pela dona: `--value` é a técnica única onde dá.** O vue e
o svelte passaram a alimentar a custom property em vez de escrever `transform`
inline, e a demonstração animada da docs page do vanilla parou de escrever
`indicator.style.transform` — ela contradizia a própria story `Animated` do lado,
que já escrevia `--value` com o comentário dizendo por quê.

**O react fica com `width`, e isso se REGISTRA em vez de alinhar**: a
`@base-ui/react` calcula a largura dentro do `ProgressIndicator` e a escreve
inline, sem oferecer caminho para alimentar custom property. É divergência de
framework, e a folha mantém a segunda regra (`.nds-progress-bar`) por causa dela.

**Por que a técnica importa, e não é preciosismo**: estilo inline vence qualquer
especificidade, então quem escreve o `transform` no elemento passa a decidir
sozinho — e toda mudança futura da folha (curva da transição, origem, direção para
leitura da direita para a esquerda) deixa de alcançar aquela stack. Até 2026-09-13
o indeterminado das duas só funcionava porque elas SOLTAVAM o `style` com valor
nulo; se o inline ficasse escrito, o traço correria por baixo de uma transformação
fixa.

**O que salva o indeterminado nas duas stacks que escrevem transform**: as duas
soltam o `style` quando o valor é nulo, e aí o `transform: none` da folha volta a
valer. Estilo inline vence qualquer especificidade — se o transform ficasse
escrito com valor nulo, o traço correria por baixo de uma transformação fixa. A
`Indeterminate` do svelte é a única que afirma isso ("sem valor não há transform
inline").

### D3 · Não existe variante `warning`, e a decisão é de contraste

**Estado**: só `success` e `destructive`. O motivo e as medições estão no corpo de
`progress.css`, em bloco de comentário: no tema padrão claro o amarelo é de
luminância alta (`45 95% 36%`) e não alcança 3:1 contra trilha nenhuma que ainda
se distinga do fundo da página. Entregar a variante seria entregar uma barra que
não informa.

**Medido barra contra trilha, nos três temas × claro/escuro**: padrão 5,47–4,54
(success) e 4,18–3,44 (destructive); frio 7,30–4,07 e 4,48–4,09; quente 6,48–4,29
e 3,92–4,59.

**O mesmo token é aceito no medidor de contexto**, e o contraste entre os dois
casos é o que dá a régua: lá a cor é reforço de um número que a etiqueta já diz,
sem `role` e fora da leitura, então 1.4.11 não a alcança.

### D4 · A trilha é neutra e NUNCA acompanha a variante

**Estado**: `.nds-progress` é sempre `--primary` a 20%; `data-variant` só define
`--nds-progress-color`, que o indicador herda.
**Medição**: tingir a trilha com a MESMA cor a 20% derruba a razão justamente na
variante mais clara — `warning` a 2,66:1 no tema claro padrão.
**Regra que fica**: o contraste não pode depender de qual variante alguém
escolheu.

### D5 · Valor fora da faixa é limitado — nas cinco desde 2026-09-13

**DECIDIDO em 2026-09-13, pela dona**: o vue e o svelte passaram a limitar o valor
à faixa antes de anunciar e antes de desenhar, alinhando-se às outras três e à
referência. Com isso o C12 deixa de ser falso em duas stacks. `null` e `undefined`
continuam significando indeterminado nas cinco — limitar não é o mesmo que
substituir por zero, e confundir os dois anunciaria "0%" onde a verdade é "não sei
quanto falta" (D1).

A tabela abaixo é o estado ANTERIOR, e fica porque é a medição que sustentou a
decisão — e porque o modo de falha vale de lição: o resultado não era um erro
visível, era uma barra vazia anunciando um número.

**Estado medido na fonte de cada lib e em cada wrapper, até 2026-09-13:**

| stack | acima do máximo | negativo | não numérico / ausente |
|---|---|---|---|
| react | limita no máximo, no atributo e no desenho | limita no mínimo | qualquer valor não finito cai no indeterminado |
| angular | limita entre mínimo e máximo | limita | ausente ou nulo é indeterminado; máximo menor que o mínimo é corrigido para mínimo + 100 |
| vanilla | limita no máximo (`Math.min/Math.max`) e ainda protege máximo zero | limita em 0 | `null` é indeterminado; a opção nasce em 0 |
| vue | **não limita** — a lib reclama no console e tenta voltar para nulo, mas a correção sai por um evento que o wrapper não escuta; o número pedido continua sendo anunciado | idem | `null` é indeterminado |
| svelte | **não limita** — a lib repassa o número e o wrapper calcula o deslocamento em cima dele | idem | `null` é indeterminado |

**A maioria limita, e a referência limita.** O vanilla é explícito: o comentário
da `Complete` diz que "um `value` acima do máximo anunciaria um número que a barra
não desenha" — e ela é a única story das cinco que exercita o caso.

**O que o não-limitar produz, e é silencioso nas duas pontas.** Nas duas stacks o
deslocamento é montado como texto, `translateX(-<100 menos o valor>%)`:

- **acima do máximo** a subtração fica negativa e o texto sai com dois sinais
  seguidos — declaração inválida, que o navegador DESCARTA inteira. Sem
  `transform` inline volta a valer a regra da folha, que lê `--value`; e como
  nenhuma das duas escreve `--value`, o valor de queda é zero e a barra aparece
  **vazia**;
- **negativo** a subtração passa de 100, o deslocamento é válido e empurra o
  indicador para fora pela esquerda — barra **vazia** também.

Nos dois casos o número fora da faixa continua sendo anunciado ao leitor de tela
enquanto a tela mostra zero. Nada fica vermelho: `overflow: hidden` recorta o
resto, e declaração CSS inválida não reprova em compilador nenhum.

### D6 · A guarda de movimento reduzido é `animation: none` explícito, não duração zero

**Estado**: `progress.css` termina num `@media (prefers-reduced-motion: reduce)`
que zera a transição do indicador e, no estado indeterminado, escreve
`animation: none` mais `margin-inline-start: 0`.

**Por que a camada de token não basta aqui, e este é o caso especial da casa**:
`motion.css` zera a escada inteira sob a preferência, `--duration-stately`
incluída. Só que a animação do traço é `infinite` — com duração zero o navegador
reinicia o ciclo sem parar, que é exatamente o piscar que a preferência pede para
evitar. O comentário da folha diz isso na linha.

**A especificidade foi conferida, porque é aqui que a família de defeitos vive**:
a declaração da animação e a guarda casam o MESMO seletor de dois passos
(`.nds-progress[data-indeterminate] .nds-progress-indicator`, e o par com
`.nds-progress-bar`), as duas em (0,2,0), e a guarda vem DEPOIS no mesmo arquivo
— então ela vence por ordem, sem depender de `!important`. A guarda da transição
mira a classe nua (0,1,0) contra uma declaração também de classe nua, e também
vence por ordem. Não há aqui o defeito conhecido de guarda (0,1,0) perdendo para
declaração em atributo (0,2,0).

**O que a guarda NÃO tem é portão.** Nenhuma story das cinco liga a preferência
para ver o traço parar (C13).

### D7 · A altura é 8px fixa, e isso é legítimo

**Estado**: `.nds-progress` tem `height: var(--spacing-2)`.
**Por quê**: a regra da casa proíbe altura fixa em primitivo INTERATIVO, porque
ali a altura tem de ser resultado de `padding-block` e `line-height` para crescer
com a fonte do navegador. O progresso não tem texto dentro: é elemento gráfico, e
a altura é o desenho. A guideline do vanilla e a do angular já diziam isso, com
a mesma justificativa.
**Para revisitar**: se algum dia a barra ganhar texto dentro dela, a linha cai.

### D8 · Quem nomeia a barra depende da anatomia da stack

**Estado**: `aria-label` funciona nas cinco. `aria-labelledby` automático, a
partir de um rótulo VISÍVEL associado, existe em duas — react (o
`ProgressLabel` da base-ui registra o id) e angular (o `RdxProgressLabel`
registra presença, e a raiz só aponta para o id enquanto o rótulo existe).

**Consequência de contrato**: nas outras três o rótulo visível é composição de
quem usa — um `span` ao lado — e NÃO nomeia a barra; o nome precisa ser repetido
em `aria-label`. É por isso que o critério do conteúdo fala em NOME ACESSÍVEL e
não em `aria-label`, e por isso a sonda compartilhada percorre
`aria-labelledby` antes de `aria-label`.

**Cuidado ao revisitar**: no react e no angular o `WithLabel` afirma que o nome
sai do `aria-labelledby` e que não há `aria-label` duplicando a frase. Passar a
escrever os dois é ambiguidade, não redundância.

### D9 · A `reka-ui` fabrica um nome quando não há, e o nome é a PORCENTAGEM

**Medido em 2026-09-13 na fonte da lib**: o `ProgressRoot` da `reka-ui` liga
`aria-label` ao retorno de `getValueLabel`, cujo padrão é `` `${porcentagem}%` ``.
O `Progress.vue` não passa nada, então uma barra de vue sem `aria-label` é
anunciada como **"42%"** — e "Progress" e "Barra" são justamente os exemplos que
`usage.uxWriting.table.ariaLabel.bad` e `doDont.pair1.dont` mandam evitar.

Nas outras quatro, barra sem nome fica sem nome — o que é pior de ver e melhor de
pegar, porque o axe tem regra para isso e não tem regra para nome inútil.

**O que segura hoje**: toda story de vue passa `aria-label` explícito, e o
atributo de quem compõe vence o da lib (atributo de passagem sobrepõe a
propriedade ligada, nos dois níveis de wrapper). O risco é para quem consome sem
nomear.

### D10 · `aria-valuetext` existe em duas das cinco

**Estado medido**: react e angular anunciam sempre — a porcentagem formatada com
valor, e a frase `indeterminate progress` sem valor (o docblock do `@radix-ng`
chama isso de "paridade com a Base UI"). Vue anuncia só se quem compõe passar a
função de texto, e nada no repositório passa. Svelte e vanilla nunca anunciam.

**Por que importa mais do que parece**: `aria-valuetext` SUBSTITUI a leitura do
número. Onde ele existe, quem ouve recebe "quarenta e dois por cento"; onde não,
recebe o número cru contra a escala. É a linha de `props.table.getAriaValueText`
do conteúdo compartilhado — uma prop publicada como se fosse das cinco.

### D11 · Três vocabulários para o mesmo estado, e só o indeterminado é comum

**Medido no DOM que cada lib produz:**

| estado | react | angular | vue | svelte | vanilla |
|---|---|---|---|---|---|
| em progresso | `data-progressing` | `data-progressing` | `data-state="loading"` | `data-state="loading"` | — |
| concluído | `data-complete` | `data-complete` | `data-state="complete"` | `data-state="loaded"` | — |
| sem valor | `data-indeterminate` | `data-indeterminate` | `data-indeterminate` (traduzido) | `data-indeterminate` | `data-indeterminate` |

E as stories cobram exatamente o que a stack delas produz: o passo "a conclusão é
um estado próprio no DOM" afirma `data-complete` no react e no angular,
`data-state="complete"` no vue, `data-state="loaded"` no svelte — e **não existe
no vanilla**, que é a referência e não escreve nenhum dos dois. A folha não lê
nenhum deles: o único atributo com consequência visual é
`data-indeterminate`, e é o único que as cinco dizem igual.

### D12 · Omitir `value` NÃO é o caminho portável do indeterminado

**Medido nos cinco pontos de entrada, 2026-09-13:**

| stack | `value` omitido dá |
|---|---|
| react | indeterminado (a lib testa valor nulo e finitude) |
| angular | indeterminado (o `input` nasce nulo) |
| vue | **zero** — o wrapper tem `modelValue: 0` como padrão |
| svelte | **zero** — a raiz da bits-ui tem `value = 0` como padrão |
| vanilla | **zero** — a fábrica tem `value = 0` como padrão |

`null` explícito dá indeterminado nas cinco. A maioria entende ausência como
zero, e são duas telas idênticas com significados opostos — que é exatamente o
defeito contra o qual cada `Default` tem um passo dedicado.

**E o conteúdo compartilhado ensina o caminho que não funciona**:
`usage.guidelines.item2` diz "omita `value` ou passe `null`". A primeira metade é
falsa em três stacks. As guidelines de react e de vue repetem a mesma coisa.

### D13 · Duas anatomias convivem, e a sonda compartilhada aceita as duas

**Estado**: react e angular têm raiz composta (`progress` → `progress-track` →
`progress-indicator`, mais rótulo e valor opcionais); vue, svelte e vanilla têm
raiz que É a trilha (`progress` → `progress-indicator`).
**Medição**: está escrita no docblock de `docs/shared/testing/progress-probe.ts`,
que resolve a trilha como `progress-track` quando existe e como a própria raiz
quando não — e a nota de que `querySelector` só olha descendentes, o que fazia a
busca voltar vazia numa lista de barras.
**O que não varia**: o indicador, o `role` e a família `aria-value*`. É sobre
isso que as asserções falam.

### D14 · A raiz do react monta trilha e indicador sozinha — mas só quando ninguém os compôs

**Medição, no comentário do próprio primitivo**: antes, trilha e indicador eram
SEMPRE acrescentados depois do conteúdo, e toda composição com rótulo — que
declara a própria trilha — renderizava duas trilhas empilhadas. Nenhum teste
via, porque a consulta por papel acha a raiz e as duas trilhas são `div`. Hoje o
par só nasce na ausência de conteúdo, e o `WithLabel` do react conta as trilhas.

## 4. Anatomia

Duas formas, as duas legítimas (D13).

**Raiz composta** — react e angular:

```
progress            role="progressbar" · aria-value{min,max,now} · a escala mora aqui
                    é também a caixa em coluna/linha com gap (.nds-progress-root)
├── progress-label      opcional — nomeia a barra por aria-labelledby (D8)
├── progress-value      opcional — o número, empurrado para a direita; nasce aria-hidden
└── progress-track      a caixa que recorta (.nds-progress)
    └── progress-indicator   a parte cheia
```

**Raiz que é a trilha** — vue, svelte e vanilla:

```
progress            role="progressbar" + a caixa que recorta (.nds-progress)
└── progress-indicator   a parte cheia
```

**O que é obrigatório**: a raiz e o indicador. Rótulo e valor são peças só onde a
lib os tem; nas outras três o mesmo efeito visual é composição de quem usa, e aí
o rótulo NÃO nomeia a barra.

**A variante mora na raiz, nas duas formas**: a folha casa
`.nds-progress[data-variant]` e `.nds-progress-root[data-variant]` justamente
porque o elemento que recebe o atributo é a raiz — que numa forma é a trilha e na
outra não.

## 5. Geometria e tokens

Fonte: `docs/shared/styles/nds/progress.css`. Conferido com
`node scripts/tabela-tokens.mjs progress`, que fecha as 50 linhas das cinco
tabelas de docs page sem divergência.

| propriedade | valor | token |
|---|---|---|
| altura da trilha | 8px | `--spacing-2` — ver D7 |
| largura | 100% | **literal**: a caixa de fora manda, e por isso as stories embrulham a barra numa utilitária de largura |
| superfície da trilha | 20% de opacidade | `--primary` — a opacidade é literal, ver D4 |
| raio | pílula | `--radius-full` |
| recorte | `overflow: hidden` | **literal** — é o que faz o traço desaparecer nas pontas |
| cor da barra | — | `--nds-progress-color`, com queda em `--primary` |
| variante de sucesso | — | `--success` |
| variante destrutiva | — | `--destructive` |
| posição da barra | 0–100 | `--value`, lida pela folha e alimentada pela stack — ver D2 |
| transição do valor | — | `--duration-base` + `--ease-entrance` |
| ciclo do traço indeterminado | — | `--duration-stately` + `--ease-emphasis`, em laço infinito |
| tamanho do traço | 40% da trilha | **literal**, e o percurso vai de -40% a 100% pela margem |
| gap da raiz composta | 8px | `--spacing-2` |
| rótulo | 14px, peso 500 | `--text-control` + `--font-weight-medium` |
| valor | 14px, numeral tabular | `--text-control` + `--muted-foreground` |

**Sem sombra, sem borda, sem camada.** A barra não flutua: não há `box-shadow`,
não há `border` e não há `z-index` na folha inteira — então a regra de elevação
por tipo de superfície não a alcança.

**Dois tokens que a folha lê e nenhuma tabela de docs page lista**:
`--nds-progress-color` e `--value`. O primeiro está documentado como ponto de
customização em `tokens.customizationCode` e em `notes.item3`, o segundo não
aparece em lugar nenhum voltado a quem consome — é mecanismo interno em duas
stacks e nem existe nas outras três (D2).

**A animação desloca `margin-inline-start`**, não `transform`. Não foi escolha de
performance: é o discriminador que separa a animação do design system de um
homônimo que morava em `utilities.css` — mesmo nome, outro conteúdo, e vencia por
ser o último import da folha. As cinco `Indeterminate` afirmam as duas coisas: o
nome da animação e o `transform` em `none`.

## 6. Estados

| estado | quando ocorre | o que muda |
|---|---|---|
| Default | valor zero | trilha vazia; o valor zero é ANUNCIADO, e é isso que o separa do indeterminado |
| Loading | valor entre zero e o máximo | barra proporcional, com transição ao mudar |
| Complete | valor igual ao máximo | barra cheia; o conteúdo sugere trocar por mensagem de sucesso |
| Indeterminate | valor nulo | sem `aria-valuenow`; traço de 40% percorrendo o trilho em laço |
| Movimento reduzido | preferência do sistema | a transição e o laço param; o traço fica parado no início e ainda diz "em andamento" (D6) |

**O atributo que dispara é `data-indeterminate`, e só ele** — os outros três
estados não têm consequência visual nenhuma na folha, e o atributo que os expõe
tem três vocabulários diferentes entre as stacks (D11).

## 7. API

Props compartilhadas, com o padrão que cada stack de fato entrega:

| prop | tipo | padrão | onde existe |
|---|---|---|---|
| `value` | `number \| null` | varia — ver D12 | nas cinco (no vue chama-se `modelValue`) |
| `max` | number | `100` | nas cinco |
| `min` | number | `0` | react e angular explicitamente; svelte por PASSAGEM (o wrapper não a declara, o tipo da lib a inclui e o resto é repassado) — **não existe em vue nem em vanilla**, e nas duas o mínimo anunciado é zero cravado |
| variante de cor | `success \| destructive` | — | nas cinco, mas por caminhos diferentes: opção de fábrica no vanilla, atributo `data-variant` nas outras quatro |
| nome acessível | string | — | nas cinco: opção da fábrica no vanilla, `input` no angular, atributo nas outras três |
| texto do valor | função | — | react (`getAriaValueText`) e angular (mesmo nome, apelido de `valueLabel`); vue tem outro nome (`getValueText`); **não existe em svelte nem em vanilla** — ver D10 |
| classe extra | string | — | nas cinco (`className`, `class`) |

**A tabela de props do conteúdo compartilhado publica `min` e `getAriaValueText`
como se fossem das cinco.** São de três e de duas, respectivamente. E o auditor
já vê metade disso: `snippet_sem_lastro` reprova o
`props.extensibilityCode` do react e do vue por ensinar uma função de texto que
nenhuma story daquelas stacks exercita.

### Divergências de forma, registradas e não "alinhadas"

Forma de API não tem fonte de verdade — cada lib tem a sua.

| stack | como difere |
|---|---|
| vanilla | fábrica `createProgress({ value, max, variant, 'aria-label', className })` devolvendo o elemento pronto; não há atualização por API — quem faz a barra andar reescreve `--value` e `aria-valuenow` por fora, e a story `Animated` é o modelo disso |
| vue | o valor é `modelValue` (v-model), e a lib valida a faixa reclamando no console em vez de limitar (D5) |
| svelte | o wrapper aceita `ref` bindável e repassa o resto; o valor não é limitado (D5) |
| react | a raiz monta trilha e indicador sozinha na ausência de conteúdo (D14), e a lib insere um `span` de apresentação escondido dentro da raiz |
| angular | tudo é diretiva de ATRIBUTO em elemento nativo, para o markup bater com o do vanilla; o nome acessível entra por `input` |

### Peças, por stack

Extraído dos exports e dos seletores do código.

| stack | peças |
|---|---|
| react | `Progress`, `ProgressTrack`, `ProgressIndicator`, `ProgressLabel`, `ProgressValue` |
| vue | `Progress` — uma só |
| svelte | `Progress` — uma só |
| vanilla | `createProgress` — uma só |
| angular | `div[ndsProgress]`, `div[ndsProgressTrack]`, `div[ndsProgressIndicator]`, `span[ndsProgressLabel]`, `span[ndsProgressValue]`, mais a constante de conveniência com as cinco |

No Angular o SELETOR carrega o elemento, e isso é contrato: trocar a tag muda a
semântica, não só o estilo.

**A anatomia publicada no conteúdo compartilhado tem cinco peças** — raiz,
trilha, indicador, rótulo e valor —, e três stacks têm uma. Os
`anatomy.structureCode` de vue, svelte e vanilla já dizem isso no próprio
snippet ("o nome vem daqui: não há slot de rótulo"), mas a lista de itens acima
deles descreve as cinco peças sem ressalva, e é ela que as cinco páginas
mostram.

### Controles do Playground, e nenhum par bate

| stack | controles |
|---|---|
| react | valor, máximo, mínimo, nome acessível, classe |
| vue | valor, máximo |
| svelte | valor, máximo, variante, classe |
| vanilla | valor, máximo, variante, nome acessível |
| angular | valor, mínimo, máximo, nome acessível |

Só valor e máximo estão nos cinco. A variante — que é a única decisão VISUAL do
componente — é manipulável em dois.

## 8. Acessibilidade

**Atributos.** Raiz: `role="progressbar"`, `aria-valuemin` e `aria-valuemax`
sempre, `aria-valuenow` só com valor (D1), `aria-valuetext` em duas stacks (D10),
e nome por `aria-labelledby` ou `aria-label` (D8). O valor visível, onde é peça
da lib, nasce `aria-hidden` — o mesmo número já vai na raiz, e repeti-lo faria o
leitor ler duas vezes.

**Teclado**: nenhum. Não é interativo, não recebe foco, e o foco segue para o
próximo elemento depois do container.

**O que NÃO se faz, de propósito:**

- não se escreve `aria-valuenow="0"` sem valor — ver D1;
- não se põe região viva NA barra: quem anuncia mudança é o texto ao lado, com
  `aria-live="polite"`, e o par Do & Don't da página é exatamente `polite` contra
  `assertive`, que interromperia o leitor a cada incremento;
- não se tinge a trilha com a cor da variante — ver D4.

**Movimento reduzido**: a folha para o traço com `animation: none` explícito, e o
motivo é que a camada de token, sozinha, produziria piscar num laço infinito
(D6). É a exceção nomeada no próprio `motion.css`: "animações funcionais podem
precisar manter alguma transição mínima — re-declare local e comente o motivo".

**Duas afirmações do conteúdo que o componente não cumpre, e são de escopo**:
`accessibility.items.item4` (região viva no texto adjacente) e `item5`
(`aria-busy="true"` no container) descrevem coisas que quem COMPÕE faz, não o
componente. A região viva aparece em stories de quatro stacks; o `aria-busy`
existe numa única story do repositório — `AriaBusyContainer`, no vanilla.

## 9. Analytics

| evento | quando | payload |
|---|---|---|
| `task_progress` | a operação acompanhada cruza um marco (25, 50, 75, 100) | `{ component: "progress", task, percent, location }` |
| `task_complete` | a operação termina | `{ component: "progress", task, duration_ms?, location }` |

Os dois estão tipados em `AnalyticsEvents` nas cinco stacks, e os dois são
disparados pela APLICAÇÃO, não pelo componente — `notes.item4` diz isso, e é
coerente com o componente ser passivo.

**Quem dispara de fato, medido em 2026-09-13 nas cinco docs pages:**

| stack | dispara | `duration_ms` |
|---|---|---|
| react | sim, na demo animada | sim |
| svelte | sim, na demo animada | sim |
| vue | sim, na demo animada | **não** |
| vanilla | sim, na demo animada | **não** |
| angular | **não dispara nenhum dos dois** | — |

A página do angular publica a tabela dos dois eventos e não tem demonstração
animada: os valores dela são estáticos. Ou seja, a página ENSINA um evento que
ela própria não emite — a mesma forma de defeito que o popover pagou quando
declarava no tipo uma palavra que não tinha como produzir.

**As quatro que disparam só contam o PRIMEIRO ciclo**, com a mesma justificativa
escrita nas quatro: a demo reinicia em laço e re-emitir marcos inundaria o
relatório.

**`task` é id estável** (`"upload"` nas quatro), nunca texto traduzido, e
`location` é `docs_demo`.

## 10. Reconstruir do zero

Ordem: folha → primitivo da stack → composição de rótulo e valor → stories →
docs page.

**Comece pela folha**, e pelas duas técnicas de desenho (D2): a decisão de
alimentar `--value` ou de escrever o deslocamento inline muda o que a story pode
afirmar, e muda qual das duas classes de indicador a stack usa.

**Armadilha de cada stack**, todas medidas:

- **react (`base-ui`)** — a raiz acrescenta trilha e indicador quando não há
  conteúdo, e acrescentava SEMPRE até o conserto (D14); a lib escreve `width`
  inline, então o indicador é a classe de largura e não a de transform; e ela
  insere um `span` escondido de apresentação dentro da raiz, que aparece em
  qualquer contagem de filhos.
- **vue (`reka-ui`)** — dois passos que nenhuma outra stack tem: traduzir
  `data-state="indeterminate"` para o `data-indeterminate` da casa, e saber que a
  lib fabrica `aria-label` com a porcentagem se ninguém nomear (D9). E a
  validação de faixa dela não conserta nada por aqui (D5).
- **svelte (`bits-ui`)** — a raiz publica um atributo `value` no `div`, que é
  ruído de markup; o valor não é limitado; e o padrão da lib faz `value` ausente
  virar zero, não indeterminado (D12).
- **angular (`radix-ng`)** — a custom property tem de ir como STRING, senão
  algumas versões anexam `px`; host binding de diretiva apaga atributo estático
  do template, então `data-slot` se resolve na diretiva; e o `ngc` é o único
  portão que type-checa a expressão do template.
- **vanilla** — sem lib: o clamp, o `role`, os três `aria-value*` e o
  `data-indeterminate` são responsabilidade da fábrica, e a barra não anda
  sozinha — quem a anima reescreve `--value` e `aria-valuenow` por fora.

**E antes de dar por pronto, ligue a preferência de movimento reduzido**: é o
único comportamento da folha sem portão nenhum (C13).

## 11. Onde está a verdade

| assunto | arquivo |
|---|---|
| geometria, tokens, variantes, animação e a guarda de movimento | `docs/shared/styles/nds/progress.css` |
| a decisão sobre `warning` e a medição de contraste | o mesmo arquivo, no bloco de variantes semânticas |
| por que a barra do medidor de contexto NÃO reusa esta folha | `docs/shared/styles/nds/medicao.css` |
| como o job-progress veste esta barra | `docs/shared/styles/nds/agent-run.css`, §Andamento de trabalho longo |
| contrato de valor e de indeterminado (bloco canônico) | `nortear-design-system-vanilla/src/components/ui/progress.ts`, cabeçalho |
| as duas anatomias, e como medir o que está na TELA | `docs/shared/testing/progress-probe.ts` |
| texto das docs pages, props, critérios de teste | `docs/shared/content/progress/translations.json` |
| portões determinísticos | `node scripts/audit.mjs progress --json` |

> **PENDÊNCIA · 2026-09-13** — `node scripts/audit.mjs progress --json` devolve
> **19 violações**: as **14** desta linha, que já estavam de pé antes deste
> arquivo existir, e as 5 da pendência seguinte, que ele criou. Este PRD nasce
> com as 14 porque foi escrito antes da revisão serial e sem autorização para
> tocar código: `story_group_divergent`
> (a story `Animated` está na raiz no react e em `-states` no vanilla),
> `demonstration_labels_divergent` (vue e angular usam um rótulo a mais na
> demonstração), `dodont_preview_sem_componente` (o vanilla imita o componente
> em 2 dos 4 previews), `source_sem_teste` (react e angular não têm teste do
> construtor de snippet), `story_file_sem_transform` (os dois arquivos de story
> do angular, 8 stories, publicam o template da story no painel Code),
> `snippet_sem_lastro` (react e vue ensinam a função de texto do valor, que
> nenhuma story de lá exercita) e `inline_style_design_value` (13 larguras em
> `style` inline nos quatro arquivos de story do vue).
> **Fecha quando** `story_group_divergent`, `demonstration_labels_divergent`,
> `dodont_preview_sem_componente`, `source_sem_teste`,
> `story_file_sem_transform`, `snippet_sem_lastro` e
> `inline_style_design_value` não reportar mais para este slug.

**FECHADA em 2026-09-13**, no mesmo dia: a regra da categoria virou
[`19-feedback.md`](../guidelines/19-feedback.md), o catálogo do Progress ficou
aqui, e as cópias de react, vue e svelte deixaram de existir — nada nelas era
daquela stack. O vanilla e o Angular mantêm um arquivo curto com a mecânica
própria. O texto abaixo fica porque nomeia o que cada cópia afirmava de errado,
que é a razão de cinco cópias não sobreviverem.

O que a migração encontrou, medido em 2026-09-13: as cinco guidelines de stack ainda têm a seção de
catálogo `## Progress` em `07-feedback-components.md`, e o nascimento deste
arquivo faz `catalogo_duplicado_com_prd` reprovar as cinco. A migração não
caberia nesta rodada, e vale registrar o que ela vai encontrar: **duas das
cinco cópias contradizem o código** — a do vanilla e a do angular mandam usar
Skeleton ou indicador de carregamento "para progresso indeterminado", que é um
modo que este componente entrega nas cinco, com story, conteúdo e animação
próprios; a do vue ensina a trocar a cor da barra por uma classe de biblioteca
aposentada, em vez do atributo de variante; e a do svelte tem quatro linhas
contra as trinta da do react. O que FICA nas guidelines é a regra da
categoria (quando não mostrar indicador nenhum, `polite` contra `assertive`);
o catálogo vem para cá.
slug.
