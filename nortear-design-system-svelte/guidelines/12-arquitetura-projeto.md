# Arquitetura do Projeto — Design System Svelte (Storybook-Centric)

> **Referência primária:** o índice em `Guidelines.md` — ele aponta a guideline de cada assunto antes de qualquer tarefa de documentação ou stories.

---

## Interface Principal

O **Storybook** é a interface de documentação principal.

```bash
npm run storybook      # porta 6006 — interface principal
npm run dev            # sandbox de desenvolvimento (App.svelte) — uso secundário
npm run build          # svelte-check --threshold error && vite build
```

`App.svelte` é um **sandbox**. Novos componentes **não precisam** ser registrados nele.

## O portão de tipos

`npm run build` roda `svelte-check` **antes** do `vite build`, e reprova a build inteira no primeiro erro de tipo.

Isso não existia. O `build` era só `vite build`, e o Vite compila `.svelte` sem checar tipo nenhum — o `tsconfig.json` estava escrito, `strict` ligado, e nada o executava. Quando o portão foi ligado pela primeira vez havia **36 erros em 26 arquivos**, entre eles quatro defeitos de comportamento que a suíte dava por verdes:

- um componente inteiro invocado e nunca escrito (o campo de texto rico do editor de documentação): Svelte compila componente desconhecido sem reclamar, e o ramo abria vazio;
- `defaultValue` passado treze vezes a componentes cuja lib só conhece `value` — as abas da docs page abriam com nenhuma aba escolhida, e a tabela de props documentava a propriedade inexistente;
- `bind:value` no menu de navegação, cujo raiz não declarava a prop como vinculável: quem escrevia o binding não recebia nada de volta, e um `value` vindo de fora prendia o menu aberto;
- uma prop entregue a uma seção da docs page que não a aceita — o conteúdo sumia sem aviso.

O resto era ambiente não declarado (`vite/client`, `*.css`, `import.meta.env`) e tipagem estreita demais. A regra que sai disso: **nada de `as any`, `@ts-ignore` ou afrouxar o `tsconfig`** — se o tipo reclama, quem está errado é o código ou a assinatura.

`src/vite-env.d.ts` declara o ambiente do Vite, igual ao da stack Vanilla. Sem ele todo `import './x.css'` vira erro TS2882.

---

## Estrutura de Diretórios

```
nortear-design-system-svelte/
├── .storybook/
│   ├── main.ts                  # Addons, stories glob, framework
│   ├── preview.ts               # Parâmetros globais, decorators, toolbar
│   ├── preview-head.html        # GA4 + script de sync de tema (iframe)
│   └── test-runner.ts           # axe-playwright: a11y em todas as stories
│
├── src/
│   ├── components/
│   │   ├── ui/                  # Primitivos (Bits UI) + stories, uma pasta por slug
│   │   │   └── alert/
│   │   │       ├── index.ts
│   │   │       ├── alert.svelte
│   │   │       ├── alert-title.svelte
│   │   │       ├── alert-description.svelte
│   │   │       ├── alert.source.ts        # transforms do painel Code
│   │   │       ├── AlertStory.svelte      # wrappers de story
│   │   │       ├── alert.stories.ts
│   │   │       ├── alert-variants.stories.ts
│   │   │       ├── alert-states.stories.ts
│   │   │       └── alert-compositions.stories.ts
│   │   │
│   │   ├── docs/                # Páginas de documentação
│   │   │   ├── AlertDocs.svelte
│   │   │   ├── DocsNav.svelte
│   │   │   └── sections/        # os 15 containers genéricos + DocsPageLayout
│   │   │
│   │   └── product/
│   │       └── LanguageSwitcher.svelte
│   │
│   ├── lib/
│   │   ├── i18n.ts              # Store Svelte 5 + hook useTranslation
│   │   ├── analytics.ts         # Wrapper GA4 tipado
│   │   ├── docs-tracking.ts     # tracking automático via data-track*
│   │   ├── use-seo.ts           # applySeo (detecta iframe)
│   │   ├── use-active-section.svelte.ts # IntersectionObserver (onActive / onDwell)
│   │   ├── motion.ts            # prefersReducedMotion() + tokens de duração
│   │   ├── strip-html.ts        # texto puro a partir de string com marcação
│   │   ├── story-source.ts      # helpers dos transforms de snippet
│   │   ├── withAutoDocsTab.ts   # HOC Storybook: aba "API Reference"
│   │   └── utils.ts             # cn() e utilitários
│   │
│   ├── i18n/
│   │   └── ui.json              # Traduções da UI chrome
│   │
│   └── styles/
│       ├── globals.css          # .nds-* + tokens CSS
│       ├── storybook-docs.css   # Overrides para Docs tab
│       └── themes/              # temas de marca
│
├── chromatic.config.json
└── guidelines/                  # estas guidelines
```

O conteúdo por componente **não fica na stack**: mora em
`docs/shared/content/<slug>/translations.json`, na raiz do repositório, e é lido
por todas as stacks. Docs page que importa tradução de dentro de `src/` está
duplicando conteúdo compartilhado.

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

**1.** Criar `src/components/docs/NovoComponenteDocs.svelte`

**2.** Criar `docs/shared/content/novo-componente/translations.json` (raiz do repositório)

**3.** Criar a story principal:
```ts
// src/components/ui/novo-componente/novo-componente.stories.ts
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

**4.** Criar arquivos de variações (`-variants`, `-sizes`, `-states`, `-compositions`)

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
| i18n não funciona | Criar `docs/shared/content/{slug}/translations.json` na raiz do repositório |
| Violação de a11y bloqueia CI | Corrigir a violação ou configurar `parameters.a11y.config.rules` |
