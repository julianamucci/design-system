import {
  ChangeDetectionStrategy,
  Component,
  input,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NdsCard } from '@/components/ui/card';

export interface DocsDoDontPair {
  doLabel: string;
  dontLabel: string;
  doCaption: string;
  dontCaption: string;
  /**
   * Previews como `TemplateRef`, não como factory que devolve elemento.
   *
   * É o equivalente Angular do `doPreviewFactory` do Vanilla: a docs page
   * declara `<ng-template #ok>…</ng-template>` com os componentes reais e
   * bindings normais, e o container instancia com `ngTemplateOutlet`. Montar
   * DOM à mão aqui perderia change detection e os inputs do componente.
   */
  doPreview: TemplateRef<unknown>;
  dontPreview: TemplateRef<unknown>;
}

@Component({
  selector: 'nds-docs-do-dont',
  standalone: true,
  imports: [NdsCard, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section id="do-dont">
      <h2 class="nds-section-title">{{ title() }}</h2>

      <div ndsCard class="nds-cluster nds-p-4 nds-mt-2">
        <div class="nds-stack nds-w-full" data-spacing="xl">
          @for (pair of pairs(); track $index) {
            <div class="nds-grid" data-cols="2" data-spacing="lg">
              <!-- Coluna DO -->
              <div class="nds-stack" data-spacing="sm">
                <div class="nds-cluster nds-text-success" data-spacing="sm">
                  <span class="nds-pill" data-tone="success">✓</span>
                  <span class="nds-text-body nds-font-semibold nds-uppercase nds-tracking-wider">
                    {{ pair.doLabel }}
                  </span>
                </div>
                <!--
                  nds-cluster + data-justify é o mesmo par que centraliza o
                  preview em DocsVariants e em ComponentDemo. Sem ele o Card
                  herda a coluna do .nds-card e encosta tudo à esquerda.
                -->
                <div ndsCard
                  class="nds-cluster nds-shadow-none nds-p-4"
                  data-justify="center"
                  data-docs-preview="do"
                >
                  <ng-container [ngTemplateOutlet]="pair.doPreview" />
                </div>
                <p class="nds-text-body nds-italic nds-px-1">{{ pair.doCaption }}</p>
              </div>

              <!-- Coluna DON'T -->
              <div class="nds-stack" data-spacing="sm">
                <div class="nds-cluster nds-text-destructive" data-spacing="sm">
                  <span class="nds-pill" data-tone="destructive">✗</span>
                  <span class="nds-text-body nds-font-semibold nds-uppercase nds-tracking-wider">
                    {{ pair.dontLabel }}
                  </span>
                </div>
                <div ndsCard
                  class="nds-cluster nds-shadow-none nds-p-4"
                  data-justify="center"
                  data-docs-preview="dont"
                >
                  <ng-container [ngTemplateOutlet]="pair.dontPreview" />
                </div>
                <p class="nds-text-body nds-italic nds-px-1">{{ pair.dontCaption }}</p>
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class NdsDocsDoDont {
  readonly title = input.required<string>();
  readonly pairs = input.required<DocsDoDontPair[]>();
}
