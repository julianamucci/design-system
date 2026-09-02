# Brand Customization

Guia passo a passo pra transformar este template no seu próprio design system. Siga na ordem — cada etapa builda sobre a anterior.

> **Pré-requisito**: você já clicou em **"Use this template"** no GitHub, clonou seu repo novo, rodou `npm install` em cada `<stack>/`, e conseguiu rodar `npm run storybook` em pelo menos uma stack.

---

## Etapa 1 — Define a identidade da marca

Antes de tocar em código, decida:

| Item | Exemplo |
|---|---|
| **Nome** | "Acme Design System" |
| **Slug** (npm, URL, classes CSS) | `acme` |
| **Cor primária** | `oklch(0.65 0.18 250)` (azul) |
| **Cor de acento** | `oklch(0.85 0.20 130)` (verde-limão) |
| **Tipografia** | Inter / Roboto / Geist / etc. |
| **Border radius** | sharp (0px), soft (8px), pill (16px) |
| **Domínio** (se publicar) | `acme.design` |

Mantenha esses valores à mão — eles aparecem em vários arquivos.

---

## Etapa 2 — Tokens (cores, espaçamentos, radius)

**Arquivo**: [`docs/shared/tokens/tokens.css`](docs/shared/tokens/tokens.css)

Este arquivo é a **fonte de verdade** consumida pelas 4 stacks. Editar aqui propaga pra React, Vue, Svelte e Nortear simultaneamente.

Variáveis principais a customizar (procure os blocos `:root { ... }` e `.dark { ... }`):

```css
:root {
  /* Cores primárias */
  --primary: oklch(0.65 0.18 250);          /* sua cor de marca */
  --primary-foreground: oklch(0.98 0 0);    /* texto sobre primary */

  /* Cor de acento */
  --accent: oklch(0.85 0.20 130);
  --accent-foreground: oklch(0.15 0 0);

  /* Border radius padrão (afeta button, card, input, dialog…) */
  --radius: 0.5rem;
}
```

**Dica**: use a ferramenta [OKLCH Color Picker](https://oklch.com) pra escolher cores em espaço perceptual (matemática mais previsível que HSL/RGB).

**Validação**: rode `npm run storybook` na stack React e abra `Foundations → Cores e Temas` — os swatches devem refletir as novas cores.

---

## Etapa 3 — Temas adicionais (opcional)

**Arquivo**: [`docs/shared/themes/`](docs/shared/themes/)

Se você quer múltiplos temas (ex: "Banking", "Healthcare", "E-commerce"), cada um vive em seu próprio CSS aqui. Veja `default.css` como exemplo e duplique:

```bash
cp docs/shared/themes/default.css docs/shared/themes/dark-luxury.css
# edita as variables no novo arquivo
```

Depois registre o tema no toolbar de cada stack em `<stack>/.storybook/preview.ts` (procure por `themes` no decorator).

---

## Etapa 4 — Tipografia

A fonte do Google Fonts é carregada em:

| Stack | Arquivo |
|---|---|
| React | [`nortear-design-system-react/src/styles/globals.css`](nortear-design-system-react/src/styles/globals.css) (linha 6, `@import url('...fonts.googleapis.com/...')`) |
| Vue | [`nortear-design-system-vue/src/styles/globals.css`](nortear-design-system-vue/src/styles/globals.css) |
| Svelte | [`nortear-design-system-svelte/src/styles/globals.css`](nortear-design-system-svelte/src/styles/globals.css) |
| Nortear | [`nortear-design-system-vanilla/.storybook/preview-head.html`](nortear-design-system-vanilla/.storybook/preview-head.html) (via `<link>`) |

**Substitua** o URL do `@import` / `<link>` pela sua família. Exemplo trocando Inter por Geist:

```css
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap');
```

Depois atualize a variável CSS:

```css
:root {
  --font-sans: 'Geist', ui-sans-serif, system-ui, sans-serif;
}
```

(em `tokens.css`)

---

## Etapa 5 — Logo

**Arquivo**: `<stack>/.storybook/brand-logo.svg` em cada stack

Substitua o SVG do Nortear pelo seu logo. Recomendado:
- Formato SVG inline (texto/path, não bitmap embedado)
- Altura ~32px
- `currentColor` no fill/stroke pra adaptar a temas dark/light

Aplicar em todas as 4 stacks:

```bash
cp meu-logo.svg nortear-design-system-react/.storybook/brand-logo.svg
cp meu-logo.svg nortear-design-system-vue/.storybook/brand-logo.svg
cp meu-logo.svg nortear-design-system-svelte/.storybook/brand-logo.svg
cp meu-logo.svg nortear-design-system-vanilla/.storybook/brand-logo.svg
```

---

## Etapa 6 — Manager do Storybook (cores da sidebar + título)

**Arquivo**: `<stack>/.storybook/manager.ts` em cada stack

Procure pelo objeto `create({ ... })` e altere:

```ts
import { create } from 'storybook/theming';
import logo from './brand-logo.svg';

export default create({
  base: 'light',                          // ou 'dark'
  brandTitle: 'Acme Design System',       // aparece na sidebar
  brandUrl: 'https://acme.design',        // link ao clicar no logo
  brandImage: logo,
  brandTarget: '_self',

  // Cores da UI do Storybook (não dos componentes — só do Storybook chrome)
  colorPrimary: '#3b82f6',                // sua cor primária
  colorSecondary: '#3b82f6',
});
```

Aplicar em **react/vue/svelte/nortear**.

---

## Etapa 7 — Analytics (GA4) ⚠ obrigatória se for publicar

O Measurement ID do GA4 **não é versionado** — ele é lido de variáveis de ambiente por stack. Cada stack tem um `.env.example` commitado como modelo; os arquivos reais (`.env.development` e `.env.production`) estão no `.gitignore` e cada fork preenche os seus.

**Sem os `.env.*`, o GA4 fica inativo por padrão** (o placeholder `%STORYBOOK_GA_MEASUREMENT_ID%` não é substituído e o gtag vira no-op) — o template nunca envia dados pra lugar nenhum até você configurar.

### Setup (por stack que você for usar)

1. Crie sua propriedade GA4 em [analytics.google.com](https://analytics.google.com) e copie o Measurement ID (formato `G-XXXXXXXXXX`). Recomendado: uma propriedade pra dev e outra pra produção, pra não poluir os dados reais com tráfego local.
2. Copie o modelo e preencha:

```bash
# em cada <stack>/
cp .env.example .env.development   # ID do ambiente de desenvolvimento
cp .env.example .env.production    # ID do ambiente de produção
# edite os dois arquivos com seus IDs
```

As variáveis:
- `STORYBOOK_GA_MEASUREMENT_ID` — interpolada pelo Storybook nos `manager-head.html` (sintaxe `%VAR%`); `storybook dev` usa `.env.development`, `storybook build` usa `.env.production`. É a única: `VITE_GA_MEASUREMENT_ID` saiu dos cinco `.env.example` em 2026-09-02, junto com o `index.html` do sandbox React, o único arquivo que a lia

3. **Vercel/CI**: os `.env.*` não vão pro repo, então defina `STORYBOOK_GA_MEASUREMENT_ID` como variável de ambiente em cada projeto Vercel (**Settings → Environment Variables**, escopo Production) com o ID de produção.

> GA4 fica no **manager** do Storybook, não no iframe — ver [`docs/shared/guidelines/07-analytics.md`](docs/shared/guidelines/07-analytics.md).

### Não quer analytics?

Não faça nada — sem env vars o tracking já é no-op. Pra remover de vez, delete os blocos `<script>` do gtag nos `manager-head.html` das cinco stacks; a função `track()` em `src/lib/analytics.ts` já é silenciosa quando `gtag` não existe.

---

## Etapa 8 — Conteúdo trilíngue (opcional)

Se você quer remover idiomas (ex: ficar só em pt-BR + en) ou adicionar mais:

**Arquivo**: [`docs/shared/content/<slug>/translations.json`](docs/shared/content/) (um por componente)

Cada arquivo tem 3 chaves de primeiro nível: `pt-BR`, `en`, `es`. Adicione/remova chaves conforme necessário.

Depois atualize o `LanguageSwitcher` em cada stack:
- `nortear-design-system-react/src/components/docs/shared/LanguageSwitcher.tsx`
- `nortear-design-system-vue/src/components/docs/shared/LanguageSwitcher.vue`
- etc.

> **Atenção**: descrições de componentes em `translations.json` devem ser **API-neutras** (ex: "modo múltiplo" e não `multiple: true`). Snippets de código stack-específicos ficam em chaves com sufixo `Code` (`structureCode`, `extensibilityCode`).

---

## Etapa 9 — README, LICENSE e nome do projeto

Substitua todas as ocorrências de "Nortear" pelo nome da sua marca:

```bash
# Em cada package.json
sed -i 's/nortear-design-system-vanilla/acme-design-system/g' nortear-design-system-vanilla/package.json
sed -i 's/"name": "nortear-design-system-react"/"name": "acme-react"/g' nortear-design-system-react/package.json
# (idem vue, svelte, nortear)

# README principal
sed -i 's/Nortear/Acme/g' README.md
sed -i 's/norteardesign.com.br/acme.design/g' README.md
```

**Importante**: revise os diffs antes de commitar — `sed` é cego e pode pegar ocorrências legítimas que você queria manter.

---

## Etapa 10 — Deploy (Vercel)

Este template publica **apenas os 4 Storybooks** — um portal/landing page que agrupa eles é um **projeto separado** que você cria fora deste repo (pode ser um site estático, um Next.js, um blog em qualquer framework — fica a seu critério).

### SEO: sitemap + robots (troque os domínios!)

O `build-storybook` de cada stack roda `scripts/generate-seo-files.mjs` ao final, gerando `sitemap.xml` + `robots.txt` no output com base no domínio passado via `--base`. **Esses domínios estão hardcoded no `package.json` de cada stack apontando pra `*.norteardesign.com.br`** — troque pelos seus:

```bash
# em cada <stack>/package.json, ajuste o --base do script build-storybook:
"build-storybook": "storybook build && node ../scripts/generate-seo-files.mjs --base https://react.SEUDOMINIO.com --out storybook-static"
```

Depois do primeiro deploy, submeta cada `https://<sub>.seudominio.com/sitemap.xml` no [Google Search Console](https://search.google.com/search-console).

No painel do Vercel, pra cada uma das 4 stacks:

1. **New Project → Import Git Repository**, seleciona o repo do seu design system
2. **Root Directory**: aponta pro subdiretório da stack (`nortear-design-system-react`, `nortear-design-system-vue`, etc.)
3. **Framework Preset**: Other (o `vercel.json` já configura build/install)
4. **Settings → Git → Ignored Build Step** → `node ../scripts/vercel-should-build.mjs` — ESSENCIAL para não queimar créditos: pula previews de PR (incluindo Dependabot) e só builda a stack cujos arquivos mudaram no push (um push que só toca outra stack não gasta build aqui). Para reativar previews, defina a env `VERCEL_PREVIEW_BUILDS=1` no projeto.
5. Após criar: **Settings → Domains** → adicione `react.suamarca.com` (ou equivalente)
6. Copie o hostname CNAME que o Vercel mostrar e configure no DNS do seu registrador
7. Aguarde propagação + provisionamento TLS (~2-15 min)

Veja a seção "Deploy" do [`README.md`](README.md) pra topologia completa.

---

## Etapa 11 — CLI customizada (opcional)

Se você quer que outras pessoas possam instalar seus componentes via `npx`:

```bash
cd nortear-cli
```

Edite [`nortear-cli/package.json`](nortear-cli/package.json):

```json
{
  "name": "acme",
  "bin": {
    "acme": "./bin/cli.js"
  },
  "version": "1.0.0"
}
```

Renomeie referências no código (`bin/cli.js`, `src/`) de `nortear` → `acme`.

Publique:

```bash
npm login
npm publish --access public
```

Daí o usuário final consegue:

```bash
npx acme@latest init
npx acme@latest add button card alert
```

---

## Checklist final antes do primeiro release

- [ ] `tokens.css` reflete a sua paleta
- [ ] Logo SVG atualizado nas 4 stacks
- [ ] Tipografia carregando corretamente (sem fallback em system-ui)
- [ ] `brandTitle` em todos os `manager.ts` aponta pra sua marca
- [ ] **GA4 configurado** — `.env.development`/`.env.production` preenchidos com SEUS IDs (a partir do `.env.example`) + `STORYBOOK_GA_MEASUREMENT_ID` definida nos projetos Vercel
- [ ] README sem menções residuais a "Nortear"
- [ ] `npm run storybook` roda em todas as 4 stacks sem erro
- [ ] `npm run build-storybook` builda com sucesso em todas as 4 stacks
- [ ] `npm run test-storybook` passa (ou você documentou as falhas remanescentes em `patches.md`)
- [ ] DNS configurado e Vercel deployando (se for publicar)
- [ ] CLI publicada no npm (se aplicável)

---

## Suporte e contribuição ao template original

Achou um bug no template? Tem uma melhoria genérica que não é específica da sua marca? Abra issue ou PR em [`julianamucci/design-system`](https://github.com/julianamucci/design-system) — a comunidade agradece.

Customizações específicas da sua marca devem ficar no seu fork, não voltam upstream.
