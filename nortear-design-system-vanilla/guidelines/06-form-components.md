# Form Components (Nortear — Vanilla TypeScript)

---

## Button

**Propósito**: elemento de ação — dispara submissões, confirmações e ações do usuário. Para navegação, usar `<a>`.

**API e exemplos**: `src/components/ui/button.ts` + stories + `ButtonDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
button
├── icon opcional (lucide SVG, aria-hidden="true")
└── label (texto)
```

**Variantes**:

| Variante | Uso |
|---|---|
| `default` | Ação primária |
| `destructive` | Ação irreversível (delete) |
| `outline` | Ação secundária |
| `secondary` | Ação alternativa |
| `ghost` | Ação terciária / icon-only |
| `link` | Ação textual |

**Tamanhos**: `sm`, `default`, `lg`, `icon`.

**Regras**:
- Padding vertical via `--spacing-*`, nunca altura fixa (ver memória "nunca usar altura fixa em primitivos")
- Icon-only requer `aria-label` descritivo
- Ícone interno: `aria-hidden="true"`, dimensões `h-4 w-4` (ou `h-5 w-5` em `lg`)
- Ação destrutiva: confirmação por Dialog antes da execução
- Gap entre ícone e label em `--spacing-2`

**Acessibilidade**:
- `<button>` semântico (nunca `<div onclick>`)
- `aria-label` obrigatório quando não há texto visível
- Estado `disabled` reflete `aria-disabled` quando necessário

**Analytics**: emitir `button_click` com `{ component, variant, location, label }`.

---

## Input

**Propósito**: campo de texto de linha única.

**API e exemplos**: `src/components/ui/input.ts` + stories + `InputDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
wrapper (space-y-2)
├── label (htmlFor=id)
├── input (id, type, name)
└── p#<id>-error (role="alert", quando há erro)
```

**Opts da factory**:

| Nome | Default | Função |
|---|---|---|
| `id` | — | Obrigatório (link label↔input) |
| `label` | — | Texto do `<label>` |
| `type` | `text` | Tipo HTML do input |
| `placeholder` | — | Exemplo real (não instrução) |
| `required` | `false` | Marca campo obrigatório |
| `errorId` | — | ID do elemento de erro (vincula via `aria-describedby`) |

**Regras**:
- `<label>` sempre associado via `htmlFor`/`id` (nunca placeholder como label)
- Placeholder deve ser exemplo real — `'ex: ana@empresa.com'`, não `'Digite seu e-mail'`
- Padding vertical em `--spacing-1`, horizontal em `--spacing-3`; nunca altura fixa
- Tokens obrigatórios: `bg-input`, `border-input`
- Foco visível: `ring-2 ring-ring ring-offset-2`
- Estado de erro: `aria-invalid="true"` + `aria-describedby` para a mensagem

**Acessibilidade**:
- Label visível e associado
- Erros com `role="alert"` (anunciados imediatamente)
- `aria-required="true"` quando aplicável

---

## Form (HTML nativo + Zod)

**Propósito**: agrupar inputs e validar via Zod. Forms em vanilla TS usam `<form>` nativo + validação manual no submit.

**API e exemplos**: `src/components/ui/form.ts` + stories + `FormDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
form (noValidate, space-y-4)
├── Input fields (cada um com errorId)
├── submit button
└── erros inline (inseridos via showFieldError)
```

**Regras**:
- `form.noValidate = true` — validação é responsabilidade do Zod, não do browser
- Schema Zod com mensagens em português
- No submit: `e.preventDefault()` → limpar erros anteriores → `schema.safeParse()` → exibir erros por campo ou chamar `onSubmit`
- Erros são `<p role="alert" id="${fieldId}-error">` inseridos imediatamente após o input
- Limpar `aria-invalid` e `aria-describedby` ao limpar erros
- Estado de loading durante submit: desabilitar botão + exibir spinner

**Acessibilidade**:
- Cada erro com `role="alert"` (live region)
- `aria-invalid="true"` no campo com erro
- `aria-describedby` apontando ao ID do erro
- Foco no primeiro campo com erro após submit inválido

**Analytics**: emitir `form_submit` com `{ form_id, valid: boolean, error_fields?: string[] }`.

---

## Checkbox

**Propósito**: seleção booleana ou múltipla em listas.

**API e exemplos**: `src/components/ui/checkbox.ts` + stories + `CheckboxDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
button[role=checkbox]   (a raiz que a fábrica devolve; carrega o id)
└── indicador           (marca de seleção, ou traço no estado misto)

label[for=id]           (irmão, fora da raiz — quem monta é quem compõe)
```

**Opts da factory**:

| Nome | Default | Função |
|---|---|---|
| `id` | — | Identificador da raiz; é por ele que o rótulo alcança a caixa |
| `checked` | `false` | Estado inicial |
| `indeterminate` | `false` | Estado misto — só em pai de grupo |
| `disabled` | `false` | Desabilita a interação |
| `onCheckedChange` | — | Callback de mudança do estado marcado |
| `onIndeterminateChange` | — | Callback de resolução do estado misto |
| `aria-label` | — | Nome acessível quando não há rótulo visível |

**Regras**:
- A raiz é um **`<button type="button">`** com `role="checkbox"`, e a escolha do
  elemento é funcional: `label[for]` só alcança controle rotulável do HTML
  (button, input, select, textarea, meter, output, progress). Sobre `<div>` ou
  `<span>` o par rótulo+caixa fica inerte — clicar no texto não foca nem alterna.
- Rótulo sempre associado por `for`/`id`, e **nada de ouvinte de clique no
  rótulo**: reenviar o clique à mão é andaime que esconde a escolha errada de
  elemento.
- Sem `<input type="checkbox">` no DOM: dois elementos interativos aninhados
  quebram `nested-interactive`. Quem precisa de submit nativo escreve o próprio
  campo a partir do callback de mudança.
- Estado misto só em **pai de grupo**; item de folha não é tri-state.
- Tamanho é de ícone, não de texto: não cresce com a fonte, e é por isso que
  ali a dimensão fixa é legítima.
- Grupo de checkboxes: envolver em `<fieldset>` + `<legend>`.

**Acessibilidade**:
- `aria-checked` reflete os três estados, com `mixed` no misto.
- <kbd>Space</kbd> alterna (ativação nativa do botão); <kbd>Enter</kbd> **não**
  alterna, e a fábrica cancela o padrão do botão para garantir isso.
- Desabilitado usa `aria-disabled` e `tabindex="-1"`: sai do Tab, continua
  alcançável para quem navega lendo a tela.
- Clicar no texto do rótulo move o foco para a caixa E alterna o estado — os
  dois eixos, verificados por story, não por presença de atributo.


## Radio Group

**Propósito**: escolha única entre opções visíveis ao mesmo tempo. Quando as
opções não cabem na tela, o componente certo é o Select.

**Stack**: factory `createRadioGroup(opts)` em `src/components/ui/radio-group.ts`.
Renderiza `<fieldset>` com `role="radiogroup"` e `<input type="radio">` nativos —
o agrupamento por `name` e a navegação por setas são do navegador.

**Estrutura**:

```
fieldset[data-slot="radio-group"]      (role="radiogroup")
├── legend                             (quando há rótulo visível)
└── div[data-slot="radio-group-item"]
    ├── input[type="radio"]
    └── label
```

**Opções**:

| Opção | Tipo | Função |
|---|---|---|
| `name` | `string` | **Obrigatório.** É o que agrupa os botões para o navegador |
| `items` | `RadioGroupItem[]` | `{ value, label, disabled? }` |
| `defaultValue` | `string` | Opção marcada na montagem |
| `legend` | `string` | Rótulo VISÍVEL do grupo. Preferido — ver Acessibilidade |
| `aria-label` | `string` | Nome do grupo sem rótulo visível. Alternativa a `legend` |
| `disabled` | `boolean` | Desabilita o grupo inteiro |
| `orientation` | `'horizontal' \| 'vertical'` | Eixo do arranjo. Escreve `aria-orientation`, que a folha lê |

**Regras**:
- `name` único por grupo na página. Dois grupos com o mesmo `name` viram um só
  para o navegador, e marcar num desmarca no outro.
- Escolha única SEMPRE tem uma opção marcada por padrão, salvo quando "nenhuma"
  for resposta legítima — e aí "nenhuma" é uma opção da lista, não a ausência delas.
- `orientation` é o caminho para o arranjo em linha. Cravar o layout por fora
  produz um grupo que PARECE horizontal e é anunciado como vertical.

**Acessibilidade**:
- **`legend` é preferido a `aria-label`**: um grupo visível sem rótulo visível
  falha WCAG 3.3.2 mesmo com o nome acessível correto. `aria-label` serve quando
  o rótulo já está na página por outro caminho.
- Como o `role` sobrescreve o do `<fieldset>`, o nome vai por `aria-labelledby`
  apontando para a `legend` — a associação implícita entre `fieldset` e `legend`
  não sobrevive ao role trocado.
- Navegação por setas dentro do grupo e uma única parada de Tab: é o
  comportamento nativo do rádio, e é por isso que a fábrica não o reimplementa.


## Toggle · Toggle Group

**Propósito**: botão de dois estados (Toggle) e conjunto deles com escolha única
ou múltipla (Toggle Group). Diferente do Checkbox: aqui o efeito é imediato sobre
algo visível, não uma resposta a ser enviada depois.

**Stack**: factories `createToggle(opts)` e `createToggleGroup(opts)` em
`src/components/ui/toggle.ts` e `toggle-group.ts`. Um `<button>` com
`aria-pressed`, sem lib.

**Estrutura**:

```
div[data-slot="toggle-group"]          (role="toolbar", aria-orientation)
├── button[data-slot="toggle"]         (aria-pressed)
└── button[data-slot="toggle"]
```

**Opções do Toggle**:

| Opção | Tipo | Função |
|---|---|---|
| `pressed` | `boolean` | Estado inicial |
| `variant` · `size` | — | Aparência |
| `disabled` | `boolean` | Desabilita |
| `onClick` | `(pressed) => void` | Recebe o estado JÁ alternado |
| `children` | `ToggleChild \| ToggleChild[]` | Ícone, texto, ou os dois lado a lado |
| `aria-label` | `string` | **Obrigatório no botão só de ícone** |

**Opções do Toggle Group**:

| Opção | Tipo | Função |
|---|---|---|
| `items` | `ToggleGroupItem[]` | `{ value, label?, children?, disabled?, 'aria-label'? }` |
| `type` | `'single' \| 'multiple'` | Escolha única ou múltipla |
| `defaultValue` | `string \| string[]` | Selecionado na montagem |
| `orientation` | `ToggleGroupOrientation` | Eixo do arranjo |
| `spacing` | `number` | Espaço entre itens, em degraus da escala |
| `onValueChange` | `(value) => void` | Muda a seleção |
| `aria-label` | `string` | Nome do grupo |

**Regras**:
- Use Toggle quando o efeito é imediato e reversível. Se a mudança só vale depois
  de um "Salvar", o componente é Checkbox ou Switch.
- `children` aceita lista porque o caso com rótulo é ícone MAIS texto lado a lado,
  e os dois precisam ser filhos DIRETOS: o espaço entre eles vem do `gap` do
  próprio `.nds-toggle`, e a medida do ícone da regra `.nds-toggle > svg`.
  Embrulhar os dois num `<span>` desliga os dois efeitos.
- `type: 'single'` não força uma opção marcada. Se o estado "nenhuma" não fizer
  sentido no seu caso, garanta `defaultValue`.

**Acessibilidade**:
- `aria-pressed` no botão, e não `aria-checked`: pressionado é estado de botão;
  marcado é de caixa de seleção, e o leitor de tela anuncia papéis diferentes.
- **Item só de ícone exige nome**, no grupo e fora dele. É o caso mais comum
  (alinhamento, formatação, modo de visualização), e é o que a opção
  `aria-label` do item resolve — nomear percorrendo o DOM depois de construir
  depende da ordem e some numa refatoração.
- O grupo é `role="toolbar"` com `aria-orientation`, e carrega nome próprio: um
  grupo anônimo entre outros controles não diz o que reúne.
