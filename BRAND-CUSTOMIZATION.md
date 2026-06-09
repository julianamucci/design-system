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
| React | [`design-system-react/src/styles/globals.css`](design-system-react/src/styles/globals.css) (linha 6, `@import url('...fonts.googleapis.com/...')`) |
| Vue | [`design-system-vue/src/styles/globals.css`](design-system-vue/src/styles/globals.css) |
| Svelte | [`design-system-svelte/src/styles/globals.css`](design-system-svelte/src/styles/globals.css) |
| Nortear | [`nortear-design-system/index.html`](nortear-design-system/index.html) + [`nortear-design-system/.storybook/preview-head.html`](nortear-design-system/.storybook/preview-head.html) (via `<link>`) |

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
cp meu-logo.svg design-system-react/.storybook/brand-logo.svg
cp meu-logo.svg design-system-vue/.storybook/brand-logo.svg
cp meu-logo.svg design-system-svelte/.storybook/brand-logo.svg
cp meu-logo.svg nortear-design-system/.storybook/brand-logo.svg
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

## Etapa 7 — Conteúdo trilíngue (opcional)

Se você quer remover idiomas (ex: ficar só em pt-BR + en) ou adicionar mais:

**Arquivo**: [`docs/shared/content/<slug>/translations.json`](docs/shared/content/) (um por componente)

Cada arquivo tem 3 chaves de primeiro nível: `pt-BR`, `en`, `es`. Adicione/remova chaves conforme necessário.

Depois atualize o `LanguageSwitcher` em cada stack:
- `design-system-react/src/components/docs/shared/LanguageSwitcher.tsx`
- `design-system-vue/src/components/docs/shared/LanguageSwitcher.vue`
- etc.

> **Atenção**: descrições de componentes em `translations.json` devem ser **API-neutras** (ex: "modo múltiplo" e não `multiple: true`). Snippets de código stack-específicos ficam em chaves com sufixo `Code` (`structureCode`, `extensibilityCode`).

---

## Etapa 8 — README, LICENSE e nome do projeto

Substitua todas as ocorrências de "Nortear" pelo nome da sua marca:

```bash
# Em cada package.json
sed -i 's/nortear-design-system/acme-design-system/g' nortear-design-system/package.json
sed -i 's/"name": "design-system-react"/"name": "acme-react"/g' design-system-react/package.json
# (idem vue, svelte, nortear)

# README principal
sed -i 's/Nortear/Acme/g' README.md
sed -i 's/norteardesign.com.br/acme.design/g' README.md

# Landing page
sed -i 's/Nortear/Acme/g' landing/index.html
sed -i 's/norteardesign.com.br/acme.design/g' landing/index.html
```

**Importante**: revise os diffs antes de commitar — `sed` é cego e pode pegar ocorrências legítimas que você queria manter.

---

## Etapa 9 — Deploy (Vercel)

Se você quer publicar, atualize os domínios em cada `<stack>/vercel.json` (apenas se quiser CSP/Cache headers diferentes — domínios em si são configurados no painel do Vercel).

Depois, no painel do Vercel:
1. Crie 5 projetos novos (um por stack + um pra landing)
2. Conecte cada um ao seu repo, apontando o **Root Directory** corretamente:
   - `landing/`
   - `design-system-react/`
   - `design-system-vue/`
   - `design-system-svelte/`
   - `nortear-design-system/` (renomeie se quiser)
3. Em **Settings → Domains** de cada projeto, adicione o subdomínio próprio (ex: `react.acme.design`)
4. Configure DNS no seu registrador com os CNAMEs específicos que cada projeto Vercel mostrar

Veja a seção "Deploy" do [`README.md`](README.md) pra topologia completa.

---

## Etapa 10 — CLI customizada (opcional)

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
- [ ] README e landing page sem menções residuais a "Nortear"
- [ ] `npm run storybook` roda em todas as 4 stacks sem erro
- [ ] `npm run build-storybook` builda com sucesso em todas as 4 stacks
- [ ] `npm run test-storybook` passa (ou você documentou as falhas remanescentes em `patches.md`)
- [ ] DNS configurado e Vercel deployando (se for publicar)
- [ ] CLI publicada no npm (se aplicável)

---

## Suporte e contribuição ao template original

Achou um bug no template? Tem uma melhoria genérica que não é específica da sua marca? Abra issue ou PR em [`julianamucci/design-system`](https://github.com/julianamucci/design-system) — a comunidade agradece.

Customizações específicas da sua marca devem ficar no seu fork, não voltam upstream.
