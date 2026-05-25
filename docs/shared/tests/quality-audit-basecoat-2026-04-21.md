# Quality Audit — Basecoat Storybook

**Data**: 2026-04-21
**Stack**: Basecoat (port 6009)
**Ferramenta**: `@storybook/test-runner` + `axe-playwright`
**Comando**: `npm run test-storybook:ci`

## Resultado

```
Test Suites: 10 failed, 1 skipped, 13 passed, 23 of 24 total
Tests:       18 failed, 1 skipped, 63 passed, 82 total
Time:        18.7 s
```

## Violações Agrupadas por Causa

### 1. `color-contrast` (WCAG 2 AA) — 14 violações

Contraste insuficiente entre foreground e background em variantes `destructive`, `success` e `warning` de Alert e Button. Provavelmente os tokens HSL dessas variantes estão abaixo do mínimo 4.5:1 para texto normal e 3:1 para texto grande.

**Stories afetadas**:

| Suíte | Story | Violações |
|-------|-------|-----------|
| `alert-variantes` | Destructive | 2 |
| `alert-variantes` | Success | 2 |
| `alert-variantes` | Warning | 1 |
| `alert-composicoes` | SemTituloCompacto | 1 |
| `alert-composicoes` | MultiplosTipos | 5 |
| `button-variantes` | Destructive | 1 |
| `button-composicoes` | IconeDestrutivo | 1 |
| `alert-dialog` | Playground | 1 |
| `alert-dialog-composicoes` | Destrutiva | 1 |
| `alert-dialog-composicoes` | Neutra | 1 |
| `alert-dialog-estados` | Closed/Open/Confirmed/Cancelled | 1 cada |
| `accordion` | Playground | 1 |

**Ação**:
- Medir contraste real de cada token (`--destructive`, `--success`, `--warning` e respectivos `-foreground`) com a ferramenta do Chrome DevTools ou [coolors contrast checker](https://coolors.co/contrast-checker).
- Ajustar valores HSL em `docs/shared/themes/*.css` até atingir 4.5:1.
- Re-rodar `npm run test-storybook:ci` após cada tema corrigido.

### 2. `aria-prohibited-attr` — 2 violações

`<span>` com `aria-label` não é permitido — `aria-label` exige que o elemento tenha um `role` semântico ou seja um elemento interativo.

**Stories afetadas**:

| Suíte | Story | HTML problemático |
|-------|-------|-------------------|
| `avatar-composicoes` | WithStatus | `<span class="absolute ..." aria-label="online">` |
| `avatar-composicoes` | WithIcon | `<span class="flex h-full ..." aria-label="Usuário genérico">` |

**Ação**:
- **Status dot**: remover `aria-label` do `<span>`; usar `<span role="status" aria-label="online">` ou adicionar texto visualmente oculto (`sr-only`).
- **Fallback com ícone**: remover `aria-label` do `<span>` wrapper; adicionar `aria-label` ao `<svg>` interno ou usar `role="img"`.

Corrigir em:
- `nortear-design-system/src/components/ui/avatar.ts` (primitivo — se o problema for herdado)
- `nortear-design-system/src/components/ui/avatar-composicoes.stories.ts` (stories)
- Avaliar se afeta outras stacks (React/Vue/Svelte) e aplicar PATCH se sim.

### 3. Bug funcional — Avatar Failed estado ✅ CORRIGIDO (commit 17ef7d8)

`UI/Avatar/Estados › Failed` — teste `play-test` falhava com `expect(element).toBeVisible()` porque o fallback estava com `style="display: none;"`. Causa real: a lógica iniciava ocultando o fallback e só o mostrava no evento `onerror` — em ambiente headless o evento nem sempre disparava dentro da janela do teste.

**Correção aplicada**:
- `avatar.ts`: inversão da lógica. Fallback passa a ser o estado inicial visível. Imagem inicia com `display:none` e aparece no evento `load`. Reconciliação de estado via `img.complete` + `naturalWidth` quando a imagem já está em cache.
- `avatar-estados.stories.ts`: teste `Loaded` ajustado de `getByRole` para `findByRole` (aguarda a imagem ficar acessível após load).

Resultado: `avatar-estados` suíte 4/4 passando.

## Priorização Sugerida

| Prioridade | Task | Escopo |
|------------|------|--------|
| **P1** | Ajustar tokens `destructive`/`success`/`warning` para atingir 4.5:1 | `docs/shared/themes/*.css` (afeta todas as stacks) |
| ~~**P1**~~ | ~~Corrigir Avatar Failed fallback~~ ✅ resolvido (17ef7d8) | ~~`nortear-design-system/src/components/ui/avatar.ts`~~ |
| **P2** | Remover `aria-label` de `<span>` sem `role` | avatar Basecoat + avaliar outras stacks |
| **P3** | Validar test-runner em React/Vue/Svelte após correções | executar `test-storybook:ci` em cada |

## Próximos Passos

1. Abrir tasks separadas por grupo acima (P1 tokens, P1 avatar fallback, P2 aria).
2. Cada correção deve re-executar o test-runner da stack afetada.
3. Quando Basecoat estiver limpo, rodar test-runner nas outras 3 stacks para capturar violações equivalentes.

## Notas

- O test-runner foi instalado nesta sessão — é a primeira vez que violações são capturadas automaticamente.
- Violações de contraste são provavelmente **sistêmicas** (afetam todas as stacks porque os tokens são compartilhados via `docs/shared/themes/`).
- A violação `aria-prohibited-attr` é específica do Basecoat (implementação vanilla do Avatar) ou pode estar espelhada nos outros Avatars — checar.
