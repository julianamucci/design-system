# Form Components

---

## Button

**Propósito**: elemento de ação primária — dispara submissões, confirmações, navegações e qualquer ação do usuário.

**API e exemplos**: `src/components/ui/button.tsx` + stories + `ButtonDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Variantes** (cva):

| Variant | Uso |
|---|---|
| `default` | Ação primária da seção |
| `destructive` | Ações destrutivas (excluir, descartar) |
| `outline` | Ação secundária |
| `secondary` | Alternativa de destaque médio |
| `ghost` | Ação terciária / tool buttons |
| `link` | Aparência de link textual |

**Sizes**: `default`, `sm`, `lg`, `icon` — usar sempre `default`, salvo instrução específica.

**Regras**:
- Espaçamento entre botões: **mínimo `--spacing-4`** (16px), ou seja `data-spacing="md"` no cluster que os agrupa. Abaixo disso o par lê como um controle segmentado, e a área de erro entre dois alvos adjacentes encolhe. Vale para par de ações, fileira de variantes e barra de ferramentas.
  - **Exceção — botão `sm` e botão de ícone**: quando TODOS os botões do cluster são `size="sm"` ou da família de ícone (`icon`, `icon-sm`, `icon-lg`, `icon-xs`), o piso cai para `--spacing-2` (8px). Como 8px é o padrão do `.nds-cluster`, aí o `data-spacing` também pode ser omitido; só `xs` (4px) continua apertado demais.
    - O botão `sm` está em superfície compacta — rodapé de popover, de tooltip, de hover-card — onde 16px entre dois alvos pequenos é mais do que a superfície comporta.
    - O botão de **ícone** é outro caso: quadrado e sem texto, uma fileira deles é uma **barra de ferramentas**, não um par de ações. Ali a proximidade é o que comunica que os comandos pertencem ao mesmo conjunto — e isso vale mesmo no tamanho padrão de ícone, não só nos reduzidos.
  - Cluster que MISTURA tamanhos cai na regra estrita: o alvo maior é quem define a distância confortável.
  - Grupo emendado (`.nds-button-group`) é o caso oposto e continua sem gap, de propósito.
  - Portão: `button_gap_apertado` no `audit.mjs`.
- Máximo 1 botão `default` (primário) por seção.
- Ícones apenas quando essenciais ao contexto — não decorativos por padrão.
- Estilo personalizado via classe `.btn` do tema.
- Alinhamento: primário sempre à direita — ver `docs/shared/guidelines/04-padroes-design-sistema.md` → "Alinhamento de Grupos de Botões".
- Submit em formulários: `type="submit"` + `disabled` durante `form.formState.isSubmitting`.

**Acessibilidade** (ver `docs/shared/guidelines/01-acessibilidade.md`):
- `aria-label` **contextual** em botões ambíguos — descreve a ação **e o objeto**, nunca apenas a ação. Ex.: `"Excluir produto Cadeira Gamer Pro"`, não `"Excluir"`.
- Ícones dentro do botão: sempre `aria-hidden="true"` — o label do botão já descreve a ação.
- Botão icon-only: `aria-label` obrigatório com verbo + objeto + identificador.

**UX Writing** (ver `docs/shared/guidelines/05-tom-de-voz.md`):
- Verbos no infinitivo, máximo 3 palavras, sem pontuação.
- Correto: "Salvar", "Criar conta", "Excluir item".
- Incorreto: "Clique aqui", "OK", "Sim", "Enviar formulário de cadastro".

**Analytics** (ver `docs/shared/guidelines/07-analytics.md`):
- Evento `button_click` com `component`, `variant`, `location`, `label`.
- `data-track-label` idêntico ao `aria-label` ou ao texto visível.
- Não rastrear cliques em botões `disabled`.

---

## Calendar

**Propósito**: seletor visual de datas com navegação por mês.

**API e exemplos**: `src/components/ui/calendar.tsx` + stories + `CalendarDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

> **Versão**: usa `react-day-picker v9`. A API mudou em relação a versões anteriores — verificar antes de implementar.

**Props relevantes**:

| Prop | Default | Função |
|---|---|---|
| `mode` | — | `"single"` (padrão obrigatório), `"range"` apenas com instrução específica |
| `locale` | — | `ptBR` de `react-day-picker/locale` — obrigatório |
| `disabled` | — | `Date`, `Date[]`, `{ before, after }`, `{ from, to }` ou `(date) => boolean` |
| `numberOfMonths` | `1` | `2` para `mode="range"` |

**Regras**:
- Modo `single` obrigatório por padrão — usar `range` apenas com instrução específica.
- `locale={ptBR}` **obrigatório** — sem ele o calendário exibe em inglês.
- Em formulário, usar dentro de `FormField` + `FormControl`.

**Acessibilidade**: navegação por teclado nativa do `react-day-picker` — Arrow keys para dias, Page Up/Down para meses, Home/End para início/fim do mês.

---

## DatePicker

**Propósito**: seleção de data via campo de texto com calendar popover — padrão composto de `Calendar + Popover + Button`.

**API e exemplos**: o DatePicker **não é um primitivo** — não há `date-picker.tsx` nem docs page própria. É um padrão de composição, e vive nas stories de composição do Calendar (`src/components/ui/calendar-compositions.stories.tsx`). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes**:
```
Popover
├── PopoverTrigger (asChild → Button outline)
│   ├── CalendarIcon (aria-hidden)
│   └── data formatada via date-fns OR placeholder
└── PopoverContent
    └── Calendar (mode="single", initialFocus, locale)
```

**Regras**:
- `initialFocus` no `Calendar` — move o foco para o calendário ao abrir o Popover.
- `format` de `date-fns` para exibir a data no botão — locale `ptBR` de `date-fns/locale`.
- `locale` do `Calendar` vem de `react-day-picker/locale` — são pacotes diferentes.
- `aria-label` dinâmico no Button — anuncia a data selecionada ao leitor de tela.

---

## Checkbox

**Propósito**: seleção independente de uma ou mais opções em uma lista. Para seleção única, usar `RadioGroup`. Para toggle on/off de configuração, usar `Switch`.

**API e exemplos**: `src/components/ui/checkbox.tsx` + stories + `CheckboxDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Props relevantes**:

| Prop | Função |
|---|---|
| `checked` | `boolean` ou `"indeterminate"` para seleção parcial de grupo |
| `onCheckedChange` | Callback de mudança |

**Regras**:
- `Checkbox` sempre acompanhado de `Label` com `htmlFor` correspondente ao `id`.
- `checked="indeterminate"` para seleção parcial de grupo (nem todos marcados).
- Agrupar checkboxes relacionados em `<fieldset>` + `<legend>`.

**Acessibilidade**: aplica `role="checkbox"` e `aria-checked` automaticamente, incluindo `"mixed"` para indeterminate.

**UX Writing** (ver `docs/shared/guidelines/05-tom-de-voz.md`): label descreve o estado ativo — "Receber notificações por email" em vez de "Email".

**Analytics**: evento `field_change` com `field_name` e `value` (boolean → string).

---

## Form

**Propósito**: wrapper de acessibilidade e gerenciamento de estado para formulários, integrado com **React Hook Form** + **Zod**.

**API e exemplos**: `src/components/ui/form.tsx` + stories + `FormDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes**:
```
Form
└── FormField                  (conecta ao campo do RHF via control + name)
    └── FormItem               (container do campo)
        ├── FormLabel          (label acessível, associação automática)
        ├── FormControl        (injeta aria-invalid + aria-describedby)
        │   └── [Input | Select | Checkbox | Switch | ...]
        ├── FormDescription    (helper text)
        └── FormMessage        (erro do Zod — visível apenas com erro)
```

**Regras**:
- Sempre usar `Form > FormField > FormItem` — nunca criar campos fora desta estrutura.
- `FormDescription` substitui qualquer helper text customizado.
- `FormMessage` exibe o erro do Zod — não criar mensagens de erro paralelas.
- `FormControl` injeta `aria-invalid` e `aria-describedby` automaticamente — não adicionar manualmente.
- Submit bloqueado com `form.formState.isSubmitting`.
- Validação via `zodResolver(schema)` no `useForm`.

**UX Writing das mensagens de erro** (ver `docs/shared/guidelines/05-tom-de-voz.md`): causa + orientação, sem culpar — "Email inválido. Use o formato nome@dominio.com", nunca "Campo inválido".

**Analytics**:

| Evento | Quando |
|---|---|
| `form_submit` | Após validação bem-sucedida no `onSubmit` |
| `form_error` | Quando RHF rejeita submit (handler `onError`) |
| `form_abandon` | Ao sair sem submeter |

---

## Input

**Propósito**: campo de texto de linha única para qualquer tipo de entrada do usuário.

**API e exemplos**: `src/components/ui/input.tsx` + stories + `InputDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Regras**:
- `type` adequado obrigatório: `email`, `password`, `number`, `tel`, `url`, `search`, `date`.
- Placeholder: exemplo real do formato — nunca instrução ("Digite seu email").
- Placeholder **não substitui** Label — ambos são obrigatórios.
- Ícones: apenas em formulários pequenos (login, busca) — não em formulários longos de cadastro.
- Ícone posicionado **à esquerda**: envolva o campo num `.nds-input-group` e ponha o ícone num `.nds-input-group-addon` com `data-align="inline-start"`. A moldura e o anel de foco passam a viver no grupo; o controle interno recebe `.nds-input-group-control` e fica sem borda própria. Posicionar o ícone por sobreposição absoluta e abrir espaço com recuo à mão é o padrão antigo — ele não acompanha o crescimento do texto.
- Formulários de busca: sempre com botão de submit (pode ficar visualmente oculto com `.nds-sr-only`).
- `autoComplete` adequado ao tipo de campo.

**Tokens** (ver `docs/shared/guidelines/04-padroes-design-sistema.md`) — todos aplicados pela folha `.nds-input`; não repintar o campo por fora:

| Slot | Token lido |
|---|---|
| Fundo | `--background` |
| Borda | `--input`, com `--border` de reserva |
| Texto | `--foreground` |
| Placeholder | `--muted-foreground` |
| Hover e foco | `--ring` |
| Estado inválido (`aria-invalid="true"`) | `--destructive` |

A altura do campo é **resultado** de `padding-block` mais `line-height`, nunca uma altura declarada: é o que faz o campo crescer junto com a fonte do navegador em 200% (WCAG 1.4.4).

**Acessibilidade** (ver `docs/shared/guidelines/01-acessibilidade.md`):
- `FormControl` aplica `aria-invalid` e `aria-errormessage` automaticamente dentro de `FormField`.
- `aria-required="true"` em campos obrigatórios.

**Analytics** (ver `docs/shared/guidelines/07-analytics.md`):
- Apenas em funis críticos: `field_focus` e `field_blur` com `field_name`.
- Nunca rastrear `value` de campos sensíveis: senha, CPF, cartão de crédito.

---

## Input OTP

**Propósito**: entrada de códigos de verificação de uso único (OTP, PIN, 2FA).

**API e exemplos**: `src/components/ui/input-otp.tsx` + stories + `InputOTPDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes**:
```
InputOTP (maxLength, pattern)
├── InputOTPGroup
│   ├── InputOTPSlot (index=0)
│   ├── InputOTPSlot (index=1)
│   └── InputOTPSlot (index=2)
├── InputOTPSeparator
└── InputOTPGroup
    ├── InputOTPSlot (index=3)
    ├── InputOTPSlot (index=4)
    └── InputOTPSlot (index=5)
```

**Regras**:
- `maxLength` obrigatório — define o número total de slots.
- `pattern={REGEXP_ONLY_DIGITS}` para códigos numéricos; `REGEXP_ONLY_DIGITS_AND_CHARS` para alfanuméricos.
- Auto-focus no próximo slot e suporte a paste são comportamentos nativos — não implementar manualmente.
- `InputOTPSeparator` entre grupos apenas quando o código tem separação visual (ex.: 000-000).

**Acessibilidade**: o componente renderiza um único `<input>` oculto (acessível a leitores de tela) com slots visuais sobrepostos. `aria-label` no `InputOTP` descreve o propósito.

---

## Label

**Propósito**: rótulo textual acessível associado a um campo de formulário.

**API e exemplos**: `src/components/ui/label.tsx` + stories + `LabelDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Regras**:
- `htmlFor` obrigatório fora de `FormField` — associa o label ao campo via `id`.
- Dentro de `FormField`, usar `FormLabel` — associação automática via contexto interno.
- Posicionar **acima** do campo (padrão) ou à esquerda em layouts horizontais.
- Peso tipográfico: a folha `.nds-label` já aplica `--font-weight-medium` — não sobrescrever para negrito.
- Asterisco de obrigatório: um `<span>` com `aria-hidden="true"` colorido por `--destructive` (utilitária `.nds-text-destructive`); o campo é quem recebe `aria-required="true"`. O asterisco é sinal visual, e sozinho não informa nada a quem usa leitor de tela.

**UX Writing** (ver `docs/shared/guidelines/05-tom-de-voz.md`):
- Substantivo ou frase nominal curta, sem dois-pontos, sem ponto final.
- Capitalização apenas na primeira palavra.
- Correto: "Nome completo", "Email profissional".
- Incorreto: "Nome completo:", "Informe seu nome", "nome completo".

---

## Radio Group

**Propósito**: seleção de uma única opção em conjunto mutuamente exclusivo. Use para 2–7 opções com seleção única. Para on/off, usar `Switch`; para confirmação de uma opção, usar `Checkbox`.

**API e exemplos**: `src/components/ui/radio-group.tsx` + stories + `RadioGroupDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes**:
```
RadioGroup (aria-label / value / onValueChange)
└── RadioGroupItem (value, id) + Label (htmlFor)
```

**Regras**:
- `RadioGroupItem` sempre com `Label` associado via `htmlFor` + `id`.
- **Não pré-selecionar** por padrão — apenas quando existe um default genuíno de negócio. Pré-seleção forçada cria erros silenciosos.
- 4+ opções: orientação vertical (padrão).
- 2–3 opções curtas: pode ficar na horizontal, num `.nds-cluster` com `data-spacing` folgado.

**Acessibilidade**: aplica `role="radiogroup"` e `role="radio"` automaticamente. Arrow keys navegam entre opções.

**Analytics**: evento `field_change` com `field_name` e `value`.

---

## Select

**Propósito**: seleção de uma opção em lista compacta. Use para 3+ opções fixas. Para 2 opções, usar `RadioGroup`. Para listas com busca ou 10+ itens, usar **Combobox** — o `Select` não tem busca nativa.

**API e exemplos**: `src/components/ui/select.tsx` + stories + `SelectDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes**:
```
Select
├── SelectTrigger
│   └── SelectValue       (placeholder ou valor selecionado)
└── SelectContent
    ├── SelectGroup       (agrupamento opcional)
    │   ├── SelectLabel
    │   └── SelectItem
    └── SelectItem
```

**Regras**:
- Placeholder: "Selecione..." — nunca "-- Escolha --" ou campo vazio.
- Opções consistentes entre si — não misturar siglas com nomes completos.
- Para 10+ opções com busca: usar **Combobox** em vez de Select.

**Acessibilidade**: aplica `role="combobox"` no trigger e `role="listbox"` + `role="option"` no conteúdo. Arrow keys navegam entre opções.

**Analytics**: evento `option_select` com `field_name`, `value` e `label`.

---

## Combobox

**Propósito**: campo de texto que filtra uma lista e devolve a opção escolhida. No modo múltiplo, os escolhidos viram chips dentro do próprio campo. É componente próprio — primitivo, stories e docs page —, não uma composição montada a partir de outras peças.

**Quando usar em vez do Select**: lista com busca, 10+ itens, rótulos longos ou parecidos entre si, escolha múltipla que precisa ficar visível dentro do campo. Lista curta e fechada continua sendo `Select`; duas opções continuam sendo `RadioGroup`.

**API e exemplos**: `src/components/ui/combobox.tsx` + stories + `ComboboxDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura de subcomponentes** (o `data-slot` ao lado é o contrato compartilhado):

```
Combobox                            combobox
├── ComboboxLabel                   combobox-label
├── ComboboxInputWrapper            combobox-input-wrapper   ← a caixa que parece o campo
│   │                                                         data-chips="wrap | single-line"
│   ├── ComboboxChips               combobox-chips           ← a caixa que cresce (só no modo múltiplo)
│   │   ├── ComboboxChip            combobox-chip
│   │   │   ├── ComboboxChipText    combobox-chip-text
│   │   │   └── ComboboxChipRemove  combobox-chip-remove
│   │   └── ComboboxInput           combobox-input           role="combobox"
│   ├── ComboboxClear               combobox-clear
│   └── ComboboxTrigger             combobox-trigger
│       └── (chevron)               combobox-icon
└── ComboboxContent                 combobox-positioner > combobox-popup
    ├── (lista)                     combobox-list            role="listbox"
    │   ├── ComboboxGroup           combobox-group
    │   │   ├── ComboboxGroupLabel  combobox-group-label
    │   │   └── ComboboxItem        combobox-item            role="option"
    │   │       ├── (texto)         combobox-item-text
    │   │       └── (marca)         combobox-item-indicator
    │   └── ComboboxSeparator       combobox-separator
    └── (mensagem de vazio)         combobox-empty
```

`ComboboxContent` é uma peça só e monta posicionador, popup, lista e estado vazio de uma vez: as três primeiras nunca aparecem separadas, e o vazio precisa sair IRMÃO da lista, porque região viva não é filha permitida de `role="listbox"`.

O campo de texto mora DENTRO de `ComboboxChips`, e não ao lado dela. É o que mantém o texto fluindo depois do último chip e, ao mesmo tempo, deixa limpar e gatilho fora do que quebra ou rola: só a caixa dos chips cresce, e os dois botões ficam sempre na primeira linha. No modo simples a caixa de chips não é montada, e aí `ComboboxInput` é filho direto de `ComboboxInputWrapper` — as duas formas são válidas.

**Modo múltiplo**: `multiple` troca o valor exibido por chips dentro da própria caixa. Cada chip traz o rótulo do escolhido e um botão de remover. Backspace com o texto vazio remove o último chip.

**Como os chips ocupam o campo**: `chipsLayout` na raiz escolhe entre as duas formas, e a escolha chega à caixa do campo como `data-chips`.

| Valor | Desenho | Quando |
|---|---|---|
| `wrap` (padrão) | Os chips acumulam linhas e o campo cresce em altura | Padrão porque nada fica escondido: quando os chips enchem, quem quebra mostra tudo de uma vez |
| `single-line` | Os chips ficam numa linha só e o conjunto rola na horizontal | Formulário denso, onde um campo que cresce empurra o resto da tela |

Nos dois casos os botões de limpar e de abrir a lista ficam na primeira linha — foi o defeito que originou a prop, e ele não volta escolhendo `wrap`.

**Props da raiz**:

| Prop | Tipo | Padrão | Função |
|---|---|---|---|
| `items` | `ComboboxOption[] \| ComboboxOptionGroup[]` | — | **Obrigatória**. Opções, planas ou agrupadas |
| `value` | `ComboboxOption \| ComboboxOption[] \| null` | — | Escolha controlada; lista no modo múltiplo |
| `defaultValue` | `ComboboxOption \| ComboboxOption[] \| null` | — | Escolha inicial quando o campo administra o próprio estado |
| `onValueChange` | `(value: ComboboxValue) => void` | — | Muda a escolha; dispara também ao remover chip e ao limpar |
| `inputValue` | `string` | — | Texto de busca controlado |
| `onInputValueChange` | `(inputValue: string) => void` | — | Muda o texto digitado; é o gancho para buscar opções no servidor |
| `multiple` | `boolean` | `false` | Escolhidos viram chips dentro do campo |
| `chipsLayout` | `"wrap" \| "single-line"` | `"wrap"` | Chips em várias linhas ou numa linha só que rola; chega à caixa do campo como `data-chips` |
| `filter` | `((item: ComboboxOption, query: string) => boolean) \| null` | rótulo sem acento e sem caixa | Substitui o filtro; `null` desliga a filtragem interna |
| `autoHighlight` | `boolean` | `true` | Destaca a primeira opção que casa — é o que faz o Enter escolher sem uma seta antes |
| `limit` | `number` | — | Máximo de opções exibidas na lista |
| `disabled` · `readOnly` · `required` | `boolean` | `false` | Estados do campo |
| `name` | `string` | — | Nome do campo no formulário |
| `id` | `string` | gerado | `id` do campo de texto, compartilhado com o rótulo |
| `open` · `defaultOpen` · `onOpenChange` | `boolean` / callback | — | Abertura da lista |
| `removedAnnouncement` | `(label: string) => string` | "<rótulo> removido" | Frase que a região viva lê ao remover um chip |

**Props das peças**:

| Peça | Prop | Função |
|---|---|---|
| `ComboboxInput` | `placeholder` | Dica exibida enquanto nada foi digitado |
| `ComboboxContent` | `emptyMessage` | **Obrigatória**. Texto quando o filtro não casa com nada |
| `ComboboxContent` | `listLabel` | Nome da lista para leitor de tela, quando não há rótulo visível |
| `ComboboxContent` | `side` · `sideOffset` · `align` | Posicionamento (`bottom` · `4` · `start`) |
| `ComboboxChip` | `value` | Qual escolhido este chip representa |
| `ComboboxChipRemove` | `aria-label` | Nome próprio do botão: "Remover Brasil" |
| `ComboboxClear` · `ComboboxTrigger` | `aria-label` | Nome acessível do botão de limpar e do de abrir a lista |
| `ComboboxItem` | `value` · `disabled` | Opção da lista |

**Regras**:
- `ComboboxLabel` sempre presente. Sem rótulo visível, o nome vem de `aria-label` no campo de texto E de `listLabel` no conteúdo: o papel de combobox não tira nome do próprio conteúdo, e o conteúdo aqui é o texto digitado.
- Os cinco textos de interface — mensagem de vazio, nome do botão de limpar, nome do gatilho, nome do botão de remover e a frase do anúncio de remoção — nascem em português dentro do componente e **têm de ser passados traduzidos** por quem monta a página. Nenhum deles muda de idioma sozinho.
- Botão de remover tem nome PRÓPRIO, um por chip: "Remover Brasil", nunca cinco botões chamados "Remover" — nome repetido em vários controles é o mesmo que nome nenhum (WCAG 4.1.2).
- `emptyMessage` é obrigatório: lista filtrada sem resultado nunca fica em branco.
- Chip é rótulo de opção escolhida, não texto livre. Valor digitado que vira etiqueta é outro componente.
- Com `FormField`, o valor do campo entra em `value` e o `onChange` em `onValueChange` — nunca dois donos do mesmo valor.

**Acessibilidade** (ver `docs/shared/guidelines/01-acessibilidade.md`):
- `role="combobox"` vai no INPUT, não num wrapper nem num botão — é o padrão ARIA 1.2.
- O foco NUNCA sai do campo de texto: a opção ativa é apontada por `aria-activedescendant` e realçada por `[data-highlighted]`. Mover o foco para a opção quebraria a digitação, que é o ponto do componente.
- `aria-expanded` acompanha a lista aberta ou fechada; `aria-autocomplete="list"` declara que digitar filtra; `aria-selected="true"` na opção escolhida; `aria-invalid="true"` quando a validação reprova.
- Remover um chip não move o foco nem muda o texto do campo: quem anuncia é uma região viva `role="status"`, montada o tempo todo e fora da caixa do campo.
- Teclado: digitar filtra e abre a lista; ↓ e ↑ andam pelas opções e dão a volta; Enter escolhe a ativa; Escape fecha; Tab fecha e sai do campo; Backspace com o texto vazio remove o último chip; Home e End movem o cursor DENTRO do texto digitado, que é o que a APG manda para combobox editável.
- O gatilho fica fora da ordem de tabulação: quem tem foco é o campo, e o Tab tem de sair dele em vez de parar num segundo alvo que faz o que a seta já faz.

**Divergências de API registradas** (divergência de framework se anota, não se alinha):
- O campo escondido do formulário é emitido pelo primitivo como irmão da raiz, sem `data-slot="combobox-hidden-input"`; no modo múltiplo é um campo por escolhido, e é isso que faz o envio carregar a lista inteira.
- Escape com a lista já fechada limpa o texto E a escolha, não só o texto.
- O popup é portalizado para o corpo do documento: em teste, ele não está no canvas.

**Analytics**: evento `option_select` com `{ component: "combobox", field_name, value, label, location }` ao escolher uma opção; `field_change` com `{ component: "combobox", field_name, value, location }` ao remover um chip ou limpar o campo.

---

## Slider

**Propósito**: seleção de valor numérico dentro de um intervalo contínuo.

**API e exemplos**: `src/components/ui/slider.tsx` + stories + `SliderDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Props relevantes**:

| Prop | Função |
|---|---|
| `min` / `max` / `step` | Obrigatórios, definir explicitamente |
| `value` | Array: `[value]` para single thumb, `[min, max]` para range |
| `onValueChange` | Callback contínuo (durante drag) |
| `onValueCommit` | Callback final (ao soltar) — usar para analytics |

**Regras**:
- Sempre exibir o valor atual externamente via estado — o Slider não exibe valor por padrão.
- `aria-live="polite"` no elemento que exibe o valor — anuncia ao leitor de tela.
- Definir `min`, `max` e `step` explicitamente.

**Acessibilidade** (ver `docs/shared/guidelines/01-acessibilidade.md`):
- `aria-label` obrigatório quando não há label visível associado.
- `aria-valuetext` para valores que precisam de contexto ("50 por cento" em vez de "50").
- Arrow keys ajustam em `step`, `Shift+Arrow` em 10× step — comportamento nativo.

**Analytics**: usar `onValueCommit` — dispara ao soltar o thumb, não a cada movimento. Evita dezenas de eventos por interação.

---

## Switch

**Propósito**: toggle on/off para configurações com efeito imediato, sem necessidade de submissão. Para seleção em formulários com submit, usar `Checkbox`. Para opções de formatação visual, usar `Toggle`.

**API e exemplos**: `src/components/ui/switch.tsx` + stories + `SwitchDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Regras**:
- `Switch` sempre com `Label` associado via `htmlFor`.
- Label descreve o estado **ativo**: "Receber notificações" (não "Notificações").
- Efeito imediato ao alternar — não usar dentro de formulários com submit para preferências.

**Acessibilidade**: aplica `role="switch"` e `aria-checked` automaticamente via `data-state`.

**Analytics**: evento `field_change` com `field_name` e `value` (boolean → string).

---

## Textarea

**Propósito**: entrada de texto de múltiplas linhas. Use para textos longos onde se espera 3+ linhas — bio, descrição, mensagem, observações. Para linha única, usar `Input`.

**API e exemplos**: `src/components/ui/textarea.tsx` + stories + `TextareaDocs.tsx` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Controle de resize** (via propriedade CSS `resize` — `.nds-textarea` já usa `resize: vertical` por padrão):

| Valor | Uso |
|---|---|
| `resize: none` | Modais, layouts fixos |
| `resize: vertical` | Vertical apenas (padrão recomendado) |
| `resize: both` | Livre (evitar — quebra layouts) |

**Regras**:
- `min-height` de ~120px (~3 linhas) como altura mínima padrão.
- Contador de caracteres com `aria-live="polite"` — anuncia ao leitor de tela sem interromper.
- `maxLength` no elemento + validação Zod — defesa em profundidade.

**Acessibilidade**: `aria-invalid` aplicado automaticamente pelo `FormControl` dentro de `FormField`.

---

## Toggle e Toggle Group

**Propósito**: botão de dois estados (ativo/inativo) para opções visuais ou de formatação.

**API e exemplos**: `src/components/ui/toggle.tsx` + `toggle-group.tsx` + stories + `ToggleDocs.tsx` / `ToggleGroupDocs.tsx` (renderizadas na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Critério de decisão**:

| Situação | Componente |
|----------|------------|
| Formatação visual (negrito, itálico, sublinhado) | Toggle |
| Configuração com efeito imediato | Switch |
| Seleção em formulário com submit | Checkbox |

**Estrutura do Toggle Group**:
```
ToggleGroup (type="single" | type="multiple")
└── ToggleGroupItem (value="...", aria-label="...")
```

**Regras**:
- Tamanho `default` obrigatório — salvo instrução específica.
- `type="single"` para seleção exclusiva, `type="multiple"` para múltiplas.
- `aria-label` obrigatório em itens com apenas ícone.

**Acessibilidade**: aplica `aria-pressed` no `Toggle` e `aria-selected` no `ToggleGroupItem`. Arrow keys navegam entre itens do grupo.

**Analytics**: evento `field_change` com `field_name` e `value` (em multiple, join por vírgula).

---

## Form multi-step (integração com Stepper)

Para formulários com múltiplas etapas sequenciais, o `Form` se integra com o `Stepper` (ver `05-navigation-components.md`). A validação por etapa usa `form.trigger(fields)` antes de avançar.

**Regras**:
- `mode: "onChange"` no `useForm` — valida em tempo real conforme o usuário preenche.
- `form.trigger(fieldsByStep[currentStep])` antes de avançar — valida apenas os campos da etapa atual.
- `type="button"` nos botões Anterior e Próximo — evita submit acidental.
- `type="submit"` apenas no botão da última etapa.
- O `<Form>` envolve todo o Stepper — o submit só ocorre na última etapa.

---

## Regras transversais de Form Components

**Estrutura obrigatória por campo**:
```
FormField > FormItem > FormLabel + FormControl + FormDescription + FormMessage
```

**Tokens obrigatórios** (ver `docs/shared/guidelines/04-padroes-design-sistema.md`) — quem os aplica é a folha de cada campo:
- Input, Textarea e Select: `--background` no fundo, `--input` na borda, `--foreground` no texto, `--muted-foreground` no placeholder
- Foco: 2px de `--ring` em `:focus-visible` — nas folhas de campo, pela própria folha; em elementos interativos sem folha própria, pela utilitária `.nds-focus-ring`
- Erro: `--destructive` na borda do campo (via `aria-invalid="true"`) e no texto da mensagem
- Label: `--font-weight-medium`, aplicado por `.nds-label` — não sobrescrever para negrito
- Nenhum campo interativo declara altura: ela sai de `padding-block` mais `line-height`, para o campo crescer com a fonte do navegador (WCAG 1.4.4)

**Acessibilidade transversal** (ver `docs/shared/guidelines/01-acessibilidade.md`):
- `FormControl` aplica `aria-invalid` e `aria-describedby` automaticamente — nunca adicionar manualmente
- `aria-required="true"` em campos obrigatórios
- `aria-live="polite"` em contadores e mensagens dinâmicas
- Nunca rastrear `value` de campos sensíveis (senha, CPF, cartão)

**Analytics transversal** (ver `docs/shared/guidelines/07-analytics.md`):

| Evento | Quando disparar | Componentes |
|--------|----------------|-------------|
| `button_click` | Ao clicar | Button |
| `form_submit` | Após validação bem-sucedida | Form |
| `form_error` | Quando RHF rejeita submit | Form |
| `form_abandon` | Ao sair sem submeter | Form |
| `field_change` | Ao alterar valor de seleção | Checkbox, Switch, Select, RadioGroup, Slider, Toggle |
| `field_focus` | Ao focar | Input, Textarea (funis críticos) |
| `field_error` | Ao exibir erro | Qualquer campo com FormMessage |
| `option_select` | Ao selecionar opção | Select |

**UX Writing transversal** (ver `docs/shared/guidelines/05-tom-de-voz.md`):
- Labels: substantivos, sem dois-pontos, capitalização na primeira palavra
- Placeholders: exemplos reais, nunca instruções
- Mensagens de erro: causa + orientação, sem culpar o usuário
- Botão submit: verbo no infinitivo, máximo 3 palavras
