// ─── Motion helpers ───────────────────────────────────────────────────────────
// Camada fina entre o design system e a lib `motion` (https://motion.dev).
// Hoje NÃO importa motion — só expõe presets de durações/easings derivados
// dos tokens CSS (motion.css). Quando você instalar `motion`, descomente os
// blocos no final e o resto do código consumidor passa a funcionar sem
// mudanças.
//
// Use SEMPRE este módulo para qualquer animação JS. Não importe `motion`
// direto em componentes — quebra reduced-motion e divergência de tokens.

// ─── Token fetcher ────────────────────────────────────────────────────────────

/** Lê o valor computed de um custom property no <html>. Empty string se ausente. */
export function token(name: string): string {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const DURATION_SCALES = ['instant', 'fast', 'base', 'moderate', 'slow', 'stately'] as const;
export type DurationScale = typeof DURATION_SCALES[number];

/** Duração em segundos (formato esperado pelo `motion.animate`). */
export function duration(scale: DurationScale): number {
  const raw = token(`--duration-${scale}`);
  const ms = parseFloat(raw) || 0;
  return ms / 1000;
}

const EASING_NAMES = ['linear', 'standard', 'emphasis', 'entrance', 'exit'] as const;
export type EasingName = typeof EASING_NAMES[number];

/** Cubic-bezier ou keyword CSS, conforme tokens. */
export function easing(name: EasingName): string {
  return token(`--ease-${name}`) || 'ease';
}

/** Offset em pixels (resolvido a partir de rem). */
export function offset(scale: 'xs' | 'sm' | 'md' | 'lg'): number {
  if (typeof document === 'undefined') return 0;
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const raw = token(`--motion-offset-${scale}`);
  return (parseFloat(raw) || 0) * rem;
}

// ─── Reduced motion ───────────────────────────────────────────────────────────

/**
 * Detecta preferência do usuário (matchMedia) E o override de Storybook
 * (data-reduced-motion="true" no <html>). Os dois caminhos zeram durações
 * via CSS (em motion.css), mas no JS precisamos decidir explicitamente
 * (ex: trocar slide por fade, não animar de jeito nenhum).
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  const mql = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const flag = document.documentElement.dataset.reducedMotion === 'true';
  return mql || flag;
}

// ─── Presets ──────────────────────────────────────────────────────────────────

export const presets = {
  fadeIn:   () => ({ duration: duration('base'),     ease: easing('entrance') }),
  fadeOut:  () => ({ duration: duration('fast'),     ease: easing('exit')     }),
  slideUp:  () => ({ duration: duration('moderate'), ease: easing('standard') }),
  popover:  () => ({ duration: duration('fast'),     ease: easing('standard') }),
  toast:    () => ({ duration: duration('moderate'), ease: easing('emphasis') }),
  modal:    () => ({ duration: duration('moderate'), ease: easing('standard') }),

  springSnappy: () => ({ type: 'spring' as const, stiffness: 400, damping: 30 }),
  springGentle: () => ({ type: 'spring' as const, stiffness: 180, damping: 22 }),
} as const;

export type PresetName = keyof typeof presets;

// ─── Wrapper de animate() — vanilla, p/ código fora de componentes React ─────
// Quando `motion` for instalado (`npm install motion`), descomente:
//
// import { animate as motionAnimate, type AnimationPlaybackControls } from 'motion';
//
// type Target = Element | Element[] | NodeListOf<Element>;
// type Keyframes = Record<string, string | number | (string | number)[]>;
//
// export function animate(
//   target: Target,
//   keyframes: Keyframes,
//   preset: PresetName = 'fadeIn',
// ): AnimationPlaybackControls | null {
//   if (prefersReducedMotion()) return null;
//   return motionAnimate(target as Element, keyframes, presets[preset]());
// }

/** Stub — devolve null. Substituído pelo bloco acima quando `motion` for instalado. */
export function animate(_target: unknown, _keyframes: unknown, _preset: PresetName = 'fadeIn'): null {
  return null;
}

// ─── React específico ────────────────────────────────────────────────────────
// Quando instalar `motion`, descomente também o MotionConfig provider abaixo
// e use-o no Storybook (preview.tsx) e em qualquer entrypoint React do app:
//
//   <MotionConfigured>
//     <App />
//   </MotionConfigured>
//
// Centraliza: respeito a reduced-motion + transition default vindo de tokens.
//
// import { MotionConfig } from 'motion/react';
// import type { ReactNode } from 'react';
//
// export function MotionConfigured({ children }: { children: ReactNode }) {
//   return (
//     <MotionConfig
//       reducedMotion="user"
//       transition={{ duration: duration('base'), ease: easing('standard') }}
//     >
//       {children}
//     </MotionConfig>
//   );
// }
