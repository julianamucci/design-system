import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewEncapsulation,
  computed,
  input,
  viewChild,
} from '@angular/core';
import { NdsButton } from '@/components/ui/button';
import { NdsDocsDoDont, type DocsDoDontPair } from './DocsDoDont';

/**
 * Hospedeira da story. `doPreview` e `dontPreview` são `TemplateRef`, que só
 * nasce de um `<ng-template>` recolhido por `viewChild` e não cabe em `props` de
 * story. Mesmo arranjo do `DocsVariantsStory`, e o mesmo que toda docs page do
 * Angular já usa.
 */
@Component({
  selector: 'nds-docs-do-dont-story',
  standalone: true,
  imports: [NdsDocsDoDont, NdsButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <ng-template #tplRotuloBom><button ndsButton variant="default">Salvar alterações</button></ng-template>
    <ng-template #tplRotuloRuim><button ndsButton variant="default">Clique aqui</button></ng-template>
    <ng-template #tplParBom>
      <span class="nds-cluster" data-spacing="md">
        <button ndsButton variant="outline">Cancelar</button>
        <button ndsButton variant="default">Confirmar</button>
      </span>
    </ng-template>
    <ng-template #tplParRuim>
      <span class="nds-cluster" data-spacing="md">
        <button ndsButton variant="default">Salvar</button>
        <button ndsButton variant="default">Enviar</button>
      </span>
    </ng-template>

    <nds-docs-do-dont [title]="title()" [pairs]="pares()" />
  `,
})
export class NdsDocsDoDontStory {
  readonly title = input.required<string>();
  /** Só da story: reduz a um par, para mostrar que a forma da seção não muda. */
  readonly umParSo = input<boolean>(false);

  private readonly tplRotuloBom = viewChild.required<TemplateRef<unknown>>('tplRotuloBom');
  private readonly tplRotuloRuim = viewChild.required<TemplateRef<unknown>>('tplRotuloRuim');
  private readonly tplParBom = viewChild.required<TemplateRef<unknown>>('tplParBom');
  private readonly tplParRuim = viewChild.required<TemplateRef<unknown>>('tplParRuim');

  protected readonly pares = computed<DocsDoDontPair[]>(() => {
    const rotulo: DocsDoDontPair = {
      doLabel: 'Faça',
      dontLabel: 'Evite',
      doCaption: 'O rótulo nomeia a ação, e é legível fora de contexto.',
      dontCaption: this.umParSo()
        ? '"Clique aqui" não diz o que acontece.'
        : '"Clique aqui" não diz o que acontece, e o leitor de tela anuncia só isso.',
      doPreview: this.tplRotuloBom(),
      dontPreview: this.tplRotuloRuim(),
    };
    if (this.umParSo()) return [rotulo];
    return [
      rotulo,
      {
        doLabel: 'Faça',
        dontLabel: 'Evite',
        doCaption: 'Uma primária por bloco, com a secundária em outline à esquerda.',
        dontCaption: 'Duas primárias competem, e a pessoa para para escolher.',
        doPreview: this.tplParBom(),
        dontPreview: this.tplParRuim(),
      },
    ];
  });
}
