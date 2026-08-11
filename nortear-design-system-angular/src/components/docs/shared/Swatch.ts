import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  OnDestroy,
  signal,
  ViewEncapsulation,
} from '@angular/core';

/**
 * Swatches da página "Cores e Temas" — duas variantes, como nas outras stacks.
 *
 * `div[ndsMiniSwatch]`  — chip com o nome do token abaixo (amostra compacta).
 * `button[ndsSwatch]`   — chip + `--token` + valor HSL, clicável para copiar.
 *
 * Seletor de ATRIBUTO nos dois: o CSS compartilhado (`docs-swatches.css`)
 * estiliza `.nds-swatch` como se ele FOSSE o `<button>` — flex, borda, foco. Um
 * seletor de elemento (`<nds-swatch>`) inseriria um nó extra entre a grade e o
 * botão, e a regra passaria a pintar o invólucro.
 *
 * A cor entra por `--swatch-color`, nunca por style inline de cor: é o mesmo
 * mecanismo do `--ratio` no AspectRatio — custom property carregando um VALOR
 * escolhido no call site, com a forma toda no CSS compartilhado. Assim o chip
 * acompanha tema, modo e marca sem esta página saber qual está ativo.
 */

/** `var(--token)` — o valor que o CSS resolve no escopo onde o chip está. */
function referenciaDeCor(token: string): string {
  return `var(--${token})`;
}

@Component({
  selector: 'div[ndsMiniSwatch]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'nds-miniswatch' },
  template: `
    <span
      class="nds-miniswatch-chip"
      [style.--swatch-color]="corDoToken()"
      aria-hidden="true"
    ></span>
    <span class="nds-miniswatch-name">{{ token() }}</span>
  `,
})
export class NdsMiniSwatch {
  /** Nome do token CSS sem o prefixo `--`. */
  readonly token = input.required<string>();

  protected readonly corDoToken = computed(() => referenciaDeCor(this.token()));
}

@Component({
  selector: 'button[ndsSwatch]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-swatch',
    type: 'button',
    '[attr.aria-label]': 'rotuloAcessivel()',
    '(click)': 'copiar()',
  },
  template: `
    <span class="nds-swatch-color" [style.--swatch-color]="corDoToken()" aria-hidden="true"></span>
    <div class="nds-swatch-meta">
      <span class="nds-swatch-token">--{{ token() }}</span>
      <span class="nds-swatch-value">{{ valor() || '—' }}</span>
    </div>
    <span class="nds-icon-tile-tooltip" [class.is-visible]="copiado()" aria-hidden="true">{{
      copiado() ? rotuloCopiado() : rotuloDeCopia()
    }}</span>
  `,
})
export class NdsSwatch implements OnDestroy {
  /** Nome do token CSS sem o prefixo `--`. */
  readonly token = input.required<string>();
  /** Valor HSL já resolvido — quem lê o `<html>` é a página, não o swatch. */
  readonly valor = input('');
  /** Rótulo do tooltip de cópia. */
  readonly rotuloDeCopia = input('');
  /** Rótulo do tooltip depois de copiar. */
  readonly rotuloCopiado = input('');

  protected readonly copiado = signal(false);
  protected readonly corDoToken = computed(() => referenciaDeCor(this.token()));
  protected readonly rotuloAcessivel = computed(
    () => `${this.rotuloDeCopia()} --${this.token()}`,
  );

  private relogio: ReturnType<typeof setTimeout> | undefined;

  protected copiar(): void {
    navigator.clipboard
      .writeText(`--${this.token()}`)
      .then(() => {
        this.copiado.set(true);
        clearTimeout(this.relogio);
        this.relogio = setTimeout(() => this.copiado.set(false), 1500);
      })
      .catch(() => {
        // Área de transferência negada (permissão ou contexto inseguro): a
        // página segue navegável, só não confirma a cópia.
      });
  }

  ngOnDestroy(): void {
    clearTimeout(this.relogio);
  }
}

export const NDS_SWATCH = [NdsMiniSwatch, NdsSwatch] as const;
