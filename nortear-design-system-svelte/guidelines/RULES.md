# Rules — Design System Documentation Project (Svelte)

Estas regras se aplicam a **todas** as interações neste projeto, sem exceção. Consulte os arquivos de referência listados em cada seção para detalhes de implementação.

---

## 1. Stack obrigatória

- **Componentes**: usar exclusivamente os de `$lib/components/ui` (Bits UI)
- **Estilos**: usar `./styles/globals.css` — nunca CSS inline arbitrário
- **Ícones**: exclusivamente `lucide-svelte` — zero exceções
- **Formulários**: Superforms + Zod — validação tipada com schema Zod
- **Tipografia**: a escada de texto vem dos tokens (`--text-h1` … `--text-label`) e os elementos HTML já a herdam do CSS base. Não escrever tamanho nem `line-height` por cima: a escada responde ao eixo de fonte e à densidade, e um valor cravado sai fora dos dois

---

## 2. Cores e tokens CSS

Formato obrigatório: **HSL sem vírgulas** (`220 44% 57%`). Proibidos: rgba, oklch, hex.

Tokens de superfície — não há classe utilitária de cor de fundo; quem aplica é a
folha do componente, lendo o token:
- Painéis de conteúdo (Dialog, Sheet, Drawer, Card): `--card` / `--card-foreground`
- Menus e overlays flutuantes (DropdownMenu, Popover, Tooltip, etc.): `--popover` / `--popover-foreground`
- Inputs: `--input` no fundo, `--border` no contorno

Tokens de cor de estado aplicados via `class` — nunca via prop inexistente:
- Warning/Success em Alert: **prop** `variant="warning"` / `variant="success"` (desde PATCHES.md#alert-five-variants — nunca via class). Badge também: `variant="warning"` / `variant="success"` / `variant="info"` — nele a cor sai na BORDA, não no preenchimento (ver guideline 07 §Badge). Caso pontual sobrescreve a var interna escopada (`--badge-border`, ver `07-feedback-components.md` §Badge)

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
- Toda animação personalizada tem de parar sob `prefers-reduced-motion` — as folhas `.nds-*` já param as suas; o que se escreve por fora é responsabilidade de quem escreveu
- Anel de foco obrigatório: classe `.nds-focus-ring`, com 2px de espessura e o token `--ring` em cor cheia — sem opacidade
- `Dialog.Title` e `Dialog.Description` obrigatórios em todo Dialog, Sheet, Drawer (Bits UI)
- `TableCaption` obrigatório em toda Table — pode ficar fora da tela (`.nds-sr-only`), nunca ausente
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

- Primário sempre à **direita** — o alinhamento sai do `.nds-cluster` que agrupa os botões, com `data-justify="end"`
- DOM segue a ordem visual — inverter a direção do flex é **proibido**: o leitor de tela e o Tab andam pela ordem do DOM, e ela passaria a discordar do que se vê
- Ordem no DOM: `[secundário] [primário]` — confirmação sempre à direita

---

## 6. Edições parciais — preservação de conteúdo

Ao editar qualquer seção de um arquivo existente:
- Preservar **todos** os imports, mesmo os não usados na seção editada
- Preservar exports, interfaces e props intactos
- Não modificar código fora do escopo solicitado

Referência: `../../docs/shared/guidelines/03-edicoes-parciais.md`.

---

## 7. Componentes — regras de API (Bits UI)

Nunca inventar props que não existem. Casos frequentes:

| Componente | Prop inexistente | Correto |
|------------|-----------------|---------|
| Badge | `size` | `class` própria |
| Drawer | prop `side` | `direction` no `<Drawer.Root>` |
| Select | busca integrada | usar Combobox |

**O Avatar TEM prop `size`** — `sm` / `md` / `lg` / `xl` / `2xl`, com o padrão em
`md`. A regra antiga mandava o contrário e proibia a API que o componente
realmente expõe. O preset não escreve uma altura: a folha deriva dele o diâmetro,
o corpo das iniciais, o selo de status e o recuo do grupo empilhado — e é por isso
que fixar altura por fora desalinha os três últimos. Detalhe em
`08-display-components.md` §Avatar.

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
