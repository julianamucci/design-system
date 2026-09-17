# Rules — Design System Nortear (Angular)

O que é **específico do Angular**. Tudo o que vale igual nas cinco stacks está
nas guidelines compartilhadas e não se repete aqui — ver a tabela no fim.

> Enxugado em 2026-09-10. Este arquivo tinha catorze seções, e sete eram cópia
> das guidelines compartilhadas, reescritas de cinco jeitos (uma por stack) e com
> erros que a original não tinha: espaçamento "em múltiplos de 8px" (a base é
> 4px), painéis de overlay em `--card` (nenhuma folha lê) e `aria-describedby`
> obrigatório em todo painel (a descrição é opcional no Drawer e no
> AlertDialog). Cópia de regra transversal é o que envelhece: a original é
> corrigida, e a cópia fica.

---

## 1. Stack obrigatória

- **Componentes**: os de `./src/components/ui/`, construídos sobre `@radix-ng/primitives` (headless) mais o CSS `.nds-*` compartilhado
- **Estilos**: classes `.nds-*` de `docs/shared/styles/nds/` — nunca CSS inline, nem `style="…"`, nem `[style]` com valor de desenho (`12-tokenizacao-dimensoes.md`)
- **Ícones**: exclusivamente o pacote `lucide` (agnóstico de framework). **Não** `lucide-angular`: ele declara peer `@angular/core: 13.x - 21.x` e conflita com o Angular 22 deste pacote
- **Formulários**: `@angular/forms` (`NgControl`) mais as diretivas `ndsForm` / `ndsFormField` / `ndsFormLabel` / `ndsFormMessage`. Não há biblioteca de validação por schema nesta stack — ver `06-form-components.md`
- **Tipografia**: a escada vem dos tokens `--text-*`; não cravar tamanho nem `line-height` fora do CSS compartilhado
- **Detecção de mudanças**: `provideZonelessChangeDetection()`. O Radix NG é signals-first; não introduza dependência de zone

---

## 2. Templates — caracteres especiais e blocos

Proibidos em nó de texto de template: `<` `>` `&` `"` `'` — usar `&lt;` `&gt;` `&amp;` `&quot;` `&#39;`.

Específico do Angular, sem equivalente nas outras quatro stacks:

- `@` inicia bloco de controle de fluxo (`@if`, `@for`, `@switch`, `@defer`). `@` literal em texto vai como **`&#64;`**
- `{{` abre interpolação. `{` literal em texto vai como `&#123;`
- Expressão de template **não tem globais**: `String(...)`, `Object.keys(...)`, `JSON.stringify(...)` não existem ali. Exponha um `computed` no componente

Referência: `02-template-caracteres-especiais.md`.

---

## 3. Componentes — regras de API

Nunca inventar input, output ou diretiva que não existe. Casos frequentes nesta stack:

| Situação | Errado | Correto |
|---|---|---|
| Classe extra no componente | criar input `class` | escrever `class="…"` no elemento — o Angular mescla |
| Componente sem template próprio | `@Component` com `template: ''` | `@Directive` |
| Compor gatilho com visual de botão | prop `asChild` | duas diretivas no mesmo elemento (`<button ndsDialogTrigger ndsButton>`) — ver §4 |
| Ler input na inicialização | ler no `constructor` | ler em `ngOnInit` |
| Validação de formulário por schema | biblioteca de schema | `@angular/forms` + `ndsFormMessage` |
| Redimensionar coluna de DataTable | flag de resize | **não existe nesta stack** — ver `08-display-components.md` |
| Gráfico | montar `echarts` na página, ou passar `option` pronta | `<div ndsChart type="bar" [xAxis] [series] label>` — a lib é interna ao componente; ver `08-display-components.md` |

Gatilho de overlay é sempre uma **diretiva de atributo** no elemento nativo: `ndsDialogTrigger`, `ndsSheetTrigger`, `ndsDrawerTrigger`, `ndsAlertDialogTrigger`, `ndsDropdownMenuTrigger`, `ndsPopoverTrigger`, `ndsTooltipTrigger`, `ndsCollapsibleTrigger`.

Contrato de componente:

- De dentro para fora é `output()`; de fora para dentro é `input()`; estado de duas vias é `model()`
- Estado exposto em `data-*` (`data-state`, `data-slot`, `data-variant`) — é o que o CSS e os testes leem
- Componente de UI usa `ViewEncapsulation.None`: o visual inteiro vem do CSS global compartilhado, e encapsulamento de estilo não tem o que proteger

O que cada componente É — contrato, decisões, tokens, peças das cinco stacks — está em `../../docs/shared/prd/<slug>.md` quando o PRD existe, e nas guidelines de categoria (`04-` a `10-`) quando ainda não.

---

## 4. `data-slot` é contrato — duas diretivas no mesmo elemento disputam

`data-slot` é ligado por host binding em quase todo componente desta stack, e é o contrato de markup que as cinco stacks compartilham e que a auditoria compara.

Com duas diretivas no mesmo host — `<button ndsSidebarMenuButton ndsTooltipTrigger>`, `<button ndsDialogClose ndsButton>`, `<input ndsInput ndsInputGroupInput>` — as duas escrevem o mesmo atributo e uma sobrescreve a outra, **sem ordem garantida e sem erro**. O elemento perde a identidade que os testes e o CSS usam para achá-lo.

Quando compor for inevitável: a peça que se compõe **não** liga `data-slot`, ou traz a classe base junto para dispensar a outra diretiva. **Em teste, procure pela classe `.nds-*`, não pelo `data-slot`.**

Referência: `13-system-design.md` §Composição de diretivas.

---

## 5. Stories, docs page, SEO e XSS

- O Storybook é a interface de documentação (`npm run storybook`, porta **6010**); este pacote nunca teve sandbox `App`/`main`. Componente novo entra por story. Detalhe em `12-arquitetura-projeto.md`
- Stories importam de `@storybook/angular-vite`; a docs page é `*Docs.ts`, com o conteúdo em `docs/shared/content/<slug>/translations.json`
- **`tsconfig.json` deste pacote não pode ter `noEmit: true`** — mata o AOT, e o sintoma é silencioso. Ver `12-arquitetura-projeto.md`
- **SEO**: a docs page chama `applySeo`, de `@/lib/use-seo`, dentro de um `effect` que lê o dicionário — assim título, descrição, hreflang, og:* e JSON-LD se refazem na troca de idioma. O `seo.title` do conteúdo vai **sem** "· Design System"; `applySeo` acrescenta
- **XSS**: `[innerHTML]` recebe `DOMPurify.sanitize()` **no próprio binding**, com `protected readonly DOMPurify = DOMPurify` expondo o módulo ao template. Não criar `computed` `safe*` nem helper local: o `[innerHTML]` do Angular já passa pelo DomSanitizer, mas as ferramentas de SAST só reconhecem o sanitizador quando a chamada está no call site — wrapper vira falso positivo permanente

---

## Regras transversais — onde estão

Valem nas cinco stacks e moram em `docs/shared/guidelines/`:

| assunto | guideline |
|---|---|
| acessibilidade (WCAG 2.2 AA, anel de foco) | [01-acessibilidade.md](../../docs/shared/guidelines/01-acessibilidade.md) |
| alinhamento de botões | [02-alinhamento-botoes.md](../../docs/shared/guidelines/02-alinhamento-botoes.md) |
| edições parciais | [03-edicoes-parciais.md](../../docs/shared/guidelines/03-edicoes-parciais.md) |
| cores, tokens, elevação, camadas | [04-padroes-design-sistema.md](../../docs/shared/guidelines/04-padroes-design-sistema.md) |
| tom de voz | [05-tom-de-voz.md](../../docs/shared/guidelines/05-tom-de-voz.md) |
| SEO e GEO | [06-seo-geo.md](../../docs/shared/guidelines/06-seo-geo.md) |
| analytics — eventos, payload, `data-track*` | [07-analytics.md](../../docs/shared/guidelines/07-analytics.md) |
| sanitização de HTML dinâmico | [09-seguranca-xss.md](../../docs/shared/guidelines/09-seguranca-xss.md) |
| dimensões em token, `style` inline | [12-tokenizacao-dimensoes.md](../../docs/shared/guidelines/12-tokenizacao-dimensoes.md) |
| movimento e `prefers-reduced-motion` | [13-animacao.md](../../docs/shared/guidelines/13-animacao.md) |
| regras da categoria Overlay | [18-overlay.md](../../docs/shared/guidelines/18-overlay.md) |
| regras da categoria Feedback | [19-feedback.md](../../docs/shared/guidelines/19-feedback.md) |
| regras da categoria Tabelas | [20-tabelas.md](../../docs/shared/guidelines/20-tabelas.md) |
| regras da categoria Navegação | [21-navegacao.md](../../docs/shared/guidelines/21-navegacao.md) |
