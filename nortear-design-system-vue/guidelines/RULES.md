# Rules — Design System Nortear (Vue)

O que é **específico do Vue**. Tudo o que vale igual nas cinco stacks está nas
guidelines compartilhadas e não se repete aqui — ver a tabela no fim.

> Enxugado em 2026-09-10. Este arquivo tinha doze seções, e sete eram cópia das
> guidelines compartilhadas, reescritas de cinco jeitos (uma por stack) e com
> erros que a original não tinha: espaçamento "em múltiplos de 8px" (a base é
> 4px), painéis de overlay em `--card` (nenhuma folha lê), `data-track-label`
> igual ao texto visível (é id estável), formulários com Vee-Validate + Zod
> (nenhum dos dois é importado em `src/`) e exemplo de título de SEO com o sufixo
> que o `useSeoEffect` já acrescenta. Cópia de regra transversal é o que
> envelhece: a original é corrigida, e a cópia fica.

---

## 1. Stack obrigatória

- **Componentes**: os de `./src/components/ui/`, construídos sobre `reka-ui` — o Drawer usa `vaul-vue` — mais o CSS `.nds-*` compartilhado
- **Estilos**: o vocabulário é `.nds-*`, de `docs/shared/styles/nds/`, importado pelo `./src/styles/globals.css`. Valor de desenho nunca vai em `style` inline — regra canônica em `12-tokenizacao-dimensoes.md`
- **Ícones**: exclusivamente `lucide-vue-next`
- **Formulários**: `FormField` e `Fieldset`, de `./src/components/ui/form/` — composição própria, sem biblioteca de formulário nem de validação por schema. `vee-validate` e `@vee-validate/zod` estão no `package.json` e não são importados em lugar nenhum de `src/`
- **Estado global**: Pinia. A docs page lê o idioma de `useTranslation()`, **nunca** de uma store — foi um crash em produção
- **Tipografia**: a escala vem das classes `.nds-text-*` de `typography.css`; não recriar tamanho nem altura de linha com utilitária avulsa

---

## 2. Templates Vue — caracteres especiais

Proibidos em conteúdo de texto de template: `<` `>` `&` `"` `'`. Usar entidades
HTML: `&lt;` `&gt;` `&amp;` `&quot;` `&#39;`.

```html
<!-- ❌ <span>Valor A > Valor B</span> -->
<!-- ✅ <span>Valor A &gt; Valor B</span> -->
```

Referência: `02-template-caracteres-especiais.md`.

---

## 3. Componentes — regras de API (Reka UI)

Nunca inventar props que não existem. Casos frequentes:

| Componente | Prop inexistente | Correto |
|------------|-----------------|---------|
| Badge | `size` | dimensão única; caso pontual sobrescreve as vars internas escopadas (`--badge-bg` etc.) |
| Drawer | prop `side` | `direction` no `<Drawer>` |
| Select | busca integrada | usar Combobox |

> **O Avatar TEM prop `size`.** Esta tabela já a listava como inexistente, mandando dimensionar por variável escopada. É falso: `size` aceita `sm` (24px), `md` (32px, padrão), `lg` (40px), `xl` (48px) e `2xl` (64px), chega ao DOM como `data-size` e a folha `.nds-avatar[data-size]` deriva dela também as iniciais, o badge de status e o contador do grupo. `--avatar-size` continua existindo, mas como escape para medida fora dos cinco presets — não como o caminho normal.

Gatilhos de overlay compõem com `as-child`:
`CollapsibleTrigger`, `DialogTrigger`, `SheetTrigger`, `AlertDialogTrigger`, `DropdownMenuTrigger`, `PopoverTrigger`, `TooltipTrigger`.

O que cada componente É — contrato, decisões, tokens, peças das cinco stacks — está em `../../docs/shared/prd/<slug>.md` quando o PRD existe, e nas guidelines de categoria (`04-` a `09-`) quando ainda não.

---

## 4. Stories, docs page e SEO

- O Storybook é a **única** interface (`npm run storybook`, porta 6007). Componente novo entra por story; não há sandbox de aplicação, nem `dev` nem `preview`. Detalhe em `12-arquitetura-projeto.md`
- `npm run build` é `vue-tsc -b`: só checa tipos, não emite. Quem empacota o SFC e resolve `@import` de CSS é o `npm run build-storybook`, que produz o `storybook-static/` publicado
- Stories importam de `@storybook/vue3-vite`; a docs page é `*Docs.vue`, com o conteúdo em `docs/shared/content/<slug>/translations.json`
- SEO: o composable `useSeoEffect`, de `@/lib/use-seo`. O `seo.title` do conteúdo vai **sem** o sufixo "· Design System" — o composable o acrescenta

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
