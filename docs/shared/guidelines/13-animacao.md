# 13 · Animação

> Toda animação do design system passa por esta guideline. **Sem exceções.**

## Princípios

1. **Animação adicionada sem justificativa é distração.** Toda animação tem que servir a um propósito comunicativo (mostrar relação causal, sinalizar status, dar continuidade visual entre estados). Animação "porque fica bonito" entra no _don't_.
2. **Reduced motion é default.** Quem prefere zero animação não deveria precisar configurar nada — `@media (prefers-reduced-motion: reduce)` zera tudo automaticamente (ver `docs/shared/tokens/motion.css`). Componentes que precisam de exceção justificam por escrito.
3. **Tokens são contrato.** Hardcodar `300ms` ou `cubic-bezier(0.2,0,0,1)` num componente quebra o ritmo do sistema. Sempre via `var(--duration-*)` / `var(--ease-*)` no CSS e via `lib/motion.ts` no JS.
4. **CSS antes de JS.** 80% das animações que aparecem em UI são `transition` simples. Motion entra só quando a complexidade pede (orquestração temporal, spring physics, drag).

## CSS vs Motion — quando usar cada um

| Caso | Ferramenta |
|---|---|
| Hover, focus, active em primitivos (button, input, link) | **CSS** `transition` |
| Mostrar/esconder com fade simples | **CSS** `transition` + `@starting-style` |
| Show/hide com `display: none` no fim | **CSS** `transition-behavior: allow-discrete` (Chrome 117+, FF 129+, Safari 17.5+) |
| Transição entre rotas/views | **View Transitions API** nativa (`document.startViewTransition`) |
| Skeleton / shimmer / loading spinner | **CSS** `@keyframes` |
| Tooltip/popover enter/exit | **CSS** `transition` (caso simples) |
| Acordeão expand/collapse com altura dinâmica | **CSS** com `interpolate-size` ou `grid-template-rows: 1fr/0fr` |
| Drawer / sheet / modal enter | **CSS** se simples; **Motion** se houver stagger interno |
| Sequência orquestrada (multi-step, stagger, dependências) | **Motion** (`animate()`) |
| Spring / physics (drag, gesture, layout transitions) | **Motion** (`useSpring`, `Reorder`) |
| Micro-interação em ícone (heart pulse, loader spin, check draw) | **CSS keyframes** se simples; **Motion** se complexo |

Regra de bolso: se você consegue escrever em CSS sem ginástica, **escreva em CSS**. Motion é justificado quando você precisa **coordenar** vários elementos com timing inter-dependente, ou usar physics que CSS não dá.

## Tokens disponíveis

Definidos em [docs/shared/tokens/motion.css](../tokens/motion.css). Resumo:

**Durações** (`--duration-{instant|fast|base|moderate|slow|stately}`):
- `instant` 0ms · `fast` 120ms · `base` 200ms · `moderate` 320ms · `slow` 500ms · `stately` 800ms.

**Easings** (`--ease-{linear|standard|emphasis|entrance|exit}`):
- `standard` — default.
- `emphasis` — mais dramático na chegada.
- `entrance` — só ease-out, para entrar.
- `exit` — só ease-in, para sair.

**Offsets** (`--motion-offset-{xs|sm|md|lg}`):
- `xs` 4px · `sm` 8px · `md` 16px · `lg` 32px.

## Como consumir

### Em CSS

```css
.nds-button {
  transition: background-color var(--duration-fast) var(--ease-standard),
              transform var(--duration-fast) var(--ease-standard);
}
.nds-button:active {
  transform: scale(0.97);
}
```

### Em JS (via lib/motion.ts)

```ts
import { animate, presets, prefersReducedMotion } from '@/lib/motion';

// Decisão lógica:
if (prefersReducedMotion()) {
  toast.style.opacity = '1';
} else {
  animate(toast, { opacity: [0, 1], y: [16, 0] }, 'toast');
}

// Ou usando preset:
animate(buttonEl, { scale: [1, 1.08, 1] }, 'popover');
```

**Nunca importe `motion` direto em componente** — sempre via `@/lib/motion`. Isso garante:
- Tokens aplicados consistentemente.
- `prefersReducedMotion()` checado.
- Wrapper único de migração quando subir versão do Motion.

## Reduced motion

`prefers-reduced-motion: reduce` no SO é respeitado automaticamente (CSS zera as durações). No Storybook, há toolbar **Motion** com toggle "Reduzido (forçado)" para testar o comportamento sem mexer no SO.

### Como tratar reduced motion no JS

Animação que **decora** (slide, scale, rotação): wrappear com `prefersReducedMotion()` e mostrar o estado final direto, sem animar.

Animação **funcional** (loading spinner, indicador de progresso): manter, mas considerar versão alternativa (skeleton estático, texto "Carregando...").

```ts
// Padrão recomendado
function showToast(el: HTMLElement) {
  if (prefersReducedMotion()) {
    el.style.opacity = '1';
    el.style.transform = 'none';
    return;
  }
  animate(el, { opacity: [0, 1], y: [16, 0] }, 'toast');
}
```

## Regras de performance

- **Anime só `transform` e `opacity`.** Tudo mais (`width`, `top`, `left`, `padding`) força re-layout. Use `transform: translate*()` em vez de `top`/`left`; use `scale*()` em vez de `width`/`height`.
- **Evite `box-shadow` animado.** Custoso de re-pintar. Anime opacidade de uma pseudo-elemento com shadow fixo.
- **Não anime mais de ~10 elementos simultâneos.** Se precisar de stagger longo, use `IntersectionObserver` para animar só os visíveis.
- **`will-change` com parcimônia.** Funciona como hint, não como solução. Adicionado em todo lugar, derrota o propósito.

## Regras WCAG

- **2.3.1 (A)** — Não animar nada com flashes acima de 3Hz.
- **2.3.3 (AAA, mas é boa prática AA também)** — Respeitar `prefers-reduced-motion`. Já automático via tokens.
- **2.2.2 (A)** — Animações auto-iniciadas com duração > 5s devem ter controle de pausa/parada. Aplicável a carrosséis automáticos e similares.
- **2.5.4 (A)** — Não usar gesto complexo como única forma de interagir. Drag-to-dismiss, swipe-to-action devem ter alternativa por botão.

## Anti-patterns

- ❌ `transition: all 300ms ease` — pega tudo, sem controle.
- ❌ `animation: bounce 2s infinite` — distrai, viola WCAG sem fallback.
- ❌ Animar `box-shadow` ou `filter: blur()` em hover — caro, jank.
- ❌ Múltiplos `setTimeout` para encadear — use Motion ou Web Animations.
- ❌ `motion.div` direto importado de `motion/react` em componente — quebra reduced-motion + tokens. Sempre via wrapper.
- ❌ Animação obrigatória para entender o estado (sem alternativa estática) — violação de a11y.

## Como o `/quality` valida

A skill `/quality` checa, por componente:

- ✓ Toda `transition` / `animation` em `*.css` usa `var(--duration-*)` e `var(--ease-*)` ou tokens equivalentes.
- ✓ Nenhum `setTimeout` ou `setInterval` em componente UI para animar (usar Motion).
- ✓ Imports de `motion`, `motion/react`, `motion-v` vêm via `@/lib/motion`, não direto.
- ✓ Componentes com animação têm story dedicada que demonstra reduced-motion.

## Quando criar um preset novo

Use os presets existentes (`fadeIn`, `popover`, `toast`, `modal`...) sempre que cabe. Se você precisa de timing que repete em 3+ componentes mas não está coberto, adicione:

1. Edite `lib/motion.ts` adicionando o preset em todas as 4 stacks.
2. Documente neste arquivo, na seção "Tokens disponíveis", quando usar.
3. Use em pelo menos 2 componentes na mesma PR.

Se for ad-hoc para um componente, **não** crie preset — passe o objeto inline.

## Storybook

Toda story que **anima** ao montar deve ter um botão "Replay" via decorator, senão a animação dispara uma vez e some. Padrão emergente — quando 3+ componentes precisarem disso, vira utilidade compartilhada.

Stories de **estado** (Open/Closed, Loading) devem ser estáticas — não animam ao mudar story, senão o snapshot do Chromatic flake.

## Quando instalar o `motion`

Hoje o `lib/motion.ts` está em modo stub — sem dep instalada. Instale quando:

1. Um componente real precisar de spring ou orquestração que CSS não dá. **Não** instale "para deixar pronto".
2. Quando instalar: `npm install motion` na stack do componente, descomente o bloco no `lib/motion.ts`, atualize este guideline removendo a nota.
