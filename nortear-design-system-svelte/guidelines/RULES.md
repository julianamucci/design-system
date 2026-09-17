# Rules — Design System Nortear (Svelte)

O que é **específico do Svelte**. Tudo o que vale igual nas cinco stacks está nas
guidelines compartilhadas e não se repete aqui — ver a tabela no fim.

> Enxugado em 2026-09-10. Este arquivo tinha doze seções, e sete eram cópia das
> guidelines compartilhadas, reescritas de cinco jeitos (uma por stack) e com
> erros que a original não tinha: espaçamento "em múltiplos de 8px" (a base é
> 4px), painéis de overlay em `--card` (nenhuma folha lê), `data-track-label`
> igual ao texto visível (é id estável), e exemplo de título de SEO com o sufixo
> que a função já acrescenta. Nas seções próprias da stack os erros eram outros e
> igualmente medidos: ícones de `lucide-svelte` (a stack importa de
> `@lucide/svelte`), componentes em `$lib/components/ui` (zero imports; são 478 de
> `@/components/ui`), formulários com Superforms + Zod (declarados, e
> nenhum importado — saíram do `package.json` em 2026-09-10), gatilhos com `asChild` (a composição do bits-ui 2 é o snippet
> `child`) e SEO por `useSeoEffect` (a stack exporta `applySeo`).

---

## 1. Stack obrigatória

- **Componentes**: os de `./src/components/ui/`, importados por `@/components/ui/…`, construídos sobre `bits-ui` — o Drawer usa `vaul-svelte` — mais o CSS `.nds-*` compartilhado
- **Estilos**: classes `.nds-*` de `docs/shared/styles/nds/`, importadas pelo `./src/styles/globals.css`. Valor de desenho nunca vai em `style` inline — regra canônica em `12-tokenizacao-dimensoes.md`
- **Ícones**: exclusivamente `@lucide/svelte`, por caminho de ícone (`@lucide/svelte/icons/check`)
- **Formulários**: `FormField` e `Fieldset`, de `./src/components/ui/form/` — composição própria, sem biblioteca de formulário nem de validação por schema
- **Tipografia**: a escada de texto vem dos tokens (`--text-h1` … `--text-label`) e os elementos HTML já a herdam do CSS base. Não escrever tamanho nem `line-height` por cima: a escada responde ao eixo de fonte e à densidade, e um valor cravado sai fora dos dois

---

## 2. Templates Svelte — caracteres especiais

Proibidos em conteúdo de texto literal: `<` `>` `&` `"` `'`. Usar entidades HTML:
`&lt;` `&gt;` `&amp;` `&quot;` `&#39;`. Expressão `{variavel}` é segura — o
compilador escapa.

```svelte
<!-- ❌ <span>Valor A > Valor B</span> -->
<!-- ✅ <span>Valor A &gt; Valor B</span> -->
```

**Expressão que é string literal não é tradução.** `{('demonstration.labels.x')}`
é Svelte válido, o `svelte-check` fecha sem erro, e a página renderiza o NOME DA
CHAVE. Onde a mudança é de fiação de i18n, o portão que enxerga é o `eslint`
(`svelte/no-useless-mustaches`), não o build.

Referência: `02-template-caracteres-especiais.md`.

---

## 3. Componentes — regras de API (Bits UI)

Nunca inventar props que não existem. Casos frequentes:

| Componente | Prop inexistente | Correto |
|------------|-----------------|---------|
| Badge | `size` | `class` própria |
| Drawer | prop `side` | `direction` no `<Drawer.Root>` |
| Select | busca integrada | usar Combobox |

**O Avatar TEM prop `size`** — `sm` / `md` / `lg` / `xl` / `2xl`, com o padrão em
`md`. O preset não escreve uma altura: a folha deriva dele o diâmetro, o corpo das
iniciais, o selo de status e o recuo do grupo empilhado — e é por isso que fixar
altura por fora desalinha os três últimos. Detalhe em
`08-display-components.md` §Avatar.

**Gatilho de overlay compõe pelo snippet `child`**, que é a delegação de elemento
do bits-ui 2: o gatilho entrega as props de acessibilidade e o elemento alvo as
espalha — `{#snippet child({ props })}<Button {...props}>…</Button>{/snippet}`.
Não é `asChild` nem o `builders` do bits-ui antigo. Vale para
`Collapsible.Trigger`, `Dialog.Trigger`, `Sheet.Trigger`, `AlertDialog.Trigger`,
`DropdownMenu.Trigger`, `Popover.Trigger` e `Tooltip.Trigger`.

O que cada componente É — contrato, decisões, tokens, peças das cinco stacks — está em `../../docs/shared/prd/<slug>.md` quando o PRD existe, e nas guidelines de categoria (`04-` a `09-`) quando ainda não.

---

## 4. Stories, docs page e SEO

- O Storybook é a **única** interface (`npm run storybook`, porta 6008). Componente novo entra por story; não há sandbox de aplicação. Detalhe em `12-arquitetura-projeto.md`
- Stories importam de `@storybook/svelte-vite`; a docs page é `*Docs.svelte`, com o conteúdo em `docs/shared/content/<slug>/translations.json`
- SEO: a função `applySeo`, de `@/lib/use-seo`. O `seo.title` do conteúdo vai **sem** o sufixo "· Design System" — a função o acrescenta

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
