# Rules — Design System Nortear (Vanilla TypeScript)

O que é **específico do vanilla**. Tudo o que vale igual nas cinco stacks está nas
guidelines compartilhadas e não se repete aqui — ver a tabela no fim.

Esta é a stack de **referência**: sem lib headless, o que está aqui é o que o
design system de fato define, e nas divergências de markup, classe ou
comportamento as outras quatro se alinham a ela.

> Enxugado em 2026-09-10. Este arquivo tinha doze seções, e sete eram cópia das
> guidelines compartilhadas, reescritas de cinco jeitos (uma por stack) e com
> erros que a original não tinha: espaçamento "em múltiplos de 8px" (a base é
> 4px), painéis de overlay em `--card` (nenhuma folha lê), `data-track-label`
> igual ao texto visível (é id estável), `aria-describedby` obrigatório em todo
> painel (a descrição é opcional no Drawer e no AlertDialog) e exemplo de título
> de SEO com o sufixo que a função já acrescenta. Nas seções próprias da stack:
> SEO por `applyStorybookSeo` (não existe; é `applySeo`), stories importando de
> `@storybook/html` (as 304 importam de `@storybook/html-vite`), formulários com
> Zod (zero imports) e comunicação por `CustomEvent` (nenhuma fábrica despacha;
> são callbacks nas opções, em 68 arquivos).

---

## 1. Stack obrigatória

- **Componentes**: fábricas TypeScript que montam e devolvem `HTMLElement` — `createNome(options)` —, em `./src/components/ui/`
- **Estilos**: classes `.nds-*` de `docs/shared/styles/nds/`, importadas pelo `./src/styles/globals.css`. Não há framework de classe utilitária: classe sem o prefixo `nds-` é inerte. Valor de desenho nunca vai em `style` inline — regra canônica em `12-tokenizacao-dimensoes.md`
- **Ícones**: exclusivamente o pacote `lucide` (agnóstico)
- **Formulários**: HTML nativo, com `createFormField` e `createFieldset` — sem biblioteca de formulário nem de validação por schema
- **Composição de classe**: `cn()`, de `@/lib/utils`

---

## 2. Template literals e `innerHTML`

Texto de usuário vai por `textContent`, que escapa sozinho. `innerHTML` só com
conteúdo sanitizado por `DOMPurify.sanitize()` **no próprio call site** — sem
wrapper, para o SAST reconhecer o sanitizador (`09-seguranca-xss.md`).

Em template literal que vira `innerHTML`, os caracteres `<` `>` `&` `"` `'` de
texto vão como entidade: `&lt;` `&gt;` `&amp;` `&quot;` `&#39;`.

```ts
// ❌ btn.innerHTML = `<span>Valor A > Valor B</span>`
// ✅ btn.textContent = 'Valor A > Valor B'
```

Referência: `02-template-caracteres-especiais.md`.

---

## 3. Componentes — regras de API

```ts
export function createButton(options: ButtonOptions): HTMLButtonElement
export function createDialog(options: DialogOptions): HTMLElement
```

- Nunca inventar opção que não existe na interface
- **Estado** vai em atributo `data-*` no elemento (`data-state="open"`, `data-variant="default"`), que é o que a folha lê
- **Comunicação** é por callback nas opções — `onOpenChange`, `onSelect`, `onClose`. Não há `CustomEvent`: nenhuma fábrica despacha um
- **Opção que monta só uma peça** chama o nível do título de `level` (`createPopoverTitle`, `createCardTitle`); **fábrica que monta o componente inteiro** chama de `titleLevel` (`createDialog`, `createSheet`, `createDrawer`, `createAlertDialog`). O nome é relativo ao escopo, e não é divergência

O que cada componente É — contrato, decisões, tokens, peças das cinco stacks — está em `../../docs/shared/prd/<slug>.md` quando o PRD existe, e nas guidelines de categoria (`04-` a `09-`) quando ainda não.

---

## 4. Stories, docs page e SEO

- O Storybook é a **única** interface (`npm run storybook`, porta 6009). Componente novo entra por story; não há sandbox de aplicação. Detalhe em `12-arquitetura-projeto.md`
- Stories importam de `@storybook/html-vite`, e o `render` devolve `HTMLElement`; a docs page é `*Docs.ts`, uma função que devolve `HTMLElement`, com o conteúdo em `docs/shared/content/<slug>/translations.json`
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
