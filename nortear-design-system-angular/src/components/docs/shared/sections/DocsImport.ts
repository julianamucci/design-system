import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { NdsCodeBlock } from '@/components/ui/code-block';

@Component({
  selector: 'nds-docs-import',
  standalone: true,
  imports: [NdsCodeBlock],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section id="importacao">
      <h2 class="nds-section-title">{{ title() }}</h2>

      @if (description()) {
        <p class="nds-text-body nds-mb-4">{{ description() }}</p>
      }

      <!--
        `data-track` no wrapper e não no CodeBlock: o observer resolve o clique
        por `.closest('[data-track]')`, e assim só o botão de copiar dentro do
        bloco conta como `docs_code_copy`.
      -->
      <div
        data-track="code"
        [attr.data-track-id]="trackId('import-primary')"
        data-track-label="Copiar import"
      >
        <nds-code-block
          [code]="code()"
          [language]="language()"
          [showLineNumbers]="false"
          [copyLabel]="copyLabel()"
          [copiedLabel]="copiedLabel()"
        />
      </div>

      @if (secondaryCode()) {
        @if (secondaryDescription()) {
          <p class="nds-text-body nds-mt-4 nds-mb-4">{{ secondaryDescription() }}</p>
        }
        <div
          data-track="code"
          [attr.data-track-id]="trackId('import-secondary')"
          data-track-label="Copiar import"
        >
          <nds-code-block
            [code]="secondaryCode()"
            [language]="language()"
            [showLineNumbers]="false"
            [copyLabel]="copyLabel()"
            [copiedLabel]="copiedLabel()"
            class="nds-mt-2"
          />
        </div>
      }

      @if (tertiaryCode()) {
        @if (tertiaryDescription()) {
          <p class="nds-text-body nds-mt-4 nds-mb-4">{{ tertiaryDescription() }}</p>
        }
        <nds-code-block
          [code]="tertiaryCode()"
          [language]="language()"
          [showLineNumbers]="false"
          [copyLabel]="copyLabel()"
          [copiedLabel]="copiedLabel()"
          class="nds-mt-2"
        />
      }
    </section>
  `,
})
export class NdsDocsImport {
  readonly title = input.required<string>();
  readonly code = input.required<string>();
  readonly description = input<string>('');
  readonly secondaryCode = input<string>('');
  readonly secondaryDescription = input<string>('');
  readonly tertiaryCode = input<string>('');
  readonly tertiaryDescription = input<string>('');
  /** Slug do componente para o `data-track-id`. Ausente → atributo omitido. */
  readonly componentSlug = input<string | undefined>(undefined);
  readonly language = input<string>('ts');
  readonly copyLabel = input<string>('Copiar código');
  readonly copiedLabel = input<string>('Copiado!');

  protected trackId(id: string): string | null {
    const slug = this.componentSlug();
    return slug ? `${slug}:code:${id}` : null;
  }
}
