import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import DOMPurify from 'dompurify';
import { NdsFoundationPage } from './shared/FoundationPage';
import { useTranslation } from '@/lib/i18n';
import translations from '@shared/content/foundations/tipografia/translations.json';

/**
 * Tipografia — fundamento COM desenho próprio.
 *
 * As páginas de escala (tipografia, espaçamento, elevação, motion) precisam
 * mostrar o token aplicado, e não descrito: uma tabela dizendo que `--text-h1`
 * é `base × 1.2⁴` não prova nada — o que prova é o h1 desenhado ao lado do h4.
 * Esses exemplos visuais moram na chave `specimens`, que o renderer trata como
 * metadado justamente para a página desenhá-los do seu jeito.
 *
 * A ligação é por PROJEÇÃO DE CONTEÚDO: o que estiver entre as tags de
 * `<nds-foundation-page>` cai na `<ng-content />` dela, logo abaixo do header e
 * antes das seções genéricas. É o equivalente ao `extraSection` do React, e a
 * expressão é avaliada aqui, no contexto desta página — por isso o `t()` local
 * funciona dentro do bloco projetado.
 *
 * Os elementos são os nativos (`h1`..`h4`, `p`, `label`): quem aplica o type
 * scale ativo é a regra `.nds-type-specimen` do `typography.css`. `nds-m-0`
 * zera as margens NATIVAS desses elementos dentro do `nds-stack`, que já cuida
 * do espaçamento vertical.
 */
const { t } = useTranslation(translations as Record<string, unknown>);

@Component({
  selector: 'nds-typography-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NdsFoundationPage],
  template: `
    <nds-foundation-page slug="tipografia" [translations]="translations">
      <section class="nds-stack nds-docs-section-divider" data-spacing="md">
        <div class="nds-stack" data-spacing="xs">
          <h2 class="nds-text-h2 nds-text-foreground">{{ t('specimens.title') }}</h2>
          <p class="nds-text-body">{{ t('specimens.subtitle') }}</p>
        </div>

        <div
          class="nds-type-specimen nds-stack nds-rounded-lg nds-border-default nds-p-6 nds-bg-card"
          data-spacing="md"
        >
          <h1 class="nds-m-0">{{ t('specimens.h1') }}</h1>
          <h2 class="nds-m-0">{{ t('specimens.h2') }}</h2>
          <h3 class="nds-m-0">{{ t('specimens.h3') }}</h3>
          <h4 class="nds-m-0">{{ t('specimens.h4') }}</h4>
          <!-- O corpo traz <code> no texto compartilhado; sanitizado no próprio
               binding para o SAST reconhecer a chamada (guideline 09). -->
          <p
            class="nds-m-0 nds-text-foreground"
            [innerHTML]="DOMPurify.sanitize(t('specimens.body'))"
          ></p>
          <label class="nds-block nds-text-foreground">{{ t('specimens.label') }}</label>
        </div>
      </section>
    </nds-foundation-page>
  `,
})
export class NdsTypographyDocs {
  protected readonly translations = translations as Record<string, unknown>;
  protected readonly t = t;
  protected readonly DOMPurify = DOMPurify;
}
