# Nortear Design System

Um design system multi-stack production-ready com **4 implementações sincronizadas** (React, Vue, Svelte e Vanilla TS), 50+ componentes acessíveis, sistema de tokens compartilhado e documentação trilíngue (pt-BR / en / es).

```
┌─────────────────────────────────────────────────────────────┐
│  React 19 + @base-ui/react  ◇  port 6006                    │
│  Vue 3   + reka-ui          ◇  port 6007                    │
│  Svelte 5 + bits-ui         ◇  port 6008                    │
│  Vanilla TS (Nortear)       ◇  port 6009                    │
└─────────────────────────────────────────────────────────────┘
        ↑          ↑           ↑          ↑          ↑
   tokens.css  themes/   translations.json  guidelines  axe + WCAG 2.1 AA
   (shared across stacks)
```

## Por que existir

Quando uma equipe ou produto precisa entregar a mesma marca em **mais de uma stack** (React + Vue, ou Svelte + Vanilla pra um landing), normalmente cada time mantém seu próprio fork — divergindo em comportamento, tokens, a11y. O Nortear elimina esse drift mantendo:

- **Tokens CSS compartilhados** em `docs/shared/tokens/` consumidos pelos 4 stacks
- **Temas** (Default + Densidades + Fontes) em `docs/shared/themes/` aplicáveis cross-stack
- **Conteúdo trilíngue** em `docs/shared/content/<slug>/translations.json` lido por todas as docs pages
- **Guidelines** em `docs/shared/guidelines/` regendo decisões de API, a11y, UX writing
- **Stories sincronizadas** com mesmas categorias e nomes em todos os stacks

## Stacks

| Stack | Diretório | Porta Storybook | Engine base | Comando dev |
|---|---|---|---|---|
| **React** | `nortear-design-system-react/` | 6006 | `@base-ui/react` + Tailwind 4 | `npm run dev:react` |
| **Vue** | `nortear-design-system-vue/` | 6007 | `reka-ui` + Tailwind 4 | `npm run dev:vue` |
| **Svelte** | `nortear-design-system-svelte/` | 6008 | `bits-ui` + Tailwind 4 (Svelte 5 runes) | `npm run dev:svelte` |
| **Nortear** | `nortear-design-system-vanilla/` | 6009 | Vanilla TS + factories + CSS standalone (`.nds-*`) — **zero CSS framework** | `npm run dev:vanilla` |

## Componentes

50+ componentes em 7 categorias (todas com mesmo set em cada stack):

| Categoria | Componentes |
|---|---|
| **Layout** | Card, Sidebar, ScrollArea, AspectRatio, Resizable, Separator |
| **Navigation** | Breadcrumb, Menubar, NavigationMenu, Pagination, Tabs |
| **Form** | Button, Input, Textarea, Select, DatePicker, Calendar, Checkbox, RadioGroup, Switch, Slider, Form, InputOTP, Label, Toggle, ToggleGroup |
| **Feedback** | Alert, Badge, Progress, Skeleton, Sonner |
| **Display** | Avatar, Carousel, Chart |
| **Tables** | Table, DataTable (sort/filter/select/resize/reorder/pin/edit/virtualize) |
| **Disclosure** | Accordion, Collapsible, Sheet, Drawer |
| **Overlay** | Dialog, AlertDialog, DropdownMenu, Popover, Tooltip, ContextMenu, Command, HoverCard |

Cada componente tem **stories** (Playground + variações), **docs page** (15 seções padronizadas em 3 idiomas) e atende **WCAG 2.1 AA** verificado via axe (addon-a11y no Storybook Test).

## Foundations

Páginas de fundação documentadas em `Foundations/*` no Storybook (todas as 4 stacks):

- Sobre o Design System
- Comece por Aqui
- Cores e Temas
- Tipografia
- Espaçamento
- Elevação, Bordas e Sombras
- Icons
- Motion
- Densidades
- Acessibilidade
- Tom de Voz
- Sistema de Temas
- Internacionalização
- Analytics
- SEO e GEO
- Divergências Cross-Stack

## 🚀 Use como template

Este repo é um **GitHub Template Repository**. Pra fundar seu próprio design system multi-stack a partir dele:

```bash
# via gh CLI
gh repo create meu-design-system \
  --template julianamucci/design-system --public

# ou clique em "Use this template" no GitHub
```

Depois, customize seguindo o **[`BRAND-CUSTOMIZATION.md`](BRAND-CUSTOMIZATION.md)** — guia passo a passo (11 etapas) com:

1. Tokens (cores, espaçamentos, radius)
2. Temas adicionais
3. Tipografia
4. Logo nas 4 stacks
5. Manager do Storybook (sidebar + título)
6. **Analytics (GA4)** — trocar o Measurement ID do template pelo seu ⚠
7. Conteúdo trilíngue
8. README e nome do projeto
9. Deploy Vercel (4 Storybooks + DNS)
10. CLI customizada (npm publish)
11. Checklist final antes do primeiro release

Storybooks ao vivo do template original:
- **React** → [react.norteardesign.com.br](https://react.norteardesign.com.br)
- **Vue** → [vue.norteardesign.com.br](https://vue.norteardesign.com.br)
- **Svelte** → [svelte.norteardesign.com.br](https://svelte.norteardesign.com.br)
- **Vanilla** → [vanilla.norteardesign.com.br](https://vanilla.norteardesign.com.br)

> O site/portal que linka pros 4 Storybooks (em [norteardesign.com.br](https://norteardesign.com.br)) é um projeto separado consumindo este design system — não faz parte do template. Cada fork pode construir o seu próprio portal (ou nenhum) conforme a necessidade.

## Quick Start

### Pré-requisitos
- Node 18+
- npm

### Instalar dependências
```bash
git clone <repo-url>
cd design-system
# instale em cada stack que vai usar:
cd nortear-design-system-react && npm install
cd ../nortear-design-system-vue && npm install
cd ../nortear-design-system-svelte && npm install
cd ../nortear-design-system-vanilla && npm install
```

### Rodar Storybook (qualquer stack)
```bash
# do repo root:
npm run storybook:react      # http://localhost:6006
npm run storybook:vue        # http://localhost:6007
npm run storybook:svelte     # http://localhost:6008
npm run storybook:vanilla    # http://localhost:6009
```

## Nortear CLI (Vanilla TS)

Pra puxar componentes do Nortear num projeto vanilla, estilo shadcn. **Ainda não publicado no npm** — por enquanto, rode a partir do clone:

```bash
# do repo root, dentro do seu projeto consumidor:
node <caminho-do-clone>/nortear-cli/bin/nortear.mjs init
node <caminho-do-clone>/nortear-cli/bin/nortear.mjs add button card alert
```

Quando publicado (roadmap), vira `npx nortear@latest init`. Veja [`nortear-cli/README.md`](nortear-cli/README.md).

## Qualidade

| Stack | Storybook Test (vitest) pass rate | Status |
|---|---:|:---:|
| Nortear | **100%** (527/527) | ✅ |
| Vue | 87% (464/533) | 🟢 |
| React | 84% (455/542) | 🟢 |
| Svelte | 79% (426/539) | 🟡 |

Testes rodam via **Storybook Test** (vitest browser mode + `@storybook/addon-vitest`): play functions + **axe em TODAS as stories** (`@storybook/addon-a11y` com `a11y: { test: 'error' }` no preview). Falhas remanescentes são padrões upstream conhecidos (FocusGuard `aria-hidden + tabindex=0`) documentados em [`patches.md`](patches.md).

**Segurança**: cada PR passa por **CodeQL** (SAST — [`.github/workflows/codeql.yml`](.github/workflows/codeql.yml)), com **Dependabot** cobrindo dependências vulneráveis ([`.github/dependabot.yml`](.github/dependabot.yml)) e **secret scanning** do GitHub. Findings aparecem como anotações no diff do PR e na aba Security; PRs só reprovam por finding novo em relação ao `main`.

```bash
npm run storybook:<stack>          # local dev
npm run build-storybook            # storybook estático em <stack>/storybook-static/
npm test                           # Storybook Test: vitest browser + play functions + axe
npm run chromatic:all              # visual regression nas 4 stacks
```

## Arquitetura

```
design-system/
├── docs/shared/                    # 🟦 verdade compartilhada (4 stacks consomem)
│   ├── content/<slug>/translations.json   # i18n por componente (pt-BR/en/es)
│   ├── tokens/tokens.css                  # design tokens
│   ├── themes/                            # temas + densidades + fontes
│   └── guidelines/                        # 11 guidelines (a11y, tom de voz, SEO, etc.)
│
├── nortear-design-system-react/            # ⚛️  React 19 + @base-ui
├── nortear-design-system-vue/              # 💚 Vue 3 + reka-ui
├── nortear-design-system-svelte/           # 🧡 Svelte 5 + bits-ui
├── nortear-design-system-vanilla/          # 🌿 Vanilla TS + .nds-* CSS standalone
│
├── nortear-cli/                    # CLI tipo shadcn pra Nortear vanilla
├── patches.md                      # registry de patches upstream + tokens
├── scripts/                        # validate-docs-consistency, list-patches, etc.
└── registry/                       # metadata pro CLI (componentes disponíveis)
```

### Princípios chave

1. **Wrapper-first** — modificações de primitivas upstream (base-ui/reka/bits) ficam em wrappers antes de patches diretos. Quando o patch é estrutural, é versionado via `patch-package` + documentado em `patches.md`.
2. **Conteúdo cross-stack API-neutro** — `translations.json` usa termos conceituais ("modo único", "callback de mudança"), nunca props literais. Snippets de código stack-específicos ficam em chaves com sufixo `Code`.
3. **Tokens não-Tailwind no Nortear** — Nortear vanilla TS usa classes `.nds-*` standalone, sem framework CSS. As outras 3 stacks usam Tailwind 4.
4. **Zero skip de teste** — política rígida: bugs do primitivo são corrigidos; nunca usar `it.skip`/`a11y.disable`/`expect.soft`. Configurações de ferramenta axe (suprimir regras de falso-positivo conhecido) são aceitáveis e documentadas.

## Patches upstream ativos

Ver [`patches.md`](patches.md) — registry completo:
- **vue-sonner** `1.3.2` — toast `<li>` tabindex 0 → -1 (axe nested-interactive)
- **svelte-sonner** `1.1.0` — toast `<li>` tabindex 0 → -1 (idem)
- Tokens de dimensão substituindo classes hardcoded (`h-(--height-default)` etc.)
- Compose patterns (combobox, calendar) com `aria-*` adicionais

## Deploy

Cada uma das 4 stacks tem seu próprio `vercel.json` e é deployada como **projeto Vercel independente** apontando pra subdomínio próprio. A topologia:

| Projeto Vercel | Diretório raiz no repo | Subdomínio | Build |
|---|---|---|---|
| `nortear-react` | `nortear-design-system-react/` | `react.norteardesign.com.br` | `npm run build-storybook` |
| `nortear-vue` | `nortear-design-system-vue/` | `vue.norteardesign.com.br` | `npm run build-storybook` |
| `nortear-svelte` | `nortear-design-system-svelte/` | `svelte.norteardesign.com.br` | `npm run build-storybook` |
| `nortear-vanilla` | `nortear-design-system-vanilla/` | `vanilla.norteardesign.com.br` | `npm run build-storybook` |

O site/portal que agrupa os 4 Storybooks (acessível em [norteardesign.com.br](https://norteardesign.com.br)) é um **projeto separado** que consome este design system como template — não é versionado aqui.

### DNS records pra norteardesign.com.br

Configurar no painel do seu registrador. Os 4 CNAMEs apontam pros hostnames específicos que cada projeto Vercel mostra em **Settings → Domains** (formato `f<hash>.vercel-dns-017.com`):

```
Tipo   Nome      Valor                                       TTL
────   ────      ─────                                       ───
CNAME  react     <hash-react>.vercel-dns-017.com.            3600
CNAME  vue       <hash-vue>.vercel-dns-017.com.              3600
CNAME  svelte    <hash-svelte>.vercel-dns-017.com.           3600
CNAME  vanilla   <hash-vanilla>.vercel-dns-017.com.          3600
```

A Vercel automaticamente provisiona certificados TLS (Let's Encrypt) pra todos os subdomínios após a propagação DNS.

### Setup Vercel (one-time)

Pra cada uma das 4 stacks:

1. No painel Vercel: **New Project → Import Git Repository**, seleciona este repo
2. **Root Directory**: `nortear-design-system-<stack>` (ex: `nortear-design-system-react`)
3. **Framework Preset**: Other (o `vercel.json` já configura o resto)
4. Após criar: **Settings → Domains** → adiciona o subdomínio próprio
5. Copie o hostname CNAME que aparece e configure no seu registrador
6. Aguarde propagação DNS + TLS (~2-15 min)

## Roadmap

- [ ] Publish Nortear CLI no npm
- [ ] Deploy Storybooks em domínios próprios (Vercel/Chromatic)
- [ ] Atingir 100% test-storybook em Vue/React/Svelte (87% / 85% / 79% atualmente)
- [ ] Adicionar tema escuro custom (atualmente segue prefers-color-scheme)
- [ ] Documentar mais componentes especializados (DateRangePicker, FileUpload, Tree, etc.)

## Licença

MIT — ver [`LICENSE`](LICENSE).

## Contribuindo

Ver [`CONTRIBUTING.md`](CONTRIBUTING.md).
