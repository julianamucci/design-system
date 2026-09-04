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
import { NdsDocsCompositions, type DocsCompositionItem } from './DocsCompositions';

/**
 * Hospedeira da story. Existe porque `preview` é um `TemplateRef`, e TemplateRef
 * não se expressa em `props` de uma story — só nasce de um `<ng-template>`
 * declarado num template e recolhido por `viewChild`. Mesmo arranjo do
 * `DocsVariantsStory`, e o mesmo que toda docs page do Angular já usa.
 */
@Component({
  selector: 'nds-docs-compositions-story',
  standalone: true,
  imports: [NdsDocsCompositions, NdsButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <ng-template #tplPar>
      <span class="nds-cluster" data-spacing="md">
        <button ndsButton variant="outline">Cancelar</button>
        <button ndsButton variant="default">Confirmar</button>
      </span>
    </ng-template>
    <ng-template #tplDestrutiva>
      <button ndsButton variant="destructive">Excluir projeto</button>
    </ng-template>
    <ng-template #tplComIcone>
      <button ndsButton variant="default">Salvar</button>
    </ng-template>

    <nds-docs-compositions
      [title]="title()"
      [note]="note()"
      [useWhenLabel]="useWhenLabel()"
      [id]="id()"
      [componentSlug]="componentSlug()"
      [items]="itens()"
    />
  `,
})
export class NdsDocsCompositionsStory {
  readonly title = input.required<string>();
  readonly note = input<string>('');
  readonly useWhenLabel = input<string>('Quando usar:');
  readonly id = input<string>('composicoes');
  readonly componentSlug = input<string | undefined>(undefined);
  /** Só da story: mostra o item sem `useWhen`, para provar que não sobra rótulo órfão. */
  readonly semUseWhen = input<boolean>(false);

  private readonly tplPar = viewChild.required<TemplateRef<unknown>>('tplPar');
  private readonly tplDestrutiva = viewChild.required<TemplateRef<unknown>>('tplDestrutiva');
  private readonly tplComIcone = viewChild.required<TemplateRef<unknown>>('tplComIcone');

  protected readonly itens = computed<DocsCompositionItem[]>(() =>
    this.semUseWhen()
      ? [
          {
            name: 'Botão com ícone',
            description: 'Ícone à esquerda do rótulo, decorativo e fora da árvore de acessibilidade.',
            preview: this.tplComIcone(),
          },
        ]
      : [
          {
            name: 'Par de ações',
            description: 'Cancelar em outline à esquerda, a ação primária à direita.',
            useWhen:
              'Sempre que houver uma escolha com volta. A ordem segue a leitura, e a primária fica por último.',
            code: '<button ndsButton variant="outline">Cancelar</button>\n<button ndsButton>Confirmar</button>',
            preview: this.tplPar(),
          },
          {
            name: 'Ação destrutiva confirmada',
            description: 'A variante destructive só aparece depois de um passo de confirmação.',
            useWhen: 'Quando a ação não tem volta. Solta na tela, ela vira um clique acidental caro.',
            code: '<button ndsButton variant="destructive">Excluir projeto</button>',
            preview: this.tplDestrutiva(),
          },
        ],
  );
}
