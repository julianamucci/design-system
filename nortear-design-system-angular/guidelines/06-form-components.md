# Form Components (Nortear — Angular)

> **Não há biblioteca de validação de schema neste stack.** As guidelines de React, Vue e Vanilla descrevem validação por schema ou por biblioteca de formulário. Aqui a validação é `@angular/forms`: o campo lê o `NgControl` projetado dentro dele e deriva o estado inválido. A seção **Form** descreve esse caminho.

---

## Button

**Propósito**: disparar ação — submissão, confirmação, comando. Para navegação, o elemento é `<a>`.

**Componente**: `button[ndsButton], a[ndsButton]` — o host é o elemento nativo, então o markup fica idêntico ao das outras stacks.

**Estrutura**:

```
button|a[ndsButton]
├── svg[ndsButtonIcon]     (opcional, decorativo)
└── rótulo (texto)
```

**Variantes**:

| Variante | Uso |
|---|---|
| `default` | Ação primária |
| `destructive` | Ação irreversível |
| `outline` | Ação secundária |
| `secondary` | Ação alternativa |
| `ghost` | Ação terciária, botão só de ícone |
| `link` | Ação textual |

**Tamanhos**: `default`, `xs`, `sm`, `lg`, e os quadrados `icon`, `icon-xs`, `icon-sm`, `icon-lg`.

**Entradas**:

| Peça | Nome | Default | Função |
|---|---|---|---|
| `ndsButton` | `variant` | `default` | Variante visual |
| `ndsButton` | `size` | `default` | Tamanho; `icon-*` são quadrados |
| `ndsButtonIcon` | `kind` | obrigatório | Ícone do conjunto do design system |
| `ndsButtonIcon` | `size` | `md` | Tamanho do glifo |
| `ndsButtonIcon` | `spin` | `false` | Gira o ícone (carregando) |

`disabled` e `type` vêm do primitivo headless aplicado ao host, e não são inputs declarados aqui.

**Regras**:
- Espaçamento entre botões: **mínimo `--spacing-4`** (16px), ou seja `data-spacing="md"` no cluster que os agrupa. Abaixo disso o par lê como um controle segmentado, e a área de erro entre dois alvos adjacentes encolhe. Vale para par de ações, fileira de variantes e barra de ferramentas.
  - **Exceção — botão `sm` e botão de ícone**: quando TODOS os botões do cluster são `size="sm"` ou da família de ícone (`icon`, `icon-sm`, `icon-lg`, `icon-xs`), o piso cai para `--spacing-2` (8px). Como 8px é o padrão do `.nds-cluster`, aí o `data-spacing` também pode ser omitido; só `xs` (4px) continua apertado demais.
    - O botão `sm` está em superfície compacta — rodapé de popover, de tooltip, de hover-card — onde 16px entre dois alvos pequenos é mais do que a superfície comporta.
    - O botão de **ícone** é outro caso: quadrado e sem texto, uma fileira deles é uma **barra de ferramentas**, não um par de ações. Ali a proximidade é o que comunica que os comandos pertencem ao mesmo conjunto — e isso vale mesmo no tamanho padrão de ícone, não só nos reduzidos.
  - Cluster que MISTURA tamanhos cai na regra estrita: o alvo maior é quem define a distância confortável.
  - Grupo emendado (`.nds-button-group`) é o caso oposto e continua sem gap, de propósito.
  - Portão: `button_gap_apertado` no `audit.mjs`.
- Altura **nunca** é cravada: nasce de `padding-block` mais tipografia
- Tamanho `icon-*` exige nome acessível — sem texto visível, sem `aria-label` não há botão
- Ícone interno é decorativo
- Ação destrutiva pede confirmação por AlertDialog antes de executar
- `<a ndsButton>` mantém a **semântica de link**: aparência do design system, papel do elemento escolhido. O primitivo headless marcaria papel de botão em host não nativo, o que faria o leitor anunciar "botão" para algo que navega e quebraria o Ctrl+clique — por isso o papel é devolvido no `<a>`
- Ícone em SVG usa `[attr.class]` porque `className` em SVG não aceita binding de classe. É a única exceção à regra de não criar input de classe

**Acessibilidade**:
- Elemento nativo, nunca `<div>` com handler
- Estado desabilitado tem de barrar a ação, não só apagar a cor
- Botão só de ícone precisa de alvo de toque no piso do token de tamanho

**Analytics**: `button_click` com `{ component, variant, location, label }`.

---

## Label

**Propósito**: rotular um controle de formulário.

**Diretiva**: `label[ndsLabel]`. Sem inputs — o `for` é atributo nativo.

**Regras**:
- Sempre associado ao controle por `for`/`id`. Placeholder **não** é label
- Peso do texto vem do token do design system; não engrossar por caso
- Altura não é cravada — o label cresce com a fonte

---

## Input · Textarea

**Propósito**: campo de texto de uma linha (`input[ndsInput]`) e de várias (`textarea[ndsTextarea]`).

**Diretivas sem input próprio**: tipo, nome, `placeholder`, `required`, `disabled`, `readonly`, `aria-invalid` e `aria-describedby` são atributos nativos do elemento. A diretiva aplica classe e `data-slot`.

**Estrutura** (dentro de um campo):

```
div[ndsFormField]
├── label[ndsFormLabel]
├── input[ndsInput] | textarea[ndsTextarea]
├── p[ndsFormDescription]      (opcional)
└── p[ndsFormMessage]          (quando há erro)
```

**Regras**:
- Placeholder é **exemplo real**, não instrução
- Padding horizontal e vertical pelos tokens; altura não cravada
- Estado inválido é `aria-invalid` mais a mensagem vinculada — cor sozinha não comunica
- Textarea cresce por linhas, não por altura fixa

---

## Input Group

**Propósito**: compor um campo com adornos — ícone, prefixo, sufixo, botão — como uma peça só.

**Peças**: `div[ndsInputGroup]`, `div|span[ndsInputGroupAddon]`, `input[ndsInputGroupInput]`, `textarea[ndsInputGroupTextarea]`, `span[ndsInputGroupText]`, `button[ndsInputGroupButton]`.

**Estrutura**:

```
div[ndsInputGroup]
├── div[ndsInputGroupAddon]         (align: onde o adorno encosta)
│   └── span[ndsInputGroupText] | svg
├── input[ndsInputGroupInput]
└── div[ndsInputGroupAddon]
    └── button[ndsInputGroupButton]
```

**Entradas**:

| Peça | Nome | Default | Função |
|---|---|---|---|
| `ndsInputGroupAddon` | `align` | `inline-start` | `inline-start`, `inline-end`, `block-start`, `block-end` |
| `ndsInputGroupButton` | `size` | `xs` | Tamanho do botão embutido |

**Regras**:
- O grupo é que desenha borda e foco; o campo interno não repete a moldura
- Adorno textual é decorativo. Adorno que **age** é botão, com nome acessível
- **`ndsInput` e `ndsInputGroupInput` no mesmo elemento é caso conhecido de disputa de `data-slot`.** A saída aqui foi o `ndsInputGroupInput` trazer a classe base junto, dispensando a outra diretiva. Ver `RULES.md` §8
- O grupo é o alvo do `aria-describedby` do campo, para que descrição e erro cheguem ao controle certo

---

## Input OTP

**Propósito**: entrada de código de verificação, um dígito por casa.

**Componente**: `nds-input-otp`.

**Estrutura**:

```
nds-input-otp
├── casa de dígito × maxLength     (uma por caractere)
└── separador                      (nas posições declaradas)
```

**Entradas**:

| Nome | Default | Função |
|---|---|---|
| `maxLength` | `6` | Número de casas |
| `value` | `''` | Valor de duas vias |
| `mode` | `numeric` | `numeric` ou `alphanumeric` |
| `disabled` / `invalid` | `false` | Estado |
| `describedBy` | — | Id do texto de apoio |
| `autoFocus` | `false` | Foca a primeira casa ao montar |
| `autocomplete` | `one-time-code` | Preenchimento do navegador |
| `separatorAt` | `[]` | Posições que recebem separador |
| `separatorChar` | `—` | Glifo do separador |
| `ariaLabel` | rótulo padrão | Nome acessível do conjunto |
| `digitLabel` | rótulo padrão | Prefixo do nome de cada casa |

**Saída**: código completo, emitido quando a última casa é preenchida.

**Regras**:
- `autocomplete="one-time-code"` é o default e não deve ser removido: é o que faz o teclado do celular oferecer o código do SMS
- Colar preenche todas as casas de uma vez; apagar volta para a casa anterior
- `separatorAt` é decoração de leitura e não muda o valor

**Acessibilidade**:
- Cada casa tem nome acessível com a posição — dez casas com o mesmo nome equivalem a nome nenhum (WCAG 4.1.2)
- O conjunto tem nome próprio, para o leitor anunciar o que está sendo digitado
- Estado inválido anunciado, não só colorido

---

## Checkbox

**Propósito**: escolha booleana, ou seleção múltipla em lista.

**Componente**: `button[ndsCheckbox]`. É `<button>` porque o primitivo headless precisa de estado tri-state e de indicador desenhado; um `<input type="checkbox">` nativo participa do formulário por um campo escondido que o próprio primitivo mantém.

**Estrutura**:

```
button[ndsCheckbox]     (role de checkbox, aria-checked incluindo "mixed")
└── indicador (marca ou traço de indeterminado)
```

**Entradas** (do primitivo, expostas no host): estado marcado, indeterminado, desabilitado, obrigatório, inválido, nome e valor. Saídas: mudança de marcado e de indeterminado.

**Regras**:
- Label sempre associado e clicável
- Indeterminado só faz sentido em **pai de grupo**; item de folha não é tri-state
- Tamanho é de ícone, não de texto: não cresce com a fonte, e é por isso que ali a dimensão fixa é legítima
- Grupo de checkboxes vai dentro de `fieldset[ndsFieldset]` com `legend[ndsFieldsetLegend]`

**Acessibilidade**:
- `aria-checked` reflete os três estados
- Em lista, cada controle carrega o identificador da linha no nome

---

## Radio Group

**Propósito**: escolha única e exclusiva entre poucas opções visíveis. Para muitas opções, Select.

**Peças**: `fieldset|div[ndsRadioGroup]`, `button[ndsRadioGroupItem]`.

**Estrutura**:

```
fieldset[ndsRadioGroup]           (role="radiogroup")
├── legend                        (rótulo do grupo)
├── button[ndsRadioGroupItem]     (role="radio")
└── button[ndsRadioGroupItem]
```

**Entradas**: valor, nome, obrigatório, desabilitado, somente leitura e orientação vêm do primitivo no host do grupo; valor e estado por item.

**Regras**:
- `fieldset` com `legend` é a forma preferida: o grupo precisa de rótulo, e `legend` é o mecanismo nativo
- Setas navegam **dentro** do grupo e o Tab entra e sai dele como uma parada só
- Um item marcado por padrão, salvo quando "nenhum" é resposta válida

---

## Switch

**Propósito**: ligar e desligar algo com efeito **imediato**. Se a mudança só vale depois de salvar, o controle é Checkbox.

**Componente**: `button[ndsSwitch]`.

**Entradas**:

| Nome | Default | Função |
|---|---|---|
| `size` | `default` | `default` ou `sm` |

Estado marcado, desabilitado, nome e valor vêm do primitivo no host.

**Regras**:
- Rótulo diz o que a chave controla, não o estado dela ("Notificações", não "Ativado")
- Sem estado indeterminado
- Efeito imediato significa: sem botão de confirmar ao lado

---

## Slider

**Propósito**: escolher número numa faixa contínua, quando a grandeza importa mais que o valor exato.

**Componente**: `div[ndsSlider]`.

**Estrutura**:

```
div[ndsSlider]
├── trilho
├── preenchimento
└── alça × n         (uma por valor; duas formam intervalo)
```

**Entradas**:

| Nome | Default | Função |
|---|---|---|
| `value` | `[]` | Valores, de duas vias. **Sempre array** |
| `aria-label` | — | Nome acessível de alça única |
| `thumbLabels` | `[]` | Nome acessível por alça, em intervalo |

**Regras**:
- O valor é **array mesmo com uma alça**. É o comprimento do array que decide se é valor único ou intervalo — passar um número onde se espera array produz um intervalo de largura zero, sem erro nenhum, com a alça no lugar certo disfarçando
- Em intervalo, cada alça precisa do nome próprio: duas alças com o mesmo nome não dizem qual é o mínimo
- Passo e limites vêm do primitivo; não recriar clamp no consumidor
- Para valor exato, o controle é campo numérico, não slider

**Acessibilidade**:
- Setas movem por passo, Home e End vão aos extremos
- Valor atual anunciado em texto, não só pela posição da alça
- **Cuidado ao compor**: `hostDirectives` restringe o que a diretiva listada expõe, mas **não** alcança o que as host directives dela expõem — essas continuam ligáveis no elemento. Foi assim que um valor escrito no elemento chegou ao acessor de valor interno sem estar na lista. Ver `13-system-design.md`

---

## Select

**Propósito**: escolher um valor de uma lista fechada. Para busca dentro da lista, o componente é o Combobox. Para escolha múltipla, o conteúdo compartilhado manda usar grupo de checkbox.

**Peças**: `nds-select`, `button[ndsSelectTrigger]`, `span[ndsSelectValue]`, `ng-template[ndsSelectContent]`, `div[ndsSelectItem]`, `div[ndsSelectGroup]`, `div[ndsSelectLabel]`, `div[ndsSelectSeparator]`, `svg[ndsSelectIcon]`.

**Estrutura**:

```
nds-select
├── button[ndsSelectTrigger]              (aria-expanded, aria-haspopup)
│   ├── span[ndsSelectValue]
│   └── svg[ndsSelectIcon]
└── ng-template[ndsSelectContent]         ← lista portalizada
    ├── div[ndsSelectGroup]
    │   ├── div[ndsSelectLabel]
    │   └── div[ndsSelectItem]            (role="option")
    └── div[ndsSelectSeparator]
```

**Entradas**:

| Peça | Nome | Default | Função |
|---|---|---|---|
| `ndsSelectContent` | `side`, `align`, `sideOffset`, `alignOffset` | `bottom` / `start` / `4` / `0` | Posicionamento |
| `ndsSelectTrigger` | `size` | `default` | `default` ou `sm` |

Valor, aberto, desabilitado, obrigatório, inválido, nome, formulário e a função de rótulo do valor vêm do primitivo no host do `nds-select`.

**Regras**:
- Quando valor e rótulo diferem, a função de rótulo é obrigatória — sem ela o gatilho mostra o valor cru no primeiro quadro
- **Escolha múltipla não é exposta** neste componente, de propósito: expor a chave sem indicador visual de vários escolhidos criaria superfície morta
- A lista é portalizada: em teste, ela não está no canvas, e sim no corpo do documento
- Lista longa pede busca — e busca dentro de Select não existe; o componente é o Combobox

**Acessibilidade**:
- Gatilho é `<button>` com estado de expansão
- Setas navegam, digitar salta para a opção pela primeira letra, Escape fecha e devolve o foco
- Opção escolhida anunciada como selecionada, não só marcada com ícone

---

## Combobox

**Propósito**: campo de texto que filtra uma lista e devolve a opção escolhida. No modo múltiplo, os escolhidos viram chips dentro do próprio campo.

**Quando usar em vez do Select**: lista com busca, 10+ itens, rótulos longos ou parecidos entre si, escolha múltipla que precisa ficar visível dentro do campo. Lista curta e fechada continua sendo Select.

**Peças**: `nds-combobox`, `label[ndsComboboxLabel]`, `div[ndsComboboxInputWrapper]`, `div[ndsComboboxChips]`, `span[ndsComboboxChip]`, `button[ndsComboboxChipRemove]`, `input[ndsComboboxInput]`, `button[ndsComboboxClear]`, `button[ndsComboboxTrigger]`, `svg[ndsComboboxIcon]`, `ng-template[ndsComboboxPopup]`, `div[ndsComboboxList]`, `div[ndsComboboxItem]`, `span[ndsComboboxItemIndicator]`, `div[ndsComboboxGroup]`, `div[ndsComboboxGroupLabel]`, `div[ndsComboboxSeparator]`, `div[ndsComboboxEmpty]`. A constante `NDS_COMBOBOX` reúne a família inteira para o `imports` de quem compõe.

**Estrutura** (o `data-slot` ao lado é o contrato compartilhado):

```
nds-combobox                             combobox
├── label[ndsComboboxLabel]              combobox-label
├── div[ndsComboboxInputWrapper]         combobox-input-wrapper  ← a caixa que parece o campo
│   ├── div[ndsComboboxChips]            combobox-chips
│   │   └── span[ndsComboboxChip]        combobox-chip
│   │       ├── (texto projetado)        combobox-chip-text
│   │       └── button[ndsComboboxChipRemove]  combobox-chip-remove
│   ├── input[ndsComboboxInput]          combobox-input          role="combobox"
│   ├── button[ndsComboboxClear]         combobox-clear
│   └── button[ndsComboboxTrigger]       combobox-trigger
│       └── svg[ndsComboboxIcon]         combobox-icon
└── ng-template[ndsComboboxPopup]        ← miolo, instanciado dentro do popup
    ├── div[ndsComboboxList]             combobox-list           role="listbox"
    │   ├── div[ndsComboboxGroup]        combobox-group          role="group"
    │   │   ├── div[ndsComboboxGroupLabel]     combobox-group-label
    │   │   └── div[ndsComboboxItem]     combobox-item           role="option"
    │   │       ├── (texto projetado)    combobox-item-text
    │   │       └── span[ndsComboboxItemIndicator]  combobox-item-indicator
    │   └── div[ndsComboboxSeparator]    combobox-separator      aria-hidden
    └── div[ndsComboboxEmpty]            combobox-empty
```

O posicionador e o popup (`combobox-positioner` e `combobox-popup`) são montados pela própria raiz, em volta do miolo. O miolo é `<ng-template>` porque ele é instanciado DENTRO do popup a cada abertura: se viesse como elemento projetado, fechar removeria os nós sem destruir as diretivas — e é o desmonte que desregistra as opções do motor de filtragem.

**Modo múltiplo**: `multiple` troca o valor exibido por chips dentro da própria caixa. Cada chip traz o rótulo do escolhido e um botão de remover. Os chips quebram linha junto com o campo de texto. Backspace com o texto vazio remove o último chip, e as setas horizontais entram na fila de chips.

**Entradas da raiz** — chegam por diretiva de host do primitivo, e por isso valem no elemento `nds-combobox`:

| Nome | Tipo | Padrão | Função |
|---|---|---|---|
| `value` | `model<string \| string[]>` | — | Escolha atual, de duas vias; lista no modo múltiplo |
| `defaultValue` | `string \| string[]` | — | Escolha inicial quando o campo administra o próprio estado |
| `valueChange` | `output<string \| string[]>` | — | Muda a escolha; dispara também ao remover chip e ao limpar |
| `inputValue` | `model<string>` | `''` | Texto de busca, de duas vias |
| `inputValueChange` | `output<string>` | — | Muda o texto digitado; é o gancho para buscar opções no servidor |
| `open` · `defaultOpen` · `openChange` | — | — | Abertura da lista |
| `multiple` | `boolean` | `false` | Escolhidos viram chips dentro do campo |
| `filter` | `(value, query, itemToString) => boolean` | — | Substitui o filtro. A assinatura é a do primitivo, de três argumentos: o terceiro converte a opção em texto |
| `locale` | `string` | — | Idioma da comparação do filtro padrão |
| `limit` | `number` | — | Máximo de opções exibidas |
| `disabled` · `readOnly` · `required` | `boolean` | `false` | Estados do campo |
| `invalid` | `boolean` | `false` | Marca o campo como inválido |
| `name` · `form` | `string` | — | Campo no formulário |
| `loopFocus` | `boolean` | — | Da última opção a seta volta à primeira |
| `highlightItemOnHover` | `boolean` | — | A opção sob o ponteiro vira a opção ativa |
| `openOnInputClick` | `boolean` | — | Clicar no campo abre a lista |
| `itemToStringLabel` · `isItemEqualToValue` | função | — | Como a opção vira texto e como duas opções se comparam |
| `removedLabel` | `string` | `removido` | Sufixo do anúncio de remoção: "<rótulo do chip> <sufixo>" |

`items` não existe: as opções são escritas no template, uma `div[ndsComboboxItem]` por opção, e o motor de filtragem as registra ao montarem.

**Entradas das peças**:

| Peça | Nome | Padrão | Função |
|---|---|---|---|
| `ndsComboboxPopup` | `side` · `align` · `sideOffset` · `alignOffset` | `bottom` / `start` / `4` / `0` | Posicionamento |
| `ndsComboboxInput` | `id` · `invalid` | — | Identificador do campo e marca de inválido |
| `ndsComboboxItem` | `value` · `textValue` · `disabled` | — | Opção da lista |
| `ndsComboboxChip` | `value` | — | Qual escolhido este chip representa |
| `ndsComboboxClear` | `disabled` | — | Desliga o botão de limpar |

**Regras**:
- A primeira opção visível fica destacada sempre que a lista filtra — é regra da raiz, não opção que se possa desligar: sem destaque, digitar e apertar Enter não escolheria nada. É contrato das cinco stacks, não preferência.
- Os textos de interface — mensagem de vazio, nome do botão de limpar, nome do gatilho, nome do botão de remover e o sufixo de `removedLabel` — nascem em português e **têm de ser passados traduzidos** por quem monta a página. Nenhum deles muda de idioma sozinho, e o nome que o primitivo escreve no botão de remover vem fixo em inglês: o atributo do template vence, porque o Angular funde os atributos do template por último.
- Botão de remover tem nome PRÓPRIO, um por chip: "Remover Brasil", nunca cinco botões chamados "Remover" — nome repetido em vários controles é o mesmo que nome nenhum (WCAG 4.1.2).
- Estado vazio sempre presente: lista filtrada sem resultado nunca fica em branco.
- O separador é decorativo e sai da árvore de acessibilidade: separador não é filho permitido de `role="listbox"`, e a lista inteira reprovaria por causa dele.
- A lista é portalizada: em teste, ela não está no canvas, e sim no corpo do documento.
- Chip é rótulo de opção escolhida, não texto livre. Valor digitado que vira etiqueta é outro componente.

**Acessibilidade**:
- `role="combobox"` vai no INPUT, não num wrapper nem num botão — é o padrão ARIA 1.2.
- O foco NUNCA sai do campo de texto: a opção ativa é apontada por `aria-activedescendant` e realçada por `[data-highlighted]`. Mover o foco para a opção quebraria a digitação, que é o ponto do componente.
- `aria-expanded` acompanha a lista aberta ou fechada; `aria-autocomplete="list"` declara que digitar filtra; `aria-selected="true"` na opção escolhida; `aria-invalid="true"` quando a validação reprova.
- A lista precisa de nome próprio, e ela o herda do rótulo do campo — assim campo e lista dizem a mesma coisa.
- O `<label>` leva o foco ao campo pelo `for`, e não só por `aria-labelledby`: clicar no rótulo é metade do que um rótulo existe para fazer.
- Remover um chip não move o foco nem muda o texto do campo: quem anuncia é uma região viva `role="status"`, montada o tempo todo. Vale para os três gestos que tiram um escolhido — botão do chip, Backspace com o texto vazio e Delete sobre o chip focado.
- No gatilho, o `aria-labelledby` do primitivo é apagado de propósito: ele vence `aria-label`, e o botão passaria a se chamar como o campo, deixando dois controles com o mesmo nome na lista do leitor de tela.
- Teclado: digitar filtra e abre a lista; ↓ e ↑ andam pelas opções e dão a volta; Enter escolhe a ativa; Escape fecha; Tab fecha e sai do campo; Backspace com o texto vazio remove o último chip; Home e End vão à primeira e à última opção.
- O gatilho fica fora da ordem de tabulação: quem tem foco é o campo, e o Tab tem de sair dele em vez de parar num segundo alvo que faz o que a seta já faz.

**Divergências de API registradas** (divergência de framework se anota, não se alinha):
- O contêiner de chips carrega `role="toolbar"`, que é o modelo de teclado do primitivo — chips navegáveis por seta.
- Escape com a lista já fechada limpa o texto E a escolha, não só o texto.
- O campo escondido do formulário é criado pelo primitivo como IRMÃO da raiz, sem `data-slot="combobox-hidden-input"`.
- Em modo simples o valor é uma string, e não uma lista de um.

**Analytics**: `option_select` com `{ component: 'combobox', field_name, value, label, location }` ao escolher uma opção; `field_change` com `{ component: 'combobox', field_name, value, location }` ao remover um chip ou limpar o campo.

---

## Toggle · Toggle Group

**Propósito**: botão de dois estados (`button[ndsToggle]`) e conjunto de botões com escolha única ou múltipla (`div[ndsToggleGroup]`).

**Estrutura**:

```
div[ndsToggleGroup]
├── button[ndsToggle]        (aria-pressed)
└── button[ndsToggle]
```

**Entradas do Toggle**:

| Nome | Default | Função |
|---|---|---|
| `variant` | `default` | `default` ou `outline` |
| `size` | `default` | `default`, `sm`, `lg` |

**Entradas do Toggle Group**:

| Nome | Default | Função |
|---|---|---|
| `type` | `single` | `single` ou `multiple` |
| `value` | — | Valor de duas vias |
| `defaultValue` | — | Valor inicial não controlado |
| `disabled` | `false` | Desliga o conjunto |
| `orientation` | `horizontal` | Eixo de navegação |
| `variant` | `default` | Propagada aos itens |
| `spacing` | `0` | `0` cola os botões num bloco; maior separa |

**Regras**:
- `spacing: 0` é o visual de barra de ferramenta contínua — e é onde o raio dos cantos internos tem de ser reto
- `single` sem valor obrigatório permite desmarcar; se a escolha é obrigatória, é preciso garantir que sempre haja um marcado
- Toggle só de ícone precisa de nome acessível, como qualquer botão sem texto

**Acessibilidade**:
- Estado por `aria-pressed`, não por classe visual
- No grupo, as setas navegam e o Tab trata o conjunto como uma parada

---

## Calendar

**Propósito**: escolher data ou datas numa grade de mês.

**Componente**: `div[ndsCalendar]`, com `div[ndsCalendarMonths]` e `button[ndsCalendarDay]` na estrutura interna.

**Estrutura**:

```
div[ndsCalendar]
├── cabeçalho              (mês/ano; rótulo fixo ou seletores)
├── navegação              (mês anterior / próximo)
└── div[ndsCalendarMonths]
    └── grade do mês       (table de dias)
        └── button[ndsCalendarDay]
```

**Entradas**:

| Nome | Default | Função |
|---|---|---|
| `mode` | `single` | `single` ou `multiple` |
| `value` | — | Data ou datas, de duas vias |
| `defaultMonth` | — | Mês inicial exibido |
| `locale` | `en-US` | Idioma dos nomes de mês e dia |
| `disabled` | — | Predicado que desabilita datas |
| `showOutsideDays` | `true` | Mostra dias dos meses vizinhos |
| `captionLayout` | `label` | `label` (texto) ou `dropdown` (seletores) |
| `numberOfMonths` | `1` | Meses exibidos lado a lado |
| `initialFocus` | `false` | Move o foco para a grade ao montar |

**Regras**:
- `locale` **tem de ser passado**: o default é `en-US`, e uma docs page em português com meses em inglês é defeito visível. O locale vem do idioma ativo, não de constante
- Data indisponível é desabilitada pelo predicado, não escondida — esconder muda o desenho da grade
- Não há modo de intervalo neste stack; para faixa, dois campos de data
- `initialFocus` só em calendário que abre dentro de overlay, onde o foco precisa entrar na grade

**Acessibilidade**:
- A grade é tabela de verdade, com cabeçalho de dia da semana
- Setas movem dia a dia, PageUp e PageDown trocam de mês, Home e End vão aos extremos da semana
- Dia selecionado e dia de hoje são distinguíveis sem depender de cor
- Nome acessível de cada dia traz a data completa, não só o número

---

## Form

**Propósito**: agrupar campos, ligar rótulo, descrição e mensagem de erro ao controle, e refletir o estado de validação.

**Peças**: `form[ndsForm]`, `div[ndsFormField]`, `label[ndsFormLabel]`, `p[ndsFormDescription]`, `p[ndsFormMessage]`, `fieldset[ndsFieldset]`, `legend[ndsFieldsetLegend]`.

**Estrutura**:

```
form[ndsForm]
├── div[ndsFormField]
│   ├── label[ndsFormLabel]
│   ├── controle              (input, textarea, checkbox, switch, select, slider…)
│   ├── p[ndsFormDescription]
│   └── p[ndsFormMessage]     (live region)
├── fieldset[ndsFieldset]
│   ├── legend[ndsFieldsetLegend]
│   └── div[ndsFormField] × n
└── botão de submissão
```

**Entradas**:

| Peça | Nome | Default | Função |
|---|---|---|---|
| `ndsFormField` | `invalid` | — (o controle decide) | Força o estado inválido |

**Regras**:
- **O campo descobre o controle projetado dentro dele** e faz a fiação acessível a partir disso: vincula `for`/`id`, aponta `aria-describedby` para descrição e mensagem, e marca `data-invalid` no campo
- A ordem de busca do controle importa: checkbox, switch e select desta stack renderizam um campo escondido para participar do formulário, e ele casaria antes do controle de verdade. Não reordene os seletores sem medir
- `invalid` ausente significa "o `FormControl` decide". O input existe para os dois casos sem `FormControl`: validação vinda do servidor e exemplo de documentação, onde o estado **é** o assunto
- Uma mensagem por campo. Mensagem diz causa e orientação, sem culpar
- Após submissão inválida, o foco vai para o primeiro campo com erro
- Grupo de controles relacionados vai em `fieldset` com `legend` — não um `<div>` com um parágrafo fazendo papel de rótulo

**Acessibilidade**:
- Mensagem de erro é live region, para ser anunciada quando aparece
- `aria-invalid` no controle, não no wrapper
- Campo obrigatório marcado no controle e dito no texto — asterisco sozinho não é informação

**Analytics**: `form_submit` com identificador do formulário, validade e campos com erro. Nunca o **valor** de campo sensível.
