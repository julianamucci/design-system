# Form Components

---

## Button

**Propósito**: elemento de ação primária — dispara submissões, confirmações, navegações e qualquer ação do usuário.

**API e exemplos**: `src/components/ui/button/button.vue` + stories + `ButtonDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Variantes** (cva):

| Variante | Uso |
|----------|-----|
| `default` | Ação primária (máx. 1 por seção) |
| `destructive` | Ação destrutiva ou de risco |
| `outline` | Ação secundária com ênfase média |
| `secondary` | Alternativa neutra ao `default` |
| `ghost` | Ação terciária, sem fundo |
| `link` | Comportamento de link textual |

**Tamanhos**: `default`, `sm`, `lg`, `icon` — usar sempre `default`, salvo instrução específica.

**Regras**:
- Espaçamento entre botões: **mínimo `--spacing-4`** (16px), ou seja `data-spacing="md"` no cluster que os agrupa. Abaixo disso o par lê como um controle segmentado, e a área de erro entre dois alvos adjacentes encolhe. Vale para par de ações, fileira de variantes e barra de ferramentas.
  - **Exceção — botão `sm` e botão de ícone**: quando TODOS os botões do cluster são `size="sm"` ou da família de ícone (`icon`, `icon-sm`, `icon-lg`, `icon-xs`), o piso cai para `--spacing-2` (8px). Como 8px é o padrão do `.nds-cluster`, aí o `data-spacing` também pode ser omitido; só `xs` (4px) continua apertado demais.
    - O botão `sm` está em superfície compacta — rodapé de popover, de tooltip, de hover-card — onde 16px entre dois alvos pequenos é mais do que a superfície comporta.
    - O botão de **ícone** é outro caso: quadrado e sem texto, uma fileira deles é uma **barra de ferramentas**, não um par de ações. Ali a proximidade é o que comunica que os comandos pertencem ao mesmo conjunto — e isso vale mesmo no tamanho padrão de ícone, não só nos reduzidos.
  - Cluster que MISTURA tamanhos cai na regra estrita: o alvo maior é quem define a distância confortável.
  - Grupo emendado (`.nds-button-group`) é o caso oposto e continua sem gap, de propósito.
  - Portão: `button_gap_apertado` no `audit.mjs`.
- Máximo 1 botão `default` (primário) por seção
- Ícones apenas quando essenciais ao contexto — não decorativos por padrão
- Alinhamento: primário sempre à direita — ver `16-padroes-design-sistema.md` → "Alinhamento de Grupos de Botões"
- Botão icon-only: `aria-label` obrigatório com verbo + objeto + identificador
- Submit dentro de Form: `disabled` ligado a `form.formState.isSubmitting`

**Acessibilidade** (ver `11-acessibilidade.md`):
- `aria-label` **contextual** em botões ambíguos — descreve a ação **e o objeto**, nunca apenas a ação
- Ícones dentro do botão: sempre `aria-hidden="true"` — o label do botão já descreve a ação
- Nunca usar `aria-label` que apenas repete o texto visível

**UX Writing** (ver `19-tom-de-voz.md`):
- Verbos no infinitivo, máximo 3 palavras, sem pontuação
- Correto: "Salvar", "Criar conta", "Excluir item"
- Incorreto: "Clique aqui", "OK", "Sim", "Enviar formulário de cadastro"

**Analytics** (ver `21-analytics.md`):
- Evento: `button_click` com `component`, `variant`, `location`, `label`
- `data-track-label` deve ser idêntico ao `aria-label` ou ao texto visível
- Não rastrear cliques em botões `disabled`

---

## Calendar

**Propósito**: seletor visual de datas com navegação por mês.

**API e exemplos**: `src/components/ui/calendar/calendar.vue` + stories + `CalendarDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Props relevantes**:

| Prop | Default | Função |
|------|---------|--------|
| `mode` | `single` | `single` (padrão obrigatório) ou `range` (apenas com instrução específica) |
| `locale` | — | Obrigatório `ptBR` — sem ele o calendário exibe em inglês |
| `selected` | — | Data ou intervalo selecionado |
| `disabled` | — | `Date`, `Date[]`, `{ before, after }`, `{ from, to }` ou função |
| `numberOfMonths` | `1` | Usar `2` em modo `range` |

**Regras**:
- Modo `single` obrigatório por padrão
- `locale={ptBR}` **obrigatório**
- Quando dentro de FormField, ligar `selected` ao `field.value` e `onSelect` ao `field.onChange`

**Acessibilidade**: navegação por teclado gerenciada nativamente — Arrow keys para dias, Page Up/Down para meses, Home/End para início/fim do mês.

---

## DatePicker

**Propósito**: seleção de data via campo de texto com calendar popover — padrão composto de `Calendar + Popover + Button`.

**API e exemplos**: `src/components/ui/date-picker/date-picker.vue` + stories + `DatePickerDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes**:

```
Popover
├── PopoverTrigger (Button outline com CalendarIcon + texto formatado)
└── PopoverContent
    └── Calendar (mode="single", locale=ptBR, initialFocus)
```

**Regras**:
- `initialFocus` no `Calendar` — move o foco para o calendário ao abrir o Popover
- `format` de `date-fns` para exibir a data no botão — locale `ptBR` de `date-fns/locale`
- `locale` do `Calendar` vem de `react-day-picker/locale` — são pacotes diferentes
- `aria-label` dinâmico no Button — anuncia a data selecionada ao leitor de tela
- Quando dentro de FormField, `field.value` alimenta `selected` e o texto do trigger; `field.onChange` alimenta `onSelect`

---

## Checkbox

**Propósito**: seleção independente de uma ou mais opções em uma lista.

**Quando usar**: múltiplas seleções independentes. Para seleção única, usar `RadioGroup`. Para toggle on/off de configuração, usar `Switch`.

**API e exemplos**: `src/components/ui/checkbox/checkbox.vue` + stories + `CheckboxDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Props relevantes**:

| Prop | Default | Função |
|------|---------|--------|
| `checked` | `false` | `true`, `false` ou `"indeterminate"` (seleção parcial de grupo) |
| `disabled` | `false` | Desabilita interação |

**Regras**:
- `Checkbox` sempre acompanhado de `Label` com `htmlFor` correspondente ao `id`
- `checked="indeterminate"` para seleção parcial de grupo (nem todos marcados)
- Agrupar checkboxes relacionados em `<fieldset>` + `<legend>`

**Acessibilidade**: aplica `role="checkbox"` e `aria-checked` automaticamente, incluindo `"mixed"` para indeterminate.

**UX Writing** (ver `19-tom-de-voz.md`): label descreve o estado ativo — "Receber notificações por email" em vez de "Email".

**Analytics** (ver `21-analytics.md`): `field_change` com `component`, `location`, `field_name`, `value` (string).

---

## Form

**Propósito**: wrapper de acessibilidade e gerenciamento de estado para formulários, integrado com Vee-validate e Zod.

**API e exemplos**: `src/components/ui/form/form.vue` + stories + `FormDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes**:

```
Form
└── FormField (control, name)
    └── FormItem
        ├── FormLabel
        ├── FormControl   (injeta aria-invalid + aria-describedby automaticamente)
        │   └── [Input | Select | Checkbox | Switch | …]
        ├── FormDescription
        └── FormMessage   (erro do Zod — visível apenas com erro)
```

**Regras**:
- Sempre usar `Form > FormField > FormItem` — nunca criar campos fora desta estrutura
- `FormDescription` substitui qualquer helper text customizado
- `FormMessage` exibe o erro do Zod — não criar mensagens de erro paralelas
- `FormControl` injeta `aria-invalid` e `aria-describedby` automaticamente — não adicionar manualmente
- Submit bloqueado enquanto submetendo
- Para formulários multi-etapa, validar apenas os campos da etapa atual antes de avançar (não submeter o form inteiro entre etapas)

**UX Writing das mensagens de erro** (ver `19-tom-de-voz.md`): causa + orientação, sem culpar — "Email inválido. Use o formato nome@dominio.com", nunca "Campo inválido".

**Analytics** (ver `21-analytics.md`):

| Evento | Quando |
|--------|--------|
| `form_submit` | Após validação bem-sucedida |
| `form_error` | Quando o resolver rejeita o submit |
| `form_abandon` | Ao sair sem submeter |

---

## Input

**Propósito**: campo de texto de linha única para qualquer tipo de entrada do usuário.

**API e exemplos**: `src/components/ui/input/input.vue` + stories + `InputDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Regras**:
- `type` adequado obrigatório: `email`, `password`, `number`, `tel`, `url`, `search`, `date`
- Placeholder: exemplo real do formato — nunca instrução ("Digite seu email")
- Placeholder **não substitui** Label — ambos são obrigatórios
- Ícones: apenas em formulários pequenos (login, busca) — não em formulários longos de cadastro
- Ícone posicionado **à esquerda** via padrão `relative/absolute/pl-*`
- Formulários de busca: sempre com botão de submit (pode ser `sr-only` visualmente)

**Tokens** (ver `16-padroes-design-sistema.md`):
- Fundo: `bg-input` · Borda: `border-input` · Texto: `text-foreground`
- Placeholder: `placeholder:text-muted-foreground`
- Focus: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`

**Acessibilidade** (ver `11-acessibilidade.md`):
- `FormControl` aplica `aria-invalid` e `aria-errormessage` automaticamente dentro de `FormField`
- `aria-required="true"` em campos obrigatórios
- Nunca rastrear `value` de campos sensíveis: senha, CPF, cartão de crédito

**Analytics** (ver `21-analytics.md`): apenas em funis críticos, `field_focus` / `field_blur` com `field_name`. Nunca o valor.

---

## Input OTP

**Propósito**: entrada de códigos de verificação de uso único (OTP, PIN, 2FA).

**API e exemplos**: `src/components/ui/input-otp/input-otp.vue` + stories + `InputOTPDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes**:

```
InputOTP (maxLength, pattern)
├── InputOTPGroup
│   └── InputOTPSlot (index)
├── InputOTPSeparator
└── InputOTPGroup
    └── InputOTPSlot (index)
```

**Regras**:
- `maxLength` obrigatório — define o número total de slots
- `pattern={REGEXP_ONLY_DIGITS}` obrigatório para códigos numéricos
- `REGEXP_ONLY_DIGITS_AND_CHARS` para códigos alfanuméricos
- Auto-focus no próximo slot e suporte a paste são comportamentos nativos — não implementar manualmente
- `InputOTPSeparator` entre grupos apenas quando o código tem separação visual (ex: 000-000)
- `aria-label` no `InputOTP` descreve o propósito ("Código de verificação de 6 dígitos")

**Acessibilidade**: o componente renderiza um único `<input>` oculto (acessível a leitores de tela) com slots visuais sobrepostos.

---

## Label

**Propósito**: rótulo textual acessível associado a um campo de formulário.

**API e exemplos**: `src/components/ui/label/label.vue` + stories + `LabelDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Regras**:
- `htmlFor` obrigatório fora de `FormField` — associa o label ao campo via `id`
- Dentro de `FormField`, usar `FormLabel` — associação automática via contexto interno
- Posicionar **acima** do campo (padrão) ou à esquerda em layouts horizontais
- Peso tipográfico: `font-medium` — não sobrescrever para `font-bold`
- Indicador de obrigatório: `*` com `aria-hidden="true"`; aplicar `aria-required="true"` no campo

**UX Writing** (ver `19-tom-de-voz.md`):
- Substantivo ou frase nominal curta, sem dois-pontos, sem ponto final
- Capitalização apenas na primeira palavra
- Correto: "Nome completo", "Email profissional"
- Incorreto: "Nome completo:", "Informe seu nome", "nome completo"

---

## Radio Group

**Propósito**: seleção de uma única opção em conjunto mutuamente exclusivo.

**Quando usar**: 2–7 opções com seleção única. Para on/off, usar `Switch`. Para confirmação de uma opção, usar `Checkbox`.

**API e exemplos**: `src/components/ui/radio-group/radio-group.vue` + stories + `RadioGroupDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes**:

```
RadioGroup[aria-label] (value, onValueChange)
└── RadioGroupItem (value, id) + Label[htmlFor]
```

**Regras**:
- `RadioGroupItem` sempre com `Label` associado via `htmlFor` + `id`
- **Não pré-selecionar** por padrão — apenas quando existe um default genuíno de negócio. Pré-seleção forçada cria erros silenciosos em formulários
- 4+ opções: orientação vertical
- 2–3 opções curtas: pode usar `flex gap-6`

**Acessibilidade**: aplica `role="radiogroup"` e `role="radio"` automaticamente. Arrow keys navegam entre opções — comportamento nativo.

**Analytics** (ver `21-analytics.md`): `field_change` com `field_name` e `value`.

---

## Select

**Propósito**: seleção de uma opção em lista compacta.

**Quando usar**: 3+ opções fixas. Para 2 opções, usar `RadioGroup`. Para listas com busca ou 10+ itens, usar **Combobox** — o `Select` não tem busca nativa.

**API e exemplos**: `src/components/ui/select/select.vue` + stories + `SelectDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes**:

```
Select (value, onValueChange)
├── SelectTrigger
│   └── SelectValue   (placeholder ou valor selecionado)
└── SelectContent
    ├── SelectGroup        (agrupamento opcional)
    │   ├── SelectLabel
    │   └── SelectItem (value)
    └── SelectItem (value)
```

**Regras**:
- Placeholder: "Selecione..." — nunca "-- Escolha --" ou campo vazio
- Opções consistentes entre si — não misturar siglas com nomes completos
- Para 10+ opções com busca: usar **Combobox** em vez de Select

**Acessibilidade**: aplica `role="combobox"` no trigger e `role="listbox"` + `role="option"` no conteúdo. Arrow keys navegam entre opções — comportamento nativo.

**Analytics** (ver `21-analytics.md`): `option_select` com `field_name`, `value`, `label`.

---

## Combobox

**Propósito**: campo de texto que filtra uma lista e devolve a opção escolhida. No modo múltiplo, os escolhidos viram chips dentro do próprio campo. É componente próprio — primitivo, stories e docs page —, não uma composição montada a partir de outras peças.

**Quando usar**: lista com busca, 10+ itens, rótulos longos ou parecidos entre si, escolha múltipla que precisa ficar visível dentro do campo. Lista curta e fechada continua sendo `Select`; duas opções continuam sendo `RadioGroup`.

**API e exemplos**: `src/components/ui/combobox/` + stories + `ComboboxDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes** (o `data-slot` ao lado é o contrato compartilhado):

```
Combobox                            combobox
├── ComboboxLabel                   combobox-label
├── ComboboxInputWrapper            combobox-input-wrapper   ← a caixa que parece o campo
│   │                                                         data-chips="wrap | single-line"
│   ├── ComboboxChips               combobox-chips           ← a caixa que cresce (só no modo múltiplo)
│   │   ├── ComboboxChip            combobox-chip
│   │   │   └── ComboboxChipRemove  combobox-chip-remove
│   │   └── ComboboxInput           combobox-input           role="combobox"
│   ├── ComboboxClear               combobox-clear
│   └── ComboboxTrigger             combobox-trigger
│       └── ComboboxIcon            combobox-icon
└── ComboboxPositioner              combobox-positioner
    └── ComboboxPopup               combobox-popup
        ├── ComboboxList            combobox-list            role="listbox"
        │   ├── ComboboxGroup       combobox-group
        │   │   ├── ComboboxGroupLabel  combobox-group-label
        │   │   └── ComboboxItem    combobox-item            role="option"
        │   │       └── ComboboxItemIndicator  combobox-item-indicator
        │   └── ComboboxSeparator   combobox-separator
        └── ComboboxEmpty           combobox-empty
```

No modo simples não há caixa de chips, e o campo de texto é filho direto do wrapper — a folha compartilhada aceita as duas formas.

**Modo múltiplo**: `multiple` troca o valor exibido por chips dentro da própria caixa. Cada chip traz o rótulo do escolhido e um botão de remover. Backspace com o texto vazio remove o último chip.

O campo de texto mora **dentro** de `ComboboxChips`, e não ao lado dela: é essa caixa que quebra em linhas ou rola na horizontal, e é o que faz o cursor continuar logo depois do último chip. Limpar e gatilho ficam **fora** dela, irmãos, e por isso permanecem sempre na primeira linha. A peça de chips já foi `display: contents` — sem caixa própria, chip, texto, limpar e gatilho eram irmãos no mesmo flex que quebrava, e os dois botões caíam para a linha de baixo assim que os chips enchiam a primeira. Foi o defeito que deu origem a `chipsLayout`.

O valor tem **um dono só**: ele mora na raiz, e os chips são marcação lida desse mesmo modelo. Remover um chip escreve de volta no modelo — não há segundo estado a sincronizar, e por isso o campo de texto nunca perde o foco no gesto.

**Props da raiz**:

| Prop | Tipo | Padrão | Função |
|---|---|---|---|
| `modelValue` | `string \| string[]` | — | Escolha atual (`v-model`); lista no modo múltiplo |
| `defaultValue` | `string \| string[]` | — | Escolha inicial quando o campo administra o próprio estado |
| `update:modelValue` | `(value: string \| string[]) => void` | — | Evento de mudança da escolha; dispara também ao remover chip e ao limpar |
| `inputValue` | `string` | — | Texto de busca (`v-model:input-value`) |
| `update:inputValue` | `(text: string) => void` | — | Evento de mudança do texto digitado; é o gancho para buscar opções no servidor |
| `filter` | `(item: ComboboxFilterItem, query: string) => boolean` | — | Substitui o filtro. Sem ele, quem filtra é o primitivo, ignorando acento e caixa |
| `multiple` | `boolean` | `false` | Escolhidos viram chips dentro do campo |
| `chipsLayout` | `'wrap' \| 'single-line'` | `'wrap'` | Chips em várias LINHAS, com o campo crescendo em altura, ou numa linha só que rola na horizontal. Sai como `data-chips` no wrapper; limpar e gatilho ficam na primeira linha nos dois casos |
| `disabled` | `boolean` | `false` | Campo indisponível: nada recebe foco e a lista não abre |
| `invalid` | `boolean` | `false` | Marca o campo como inválido |
| `name` | `string` | — | Nome do campo no formulário |
| `highlightOnHover` | `boolean` | `true` | A opção sob o ponteiro vira a opção ativa |
| `openOnClick` | `boolean` | `true` | Clicar no campo abre a lista — é o que o `cursor: text` da caixa promete |
| `resetModelValueOnClear` | `boolean` | `true` | O botão de limpar zera a escolha, e não só o texto |

`chipsLayout` também mora na raiz, ao lado de `multiple`: é a mesma decisão de quem liga os chips, e desce ao wrapper pelo contexto próprio desta camada. Prop no wrapper obrigaria a repetir a escolha em toda composição. Um `data-chips` escrito à mão no `ComboboxInputWrapper` ainda vence — atributo herdado é aplicado depois do declarado —, e é a saída para o caso em que a raiz não é de quem monta o campo.

O texto de busca e o filtro moram na RAIZ porque as duas coisas são lidas por mais de uma peça, e a raiz é a única que todas alcançam. O tipo do item do filtro é `ComboboxFilterItem`, e não `ComboboxItem`: este último já é o nome do COMPONENTE de opção, e os dois colidiriam no mesmo import.

**Props das peças**:

| Peça | Prop | Função |
|---|---|---|
| `ComboboxInput` | `placeholder` | Dica exibida enquanto nada foi digitado |
| `ComboboxInput` | `displayValue` | Como o escolhido vira texto no campo |
| `ComboboxChip` | `value` | Qual escolhido este chip representa |
| `ComboboxChipRemove` | `aria-label` | Nome próprio do botão: "Remover Brasil" |
| `ComboboxChipRemove` | `removedAnnouncement` | Frase que a região viva lê DEPOIS da remoção: "Brasil removido" |
| `ComboboxClear` · `ComboboxTrigger` | `aria-label` | Nome acessível do botão de limpar e do de abrir a lista |
| `ComboboxItem` | `value` · `disabled` | Opção da lista |
| `ComboboxEmpty` | slot padrão | Texto quando o filtro não casa com nada |

**Regras**:
- `ComboboxLabel` sempre presente. Sem rótulo visível, o nome vem de `aria-label` no campo de texto: o papel de combobox não tira nome do próprio conteúdo, e o conteúdo aqui é o texto digitado.
- Os textos de interface — mensagem de vazio, nome do botão de limpar, nome do gatilho, nome do botão de remover e a frase do anúncio de remoção — nascem em português dentro do componente e **têm de ser passados traduzidos** por quem monta a página. Nenhum deles muda de idioma sozinho, e o nome que o primitivo escreve no gatilho vem fixo em inglês: passar `aria-label` é o que o traduz.
- Botão de remover tem nome PRÓPRIO, um por chip: "Remover Brasil", nunca cinco botões chamados "Remover" — nome repetido em vários controles é o mesmo que nome nenhum (WCAG 4.1.2). O nome diz o COMANDO; o anúncio da região viva diz o que ACONTECEU, e por isso são dois textos e não um.
- Estado vazio sempre presente: lista filtrada sem resultado nunca fica em branco.
- Ao passar `filter`, o filtro do primitivo é desligado e cada opção passa a decidir a própria presença — e o grupo se esconde quando todos os filhos somem. Cabeçalho de grupo sozinho na lista é o defeito clássico de filtrar item a item.
- Chip é rótulo de opção escolhida, não texto livre. Valor digitado que vira etiqueta é outro componente.

**Acessibilidade** (ver `11-acessibilidade.md`):
- `role="combobox"` vai no INPUT, não num wrapper nem num botão — é o padrão ARIA 1.2.
- O foco NUNCA sai do campo de texto: a opção ativa é apontada por `aria-activedescendant` e realçada por `[data-highlighted]`. Mover o foco para a opção quebraria a digitação, que é o ponto do componente.
- `aria-expanded` acompanha a lista aberta ou fechada; `aria-autocomplete="list"` declara que digitar filtra; `aria-selected="true"` na opção escolhida; `aria-invalid="true"` quando a validação reprova.
- Remover um chip não move o foco nem muda o texto do campo: quem anuncia é uma região viva `role="status"`, montada o tempo todo. O foco volta ao campo de texto porque o botão desaparece no mesmo gesto.
- Teclado: digitar filtra e abre a lista; ↓ e ↑ andam pelas opções e dão a volta; Enter escolhe a ativa; Escape fecha e, com a lista já fechada, limpa o texto; Tab fecha e sai do campo; Backspace com o texto vazio remove o último chip, em UMA tecla; Home e End vão à primeira e à última opção.
- O gatilho fica fora da ordem de tabulação: quem tem foco é o campo, e o Tab tem de sair dele em vez de parar num segundo alvo que faz o que a seta já faz. O botão de limpar, esse, é focável — é a única forma de zerar a escolha inteira sem o mouse.

**Divergências de API registradas** (divergência de framework se anota, não se alinha):
- O chip e a opção não embrulham o texto em nós `combobox-chip-text` e `combobox-item-text`: o texto chega pelo slot padrão, lado a lado com o botão de remover ou com a marca de escolhido, que é a forma que o conteúdo compartilhado ensina. Nenhuma folha e nenhum atributo de acessibilidade dependem daqueles nós.
- O campo escondido do formulário é emitido pelo primitivo quando a raiz tem `name`, sem `data-slot="combobox-hidden-input"`.

**Analytics** (ver `21-analytics.md`): `option_select` com `{ component: "combobox", field_name, value, label, location }` ao escolher uma opção; `field_change` com `{ component: "combobox", field_name, value, location }` ao remover um chip ou limpar o campo.

---

## Slider

**Propósito**: seleção de valor numérico dentro de um intervalo contínuo.

**API e exemplos**: `src/components/ui/slider/slider.vue` + stories + `SliderDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Props relevantes**:

| Prop | Default | Função |
|------|---------|--------|
| `min` / `max` / `step` | — | Sempre definir explicitamente |
| `value` | — | Array: `[v]` single thumb, `[min, max]` range |
| `onValueChange` | — | Disparo contínuo — usar para UI |
| `onValueCommit` | — | Disparo ao soltar — usar para analytics |

**Regras**:
- Sempre exibir o valor atual externamente via estado — o Slider não exibe valor por padrão
- `aria-live="polite"` no elemento que exibe o valor — anuncia ao leitor de tela
- Definir `min`, `max` e `step` explicitamente

**Acessibilidade** (ver `11-acessibilidade.md`):
- `aria-label` obrigatório quando não há label visível associado
- `aria-valuetext` para valores que precisam de contexto ("50 por cento" em vez de "50")
- Arrow keys ajustam em `step`, `Shift+Arrow` em 10× step — comportamento nativo

**Analytics**: usar `onValueCommit` — dispara ao soltar o thumb, não a cada movimento. Evita dezenas de eventos por interação.

---

## Switch

**Propósito**: toggle on/off para configurações com efeito imediato, sem necessidade de submissão.

**Quando usar**: configurações de sistema (notificações, dark mode, visibilidade). Para seleção em formulários com submit, usar `Checkbox`. Para opções de formatação visual, usar `Toggle`.

**API e exemplos**: `src/components/ui/switch/switch.vue` + stories + `SwitchDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Regras**:
- `Switch` sempre com `Label` associado via `htmlFor`
- Label descreve o estado **ativo**: "Receber notificações" (não "Notificações")
- Efeito imediato ao alternar — não usar dentro de formulários com submit para preferências

**Acessibilidade**: aplica `role="switch"` e `aria-checked` automaticamente via `data-state`.

**Analytics** (ver `21-analytics.md`): `field_change` com `field_name` e `value` (string).

---

## Textarea

**Propósito**: entrada de texto de múltiplas linhas.

**Quando usar**: textos longos onde se espera 3+ linhas — bio, descrição, mensagem, observações. Para linha única, usar `Input`.

**API e exemplos**: `src/components/ui/textarea/textarea.vue` + stories + `TextareaDocs.vue` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Classes de resize** (`.nds-textarea` já redimensiona na vertical por padrão):

| Classe | Uso |
|--------|-----|
| `.nds-resize-none` | sem redimensionamento (modais, layouts fixos) |
| `.nds-resize-y` | vertical apenas (padrão recomendado) |
| `.nds-resize` | livre (evitar — quebra layouts) |

**Regras**:
- `.nds-min-h-30` como altura mínima padrão (120px, ~3 linhas). Sem utilitário, o mínimo é ~64px
- A altura **não** acompanha o conteúdo: passando das linhas visíveis, o texto rola. Campo maior se pede por `rows` ou por `.nds-min-h-*`
- Contador de caracteres com `aria-live="polite"` — anuncia ao leitor de tela sem interromper
- `maxLength` no elemento + validação Zod — defesa em profundidade

**Acessibilidade**: `aria-invalid` aplicado automaticamente pelo `FormControl` dentro de `FormField`.

---

## Toggle e Toggle Group

**Propósito**: botão de dois estados (ativo/inativo) para opções visuais ou de formatação.

**Quando usar**: formatação de texto (negrito, itálico), filtros de visualização, modos de exibição. Para configurações de sistema, usar `Switch`. Para seleção em formulários, usar `Checkbox`.

**API e exemplos**: `src/components/ui/toggle/toggle.vue` + `src/components/ui/toggle-group/toggle-group.vue` + stories + docs (renderizadas na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Critério de decisão**:

| Situação | Componente |
|----------|------------|
| Formatação visual (negrito, itálico, sublinhado) | Toggle |
| Configuração com efeito imediato | Switch |
| Seleção em formulário com submit | Checkbox |

**Estrutura do Toggle Group**:

```
ToggleGroup (type="single" | "multiple")
└── ToggleGroupItem (value)
```

**Regras**:
- Tamanho `default` obrigatório — salvo instrução específica
- `type="single"` para seleção exclusiva, `type="multiple"` para múltiplas
- `aria-label` obrigatório em itens com apenas ícone

**Acessibilidade**: aplica `aria-pressed` no `Toggle` e `aria-selected` no `ToggleGroupItem`. Arrow keys navegam entre itens do grupo.

**Analytics** (ver `21-analytics.md`): `field_change` com `field_name` e `value` (string ou array.join(",")).

---

## Form multi-step (integração com Stepper)

Para formulários com múltiplas etapas sequenciais, o `Form` deste arquivo se integra com o `Stepper` do arquivo 05.

**Regras**:
- `mode: "onChange"` no resolver — valida em tempo real conforme o usuário preenche
- Validar apenas os campos da etapa atual antes de avançar (mapa de campos por etapa)
- `type="button"` nos botões Anterior e Próximo — evita submit acidental
- `type="submit"` apenas no botão da última etapa
- O `<Form>` envolve todo o Stepper — o submit só ocorre na última etapa

---

## Regras transversais de Form Components

**Estrutura obrigatória por campo**:

```
FormField > FormItem > FormLabel + FormControl + FormDescription + FormMessage
```

**Tokens obrigatórios** (ver `16-padroes-design-sistema.md`):
- Input/Textarea/Select: `bg-input border-input text-foreground placeholder:text-muted-foreground`
- Focus: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- Erro: `border-destructive` no campo, `text-destructive` na mensagem
- Label: `font-medium` — não sobrescrever para `font-bold`

**Acessibilidade transversal** (ver `11-acessibilidade.md`):
- `FormControl` aplica `aria-invalid` e `aria-describedby` automaticamente — nunca adicionar manualmente
- `aria-required="true"` em campos obrigatórios
- `aria-live="polite"` em contadores e mensagens dinâmicas
- Nunca rastrear `value` de campos sensíveis (senha, CPF, cartão)

**Analytics transversal** (ver `21-analytics.md`):

| Evento | Quando disparar | Componentes |
|--------|----------------|-------------|
| `button_click` | Ao clicar | Button |
| `form_submit` | Após validação bem-sucedida | Form |
| `form_error` | Quando o resolver rejeita submit | Form |
| `form_abandon` | Ao sair sem submeter | Form |
| `field_change` | Ao alterar valor de seleção | Checkbox, Switch, Select, RadioGroup, Slider, Toggle |
| `field_focus` | Ao focar | Input, Textarea (funis críticos) |
| `field_error` | Ao exibir erro | Qualquer campo com FormMessage |
| `option_select` | Ao selecionar opção | Select |

**UX Writing transversal** (ver `19-tom-de-voz.md`):
- Labels: substantivos, sem dois-pontos, capitalização na primeira palavra
- Placeholders: exemplos reais, nunca instruções
- Mensagens de erro: causa + orientação, sem culpar o usuário
- Botão submit: verbo no infinitivo, máximo 3 palavras
