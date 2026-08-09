import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NdsCard } from '@/components/ui/card';
import { NdsButton } from '@/components/ui/button';
import { NdsCodeBlock } from '@/components/ui/code-block';
import DOMPurify from 'dompurify';

export interface DocsVariantItem {
  name: string;
  description: string;
  code?: string;
  /**
   * Chave estável para o `data-track-id` do toggle de código. Sem ela cai em
   * `name` — o que faz o mesmo evento sair com um valor por idioma quando
   * `name` vem traduzido.
   */
  trackId?: string;
  /** Preview como TemplateRef — ver a nota em DocsDoDont. */
  preview: TemplateRef<unknown>;
}

@Component({
  selector: 'nds-docs-variants',
  standalone: true,
  imports: [NdsCard, NdsButton, NdsCodeBlock, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section [id]="id()">
      <h2 class="nds-section-title">{{ title() }}</h2>

      @if (note(); as n) {
        <p
          class="nds-text-body nds-text-muted-foreground nds-mt-1 nds-mb-4 nds-leading-relaxed"
          [innerHTML]="DOMPurify.sanitize(n)"
        ></p>
      }

      <div class="nds-stack" data-spacing="md">
        @for (item of items(); track item.name) {
          <nds-card class="nds-p-4">
            <div>
              <h3 class="nds-text-body nds-font-semibold nds-m-0" [innerHTML]="DOMPurify.sanitize(item.name)"></h3>
              <p
                class="nds-text-body nds-text-muted-foreground nds-mt-1 nds-leading-relaxed"
                [innerHTML]="DOMPurify.sanitize(item.description)"
              ></p>
            </div>

            <div class="nds-cluster" data-justify="center" data-docs-preview="variante">
              <ng-container [ngTemplateOutlet]="item.preview" />
            </div>

            @if (item.code) {
              <div>
                <button
                  ndsButton
                  variant="link"
                  class="nds-px-0"
                  data-track="code"
                  [attr.data-track-id]="trackId(item)"
                  data-track-label="Copiar código"
                  (click)="toggle(item.name)"
                >{{ isOpen(item.name) ? 'Ocultar código' : 'Ver código' }}</button>

                <nds-code-block
                  [code]="item.code"
                  [language]="language()"
                  [showLineNumbers]="false"
                  [copyLabel]="copyLabel()"
                  [copiedLabel]="copiedLabel()"
                  [class]="isOpen(item.name) ? 'nds-mt-2' : 'nds-mt-2 nds-hidden'"
                />
              </div>
            }
          </nds-card>
        }
      </div>
    </section>
  `,
})
export class NdsDocsVariants {
  readonly title = input.required<string>();
  readonly items = input.required<DocsVariantItem[]>();
  /** Nota introdutória (HTML inline permitido) — chave `variants.note`. */
  readonly note = input<string>('');
  readonly id = input<string>('variantes');
  /** Slug do componente para o `data-track-id` dos toggles. */
  readonly componentSlug = input<string | undefined>(undefined);
  readonly language = input<string>('ts');
  readonly copyLabel = input<string>('Copiar código');
  readonly copiedLabel = input<string>('Copiado!');

  // Um Set em signal em vez de um booleano por item: os itens vêm de um input,
  // então não há onde guardar estado por item sem espelhar a lista.
  private readonly open = signal(new Set<string>());

  // DOMPurify no escopo do template: a chamada precisa aparecer no próprio
  // binding [innerHTML] para o SAST reconhecer o sanitizador de taint
  // (guideline 09). Um computed `safe*` esconderia a chamada do fluxo.
  protected readonly DOMPurify = DOMPurify;

  protected isOpen(name: string): boolean {
    return this.open().has(name);
  }

  protected toggle(name: string): void {
    const next = new Set(this.open());
    if (!next.delete(name)) next.add(name);
    this.open.set(next);
  }

  protected trackId(item: DocsVariantItem): string | null {
    const slug = this.componentSlug();
    return slug ? `${slug}:code:${item.trackId ?? item.name}` : null;
  }
}
