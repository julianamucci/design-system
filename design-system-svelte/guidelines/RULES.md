# Rules — Design System Documentation Project (Svelte)

Estas regras se aplicam a **todas** as interações neste projeto, sem exceção. Consulte os arquivos de referência listados em cada seção para detalhes de implementação.

---

## 1. Stack obrigatória

- **Componentes**: usar exclusivamente os de `$lib/components/ui` (shadcn-svelte / Bits UI)
- **Estilos**: usar `./styles/globals.css` — nunca CSS inline arbitrário
- **Ícones**: exclusivamente `lucide-svelte` — zero exceções
- **Formulários**: Superforms + Zod — validação tipada com schema Zod
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
- `motion-reduce:animate-none` em toda animação customizada fora dos componentes Bits UI
- Focus ring obrigatório: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` — sem opacidade
- `Dialog.Title` e `Dialog.Description` obrigatórios em todo Dialog, Sheet, Drawer (Bits UI)
- `TableCaption` obrigatório em toda Table (pode ser `sr-only`)
- `scope="col"` em todo cabeçalho de coluna de tabela

Referência completa: `../../docs/shared/guidelines/01-acessibilidade.md`.

---

## 4. Templates Svelte — caracteres especiais

Proibidos em conteúdo de texto literal em templates Svelte: `<` `>` `&` `"` `'`

Usar entidades HTML: `&lt;` `&gt;` `&amp;` `&quot;` `&#39;`

```svelte
<!-- ❌ <span>Valor A > Valor B</span> -->
<!-- ✅ <span>Valor A &gt; Valor B</span> -->
```

Expressões Svelte `{variavel}` são seguras — o compilador escapa automaticamente.

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

## 7. Componentes — regras de API (Bits UI / shadcn-svelte)

Nunca inventar props que não existem. Casos frequentes:

| Componente | Prop inexistente | Correto |
|------------|-----------------|---------|
| Avatar | `size` | `class="h-8 w-8"` |
| Badge | `size` | `class` customizado |
| Alert | variantes `warning`/`success` | `class` com tokens do projeto |
| Drawer | prop `side` | `direction` no `<Drawer.Root>` |
| Select | busca integrada | usar Combobox (Command + Popover) |

Triggers de overlays sempre com `asChild` quando necessário:
`Collapsible.Trigger`, `Dialog.Trigger`, `Sheet.Trigger`, `AlertDialog.Trigger`, `DropdownMenu.Trigger`, `Popover.Trigger`, `Tooltip.Trigger`

Referência por categoria: `04-layout-components.md` a `10-overlay-components.md`.

---

## 8. Analytics

Tracking na **camada de produto** — nunca dentro de `$lib/components/ui/`.

Formato de evento: `objeto_ação` em snake_case inglês (ex: `button_click`, `dialog_open`).

Payload base obrigatório: `{ component, variant?, location, label? }`

`data-track-label` deve ser idêntico ao `aria-label` ou texto visível do elemento.

Não rastrear `value` de campos sensíveis (senha, CPF, cartão).

Referência completa: `../../docs/shared/guidelines/07-analytics.md`.

---

## 9. Navegação — Storybook como interface principal

A interface principal de documentação é o **Storybook** (`npm run storybook`, porta 6006). Novos componentes são adicionados criando stories — **não registrando no `App.svelte`**.

O `App.svelte` é um **sandbox de desenvolvimento**. Não usar para fins de navegação de documentação. Não usar `navigateTo` nem roteamento SPA para documentação.

Referência: `12-arquitetura-projeto.md`.

---

## 10. Tom de voz

Tratamento: **"você"** — nunca "tu", "o usuário", "deve-se".

Nível: semi-formal. Nem burocrático, nem coloquial.

Referência completa: `../../docs/shared/guidelines/05-tom-de-voz.md`.

---

## 11. SEO e GEO (Storybook iframe)

Todo ComponentDocs usa o composable `useSeoEffect` de `$lib/use-seo.ts`. Ele detecta o iframe do Storybook e escreve no documento pai automaticamente.

```ts
useSeoEffect({ title: 'Button — Formulários · DS', description: '...', locale: 'pt-BR', componentSlug: 'button' })
```

Referência completa: `../../docs/shared/guidelines/06-seo-geo.md`.

---

## 12. Arquitetura — restrições

- Máximo de componentes por arquivo: manter pequeno e extrair helpers para arquivos separados
- `Toaster` (svelte-sonner) no root — `position="bottom-right"`
- Espaçamento: múltiplos de 8px
- Stores e lógica compartilhada em `/src/lib/` — arquivos `.svelte.ts` para stores reativas com runes
- Tipos TypeScript em `/src/lib/types.ts` ou arquivos `.d.ts` quando compartilhados

Referência: `12-arquitetura-projeto.md` e `13-system-design.md`.
