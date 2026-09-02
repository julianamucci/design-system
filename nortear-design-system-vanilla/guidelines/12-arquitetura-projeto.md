# Arquitetura do Projeto — Design System Nortear (Storybook-Centric)

> **Referência primária:** o índice em `Guidelines.md` — ele aponta a guideline de cada assunto antes de qualquer tarefa de documentação ou stories.

---

## A interface

O **Storybook** é a única interface desta stack. Não existe sandbox de aplicação.

```bash
npm run storybook       # porta 6009 — a interface
npm run build           # tsc (com noEmit) — checagem de tipo, não gera artefato
npm run build-storybook # empacota as stories em storybook-static/
```

`storybook-static/` é o artefato publicável — é para ele que o `vercel.json` aponta. Repare no que o `build` deixa de fora: nenhum dos cinco `npm run build` abre folha de estilo, então `@import` quebrado em CSS só reprova no `build-storybook`.

---

## Estrutura de Diretórios

```
nortear-design-system-vanilla/
├── .storybook/
│   ├── main.ts                  # @storybook/html-vite, addons, stories glob
│   ├── preview.ts               # Parâmetros globais, decorators, toolbar
│   ├── preview-head.html        # GA4 + script de sync de tema (iframe)
│   └── test-runner.ts           # axe-playwright: a11y em todas as stories
│
├── src/
│   ├── components/
│   │   ├── ui/                  # Funções de criação de componentes + stories
│   │   │   ├── alert.ts                         # createAlert(), createAlertTitle(), createAlertDescription()
│   │   │   ├── alert.stories.ts                 # Story principal + Playground
│   │   │   ├── alert-variantes.stories.ts
│   │   │   ├── alert-estados.stories.ts
│   │   │   └── alert-composicoes.stories.ts
│   │   │
│   │   └── docs/                # Páginas de documentação
│   │       ├── AlertDocs.ts                # createAlertDocs() → HTMLElement
│   │       ├── content/
│   │       │   └── alert/
│   │       │       └── translations.json
│   │       └── shared/
│   │           ├── createDocsHeader.ts
│   │           ├── createDocsSection.ts
│   │           └── createDocsNav.ts
│   │
│   ├── lib/
│   │   ├── i18n.ts              # Store + getTranslation()
│   │   ├── analytics.ts         # Wrapper GA4 tipado
│   │   ├── use-seo.ts           # applyStorybookSeo()
│   │   ├── use-active-section.ts # IntersectionObserver (onActive / onDwell)
│   │   ├── motion.ts            # prefersReducedMotion() + tokens de duração
│   │   ├── echarts-theme.ts     # registra o tema do DS na lib de gráfico
│   │   ├── strip-html.ts        # texto puro a partir de string com marcação
│   │   ├── withAutoDocsTab.ts   # HOC Storybook: aba "API Reference"
│   │   └── utils.ts             # cn() e utilitários
│   │
│   ├── i18n/
│   │   └── ui.json              # Traduções da UI chrome
│   │
│   └── styles/
│       ├── globals.css          # Tokens + componentes .nds-*
│       └── storybook-docs.css   # Overrides para Docs tab
│
├── chromatic.config.json
└── guidelines/                  # estas guidelines
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

## Adicionar Novo Componente (5 passos)

**1.** Criar `src/components/docs/NovoComponenteDocs.ts` com função `createNovoComponenteDocs(): HTMLElement`

**2.** Criar `src/components/docs/content/novo-componente/translations.json`

**3.** Criar a story principal:
```ts
// src/components/ui/novo-componente.stories.ts
import type { Meta, StoryObj } from '@storybook/html';
import { createNovoComponente, type NovoComponenteOptions } from './novo-componente';
import { createNovoComponenteDocs } from '../docs/NovoComponenteDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta: Meta<NovoComponenteOptions> = {
  title: 'UI/NovoComponente',
  tags: ['autodocs'],
  parameters: {
    docs: { page: withAutoDocsTab(createNovoComponenteDocs) },
  },
  render: (args) => createNovoComponente(args),
};

export const Playground: StoryObj<NovoComponenteOptions> = {
  play: async ({ canvasElement, step }) => { /* testes */ },
};
```

**4.** Criar arquivos de variações (`-variantes`, `-tamanhos`, `-estados`, `-composicoes`)

**5.** Verificar no Storybook (`npm run storybook`)

---

## Diferença fundamental: render em Storybook HTML

Em Nortear, o `render` de cada story retorna um `HTMLElement` (não JSX ou template):

```ts
// ✅ CORRETO — retorna HTMLElement
render: (args) => createButton(args)

// ✅ CORRETO — retorna HTMLElement composto
render: (args) => {
  const container = document.createElement('div');
  container.className = 'nds-cluster';
  container.dataset.spacing = 'md';
  container.appendChild(createButton({ ...args, variant: 'default' }));
  container.appendChild(createButton({ ...args, variant: 'outline' }));
  return container;
}
```

---

## O sandbox de aplicação saiu (2026-09-02)

Esta stack tinha um sandbox — `src/app.ts`, `src/main.ts`, `index.html` e os
scripts `dev` e `preview`. Todos foram removidos. O que se mediu antes de tirar:

- **nunca era publicado** — os cinco `vercel.json` publicam `storybook-static/`, e nada além disso chega ao ar;
- **ninguém o abria** — o trabalho de componente, documentação e revisão acontece todo no Storybook;
- **nenhum portão o auditava** — fora do alcance dos gates, ele apodrecia em silêncio, e terminou carregando 172 classes mortas de uma migração já encerrada.

O Angular já operava assim, sem sandbox, e virou o modelo para as outras.

Não recrie nenhum desses arquivos. Componente novo entra por story, e a sidebar do Storybook é a única navegação que existe.

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| Tema não aplica no Docs tab | Verificar URL: `?globals=theme:dark;brand:tema-um` |
| Sidebar fora de ordem | Verificar `title` no meta e `storySort` |
| Docs page não carrega | Verificar `parameters.docs.page: withAutoDocsTab(createComponenteDocs)` |
| `render` retorna undefined | Garantir que a função retorna `HTMLElement` |
| Violação de a11y bloqueia CI | Corrigir a violação ou configurar `parameters.a11y.config.rules` |
