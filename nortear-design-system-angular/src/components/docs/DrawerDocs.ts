import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  TemplateRef,
  ViewEncapsulation,
  computed,
  effect,
  signal,
  viewChild,
} from '@angular/core';
import type { RdxDialogOpenChange } from '@radix-ng/primitives/dialog';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale, type TranslationOverrides } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { stripHtml, toPlainText } from '@/lib/strip-html';
import { NDS_DRAWER, drawerCloseReason, type DrawerDirection } from '@/components/ui/drawer';
import { NdsButton } from '@/components/ui/button';
import { NdsInput } from '@/components/ui/input';
import { NdsLabel } from '@/components/ui/label';
import uiTranslations from '@/i18n/ui.json';
import drawerTranslations from '@shared/content/drawer/translations.json';

import {
  NdsDocsPageLayout,
  NdsDocsHeader,
  NdsDocsDemonstration,
  NdsDocsAnatomy,
  NdsDocsWhenToUse,
  NdsDocsDoDont,
  NdsDocsImport,
  NdsDocsVariants,
  NdsDocsCompositions,
  NdsDocsStates,
  NdsDocsProps,
  NdsDocsTokens,
  NdsDocsAccessibility,
  NdsDocsRelated,
  NdsDocsNotes,
  NdsDocsAnalytics,
  NdsDocsTestes,
} from '@/components/docs/shared/sections';

/**
 * Rótulos de ação que o conteúdo compartilhado do Drawer não traz.
 *
 * O bloco `demonstration.labels` deste slug só tem as quatro direções — não há
 * "confirmar", "excluir" nem rótulo de campo, que os exemplos de formulário e
 * de confirmação destrutiva precisam. Entram por override, o mecanismo que este
 * projeto reserva para rótulos e nomes de prop, e ficam nos três idiomas para
 * não plantar literal em português na página.
 *
 * Exportado porque a story de composições monta os MESMOS exemplos: uma segunda
 * tabela de textos divergiria da primeira na revisão de conteúdo seguinte.
 * Registrado no relatório como lacuna do conteúdo compartilhado.
 */
export const LABELS_DRAWER: TranslationOverrides = {
  'pt-BR': {
    'demonstration.labels.confirm': 'Salvar alterações',
    'demonstration.labels.destroy': 'Excluir',
    'demonstration.labels.fieldName': 'Nome',
    'demonstration.labels.destroyMessage': 'Você pode desfazer esta ação nos próximos 30 dias.',
  },
  en: {
    'demonstration.labels.confirm': 'Save changes',
    'demonstration.labels.destroy': 'Delete',
    'demonstration.labels.fieldName': 'Name',
    'demonstration.labels.destroyMessage': 'You can undo this action within the next 30 days.',
  },
  es: {
    'demonstration.labels.confirm': 'Guardar cambios',
    'demonstration.labels.destroy': 'Eliminar',
    'demonstration.labels.fieldName': 'Nombre',
    'demonstration.labels.destroyMessage': 'Puedes deshacer esta acción en los próximos 30 días.',
  },
};

/**
 * Ajustes de texto que descrevem ESTE stack.
 *
 * O conteúdo compartilhado do Drawer foi escrito a partir das stacks que rodam
 * a lib de gestos: as notas e as metatags citam a lib e as outras stacks pelo
 * nome, e um dos itens de acessibilidade recomenda um utilitário da era
 * Tailwind que não existe mais no CSS `.nds-*`. Cada docs page é consumida
 * sozinha — comparação cross-stack no texto vaza. Estes overrides trocam só as
 * frases afetadas; o resto do conteúdo é o compartilhado, sem cópia.
 */
const AJUSTES_ANGULAR: TranslationOverrides = {
  'pt-BR': {
    'seo.description':
      'Documentação do Drawer: painel deslizante com 4 direções, foco preso, Escape e WCAG 2.2 AA.',
    'seo.aiSummary':
      'Componente Drawer mobile-first que renderiza um painel deslizante com 4 direções (bottom/top/left/right), com foco preso, Escape e nome acessível ligado ao título.',
    'seo.aiEntities':
      'Drawer, Angular, foco preso, WCAG 2.2, role=dialog, aria-modal, painel deslizante',
    'notes.item1':
      '<strong>Base</strong>: o painel compõe o primitivo de diálogo headless — dele vêm <code>role="dialog"</code>, <code>aria-modal</code>, foco preso, devolução de foco ao gatilho, Escape e portal. O visual inteiro vem das classes <code>.nds-drawer-*</code> do CSS compartilhado.',
    'accessibility.items.item5':
      'Nenhuma ação depende de arrastar: a alça é afordância visual e todo caminho de fechamento (Escape, clique no overlay, botão do rodapé) é operável por teclado (WCAG 2.5.7).',
    'accessibility.items.item6':
      'A redução de movimento é respeitada pelo CSS compartilhado via <code>prefers-reduced-motion</code>; animação customizada precisa repetir a mesma consulta de mídia.',
    'props.table.dismissible.description':
      'Desliga o fechamento por clique fora e por perda de foco. Escape continua fechando — painel modal que engole Escape é armadilha de teclado.',
    'props.table.panelClass.description':
      'Classes do design system aplicadas ao painel. Existe porque o painel é construído dentro do portal: não há elemento onde quem consome pudesse escrever a classe.',
  },
  en: {
    'seo.description':
      'Drawer documentation: sliding panel with 4 directions, focus trap, Escape, and WCAG 2.2 AA.',
    'seo.aiSummary':
      'Mobile-first Drawer component renders a sliding panel with 4 directions (bottom/top/left/right), with focus trap, Escape, and an accessible name bound to the title.',
    'seo.aiEntities':
      'Drawer, Angular, focus trap, WCAG 2.2, role=dialog, aria-modal, sliding panel',
    'notes.item1':
      '<strong>Base</strong>: the panel composes the headless dialog primitive — it provides <code>role="dialog"</code>, <code>aria-modal</code>, focus trap, focus restoration to the trigger, Escape, and the portal. All visuals come from the shared <code>.nds-drawer-*</code> classes.',
    'accessibility.items.item5':
      'No action depends on dragging: the handle is a visual affordance and every closing path (Escape, overlay click, footer button) is keyboard operable (WCAG 2.5.7).',
    'accessibility.items.item6':
      'Reduced motion is honoured by the shared CSS through <code>prefers-reduced-motion</code>; custom animation must repeat the same media query.',
    'props.table.dismissible.description':
      'Turns off closing by outside click and focus loss. Escape still closes — a modal panel that swallows Escape is a keyboard trap.',
    'props.table.panelClass.description':
      'Design system classes applied to the panel. It exists because the panel is built inside the portal: there is no element where the consumer could write the class.',
  },
  es: {
    'seo.description':
      'Documentación de Drawer: panel deslizante con 4 direcciones, foco atrapado, Escape y WCAG 2.2 AA.',
    'seo.aiSummary':
      'Componente Drawer mobile-first que renderiza un panel deslizante con 4 direcciones (bottom/top/left/right), con foco atrapado, Escape y nombre accesible ligado al título.',
    'seo.aiEntities':
      'Drawer, Angular, foco atrapado, WCAG 2.2, role=dialog, aria-modal, panel deslizante',
    'notes.item1':
      '<strong>Base</strong>: el panel compone el primitivo de diálogo headless — de él vienen <code>role="dialog"</code>, <code>aria-modal</code>, foco atrapado, devolución del foco al disparador, Escape y el portal. Todo el visual viene de las clases <code>.nds-drawer-*</code> del CSS compartido.',
    'accessibility.items.item5':
      'Ninguna acción depende de arrastrar: el asa es una afordancia visual y todo camino de cierre (Escape, clic en el overlay, botón del pie) es operable por teclado (WCAG 2.5.7).',
    'accessibility.items.item6':
      'La reducción de movimiento la respeta el CSS compartido vía <code>prefers-reduced-motion</code>; una animación personalizada debe repetir la misma consulta de medios.',
    'props.table.dismissible.description':
      'Apaga el cierre por clic fuera y por pérdida de foco. Escape sigue cerrando — un panel modal que se traga Escape es una trampa de teclado.',
    'props.table.panelClass.description':
      'Clases del design system aplicadas al panel. Existe porque el panel se construye dentro del portal: no hay elemento donde quien consume pudiera escribir la clase.',
  },
};

const OVERRIDES: TranslationOverrides = {
  'pt-BR': { ...LABELS_DRAWER['pt-BR'], ...AJUSTES_ANGULAR['pt-BR'] },
  en: { ...LABELS_DRAWER.en, ...AJUSTES_ANGULAR.en },
  es: { ...LABELS_DRAWER.es, ...AJUSTES_ANGULAR.es },
};

const { t: tNav } = useTranslation(uiTranslations as Record<string, unknown>);
const { t, dict } = useTranslation(drawerTranslations as Record<string, unknown>, OVERRIDES);

const SECTION_IDS = [
  'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
  'importacao', 'variantes', 'composicoes', 'estados', 'propriedades', 'tokens',
  'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
] as const;

// Rótulos de navegação saem do `ui.json`, não do conteúdo do componente: é a
// mesma trilha em todas as docs pages deste stack, e o conteúdo por componente
// só teria como divergir.
const NAV_GROUPS: { labelKey: string; sections: { id: string; labelKey: string }[] }[] = [
  { labelKey: 'nav.overview', sections: [
    { id: 'demonstracao', labelKey: 'nav.demonstration' },
    { id: 'anatomia',     labelKey: 'nav.anatomy'       },
    { id: 'quando-usar',  labelKey: 'nav.usage'         },
    { id: 'do-dont',      labelKey: 'nav.doDont'        },
  ]},
  { labelKey: 'nav.techRef', sections: [
    { id: 'importacao',   labelKey: 'nav.import'       },
    { id: 'variantes',    labelKey: 'nav.variants'     },
    { id: 'composicoes',  labelKey: 'nav.compositions' },
    { id: 'estados',      labelKey: 'nav.states'       },
    { id: 'propriedades', labelKey: 'nav.props'        },
    { id: 'tokens',       labelKey: 'nav.tokens'       },
  ]},
  { labelKey: 'nav.context', sections: [
    { id: 'acessibilidade', labelKey: 'nav.accessibility' },
    { id: 'relacionados',   labelKey: 'nav.related'       },
    { id: 'notas',          labelKey: 'nav.notes'         },
  ]},
  { labelKey: 'nav.quality', sections: [
    { id: 'analytics', labelKey: 'nav.analytics' },
    { id: 'testes',    labelKey: 'nav.testes'    },
  ]},
];

const IMPORT_CODE = `import { NDS_DRAWER } from '@/components/ui/drawer';

// ou, peça a peça:
import {
  NdsDrawer,
  NdsDrawerTrigger,
  NdsDrawerContent,
  NdsDrawerHeader,
  NdsDrawerTitle,
  NdsDrawerDescription,
  NdsDrawerBody,
  NdsDrawerFooter,
  NdsDrawerClose,
} from '@/components/ui/drawer';`;

const IMPORT_CODE_COMPONENTE = `import { NDS_DRAWER } from '@/components/ui/drawer';
import { NdsButton } from '@/components/ui/button';

@Component({
  imports: [...NDS_DRAWER, NdsButton],
})
export class Exemplo {}`;

const INTERFACE_CODE = `// A raiz compõe o Dialog headless: dele vêm foco preso, Escape,
// aria-modal, restauração de foco, trava de rolagem e o portal.
@Component({
  selector: 'nds-drawer',
  hostDirectives: [
    { directive: RdxDialogRoot,
      inputs:  ['open', 'defaultOpen', 'modal', 'disablePointerDismissal'],
      outputs: ['openChange', 'onOpenChange', 'onOpenChangeComplete'] },
  ],
})
export class NdsDrawer {
  direction = input<'bottom' | 'top' | 'left' | 'right'>('bottom');
}

// O painel nasce dentro do portal, então o conteúdo mora num <ng-template>.
@Directive({ selector: 'ng-template[ndsDrawerContent]' })
export class NdsDrawerContent {
  panelClass = input('');   // classes .nds-* extras no painel
}

@Directive({ selector: 'button[ndsDrawerTrigger]', hostDirectives: [RdxDialogTrigger] })
export class NdsDrawerTrigger {}

@Directive({ selector: 'h2[ndsDrawerTitle], h3[ndsDrawerTitle]', hostDirectives: [RdxDialogTitle] })
export class NdsDrawerTitle {}

@Directive({ selector: 'p[ndsDrawerDescription]', hostDirectives: [RdxDialogDescription] })
export class NdsDrawerDescription {}

@Directive({ selector: 'button[ndsDrawerClose]', hostDirectives: [RdxDialogClose] })
export class NdsDrawerClose {}`;

// A variante `angular` de `props.extensibilityCode` no conteúdo compartilhado
// escreve a classe de largura no `<ng-template ndsDrawerContent>`. Classe num
// `<ng-template>` não vai para lugar nenhum — o template não tem elemento
// hospedeiro. A escotilha aqui é o input `panelClass`, que o componente aplica
// no painel de verdade, criado dentro do portal.
const EXTENSIBILITY_CODE = `<!-- Painel controlado, entrando pela direita -->
<nds-drawer [(open)]="aberto" direction="right">
  <button ndsDrawerTrigger ndsButton variant="outline">Abrir filtros</button>

  <ng-template ndsDrawerContent panelClass="nds-max-w-md">
    <div ndsDrawerHeader>
      <h2 ndsDrawerTitle>Editar perfil</h2>
      <p ndsDrawerDescription>Atualize seus dados pessoais e foto.</p>
    </div>

    <div ndsDrawerBody>
      <!-- formulário -->
    </div>

    <div ndsDrawerFooter>
      <button ndsDrawerClose ndsButton variant="outline">Cancelar</button>
      <button ndsButton (click)="salvar()">Salvar alterações</button>
    </div>
  </ng-template>
</nds-drawer>`;

const TOKENS_CODE = `/* Tokens que o painel consome */
:root {
  --background:       0 0% 100%;   /* fundo do painel */
  --foreground:     222 47% 11%;   /* texto e título */
  --muted-foreground: 215 16% 47%; /* descrição */
  --border:         214 32% 91%;   /* borda do lado de entrada */
  --muted:          210 40% 96%;   /* alça */
}

/* A direção mora em data-vaul-drawer-direction, e é dela que saem posição,
   borda e cantos:
   .nds-drawer-content[data-vaul-drawer-direction="right"] { right: 0; … } */`;

const VARIANT_CODE = (direction: DrawerDirection, title: string) => `<nds-drawer${
  direction === 'bottom' ? '' : ` direction="${direction}"`
}>
  <button ndsDrawerTrigger ndsButton variant="outline">Abrir</button>

  <ng-template ndsDrawerContent>
    <div ndsDrawerHeader>
      <h2 ndsDrawerTitle>${title}</h2>
      <p ndsDrawerDescription>Atualize seus dados pessoais e foto.</p>
    </div>

    <div ndsDrawerFooter>
      <button ndsDrawerClose ndsButton variant="outline">Cancelar</button>
    </div>
  </ng-template>
</nds-drawer>`;

const SCROLL_CODE = `<nds-drawer>
  <button ndsDrawerTrigger ndsButton variant="outline">Abrir</button>

  <ng-template ndsDrawerContent>
    <div ndsDrawerHeader>
      <h2 ndsDrawerTitle>Termos</h2>
      <p ndsDrawerDescription>Leia antes de continuar.</p>
    </div>

    <!-- ndsDrawerBody rola sozinho dentro do teto de altura do painel e
         recebe foco por teclado (WCAG 2.1.1). -->
    <div ndsDrawerBody class="nds-stack" data-spacing="sm">
      @for (p of paragrafos; track p.id) {
        <p class="nds-text-body">{{ p.texto }}</p>
      }
    </div>

    <div ndsDrawerFooter>
      <button ndsDrawerClose ndsButton variant="outline">Cancelar</button>
    </div>
  </ng-template>
</nds-drawer>`;

const COMPOSITION_CODE = {
  withForm: `<nds-drawer>
  <button ndsDrawerTrigger ndsButton variant="outline">Editar perfil</button>

  <ng-template ndsDrawerContent>
    <div ndsDrawerHeader>
      <h2 ndsDrawerTitle>Editar perfil</h2>
      <p ndsDrawerDescription>Atualize seus dados pessoais e foto.</p>
    </div>

    <div ndsDrawerBody class="nds-stack" data-spacing="sm">
      <label ndsLabel for="perfil-nome">Nome</label>
      <input ndsInput id="perfil-nome" name="nome" />
    </div>

    <div ndsDrawerFooter>
      <button ndsDrawerClose ndsButton variant="outline">Cancelar</button>
      <button ndsButton (click)="salvar()">Salvar alterações</button>
    </div>
  </ng-template>
</nds-drawer>`,
  withConfirmation: `<nds-drawer>
  <button ndsDrawerTrigger ndsButton variant="outline">Excluir</button>

  <ng-template ndsDrawerContent>
    <div ndsDrawerHeader>
      <h2 ndsDrawerTitle>Excluir</h2>
      <p ndsDrawerDescription>Você pode desfazer esta ação nos próximos 30 dias.</p>
    </div>

    <div ndsDrawerFooter>
      <button ndsDrawerClose ndsButton variant="outline">Cancelar</button>
      <button ndsButton variant="destructive" (click)="excluir()">Excluir</button>
    </div>
  </ng-template>
</nds-drawer>`,
};

const DIRECOES: DrawerDirection[] = ['bottom', 'top', 'left', 'right'];

@Component({
  selector: 'nds-drawer-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    ...NDS_DRAWER, NdsButton, NdsInput, NdsLabel,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsCompositions, NdsDocsStates, NdsDocsProps, NdsDocsTokens,
    NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics,
    NdsDocsTestes,
  ],
  template: `
    <!-- ─── Do & Don't ─────────────────────────────────────────────────── -->

    <ng-template #tplDoDont1Do>
      <nds-drawer>
        <button ndsDrawerTrigger ndsButton variant="outline">{{ t('usage.uxWriting.table.trigger.good') }}</button>
        <ng-template ndsDrawerContent>
          <div ndsDrawerHeader>
            <h3 ndsDrawerTitle>{{ t('usage.uxWriting.table.title.good') }}</h3>
            <p ndsDrawerDescription>{{ t('usage.uxWriting.table.description.good') }}</p>
          </div>
          <div ndsDrawerFooter>
            <button ndsDrawerClose ndsButton variant="outline">{{ t('usage.uxWriting.table.close.good') }}</button>
          </div>
        </ng-template>
      </nds-drawer>
    </ng-template>

    <ng-template #tplDoDont1Dont>
      <!-- O "don't" da legenda é o painel SEM título. O exemplo aqui usa o
           título ruim que a própria tabela de UX writing traz, e não a ausência
           dele: um diálogo modal sem nome acessível dentro da docs page não é
           mau exemplo, é armadilha — quem usa leitor de tela ficaria sem saber
           onde entrou. A falha demonstrada é a mesma família: título que não
           nomeia o painel. -->
      <nds-drawer>
        <button ndsDrawerTrigger ndsButton variant="outline">{{ t('usage.uxWriting.table.trigger.bad') }}</button>
        <ng-template ndsDrawerContent>
          <div ndsDrawerHeader>
            <h3 ndsDrawerTitle>{{ t('usage.uxWriting.table.title.bad') }}</h3>
          </div>
          <div ndsDrawerFooter>
            <button ndsDrawerClose ndsButton variant="outline">{{ t('usage.uxWriting.table.close.good') }}</button>
          </div>
        </ng-template>
      </nds-drawer>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <nds-drawer>
        <button ndsDrawerTrigger ndsButton variant="outline">{{ t('usage.uxWriting.table.trigger.good') }}</button>
        <ng-template ndsDrawerContent>
          <div ndsDrawerHeader>
            <h3 ndsDrawerTitle>{{ t('variants.items.bottom') }}</h3>
            <p ndsDrawerDescription>{{ t('usage.uxWriting.table.description.good') }}</p>
          </div>
          <div ndsDrawerFooter>
            <button ndsDrawerClose ndsButton variant="outline">{{ t('usage.uxWriting.table.close.good') }}</button>
          </div>
        </ng-template>
      </nds-drawer>
    </ng-template>

    <ng-template #tplDoDont2Dont>
      <!-- Aqui o exemplo é DESCRITIVO, não vivo. Abrir um Drawer dentro de
           outro quebra o foco preso de verdade, e a página de documentação
           passaria a conter a armadilha que ela está ensinando a evitar. -->
      <div class="nds-stack" data-spacing="xs">
        <p class="nds-text-body nds-font-medium">{{ t('variants.items.bottom') }} + {{ t('variants.items.bottom') }}</p>
        <p class="nds-text-caption nds-text-destructive">{{ doDontAviso() }}</p>
      </div>
    </ng-template>

    <!-- ─── Variantes: as quatro direções + corpo rolável ──────────────── -->

    <ng-template #tplVarBottom>
      <nds-drawer direction="bottom">
        <button ndsDrawerTrigger ndsButton variant="outline">{{ t('variants.items.bottom') }}</button>
        <ng-template ndsDrawerContent>
          <div ndsDrawerHeader>
            <h3 ndsDrawerTitle>{{ rotuloDirecao('bottom') }}</h3>
            <p ndsDrawerDescription>{{ t('usage.uxWriting.table.description.good') }}</p>
          </div>
          <div ndsDrawerFooter>
            <button ndsDrawerClose ndsButton variant="outline">{{ t('usage.uxWriting.table.close.good') }}</button>
          </div>
        </ng-template>
      </nds-drawer>
    </ng-template>

    <ng-template #tplVarTop>
      <nds-drawer direction="top">
        <button ndsDrawerTrigger ndsButton variant="outline">{{ t('variants.items.top') }}</button>
        <ng-template ndsDrawerContent>
          <div ndsDrawerHeader>
            <h3 ndsDrawerTitle>{{ rotuloDirecao('top') }}</h3>
            <p ndsDrawerDescription>{{ t('usage.uxWriting.table.description.good') }}</p>
          </div>
          <div ndsDrawerFooter>
            <button ndsDrawerClose ndsButton variant="outline">{{ t('usage.uxWriting.table.close.good') }}</button>
          </div>
        </ng-template>
      </nds-drawer>
    </ng-template>

    <ng-template #tplVarLeft>
      <nds-drawer direction="left">
        <button ndsDrawerTrigger ndsButton variant="outline">{{ t('variants.items.left') }}</button>
        <ng-template ndsDrawerContent>
          <div ndsDrawerHeader>
            <h3 ndsDrawerTitle>{{ rotuloDirecao('left') }}</h3>
            <p ndsDrawerDescription>{{ t('usage.uxWriting.table.description.good') }}</p>
          </div>
          <div ndsDrawerFooter>
            <button ndsDrawerClose ndsButton variant="outline">{{ t('usage.uxWriting.table.close.good') }}</button>
          </div>
        </ng-template>
      </nds-drawer>
    </ng-template>

    <ng-template #tplVarRight>
      <nds-drawer direction="right">
        <button ndsDrawerTrigger ndsButton variant="outline">{{ t('variants.items.right') }}</button>
        <ng-template ndsDrawerContent>
          <div ndsDrawerHeader>
            <h3 ndsDrawerTitle>{{ rotuloDirecao('right') }}</h3>
            <p ndsDrawerDescription>{{ t('usage.uxWriting.table.description.good') }}</p>
          </div>
          <div ndsDrawerFooter>
            <button ndsDrawerClose ndsButton variant="outline">{{ t('usage.uxWriting.table.close.good') }}</button>
          </div>
        </ng-template>
      </nds-drawer>
    </ng-template>

    <ng-template #tplVarScroll>
      <nds-drawer>
        <button ndsDrawerTrigger ndsButton variant="outline">{{ t('variants.items.withScroll.name') }}</button>
        <ng-template ndsDrawerContent>
          <div ndsDrawerHeader>
            <h3 ndsDrawerTitle>{{ t('variants.items.withScroll.name') }}</h3>
            <p ndsDrawerDescription>{{ t('usage.uxWriting.table.description.good') }}</p>
          </div>
          <div ndsDrawerBody class="nds-stack" data-spacing="sm">
            @for (p of paragrafosLongos(); track p.id) {
              <p class="nds-text-body nds-text-muted-foreground">{{ p.text }}</p>
            }
          </div>
          <div ndsDrawerFooter>
            <button ndsDrawerClose ndsButton variant="outline">{{ t('usage.uxWriting.table.close.good') }}</button>
          </div>
        </ng-template>
      </nds-drawer>
    </ng-template>

    <!-- ─── Composições ────────────────────────────────────────────────── -->

    <ng-template #tplCompFormulario>
      <nds-drawer>
        <button ndsDrawerTrigger ndsButton variant="outline">{{ t('usage.uxWriting.table.title.good') }}</button>
        <ng-template ndsDrawerContent>
          <div ndsDrawerHeader>
            <h3 ndsDrawerTitle>{{ t('usage.uxWriting.table.title.good') }}</h3>
            <p ndsDrawerDescription>{{ t('usage.uxWriting.table.description.good') }}</p>
          </div>

          <div ndsDrawerBody class="nds-stack" data-spacing="sm">
            <label ndsLabel for="docs-drawer-nome">{{ t('demonstration.labels.fieldName') }}</label>
            <input ndsInput id="docs-drawer-nome" name="nome" />
          </div>

          <div ndsDrawerFooter>
            <button ndsDrawerClose ndsButton variant="outline">{{ t('usage.uxWriting.table.close.good') }}</button>
            <button ndsButton (click)="aoConfirmar('composicoes')">{{ t('demonstration.labels.confirm') }}</button>
          </div>
        </ng-template>
      </nds-drawer>
    </ng-template>

    <ng-template #tplCompConfirmacao>
      <nds-drawer>
        <button ndsDrawerTrigger ndsButton variant="outline">{{ t('demonstration.labels.destroy') }}</button>
        <ng-template ndsDrawerContent>
          <div ndsDrawerHeader>
            <h3 ndsDrawerTitle>{{ t('demonstration.labels.destroy') }}</h3>
            <p ndsDrawerDescription>{{ t('demonstration.labels.destroyMessage') }}</p>
          </div>

          <div ndsDrawerFooter>
            <button ndsDrawerClose ndsButton variant="outline">{{ t('usage.uxWriting.table.close.good') }}</button>
            <button ndsButton variant="destructive" (click)="aoConfirmar('destrutiva')">
              {{ t('demonstration.labels.destroy') }}
            </button>
          </div>
        </ng-template>
      </nds-drawer>
    </ng-template>

    <!-- ─── Página ─────────────────────────────────────────────────────── -->

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="drawer"
    >
      <div docsHeader>
        <nds-docs-header
          [title]="t('title')"
          [description]="t('description')"
          [category]="t('category')"
          [type]="t('type')"
        />
      </div>

      <ng-container docsMain>
        <nds-docs-demonstration [title]="t('demonstration.title')">
          <div class="nds-cluster nds-w-full" data-spacing="md">
            @for (d of direcoes(); track d.key) {
              <div class="nds-stack" data-spacing="xs">
                <p class="nds-text-caption nds-text-muted-foreground">{{ d.label }}</p>

                <nds-drawer
                  [direction]="d.key"
                  (onOpenChange)="aoMudarPainel(d.key, $event)"
                >
                  <button ndsDrawerTrigger ndsButton variant="outline">
                    {{ d.name }}
                  </button>

                  <ng-template ndsDrawerContent>
                    <div ndsDrawerHeader>
                      <h3 ndsDrawerTitle>{{ d.label }}</h3>
                      <p ndsDrawerDescription>{{ d.estilo }}</p>
                    </div>

                    <div ndsDrawerFooter>
                      <button ndsDrawerClose ndsButton variant="outline">
                        {{ t('usage.uxWriting.table.close.good') }}
                      </button>
                    </div>
                  </ng-template>
                </nds-drawer>
              </div>
            }
          </div>
        </nds-docs-demonstration>

        <nds-docs-anatomy
          [title]="t('anatomy.title')"
          [items]="anatomyItems()"
          [structureLabel]="t('anatomy.structureLabel')"
          [structureCode]="t('anatomy.structureCode')"
          language="html"
        />

        <nds-docs-when-to-use
          [title]="t('usage.title')"
          [guidelines]="guidelines()"
          [scenarios]="scenarios()"
          [uxWriting]="uxWriting()"
          [do]="usageDo()"
          [dont]="usageDont()"
        />

        <nds-docs-do-dont [title]="t('doDont.title')" [pairs]="doDontPairs()" />

        <nds-docs-import
          [title]="t('import.title')"
          [code]="importCode"
          [secondaryCode]="importCodeComponente"
          componentSlug="drawer"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [items]="variantItems()"
          componentSlug="drawer"
          id="variantes"
          language="html"
        />

        <nds-docs-compositions
          [title]="t('variants.compositionsTitle')"
          [items]="compositionItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="drawer"
        />

        <nds-docs-states
          [title]="t('states.title')"
          [cols]="statesCols()"
          [items]="stateItems()"
        />

        <nds-docs-props
          [title]="t('props.title')"
          [tables]="propTables()"
          [interfaceCode]="interfaceCode"
          [extensibilityTitle]="t('props.extensibilityTitle')"
          [extensibilityCode]="extensibilityCode"
          language="ts"
        />

        <nds-docs-tokens
          [title]="t('tokens.title')"
          [cols]="tokensCols()"
          [items]="tokenItems()"
          [customizationTitle]="t('tokens.customizationTitle')"
          [customizationCode]="tokensCode"
        />

        <nds-docs-accessibility
          [title]="t('accessibility.title')"
          [summary]="t('accessibility.summary')"
          [items]="a11yItems()"
          [keyboardTitle]="t('accessibility.keyboard.title')"
          [keyboardItems]="keyboardItems()"
          [screenReaderTitle]="t('accessibility.screenReader.title')"
          [screenReaderItems]="screenReaderItems()"
        />

        <nds-docs-related
          [title]="t('related.title')"
          [items]="relatedItems()"
          componentSlug="drawer"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="drawer"
        />

        <nds-docs-analytics
          [title]="t('analytics.title')"
          [cols]="analyticsCols()"
          [items]="analyticsItems()"
        />

        <nds-docs-testes
          [title]="t('testes.title')"
          [functional]="testesFunctional()"
          [accessibility]="testesAccessibility()"
          [visual]="testesVisual()"
        />
      </ng-container>
    </nds-docs-page-layout>
  `,
})
export class NdsDrawerDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly importCode = IMPORT_CODE;
  protected readonly importCodeComponente = IMPORT_CODE_COMPONENTE;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly extensibilityCode = EXTENSIBILITY_CODE;
  protected readonly tokensCode = TOKENS_CODE;

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarBottom = viewChild.required<TemplateRef<unknown>>('tplVarBottom');
  private readonly tplVarTop = viewChild.required<TemplateRef<unknown>>('tplVarTop');
  private readonly tplVarLeft = viewChild.required<TemplateRef<unknown>>('tplVarLeft');
  private readonly tplVarRight = viewChild.required<TemplateRef<unknown>>('tplVarRight');
  private readonly tplVarScroll = viewChild.required<TemplateRef<unknown>>('tplVarScroll');
  private readonly tplCompFormulario = viewChild.required<TemplateRef<unknown>>('tplCompFormulario');
  private readonly tplCompConfirmacao = viewChild.required<TemplateRef<unknown>>('tplCompConfirmacao');

  /**
   * As quatro direções, derivadas do conteúdo — nunca contadas à mão.
   * `name` é o rótulo curto da variante, `label` a legenda da demonstração e
   * `estilo` a descrição de como o painel se comporta naquela direção.
   */
  protected readonly direcoes = computed(() => {
    dict();
    return DIRECOES.map((key) => ({
      key,
      name: t(`variants.items.${key}`),
      label: stripHtml(t(`demonstration.labels.${key}`)),
      estilo: stripHtml(t(`variants.styles.${key}`)),
    }));
  });

  /** Corpo longo do exemplo de rolagem — texto vindo do próprio conteúdo. */
  protected readonly paragrafosLongos = computed(() => {
    dict();
    const base = stripHtml(t('variants.items.withScroll.use'));
    return Array.from({ length: 12 }, (_, i) => ({ id: `p-${i}`, text: `${i + 1}. ${base}` }));
  });

  /** Aviso do "don't" descritivo do segundo par — a consequência, sem rodeio. */
  protected readonly doDontAviso = computed(() => {
    dict();
    return toPlainText(t('doDont.pair2.dont'));
  });

  /** Chamado do template: `String(...)` e afins não existem no contexto Angular. */
  protected rotuloDirecao(key: DrawerDirection): string {
    return stripHtml(t(`demonstration.labels.${key}`));
  }

  /**
   * Abertura e fechamento dos painéis da demonstração.
   *
   * O evento nasce AQUI, na camada de produto — o primitivo de UI não importa
   * `@/lib/analytics`. O payload leva valores estáveis (a direção, o motivo),
   * nunca o texto traduzido, que viraria três valores distintos no GA4.
   */
  protected aoMudarPainel(direction: DrawerDirection, evento: RdxDialogOpenChange): void {
    if (evento.open) {
      track('drawer_open', { component: 'drawer', label: direction, location: 'docs_demo' });
      return;
    }
    track('drawer_close', {
      component: 'drawer',
      label: direction,
      reason: drawerCloseReason(evento.reason),
      location: 'docs_demo',
    });
  }

  /** Ação primária do rodapé das composições. */
  protected aoConfirmar(qual: string): void {
    track('dialog_confirm', {
      component: 'drawer',
      action: 'confirm',
      label: qual,
      location: 'docs_demo',
    });
  }

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: tNav(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: tNav(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => {
    const d = dict();
    return itemsFromDict(d, 'anatomy');
  });

  protected readonly guidelines = computed(() => {
    const d = dict();
    return { title: t('usage.guidelines.title'), items: itemsFromDict(d, 'usage.guidelines') };
  });

  protected readonly scenarios = computed(() => {
    const d = dict();
    return {
      title: t('usage.scenarios.title'),
      cols: {
        scenario: t('usage.scenarios.cols.scenario'),
        use: t('usage.scenarios.cols.use'),
        alternative: t('usage.scenarios.cols.alternative'),
      },
      items: rowsFromDict(d, 'usage.scenarios', ['s', 'u', 'a']).map((r) => ({
        s: toPlainText(r.s),
        u: toPlainText(r.u),
        a: toPlainText(r.a),
      })),
    };
  });

  protected readonly uxWriting = computed(() => {
    dict();
    return {
      title: t('usage.uxWriting.title'),
      // `do`/`dont` e não `correct`/`avoid`: são esses os nomes que o container
      // genérico lê. O conteúdo compartilhado chama as colunas de correct/avoid.
      cols: {
        element: t('usage.uxWriting.table.element'),
        rules: t('usage.uxWriting.table.rules'),
        do: t('usage.uxWriting.table.correct'),
        dont: t('usage.uxWriting.table.avoid'),
      },
      items: ['title', 'description', 'trigger', 'close'].map((k) => ({
        element: toPlainText(t(`usage.uxWriting.table.${k}.name`)),
        rules: toPlainText(t(`usage.uxWriting.table.${k}.format`)),
        do: toPlainText(t(`usage.uxWriting.table.${k}.good`)),
        dont: toPlainText(t(`usage.uxWriting.table.${k}.bad`)),
      })),
    };
  });

  protected readonly usageDo = computed(() => {
    const d = dict();
    return { title: t('usage.do.title'), items: itemsFromDict(d, 'usage.do') };
  });

  protected readonly usageDont = computed(() => {
    const d = dict();
    return { title: t('usage.dont.title'), items: itemsFromDict(d, 'usage.dont') };
  });

  protected readonly doDontPairs = computed(() => {
    dict();
    const pairs: [TemplateRef<unknown>, TemplateRef<unknown>][] = [
      [this.tplDoDont1Do(), this.tplDoDont1Dont()],
      [this.tplDoDont2Do(), this.tplDoDont2Dont()],
    ];
    return pairs.map(([doTpl, dontTpl], i) => ({
      doLabel: tNav('common.do'),
      dontLabel: tNav('common.dont'),
      doCaption: toPlainText(t(`doDont.pair${i + 1}.do`)),
      dontCaption: toPlainText(t(`doDont.pair${i + 1}.dont`)),
      doPreview: doTpl,
      dontPreview: dontTpl,
    }));
  });

  protected readonly variantItems = computed(() => {
    dict();
    const byDirection = [
      { key: 'bottom' as const, tpl: this.tplVarBottom() },
      { key: 'top' as const,    tpl: this.tplVarTop()    },
      { key: 'left' as const,   tpl: this.tplVarLeft()   },
      { key: 'right' as const,  tpl: this.tplVarRight()  },
    ].map(({ key, tpl }) => ({
      name: t(`variants.items.${key}`),
      description: stripHtml(t(`variants.styles.${key}`)),
      code: VARIANT_CODE(key, this.rotuloDirecao(key)),
      trackId: key,
      preview: tpl,
    }));

    // A quinta entrada de `variants.items` não é uma direção: é um OBJETO com
    // nome, descrição e uso próprios. Tratá-la como as outras devolveria a
    // chave crua, porque `t()` de um caminho que aponta para objeto devolve a
    // própria chave.
    return [
      ...byDirection,
      {
        name: t('variants.items.withScroll.name'),
        description: stripHtml(t('variants.items.withScroll.description')),
        code: SCROLL_CODE,
        trackId: 'withScroll',
        preview: this.tplVarScroll(),
      },
    ];
  });

  protected readonly compositionItems = computed(() => {
    dict();
    const mapa: { key: 'withForm' | 'withConfirmation'; tpl: TemplateRef<unknown> }[] = [
      { key: 'withForm',         tpl: this.tplCompFormulario() },
      { key: 'withConfirmation', tpl: this.tplCompConfirmacao() },
    ];
    return mapa.map(({ key, tpl }) => ({
      name: t(`variants.compositions.${key}.name`),
      description: t(`variants.compositions.${key}.description`),
      useWhen: t(`variants.compositions.${key}.use`),
      code: COMPOSITION_CODE[key],
      trackId: key,
      preview: tpl,
    }));
  });

  protected readonly statesCols = computed(() => {
    dict();
    return {
      state: t('states.cols.state'),
      trigger: t('states.cols.trigger'),
      behavior: t('states.cols.behavior'),
    };
  });

  protected readonly stateItems = computed(() => {
    dict();
    return ['closed', 'open', 'controlled'].map((k) => ({
      label: t(`states.${k}.label`),
      trigger: toPlainText(t(`states.${k}.trigger`)),
      behavior: toPlainText(t(`states.${k}.behavior`)),
    }));
  });

  protected readonly propTables = computed(() => {
    dict();
    const cols = {
      prop: t('props.table.prop'),
      type: t('props.table.type'),
      default: t('props.table.default'),
      required: t('props.table.required'),
      description: t('props.table.description'),
    };
    const not = tNav('common.no');
    return [
      {
        title: 'nds-drawer',
        cols,
        items: [
          {
            name: 'open',
            type: 'model<boolean>',
            defaultValue: 'false',
            required: not,
            description: toPlainText(t('props.table.open.description')),
          },
          {
            name: 'defaultOpen',
            type: t('props.table.defaultOpen.type'),
            defaultValue: t('props.table.defaultOpen.default'),
            required: not,
            description: toPlainText(t('props.table.defaultOpen.description')),
          },
          {
            // A linha `onOpenChange` do conteúdo compartilhado descreve o
            // callback de mudança; aqui ele é o output `openChange`, o que
            // também habilita a forma de duas vias `[(open)]`.
            name: 'openChange',
            type: 'output<boolean>',
            defaultValue: '—',
            required: not,
            description: toPlainText(t('props.table.onOpenChange.description')),
          },
          {
            name: 'direction',
            type: t('props.table.direction.type'),
            defaultValue: t('props.table.direction.default'),
            required: not,
            description: toPlainText(t('props.table.direction.description')),
          },
          {
            name: 'modal',
            type: t('props.table.modal.type'),
            defaultValue: t('props.table.modal.default'),
            required: not,
            description: toPlainText(t('props.table.modal.description')),
          },
          {
            // O conteúdo compartilhado chama de `dismissible`; aqui a prop é o
            // seu inverso e não alcança o Escape — ver a descrição ajustada.
            name: 'disablePointerDismissal',
            type: t('props.table.dismissible.type'),
            defaultValue: 'false',
            required: not,
            description: toPlainText(t('props.table.dismissible.description')),
          },
        ],
      },
      {
        title: 'ng-template[ndsDrawerContent]',
        cols,
        items: [
          {
            // O painel é construído dentro do portal: sem este input não há
            // elemento onde quem consome pudesse escrever uma classe.
            name: 'panelClass',
            type: 'string',
            defaultValue: '—',
            required: not,
            description: toPlainText(t('props.table.panelClass.description')),
          },
        ],
      },
    ];
  });

  protected readonly tokensCols = computed(() => {
    dict();
    return {
      token: t('tokens.table.token'),
      value: t('tokens.table.class'),
      description: t('tokens.table.part'),
    };
  });

  protected readonly tokenItems = computed(() => {
    dict();
    // A coluna do meio leva a classe .nds-* REAL. O conteúdo compartilhado
    // guardava utilitário da era Tailwind aqui e passou a guardar a mesma
    // classe — a lista continua explícita porque o TOKEN de cada linha não
    // mora no JSON.
    return [
      { token: '--background',       className: 'nds-drawer-content',  k: 'background' },
      { token: '--foreground',       className: 'nds-drawer-content',  k: 'foreground' },
      { token: '--border',           className: 'nds-drawer-content',  k: 'border'     },
      { token: '--z-modal-backdrop', className: 'nds-sheet-overlay',   k: 'overlay'    },
      { token: '--muted',            className: 'nds-drawer-handle',   k: 'handle'     },
      { token: '--radius-xl',        className: 'nds-drawer-content',  k: 'rounded'    },
    ].map(({ token, className, k }) => ({
      token,
      value: className,
      description: toPlainText(t(`tokens.table.${k}.part`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    const d = dict();
    return itemsFromDict(d, 'accessibility.items');
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    // `accessibility.keyboard.swipe` fica de fora: não é tecla, e neste stack
    // não há gesto de arrastar — a linha viraria promessa vazia na tabela.
    return [
      { key: 'Tab / Shift+Tab', description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'Escape',          description: toPlainText(t('accessibility.keyboard.escape')) },
      { key: 'Enter / Space',   description: toPlainText(t('accessibility.keyboard.enter')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    const byLocale = drawerTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >;
    const block = byLocale[locale]?.accessibility?.screenReader ?? {};
    // `title` é o cabeçalho da seção, não uma linha da lista.
    return Object.entries(block).filter(([k]) => k !== 'title').map(([, v]) => v);
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { k: 'sheet',       path: '?path=/docs/primitives-overlay-sheet--docs'       },
      { k: 'dialog',      path: '?path=/docs/primitives-overlay-dialog--docs'      },
      { k: 'alertDialog', path: '?path=/docs/primitives-overlay-alertdialog--docs' },
      { k: 'sidebar',     path: '?path=/docs/primitives-layout-sidebar--docs'     },
    ].map(({ k, path }) => ({
      name: t(`related.items.${k}.name`),
      description: toPlainText(t(`related.items.${k}.description`)),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    const d = dict();
    return itemsFromDict(d, 'notes').map((content) => ({ title: '', content }));
  });

  protected readonly analyticsCols = computed(() => {
    dict();
    return {
      event: tNav('common.event'),
      trigger: tNav('common.eventTrigger'),
      payload: tNav('common.payload'),
    };
  });

  protected readonly analyticsItems = computed(() => {
    dict();
    // O conteúdo compartilhado do Drawer não tem tabela de eventos, só a
    // descrição — e é ela que diz quais são e o que carregam. Os dois primeiros
    // saem desta página de verdade, pelos painéis da demonstração.
    return [
      {
        event: 'drawer_open',
        trigger: toPlainText(t('states.open.trigger')),
        payload: 'component, label, location',
      },
      {
        event: 'drawer_close',
        trigger: toPlainText(t('accessibility.keyboard.escape')),
        payload: 'component, label, reason, location',
      },
      {
        event: 'docs_page_view',
        trigger: toPlainText(t('analytics.description')),
        payload: 'component_name, locale, page_title',
      },
    ];
  });

  protected readonly testesFunctional = computed(() => {
    const d = dict();
    return {
      title: t('testes.functional.title'),
      description: t('testes.functional.description'),
      cols: {
        action: tNav('common.userAction'),
        result: tNav('common.expectedResult'),
        priority: tNav('common.priority'),
      },
      items: rowsFromDict(d, 'testes.functional', ['action', 'result', 'priority']).map((r) => ({
        action: toPlainText(r.action),
        result: toPlainText(r.result),
        priority: priorityLabel(r.priority),
      })),
    };
  });

  /**
   * `testes.accessibility` deste componente é uma LISTA de frases, não uma
   * tabela de critério/nível/verificação — a forma varia entre componentes. O
   * critério é a frase; o nível é o critério da WCAG que ela cobre; a coluna de
   * verificação leva a ferramenta que fecha o portão, que é nome próprio e não
   * precisa de tradução.
   */
  protected readonly testesAccessibility = computed(() => {
    const d = dict();
    const LEVEL: Record<number, { level: string; how: string }> = {
      1: { level: '—',     how: 'axe-core (addon-a11y)' },
      2: { level: '4.1.2', how: 'Storybook Test' },
      3: { level: '4.1.2', how: 'Storybook Test' },
      4: { level: '2.1.1', how: 'Storybook Test' },
      5: { level: '2.4.3', how: 'Storybook Test' },
      6: { level: '1.4.3', how: 'axe-core (color-contrast)' },
    };
    const frases = itemsFromDict(d, 'testes.accessibility');
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      items: frases.map((frase, i) => ({
        criterion: toPlainText(frase),
        level: LEVEL[i + 1]?.level ?? '—',
        how: LEVEL[i + 1]?.how ?? 'Storybook Test',
      })),
    };
  });

  protected readonly testesVisual = computed(() => {
    const d = dict();
    return {
      title: t('testes.visual.title'),
      description: t('testes.visual.description'),
      cols: { story: tNav('common.storyState'), priority: tNav('common.priority') },
      items: rowsFromDict(d, 'testes.visual', ['story', 'priority']).map((r) => ({
        story: toPlainText(r.story),
        priority: priorityLabel(r.priority),
      })),
    };
  });

  private observer: { disconnect: () => void } | undefined;

  constructor() {
    effect((onCleanup) => {
      dict();
      const locale = getLocale();
      const cleanup = applySeo({
        title: t('seo.title'),
        description: t('seo.description'),
        locale,
        componentSlug: 'drawer',
        aiSummary: t('seo.aiSummary'),
        aiEntities: t('seo.aiEntities'),
      });
      track('docs_page_view', {
        component_name: 'drawer',
        locale,
        page_title: `${t('title')} · Design System`,
      });
      onCleanup(cleanup);
    });
  }

  ngAfterViewInit(): void {
    this.observer = createActiveSectionObserver(
      [...SECTION_IDS],
      (id) => document.getElementById(id),
      (id) => this.activeSection.set(id),
      (id) =>
        track('docs_section_viewed', {
          component_name: 'drawer',
          section_id: id,
          locale: getLocale(),
        }),
    );
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

/** `base.item1`, `base.item2`, … enquanto existirem — nunca contados à mão. */
function itemsFromDict(d: Record<string, string>, base: string): string[] {
  const out: string[] = [];
  for (let i = 1; d[`${base}.item${i}`] !== undefined; i++) out.push(d[`${base}.item${i}`]);
  return out;
}

/** Mesma varredura, para itens que são objeto com campos fixos. */
function rowsFromDict<K extends string>(
  d: Record<string, string>,
  base: string,
  fields: readonly K[],
): Record<K, string>[] {
  const rows: Record<K, string>[] = [];
  for (let i = 1; ; i++) {
    if (d[`${base}.item${i}.${fields[0]}`] === undefined) break;
    const row = {} as Record<K, string>;
    for (const f of fields) row[f] = d[`${base}.item${i}.${f}`] ?? '';
    rows.push(row);
  }
  return rows;
}
