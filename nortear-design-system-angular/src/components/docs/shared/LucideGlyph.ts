import { Directive, ElementRef, inject, input, OnInit } from '@angular/core';
import type { IconNode } from 'lucide';

/**
 * Desenha um ícone do pacote `lucide` dentro do `<svg>` que hospeda a diretiva.
 *
 * ─── Por que não `[innerHTML]` ──────────────────────────────────────────────
 *
 * O caminho óbvio seria montar a string do SVG e ligá-la com
 * `[innerHTML]="DOMPurify.sanitize(...)"`, como o resto das docs pages faz com
 * a prosa do conteúdo compartilhado. Não funciona: o `[innerHTML]` do Angular
 * passa pelo DomSanitizer do framework, cuja lista de elementos permitidos é de
 * HTML — `<path>`, `<circle>` e companhia são descartados. O resultado seria um
 * `<svg>` vazio e um aviso no console, sem erro.
 *
 * ─── Por que não um `@switch` por tag ───────────────────────────────────────
 *
 * O nó do lucide é `[tag, atributos]` com sete tags e dezesseis atributos
 * possíveis. Escrever isso como template exigiria um ramo por tag e um
 * `[attr.*]` por atributo — cinquenta linhas de marcação para reproduzir o que
 * `setAttribute` faz em duas, e uma tag nova do lucide sumiria em silêncio.
 *
 * Aqui a geometria vem de um pacote confiável e é ESTÁTICA: nada nela depende
 * de estado do componente, então não há change detection a perder. Por isso o
 * DOM é criado uma vez, em `ngOnInit` — nunca no construtor, onde `input()`
 * ainda devolveria o default.
 */
@Directive({
  selector: 'svg[ndsLucideGlyph]',
  standalone: true,
  host: {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
  },
})
export class NdsLucideGlyph implements OnInit {
  /** Nó do ícone — `icons.Search`, `icons.Package`… do pacote `lucide`. */
  readonly ndsLucideGlyph = input.required<IconNode>();

  private readonly hostRef = inject<ElementRef<SVGElement>>(ElementRef);

  ngOnInit(): void {
    const svg = this.hostRef.nativeElement;
    for (const [tag, atributos] of this.ndsLucideGlyph()) {
      const filho = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (const [nome, valor] of Object.entries(atributos)) {
        filho.setAttribute(nome, String(valor));
      }
      svg.appendChild(filho);
    }
  }
}
