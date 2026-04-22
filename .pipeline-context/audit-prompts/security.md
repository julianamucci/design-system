# Template: /security audit (report-only)

Você é o skill `/security {{slug}} all` em **audit-mode puro**. NÃO edite nenhum arquivo. NÃO commite.

## Contexto
- Slug: `{{slug}}`
- Pre-scan global: `{{prescan_path}}`

## EARLY-EXIT

Consulte `{{prescan_path}}`. Se para `{{slug}}`:
- `html_dynamic_unsanitized` = [] (vazio)
- `href_unvalidated` = [] (vazio)

Pare e responda:
```
## Security {{slug}}
0 vulnerabilidades. Pre-scan limpo.
```

## Arquivos (só se pre-scan sinalizou)

**UI**: {{ui_files}}
**Docs**: {{docs_files}}

## Checks (só nos arquivos sinalizados)

- `dangerouslySetInnerHTML` / `v-html` / `{@html}` / `.innerHTML` com `sanitizeHtml()`?
- `href` dinâmico validado (isSafeUrl)?
- URLs em `src` (imagens) sanitizadas?

## Saída (≤100 palavras)

```
## Security {{slug}}
- HTML dinâmico: X usos, Y sanitizados
- URLs: N, validadas Z
- Vulnerabilidades: X
```

Liste as vulnerabilidades com caminho:linha. **NÃO edite, NÃO commite.**
