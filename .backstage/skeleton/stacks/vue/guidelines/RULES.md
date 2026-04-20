# Rules — Design System Documentation Project (Vue)

Estas regras se aplicam a **todas** as interações neste projeto, sem exceção. Consulte os arquivos de referência listados em cada seção para detalhes de implementação.

---

## 1. Stack obrigatória

- **Componentes**: usar exclusivamente os de `./components/ui` (Shadcn Vue / Reka UI)
- **Estilos**: usar `./styles/globals.css` — nunca CSS inline arbitrário
- **Ícones**: exclusivamente `lucide-vue-next` — zero exceções
- **Formulários**: Vee-Validate + Zod — estrutura de campos via composables do vee-validate
- **Tipografia**: fonte do sistema definida no CSS base — não usar classes Tailwind de tamanho ou line-height (`text-2xl`, `leading-none`)

---

## 2. Cores e tokens CSS

Formato obrigatório: **HSL sem vírgulas** (`220 44% 57%`). Proibidos: rgba, oklch, hex.

Tokens de superfície:
- Painéis de conteúdo (Dialog, Sheet, Drawer, Card): `bg-card text-card-foreground`
- Menus e overlays flutuantes (DropdownMenu, Popover, Tooltip, etc.): `bg-popover text-popover-foreground`
- Inputs: `bg-input border-input`

Tokens de cor de estado aplicados via `class` — nunca via prop inexistente:
- Warning/Success em Alert e Badge: `class="bg-warning/10 text-warning border-warning/30"`

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
- `motion-reduce:animate-none` em toda animação customizada fora dos componentes Reka UI
- Focus ring obrigatório: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` — sem opacidade
- `DialogTitle` e `DialogDescription` obrigatórios em todo Dialog, Sheet, Drawer
- `TableCaption` obrigatório em toda Table (pode ser `sr-only`)
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

- Primário sempre à **direita** — usar `justify-end` ou `ml-auto`
- DOM segue a ordem visual — `flex-row-reverse` **proibido**
- Ordem no DOM: `[secundário] [primário]` — confirmação sempre à direita

---

## 6. Edições parciais — preservação de conteúdo

Ao editar qualquer seção de um arquivo existente:
- Preservar **todos** os imports, mesmo os não usados na seção editada
- Preservar exports, interfaces e props intactos
- Não modificar código fora do escopo solicitado

Referência: `../../docs/shared/guidelines/03-edicoes-parciais.md`.

---

## 7. Componentes — regras de API (Reka UI / Shadcn Vue)

Nunca inventar props que não existem. Casos frequentes:

| Componente | Prop inexistente | Correto |
|------------|-----------------|---------|
| Avatar | `size` | `class="h-8 w-8"` |
| Badge | `size` | `class` customizado |
| Alert | variantes `warning`/`success` | `class` com tokens do projeto |
| Drawer | prop `side` | `direction` no `<Drawer>` |
| Select | busca integrada | usar Combobox (Command + Popover) |

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

O `App.vue` é um **sandbox de desenvolvimento** e rota `?view=admin`. Não usar para fins de navegação de documentação.

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
