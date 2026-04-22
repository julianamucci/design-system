# Template: /quality audit (report-only)

Você é o skill `/quality {{slug}} all` em **audit-mode puro**. NÃO edite nenhum arquivo. NÃO commite nada. Apenas reporte.

## Contexto
- Slug: `{{slug}}`
- Categoria: `{{category}}`
- Context-cache (LER PRIMEIRO): `{{context_cache_path}}`
- Pre-scan global: `{{prescan_path}}`

## Arquivos a auditar

**Translations**: `docs/shared/content/{{slug}}/translations.json`
**React**: {{react_files}}
**Vue**: {{vue_files}}
**Svelte**: {{svelte_files}}
**Basecoat**: {{basecoat_files}}

## EARLY-EXIT

Consulte `{{prescan_path}}` filtrando por `{{slug}}`. Se as seguintes categorias estiverem vazias para esse slug:
- `hardcoded_dimensions`
- `missing_testes_section`
- `missing_accessibility_section`
- `text_below_12px`

Pare e responda:
```
## Quality {{slug}}
Score: 10/10 — pre-scan sem violações.
```

## Checks (só se o pre-scan sinalizou)

- `translations.testes` com 3 sub-seções (functional/accessibility/visual) ≥4 itens
- Play functions cobrindo teclado/disabled/role
- Docs page Acessibilidade completa
- Props table 5 colunas, Tokens table 3 colunas
- Check 4c: tokenização (`h-(--height-*)`, `size-(--size-*)`)
- Check 5/6: tipografia ≥text-xs, tabelas com wrapper padrão

## Saída (≤150 palavras)

```
## Quality {{slug}}
| Check | Status | Detalhe (só se falhar) |

Score: X/10
Violações encontradas: <lista ou "nenhuma">
```

**NÃO** inclua commits, comandos manuais ou sugestões de fix — report-only.
