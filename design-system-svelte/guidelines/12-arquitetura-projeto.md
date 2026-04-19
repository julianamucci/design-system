# Arquitetura do Projeto — Design System Svelte (Storybook-Centric)

> **Referência primária:** Leia `STORYBOOK-ARCHITECTURE.md` antes de qualquer tarefa de documentação ou stories.

---

## Interface Principal

O **Storybook** é a interface de documentação principal.

```bash
npm run storybook      # porta 6006 — interface principal
npm run dev            # sandbox de desenvolvimento (App.svelte) — uso secundário
```

`App.svelte` é um **sandbox**. Novos componentes **não precisam** ser registrados nele.

---

## Estrutura de Diretórios

```
design-system-svelte/
├── .storybook/
│   ├── main.ts                  # Addons, stories glob, framework
│   ├── preview.ts               # Parâmetros globais, decorators, toolbar
│   ├── preview-head.html        # GA4 + script de sync de tema (iframe)
│   └── test-runner.ts           # axe-playwright: a11y em todas as stories
│
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ui/              # Primitivos (shadcn-svelte/Bits UI) + stories
│   │   │   │   ├── alert/
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── Alert.svelte
│   │   │   │   │   ├── AlertTitle.svelte
│   │   │   │   │   └── AlertDescription.svelte
│   │   │   │   ├── alert.stories.ts
│   │   │   │   ├── alert-variantes.stories.ts
│   │   │   │   ├── alert-estados.stories.ts
│   │   │   │   └── alert-composicoes.stories.ts
│   │   │   │
│   │   │   ├── docs/            # Páginas de documentação
│   │   │   │   ├── AlertDocs.svelte
│   │   │   │   ├── content/
│   │   │   │   │   └── alert/
│   │   │   │   │       └── translations.json
│   │   │   │   └── shared/
│   │   │   │       ├── DocsHeader.svelte
│   │   │   │       ├── DocsSection.svelte
│   │   │   │       └── DocsNav.svelte
│   │   │   │
│   │   │   └── product/
│   │   │       └── LanguageSwitcher.svelte
│   │   │
│   │   ├── i18n.ts              # Store Svelte 5 + hook useTranslation
│   │   ├── analytics.ts         # Wrapper GA4 tipado
│   │   ├── use-seo.ts           # applyStorybookSeo (detecta iframe)
│   │   ├── sanitize-html.ts     # Sanitizador para {@html}
│   │   ├── withAutoDocsTab.ts   # HOC Storybook: aba "API Reference"
│   │   └── utils.ts             # cn() e utilitários
│   │
│   ├── i18n/
│   │   └── ui.json              # Traduções da UI chrome
│   │
│   └── styles/
│       ├── globals.css          # Tailwind + tokens CSS
│       └── storybook-docs.css   # Overrides para Docs tab
│
├── chromatic.config.json
└── STORYBOOK-ARCHITECTURE.md
```

---

## Navegação

Sidebar configurada via `storySort` em `.storybook/preview.ts`:

```ts
storySort: {
  order: [
    'Foundations',
    'UI', ['*', ['Docs', 'Playground', 'Variantes', 'Tamanhos', 'Composições', 'Estados', '*']],
    '*',
  ],
}
```

---

## Sistema de Temas

| Dimensão | Mecanismo |
|---|---|
| Light / Dark | `withThemeByClassName` decorator em `preview.ts` |
| Brand (tema-um, tema-dois) | Decorator custom em `preview.ts` + sync script |
| Mudança ao vivo | Decorators via `$effect` / script |

---

## Adicionar Novo Componente (5 passos)

**1.** Criar `src/lib/components/docs/NovoComponenteDocs.svelte`

**2.** Criar `src/lib/components/docs/content/novo-componente/translations.json`

**3.** Criar a story principal:
```ts
// src/lib/components/ui/novo-componente.stories.ts
const meta = {
  title: 'UI/NovoComponente',
  component: NovoComponente,
  tags: ['autodocs'],
  parameters: {
    docs: { page: withAutoDocsTab(NovoComponenteDocs) },
  },
} satisfies Meta<typeof NovoComponente>;

export const Playground: Story = {
  play: async ({ canvasElement, step }) => { /* testes */ },
};
```

**4.** Criar arquivos de variações (`-variantes`, `-tamanhos`, `-estados`, `-composicoes`)

**5.** Verificar no Storybook (`npm run storybook`)

---

## Papel do App.svelte

`App.svelte` é **sandbox de desenvolvimento**. Não é a interface de documentação.

- Novos componentes **não precisam** ser registrados nele
- A sidebar do Storybook é a única navegação relevante

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| Tema não aplica no Docs tab | Verificar URL: `?globals=theme:dark;brand:tema-um` |
| Sidebar mostra componente fora de ordem | Verificar `title` no meta e ordem no `storySort` |
| Docs page não carrega | Verificar `parameters.docs.page: withAutoDocsTab(ComponenteDocs)` |
| i18n não funciona | Criar `content/{slug}/translations.json` |
| Violação de a11y bloqueia CI | Corrigir a violação ou configurar `parameters.a11y.config.rules` |
