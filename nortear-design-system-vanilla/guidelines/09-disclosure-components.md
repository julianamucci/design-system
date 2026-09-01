# Disclosure Components (Nortear — Vanilla TypeScript)

---

## Accordion

**Propósito**: mostrar e ocultar seções de conteúdo relacionado em uma lista vertical. Para mostrar/ocultar um único bloco isolado, usar **Collapsible**.

**API e exemplos**: `src/components/ui/accordion.ts` + stories + `AccordionDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Quando usar**: FAQs, configurações avançadas, conteúdo agrupável onde nem tudo precisa estar visível ao mesmo tempo.

**Estrutura**:

```
div container
└── .nds-accordion-item (data-value) — a folha divide um item do outro
    ├── button trigger (aria-expanded, aria-controls)
    │   ├── label
    │   └── chevron (aria-hidden, transition-transform)
    └── div content (role="region", aria-labelledby, hidden quando colapsado)
        └── inner (padding 8-grid)
```

**Opts da factory**:

| Nome | Default | Função |
|---|---|---|
| `items` | — | Array `{ value, trigger, content }` |
| `type` | `single` | `single` (1 aberto por vez) ou `multiple` |
| `collapsible` | `true` | Permite fechar o item atual em `single` |

**Regras**:
- Cada item com `value` único — IDs derivam dele (`accordion-trigger-${value}`)
- Trigger é `<button type="button">`, nunca `<div>`
- `aria-expanded` no trigger reflete o estado real
- `aria-controls` no trigger aponta ao ID do content
- Content com `role="region"` + `aria-labelledby` apontando ao trigger
- Colapsado: `content.hidden = true` (não apenas classe CSS)
- O giro do chevron é da folha: `.nds-accordion-icon` gira por `data-state`, e o bloco `@media (prefers-reduced-motion: reduce)` de `accordion.css` já o para. A redução de movimento é regra do sistema, cumprida em cada folha — não é uma classe a pendurar no elemento. Só animação AUTORAL, fora das folhas, precisa se declarar, e para isso existe `.nds-motion-reduce-none`
- Padding do trigger e content em `--spacing-4` (8-grid)

**Acessibilidade**:
- Navegação por teclado: Setas ↑↓ entre triggers, Home/End para primeiro/último
- Foco visível obrigatório no trigger: anel de 2px lendo `--ring` em 100% da cor, pelo `:focus-visible` da folha do accordion ou por `.nds-focus-ring`
- Conteúdo focável dentro do panel é alcançável apenas quando expandido

**Analytics**: emitir `accordion_expand` / `accordion_collapse` com `{ label }` no clique.

---

## Collapsible

**Propósito**: mostrar e ocultar um único bloco de conteúdo controlado por um trigger externo.

**API e exemplos**: `src/components/ui/collapsible.ts` + stories + `CollapsibleDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
div container
├── trigger (qualquer elemento focável; recebe aria-expanded e aria-controls)
└── content (id único, hidden quando colapsado)
```

**Opts da factory**:

| Nome | Default | Função |
|---|---|---|
| `trigger` | — | Elemento (botão) que controla a abertura |
| `content` | — | Elemento que será mostrado/ocultado |
| `open` | `false` | Estado inicial |
| `ariaLabel` | — | `{ open, close }` para alternar `aria-label` do trigger |

**Regras**:
- `aria-expanded` no trigger atualizado em cada toggle
- `aria-controls` no trigger aponta ao ID do content
- Content com `hidden` (atributo nativo, não apenas classe)
- Para múltiplos itens irmãos, prefira Accordion
- Quando o trigger não tem texto visível, fornecer `ariaLabel.open` e `ariaLabel.close`
- Padding e gap em múltiplos de 8 (`--spacing-*`)

**Acessibilidade**:
- `aria-expanded` obrigatório
- `aria-controls` apontando ao content
- Trigger sempre focável via teclado
