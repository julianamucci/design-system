# Rules — Design System Documentation Project

Estas regras se aplicam a **todas** as interações neste projeto, sem exceção. Consulte os arquivos de referência listados em cada seção para detalhes de implementação.

---

## 1. Stack obrigatória

- **Componentes**: usar exclusivamente os de `./components/ui` (construídos sobre `@base-ui/react` + CSS `.nds-*`)
- **Estilos**: usar as classes `.nds-*` (`docs/shared/styles/nds/`) — nunca CSS inline arbitrário
- **Ícones**: exclusivamente `lucide-react` — zero exceções
- **Formulários**: React Hook Form + Zod via `Form > FormField > FormItem > FormLabel + FormControl + FormDescription + FormMessage`
- **Tipografia**: fonte do sistema definida no CSS base — não usar classes utilitárias de tamanho ou line-height fora do CSS base (a tipografia já vem dos tokens `--text-*`)

---

## 2. Cores e tokens CSS

Formato obrigatório: **HSL sem vírgulas** (`220 44% 57%`). Proibidos: rgba, oklch, hex.

Tokens de superfície — quem lê o token é a folha do componente; a superfície nunca é repintada por fora:
- Painéis de conteúdo (Dialog, Sheet, Drawer, Card): `.nds-card` e as folhas de painel leem `--card` / `--card-foreground`
- Menus e overlays flutuantes: `.nds-popover-content`, `.nds-dropdown-menu-content`, `.nds-tooltip-content` leem `--popover` / `--popover-foreground`. Não há utilitária para essa superfície, e é de propósito: overlay flutuante sem a folha certa também perde elevação, raio e animação de entrada
- Inputs: `.nds-input` lê `--background` no fundo e `--input` (com `--border` de reserva) na borda

Tokens de cor de estado aplicados via `className` — nunca via prop inexistente:
- Warning/Success em Alert: **prop** `variant="warning"` / `variant="success"` (desde PATCHES.md#alert-five-variants — nunca via className). Badge tem `warning` e `success` como variante própria — cinco no total, com `default`, `destructive` e `info`; caso pontual sobrescreve as vars internas escopadas (`--badge-border` etc., ver guideline 04 §Tokens de Componente)

Referência completa: `03-sistema-design.md` e `../../docs/shared/guidelines/04-padroes-design-sistema.md`.

---

## 3. Acessibilidade — WCAG 2.2 AA obrigatório

**As três premissas do projeto, em ordem de prioridade:**
1. **Acessível** — WCAG 2.2 AA, todos os tipos de deficiência
2. **Rastreável** — analytics em toda a jornada
3. **Indexável** — SEO + GEO

Regras permanentes:
- `aria-label` contextual em todos os elementos interativos ambíguos: formato `"[verbo] [objeto] [identificador]"` — ex: `"Excluir produto Cadeira Gamer Pro"`
- Ícones decorativos: sempre `aria-hidden="true"`
- Ícones funcionais (sem texto adjacente): `aria-label` obrigatório no elemento pai
- Cor nunca é o único indicador de estado — sempre acompanhar com ícone + texto
- Respeitar `prefers-reduced-motion` em toda animação customizada fora dos primitivos `@base-ui/react`
- Anel de foco obrigatório: `.nds-focus-ring` — 2px de `--ring` em `:focus-visible`, com halo de `--background` por fora, e sempre com a cor cheia (nunca `/50` ou `/30`)
- `DialogTitle` e `DialogDescription` obrigatórios em todo Dialog, Sheet, Drawer — são a base do `aria-labelledby`
- `TableCaption` obrigatório em toda Table (pode ficar visualmente oculta com `.nds-sr-only`)
- `scope="col"` em todo `TableHead`
- `TooltipProvider` no root — neste repositório, via `decorator` em `.storybook/preview.ts`; na aplicação que consome o design system, no root dela
- `aria-invalid` dentro de `FormField`: automático via `FormControl` — não adicionar manualmente. Fora de `FormField`: adicionar manualmente com `aria-errormessage`

Referência completa: `../../docs/shared/guidelines/01-acessibilidade.md`.

---

## 4. JSX — caracteres especiais

Proibidos em conteúdo de texto JSX: `<` `>` `&` `"` `'`

Usar entidades HTML: `&lt;` `&gt;` `&amp;` `&quot;` `&#39;`

```tsx
// ❌ <span>Valor A > Valor B</span>
// ✅ <span>Valor A &gt; Valor B</span>
```

Referência: `02-jsx-caracteres-especiais.md`.

---

## 5. Alinhamento de botões

- Primário sempre à **direita** — o par de ações é um `.nds-cluster` com `data-justify="end"`; empurrar um item sozinho é `.nds-spacer-start`
- DOM segue a ordem visual — inverter a direção do flex para conseguir o alinhamento é **proibido**
- Ordem no DOM: `[secundário] [primário]` — confirmação sempre à direita

---

## 6. Edições parciais — preservação de conteúdo

Ao editar qualquer seção de um arquivo existente:
- Preservar **todos** os imports, mesmo os não usados na seção editada
- Preservar exports, interfaces e props intactos
- Não modificar código fora do escopo solicitado

Estas três regras valem para qualquer edição parcial, em qualquer arquivo do projeto.

---

## 7. Componentes — regras de API

Nunca inventar props que não existem. Casos frequentes:

| Componente | Prop inexistente | Correto |
|------------|-----------------|---------|
| Badge | `size` | não há tamanho por prop; caso pontual sobrescreve as vars internas escopadas (`--badge-border` etc.) |
| Label | peso em negrito | o peso do rótulo vem da folha `.nds-label` (`--font-weight-medium`); não sobrescrever |
| Sonner | posição `top-right` | padrão é `bottom-right` |
| Drawer | prop `side` | `direction` no `<Drawer>` |
| Select | busca integrada | usar Combobox |

Para usar um componente existente como gatilho, sem elemento extra no DOM, há **duas formas nesta stack, e elas não são intercambiáveis**:

| Gatilho | Como compor |
|---|---|
| `CollapsibleTrigger`, `DialogTrigger`, `AlertDialogTrigger`, `DropdownMenuTrigger`, `PopoverTrigger`, `HoverCardTrigger` | `asChild` — o wrapper do design system mantém essa ponte |
| `SheetTrigger`, `TooltipTrigger` | `render={<Button />}` — não há ponte `asChild`; a prop seria ignorada em silêncio |

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

## 9. Navegação — Storybook como única interface

A única interface do projeto é o **Storybook** (`npm run storybook`, porta 6006). Não existe sandbox de aplicação: componente novo é adicionado criando stories, e é a story que o coloca na navegação.

Para adicionar um componente: criar `*Docs.tsx` + `translations.json` + `*.stories.tsx` (5 arquivos). Ver `12-arquitetura-projeto.md`.

---

## 10. Tom de voz

Tratamento: **"você"** — nunca "tu", "o usuário", "deve-se".

Nível: semi-formal. Nem burocrático, nem coloquial.

Regras rápidas:
- Labels: substantivo, sem dois-pontos, sem ponto final, capitalização na primeira palavra
- Placeholders: exemplo real ("ex: joao@empresa.com") — nunca instrução
- Erros: causa + orientação, sem culpar — "Email inválido. Use o formato nome@dominio.com"
- Botões: verbo no infinitivo, máximo 3 palavras, sem pontuação
- Tooltip: complementa o label visível, não repete
- Dialog destrutivo: título = ação, descrição = consequência, botão primário = repete o verbo

Referência completa: `../../docs/shared/guidelines/05-tom-de-voz.md`.

---

## 11. SEO e GEO (Storybook iframe)

Todo ComponentDocs usa o hook `useSeoEffect` de `@/lib/use-seo.ts`. Ele detecta o iframe do Storybook e escreve no documento pai automaticamente.

```tsx
useSeoEffect({ title: "Button — Formulários · DS", description: "...", locale: "pt-BR", componentSlug: "button" });
```

Referência completa: `../../docs/shared/guidelines/06-seo-geo.md`.

---

## 12. Arquitetura — restrições

- Máximo de componentes por arquivo: manter pequeno e extrair helpers para arquivos separados
- `Toaster` (Sonner) no root — `position="bottom-right" richColors`
- `TooltipProvider` no root
- Espaçamento: múltiplos de 8px
- Calendar: `locale={ptBR}` de `react-day-picker/locale` sempre obrigatório
- Carousel auto-play: plugin `embla-carousel-autoplay` — não é nativo

Referência: `12-arquitetura-projeto.md` e `13-system-design.md`.
