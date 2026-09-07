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

### D5 · Só este véu desfoca o fundo

**Estado**: `backdrop-filter: blur(4px)`, dentro de `@supports`.
**Medição honesta, registrada na própria folha**: sob um véu de `--overlay / 0.8`
o desfoque quase não aparece — o que o justifica hoje é o movimento do que está
atrás, não o contraste. O AlertDialog não tem.

### D6 · Clique no véu FECHA — e é aqui que os irmãos se separam

**Estado**: fecha. No AlertDialog, não.
**Por quê**: lá a decisão é crítica e exige escolha explícita; aqui o diálogo é
um passo, não um compromisso. `Escape` fecha nos dois.

### D7 · Há DUAS saídas para conteúdo longo, e elas são opostas

**Estado**:

| saída | o que rola | como |
|---|---|---|
| `-overlay-scroll` + `-content-scroll` | a página | o painel INTEIRO entra no fluxo do véu, que vira grid com `place-items: center` e `overflow-y: auto` |
| `-body-scroll` | só o corpo | o painel fica centralizado e fixo, o cabeçalho e o rodapé param, e o corpo ganha `max-block-size: 60vh` |

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
| `showCloseButtonFooter` | exibe um botão de fechar dentro do rodapé, abaixo das ações |
| `className` | classes `.nds-*` adicionais |

Os dois `showCloseButton*` são independentes: um é o X do canto, o outro é uma
ação no rodapé.

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
