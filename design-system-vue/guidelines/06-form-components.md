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

> **Padrão composto** — não é um componente isolado. É a combinação de `Command + Popover` para criar um Select com busca integrada. A implementação completa está em `10-overlay-components.md` → "Command — Combobox".

**Quando usar em vez do Select**:
- Listas com 10+ itens onde busca por texto facilita a seleção
- Itens com nomes longos ou similares
- Seleção com confirmação visual do item escolhido (checkmark)

**Integração com FormField**: passar `field.value` como `value` selecionado e `field.onChange` como callback de seleção. Detalhes no arquivo 10.

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

**Classes de resize** (via Tailwind):

| Classe | Uso |
|--------|-----|
| `resize-none` | sem redimensionamento (modais, layouts fixos) |
| `resize-y` | vertical apenas (padrão recomendado) |
| `resize` | livre (evitar — quebra layouts) |

**Regras**:
- `min-h-[120px]` como altura mínima padrão (~3 linhas)
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
