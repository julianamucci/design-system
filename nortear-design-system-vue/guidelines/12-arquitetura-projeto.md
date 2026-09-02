# Arquitetura do Projeto — Documentação (Vue)

Este documento descreve a arquitetura técnica, estrutura de pastas e padrões organizacionais do projeto de documentação para Vue 3.

---

## Estrutura de Diretórios

```
src/
├── styles/
│   └── globals.css                  # Design system, variáveis CSS, temas
├── components/
│   ├── ComponentDemo.vue            # Wrapper para demos de componentes
│   ├── docs/shared/DocsNav.vue      # Navegação lateral sticky de seções
│   ├── ui/                          # Componentes base (Reka UI)
│   └── docs/                        # Páginas de documentação (.vue)
├── composables/                     # Composables reutilizáveis
│   └── use-mobile.ts
└── lib/
    └── utils.ts                     # cn() helper
```

Não há `App.vue`, `main.ts` na raiz de `src/` nem `index.html`: o único ponto de entrada é o Storybook, configurado em `.storybook/` (`main.ts`, `preview.ts`, `manager-head.html`), fora de `src/`. Atenção ao nome: o `main.ts` que existe é o `.storybook/main.ts` — outro arquivo, com outro papel.

---

## O sandbox de aplicação foi removido (2026-09-02)

Até esta data a stack carregava, além do Storybook, uma aplicação de vitrine própria: `src/App.vue` como ponto de entrada, `src/main.ts` montando o app, `index.html`, `HomePage.vue`, `ThemeSelector.vue`, roteamento por estado local e os scripts `dev` e `preview`. Nada disso existe mais, e a decisão vale para as quatro stacks de navegador — o Angular já operava assim e virou o modelo.

O motivo é medido, não estético:

- o sandbox **nunca era publicado** — os cinco `vercel.json` publicam `storybook-static`, que sai do `build-storybook`;
- **ninguém o abria**: a interface de desenvolvimento é o Storybook desde a migração para stories;
- **nenhum portão o auditava** — nem `audit.mjs`, nem as suítes, nem as stories alcançavam aquele grafo;
- por isso ele acumulou **172 classes mortas** de uma migração já encerrada, sem que nada reprovasse.

Duas consequências que mudam o que se roda:

1. **Nenhum dos cinco `npm run build` abre folha de estilo.** No Vue, `build` é `vue-tsc -b`: checa tipos e não emite. `@import` quebrado em CSS só reprova no `build-storybook`.
2. **Quem compila SFC agora é o `build-storybook`.** As armadilhas de template que o `vue-tsc` não pega — `v-html` em componente com slot, comentário `//` dentro de expressão, `as` solto — eram pegas pelo `vite build`, que saiu junto. Ao mexer em template de `ui/`, o portão é `npm run build-storybook`.

A folha `docs/shared/styles/nds/app-shell.css` definia a família `.nds-app-*` e existia só para essa moldura de aplicação. Com a remoção do sandbox ela ficou órfã — 26 seletores, zero consumidores —, e **foi apagada em 2026-09-02**, junto com o `@import` que a trazia para o `index.css`. Enquanto esteve órfã, era carregada em toda página das cinco stacks.

Não confunda com `.nds-sidebar-layout`, que a guideline 04 cita ao falar de "app-shell" como CONCEITO: essa mora em `layout.css`, é usada em cinco arquivos e continua viva.

---

## Componentes Principais

### 1. ComponentDemo.vue — Wrapper para Demos

Um `Card` com a classe `.nds-docs-demo` e o marcador `data-docs-preview="demonstracao"`, envolvendo o slot. A moldura — respiro, borda, raio e elevação — é da folha `docs-demo.css`; o wrapper não declara nada por conta própria.

---

### 2. DocsNav.vue — Navegação Lateral de Seções

**Localização**: `src/components/docs/shared/DocsNav.vue`
**Props**: `groups: Array<{ label, sections: Array<{ id, label }> }>`, `activeSection: string`

Navegação lateral das seções, montada dentro do `<nav>` que o `DocsPageLayout` já provê. As duas colunas e a fixação da navegação são de `.nds-sidebar-layout[data-sidebar-sticky="true"]` — a folha faz o sticky, a largura da coluna e o alinhamento ao topo; o `<nav>` só carrega `.nds-stack` com `data-spacing="md"` e o `aria-label`. Usa `IntersectionObserver` via `onMounted`/`onUnmounted` para detectar a seção ativa.

---

## Navegação e Roteamento

**Sem Vue Router e sem roteamento próprio.** A árvore de navegação é a barra lateral do Storybook, cuja ordem vem de `storySort` em `.storybook/preview.ts`. Uma docs page entra nessa árvore ao ganhar sua story — não há índice de páginas a manter em código de aplicação.

---

## Temas e Dark Mode

Tema, densidade, fonte e modo claro/escuro são globais da toolbar do Storybook. As classes correspondentes são aplicadas no `<html>` por `.storybook/preview.ts`, que assina os eventos `GLOBALS_UPDATED` e `SET_GLOBALS` em nível de módulo — decorator sozinho não reverte para o valor padrão neste renderizador. Nenhum componente de docs aplica classe de tema por conta própria.

---

## Composables

### useIsMobile
```ts
import { useIsMobile } from '@/composables/use-mobile'
const { isMobile } = useIsMobile()
```

---

## Padrões de Código Vue 3

### Estrutura de arquivo .vue
```vue
<script setup lang="ts">
// 1. imports Vue
// 2. imports de componentes
// 3. imports de ícones (lucide-vue-next)
// 4. defineProps / defineEmits
// 5. refs e computed
// 6. composables
// 7. funções
// 8. lifecycle (onMounted/onUnmounted)
</script>

<template>
  <!-- HTML semântico -->
</template>
```

### Convenções de nomenclatura

**Arquivos**:
- Componentes: `PascalCase.vue` (ex: `AlertDocs.vue`)
- Composables: `use-camelCase.ts` (ex: `use-mobile.ts`)
- Utilitários: `camelCase.ts` (ex: `utils.ts`)

---

## Adicionar Novo Componente

1. **Criar a página de documentação** em `/components/docs/NewComponentDocs.vue`, seguindo o template de 15 seções — ver `11-documentacao-componentes.md`.

2. **Criar as stories** do componente em `/components/ui/`. São elas que colocam a página na árvore do Storybook, na posição que `storySort` definir. Não há rota, catálogo nem registro em código de aplicação para atualizar: o entregável termina quando a docs page e a story existem.
