# Template: /cross-stack audit (report-only)

Você é o skill `/cross-stack {{slug}}` em **audit-mode puro**. NÃO edite nenhum arquivo. NÃO commite nada. Apenas reporte.

## Contexto
- Slug: `{{slug}}`
- Categoria: `{{category}}`
- Context-cache (LER PRIMEIRO, depois pare): `{{context_cache_path}}`
- Pre-scan global: `{{prescan_path}}` (consulte em vez de fazer grep)

## Arquivos a auditar (pré-descobertos pela pipeline)

**React**: {{react_files}}
**Vue**: {{vue_files}}
**Svelte**: {{svelte_files}}
**Basecoat**: {{basecoat_files}}

## EARLY-EXIT (obrigatório)

Antes de ler qualquer arquivo individual, consulte `{{prescan_path}}` procurando o slug `{{slug}}`. Se todas as categorias do pre-scan aparecerem **vazias** para esse slug, pare imediatamente e responda:

```
## Cross-stack {{slug}}
Score: 10/10 — sem divergências detectadas pelo pre-scan.
```

Se houver qualquer hit, aí sim investigue o arquivo específico citado.

## Checks (só os que o pre-scan sinalizou)

- Variantes idênticas entre R/V/S/B
- Classes `cva()`/`tv()` coerentes (React = fonte canônica)
- 14 seções na docs page
- Meta único com `autodocs`
- Tokens `h-(--height-*)`/`size-(--size-*)` nos 3 stacks Tailwind (Basecoat pula)

## Saída (≤120 palavras)

```
## Cross-stack {{slug}}
| Check | R | V | S | B |
|---|---|---|---|---|
...

Score: X/10
Divergências: <lista curta ou "nenhuma">
```

**NÃO** inclua "commit sugerido", "comando manual", "permissão negada" — a pipeline cuida de commits em batch no final.
