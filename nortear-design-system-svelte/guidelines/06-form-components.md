# Form Components

---

## Button

**Propósito**: elemento de ação primária — dispara submissões, confirmações, navegações e qualquer ação do usuário.

**API e exemplos**: `src/components/ui/button/button.svelte` + stories + `ButtonDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Variantes** (cva):

| Variante | Uso |
|---|---|
| `default` | Ação primária |
| `destructive` | Ação destrutiva (excluir, remover) |
| `outline` | Ação secundária com ênfase |
| `secondary` | Ação secundária |
| `ghost` | Ação terciária / itens de toolbar |
| `link` | Aparência de link |

**Tamanhos**: `default`, `sm`, `lg`, `icon`.

**Regras**:
- Espaçamento entre botões: **mínimo `--spacing-4`** (16px), ou seja `data-spacing="md"` no cluster que os agrupa. Abaixo disso o par lê como um controle segmentado, e a área de erro entre dois alvos adjacentes encolhe. Vale para par de ações, fileira de variantes e barra de ferramentas.
  - **Exceção — botão `sm` e botão de ícone**: quando TODOS os botões do cluster são `size="sm"` ou da família de ícone (`icon`, `icon-sm`, `icon-lg`, `icon-xs`), o piso cai para `--spacing-2` (8px). Como 8px é o padrão do `.nds-cluster`, aí o `data-spacing` também pode ser omitido; só `xs` (4px) continua apertado demais.
    - O botão `sm` está em superfície compacta — rodapé de popover, de tooltip, de hover-card — onde 16px entre dois alvos pequenos é mais do que a superfície comporta.
    - O botão de **ícone** é outro caso: quadrado e sem texto, uma fileira deles é uma **barra de ferramentas**, não um par de ações. Ali a proximidade é o que comunica que os comandos pertencem ao mesmo conjunto — e isso vale mesmo no tamanho padrão de ícone, não só nos reduzidos.
  - Cluster que MISTURA tamanhos cai na regra estrita: o alvo maior é quem define a distância confortável.
  - Grupo emendado (`.nds-button-group`) é o caso oposto e continua sem gap, de propósito.
  - Portão: `button_gap_apertado` no `audit.mjs`.
- Botão icon-only: `aria-label` obrigatório e contextual (verbo + objeto + identificador)
- Ícones internos: sempre `aria-hidden="true"`
- Em submit, refletir o estado de carregamento com `disabled` e um ícone de espera em rotação (`.nds-animate-spin`) — a folha já para a rotação sob `prefers-reduced-motion`

**Acessibilidade**:
- `aria-label` contextual em botões ambíguos
- Estado de foco visível garantido pelos tokens — não suprimir `focus-visible`

**Analytics**: `track('button_click', { component, variant, location, label })` no `onclick`.

---

## Form (Superforms + Zod)

**Propósito**: formulários com validação tipada, error handling e UX de acessibilidade.

**Stack obrigatória**: `sveltekit-superforms` + `Zod` (via `zodClient`).

**API e exemplos**: `src/components/ui/form/` + stories + `FormDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
<form use:enhance>
└── Field group
    ├── Label (for="<id>")
    ├── Input (id, aria-describedby, aria-invalid)
    └── Mensagem de erro (id, role="alert")
```

**Regras**:
- Schema Zod é a fonte de verdade — mensagens em pt-BR
- Cada campo associa `Label[for]` ao `Input[id]`
- Mensagens de erro têm `id` referenciado por `aria-describedby` do campo

**Acessibilidade**:
- `aria-describedby` apontando para o ID da mensagem de erro
- `aria-invalid="true"` no campo com erro
- `role="alert"` na mensagem de erro para anunciar ao leitor de tela

---

## Input

**Propósito**: campo de texto de linha única.

**API e exemplos**: `src/components/ui/input/input.svelte` + stories + `InputDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Regras**:
- `Label` sempre associado via `for`/`id`
- Placeholder: exemplo real — nunca instrução (ex: "ex: ana@empresa.com", não "Digite seu e-mail")
- Tokens obrigatórios: `--input` no fundo e `--border` no contorno — lidos pela folha `.nds-input`, nunca por classe de cor no template
- Nunca altura fixa — usar `padding-block` + `line-height` (WCAG 1.4.4)

---

## Select

**Propósito**: seleção de opção entre lista curta sem busca.

**API e exemplos**: `src/components/ui/select/select.svelte` + stories + `SelectDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
Select
├── SelectTrigger (aria-label)
│   └── SelectValue (placeholder)
└── SelectContent
    └── SelectItem (value)
```

**Atenção**: o Select não tem busca integrada. Para lista com busca, usar **Combobox**.

---

## Combobox

**Propósito**: campo de texto que filtra uma lista e devolve a opção escolhida. No modo múltiplo, os escolhidos viram chips dentro do próprio campo. É componente próprio — primitivo, stories e docs page —, não uma composição montada a partir de outras peças.

**Quando usar em vez do Select**: lista com busca, 10+ itens, rótulos longos ou parecidos entre si, escolha múltipla que precisa ficar visível dentro do campo. Lista curta e fechada continua sendo `Select`.

**API e exemplos**: `src/components/ui/combobox/` + stories + `ComboboxDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura** (o `data-slot` ao lado é o contrato compartilhado):

```
Combobox                            combobox
├── ComboboxLabel                   combobox-label
├── ComboboxInputWrapper            combobox-input-wrapper   ← a caixa que parece o campo
│   │                                                          data-chips="wrap | single-line"
│   ├── ComboboxChips               combobox-chips           ← a caixa que quebra ou rola
│   │   ├── ComboboxChip            combobox-chip
│   │   │   ├── (texto)             combobox-chip-text
│   │   │   └── ComboboxChipRemove  combobox-chip-remove
│   │   └── ComboboxInput           combobox-input           role="combobox"
│   ├── ComboboxClear               combobox-clear
│   └── ComboboxTrigger             combobox-trigger
│       └── ComboboxIcon            combobox-icon
└── ComboboxPositioner              combobox-positioner
    └── ComboboxPopup               combobox-popup
        ├── ComboboxList            combobox-list            role="listbox"
        │   ├── ComboboxGroup       combobox-group
        │   │   ├── ComboboxGroupLabel   combobox-group-label
        │   │   └── ComboboxItem    combobox-item            role="option"
        │   │       ├── (texto)     combobox-item-text
        │   │       └── ComboboxItemIndicator  combobox-item-indicator
        │   └── ComboboxSeparator   combobox-separator
        └── ComboboxEmpty           combobox-empty
```

`ComboboxInput` é filho de `ComboboxChips`, e não irmão dela. É o que mantém o texto fluindo depois do último chip e, ao mesmo tempo, deixa limpar e gatilho fora da caixa que quebra ou rola — os dois ficam sempre na primeira linha. Sem chips, a caixa não é montada e o campo de texto vira filho direto do wrapper; a folha aceita as duas formas.

**Modo múltiplo**: `multiple` troca o valor exibido por chips dentro da própria caixa. Cada chip traz o rótulo do escolhido e um botão de remover. Backspace com o texto vazio remove o último chip. Escolher no modo múltiplo limpa o texto de busca — manter o filtro esconderia as opções restantes.

`multiple` é lido UMA vez, na criação do estado: alternar o modo em tempo de execução não recria nada. Quem oferece esse controle envolve a raiz num bloco `{#key}` — é o que a story do Playground faz.

**Como os chips ocupam o campo**: `chipsLayout` na raiz, que chega à caixa do campo como `data-chips`.

| Valor | Comportamento |
|---|---|
| `wrap` (padrão) | Os chips acumulam linhas e o campo cresce em altura. Limpar e gatilho alinham ao topo, na primeira linha |
| `single-line` | Os chips ficam numa linha só e a caixa rola na horizontal. O campo não muda de altura |

A decisão é da raiz, e não da peça de chips, porque é onde `multiple`, `disabled` e `invalid` já moram: quem ajusta o campo o faz num lugar só. Antes, a caixa de chips era `display: contents` — sem caixa própria, chip, texto, limpar e gatilho eram irmãos no mesmo flex que quebrava, e os dois botões caíam para a linha de baixo assim que os chips enchiam a primeira.

**Props da raiz**:

| Prop | Tipo | Padrão | Função |
|---|---|---|---|
| `items` | `ComboboxOption[]` | `[]` | Opções da lista. O rótulo daqui alimenta o chip, o filtro e o estado vazio |
| `value` | `string \| string[]` | — | Escolha atual (`bind:value`); lista no modo múltiplo |
| `inputValue` | `string` | `''` | Texto de busca (`bind:inputValue`) |
| `open` | `boolean` | `false` | Lista aberta (`bind:open`) |
| `multiple` | `boolean` | `false` | Escolhidos viram chips dentro do campo |
| `chipsLayout` | `'wrap' \| 'single-line'` | `'wrap'` | Chips em linhas que se acumulam ou numa linha só que rola na horizontal |
| `filter` | `(item: ComboboxOption, query: string) => boolean` | rótulo sem acento e sem caixa | Substitui o filtro |
| `loop` | `boolean` | `true` | Da última opção a seta volta à primeira |
| `disabled` | `boolean` | `false` | Campo indisponível: nada recebe foco e a lista não abre |
| `invalid` | `boolean` | `false` | Marca o campo como inválido |
| `name` | `string` | — | Nome do campo no formulário |
| `removedMessage` | `(label: string) => string` | "<rótulo> removido" | Frase que a região viva lê ao remover um chip |
| `onValueChange` | `(value: string \| string[]) => void` | — | Muda a escolha; dispara também ao remover chip e ao limpar |
| `onInputValueChange` | `(text: string) => void` | — | Muda o texto digitado; é o gancho para buscar opções no servidor |

`ComboboxOption` é `{ value, label, disabled?, group? }` — itens com o mesmo `group` saem sob o mesmo cabeçalho.

**Props das peças**:

| Peça | Prop | Padrão | Função |
|---|---|---|---|
| `ComboboxInput` | `placeholder` | — | Dica exibida enquanto nada foi digitado |
| `ComboboxChip` | `value` · `label` | — | Qual escolhido este chip representa |
| `ComboboxChipRemove` | `removeLabel` | `Remover` | Verbo do nome acessível; o rótulo do chip entra depois dele |
| `ComboboxChipRemove` | `aria-label` | — | Escreve o nome inteiro à mão, no lugar do par verbo + rótulo |
| `ComboboxClear` | `aria-label` | `Limpar` | Nome acessível do botão que zera a escolha |
| `ComboboxTrigger` | `aria-label` | `Abrir lista` | Nome acessível do botão que abre e fecha |
| `ComboboxItem` | `value` · `label` · `disabled` | — | Opção da lista |
| `ComboboxEmpty` | children | — | Texto quando o filtro não casa com nada |

**Regras**:
- `ComboboxLabel` sempre presente. Sem rótulo visível, o nome vem de `aria-label` no campo de texto: o papel de combobox não tira nome do próprio conteúdo, e o conteúdo aqui é o texto digitado.
- Os textos de interface — mensagem de vazio, nome do botão de limpar, nome do gatilho, `removeLabel` do botão de remover e a frase de `removedMessage` — nascem em português no componente e **têm de ser passados traduzidos** por quem monta a página. Nenhum deles muda de idioma sozinho.
- Botão de remover tem nome PRÓPRIO, um por chip: "Remover Brasil", nunca cinco botões chamados "Remover" — nome repetido em vários controles é o mesmo que nome nenhum (WCAG 4.1.2).
- Estado vazio sempre presente: lista filtrada sem resultado nunca fica em branco.
- Quem monta a lista filtra com a MESMA conta da peça que se esconde — o utilitário de filtragem é exportado justamente para isso. Cabeçalho de grupo que fica na tela sem nenhuma opção embaixo é o defeito clássico de filtrar item a item.
- Chip é rótulo de opção escolhida, não texto livre. Valor digitado que vira etiqueta é outro componente.

**Acessibilidade**:
- `role="combobox"` vai no INPUT, não num wrapper nem num botão — é o padrão ARIA 1.2.
- O foco NUNCA sai do campo de texto: a opção ativa é apontada por `aria-activedescendant` e realçada por `[data-highlighted]`. Mover o foco para a opção quebraria a digitação, que é o ponto do componente.
- `aria-expanded` acompanha a lista aberta ou fechada; `aria-autocomplete="list"` declara que digitar filtra; `aria-selected="true"` na opção escolhida; `aria-invalid="true"` quando a validação reprova.
- Remover um chip não move o foco nem muda o texto do campo: quem anuncia é uma região viva `role="status"`, montada o tempo todo. O foco volta ao campo de texto porque o botão desaparece no mesmo gesto.
- Teclado: digitar filtra e abre a lista; ↓ e ↑ andam pelas opções e dão a volta; Enter escolhe a ativa; Escape fecha e, com a lista já fechada, limpa o texto; Tab fecha e sai do campo; Backspace com o texto vazio remove o último chip; Home e End vão à primeira e à última opção.
- O gatilho fica fora da ordem de tabulação: quem tem foco é o campo, e o Tab tem de sair dele em vez de parar num segundo alvo que faz o que a seta já faz.

**Analytics**: `track('option_select', { component: 'combobox', field_name, value, label, location })` ao escolher uma opção; `track('field_change', { component: 'combobox', field_name, value, location })` ao remover um chip ou limpar o campo.

---

## Checkbox

**Propósito**: seleção binária de uma opção.

**API e exemplos**: `src/components/ui/checkbox/checkbox.svelte` + stories + `CheckboxDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Regras**:
- Sempre acompanhado de `Label[for]`
- Estado indeterminado (`indeterminate`) permitido em headers de seleção em lote

---

## Switch

**Propósito**: alternar configuração binária com efeito imediato.

**API e exemplos**: `src/components/ui/switch/switch.svelte` + stories + `SwitchDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Regras**:
- Usar Switch para ação imediata (ligar/desligar); usar Checkbox para seleção que será confirmada
- Sempre acompanhado de `Label[for]`

---

## Textarea

**Propósito**: campo de texto multi-linha.

**API e exemplos**: `src/components/ui/textarea/textarea.svelte` + stories + `TextareaDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Regras**:
- `Label[for]` obrigatório
- Definir `rows` inicial razoável (3-5) e permitir expansão pelo usuário
- Placeholder: exemplo real, nunca instrução

---

## Calendar

**Propósito**: seletor de data interativo.

**API e exemplos**: `src/components/ui/calendar/calendar.svelte` + stories + `CalendarDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Stack**: `@internationalized/date` (tipos `DateValue`).

**Acessibilidade**: navegação completa por teclado (Arrow, Page Up/Down, Home/End) gerenciada automaticamente pelo Bits UI.

---

## Slider

**Propósito**: seleção de valor numérico em intervalo contínuo.

**API e exemplos**: `src/components/ui/slider/slider.svelte` + stories + `SliderDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Props relevantes**: `value` (array), `min`, `max`, `step`.

**Acessibilidade**:
- `aria-label` obrigatório descrevendo a grandeza ajustada
- Bits UI aplica `aria-valuenow`, `aria-valuemin`, `aria-valuemax` no thumb
