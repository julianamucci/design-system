# Rules — Design System Nortear (Vanilla TypeScript)

Estas regras se aplicam a **todas** as interações neste projeto, sem exceção. Consulte os arquivos de referência listados em cada seção para detalhes de implementação.

---

## 1. Stack obrigatória

- **Componentes**: funções TypeScript que criam/retornam `HTMLElement` — padrão `createNomeComponente(options): HTMLElement`
- **Estilos**: CSS standalone via classes `.nds-*` definidas em `docs/shared/styles/nds/*.css` (alias `@shared/styles/nds/`, importado por `src/styles/globals.css`). O projeto não usa nenhum framework de classe utilitária — classe sem o prefixo `nds-` é inerte em runtime. Nunca estilos inline arbitrários (exceto CSS custom properties dinâmicas)
- **Ícones**: exclusivamente `lucide` (pacote vanilla) — `import { icons } from 'lucide'` — zero exceções
- **Formulários**: HTML nativo + Zod para validação de schema — sem biblioteca de formulários
- **Tipografia**: fonte do sistema definida no CSS base — usar classes `.nds-text-*` / `.nds-leading-*` (sem valores arbitrários ou classes utilitárias de outro framework)
- **Utilitários**: `cn()` de `@/lib/utils` para composição de classes

---

## 2. Cores e tokens CSS

Formato obrigatório: **HSL sem vírgulas** (`220 44% 57%`). Proibidos: rgba, oklch, hex.

Tokens de superfície — **não há utilitária de cor de fundo**. Quem lê o token é a
folha do componente; aplicar a classe do componente é o que aplica a superfície:
- Painéis de conteúdo (Dialog, Sheet, Drawer, Card): `.nds-dialog-content`, `.nds-sheet-content`, `.nds-card` (`--card` / `--card-foreground` no Card; ver a pendência medida em `10-overlay-components.md` para os painéis modais)
- Menus e overlays flutuantes (Dropdown, Popover, Tooltip, etc.): `.nds-dropdown-menu-content`, `.nds-popover-content`, `.nds-tooltip-content` (`--popover` / `--popover-foreground`)
- Inputs: `.nds-input` (`--input` no fundo, `--border` no contorno)

Camadas de empilhamento saem da escada de tokens (`--z-dropdown` … `--z-toast`),
lida pela folha. Número escrito no call site sai da escada.

Tokens de cor de estado aplicados via `className` — nunca via atributo ou style direto:
- Warning/Success em Alert: **opção** `variant: 'warning'` / `variant: 'success'` da factory (desde PATCHES.md#alert-five-variants — nunca via className). Badge tem `warning` e `success` como variantes próprias, e ambas escrevem só a cor da borda; caso pontual sobrescreve as vars internas escopadas (`--badge-bg` etc., ver guideline 04 §Tokens de Componente)

Referência completa: `03-sistema-design.md` e `../../docs/shared/guidelines/04-padroes-design-sistema.md`.

---

## 3. Acessibilidade — WCAG 2.2 AA obrigatório

**As três premissas do projeto, em ordem de prioridade:**
1. **Acessível** — WCAG 2.2 AA, todos os tipos de deficiência
2. **Rastreável** — analytics em toda a jornada
3. **Indexável** — SEO + GEO

Regras permanentes:
- `aria-label` contextual em todos os elementos interativos ambíguos: formato `"[verbo] [objeto] [identificador]"` — ex: `"Excluir produto Cadeira Gamer Pro"`
- Ícones decorativos: sempre `aria-hidden="true"` via `setAttribute('aria-hidden', 'true')`
- Ícones funcionais (sem texto adjacente): `aria-label` obrigatório no elemento pai
- Cor nunca é o único indicador de estado — sempre acompanhar com ícone + texto
- Toda animação respeita `prefers-reduced-motion: reduce`. As folhas `.nds-*` já cumprem a regra por conta própria — não há classe a pendurar no elemento. Só animação AUTORAL, fora das folhas, precisa se declarar, e para isso existe `.nds-motion-reduce-none`
- Anel de foco obrigatório em todo componente interativo: 2px lendo `--ring` em 100% da cor, pelo `:focus-visible` da folha do componente ou por `.nds-focus-ring`. Opacidade (`/50`, `/30`) derruba o indicador de foco abaixo dos 3:1 de WCAG 1.4.11
- `role="dialog"` + `aria-labelledby` + `aria-describedby` obrigatórios em todo Dialog/Sheet/Drawer
- Títulos e descrições de dialog devem ter `id` para referência em `aria-labelledby` / `aria-describedby`
- Tabelas: `<caption>` obrigatório (pode ficar fora da tela via `.nds-sr-only`); `scope="col"` em todo `<th>`

Referência completa: `../../docs/shared/guidelines/01-acessibilidade.md`.

---

## 4. Template literals e innerHTML — caracteres especiais

Proibido em conteúdo de texto inserido via `textContent` ou template literals em `innerHTML`: `<` `>` `&` `"` `'`

Usar entidades HTML em template literals: `&lt;` `&gt;` `&amp;` `&quot;` `&#39;`

```ts
// ❌ btn.innerHTML = `<span>Valor A > Valor B</span>`
// ✅ btn.innerHTML = `<span>Valor A &gt; Valor B</span>`
// ✅ btn.textContent = 'Valor A > Valor B'  // textContent escapa automaticamente
```

**Regra de ouro**: use `textContent` para conteúdo de texto do usuário — nunca `innerHTML` com dados não sanitizados.

Referência: `02-template-caracteres-especiais.md`.

---

## 5. Alinhamento de botões

- Primário sempre à **direita** — `.nds-cluster` com `data-justify="end"` no par de ações, ou `.nds-spacer-start` no botão primário quando ele divide a fileira com outro conteúdo. **Não existem utilitárias avulsas de alinhamento** (`.nds-justify-*`, `.nds-items-*`): o alinhamento é `data-*` do cluster
- DOM segue a ordem visual — `flex-row-reverse` **proibido**
- Ordem no DOM: `[secundário] [primário]` — confirmação sempre à direita

Referência: `../../docs/shared/guidelines/02-alinhamento-botoes.md`.

---

## 6. Edições parciais — preservação de conteúdo

Ao editar qualquer seção de um arquivo existente:
- Preservar **todos** os imports, mesmo os não usados na seção editada
- Preservar exports, interfaces e tipos intactos
- Não modificar código fora do escopo solicitado

Referência: `../../docs/shared/guidelines/03-edicoes-parciais.md`.

---

## 7. Componentes — regras de API

Funções de criação de componentes seguem o padrão:

```ts
export function createButton(options: ButtonOptions): HTMLButtonElement
export function createCard(options: CardOptions): HTMLDivElement
export function createDialog(options: DialogOptions): HTMLElement
```

- Nunca inventar propriedades que não existem nas interfaces definidas
- Estado de componente: usar atributos `data-*` — ex: `data-state="open"`, `data-variant="default"`
- Comunicação entre componentes: Custom Events via `dispatchEvent(new CustomEvent(...))`
- Animações de estado (Dialog open/close): CSS transitions em `data-state`

Referência por categoria: `04-layout-components.md` a `10-overlay-components.md`.

---

## 8. Analytics

Tracking na **camada de produto** — nunca dentro de funções de criação de componentes em `src/components/ui/`.

Formato de evento: `objeto_ação` em snake_case inglês (ex: `button_click`, `dialog_open`).

Payload base obrigatório: `{ component, variant?, location, label? }`

`data-track-label` deve ser idêntico ao `aria-label` ou texto visível do elemento.

Não rastrear `value` de campos sensíveis (senha, CPF, cartão).

Referência completa: `../../docs/shared/guidelines/07-analytics.md`.

---

## 9. Navegação — Storybook como interface única

A documentação vive no **Storybook** (`npm run storybook`, porta 6009), e não há outra interface: o sandbox de aplicação foi removido em 2026-09-02. Componente novo é adicionado **criando stories** — é o que o torna alcançável.

A navegação é a sidebar do Storybook, ordenada pelo `storySort`. Não usar roteamento SPA para documentação.

Para adicionar um componente: criar `*Docs.ts` (função que retorna `HTMLElement`) + `*.stories.ts` (usando `@storybook/html`). Ver `12-arquitetura-projeto.md`.

Stories usam o formato:
```ts
import type { Meta, StoryObj } from '@storybook/html'
const meta: Meta = { title: 'UI/NomeComponente', tags: ['autodocs'], render: (args) => { /* retorna HTMLElement */ } }
export default meta
export const Playground: StoryObj = { args: { ... } }
```

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

Todo ComponentDocs usa a função `applyStorybookSeo` de `@/lib/use-seo.ts`. Ela detecta o iframe do Storybook e escreve no documento pai automaticamente.

```ts
import { applyStorybookSeo } from '@/lib/use-seo'

applyStorybookSeo({
  title: "Button — Formulários · DS",
  description: "Documentação do Button: 6 variantes, estados interativos e exemplos de código.",
  locale: "pt-BR",
  componentSlug: "button"
})
```

Referência completa: `../../docs/shared/guidelines/06-seo-geo.md`.

---

## 12. Arquitetura — restrições

- Máximo de responsabilidades por arquivo: manter pequeno e extrair helpers para arquivos separados
- Estado de componente: `data-*` attributes — não variáveis globais
- Comunicação: Custom Events tipados — não callbacks globais
- Espaçamento: múltiplos de 8px
- `cn()` de `@/lib/utils` para composição de classes condicionais
- `innerHTML` apenas com conteúdo sanitizado — nunca com input do usuário

Referência: `12-arquitetura-projeto.md` e `13-system-design.md`.
