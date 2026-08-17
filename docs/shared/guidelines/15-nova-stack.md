# Criar uma Stack Nova — o que copiar, o que apontar, como verificar

Esta guideline existe porque uma stack nasceu **sem `guidelines/`** e ninguém notou por muito tempo: o Angular ficou invisível para toda regra de auditoria que varre `nortear-design-system-*/guidelines/`. "Limpo" ali era ausência de superfície, não higiene.

A lista abaixo foi **derivada por medição** dos cinco pacotes existentes, não escrita de memória. A regra de leitura é:

| Presença nos pacotes maduros | Status |
|---|---|
| 4 de 4 (ou 5 de 5) | **obrigatório** — a ausência é defeito até ser justificada por escrito |
| 3 ou menos | **avaliar** — pode ser idioma de uma stack só; a nota diz qual e por quê |

---

## 1. O que é CÓPIA e o que é PONTEIRO

`docs/shared/` existe para não duplicar. A lição já custou caro: `label.css` e `utilities.css` chegaram a ter **duas famílias para a mesma intenção, com valores diferentes**, e a que estava viva era a errada. Duplicata diverge em silêncio, e a divergência aparece meses depois como bug visual sem autor.

### Nunca copiar — sempre apontar por alias

Todo pacote declara `@shared/* → ../docs/shared/*`. Os sete diretórios abaixo são consumidos **pelo alias, sem cópia local**, e as cinco stacks fazem exatamente isso (medido):

| Diretório | O que é | Por que nunca se copia |
|---|---|---|
| `docs/shared/content/` | `translations.json` por componente (51 slugs) | o texto é o mesmo nas cinco stacks; cópia local viraria cinco redações divergentes |
| `docs/shared/styles/` | as regras `.nds-*` | é a definição do design system; cópia local é como uma stack "conserta" o visual sozinha |
| `docs/shared/tokens/` | tokens e movimento | idem |
| `docs/shared/themes/` | temas e densidades | idem |
| `docs/shared/primitives/` | lógica agnóstica (variantes de código, negociação de locale, rótulos de calendário e de sidebar, catálogo de ícones) | é código sem framework; duplicá-lo é duplicar comportamento |
| `docs/shared/testing/` | sondas por componente e o contrato de docs page | o que se verifica é observável de fora, então é igual nas cinco |
| `docs/shared/figma/` | links de design | uma fonte só |

**Teste de decisão**: se a resposta correta é a mesma nas cinco stacks, o lugar é `docs/shared/`. Se a resposta depende do framework, é cópia adaptada.

### Copiar e adaptar

O que muda de framework para framework. Copiar do pacote mais próximo e **adaptar**, não traduzir mecanicamente.

---

## 2. Inventário obrigatório da stack nova

### 2.1 `guidelines/` — 16 arquivos, os mesmos nomes

Medido: react, vue, svelte e vanilla têm **exatamente os mesmos 16 nomes**. O tamanho varia muito (react 5.062 linhas, vanilha 2.588, svelte 2.448) — o que não varia é o conjunto de nomes.

```
01-regras-gerais.md
02-template-caracteres-especiais.md     (react usa 02-jsx-caracteres-especiais.md)
03-sistema-design.md
04-layout-components.md
05-navigation-components.md
06-form-components.md
07-feedback-components.md
08-display-components.md
09-disclosure-components.md
10-overlay-components.md
11-documentacao-componentes.md
12-arquitetura-projeto.md
12-block-components.md                  (vazio nas cinco — ver nota)
13-system-design.md
Guidelines.md
RULES.md
```

**Nome fora desse conjunto fica invisível para a auditoria.** Duas regras varrem este diretório:

- `dead_lib_in_infra` — vocabulário morto (biblioteca que saiu do projeto) em qualquer `.md` daqui
- `code_in_component_guideline` — **bloco de código de implementação em `04-` a `10-`**. Guideline de componente traz propósito, árvore ASCII, tabelas e regras; o código vive no componente e no `translations.json`, que não envelhecem juntos. Modelo canônico: `## DataTable` em `08-display-components.md`

Nota sobre `12-block-components.md`: existe com **zero bytes** nas cinco stacks e o número 12 está duplicado (com `12-arquitetura-projeto.md`). É resíduo, não padrão. Mantido por ora para o conjunto ficar comparável; se for removido, remova nas cinco de uma vez.

### 2.2 `CLAUDE.md` — ponteiro, não manual

Medido: react 19 linhas, vue 21, svelte 21, vanilla 21. O do Angular tinha **284 linhas autocontidas** e não referenciava `guidelines/` em lugar nenhum — foi o que tornou a stack invisível.

O `CLAUDE.md` de um pacote é um **ponteiro de ~20 linhas**: qual é a stack, onde estão as guidelines locais, onde estão as compartilhadas. Conhecimento operacional (armadilha, decisão de build, convenção) vai para o arquivo de guideline do assunto, onde alguém procurando por aquele assunto vai encontrá-lo.

> **Cuidado com ponteiro para arquivo que não existe.** Medido: `svelte/CLAUDE.md` e `vanilla/CLAUDE.md` apontam para `STORYBOOK-ARCHITECTURE.md`, e esse arquivo **só existe no react** (o vue tem um homônimo com sufixo, `STORYBOOK-ARCHITECTURE-VUE.md`). Ponteiro morto é pior que ausência: ele afirma que existe documentação. Ao criar a stack nova, não copie a linha sem copiar o arquivo — ou não cite o arquivo.

### 2.3 `src/lib/` — 12 arquivos em 4 de 4

| Arquivo | Presença | Função |
|---|---|---|
| `i18n` | 5/5 | `useTranslation` mais o `STACK` que resolve a variante das chaves `*Code` |
| `use-seo` | 5/5 | metatags no documento pai; título recebe `· Design System` aqui |
| `analytics` | 5/5 | `track()` tipado; `AnalyticsEvents` é a lista fechada de eventos |
| `use-active-section` | 5/5 | `onActive` imediato, `onDwell` após 2s |
| `docs-tracking` | 5/5 | observer de clique via `data-track*` |
| `strip-html` | 5/5 | `stripHtml` e `toPlainText` — dois destinos, duas funções |
| `story-tags` | 5/5 | slug → categoria, para o filtro da sidebar |
| `withAutoDocsTab` | 5/5 | aba de documentação da story |
| `wait-for-portal` | 5/5 | espera o overlay assentar antes de afirmar |
| `reload-on-chunk-error` | 5/5 | recarrega quando o Vite troca chunk sob os pés |
| `utils` | 5/5 | `cn()`. **Sem helper de sanitização** — `DOMPurify.sanitize()` vai no call site |
| `motion` | **4/5** | presets de duração e detecção de movimento reduzido em JS |

**`motion` é o caso que a regra existe para pegar.** Está em react, vue, svelte e vanilla; **não** está no angular. É defensável — o único consumidor era o Chart, e o Chart do Angular desenha SVG sem animação em JS — mas defensável **por escrito**, não por omissão silenciosa. A stack nova que não trouxer um dos doze registra a razão no `13-system-design.md` dela.

Arquivos que são idioma de uma stack só (não copiar sem motivo): `hooks` (svelte), `echarts-theme`, `destroy`, `listener-ledger` (vanilla), `montarAngularEmReact` (angular).

### 2.4 `.storybook/` — 7 arquivos em 5 de 5

```
main.*               framework, addons, glob de stories
preview.*            providers, decorators, toolbar das 5 dimensões de tema, storySort
manager.*            tema do shell
manager-head.html    GA4 — no MANAGER, nunca no iframe
preview-head.html    sync de tema no iframe
chromatic-link.*     link para o build visual
brand-logo.svg       logo do shell
```

Dois pontos não negociáveis:

- **GA4 vive no `manager-head.html`**, com envio automático de página desligado. No iframe, cada story seria registrada como a mesma página. **O repositório é público**: esse arquivo não pode carregar um identificador de medição real num commit
- O `preview.*` aplica as cinco dimensões de tema por classe no `<html>`. Em react, vue e svelte a aplicação só por decorator **nunca reverte ao default** — a saída lá foi assinar `GLOBALS_UPDATED` e `SET_GLOBALS` em escopo de módulo. Vanilla e angular não têm essa assinatura; se a stack nova reverter mal ao default, a correção é essa

Angular tem um oitavo arquivo aqui, `.storybook/tsconfig.json`, por exigência do compilador dele. Idioma de stack.

### 2.5 `src/components/docs/shared/` — 18 arquivos de seção em 5 de 5

Os 17 containers mais o `index`, com **os mesmos nomes** nas cinco:

```
DocsPageLayout  DocsHeader        DocsDemonstration  DocsAnatomy
DocsWhenToUse   DocsDoDont        DocsImport         DocsVariants
DocsCompositions DocsStates       DocsProps          DocsTokens
DocsAccessibility DocsRelated     DocsNotes          DocsAnalytics
DocsTestes      index
```

Mais, no diretório acima: `DocsNav`, o renderizador de página de fundamento e o `Swatch`. Os nomes desses três variam entre as stacks (`FoundationPage`, `FoundationsRenderer`, `foundationsRenderer`) — variação sem ganho, não a imite por imitar.

O que **muda** por framework é como o preview chega ao container: `TemplateRef` no angular, factory no vanilla, slot ou snippet nas demais. A skill `docs-sections` gera esses 17 para uma stack nova.

### 2.6 Configuração de pacote

| Arquivo | Presença | Nota |
|---|---|---|
| `package.json` | 5/5 | scripts `storybook`, `build-storybook`, `test`, `lint`, `chromatic`. **Porta única** — 6006/6007/6008/6009/6010 estão tomadas |
| `tsconfig.json` | 5/5 | aliases `@/*` e `@shared/*` |
| `vite.config.ts` | 5/5 | os mesmos aliases |
| `chromatic.config.json` | 5/5 | regressão visual |
| `.env.example` + `.development` + `.production` | 5/5 | `.example` é o único versionado com valor |
| `eslint.config.js` | **4/5** | falta no angular, **que declara `"lint": "eslint ."` no `package.json`** — script quebrado |
| `vercel.json` | **4/5** | falta no angular; é a configuração de publicação |
| `index.html` | **4/5** | falta no angular, e ali é justificado: é a entrada do sandbox, e o angular não tem sandbox |

O alias `@shared` precisa existir em **todos** os lugares onde há resolução de módulo — `tsconfig`, `vite.config` e, se o framework montar a própria config de Vite, também ali. Alias declarado em dois dos três lugares falha só em um dos três comandos, e sempre no menos usado.

### 2.7 Suíte de fumaça das docs pages

Um `docs-smoke.stories.ts` com **um export por docs page**, rodando o contrato de conteúdo de `@shared/testing/docs-page-contract` mais o axe. É o portão que pega docs page que monta vazia, e é onde a stack nova prova que tem paridade de páginas.

---

## 3. Como VERIFICAR que a stack nova está completa

Copiar não é terminar. A verificação é por medição, e nesta ordem:

### 3.1 Paridade de conjuntos de arquivo

Comparar os nomes, não o conteúdo. O que está em 4 de 4 e falta na nova é defeito ou nota escrita:

```bash
NOVA=nortear-design-system-<nova>

# guidelines: tem de dar 16, com os mesmos nomes
for s in react vue svelte vanilla $NOVA; do
  echo -n "$s: "; ls nortear-design-system-${s#nortear-design-system-}/guidelines/*.md 2>/dev/null | wc -l
done

# lib, .storybook e sections: diff de nomes contra o vanilla
for d in src/lib .storybook src/components/docs/shared/sections; do
  echo "── $d"
  diff <(ls nortear-design-system-vanilla/$d | sed -E 's/\.[a-z.]+$//' | sort) \
       <(ls $NOVA/$d               | sed -E 's/\.[a-z.]+$//' | sort)
done
```

### 3.2 Paridade de páginas

Contar docs pages de componente e de fundamento contra uma stack madura, e contar os exports do `docs-smoke`. Página faltando é conteúdo faltando, não estilo.

### 3.3 Os portões determinísticos

```bash
node scripts/audit.mjs --all --json          # inclusive o slug _infra
node scripts/audit-translation-literals.mjs  # 5 seções
node scripts/audit-translation-literals.mjs --only cobertura   # chaves *Code sem variante da nova stack
```

Três coisas que a stack nova sempre acende:

- **`--only cobertura`** lista as chaves `*Code` que ainda não têm variante para ela. A resolução cai para `web` → `react`, então nada quebra — mas a lista é a fila de trabalho real
- **`dead_lib_in_infra`** varre as `guidelines/` que você acabou de escrever. Biblioteca que saiu do projeto não se ensina, mesmo copiando de guideline antiga; e classe utilitária da era anterior (`ring-offset-2` e parentes) não se copia
- **`code_in_component_guideline`** cobra as guidelines `04-` a `10-` sem bloco de código

### 3.4 Os portões da própria stack

```bash
cd $NOVA
npx tsc --noEmit          # ou a checagem de tipos do framework
npm run lint              # exige eslint.config.js — ver 2.6
npm test                  # foreground, timeout 600000; background já morreu em silêncio
npm run build-storybook
```

### 3.5 Verificação manual, do que teste não cobre

- Trocar as **cinco** dimensões de tema pela toolbar **e voltar ao default** em cada uma
- Abrir a aba de documentação de uma story e conferir que o painel Code mostra o **uso**, não o andaime da story
- Trocar de idioma numa docs page e conferir que texto, metatags e snippets acompanham

---

## 4. A ordem que evita retrabalho

1. `package.json`, `tsconfig`, `vite.config`, aliases — nada funciona antes disso
2. `.storybook/` completo, com o GA4 no manager e sem identificador real
3. `src/lib/` — os 12 arquivos, adaptados ao idioma do framework
4. Os 17 containers de seção (skill `docs-sections`)
5. **`guidelines/` e o `CLAUDE.md` ponteiro** — antes dos componentes, não depois: é o que torna a stack visível para a auditoria enquanto ela ainda está sendo construída
6. Componentes, um por um, cada um com primitivo, stories, docs page e export no `docs-smoke`
7. `eslint.config.js`, `vercel.json` e a verificação da seção 3

O passo 5 vindo depois do 6 é exatamente como o Angular chegou a 47 componentes prontos e zero guidelines.
