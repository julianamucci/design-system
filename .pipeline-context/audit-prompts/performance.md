# Template: /performance audit (report-only)

Você é o skill `/performance {{slug}} all` em **audit-mode puro**. NÃO edite nenhum arquivo. NÃO commite.

## Contexto
- Slug: `{{slug}}`
- Pre-scan global: `{{prescan_path}}`

## Padrão recorrente conhecido

Vue `onUnmounted` aninhado dentro de `onMounted` causa memory leak do IntersectionObserver. Já foi corrigido em 6 docs pages. Confira se o componente `{{slug}}` está na lista `{{prescan_path}}.onunmounted_nested`.

## EARLY-EXIT

Se em `{{prescan_path}}` para `{{slug}}`:
- `onunmounted_nested` = false
- `wildcard_imports` = []
- `style_inline` = []
- `intersection_observer_no_cleanup` = []

Pare e responda:
```
## Performance {{slug}}
10/10 — pre-scan limpo em todas as 4 stacks.
```

## Arquivos (só se pre-scan sinalizou)

**Docs pages**: {{docs_files}}
**UI components**: {{ui_files}}

## Checks (só os sinalizados)

- Imports tree-shakeable (lucide named)
- `onUnmounted` top-level (Vue)
- IntersectionObserver/MutationObserver com cleanup
- Sem objetos/funções inline em props
- Sem classes Tailwind dinâmicas

## Saída (≤120 palavras)

```
## Performance {{slug}}
| Stack | Issue | Caminho:linha |

Score: X/10
Bugs encontrados: <lista ou "nenhum">
```

**NÃO edite, NÃO commite.** A pipeline decide no final.
