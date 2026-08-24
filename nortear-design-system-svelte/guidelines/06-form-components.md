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
- Em submit, refletir estado de loading com `disabled` e ícone `Loader2 animate-spin`

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
- Tokens obrigatórios: `bg-input border-input`
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

**Atenção**: Select do Bits UI não possui busca integrada. Para busca: usar **Command (Combobox)** em `10-overlay-components.md`.

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
