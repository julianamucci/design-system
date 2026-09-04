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
import { NdsDocsVariants, type DocsVariantItem } from './DocsVariants';

/**
 * Hospedeira da story. Existe porque `preview` é um `TemplateRef`, e TemplateRef
 * não se expressa em `props` de uma story — só nasce de um `<ng-template>`
 * declarado num template e recolhido por `viewChild`.
 *
 * É o mesmo arranjo que toda docs page do Angular usa (ver `ButtonDocs`), e é o
 * equivalente do `previewFactory` do Vanilla: a página declara os componentes
 * REAIS, com bindings normais, e o container instancia por `ngTemplateOutlet`.
 * Montar DOM à mão aqui perderia change detection e os inputs do componente.
 */
@Component({
  selector: 'nds-docs-variants-story',
  standalone: true,
  imports: [NdsDocsVariants, NdsButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <ng-template #tplSalvar><button ndsButton variant="default">Salvar</button></ng-template>
    <ng-template #tplCancelar><button ndsButton variant="outline">Cancelar</button></ng-template>
    <ng-template #tplExcluir><button ndsButton variant="destructive">Excluir</button></ng-template>
    <ng-template #tplEditar><button ndsButton variant="ghost">Editar</button></ng-template>

    <nds-docs-variants
      [title]="title()"
      [note]="note()"
      [id]="id()"
      [componentSlug]="componentSlug()"
      [items]="itens()"
    />
  `,
})
export class NdsDocsVariantsStory {
  readonly title = input.required<string>();
  readonly note = input<string>('');
  readonly id = input<string>('variantes');
  readonly componentSlug = input<string | undefined>(undefined);
  /** Só da story: reduz a lista a um item sem código, para mostrar o caso mínimo. */
  readonly apenasUm = input<boolean>(false);

  private readonly tplSalvar = viewChild.required<TemplateRef<unknown>>('tplSalvar');
  private readonly tplCancelar = viewChild.required<TemplateRef<unknown>>('tplCancelar');
  private readonly tplExcluir = viewChild.required<TemplateRef<unknown>>('tplExcluir');
  private readonly tplEditar = viewChild.required<TemplateRef<unknown>>('tplEditar');

  protected readonly itens = computed<DocsVariantItem[]>(() =>
    this.apenasUm()
      ? [
          {
            name: 'ghost',
            description: 'Sem fundo e sem contorno até o hover. Para ação terciária dentro de barra densa.',
            preview: this.tplEditar(),
          },
        ]
      : [
          {
            name: 'default',
            description: 'A ação primária do bloco. Uma por tela — duas competem, e a pessoa para para escolher.',
            code: '<button ndsButton>Salvar</button>',
            preview: this.tplSalvar(),
          },
          {
            name: 'outline',
            description: 'Ação secundária que ainda precisa de contorno. Convive com a primária sem disputá-la.',
            code: '<button ndsButton variant="outline">Cancelar</button>',
            preview: this.tplCancelar(),
          },
          {
            name: 'destructive',
            description: 'Só para o que não tem volta. Dentro de um AlertDialog, nunca solta na tela.',
            code: '<button ndsButton variant="destructive">Excluir</button>',
            preview: this.tplExcluir(),
          },
        ],
  );
}
