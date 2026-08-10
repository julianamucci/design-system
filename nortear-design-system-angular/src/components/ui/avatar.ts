import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import {
  RdxAvatarFallbackDirective,
  RdxAvatarImageDirective,
  RdxAvatarRootDirective,
} from '@radix-ng/primitives/avatar';
import { User } from 'lucide';
import { cn } from '@/lib/utils';

// ─── Avatar ───────────────────────────────────────────────────────────────────
//
// Visual: classes .nds-avatar-* (docs/shared/styles/nds/avatar.css).
// Tokens: --avatar-size, --muted, --muted-foreground, --background, --primary.
//
// Todas as partes são diretiva de atributo em elemento nativo, como no Card e
// pelo mesmo motivo: o Vanilla — referência de markup — renderiza
// `<span class="nds-avatar">` com `<img>` e `<span>` dentro, e é o DOM que a
// auditoria cross-stack compara. O CSS também depende disso: as regras de
// grupo são de filho direto (`.nds-avatar-group > .nds-avatar`) e as de badge
// são descendentes de `[data-size]` — um host intermediário quebraria as duas.
//
// COM `RdxAvatar*`: o primitivo é dono do ciclo de carregamento da imagem.
// Ele mantém o status (`idle | loading | loaded | error`) num signal do root,
// liga `[style.display]` na imagem e no fallback a partir desse status, e
// implementa o `delayMs` que segura as iniciais para não piscarem em conexão
// rápida. Reimplementar isso à mão foi o que o Vanilla teve de fazer — aqui não
// é preciso, e o `display` é do primitivo: quem compõe não escreve style algum.

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Container circular. O diâmetro sai do preset em `data-size`, que o CSS lê
 * para redefinir `--avatar-size` — nunca de medida escrita aqui.
 */
@Directive({
  selector: 'span[ndsAvatar]',
  standalone: true,
  hostDirectives: [RdxAvatarRootDirective],
  host: {
    class: 'nds-avatar',
    '[attr.data-slot]': '"avatar"',
    '[attr.data-size]': 'size()',
  },
})
export class NdsAvatar {
  readonly size = input<AvatarSize>('md');
}

/**
 * A foto. O `alt` é do elemento nativo e fica com quem escreve o markup:
 * descritivo quando a imagem identifica a pessoa, vazio quando é decorativa.
 *
 * `src` NÃO é atributo aqui — o primitivo é dono de `[attr.src]` e o liga a
 * partir do próprio input, depois de resolver o carregamento num `Image()`
 * fora da tela. Escrever `src` como atributo nativo funcionaria por acidente
 * até o primeiro re-render, quando o binding do primitivo o apagaria.
 */
@Directive({
  selector: 'img[ndsAvatarImage]',
  standalone: true,
  hostDirectives: [
    {
      directive: RdxAvatarImageDirective,
      inputs: ['src', 'srcSet', 'sizes', 'crossOrigin', 'referrerPolicy'],
      outputs: ['onLoadingStatusChange'],
    },
  ],
  host: {
    class: 'nds-avatar-image',
    // Sem `loading="lazy"`: enquanto o status não é `loaded` o primitivo mantém
    // a imagem em `display: none`, e imagem sem caixa nunca entra em viewport —
    // o carregamento adiado não dispararia nunca. Mesma correção do Vanilla.
    decoding: 'async',
    '[attr.data-slot]': '"avatar-image"',
  },
})
export class NdsAvatarImage {}

/**
 * Iniciais ou ícone. Aparece enquanto a imagem carrega, quando ela falha e
 * quando não há imagem nenhuma. `delayMs` vem do primitivo.
 */
@Directive({
  selector: 'span[ndsAvatarFallback]',
  standalone: true,
  hostDirectives: [{ directive: RdxAvatarFallbackDirective, inputs: ['delayMs'] }],
  host: {
    class: 'nds-avatar-fallback',
    '[attr.data-slot]': '"avatar-fallback"',
  },
})
export class NdsAvatarFallback {}

/**
 * Ponto de status no canto. É FILHO do root: o CSS o posiciona por
 * `position: absolute` contra o `.nds-avatar`, que já é `relative`, e as regras
 * de tamanho (`[data-size] .nds-avatar-badge`) são descendentes — o ponto
 * acompanha o diâmetro sem wrapper nenhum.
 *
 * O rótulo acessível fica com quem compõe (`role="img" aria-label="online"`),
 * porque só ali se sabe o que o ponto significa. Sem rótulo, `aria-hidden`.
 */
@Directive({
  selector: 'span[ndsAvatarBadge]',
  standalone: true,
  host: {
    class: 'nds-avatar-badge',
    '[attr.data-slot]': '"avatar-badge"',
  },
})
export class NdsAvatarBadge {}

/** Fila de avatares sobrepostos. O recuo e a borda vêm de `.nds-avatar-group`. */
@Directive({
  selector: 'div[ndsAvatarGroup]',
  standalone: true,
  host: {
    class: 'nds-avatar-group',
    '[attr.data-slot]': '"avatar-group"',
  },
})
export class NdsAvatarGroup {}

/** Contador do excedente (`+3`), último item da fila. */
@Directive({
  selector: 'div[ndsAvatarGroupCount]',
  standalone: true,
  host: {
    class: 'nds-avatar-group-count',
    '[attr.data-slot]': '"avatar-group-count"',
  },
})
export class NdsAvatarGroupCount {}

// ─── Ícone genérico para o fallback ──────────────────────────────────────────
//
// Conveniência deste stack, não parte da anatomia cross-stack: as outras stacks
// escrevem `<User />` do lucide direto no fallback, e aqui não existe binding
// de componente para o pacote agnóstico. Mesma solução do `NdsButtonIcon` —
// os filhos são criados por `createElementNS` porque cada ícone do lucide é uma
// lista `[tag, attrs]` com tag variável, e template Angular exige tag estática.

type LucideIconNode = [string, Record<string, string>];

const USER_ICON = User as unknown as LucideIconNode[];

@Component({
  selector: 'svg[ndsAvatarIcon]',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    // Decorativo: quem fala é o `aria-label` do fallback que o envolve.
    'aria-hidden': 'true',
    '[attr.class]': 'svgClass()',
  },
})
export class NdsAvatarIcon {
  /**
   * Única exceção à regra de não criar input `class`: em SVG, `className` é
   * `SVGAnimatedString` e não aceita binding de classe — aqui o atributo
   * sobrescreve, então o input é necessário (ver `NdsButtonIcon`).
   */
  readonly class = input<string>('');

  private readonly hostRef = inject<ElementRef<SVGSVGElement>>(ElementRef);

  protected readonly svgClass = computed(() => cn('nds-icon-lg', this.class()));

  constructor() {
    effect(() => {
      const svg = this.hostRef.nativeElement;
      svg.replaceChildren();
      for (const [tag, attrs] of USER_ICON) {
        const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
        svg.appendChild(child);
      }
    });
  }
}

/** Todas as partes do Avatar — conveniência para o `imports` de quem compõe. */
export const NDS_AVATAR = [
  NdsAvatar, NdsAvatarImage, NdsAvatarFallback, NdsAvatarBadge,
  NdsAvatarGroup, NdsAvatarGroupCount, NdsAvatarIcon,
] as const;
