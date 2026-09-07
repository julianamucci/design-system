# PRD — Sheet

> **Estado descrito**: 2026-09-07. **Revisão serial fechada em** 2026-09-06.
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto.

## 1. Identidade

Painel **modal** que entra por uma das quatro bordas da tela, com véu atrás.

É diálogo, não painel decorativo: toma o foco, prende a navegação por teclado
enquanto está aberto e trava a rolagem da página.

| vizinho | diferença que decide |
|---|---|
| Dialog | nasce no centro e não encosta na borda; tem raio nos quatro cantos |
| Drawer | é componente PRÓPRIO, com folha própria — arrastável, com alça, cantos arredondados do lado de dentro |
| Popover | não é modal, fica ao lado da página em vez de interrompê-la |

Do Drawer o Sheet empresta três peças, e só três: o véu, o título e a descrição.
Editar qualquer uma delas alcança os dois componentes.

## 2. Contrato de comportamento

| # | o contrato | portão |
|---|---|---|
| C1 | `role="dialog"` com `aria-modal="true"` nas cinco | `accessibility.items.item1` |
| C2 | O foco fica PRESO no painel enquanto aberto | `accessibility.items.item4` |
| C3 | `Escape` fecha e devolve o foco ao gatilho | `accessibility.items.item5` |
| C4 | Clique no véu fecha | `accessibility.items.item6` |
| C5 | A rolagem da página trava enquanto aberto | `accessibility.items.item7` |
| C6 | O painel é nomeado por título e descrito pela descrição, os dois obrigatórios | `accessibility.items.item2` e `item3` |
| C7 | O corpo rolável entra na ordem de tabulação com `role="group"` e `aria-label` juntos | `accessibility.items.item8` |
| C8 | O lado é do PAINEL, não um modo global do conjunto | `notes.item3` |

## 3. Decisões fixadas

### D1 · O lado muda o desenho, e por isso é eixo de verdade

**Estado**: à esquerda e à direita o painel tem altura cheia e largura limitada;
em cima e embaixo ocupa a largura toda e a altura sai do conteúdo. A borda de 1px
troca de lado junto — fica sempre virada para dentro da tela.
**Contraste**: no Popover e no HoverCard o `side` só decide onde o painel nasce,
e os quatro lados desenham a mesma caixa. Aqui não.

### D2 · A largura é custom property, com os defaults em `:root`

**Estado**: `--sheet-width: 75%` e `--sheet-max-width: 24rem` (384px), declarados
em `:root` no topo da folha; as regras de lado leem os dois sem fallback.
**Medição, com quatro alvos** — o painel sem override, o `.nds-sidebar-mobile`
(que declara `--sheet-width` NO MESMO elemento do painel), uma classe de
consumidor no painel, e um wrapper ANCESTRAL:

| onde declarar | padrão | sidebar-mobile | classe | ancestral |
|---|---|---|---|---|
| só no fallback do `var()` | 384px | 288px | 540px | 500px |
| no `[data-side]` da peça (0,2,0) | 384px | 384px ✗ | 384px ✗ | 384px ✗ |
| na classe base (0,1,0) | 384px | 288px | 540px | 384px ✗ |
| **em `:root`** | 384px | 288px | 540px | 500px |

Declarar no seletor da própria peça APAGA os três overrides. Em `:root` o default
chega por herança, e herança perde para qualquer declaração — que é a única
coluna idêntica à de hoje.
**E por que custom property, não utilitária**: estas regras são (0,2,0) e
qualquer utilitária de largura é (0,1,0). A doc prometia customização por classe
em quatro stacks, e ela não funcionava em nenhuma.

### D3 · O corpo é `flex: 1 1 auto`, nunca o atalho `flex: 1`

**Medição**: o atalho zera a BASE. Nos lados esquerdo e direito isso é invisível,
porque o painel tem `height: 100%`. Em cima e embaixo o painel é `height: auto`:
o corpo não contribui nada para a altura, desaba para zero e passa a rolar dentro
de uma caixa sem altura.
**Par obrigatório**: `min-height: 0`, que desliga o mínimo automático do item flex
para ele poder encolher quando houver teto.
**Mesmo defeito já medido no Drawer**, e pela mesma razão.

### D4 · O fio de 1px é literal, e a sombra é `Elevacao/lg`

**Estado**: `box-shadow: 0 0 0 1px hsl(0 0% 0% / 0.05), var(--elevation-lg)`. O
fio é preto a 5% cravado na folha, sem token por trás.
**Para revisitar**: tokenizar o fio muda os cinco painéis da família de uma vez.

### D5 · O anel de foco do botão de fechar tem DUAS camadas

**Corrigido na documentação em** 2026-09-06 (`7811a95c1`).
**Estado**: `0 0 0 2px hsl(--background)` e depois `0 0 0 5px hsl(--ring)`, as duas
em opacidade cheia. O halo interno é o que separa o anel do que está atrás.
**Medição**: a página descrevia "anel de 2px a 50% de opacidade" — contradizendo a
folha que ela documenta. Desenhar um anel translúcido único perde justamente a
camada que faz o trabalho.

### D6 · O cabeçalho e o rodapé usam MARGEM, e ela soma com o gap do painel

**Estado**: cabeçalho com `margin-bottom: --spacing-4`, rodapé com
`margin-top: --spacing-4`, e o painel com `gap: --spacing-4`.
**Consequência**: entre cabeçalho e corpo há **32px**, não 16. Quem mexer num dos
dois valores precisa saber que o outro está somando.

### D7 · Alinhamento e empilhamento mudam a 40rem

**Estado**: abaixo de 40rem o cabeçalho centraliza e o rodapé empilha em
`column-reverse` — a ação principal fica em cima. Acima, cabeçalho à esquerda e
botões lado a lado à direita.
**Nota para o Drawer**: lá o ponto de corte do cabeçalho é **48rem**, não 40. Dois
pontos de corte na mesma família; não copie um no outro.

### D8 · Três afirmações da página eram falsas justamente no vanilla

**Corrigidas em** 2026-09-06 (`7811a95c1`), e ficam registradas porque a revisão
serial as encontrou depois de o componente ser dado por pronto:

- `notes.item2` dizia "Sheet usa Dialog" — não usa;
- `states.closed` e `states.open` afirmavam `data-state`, que a fábrica do vanilla
  **não escreve uma vez sequer**;
- `states.focused` descrevia o anel errado (ver D5).

O que elas têm em comum: eram verdadeiras na stack de lib e falsas na referência.

## 4. Anatomia

```
sheet-overlay                 o véu — compartilhado com o Drawer
sheet-content [data-side]     role="dialog" · aria-modal="true"
├── sheet-header              coluna; margem inferior própria (D6)
│   ├── sheet-title           obrigatório — nomeia o painel
│   └── sheet-description     obrigatória — descreve o painel
├── sheet-body                cresce e rola (D3)
├── sheet-footer              margem superior própria (D6)
└── sheet-close               absoluto, canto superior direito
```

**Duas formas do botão de fechar, e as duas são o desenho**: o Vanilla monta o
`<button class="nds-sheet-close">`; as quatro stacks com lib compõem o botão do
design system e usam só o posicionamento (`.nds-sheet-close-position`), com o
rótulo em `.nds-sr-only`. A folha traz as duas regras por isso.

## 5. Geometria e tokens

Fonte: `docs/shared/styles/nds/sheet.css`.

| propriedade | valor | token |
|---|---|---|
| véu | 80% de opacidade | `--overlay` |
| superfície do painel | — | `--background` |
| texto | — | `--foreground` |
| padding do painel | 24px | `--spacing-6` |
| gap do painel | 16px | `--spacing-4` |
| borda (só do lado de dentro) | 1px | `--border` |
| largura (esquerda e direita) | 75%, teto 384px | `--sheet-width` / `--sheet-max-width` — ver D2 |
| gap do cabeçalho | 6px | `--spacing-1-5` |
| margem do cabeçalho e do rodapé | 16px | `--spacing-4` — ver D6 |
| gap do rodapé | 8px | `--spacing-2` |
| título | 18px, semi-bold, entrelinha 1, tracking -0.025em | `--text-control-xl` |
| descrição | 14px, entrelinha 1.5 | `--text-control`, cor `--muted-foreground` |
| botão de fechar | canto a 16px, raio `--radius-xs`, padding `--spacing-1` | — |
| anel de foco do fechar | halo 2px + anel 5px | `--background` e `--ring` — ver D5 |
| camadas | — | `--z-modal-backdrop` e `--z-modal` |

**Sem raio**: o painel encosta na borda da tela.

## 6. Estados

| estado | quando ocorre | o que muda |
|---|---|---|
| Closed | inicial | painel desmontado |
| Open | gatilho | painel montado, foco preso, rolagem travada |
| Focused | Tab dentro | anel de duas camadas no elemento focado (D5) |
| Transitioning | entrada e saída | deslizamento a partir da borda do `side` |

## 7. API

| prop | tipo | padrão |
|---|---|---|
| `open` | boolean | — |
| `defaultOpen` | boolean | `false` |
| `onOpenChange` | `(open: boolean) => void` | — |
| `side` | `top \| right \| bottom \| left` | `right` |
| `showCloseButton` | boolean | `true` |
| `className` | string | — |

### Divergências de forma, registradas

| stack | como difere |
|---|---|
| vanilla | fábrica com `onClose(reason)` espelhando o Dialog — registrado em `PATCHES.md#vanilla-sheet-onclose-reason` |
| todas | **onde a opção de lado mora varia por stack**; a tabela de props de cada página mostra a forma dela. O lado em si é sempre do painel (C8) |

## 8. Acessibilidade

**Atributos**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` para o
título e `aria-describedby` para a descrição — os dois obrigatórios.

**Teclado**: Tab circula dentro do painel; Escape fecha e devolve o foco.

**O corpo rolável precisa dos três juntos**: `tabindex="0"`, `role="group"` e
`aria-label`. Caixa que rola é parada de teclado (WCAG 2.1.1), parada de teclado
precisa de papel, e nome em elemento sem papel é atributo proibido — o leitor de
tela o descarta. É `group` e não `region` porque marco aninhado num diálogo já
nomeado só engorda a lista de marcos.

## 9. Analytics

| evento | quando | payload |
|---|---|---|
| `dialog_open` | o painel abre | `{ component: "sheet", label, location }` |
| `dialog_close` | o painel fecha | `{ component: "sheet", label, location, reason }` |

**`label` carrega o `side`** — valor estável (`"right"`, `"left"`…), nunca texto
traduzido. O evento é o do Dialog de propósito: as duas peças respondem à mesma
pergunta de produto, e separar as séries esconderia isso.

## 10. Reconstruir do zero

Ordem: folha (com os defaults em `:root`) → primitivo → cabeçalho e rodapé →
stories → docs page.

- **Comece pelos defaults em `:root`** (D2). Declarar no seletor da peça é o
  defeito que apaga a customização, e ele não aparece até alguém tentar.
- **O corpo é `flex: 1 1 auto` com `min-height: 0`** (D3) — o atalho quebra só em
  cima e embaixo.
- **As duas formas do botão de fechar** convivem: a folha tem regra para as duas.
- **Cabeçalho e rodapé são sub-componentes** por causa do ponto de corte de 40rem
  (D7), que frame de Figma não expressa e prop nenhuma controla.

## 11. Onde está a verdade

| assunto | arquivo |
|---|---|
| geometria, larguras, lados, anel de foco | `docs/shared/styles/nds/sheet.css` |
| texto, props, critérios de teste | `docs/shared/content/sheet/translations.json` |
| divergências intencionais sobre libs | `PATCHES.md` |
| desenho e anotações | Figma, página `Sheet` (conjunto `695:166`) |
| portões determinísticos | `node scripts/audit.mjs sheet --json` |
