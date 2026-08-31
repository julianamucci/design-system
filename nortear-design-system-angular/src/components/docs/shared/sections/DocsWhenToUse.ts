import {
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { NdsCard } from '@/components/ui/card';
import DOMPurify from 'dompurify';

export interface DocsWhenToUseScenario { s: string; u: string; a: string }
export interface DocsWhenToUseUXRow { element: string; do: string; dont: string; rules?: string }

export interface DocsWhenToUseGuidelines { title: string; items: string[] }
export interface DocsWhenToUseScenarios {
  title?: string;
  cols: { scenario: string; use: string; alternative: string };
  items: DocsWhenToUseScenario[];
}
export interface DocsWhenToUseUXWriting {
  title: string;
  cols: { element: string; do: string; dont: string; rules?: string };
  items: DocsWhenToUseUXRow[];
}
export interface DocsWhenToUseList { title: string; items: string[] }

@Component({
  selector: 'nds-docs-when-to-use',
  standalone: true,
  imports: [NdsCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section id="quando-usar">
      <h2 class="nds-section-title">{{ title() }}</h2>

      <div ndsCard class="nds-p-4 nds-stack" data-spacing="lg">
        <!-- Guidelines -->
        <div ndsCard
          class="nds-bg-muted-soft nds-border-soft nds-p-4 nds-stack nds-card-nested"
          data-spacing="sm"
        >
          <h3 class="nds-font-medium nds-text-body">{{ guidelines().title }}</h3>
          <ul
            class="nds-list-disc nds-stack nds-text-body nds-text-muted-foreground"
            data-spacing="sm"
          >
            @for (item of guidelines().items; track $index) {
              <li [innerHTML]="DOMPurify.sanitize(item)"></li>
            }
          </ul>
        </div>

        <!-- Cenários -->
        <div ndsCard class="nds-overflow-x nds-p-4 nds-card-nested">
          <!-- tabindex="0": .nds-table-wrapper tem overflow-x auto, e região
               rolável precisa ser alcançável por teclado (WCAG 2.1.1). -->
          <div class="nds-table-wrapper" tabindex="0">
            <table class="nds-table nds-w-full nds-border-collapse nds-text-body">
              <thead>
                <tr class="nds-border-b nds-bg-muted-soft nds-font-medium">
                  <th class="nds-p-2">{{ scenarios().cols.scenario }}</th>
                  <th class="nds-p-2">{{ scenarios().cols.use }}</th>
                  <th class="nds-p-2">{{ scenarios().cols.alternative }}</th>
                </tr>
              </thead>
              <tbody>
                @for (item of scenarios().items; track $index) {
                  <tr class="nds-border-b nds-hover-bg-muted-faint">
                    <td class="nds-p-2">{{ item.s }}</td>
                    <td class="nds-p-2 nds-font-medium nds-text-primary">{{ item.u }}</td>
                    <td class="nds-p-2 nds-text-muted-foreground">{{ item.a }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- UX Writing (opcional) -->
        @if (uxWriting(); as ux) {
          <div class="nds-stack" data-spacing="sm">
            <h3 class="nds-font-medium nds-text-body">{{ ux.title }}</h3>
            <div ndsCard class="nds-overflow-x nds-p-4 nds-card-nested">
              <div class="nds-table-wrapper" tabindex="0">
                <table class="nds-table nds-w-full nds-border-collapse nds-text-body">
                  <thead>
                    <tr class="nds-border-b nds-bg-muted-soft">
                      <th class="nds-p-2 nds-font-semibold">{{ ux.cols.element }}</th>
                      @if (ux.cols.rules) {
                        <th class="nds-p-2 nds-font-semibold">{{ ux.cols.rules }}</th>
                      }
                      <!-- Os glifos ✓/✗ vivem no código, nunca no translations.json:
                           no texto eles duplicariam o pill renderizado aqui. -->
                      <th class="nds-p-2 nds-font-semibold nds-text-success">
                        <span class="nds-cluster" data-spacing="xs">
                          <span class="nds-pill" data-tone="success">✓</span>{{ ux.cols.do }}
                        </span>
                      </th>
                      <th class="nds-p-2 nds-font-semibold nds-text-destructive">
                        <span class="nds-cluster" data-spacing="xs">
                          <span class="nds-pill" data-tone="destructive">✗</span>{{ ux.cols.dont }}
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of ux.items; track $index) {
                      <tr class="nds-border-b nds-hover-bg-muted-faint">
                        <td class="nds-p-2 nds-font-medium">{{ row.element }}</td>
                        @if (ux.cols.rules) {
                          <td class="nds-p-2 nds-text-muted-foreground">{{ row.rules ?? '' }}</td>
                        }
                        <td class="nds-p-2 nds-font-medium nds-text-success">{{ row.do }}</td>
                        <td class="nds-p-2 nds-font-medium nds-text-destructive">{{ row.dont }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- Do / Don't -->
        <div class="nds-grid" data-cols="2" data-spacing="md">
          <div ndsCard class="nds-p-4 nds-card-nested">
            <h3
              class="nds-mb-4 nds-text-body nds-font-semibold nds-text-success nds-cluster"
              data-spacing="sm"
            >
              <span class="nds-pill" data-tone="success">✓</span>{{ do().title }}
            </h3>
            <ul
              class="nds-list-disc nds-stack nds-text-body nds-text-muted-foreground nds-leading-relaxed"
              data-spacing="sm"
            >
              @for (item of do().items; track $index) {
                <li [innerHTML]="DOMPurify.sanitize(item)"></li>
              }
            </ul>
          </div>

          <div ndsCard class="nds-p-4 nds-card-nested">
            <h3
              class="nds-mb-4 nds-text-body nds-font-semibold nds-text-destructive nds-cluster"
              data-spacing="sm"
            >
              <span class="nds-pill" data-tone="destructive">✗</span>{{ dont().title }}
            </h3>
            <ul
              class="nds-list-disc nds-stack nds-text-body nds-text-muted-foreground nds-leading-relaxed"
              data-spacing="sm"
            >
              @for (item of dont().items; track $index) {
                <li [innerHTML]="DOMPurify.sanitize(item)"></li>
              }
            </ul>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class NdsDocsWhenToUse {
  readonly title = input.required<string>();
  readonly guidelines = input.required<DocsWhenToUseGuidelines>();
  readonly scenarios = input.required<DocsWhenToUseScenarios>();
  readonly uxWriting = input<DocsWhenToUseUXWriting | undefined>(undefined);
  readonly do = input.required<DocsWhenToUseList>();
  readonly dont = input.required<DocsWhenToUseList>();

  // DOMPurify no escopo do template: a chamada precisa aparecer no próprio
  // binding [innerHTML] para o SAST reconhecer o sanitizador de taint
  // (guideline 09). Um computed `safe*` esconderia a chamada do fluxo.
  protected readonly DOMPurify = DOMPurify;
}
