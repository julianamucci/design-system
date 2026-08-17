# Rules — Design System Nortear (Angular)

Estas regras se aplicam a **todas** as interações neste projeto, sem exceção. Consulte os arquivos de referência listados em cada seção para detalhes de implementação.

---

## 1. Stack obrigatória

- **Componentes**: usar exclusivamente os de `./components/ui` (construídos sobre `@radix-ng/primitives` headless + o CSS `.nds-*` compartilhado)
- **Estilos**: usar as classes `.nds-*` (`docs/shared/styles/nds/`) — nunca CSS inline, nem `style="…"`, nem `[style]`
- **Ícones**: exclusivamente o pacote `lucide` (agnóstico de framework). **Não** `lucide-angular`: ele declara peer `@angular/core: 13.x - 21.x` e conflita com o Angular 22 deste pacote
- **Formulários**: `@angular/forms` (`NgControl`) + as diretivas `ndsForm` / `ndsFormField` / `ndsFormLabel` / `ndsFormMessage`. Não há biblioteca de validação de schema neste stack — ver §7 e `06-form-components.md`
- **Tipografia**: fonte do sistema definida no CSS base — a tipografia vem dos tokens `--text-*`; não cravar tamanho nem `line-height` fora do CSS compartilhado
- **Detecção de mudanças**: `provideZonelessChangeDetection()`. O Radix NG é signals-first; não introduza dependência de zone

---

## 2. Cores e tokens CSS

Formato obrigatório: **HSL sem vírgulas** (`220 44% 57%`). Proibidos: rgba, oklch, hex.

Tokens de superfície:

| Contexto | Tokens |
|---|---|
| Painéis de conteúdo (Dialog, Sheet, Drawer, Card) | `--card` / `--card-foreground` |
| Menus e overlays flutuantes (DropdownMenu, Popover, Tooltip) | `--popover` / `--popover-foreground` |
| Campos | `--input` / `--border` |
| Página | `--background` / `--foreground` |

Variante semântica é **input do componente**, nunca classe solta: `<div ndsAlert variant="warning">`, `<span ndsBadge variant="success">`.

> As guidelines de React e Vanilla afirmam que "Badge não tem essas variantes". A frase está **vencida**: `warning`, `success` e `info` existem no `.nds-badge-*` do CSS compartilhado e são expostas como variante no Badge deste stack e do Vanilla. Não replicar a frase antiga.

Ver `03-sistema-design.md`.

Referência completa: `03-sistema-design.md` e `../../docs/shared/guidelines/04-padroes-design-sistema.md`.

---

## 3. Acessibilidade — WCAG 2.2 AA obrigatório

**As três premissas do projeto, em ordem de prioridade:**
1. **Acessível** — WCAG 2.2 AA, todos os tipos de deficiência
2. **Rastreável** — analytics em toda a jornada
3. **Indexável** — SEO + GEO

Regras permanentes:
- `aria-label` contextual em todo elemento interativo ambíguo: formato `"[verbo] [objeto] [identificador]"` — ex: `"Excluir produto Cadeira Gamer Pro"`
- Ícones decorativos: `aria-hidden="true"`. Ícone funcional sem texto adjacente: `aria-label` no elemento pai
- Cor nunca é o único indicador de estado — sempre ícone + texto
- Em container colorido, **texto corrido é sempre `--foreground`**. Ícone e título podem carregar a cor semântica; descrição e corpo, não
- Foco visível vem do CSS compartilhado (`:focus-visible` de cada `.nds-*`), com anel **opaco**. Não recriar anel no componente, e nunca com opacidade
- **Altura não se crava** em primitivo interativo — nasce de `padding-block` mais tipografia, para o bloco crescer com a fonte do navegador (WCAG 1.4.4)
- Título e descrição obrigatórios em Dialog, AlertDialog, Sheet e Drawer — são a base do `aria-labelledby` / `aria-describedby`
- `<caption ndsTableCaption>` obrigatório em toda Table (pode ser `.nds-sr-only`); `scope` em todo `th ndsTableHead`
- `ndsTooltipProvider` no elemento raiz que contém tooltips
- Nível de heading é **o elemento** em que a diretiva de título é aplicada (`h2 ndsDialogTitle`, `h4 ndsAlertTitle`). Escolha o que preserva a hierarquia da página — nível fixo pula degrau e falha `heading-order` no axe

Referência completa: `../../docs/shared/guidelines/01-acessibilidade.md`.

---

## 4. Templates — caracteres especiais e blocos

Proibidos em nó de texto de template: `<` `>` `&` `"` `'` — usar `&lt;` `&gt;` `&amp;` `&quot;` `&#39;`.

Específico do Angular, e sem equivalente nas outras quatro stacks:

- `@` inicia bloco de controle de fluxo (`@if`, `@for`, `@switch`, `@defer`). `@` literal em texto vai como **`&#64;`**
- `{{` abre interpolação. `{` literal em texto vai como `&#123;`
- Expressão de template **não tem globais**: `String(...)`, `Object.keys(...)`, `JSON.stringify(...)` não existem ali. Exponha um `computed` no componente

Referência: `02-template-caracteres-especiais.md`.

---

## 5. Alinhamento de botões

- Primário sempre à **direita**
- DOM segue a ordem visual — inversão por CSS é **proibida**
- Ordem no DOM: `[secundário] [primário]` — confirmação sempre à direita

Referência: `../../docs/shared/guidelines/02-alinhamento-botoes.md`.

---

## 6. Edições parciais — preservação de conteúdo

Ao editar qualquer seção de um arquivo existente:
- Preservar **todos** os imports, mesmo os não usados na seção editada — inclusive o array `imports:` do `@Component`, onde diretiva faltando **não dá erro de build** (ver `13-system-design.md`)
- Preservar exports, interfaces e tipos intactos
- Não modificar código fora do escopo solicitado

Referência: `../../docs/shared/guidelines/03-edicoes-parciais.md`.

---

## 7. Componentes — regras de API

Nunca inventar input, output ou diretiva que não existe. Casos frequentes neste stack:

| Situação | Errado | Correto |
|---|---|---|
| Classe extra no componente | criar input `class` | escrever `class="…"` no elemento — o Angular mescla |
| Componente sem template próprio | `@Component` com `template: ''` | `@Directive` |
| Compor gatilho com visual de botão | prop `asChild` | duas diretivas no mesmo elemento (`<button ndsDialogTrigger ndsButton>`) — ver §8 |
| Ler input na inicialização | ler no `constructor` | ler em `ngOnInit` |
| Validação de formulário por schema | biblioteca de schema | `@angular/forms` + `ndsFormMessage` |
| Redimensionar coluna de DataTable | flag de resize | **não existe neste stack** — ver `08-display-components.md` |
| Gráfico por biblioteca de dados | importar lib de gráfico | `<div ndsChart>` desenha SVG próprio — ver `08-display-components.md` |

Gatilho de overlay é sempre uma **diretiva de atributo** no elemento nativo: `ndsDialogTrigger`, `ndsSheetTrigger`, `ndsDrawerTrigger`, `ndsAlertDialogTrigger`, `ndsDropdownMenuTrigger`, `ndsPopoverTrigger`, `ndsTooltipTrigger`, `ndsCollapsibleTrigger`.

Referência por categoria: `04-layout-components.md` a `10-overlay-components.md`.

---

## 8. `data-slot` é contrato — duas diretivas no mesmo elemento disputam

`data-slot` é ligado por host binding em quase todo componente deste stack, e é o contrato de markup que as cinco stacks compartilham e que a auditoria compara.

Com duas diretivas no mesmo host — `<button ndsSidebarMenuButton ndsTooltipTrigger>`, `<button ndsDialogClose ndsButton>`, `<input ndsInput ndsInputGroupInput>` — as duas escrevem o mesmo atributo e uma sobrescreve a outra, **sem ordem garantida e sem erro**. O elemento perde a identidade que os testes e o CSS usam para achá-lo.

Quando compor for inevitável: a peça que se compõe **não** liga `data-slot`, ou traz a classe base junto para dispensar a outra diretiva. **Em teste, procure pela classe `.nds-*`, não pelo `data-slot`.**

Referência: `13-system-design.md` §Composição de diretivas.

---

## 9. Analytics

Tracking na **camada de produto** — nunca dentro de `src/components/ui/`.

Formato de evento: `objeto_ação` em snake_case inglês (`button_click`, `dialog_open`).

Payload base: `{ component, variant?, location, label? }`. Valores estáveis (slug, `side`, `variant`) — **nunca texto traduzido**, que dividiria um evento em três no GA4.

Todo evento usado nas docs pages existe tipado em `AnalyticsEvents` (`src/lib/analytics.ts`). Nunca chamar `gtag()` direto — use `track()`.

Não rastrear `value` de campo sensível (senha, CPF, cartão).

Referência completa: `../../docs/shared/guidelines/07-analytics.md`.

---

## 10. Navegação — Storybook como interface principal

A interface principal de documentação é o **Storybook** (`npm run storybook`, porta **6010**). Novos componentes são adicionados criando stories — este pacote não tem sandbox `App`/`main` a registrar.

Para adicionar um componente: criar `*Docs.ts` + as stories. O conteúdo vem de `docs/shared/content/<slug>/translations.json`. Ver `12-arquitetura-projeto.md`.

---

## 11. Tom de voz

Tratamento: **"você"** — nunca "tu", "o usuário", "deve-se". Nível semi-formal.

Regras rápidas:
- Labels: substantivo, sem dois-pontos, sem ponto final, capitalização na primeira palavra
- Placeholders: exemplo real ("ex: joao@empresa.com") — nunca instrução
- Erros: causa + orientação, sem culpar
- Botões: verbo no infinitivo, máximo 3 palavras, sem pontuação
- Tooltip: complementa o label visível, não repete
- Dialog destrutivo: título = ação, descrição = consequência, botão primário = repete o verbo

Nomes de story e de export são **em inglês** (a sidebar do Storybook é vocabulário único em inglês, auditado). O que o leitor vê nas docs pages é português comum, vindo do conteúdo compartilhado.

Referência completa: `../../docs/shared/guidelines/05-tom-de-voz.md`.

---

## 12. SEO e GEO (iframe do Storybook)

Toda docs page chama `applySeo` de `@/lib/use-seo` dentro de um `effect` que lê o dicionário — assim título, descrição, hreflang, og:* e JSON-LD se refazem na troca de idioma.

`seo.title` no `translations.json` **não** carrega `· Design System`; `applySeo` acrescenta.

Referência completa: `../../docs/shared/guidelines/06-seo-geo.md`.

---

## 13. Segurança — XSS

`[innerHTML]` recebe `DOMPurify.sanitize()` **no próprio binding**, com `protected readonly DOMPurify = DOMPurify` expondo o módulo ao template.

Não criar `computed` `safe*` nem helper local: o `[innerHTML]` do Angular já passa pelo DomSanitizer do framework, mas a exigência não é redundância defensiva — é que as ferramentas de SAST só reconhecem o sanitizador de taint quando a chamada está no call site. Wrapper vira falso positivo permanente de XSS.

Referência completa: `../../docs/shared/guidelines/09-seguranca-xss.md`.

---

## 14. Arquitetura — restrições

- Espaçamento em múltiplos de 8px, pela escada `--spacing-*`
- Estado de componente exposto em `data-*` (`data-state`, `data-slot`, `data-variant`) — é o que o CSS e os testes leem
- Comunicação de dentro para fora é `output()`; de fora para dentro é `input()`. Estado de duas vias é `model()`
- `ViewEncapsulation.None` em todo componente de UI — o visual inteiro vem do CSS global compartilhado
- Arquivos pequenos; helpers em arquivo separado
- **`tsconfig.json` deste pacote não pode ter `noEmit: true`** — mata o AOT e o sintoma é silencioso. Ver `12-arquitetura-projeto.md`

Referência: `12-arquitetura-projeto.md` e `13-system-design.md`.
