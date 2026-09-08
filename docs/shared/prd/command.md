# PRD — Command

> **Estado descrito**: 2026-09-07.
> **⚠ Escrito ANTES da revisão serial deste componente.** Espere que decisões
> mudem — e quando mudarem, a linha se move para o histórico com a nova data e a
> nova medição, em vez de ser reescrita por cima.
>
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto.

## 1. Identidade

Paleta de comandos: **campo de busca no topo, lista filtrável embaixo**. É o
terceiro contrato de teclado da família, e o que o define é onde o foco mora.

| componente | quem tem o foco | o que a letra digitada faz |
|---|---|---|
| DropdownMenu | o item (foco do DOM anda item a item) | typeahead, com `preventDefault` |
| Popover | o conteúdo | vira texto no campo |
| **Command** | **o campo, sempre** | vira texto, e a lista filtra |

O item ativo é apontado por `aria-activedescendant`, e nunca recebe foco do DOM.
É essa escolha que permite ter lista navegável **e** campo de texto na mesma
superfície — o que nem o menu nem o popover conseguem.

**A superfície não tem borda nem sombra próprias**: ela ocupa 100% da caixa em
que vive. Quem dá moldura é o Dialog (paleta aberta por atalho) ou o container
que a hospeda.

## 2. Contrato de comportamento

| # | o contrato | portão |
|---|---|---|
| C1 | O filtro mantém `aria-selected` e o papel de opção em cada item; o que sai do filtro deixa a lista | `accessibility.item1` |
| C2 | Setas movem o destaque; Enter seleciona o item em destaque | `accessibility.keyboard.arrowDown/enter` |
| C3 | `Escape` fecha o Dialog ou Popover que hospeda e devolve o foco ao gatilho | `accessibility.keyboard.escape` |
| C4 | Tab move o foco entre elementos FORA da paleta — a lista não é percorrida por Tab | `accessibility.keyboard.tab` |
| C5 | O atalho exibido no item é só visual: registrar a tecla é da aplicação, e o texto do atalho entra no nome do comando | `accessibility.item2` |
| C6 | Dentro do Dialog, título e descrição ficam em `sr-only` e precisam de valores descritivos | `accessibility.item3` |
| C7 | O campo de busca não tem altura fixa | ver D5 |

## 3. Decisões fixadas

### D1 · O item nunca recebe foco do DOM

**Estado**: quem mantém o foco é o campo de busca; o item ativo é apontado por
`aria-activedescendant`.
**Consequência que decide o desenho do anel**: `:focus-visible` **não dispara
nunca** no item, então o gatilho do anel tem de ser o mesmo atributo que a lib
move com as setas — `aria-selected` / `data-selected`.
**O preço, e ele é honesto**: o anel aparece também ao pousar o ponteiro. O item
marcado É o que o Enter vai ativar, venha a marcação de onde vier.

### D2 · O anel é INTERNO e em `--accent-foreground`

**Medição, nas duas metades** — a mesma do DropdownMenu, e por isso vale conferir
os dois juntos quando um mudar:

- **por que não `--ring`**: o anel é desenhado sobre o preenchimento de accent, e
  no escuro do tema default os dois têm praticamente a mesma luminância —
  **1,38:1**. O anel sumiria justamente no modo em que o problema é maior.
  `--accent-foreground` é, por definição, o que se lê sobre o accent: **4,66:1**
  no pior dos seis pares de tema e modo, contra os 3:1 da WCAG 1.4.11;
- **por que interno**: a lista tem `padding: 4px` e `overflow-y: auto` — anel
  externo é recortado nas laterais e nos itens das pontas.

### D3 · O item selecionado é `--accent` a 10%

**Estado**: 10% aqui; **20%** no item destacado do DropdownMenu.
**Mesmo token, pesos diferentes**, e as duas folhas dizem isso separadamente. Não
unifique sem medir os dois casos.

### D4 · Texto secundário sobre item selecionado é `--accent-foreground` a 85%

**Medição**: `--muted-foreground` sobre o preenchimento de accent mede **2,64:1**,
e o axe reprovou **neste componente**. 85% é o PISO: a 80% a razão cai para
4,34:1.

### D5 · O campo de busca NÃO tem altura fixa

**Estado**: altura é resultado de `padding-block` mais `line-height`.
**Medição**: era `height: 2.5rem`, que travava o campo em 40px — aumentar a fonte
do navegador cortava o texto da busca em vez de fazer a paleta crescer (WCAG
1.4.4, Resize Text 200%). É a mesma regra que vale para `.nds-input`.

### D6 · `display: flex` do item VENCE o `hidden` do navegador

**Estado**: o item declara `display: flex`, que é regra de AUTOR e vence o
`display: none` que o agente de usuário dá ao atributo `hidden`. Por isso existe
uma regra explícita para `[hidden]`.
**Sem ela**: o item que o filtro descartou continua na tela, e a lib que liga
`hidden` — é o que o primitivo de autocomplete faz — parece não funcionar.

### D7 · O tique e o atalho nunca aparecem juntos

**Estado**: `:has([data-slot="command-shortcut"])` esconde o tique quando o item
carrega atalho.
**Por quê**: os dois disputam a mesma borda direita. Ligar os dois desenha algo
que o navegador não vai mostrar.

### D8 · O separador é `--border`

**Estado**: `--border` aqui; **`--muted`** no DropdownMenu. Dois menus, dois
tokens. Ele também rasga o padding do grupo com margem negativa de `--spacing-1`.

### D9 · Dentro do Dialog, `translate` — nunca `transform`

**Estado**: `.nds-command-dialog-content` fixa `top: 33%` e `translate: -50% 0`,
com `padding: 0`.
**Medição**: o `.nds-dialog-content` centraliza com a propriedade individual
`translate: -50% -50%`. `transform` é OUTRA propriedade, e as duas **compõem** em
vez de uma vencer — o painel saía deslocado -100% na horizontal, quase inteiro
para fora da tela pela esquerda. Usando a mesma propriedade, esta regra
sobrescreve (o `command.css` carrega depois do `dialog.css`) e sobra só o que se
queria: centro na horizontal, 33% do topo.
**Vale para as quatro stacks web** — nenhuma escapava.

### D10 · O raio do item é raio aninhado

**Estado**: `--radius-sm`, que é `--radius` (10) menos o padding do grupo
(`--spacing-1`, 4). Mudar o padding sem mudar o raio faz os cantos derivarem.

## 4. Anatomia

```
command                       flex column, 100%×100%, overflow hidden
├── command-input-wrapper      ícone de busca + campo; borda inferior
│   ├── [ícone]                  16px, 50% de opacidade
│   └── command-input            sem altura fixa (D5)
└── command-list               teto de 300px, rola
    ├── command-group          padding de 4px — é ele que dá o raio aninhado (D10)
    │   ├── command-group-heading
    │   └── command-item        role de opção · aria-selected
    │       ├── [ícone]
    │       ├── [rótulo]
    │       ├── command-shortcut    exclui o tique (D7)
    │       └── command-item-check  tique à direita
    ├── command-separator      rasga o padding do grupo (D8)
    └── command-empty          aviso de busca sem resultado
```

## 5. Geometria e tokens

Fonte: `docs/shared/styles/nds/command.css`.

| propriedade | valor | token |
|---|---|---|
| superfície | — | `--popover` |
| texto | — | `--popover-foreground` |
| raio da paleta | — | `--radius` |
| padding lateral do campo | 12px | `--spacing-3` |
| padding vertical do campo | 8px | `--spacing-2` |
| ícone do campo | 16px, 50% de opacidade, respiro de 8px | `--spacing-4` e `--spacing-2` |
| borda inferior do campo | 1px | `--border` |
| placeholder | — | `--muted-foreground` |
| teto da lista | 300px | **literal** (`18.75rem`) |
| padding do grupo | 4px | `--spacing-1` |
| cabeçalho de grupo | 12px, peso médio | `--text-control-sm`, cor `--muted-foreground` |
| padding do item | 8px lateral, 6px vertical | `--spacing-2` e `--spacing-1-5` |
| gap do item | 8px | `--spacing-2` |
| raio do item | — | `--radius-sm` — ver D10 |
| tamanho de texto | 14px | `--text-control` |
| item selecionado | accent a 10% | `--accent` — ver D3 |
| texto do item selecionado | — | `--accent-foreground` |
| anel do item | 2px interno | `--accent-foreground` — ver D2 |
| ícone do item | 16px | `--spacing-4` |
| aviso de vazio | padding de 24px, centralizado | `--spacing-6`, cor `--muted-foreground` |
| separador | 1px | `--border` — ver D8 |
| item desabilitado | 50% de opacidade | — |

**Sem borda, sem sombra e sem camada próprias**: quem hospeda resolve.

## 6. Estados

| estado | quando ocorre | o que muda |
|---|---|---|
| Item padrão | — | sem preenchimento |
| Item selecionado | seta ou ponteiro | accent a 10%, texto `--accent-foreground`, anel interno |
| Item desabilitado | `aria-disabled` ou `data-disabled` | 50% de opacidade, sem ponteiro nem teclado |
| Item filtrado para fora | `hidden` | sai da lista — e depende da regra de D6 |
| Item marcado | `data-checked` | tique à direita, salvo se houver atalho (D7) |
| Vazio | filtro sem resultado | o aviso ocupa a lista |

## 7. API

| prop | o que faz |
|---|---|
| `commandFilter` | filtro customizado `(value, search, keywords) => number`; 0 esconde |
| `commandValue` | valor controlado do item em destaque |
| `commandOnValueChange` | callback ao mudar o destaque |
| `inputPlaceholder` | placeholder do campo |
| `itemValue` | valor único do item, usado pelo filtro |
| `itemOnSelect` | callback ao selecionar por clique ou Enter |
| `itemDisabled` | desabilita o item |
| `dialogTitle` | título do Dialog hospedeiro, em `sr-only` |
| `dialogDescription` | descrição do Dialog hospedeiro, em `sr-only` |
| `dialogShowCloseButton` | exibe o X do Dialog; padrão `false` |

### Divergência de forma, registrada

O `cmdk` gera o cabeçalho de grupo com o atributo `[cmdk-group-heading]`, não com
uma classe — por isso a folha estiliza o cabeçalho **por atributo** além da
classe. Não é preferência: é o que a lib emite.

### Peças, por stack

Migrado das guidelines de catálogo em 2026-09-07, e extraído dos exports e dos
seletores do código — não transcrito da guideline, que é a fonte aposentada.

| stack | peças |
|---|---|
| react | `Command`, `CommandDialog`, `CommandEmpty`, `CommandGroup`, `CommandInput`, `CommandItem`, `CommandList`, `CommandSeparator`, `CommandShortcut` |
| vue | `Command`, `CommandDialog`, `CommandEmpty`, `CommandGroup`, `CommandInput`, `CommandItem`, `CommandList`, `CommandSeparator`, `CommandShortcut` |
| svelte | `Command`, `CommandDialog`, `CommandEmpty`, `CommandGroup`, `CommandInput`, `CommandItem`, `CommandLinkItem`, `CommandList`, `CommandLoading`, `CommandSeparator`, `CommandShortcut` |
| vanilla | `createCommand` |
| angular | `div[ndsCommandEmpty]`, `div[ndsCommandGroup]`, `div[ndsCommandItem]`, `div[ndsCommandList]`, `div[ndsCommandSeparator]`, `input[ndsCommandInput]`, `nds-command`, `span[ndsCommandShortcut]` |

O índice do svelte também reexporta as formas curtas — `Dialog`, `Empty`, `Group`, `Input`, `Item`, `LinkItem`, `List`, `Loading`, `Root`, `Separator`, `Shortcut` —,
para quem importa o namespace inteiro. As stories usam a forma longa.

No Angular o SELETOR carrega o elemento, e isso é contrato: trocar a tag muda a
semântica, não só o estilo. Onde há dois seletores para a mesma peça
(`h2[...]` e `h3[...]`), os dois existem para a peça caber em níveis de
cabeçalho diferentes sem pular hierarquia.

## 8. Acessibilidade

**Atributos**: o campo mantém o foco e aponta o item ativo por
`aria-activedescendant`; cada item carrega papel de opção e `aria-selected`.

**Teclado**: setas movem o destaque, Enter seleciona, Escape fecha o hospedeiro e
devolve o foco, Tab percorre o que está FORA da paleta.

**O que NÃO se faz, de propósito:**

- não se dá foco de DOM ao item (D1);
- não se usa `:focus-visible` como gatilho de estilo de item — ele nunca dispara
  aqui;
- não se confia no atalho exibido para registrar a tecla (C5).

## 9. Analytics

| evento | quando | payload |
|---|---|---|
| `command_item_select` | item selecionado por clique ou Enter | `{ label, group, pattern }` |

## 10. Reconstruir do zero

Ordem: folha → paleta → campo → lista, grupo e item → vazio e separador →
hospedeiro (Dialog) → stories → docs page.

- **O foco mora no campo** (D1). Toda a navegação é consequência disso, inclusive
  o gatilho do anel.
- **A regra para `[hidden]` não é opcional** (D6): sem ela o filtro parece
  quebrado, e o defeito é da folha, não da lib.
- **Dentro do Dialog, use `translate`** (D9) — `transform` compõe com o
  centramento do Dialog e joga a paleta para fora da tela.
- **O campo não pode ter altura fixa** (D5).

## 11. Onde está a verdade

| assunto | arquivo |
|---|---|
| geometria, filtro, anel, hospedagem no Dialog | `docs/shared/styles/nds/command.css` |
| centramento que esta folha sobrescreve | `docs/shared/styles/nds/dialog.css` |
| texto, props, critérios de teste | `docs/shared/content/command/translations.json` |
| desenho e anotações | Figma, página `Command` (componente `702:8`) |
| portões determinísticos | `node scripts/audit.mjs command --json` |
