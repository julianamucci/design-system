# Arquitetura do Projeto — Design System Nortear (Storybook-Centric)

> **Referência primária:** Leia `STORYBOOK-ARCHITECTURE.md` antes de qualquer tarefa de documentação ou stories.

---

## Interface Principal

O **Storybook** é a interface de documentação principal.

```bash
npm run storybook      # porta 6006 — interface principal
npm run dev            # sandbox de desenvolvimento — uso secundário
```

---

## Estrutura de Diretórios

```
nortear-design-system/
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
│   │   ├── sanitize-html.ts     # sanitizeHtml() para innerHTML seguro
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
  container.className = 'flex gap-4';
  container.appendChild(createButton({ ...args, variant: 'default' }));
  container.appendChild(createButton({ ...args, variant: 'outline' }));
  return container;
}
```

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| Tema não aplica no Docs tab | Verificar URL: `?globals=theme:dark;brand:tema-um` |
| Sidebar fora de ordem | Verificar `title` no meta e `storySort` |
| Docs page não carrega | Verificar `parameters.docs.page: withAutoDocsTab(createComponenteDocs)` |
| `render` retorna undefined | Garantir que a função retorna `HTMLElement` |
| Violação de a11y bloqueia CI | Corrigir a violação ou configurar `parameters.a11y.config.rules` |
