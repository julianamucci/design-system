# Descritivo Técnico: Nortear Design System

Este documento apresenta uma visão técnica e detalhada do **Nortear Design System**, um ecossistema de componentes e diretrizes projetado para ser *multi-tenant* e suportar múltiplas stacks de frontend, garantindo consistência visual e comportamental em toda a plataforma.

## 1. Visão Geral da Arquitetura

O projeto adota uma arquitetura de **Monorepo**, gerenciando diferentes implementações do design system lado a lado. Isso permite o compartilhamento de tokens, testes, diretrizes e assets, reduzindo a duplicação e facilitando a consistência cross-stack.

A estrutura principal divide-se em:
- `design-system-react/`
- `design-system-vue/`
- `design-system-svelte/`
- `nortear-design-system/` (Vanilla JS/CSS)
- `docs/shared/` (Documentação unificada, tokens, temas e guidelines)

## 2. Tecnologias e Ferramentas Base

Cada pacote é otimizado para o seu ecossistema, mas compartilha um núcleo ferramental comum para documentação, build e testes:

### Core / Bundling
- **Vite (v8)**: Utilizado em todas as stacks como bundler rápido e dev server.
- **Tailwind CSS (v4)**: Motor de estilização principal, responsável por consumir os design tokens e gerar a utility-class layer, otimizada pela nova engine v4.
- **TypeScript**: Padrão adotado em todas as stacks para tipagem estática.

### Componentes Base (Headless & Primitives)
O Nortear não reconstrói primitivas de UI do zero. Ele se apoia no ecossistema do **shadcn/ui** e seus ports oficiais para garantir acessibilidade e comportamento padrão da web, aplicando os tokens visuais por cima:
- **React**: Utiliza `@base-ui/react` (via registry *base-nova* do shadcn).
- **Vue**: Utiliza `reka-ui` (via *reka-nova*).
- **Svelte**: Utiliza `bits-ui` (via *nova*).
- **Vanilla**: Utiliza pacote estático `basecoat-css`.

### Documentação e Testes
- **Storybook (v10)**: O coração da documentação. Cada stack roda sua própria instância do Storybook, mas com uma arquitetura de documentação `.mdx` padronizada em 15 seções (anatomia, a11y, testes, etc.).
- **Vitest & Playwright**: Para testes unitários e de componente (test-runner do Storybook).
- **Chromatic**: Integração ativa para testes de regressão visual (visual testing) disparados por stack (`npm run chromatic:all`).

## 3. Gestão de Temas e Tokens Visuais

O design system suporta ativamente **7 temas** (Nova, Vega, Maia, Lyra, Mira, Luma, Sera). 

A abordagem técnica evita *forks* de componentes por tema através de uma estratégia estrita de **Tokenização de Dimensões**:
- Variáveis CSS (Custom Properties) como `--height-default` ou `--size-xs` são injetadas em componentes iterativos.
- O mapeamento ocorre no nível do CSS (`docs/shared/tokens/tokens.css` e overrides temáticos em `docs/shared/themes/`).
- Essa técnica combinada com o Tailwind CSS garante que as dimensões estruturais reajam ao tema sem custo de runtime em JS.

## 4. O Sistema de "Patches" (PATCHES.md)

Como o design system é construído em cima de primitives de terceiros e CLI de geração (ex: `shadcn@latest add`), modificações diretas no código gerado podem ser perdidas durante uma atualização. Para resolver isso, existe um fluxo de engenharia rigoroso documentado no arquivo `PATCHES.md`:

1. **Wrapper-first**: Sempre tentar encapsular um componente antes de modificá-lo.
2. **Patching rastreável**: Se for essencial alterar a estrutura base gerada (ex: `a11y`, `i18n`, `bugfix`), a linha é obrigatoriamente comentada no código com `// PATCH: ...`.
3. **Auditoria (`npm run patches:list`)**: Scripts automatizados validam as modificações locais comparando com as fontes de upstream (*shadcn, basecoat, etc.*) antes e depois de atualizações.

## 5. Destaques Técnicos

- **Acessibilidade (a11y)**: Fortemente testada com *axe-playwright* e baseada nas primitivas do Base UI/Reka UI, garantindo suporte pleno a teclado, leitores de tela e estados WAI-ARIA adequados.
- **Performance**: Tempo de load da documentação otimizado; regras estritas contra extensões massivas de classes CSS não processadas no Tailwind, preferindo CSS vars em cascades extensas para diminuir o bundle e evitar timeouts.
- **Consistência Cross-Stack**: Scripts automatizados (ex: `scripts/validate-docs-consistency.ts`) garantem que a documentação, tokens e guidelines presentes em `docs/shared/` estejam perfeitamente alinhados e refletidos em React, Vue, Svelte e Vanilla simultaneamente.
- **SEO & Internacionalização (i18n)**: Práticas incorporadas à própria engine de documentação (Storybook) e aos componentes expostos.
