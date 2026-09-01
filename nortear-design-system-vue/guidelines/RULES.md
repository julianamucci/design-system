# Rules — Design System Documentation Project (Vue)

Estas regras se aplicam a **todas** as interações neste projeto, sem exceção. Consulte os arquivos de referência listados em cada seção para detalhes de implementação.

---

## 1. Stack obrigatória

- **Componentes**: usar exclusivamente os de `./components/ui` (Reka UI)
- **Estilos**: o vocabulário é `.nds-*`, definido em `docs/shared/styles/nds/` e importado pelo `./styles/globals.css` — nunca valor de desenho em `style` inline
- **Ícones**: exclusivamente `lucide-vue-next` — zero exceções
- **Formulários**: Vee-Validate + Zod — estrutura de campos via composables do vee-validate
- **Tipografia**: fonte do sistema definida no CSS base. A escala tipográfica vem das classes `.nds-text-*` da folha `typography.css` — não recriar tamanho nem altura de linha com utilitária avulsa

---

## 2. Cores e tokens CSS

Formato obrigatório: **HSL sem vírgulas** (`220 44% 57%`). Proibidos: rgba, oklch, hex.

Tokens de superfície. **Não existe utilitária de cor de superfície** — quem lê o token é a folha do componente:
- Painéis de conteúdo (Dialog, Sheet, Drawer, Card): `--card` / `--card-foreground`, lidos por `.nds-card`, `.nds-dialog-content`, `.nds-sheet-content`, `.nds-drawer-content`
- Menus e overlays flutuantes (DropdownMenu, ContextMenu, Popover, HoverCard, Command, Tooltip): `--popover` / `--popover-foreground`, lidos por `.nds-dropdown-menu-content`, `.nds-popover-content`, `.nds-hover-card-content`, `.nds-command`, `.nds-tooltip-content`
- Inputs: `--input` no fundo e `--border` na borda, lidos por `.nds-input`, `.nds-textarea`, `.nds-select-trigger`

Tokens de cor de estado aplicados via `class` — nunca via prop inexistente:
- Warning/Success em Alert: **prop** `variant="warning"` / `variant="success"` (desde PATCHES.md#alert-five-variants — nunca via class). Badge não tem essas variantes; caso pontual sobrescreve as vars internas escopadas (`--badge-bg` etc., ver guideline 04 §Tokens de Componente)

Referência completa: `03-sistema-design.md` e `../../docs/shared/guidelines/04-padroes-design-sistema.md`.

---

## 3. Acessibilidade — WCAG 2.2 AA obrigatório

**As três premissas do projeto, em ordem de prioridade:**
1. **Acessível** — WCAG 2.2 AA, todos os tipos de deficiência
2. **Rastreável** — analytics em toda a jornada
3. **Indexável** — SEO + GEO

Regras permanentes:
- `aria-label` contextual em todos os elementos interativos ambíguos: formato `"[verbo] [objeto] [identificador]"`
- Ícones decorativos: sempre `aria-hidden="true"`
- Ícones funcionais (sem texto adjacente): `aria-label` obrigatório no elemento pai
- Cor nunca é o único indicador de estado — sempre acompanhar com ícone + texto
- Toda animação personalizada tem de parar sob `prefers-reduced-motion`. As folhas de componente já trazem o próprio `@media`; utilitária de animação avulsa (`.nds-animate-pulse`, `.nds-animate-spin`) NÃO para sozinha — nesse caso, somar `.nds-motion-reduce-none`
- Anel de foco obrigatório: `.nds-focus-ring` — 2px de espessura, cor cheia de `--ring`, sem opacidade, com afastamento. Quando o anel precisa ficar por dentro da caixa, `.nds-focus-ring-inset`
- `DialogTitle` e `DialogDescription` obrigatórios em todo Dialog, Sheet, Drawer
- `TableCaption` obrigatório em toda Table (pode ficar visualmente oculto com `.nds-sr-only`)
- `scope="col"` em todo cabeçalho de coluna de tabela

Referência completa: `../../docs/shared/guidelines/01-acessibilidade.md`.

---

## 4. Templates Vue — caracteres especiais

Proibidos em conteúdo de texto de template Vue: `<` `>` `&` `"` `'`

Usar entidades HTML: `&lt;` `&gt;` `&amp;` `&quot;` `&#39;`

```html
<!-- ❌ <span>Valor A > Valor B</span> -->
<!-- ✅ <span>Valor A &gt; Valor B</span> -->
```

---

## 5. Alinhamento de botões

- Primário sempre à **direita** — `.nds-cluster` com `data-justify="end"`, ou `.nds-spacer-start` no próprio botão primário, que o empurra para a direita
- DOM segue a ordem visual — inverter a ordem só no estilo é **proibido**
- Ordem no DOM: `[secundário] [primário]` — confirmação sempre à direita

---

## 6. Edições parciais — preservação de conteúdo

Ao editar qualquer seção de um arquivo existente:
- Preservar **todos** os imports, mesmo os não usados na seção editada
- Preservar exports, interfaces e props intactos
- Não modificar código fora do escopo solicitado

Referência: `../../docs/shared/guidelines/03-edicoes-parciais.md`.

---

## 7. Componentes — regras de API (Reka UI)

Nunca inventar props que não existem. Casos frequentes:

| Componente | Prop inexistente | Correto |
|------------|-----------------|---------|
| Badge | `size` | dimensão única; caso pontual sobrescreve as vars internas escopadas (`--badge-bg` etc., guideline 04) |
| Drawer | prop `side` | `direction` no `<Drawer>` |
| Select | busca integrada | usar Combobox |

> **O Avatar TEM prop `size`.** Esta tabela já a listava como inexistente, mandando dimensionar por variável escopada. É falso: `size` aceita `sm` (24px), `md` (32px, padrão), `lg` (40px), `xl` (48px) e `2xl` (64px), chega ao DOM como `data-size` e a folha `.nds-avatar[data-size]` deriva dela também as iniciais, o badge de status e o contador do grupo. `--avatar-size` continua existindo, mas como escape para medida fora dos cinco presets — não como o caminho normal.

Triggers de overlays sempre com `as-child`:
`CollapsibleTrigger`, `DialogTrigger`, `SheetTrigger`, `AlertDialogTrigger`, `DropdownMenuTrigger`, `PopoverTrigger`, `TooltipTrigger`

Referência por categoria: `04-layout-components.md` a `10-overlay-components.md`.

---

## 8. Analytics

Tracking na **camada de produto** — nunca dentro de `/components/ui/`.

Formato de evento: `objeto_ação` em snake_case inglês (ex: `button_click`, `dialog_open`).

Payload base obrigatório: `{ component, variant?, location, label? }`

`data-track-label` deve ser idêntico ao `aria-label` ou texto visível do elemento.

Não rastrear `value` de campos sensíveis (senha, CPF, cartão).

Referência completa: `../../docs/shared/guidelines/07-analytics.md`.

---

## 9. Navegação — Storybook como interface principal

A interface principal de documentação é o **Storybook** (`npm run storybook`, porta 6006). Novos componentes são adicionados criando stories — não registrando no `App.vue`.

O `App.vue` é um **sandbox de desenvolvimento**. Não usar para fins de navegação de documentação.

Referência: `12-arquitetura-projeto.md`.

---

## 10. Tom de voz

Tratamento: **"você"** — nunca "tu", "o usuário", "deve-se".

Nível: semi-formal. Nem burocrático, nem coloquial.

Referência completa: `../../docs/shared/guidelines/05-tom-de-voz.md`.

---

## 11. SEO e GEO (Storybook iframe)

Todo ComponentDocs usa o composable `useSeoEffect` de `@/lib/use-seo.ts`. Ele detecta o iframe do Storybook e escreve no documento pai automaticamente.

```ts
useSeoEffect({ title: 'Button — Formulários · DS', description: '...', locale: 'pt-BR', componentSlug: 'button' })
```

Referência completa: `../../docs/shared/guidelines/06-seo-geo.md`.

---

## 12. Arquitetura — restrições

- Máximo de componentes por arquivo: manter pequeno e extrair helpers para arquivos separados
- `Toaster` (vue-sonner) no root — `position="top-right"`
- Espaçamento: múltiplos de 8px
- Composables em `/src/composables/` — prefixo `use`
- Tipos TypeScript em `/src/types/` quando compartilhados

Referência: `12-arquitetura-projeto.md` e `13-system-design.md`.
