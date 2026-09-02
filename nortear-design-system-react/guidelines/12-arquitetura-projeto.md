# Arquitetura do Projeto — Design System (Storybook-Centric)

> **Referência primária:** Leia `STORYBOOK-ARCHITECTURE.md` (na raiz do projeto) antes de qualquer tarefa de documentação ou stories. Este arquivo é um resumo executivo; o outro é o detalhamento completo.

---

## A Interface

O **Storybook** é a **única** interface do projeto. Não existe sandbox de aplicação.

```bash
npm run storybook        # porta 6006 — a interface
npm run build            # tsc -b — só checagem de tipos, não emite artefato
npm run build-storybook  # empacota storybook-static/ — o artefato publicável
```

Um componente novo entra no projeto **por story**: é a story que o coloca na sidebar, que os portões auditam e que o `build-storybook` empacota.

---

## Estrutura de Diretórios

```
nortear-design-system-react/
├── .storybook/
│   ├── main.ts                  # Addons, stories glob, framework
│   ├── preview.ts               # Parâmetros globais, decorators, toolbar
│   ├── preview-head.html        # GA4 + script de sync de tema (iframe)
│   ├── manager-head.html        # Scripts no shell do Storybook
│   └── test-runner.ts           # axe-playwright: a11y em todas as stories
│
├── src/
│   ├── components/
│   │   ├── ui/                  # Primitivos (@base-ui/react) + stories
│   │   │   ├── alert.tsx
│   │   │   ├── alert.stories.tsx            # Story principal (Playground + docs.page)
│   │   │   ├── alert-variantes.stories.tsx
│   │   │   ├── alert-estados.stories.tsx
│   │   │   └── alert-composicoes.stories.tsx
│   │   │
│   │   ├── docs/                # Páginas de documentação ricas
│   │   │   ├── AlertDocs.tsx               # Referência de implementação
│   │   │   ├── content/
│   │   │   │   └── alert/
│   │   │   │       └── translations.json  # UI text em pt-BR / en / es
│   │   │   ├── shared/
│   │   │   │   ├── DocsNav.tsx            # Navegação lateral das docs pages
│   │   │   │   └── sections/              # 16 containers de seção reutilizáveis
│   │   │   │       ├── DocsHeader.tsx
│   │   │   │       ├── DocsDemonstration.tsx
│   │   │   │       ├── DocsAnatomy.tsx
│   │   │   │       ├── DocsWhenToUse.tsx
│   │   │   │       ├── DocsDoDont.tsx
│   │   │   │       ├── DocsImport.tsx
│   │   │   │       ├── DocsVariants.tsx
│   │   │   │       ├── DocsStates.tsx
│   │   │   │       ├── DocsProps.tsx
│   │   │   │       ├── DocsTokens.tsx
│   │   │   │       ├── DocsAccessibility.tsx
│   │   │   │       ├── DocsRelated.tsx
│   │   │   │       ├── DocsNotes.tsx
│   │   │   │       ├── DocsAnalytics.tsx
│   │   │   │       ├── DocsTestes.tsx
│   │   │   │       └── index.ts
│   │   │   ├── ThemingDocs.tsx            # Página de fundamentos
│   │   │   ├── ThemingDocs.mdx            # Entry MDX unattached
│   │   │   └── ThemingDocs.stories.tsx    # Stub para evitar conflito de título
│   │   │
│   │   └── product/
│   │       └── LanguageSwitcher.tsx       # Seletor de idioma (i18n)
│   │
│   ├── lib/
│   │   ├── i18n.ts              # Zustand store + hook useTranslation
│   │   ├── analytics.ts         # Wrapper GA4 tipado
│   │   ├── use-seo.ts           # Hook de metatags SEO (detecta iframe)
│   │   ├── use-active-section.ts # IntersectionObserver (onActive / onDwell)
│   │   ├── motion.ts            # prefersReducedMotion() + tokens de duração
│   │   ├── strip-html.ts        # texto puro a partir de string com marcação
│   │   ├── withAutoDocsTab.tsx  # HOC: adiciona aba "API Reference" ao Docs
│   │   └── utils.ts             # cn() e utilitários
│   │
│   ├── i18n/
│   │   └── ui.json              # Traduções da UI chrome (nav labels, comuns)
│   │
│   └── styles/
│       ├── globals.css          # tokens CSS + imports de temas + estilos .nds-*
│       └── storybook-docs.css   # Overrides de layout para Docs tab
│
├── chromatic.config.json
├── vite.config.ts
└── STORYBOOK-ARCHITECTURE.md   ← leia este arquivo
```

---

## Navegação

A sidebar do Storybook é configurada via `storySort` em `.storybook/preview.ts`:

```ts
storySort: {
  order: [
    'Foundations',
    'UI', ['*', ['Docs', 'Playground', 'Variantes', 'Tamanhos', 'Composições', 'Estados', '*']],
    '*',
  ],
}
```

- **`Foundations`** — páginas MDX de fundamentos (Theming, Design Tokens, etc.)
- **`UI/*`** — componentes, cada um com sub-páginas ordenadas
- Sub-páginas: `Docs → Playground → Variantes → Tamanhos → Composições → Estados`

Não existe lista de categorias mantida manualmente. A sidebar reflete automaticamente os títulos das stories.

---

## Sistema de Temas

Temas são gerenciados pelo toolbar do Storybook, **não** por estado de aplicação.

| Dimensão | Mecanismo |
|---|---|
| Light / Dark | `withThemeByClassName` decorator em `preview.ts` |
| Brand (tema-um, tema-dois) | Decorator custom em `preview.ts` + `preview-head.html` sync script |
| Mudança ao vivo no Canvas | Decorators via `useEffect` |
| Carregamento inicial de Docs | Script no `preview-head.html` lê `?globals=theme:dark;brand:tema-um` |

Para adicionar um novo tema: ver seção "Adicionar Novo Tema" abaixo.

---

## Adicionar Novo Componente (5 passos)

> Detalhamento completo em `STORYBOOK-ARCHITECTURE.md` Seção 14.

**1. Criar a docs page**
```
src/components/docs/NovoComponenteDocs.tsx
```
Seguir o template de 15 seções de `11-documentacao-componentes.md`. Usar `AlertDocs.tsx` como referência.

**2. Criar translations.json**
```
src/components/docs/content/novo-componente/translations.json
```
Estrutura: `{ "pt-BR": {...}, "en": {...}, "es": {...} }`.

**3. Criar a story principal**
```tsx
// src/components/ui/novo-componente.stories.tsx
const meta = {
  title: 'UI/NovoComponente',
  component: NovoComponente,
  tags: ['autodocs'],
  parameters: {
    docs: { page: withAutoDocsTab(NovoComponenteDocs) },
  },
  // argTypes + args
} satisfies Meta<typeof NovoComponente>;

export const Playground: Story = {
  play: async ({ canvasElement, step }) => { /* testes de interação */ },
};
```

**4. Criar arquivos de variações**
```
src/components/ui/novo-componente-variantes.stories.tsx
src/components/ui/novo-componente-tamanhos.stories.tsx
src/components/ui/novo-componente-estados.stories.tsx
src/components/ui/novo-componente-composicoes.stories.tsx
```
Cada arquivo com `title: 'UI/NovoComponente/Variantes'` (etc.) e **sem** `tags: ['autodocs']`.

**5. Verificar no Storybook**
```bash
npm run storybook
```
Confirmar que o componente aparece na sidebar sob `UI/NovoComponente` com todas as sub-páginas.

Não há mais nenhum passo de registro além destes cinco: a story é o registro.

---

## Adicionar Novo Tema

1. **Definir CSS** em `docs/shared/themes/novo-tema.css`:
   ```css
   .novo-tema {
     --primary: /* HSL sem vírgulas */;
     --radius: /* px */;
   }
   .dark.novo-tema {
     --background: /* HSL */;
   }
   ```

2. **Importar** em `docs/shared/themes/index.css`:
   ```css
   @import "./novo-tema.css";
   ```

3. **Registrar no toolbar** em `.storybook/preview.ts`:
   ```ts
   { value: 'novo-tema', title: 'Nome do Tema' }
   ```
   E no array de remoção do decorator:
   ```ts
   html.classList.remove('tema-um', 'tema-dois', 'novo-tema');
   ```

4. **Registrar no sync script** em `.storybook/preview-head.html`:
   ```js
   const BRAND_CLASSES = ['tema-um', 'tema-dois', 'novo-tema'];
   ```

5. **Atualizar** `docs/shared/themes/theme-config.ts`: adicionar entrada no array `themes` e em `subdomainThemeMap` se aplicável.

---

## Adicionar Página de Fundamentos (sem componente)

Usar o padrão MDX unattached (ver `ThemingDocs.mdx`):

```mdx
{/* src/components/docs/MinhaPaginaDocs.mdx */}
import { Meta } from '@storybook/blocks';
import { MinhaPaginaDocs } from './MinhaPaginaDocs';

<Meta title="Foundations/Minha Página" />
<MinhaPaginaDocs />
```

Criar também um stub de stories para evitar conflito de título:
```tsx
// MinhaPaginaDocs.stories.tsx
export default { title: 'Foundations/Minha Página' };
```

---

## Remoção do sandbox de aplicação (2026-09-02)

Até 2026-09-02 esta stack mantinha um sandbox de aplicação — `src/App.tsx`, `src/main.tsx`, `index.html`, `src/components/HomePage.tsx`, `src/components/ThemeSelector.tsx` — servido por `npm run dev` e empacotado por `vite build`. **Ele foi removido**, junto com os scripts `dev` e `preview`. O Angular já operava assim e virou o modelo para as outras stacks.

O motivo é medido, não estético:

- **Nunca era publicado.** Os cinco `vercel.json` têm `outputDirectory: "storybook-static"` e `buildCommand: "npm run build-storybook"`. O bundle do sandbox era gerado e descartado.
- **Ninguém o abria.** A interface de trabalho e de leitura é o Storybook, na 6006.
- **Nenhum portão o auditava.** `audit.mjs` varre `components/ui` e `docs/`; o sandbox ficava fora do alcance de todas as regras.
- **Acumulava classe morta.** Restaram nele 172 classes de uma migração já encerrada, invisíveis para quem só olhava as stories.

Consequência que vale saber de cor: `npm run build` passou a ser **`tsc -b`** — checagem de tipos, sem emissão. Com isso **nenhum dos cinco `npm run build` abre folha de estilo**, então `@import` quebrado em CSS só reprova no `build-storybook`. Ao mexer em CSS, o portão é `npm run build-storybook`, não o build.

---

## Troubleshooting

| Problema | Causa | Solução |
|---|---|---|
| Tema não aplica no Docs tab | Script de sync não leu o globals param | Verificar URL: deve conter `?globals=theme:dark;brand:tema-um` |
| Tema não aplica no Canvas | Decorator não inicializou | Aguardar hot reload ou recarregar a história |
| Sidebar mostra componente fora de ordem | `storySort` não inclui o título | Verificar `title` no meta da story e ordem em `preview.ts` |
| Docs page não carrega | `withAutoDocsTab` não importado | Verificar `parameters.docs.page: withAutoDocsTab(ComponenteDocs)` |
| i18n não funciona na docs page | `translations.json` ausente | Criar `src/components/docs/content/{slug}/translations.json` |
| Violação de a11y bloqueia CI | `parameters.a11y.test: 'error'` | Corrigir a violação; ou para falso positivo: `parameters.a11y.config.rules` |
| Anel de foco não aparece | Falta `.nds-focus-ring` no elemento interativo | Seguir `docs/shared/guidelines/01-acessibilidade.md` e `03-sistema-design.md` |
