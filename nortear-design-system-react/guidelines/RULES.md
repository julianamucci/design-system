# Rules — Design System Nortear (React)

O que é **específico do React**. Tudo o que vale igual nas cinco stacks está nas
guidelines compartilhadas e não se repete aqui — ver a tabela no fim.

> Enxugado em 2026-09-10. Este arquivo tinha doze seções, e sete eram cópia das
> guidelines compartilhadas, reescritas de cinco jeitos (uma por stack) e com
> erros que a original não tinha: espaçamento "em múltiplos de 8px" (a base é
> 4px), painéis de overlay em `--card` (nenhuma folha lê), `data-track-label`
> igual ao texto visível (é id estável), formulários com React Hook Form + Zod
> (nenhum dos dois é importado) e exemplo de título de SEO com o sufixo que o
> `useSeoEffect` já acrescenta. Cópia de regra transversal é o que envelhece: a
> original é corrigida, e a cópia fica.

---

## 1. Stack obrigatória

- **Componentes**: os de `./src/components/ui/`, construídos sobre `@base-ui/react` — o Drawer usa `vaul` — mais o CSS `.nds-*` compartilhado
- **Estilos**: classes `.nds-*` de `docs/shared/styles/nds/`. Valor de desenho nunca vai em `style` inline — regra canônica em `12-tokenizacao-dimensoes.md`
- **Ícones**: exclusivamente `lucide-react`
- **Formulários**: `FormField` e `Fieldset`, de `form.tsx` — composição própria sobre React, sem biblioteca de formulário nem de validação por schema. Estado e validação são de quem consome
- **Tipografia**: a escada vem dos tokens `--text-*`; não cravar tamanho nem `line-height` por cima

---

## 2. JSX — caracteres especiais

Proibidos em conteúdo de texto JSX: `<` `>` `&` `"` `'`. Usar entidades HTML:
`&lt;` `&gt;` `&amp;` `&quot;` `&#39;`.

```tsx
// ❌ <span>Valor A > Valor B</span>
// ✅ <span>Valor A &gt; Valor B</span>
```

Referência: `02-jsx-caracteres-especiais.md`.

---

## 3. Componentes — regras de API

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

O que cada componente É — contrato, decisões, tokens, peças das cinco stacks — está em `../../docs/shared/prd/<slug>.md` quando o PRD existe, e nas guidelines de categoria (`04-` a `09-`) quando ainda não.

---

## 4. Stories, docs page e SEO

- O Storybook é a **única** interface (`npm run storybook`, porta 6006). Componente novo entra por story; não há sandbox de aplicação. Detalhe em `12-arquitetura-projeto.md`
- Stories importam de `@storybook/react-vite`; a docs page é `*Docs.tsx`, com o conteúdo em `docs/shared/content/<slug>/translations.json`
- SEO: o hook `useSeoEffect`, de `@/lib/use-seo`. O `seo.title` do conteúdo vai **sem** o sufixo "· Design System" — o hook o acrescenta

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
