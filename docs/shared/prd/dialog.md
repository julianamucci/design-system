# PRD — Dialog

> **Estado descrito**: 2026-09-07.
> **⚠ Escrito ANTES da revisão serial deste componente.** Os cinco PRDs de
> Overlay anteriores descrevem componentes já revisados; este descreve o estado
> atual de um que a revisão ainda vai atravessar. Espere que decisões mudem — e
> quando mudarem, a linha se move para o histórico com a nova data e a nova
> medição, em vez de ser reescrita por cima.
>
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto.

## 1. Identidade

Modal centralizado sobre um véu translúcido, que **interrompe a página**: toma o
foco, trava a rolagem e se anuncia como diálogo modal.

| vizinho | diferença que decide |
|---|---|
| AlertDialog | é irmão, com outra decisão de saída: clique no véu não fecha e não há botão no canto — a escolha tem de ser explícita |
| Sheet | também modal, mas encosta na borda da tela em vez de nascer no centro |
| Popover | não interrompe: fica ao lado da página |

As duas folhas — esta e a do AlertDialog — são irmãs de verdade: `alert-dialog.css`
reusa as keyframes `nds-dialog-fade-in` / `-fade-out` declaradas aqui.

## 2. Contrato de comportamento

| # | o contrato | portão |
|---|---|---|
| C1 | `role="dialog"` com `aria-modal="true"` | `accessibility.item1` |
| C2 | Nome e descrição saem do título e da descrição, automaticamente | `accessibility.item2` |
| C3 | O foco fica preso; o foco inicial vai ao primeiro focável | `accessibility.item3` |
| C4 | Ao fechar, o foco volta ao gatilho | `accessibility.item4` |
| C5 | `Escape` e clique no véu fecham, **sem** disparar ações do rodapé; a rolagem é restaurada | `accessibility.item5` |
| C6 | O botão de fechar tem nome acessível para leitor de tela | `accessibility.item6` |
| C7 | Corpo mais alto que o painel precisa de `tabindex="0"`, `role="group"` e `aria-label` juntos | docblock da folha — sem portão automático |

## 3. Decisões fixadas

### D1 · A superfície é `--popover`, e as três folhas modais não concordam

**Estado**: painel em `--popover` / `--popover-foreground`.
**Medição registrada** na guideline de overlay: `dialog.css` lê `--popover`,
enquanto `alert-dialog.css` e `sheet.css` leem `--background`. **Nenhuma** lê
`--card`, que é o que a guideline pedia antes.
**Enquanto a divergência existir**, o que vale é a regra estrutural: a classe do
painel resolve a superfície, e ninguém pinta fundo por fora.
**Esta é a decisão mais provável de mudar na revisão** — ela está aberta, não
fechada.

### D2 · O rodapé É a aresta de baixo do painel

**Estado**: `margin-inline` e `margin-bottom` negativos de `--spacing-4` cancelam
exatamente o padding do painel; o rodapé recebe o padding de volta e pinta
`--muted` a 50% com borda superior.
**Consequência no raio**: a aresta do rodapé e a do painel são a mesma linha —
na regra de raio aninhado (`Rᵢ = Rₑ − E`) isso é `E = 0`, e o rodapé repete o raio
do painel em vez de descontar. Não é o caso do `.nds-card-nested`, que existe para
quem está dentro **com** afastamento.
**Medição**: era `0.75rem` cravado, e divergia do painel nas **doze** combinações
de tema × modo × largura — 24px de painel contra 12 de rodapé no `default`, 28
contra 12 no `warm`, e rodapé arredondado dentro de um painel de quinas retas no
`cold`, que declara `--radius-card: 0`.

### D3 · O raio muda a 40rem, e o rodapé acompanha

**Estado**: abaixo de 40rem o painel é reto (`--radius-none`); a partir daí assume
`--radius-card`. O rodapé segue o painel no mesmo ponto de corte.
**Cuidado ao desenhar**: nenhum eixo de variante cobre isso, e frame de Figma não
expressa consulta de mídia.

### D4 · O fio de 1px é SOMBRA, não borda

**Estado**: `box-shadow: 0 0 0 1px hsl(var(--foreground) / 0.1), var(--elevation-lg)`.
**Consequência**: é traço de fora, sem ocupar espaço no layout. No Figma isso é
contorno externo de 1px, não borda.
**Contraste**: o Sheet usa um fio equivalente, mas **literal** — preto a 5%, sem
token. Os dois não são o mesmo valor.

### D5 · Nenhum véu desfoca o fundo

**Estado**: sem `backdrop-filter`. Nenhuma folha modal tem.

**Histórico**: até 2026-09-08 este era o único overlay com
`backdrop-filter: blur(4px)`, dentro de `@supports`. A medição que o acompanhava
já dizia o suficiente contra ele — sob um véu de `--overlay / 0.8` o desfoque
quase não aparece —, e a justificativa que restava era o movimento do que está
atrás, não o contraste. Retirado por decisão de produto: custo de pintura em
toda abertura por um efeito que a própria folha declarava invisível.

**O que isso ensina sobre decisão registrada**: a linha ficou de pé por meses
com a medição que a derrubava escrita ao lado. Registrar a dúvida não é o mesmo
que resolvê-la — decisão marcada como frágil precisa de data de revisão, senão
o registro honesto vira álibi para a manter.

### D6 · Clique no véu FECHA — e é aqui que os irmãos se separam

**Estado**: fecha. No AlertDialog, não.
**Por quê**: lá a decisão é crítica e exige escolha explícita; aqui o diálogo é
um passo, não um compromisso. `Escape` fecha nos dois.

### D7 · Há UMA saída para conteúdo longo: o corpo rola

**Estado**: `-body-scroll`. O painel fica centralizado e fixo, o cabeçalho e o
rodapé param, e o corpo ganha `max-block-size: 60vh`.

**A segunda rota foi RETIRADA em 2026-09-08**. Era o par `-overlay-scroll` +
`-content-scroll`: o painel inteiro entrava no fluxo do véu, que virava grid com
`overflow-y: auto`, e a PÁGINA é que rolava. Duas razões para não existir —
um modal que rola junto com a página desfaz a própria promessa de interromper;
e duas saídas opostas para o mesmo problema obrigam cada tela a escolher entre
elas sem critério, que é como divergência entra num design system.

A remoção é do recurso, não da story: sai a prop `scroll`, saem as classes, sai
`DialogScrollContent` do Vue e o ramo do overlay no Svelte. Sistema que ainda
permite a rota errada não a proibiu — só deixou de demonstrá-la.

**Por que `max-block-size` e não `height`**: o limite é teto, então painel curto
continua do tamanho do conteúdo. E a medida é relativa à janela, logo cresce com
o zoom do navegador (WCAG 1.4.4).
**O trio obrigatório do corpo rolável**: `tabindex="0"`, `role="group"` e
`aria-label`, juntos. Caixa que rola é parada de teclado (WCAG 2.1.1), parada de
teclado precisa de papel, e nome em elemento sem papel é atributo proibido. É
`group` e não `region` porque marco aninhado num diálogo já nomeado não
acrescenta navegação — mesma decisão registrada em `sheet.css`.

### D8 · O gap do cabeçalho vem do composto, não da base

**Estado**: a folha base declara `--spacing-1-5` e o bloco composto — que é o que
as cinco stacks entregam — sobrescreve para `--spacing-2`, alinhado à esquerda.
**Consequência**: ao ler a folha, o segundo valor é o que vale.

### D9 · No rodapé, o primário é o ÚLTIMO do DOM — e é a folha que inverte

**Estado**: `.nds-dialog-footer` é `column-reverse` empilhado e `row` +
`justify-content: flex-end` a partir de 40rem. As duas leituras saem da MESMA
ordem de DOM: secundários primeiro, primário por último. Empilhado o primário
sobe ao topo; deitado ele vai para a direita.

**Por que o inverso do que parece**: escrever o primário por último é
contraintuitivo, e por isso o defeito é reincidente. Medido em 2026-09-07 nas
cinco stacks: as quatro que oferecem `showCloseButtonFooter` renderizavam o
botão DEPOIS dos filhos, o que o punha na posição do primário; e a story do
vanilla montava `[Voltar, Continuar, Fechar]`, deixando o primário no MEIO com
um `ghost` acima dele.

**O que guardava o defeito**: quatro textos afirmavam "abaixo das ações" — as
duas chaves do conteúdo compartilhado, o docblock do `NdsDialogFooter` e a
linha da tabela de API (§7). Quem conferisse pela leitura encontraria acordo
entre documento e documento; o desacordo estava com a folha, que nenhum dos
quatro cita. É o mesmo mecanismo do drawer, onde um teste verde afirmava a
inversão.

**Nenhum compilador alcança isto**, e nenhuma suíte que asserte por papel
tampouco: a ordem só existe como posição entre irmãos. O portão é ler o DOM.

### D10 · O rodapé fica DENTRO do `<form>`, e é isso que faz o Enter funcionar

**Estado**: em diálogo de formulário, o `<form>` envolve o corpo **e** o rodapé.
A ação primária é `type="submit"` e fica dentro dele.

**Por que não é detalhe de arrumação**: `type="submit"` fora do `<form>` é um
botão inerte — não submete, e o Enter num campo não dispara nada. O botão
continua clicável e com a aparência certa, então nada na tela denuncia.

**Quarta ocorrência desta classe na campanha**, e o caminho dela diz muito: no
`sheet` do Angular o botão de confirmar do perfil estava fora do form; na story
`WithForm` do `dialog` do Angular o arquivo inteiro não tinha um `<form>`
sequer; e a mesma coisa vivia em `anatomy.structureCode` de react, vue e svelte
— que é conteúdo COMPARTILHADO, a chave mais copiada que o componente tem.
Corrigido em 2026-09-07 nas quatro pontas.

**O que nenhum portão vê**: `<form>` presente e submit fora dele é HTML válido,
compila nas cinco e passa em qualquer asserção por papel ou por texto. O que
denuncia é ler `button.form` — vazio quando o botão está órfão.

### D11 · O cenário das duas composições sem consenso é o do Vanilla

**Estado**: `CustomCloseInFooter` mostra o guia — "Abrir guia" / "Próximos
passos" / rodapé de três botões `[Fechar (ghost), Voltar (outline), Continuar
(primária)]`. `NoFooter` mostra "Sobre este recurso", só título e descrição.
Ambos vivem em `demonstration.labels` do conteúdo compartilhado, nos três
idiomas.

**Por que precisou de decisão, e não de medição**: `CustomCloseInFooter`
renderizava QUATRO cenários diferentes nas cinco stacks — perfil no react,
"Próximos passos" no vanilla, "Configurações de notificação" no vue, convite ao
time no svelte —, e `NoFooter` discordava entre "Sobre este produto", "Sobre
este recurso" e "Saiba mais". Onde nem duas stacks concordam não existe maioria
a que alinhar: a regra "o vanilla é a referência" resolve divergência de markup
e comportamento, mas qual HISTÓRIA a demo conta é escolha de produto. Decidido
pela dona em 2026-09-08, a favor do vanilla.

**O que deixou isso passar tanto tempo**: `demonstration_labels_divergent` só
aponta quem foge da MAIORIA e emudecia sem ela — ver a nota da regra em
`scripts/audit.mjs`. Divergência máxima produzia zero achados. Hoje o
`demonstration_labels_sem_consenso` cobre esse caso, e ele acusava 3 dos 85
componentes: chart, dialog e table.

**Consequência para quem for montar demo nova**: rótulo de cenário nasce no
conteúdo compartilhado, nunca cravado numa stack. `demonstration.labels` tinha
SEIS chaves para uma página de dez cenários — foi essa escassez que levou cada
stack a inventar a sua.

## 4. Anatomia

```
dialog-overlay                véu; único da família com desfoque (D5)
dialog-content                role="dialog" · aria-modal="true" · centralizado por translate
├── dialog-header             coluna
│   ├── dialog-title
│   └── dialog-description
├── dialog-body               sem estilo próprio — quem monta a tela decide
├── dialog-footer             É a aresta de baixo do painel (D2)
└── dialog-close              absoluto, canto superior direito
```

**O corpo não tem estilo próprio**, e a folha diz isso por escrito: o consumidor
define padding e espaçamento do conteúdo.

## 5. Geometria e tokens

Fonte: `docs/shared/styles/nds/dialog.css`.

| propriedade | valor | token |
|---|---|---|
| véu | 80% de opacidade, desfoque de 4px | `--overlay` |
| superfície | — | `--popover` — ver D1 |
| texto | — | `--popover-foreground` |
| largura | `100% − 32px`, teto de 512px | `--spacing-8` na folga; teto **literal** (`32rem`) |
| padding | 16px | `--spacing-4` |
| gap do painel | 16px | `--spacing-4` |
| raio | reto abaixo de 40rem, depois card | `--radius-none` e `--radius-card` — ver D3 |
| fio + elevação | 1px a 10% + lg | `--foreground` e `--elevation-lg` — ver D4 |
| gap do cabeçalho | 6px na base, 8px no composto | `--spacing-1-5` e `--spacing-2` — ver D8 |
| título | 16px, peso médio, entrelinha 1 | `--text-control-lg`, `--font-weight-medium`, cor `--foreground` |
| descrição | 14px, entrelinha 1.5 | `--text-control`, cor `--muted-foreground` |
| rodapé | fundo a 50%, borda superior, padding 16px, gap 8px | `--muted`, `--border`, `--spacing-4`, `--spacing-2` |
| botão de fechar | canto a 16px, raio `--radius-xs`, padding `--spacing-1`, opacidade 0.7 | — |
| anel de foco do fechar | halo 2px + anel 5px | `--background` e `--ring` |
| corpo rolável | teto de 60vh, respiro lateral | `--spacing-2` |
| camadas | — | `--z-modal-backdrop` e `--z-modal` |

**Animação**: entrada com fade e zoom (`--duration-base`, `--ease-entrance`),
saída mais rápida (`--duration-fast`, `--ease-exit`). Sob
`prefers-reduced-motion` as duas somem.

## 6. Estados

| estado | quando ocorre | o que muda |
|---|---|---|
| Closed | inicial | painel desmontado |
| Open | gatilho | painel montado, foco preso, rolagem travada |
| Transitioning | entrada e saída | fade no véu, fade e zoom no painel |
| Focused | Tab dentro | anel do próprio elemento; no botão de fechar, o de duas camadas |

## 7. API

| prop | o que faz |
|---|---|
| `open` | estado controlado |
| `defaultOpen` | estado inicial não controlado |
| `onOpenChange` | callback com o novo estado |
| `showCloseButtonContent` | exibe o X no canto do painel |
| `showCloseButtonFooter` | exibe um botão de fechar dentro do rodapé, como ação TERCIÁRIA — variante `ghost`, primeiro no DOM (D9) |
| `closeLabel` | rótulo do botão de fechar — o visível do rodapé e o de leitor de tela do X |
| `className` | classes `.nds-*` adicionais |

`closeLabel` existia só no Angular; as outras quatro cravavam o literal `Fechar`
DENTRO do primitivo, o que obrigava quem consome em outro idioma a reescrever o
componente. Regularizado em 2026-09-07, com o mesmo default (`'Fechar'`), de
modo que nenhum call site existente muda.

Os dois `showCloseButton*` são independentes: um é o X do canto, o outro é uma
ação no rodapé.

### Peças, por stack

Migrado das guidelines de catálogo em 2026-09-07, e extraído dos exports e dos
seletores do código — não transcrito da guideline, que é a fonte aposentada.

| stack | peças |
|---|---|
| react | `Dialog`, `DialogClose`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogOverlay`, `DialogPortal`, `DialogTitle`, `DialogTrigger` |
| vue | `Dialog`, `DialogClose`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogOverlay`, `DialogTitle`, `DialogTrigger` |
| svelte | `Dialog`, `DialogClose`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogOverlay`, `DialogPortal`, `DialogTitle`, `DialogTrigger` |
| vanilla | `createDialog` |
| angular | `button[ndsDialogClose]`, `button[ndsDialogTrigger]`, `div[ndsDialogBody]`, `div[ndsDialogContent]`, `div[ndsDialogFooter]`, `div[ndsDialogHeader]`, `div[ndsDialogOverlay]`, `div[ndsDialog]`, `h2[ndsDialogTitle], h3[ndsDialogTitle]`, `ng-template[ndsDialogPortal]`, `p[ndsDialogDescription]` |

O índice do svelte também reexporta as formas curtas — `Close`, `Content`, `Description`, `Footer`, `Header`, `Overlay`, `Portal`, `Root`, `Title`, `Trigger` —,
para quem importa o namespace inteiro. As stories usam a forma longa.

No Angular o SELETOR carrega o elemento, e isso é contrato: trocar a tag muda a
semântica, não só o estilo.

**O nível do cabeçalho do título é customizável em quatro das cinco, cada uma de
um jeito** — medido na fonte de cada lib, não na documentação delas:

| stack | mecanismo | padrão |
|---|---|---|
| react | prop `render` (`BaseUIComponentProps<'h2'>`) | `h2` |
| vue | prop `as` (ou `as-child`) | `as: 'h2'` |
| svelte | prop `level`, numérica | `level = 2` |
| angular | seletor por elemento, nos SEIS níveis | o que quem escreve usar |
| vanilla | opção `titleLevel` da fábrica | `2` |

As cinco aceitam qualquer nível desde 2026-09-08, e chegaram lá por caminhos
diferentes. O Angular oferecia só `h2` e `h3` e ganhou os seis por decisão da
dona; o vanilla não oferecia nenhum — `createElement('h2')` cravado — e ganhou
`titleLevel`, na mesma forma que `createPopoverTitle` e `createCardTitle` já
tinham.

**Por que isso importa**: `heading-order` do axe reprova salto de nível, e o
painel não sabe de que profundidade da página foi aberto — um diálogo disparado
de dentro de uma seção já em `h3` precisa sair em `h4`. O que ainda falta é a
story que exercita isso; está no `FIXES-NEEDED.md`, porque hoje o portão está
verde por não perguntar.

## 8. Acessibilidade

**Atributos**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` e
`aria-describedby` automáticos a partir do título e da descrição.

**Teclado**: Tab e Shift+Tab circulam dentro do painel; Escape fecha sem executar
ação do rodapé; ao fechar, o foco volta ao gatilho.

**O que NÃO se faz:**

- não se dispara ação do rodapé no Escape nem no clique do véu — fechar não é
  confirmar;
- não se deixa o corpo rolável sem o trio de atributos (D7).

## 9. Analytics

| evento | quando | payload |
|---|---|---|
| `dialog_open` | abre por gatilho ou estado controlado | `{ component: "dialog", label, location }` |
| `dialog_close` | fecha | `{ component: "dialog", label, location, reason }` |

O Sheet emite os MESMOS eventos, com `component: "sheet"` — as duas peças
respondem à mesma pergunta de produto, e separar as séries esconderia isso.

## 10. Reconstruir do zero

Ordem: folha → primitivo → cabeçalho, corpo e rodapé → botão de fechar → stories
→ docs page.

- **O rodapé precisa das margens negativas** (D2). Sem elas ele não é a aresta do
  painel, e o raio passa a ser outro problema.
- **O raio muda por consulta de mídia** (D3), então cabeçalho e rodapé são
  sub-componentes com eixo de layout, e o raio não é coberto por eixo nenhum.
- **As keyframes moram nesta folha** e o AlertDialog as consome — mover ou
  renomear quebra o irmão.
- **`translate`, nunca `transform`** para centralizar: as duas propriedades
  COMPÕEM em vez de uma vencer, e é isso que o `command` explora para reposicionar
  a paleta.

## 11. Onde está a verdade

| assunto | arquivo |
|---|---|
| geometria, rodapé, raio, rolagem | `docs/shared/styles/nds/dialog.css` |
| texto, props, critérios de teste | `docs/shared/content/dialog/translations.json` |
| regras globais da família | `nortear-design-system-vanilla/guidelines/10-overlay-components.md` |
| desenho e anotações | Figma, página `Dialog` (componente `692:53`) |
| portões determinísticos | `node scripts/audit.mjs dialog --json` |
