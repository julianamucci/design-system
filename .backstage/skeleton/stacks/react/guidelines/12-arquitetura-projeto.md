# Arquitetura do Projeto — Design System (Storybook-Centric)

> **Referência primária:** Leia `STORYBOOK-ARCHITECTURE.md` (na raiz do projeto) antes de qualquer tarefa de documentação ou stories. Este arquivo é um resumo executivo; o outro é o detalhamento completo.

---

## Interface Principal

O **Storybook** é a interface de documentação principal.

```bash
npm run storybook      # porta 6006 — interface principal
npm run dev            # sandbox de desenvolvimento (App.tsx) — uso secundário
```

`App.tsx` é um **sandbox**. Ele existe para desenvolvimento isolado e para a rota `?view=admin` (editor visual de docs). Novos componentes **não precisam** ser registrados nele.

---

## Estrutura de Diretórios

```
design-system-react/
├── .storybook/
│   ├── main.ts                  # Addons, stories glob, framework
│   ├── preview.ts               # Parâmetros globais, decorators, toolbar
│   ├── preview-head.html        # GA4 + script de sync de tema (iframe)
│   ├── manager-head.html        # Scripts no shell do Storybook
│   └── test-runner.ts           # axe-playwright: a11y em todas as stories
│
├── src/
│   ├── components/
│   │   ├── ui/                  # Primitivos (shadcn/ui) + stories
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
│   │   ├── sanitize-html.ts     # Sanitizador para dangerouslySetInnerHTML
│   │   ├── withAutoDocsTab.tsx  # HOC: adiciona aba "API Reference" ao Docs
│   │   └── utils.ts             # cn() e utilitários
│   │
│   ├── i18n/
│   │   └── ui.json              # Traduções da UI chrome (nav labels, comuns)
│   │
│   ├── admin/
│   │   ├── DocsEditor.tsx       # Editor visual (rota ?view=admin)
│   │   └── useDocs.ts           # Hook para carregar/salvar translations.json
│   │
│   └── styles/
│       ├── globals.css          # Tailwind + tokens CSS + imports de temas
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

Temas são gerenciados pelo toolbar do Storybook, **não** por estado em `App.tsx`.

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

> **App.tsx**: Novos componentes opcionalmente podem ser adicionados ao `lazyDocs` em `App.tsx` para uso no sandbox. Não é necessário.

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

## Papel do App.tsx

`App.tsx` é um **sandbox de desenvolvimento** e **não** a interface de documentação.

Responsabilidades atuais:
- Rota `?view=admin` → editor visual `DocsEditor`
- Preview isolado de docs pages fora do Storybook
- Desenvolvimento local antes de criar stories

`App.tsx` **não** precisa ser atualizado ao adicionar novos componentes. A sidebar do Storybook é a única navegação relevante.

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
| Focus ring não aparece | Falta classe `focus-visible:ring-2` | Seguir `11-acessibilidade.md` e `03-sistema-design.md` |
