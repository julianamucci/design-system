import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

export interface DocsRelatedItem { name: string; description: string; path: string }

function slugify(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '-');
}

@Component({
  selector: 'nds-docs-related',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section id="relacionados">
      <h2 class="nds-section-title">{{ title() }}</h2>

      <div class="nds-grid" data-cols="2" data-spacing="md">
        @for (item of items(); track item.path) {
          <!--
            Card clicável com aparência do button outline. Classe própria
            .nds-related-card em vez de .nds-button-outline porque o layout
            difere: vertical, multi-linha, padding maior, sem white-space:nowrap.
          -->
          <a
            [href]="item.path"
            target="_top"
            class="nds-related-card"
            data-track="related"
            [attr.data-track-id]="trackId(item)"
            [attr.data-track-label]="item.name"
          >
            <span class="nds-related-card-title">{{ item.name }}</span>
            <span class="nds-related-card-description">{{ item.description }}</span>
          </a>
        }
      </div>
    </section>
  `,
})
export class NdsDocsRelated {
  readonly title = input.required<string>();
  readonly items = input.required<DocsRelatedItem[]>();
  readonly componentSlug = input<string | undefined>(undefined);

  protected trackId(item: DocsRelatedItem): string | null {
    const slug = this.componentSlug();
    return slug ? `${slug}:related:${slugify(item.name)}` : null;
  }
}
