import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { sanitizeHtml } from '@/lib/utils';

export interface DocsNoteItem { title: string; content: string }

@Component({
  selector: 'nds-docs-notes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section id="notas">
      <h2 class="nds-section-title">{{ title() }}</h2>

      <div class="nds-stack" data-spacing="md">
        @for (item of safeItems(); track $index; let i = $index) {
          <!--
            O conteúdo da nota é HTML e pode conter <a>. Não marcamos cada link:
            o observer global usa `.closest('[data-track]')`, então o wrapper
            captura o clique em qualquer link descendente.
          -->
          <div data-track="link" [attr.data-track-id]="trackId(i)">
            <!--
              role="note" e não o default "alert": as notas são conteúdo
              estático, já presente no carregamento. Como "alert" cada nota
              virava live region assertiva e o leitor de tela saltava para esta
              seção ao abrir a página.
            -->
            <div data-slot="alert" role="note" class="nds-alert">
              @if (item.title) {
                <h5 data-slot="alert-title" class="nds-alert-title">{{ item.title }}</h5>
              }
              <div data-slot="alert-description" class="nds-alert-description">
                <p [innerHTML]="item.content"></p>
              </div>
            </div>
          </div>
        }
      </div>
    </section>
  `,
})
export class NdsDocsNotes {
  readonly title = input.required<string>();
  readonly items = input.required<DocsNoteItem[]>();
  readonly componentSlug = input<string | undefined>(undefined);

  protected readonly safeItems = computed(() =>
    this.items().map((item) => ({ title: item.title, content: sanitizeHtml(item.content) })),
  );

  protected trackId(index: number): string | null {
    const slug = this.componentSlug();
    return slug ? `${slug}:link:notes-${index + 1}` : null;
  }
}
