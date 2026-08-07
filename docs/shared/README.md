# @nortear/ds-core

Fonte de verdade do Nortear Design System. Contém o que **não** depende de
framework: tokens, temas, conteúdo trilíngue das docs pages e guidelines.

Os quatro stacks web deste monorepo consomem esta pasta pelo alias `@shared`
(caminho relativo, sem instalação). Um consumidor **fora** do monorepo — o repo
Flutter, uma docs page externa — consome como pacote versionado.

## O que tem aqui

| Pasta | Conteúdo | Depende de navegador? |
|---|---|---|
| `content/<slug>/translations.json` | conteúdo pt-BR/en/es das docs pages | não (exceto snippets) |
| `themes/` | temas em custom properties CSS + `theme-config.ts` | sim (CSS) |
| `tokens/` | `tokens.css`, `motion.css`, variáveis do Figma em JSON | parcial (o JSON não) |
| `primitives/` | TS puro: clipboard, highlight de código, variantes de código | não |
| `styles/nds/` | CSS `.nds-*` dos componentes | sim |
| `guidelines/` | regras cross-stack em markdown | parcial |
| `assets/` | ícones e ilustrações SVG | não |
| `skill-refs/` | schemas e referências consumidos pelas skills | não |
| `figma/` | links de design por componente | não |

Para gerar tema de um consumidor não-CSS (Dart, Swift, Kotlin), a origem é
`tokens/figma-variables.json` — não os arquivos `.css`.

## Contrato de conteúdo

`content/<slug>/translations.json` tem os três locales no topo (`pt-BR`, `en`,
`es`) e as mesmas chaves em todos. O schema completo está em
`skill-refs/translations-schema.md`.

Duas regras valem para qualquer consumidor:

**Texto descritivo é neutro de API.** Descrição de prop, de estado e de variante
fala do conceito ("modo múltiplo", "callback de mudança"), não do nome que um
stack deu a ele. Quem verifica: `scripts/audit-translation-literals.mjs`.

**Código é por stack.** Chave terminada em `Code` aceita duas formas:

```jsonc
// string — vale para qualquer stack
"structureCode": "Button(child: Text('Salvar'))"

// objeto — um snippet por stack
"structureCode": {
  "react":   "<Button>Salvar</Button>",
  "vue":     "<Button>Salvar</Button>",
  "flutter": "Button(child: Text('Salvar'))"
}
```

`web` é um grupo, não um stack: cobre react, vue, svelte e vanilla de uma vez.
Serve para snippet de CSS, idêntico entre eles e inexistente fora do navegador.

A resolução vive em `primitives/code-variants.ts` e é chamada pelo `i18n` de
cada stack. Sem variante para o stack pedido, o fallback é `web` → `react` →
primeira definida — o leitor nunca vê bloco vazio, e a lacuna aparece em
`node scripts/audit-translation-literals.mjs --only cobertura`.

Stack novo entra em `STACKS` no mesmo arquivo.

## Consumir fora do monorepo

Não está publicado no npm. Empacote a partir do repo:

```bash
npm run core:pack          # gera nortear-ds-core-<versão>.tgz na raiz
```

E no consumidor, aponte para o tarball ou para o repositório git com um commit
fixado. Fixar é o ponto: o consumidor decide quando absorve mudança de conteúdo.

## Versionamento

Semver sobre o **contrato**, não sobre o texto:

- **patch** — correção de texto, tradução, novo snippet de variante
- **minor** — slug novo, chave nova, stack novo em `STACKS`
- **major** — chave removida ou renomeada, mudança de forma de valor

Renomear ou remover chave quebra todo consumidor em silêncio (o `t()` devolve a
própria chave, não um erro). Trate como breaking.
