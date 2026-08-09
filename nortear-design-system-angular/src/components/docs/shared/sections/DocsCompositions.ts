import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { NdsDocsVariants, type DocsVariantItem } from './DocsVariants';

/**
 * Item de uma composição documentada. Mesma forma de `DocsVariantItem` + um
 * campo opcional `useWhen` (situação de uso recomendada). Quando presente, é
 * mesclado à descrição via "<br><br><strong>{useWhenLabel}</strong> {useWhen}".
 */
export interface DocsCompositionItem extends DocsVariantItem {
  useWhen?: string;
}

/**
 * Seção "Composições" — combinações canônicas do componente (ícone + label,
 * par de ações, icon-only).
 *
 * Por baixo usa NdsDocsVariants, então o layout (card com preview + toggle
 * "Ver código") é idêntico ao de Variantes e Tamanhos.
 */
@Component({
  selector: 'nds-docs-compositions',
  standalone: true,
  imports: [NdsDocsVariants],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <nds-docs-variants
      [id]="id()"
      [title]="title()"
      [note]="note()"
      [componentSlug]="componentSlug()"
      [items]="mergedItems()"
    />
  `,
})
export class NdsDocsCompositions {
  readonly title = input.required<string>();
  readonly items = input.required<DocsCompositionItem[]>();
  readonly note = input<string>('');
  /** Label da linha "Quando usar:" (i18n, ex: tNav('common.useWhen')). */
  readonly useWhenLabel = input<string>('Quando usar:');
  readonly componentSlug = input<string | undefined>(undefined);
  readonly id = input<string>('composicoes');

  protected readonly mergedItems = computed<DocsVariantItem[]>(() =>
    this.items().map((item) =>
      item.useWhen
        ? {
            ...item,
            description: `${item.description}<br><br><strong>${this.useWhenLabel()}</strong> ${item.useWhen}`,
          }
        : item,
    ),
  );
}
