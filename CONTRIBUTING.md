# Contribuindo

Obrigado por considerar contribuir com o Nortear Design System.

## Visão geral

Este é um monorepo com **4 stacks sincronizadas**. Qualquer mudança em conteúdo ou comportamento deve refletir nas 4 ao mesmo tempo (com adaptações idiomáticas). Para isso, existe uma estrutura de **skills automatizadas** que paralelizam o trabalho cross-stack.

## Setup

```bash
git clone <repo-url>
cd design-system

# Cada stack é independente. Instale onde for trabalhar:
cd design-system-react && npm install
cd ../design-system-vue && npm install
cd ../design-system-svelte && npm install
cd ../nortear-design-system && npm install
```

Pré-requisitos: Node 18+, npm.

## Padrões a seguir antes de qualquer mudança

1. **Leia o `CLAUDE.md` raiz** — convenções macro do monorepo.
2. **Leia o `CLAUDE.md` da stack** que você está editando — regras stack-específicas.
3. **Leia as guidelines compartilhadas** em `docs/shared/guidelines/` (01-acessibilidade, 04-padrões, 05-tom-de-voz, 06-seo-geo, 07-analytics, 08-docs-pages-foundations, 11-consistencia-cross-stack).
4. **Componentes existentes têm prioridade absoluta sobre código inline.** Antes de escrever `<div>`/`<button>`/`<table>`, verifique se existe um componente em `src/components/ui/` que atenda. Se existir, use.

## Fluxos típicos

### Adicionando um componente novo (cross-stack)

Use a **skill `/pipeline`** — orquestra automaticamente em paralelo:

```bash
/pipeline new <component-slug>
```

Cria, em ordem:
1. **Conteúdo** (`docs/shared/content/<slug>/translations.json`) via skill `/ux-writer`
2. **Audit determinístico inicial** via `scripts/audit.mjs`
3. **Primitivos + stories + docs page** nas 4 stacks (paralelo) via `/dev-react`, `/dev-vue`, `/dev-svelte`, `/dev-basecoat`
4. **Audits condicionais** (security, performance, quality, analytics, seo-geo) via skills
5. **Cross-stack audit** final via `/cross-stack`
6. **FIXES-NEEDED.md** consolidado

### Editando um componente existente

1. Identifique a categoria (Layout / Navigation / Form / Feedback / Display / Tables / Disclosure / Overlay).
2. Leia a guideline correspondente em `<stack>/guidelines/04-` a `<stack>/guidelines/10-`.
3. Edite o primitivo em `<stack>/src/components/ui/<slug>.{tsx,vue,svelte,ts}`.
4. Atualize as stories se a API mudou.
5. Atualize `translations.json` se mudou texto descritivo.
6. Rode `npm run build` + `npm run test-storybook:ci` na stack.
7. Se a mudança é cross-stack, replique nas outras 3 com adaptação idiomática.

### Patches upstream

Modificações em código gerado por `@base-ui/react`, `reka-ui`, `bits-ui` ou `basecoat-css` que **não podem viver em wrapper** devem ser registradas em [`patches.md`](patches.md).

Use `patch-package` para versionar:

```bash
cd design-system-<stack>
# edite o arquivo em node_modules/
npx patch-package <package>   # gera patches/<package>+<version>.patch
# adicione "postinstall": "patch-package" no package.json se ainda não tem
git add patches/ package.json package-lock.json
```

Em seguida, adicione uma entrada em `patches.md` no formato do template documentado lá.

## Política de testes (rígida)

**NUNCA**:
- `it.skip` / `test.skip` / `it.todo`
- `xfail` / `expect.soft`
- `parameters.a11y.disable` / `parameters.test.disable`
- Comentar testes para "passar"
- Afrouxar assertion para tolerar bug

**SEMPRE**:
- Conserte o primitivo se ele tem bug
- Adicione `aria-label` na story se faltar contexto
- Configuração de ferramenta (axe rules suppression para falsos-positivos conhecidos) é OK quando documentada com justificativa em `.storybook/test-runner.ts` e/ou `patches.md`

## Convenções de commit

Use prefixos descritivos:
- `feat(<scope>): ...` — nova funcionalidade
- `fix(<scope>): ...` — bugfix
- `docs(<scope>): ...` — só documentação
- `refactor(<scope>): ...` — sem mudança de comportamento
- `test(<scope>): ...` — só testes
- `chore(<scope>): ...` — build, deps, etc.
- `patch(<package>): ...` — patches upstream via patch-package
- `skill(<skill-name>): <component>` — quando uma skill foi executada

Scope é tipicamente a stack ou área (`react`, `vue`, `svelte`, `nortear`, `foundations`, `guidelines`, `stories`).

## Antes de abrir um PR

- [ ] `npm run build` passa na(s) stack(s) afetada(s)
- [ ] `npm run test-storybook:ci` passa (ou novas falhas são bugs reais documentados)
- [ ] `npm run chromatic` (se acesso) — visual regression ok
- [ ] Mudanças cross-stack aplicadas nas 4 stacks com paridade
- [ ] `translations.json` atualizado se mudou texto
- [ ] `patches.md` atualizado se mexeu em upstream
- [ ] Guidelines atualizadas se a API mudou

## Comunicação

Issues e PRs devem incluir:
- Stack(s) afetada(s)
- Categoria do componente (se aplicável)
- Screenshots para mudanças visuais
- Storybook URL local (`?path=/story/<slug>`) para validar comportamento
