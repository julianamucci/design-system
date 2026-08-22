import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  OnDestroy,
  signal,
  TemplateRef,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import type { RdxDialogOpenChange } from '@radix-ng/primitives/dialog';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { stripHtml, toPlainText } from '@/lib/strip-html';
import { NDS_DIALOG } from '@/components/ui/dialog';
import { NdsButton } from '@/components/ui/button';
import { NdsInput } from '@/components/ui/input';
import { NdsLabel } from '@/components/ui/label';
import { NdsAspectRatio } from '@/components/ui/aspect-ratio';
import uiTranslations from '@/i18n/ui.json';
import dialogTranslations from '@shared/content/dialog/translations.json';

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
import type { DocsVariantItem } from '@/components/docs/shared/sections';

const { t: tNav } = useTranslation(uiTranslations as Record<string, unknown>);

// Overrides de call site, não conteúdo novo no JSON compartilhado.
//
// Duas famílias de chave entram por aqui, sempre nos três idiomas para a página
// não virar bilíngue:
//
//   · props que só existem neste stack — o conteúdo compartilhado descreve a
//     API do Base UI, onde a rolagem é um subcomponente e o rótulo do botão de
//     fechar é filho JSX. Aqui as duas são inputs, e prop sem descrição é API
//     invisível;
//   · rótulos dos exemplos que o conteúdo não tem (nomes de campo, o exemplo
//     negativo destrutivo, o `alt` da capa) e que, escritos direto no template,
//     ficariam em português nas três versões da página.
//
// `import.withScroll` é substituição, não acréscimo: o texto original diz
// "(Vue)", e nomear outro stack numa página que é lida sozinha vaza contexto.
const { t, dict } = useTranslation(dialogTranslations as Record<string, unknown>, {
  'pt-BR': {
    'demonstration.labels.close': 'Fechar',
    'demonstration.labels.fieldName': 'Nome',
    'demonstration.labels.fieldEmail': 'E-mail',
    'demonstration.labels.destructiveTitle': 'Excluir conta',
    'demonstration.labels.destructiveDescription':
      'A conta e todo o histórico são apagados. Não há como desfazer.',
    'demonstration.labels.coverAlt': 'Padrão geométrico em tons de cinza',
    'import.withScroll': 'No componente que compõe:',
    'props.table.modal':
      'Trava a rolagem da página e torna o restante do documento inerte enquanto aberto.',
    'props.table.closeLabel':
      'Nome acessível do botão de fechar. Vai como texto para leitor de tela, não como atributo.',
    'props.table.scroll':
      'Passa a rolagem para o fundo e tira o painel do centro fixo. Vai no Overlay e no Content, sempre nos dois.',
    'props.table.escapeKeyDown':
      'Emitido antes do fechamento por Escape. Permite cancelar o fechamento.',
    'props.table.pointerDownOutside':
      'Emitido antes do fechamento por clique fora. Permite cancelar o fechamento.',
  },
  en: {
    'demonstration.labels.close': 'Close',
    'demonstration.labels.fieldName': 'Name',
    'demonstration.labels.fieldEmail': 'Email',
    'demonstration.labels.destructiveTitle': 'Delete account',
    'demonstration.labels.destructiveDescription':
      'The account and all history are erased. This cannot be undone.',
    'demonstration.labels.coverAlt': 'Geometric pattern in shades of grey',
    'import.withScroll': 'In the composing component:',
    'props.table.modal':
      'Locks page scrolling and makes the rest of the document inert while open.',
    'props.table.closeLabel':
      'Accessible name of the close button. Rendered as screen-reader text, not as an attribute.',
    'props.table.scroll':
      'Moves scrolling to the backdrop and takes the panel out of fixed centering. Goes on both Overlay and Content.',
    'props.table.escapeKeyDown':
      'Emitted before closing via Escape. Allows cancelling the dismissal.',
    'props.table.pointerDownOutside':
      'Emitted before closing via outside click. Allows cancelling the dismissal.',
  },
  es: {
    'demonstration.labels.close': 'Cerrar',
    'demonstration.labels.fieldName': 'Nombre',
    'demonstration.labels.fieldEmail': 'Correo electrónico',
    'demonstration.labels.destructiveTitle': 'Eliminar cuenta',
    'demonstration.labels.destructiveDescription':
      'La cuenta y todo el historial se borran. No se puede deshacer.',
    'demonstration.labels.coverAlt': 'Patrón geométrico en tonos de gris',
    'import.withScroll': 'En el componente que compone:',
    'props.table.modal':
      'Bloquea el desplazamiento de la página y vuelve inerte el resto del documento mientras está abierto.',
    'props.table.closeLabel':
      'Nombre accesible del botón de cerrar. Se renderiza como texto para lector de pantalla, no como atributo.',
    'props.table.scroll':
      'Pasa el desplazamiento al fondo y saca el panel del centrado fijo. Va en el Overlay y en el Content, siempre en ambos.',
    'props.table.escapeKeyDown':
      'Se emite antes del cierre por Escape. Permite cancelar el cierre.',
    'props.table.pointerDownOutside':
      'Se emite antes del cierre por clic fuera. Permite cancelar el cierre.',
  },
});

const SECTION_IDS = [
  'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
  'importacao', 'variantes', 'composicoes', 'estados', 'propriedades', 'tokens',
  'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
] as const;

// Os rótulos de navegação saem do `ui.json`, e não do conteúdo do componente:
// são os mesmos em todas as docs pages, e centralizá-los evita que a troca de
// idioma dependa de cada `translations.json` ter a chave.
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

// A variante `angular` de `anatomy.structureCode` no conteúdo compartilhado
// descreve um elemento `<nds-dialog>` e um `<ng-template ndsDialogContent>` que
// este stack não tem. A raiz é diretiva de ATRIBUTO num `<div>` — para o markup
// bater com o do Vanilla — e o portal precisa ser o `<ng-template>`, porque o
// diálogo tem DOIS nós raiz (overlay e painel) e o primitivo só teleporta os
// dois pela forma estrutural. Enquanto o conteúdo não for corrigido, a
// estrutura mostrada aqui é a que compila.
const ANATOMY_CODE = `<div ndsDialog>
  <button ndsDialogTrigger ndsButton variant="outline">Editar perfil</button>

  <ng-template ndsDialogPortal>
    <div ndsDialogOverlay></div>

    <div ndsDialogContent closeLabel="Fechar">
      <div ndsDialogHeader>
        <h2 ndsDialogTitle>Editar perfil</h2>
        <p ndsDialogDescription>Atualize suas informações pessoais.</p>
      </div>

      <div ndsDialogBody><!-- campos --></div>

      <div ndsDialogFooter>
        <button ndsDialogClose ndsButton variant="outline">Cancelar</button>
        <button ndsButton>Salvar alterações</button>
      </div>
    </div>
  </ng-template>
</div>`;

const IMPORT_CODE = `import { NDS_DIALOG } from '@/components/ui/dialog';

// ou, peça a peça:
import {
  NdsDialog,
  NdsDialogTrigger,
  NdsDialogPortal,
  NdsDialogOverlay,
  NdsDialogContent,
  NdsDialogHeader,
  NdsDialogTitle,
  NdsDialogDescription,
  NdsDialogBody,
  NdsDialogFooter,
  NdsDialogClose,
} from '@/components/ui/dialog';`;

const IMPORT_CODE_BUTTON = `import { NDS_DIALOG } from '@/components/ui/dialog';
import { NdsButton } from '@/components/ui/button';

@Component({
  imports: [...NDS_DIALOG, NdsButton],
})
export class Exemplo {}`;

const INTERFACE_CODE = `// A família compõe os primitivos do Radix NG. Só duas peças têm template.
@Directive({
  selector: 'div[ndsDialog]',
  hostDirectives: [
    { directive: RdxDialogRoot,
      inputs:  ['open', 'defaultOpen', 'modal'],
      outputs: ['openChange', 'onOpenChange', 'onOpenChangeComplete'] },
  ],
})
export class NdsDialog {}

@Directive({
  selector: 'ng-template[ndsDialogPortal]',
  hostDirectives: [{ directive: RdxDialogPortal, inputs: ['container'] }],
})
export class NdsDialogPortal {}

@Component({
  selector: 'div[ndsDialogContent]',
  hostDirectives: [
    // escapeKeyDown / pointerDownOutside — cancelam o fechamento
    { directive: RdxDialogPopup,
      outputs: ['escapeKeyDown', 'pointerDownOutside', 'focusOutside',
                'interactOutside', 'openAutoFocus', 'closeAutoFocus'] },
  ],
})
export class NdsDialogContent {
  readonly showCloseButton = input(true, { transform: booleanAttribute });
  readonly closeLabel = input('Fechar');
  readonly scroll = input(false, { transform: booleanAttribute });
}`;

// `props.extensibility` do conteúdo compartilhado ensina `className` e o
// repasse de props do popup — nenhum dos dois existe aqui: o Angular já mescla
// a classe escrita no elemento, e o que se repassa são OUTPUTS. A
// extensibilidade real deste stack é cancelar um fechamento.
const EXTENSIBILITY_CODE = `<!-- A classe escrita aqui convive com a que o componente declara —
     não existe input \`class\` neste stack. -->
<div
  ndsDialogContent
  class="nds-max-w-md"
  (escapeKeyDown)="$event.preventDefault()"
  (pointerDownOutside)="protegerRascunho($event)"
>
  <!-- … -->
</div>`;

const TOKENS_CODE = `/* Tokens que o overlay e o painel consomem */
:root {
  --popover: 0 0% 100%;        /* fundo do painel */
  --popover-foreground: 0 0% 4%;
  --muted: 210 40% 96%;        /* fundo do rodapé, com 50% de opacidade */
  --border: 214 32% 91%;       /* separador acima do rodapé */
  --radius-card: 0.75rem;      /* a família dialog usa o raio do Card */
  --z-modal-backdrop: 1040;    /* overlay */
  --z-modal: 1050;             /* painel, sempre acima do overlay */
  --duration-base: 200ms;      /* entrada; a saída usa --duration-fast */
}

/* Sob prefers-reduced-motion o CSS compartilhado zera a animação das duas
   peças — não há o que configurar aqui. */`;

const VARIANT_CODE = {
  default: `<div ndsDialog>
  <button ndsDialogTrigger ndsButton variant="outline">Editar perfil</button>

  <ng-template ndsDialogPortal>
    <div ndsDialogOverlay></div>

    <div ndsDialogContent closeLabel="Fechar">
      <div ndsDialogHeader>
        <h2 ndsDialogTitle>Editar perfil</h2>
        <p ndsDialogDescription>Atualize suas informações pessoais.</p>
      </div>

      <div ndsDialogFooter>
        <button ndsDialogClose ndsButton variant="outline">Cancelar</button>
        <button ndsButton>Salvar alterações</button>
      </div>
    </div>
  </ng-template>
</div>`,

  withForm: `<div ndsDialogBody class="nds-stack" data-spacing="md">
  <div class="nds-stack" data-spacing="xs">
    <label ndsLabel for="perfil-nome">Nome</label>
    <input ndsInput id="perfil-nome" name="nome" />
  </div>

  <div class="nds-stack" data-spacing="xs">
    <label ndsLabel for="perfil-email">E-mail</label>
    <input ndsInput id="perfil-email" name="email" type="email" />
  </div>
</div>

<div ndsDialogFooter>
  <button ndsDialogClose ndsButton variant="outline">Cancelar</button>
  <button ndsButton type="submit">Salvar alterações</button>
</div>`,

  withScrollContent: `<!-- scroll vai nos DOIS: quem rola é o overlay, e o painel
     precisa sair do centro fixo para entrar no fluxo dele. -->
<ng-template ndsDialogPortal>
  <div ndsDialogOverlay [scroll]="true"></div>

  <div ndsDialogContent [scroll]="true" closeLabel="Fechar">
    <div ndsDialogHeader>
      <h2 ndsDialogTitle>Termos de uso</h2>
      <p ndsDialogDescription>Leia antes de aceitar.</p>
    </div>

    <div ndsDialogBody class="nds-stack" data-spacing="sm">
      <!-- conteúdo longo -->
    </div>
  </div>
</ng-template>`,

  noFooter: `<div ndsDialogContent closeLabel="Fechar">
  <div ndsDialogHeader>
    <h2 ndsDialogTitle>Detalhes do pedido</h2>
    <p ndsDialogDescription>Pedido 1042, entregue em 12 de março.</p>
  </div>
</div>`,

  withDestructiveAction: `<div ndsDialogFooter>
  <button ndsDialogClose ndsButton variant="outline">Cancelar</button>
  <button ndsButton variant="destructive">Remover item</button>
</div>`,

  customCloseInFooter: `<div ndsDialogContent [showCloseButton]="false">
  <div ndsDialogHeader>
    <h2 ndsDialogTitle>Editar perfil</h2>
    <p ndsDialogDescription>Atualize suas informações pessoais.</p>
  </div>

  <div ndsDialogFooter [showCloseButton]="true" closeLabel="Fechar">
    <button ndsButton>Salvar alterações</button>
  </div>
</div>`,

  confirmEmail: `<div ndsDialogContent closeLabel="Fechar">
  <div ndsDialogHeader>
    <h2 ndsDialogTitle>Enviar convite</h2>
    <p ndsDialogDescription>O convite vai para ana@exemplo.com.</p>
  </div>

  <div ndsDialogFooter>
    <button ndsDialogClose ndsButton variant="outline">Cancelar</button>
    <button ndsButton>Enviar convite</button>
  </div>
</div>`,
};

const COMPOSITION_CODE = {
  mediaPreview: `<div ndsDialogContent closeLabel="Fechar">
  <div ndsDialogHeader>
    <h2 ndsDialogTitle>Capa do artigo</h2>
    <p ndsDialogDescription>Padrão geométrico em tons de cinza.</p>
  </div>

  <div ndsDialogBody>
    <div ndsAspectRatio [ratio]="16 / 9">
      <img src="/capa.svg" alt="Padrão geométrico em tons de cinza" />
    </div>
  </div>
</div>`,
};

const IMG_CAPA =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect width='800' height='450' fill='%23cbd5e1'/%3E%3C/svg%3E";

/** Razões do primitivo mapeadas para o vocabulário estável do GA4. */
const MOTIVO: Record<string, 'escape' | 'overlay' | 'close-button' | 'action'> = {
  'escape-key': 'escape',
  'outside-press': 'overlay',
  'focus-out': 'overlay',
  'close-press': 'close-button',
};

@Component({
  selector: 'nds-dialog-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    ...NDS_DIALOG, NdsButton, NdsInput, NdsLabel, NdsAspectRatio,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsCompositions, NdsDocsStates, NdsDocsProps, NdsDocsTokens,
    NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics,
    NdsDocsTestes,
  ],
  template: `
    <!-- Todos os exemplos nascem FECHADOS: um diálogo modal aberto dentro de um
         card de preview cobriria a página inteira e tornaria o resto da
         documentação inalcançável. O que o card mostra é o gatilho. -->

    <ng-template #tplDoDont1Do>
      <div ndsDialog>
        <button ndsDialogTrigger ndsButton variant="outline">{{ t('demonstration.labels.triggerLabel') }}</button>
        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>
          <div ndsDialogContent [closeLabel]="t('demonstration.labels.close')">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>{{ t('demonstration.labels.title') }}</h2>
              <p ndsDialogDescription>{{ t('demonstration.labels.description') }}</p>
            </div>
            <div ndsDialogFooter>
              <button ndsDialogClose ndsButton variant="outline">{{ t('demonstration.labels.cancel') }}</button>
              <button ndsButton>{{ t('demonstration.labels.action') }}</button>
            </div>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplDoDont1Dont>
      <!-- Título genérico, descrição que não orienta e botão "OK": nada aqui
           diz o que vai acontecer ao confirmar. -->
      <div ndsDialog>
        <button ndsDialogTrigger ndsButton variant="outline">{{ rotuloGenerico() }}</button>
        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>
          <div ndsDialogContent [closeLabel]="t('demonstration.labels.close')">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>{{ rotuloGenerico() }}</h2>
              <p ndsDialogDescription>{{ descricaoVaga() }}</p>
            </div>
            <div ndsDialogFooter>
              <button ndsDialogClose ndsButton variant="outline">{{ t('demonstration.labels.cancel') }}</button>
              <button ndsButton>OK</button>
            </div>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <div ndsDialog>
        <button ndsDialogTrigger ndsButton variant="outline">{{ t('demonstration.labels.triggerLabel') }}</button>
        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>
          <div ndsDialogContent [closeLabel]="t('demonstration.labels.close')">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>{{ t('demonstration.labels.title') }}</h2>
              <p ndsDialogDescription>{{ t('demonstration.labels.description') }}</p>
            </div>
            <div ndsDialogFooter>
              <button ndsDialogClose ndsButton variant="outline">{{ t('demonstration.labels.cancel') }}</button>
              <button ndsButton>{{ t('demonstration.labels.action') }}</button>
            </div>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplDoDont2Dont>
      <!-- Confirmação destrutiva num Dialog: o leitor de tela anuncia
           "diálogo" e não "alerta", e o foco inicial cai no primeiro focável em
           vez de no Cancelar. -->
      <div ndsDialog>
        <button ndsDialogTrigger ndsButton variant="destructive">{{ t('demonstration.labels.destructiveTitle') }}</button>
        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>
          <div ndsDialogContent [closeLabel]="t('demonstration.labels.close')">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>{{ t('demonstration.labels.destructiveTitle') }}</h2>
              <p ndsDialogDescription>{{ t('demonstration.labels.destructiveDescription') }}</p>
            </div>
            <div ndsDialogFooter>
              <button ndsDialogClose ndsButton variant="outline">{{ t('demonstration.labels.cancel') }}</button>
              <button ndsButton variant="destructive">{{ t('demonstration.labels.destructiveTitle') }}</button>
            </div>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplVarDefault>
      <div ndsDialog>
        <button ndsDialogTrigger ndsButton variant="outline">{{ t('demonstration.labels.triggerLabel') }}</button>
        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>
          <div ndsDialogContent [closeLabel]="t('demonstration.labels.close')">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>{{ t('demonstration.labels.title') }}</h2>
              <p ndsDialogDescription>{{ t('demonstration.labels.description') }}</p>
            </div>
            <div ndsDialogFooter>
              <button ndsDialogClose ndsButton variant="outline">{{ t('demonstration.labels.cancel') }}</button>
              <button ndsButton>{{ t('demonstration.labels.action') }}</button>
            </div>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplVarWithForm>
      <div ndsDialog>
        <button ndsDialogTrigger ndsButton variant="outline">{{ t('demonstration.labels.triggerLabel') }}</button>
        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>
          <div ndsDialogContent [closeLabel]="t('demonstration.labels.close')">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>{{ t('demonstration.labels.title') }}</h2>
              <p ndsDialogDescription>{{ t('demonstration.labels.description') }}</p>
            </div>
            <div ndsDialogBody class="nds-stack" data-spacing="md">
              @for (campo of camposDoFormulario(); track campo.id) {
                <div class="nds-stack" data-spacing="xs">
                  <label ndsLabel [attr.for]="campo.id">{{ campo.rotulo }}</label>
                  <input ndsInput [id]="campo.id" [name]="campo.id" [value]="campo.valor" />
                </div>
              }
            </div>
            <div ndsDialogFooter>
              <button ndsDialogClose ndsButton variant="outline">{{ t('demonstration.labels.cancel') }}</button>
              <button ndsButton type="submit">{{ t('demonstration.labels.action') }}</button>
            </div>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplVarWithScrollContent>
      <div ndsDialog>
        <button ndsDialogTrigger ndsButton variant="outline">{{ t('demonstration.labels.triggerLabel') }}</button>
        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay [scroll]="true"></div>
          <div ndsDialogContent [scroll]="true" [closeLabel]="t('demonstration.labels.close')">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>{{ t('demonstration.labels.title') }}</h2>
              <p ndsDialogDescription>{{ t('demonstration.labels.description') }}</p>
            </div>
            <div ndsDialogBody class="nds-stack" data-spacing="sm">
              @for (linha of conteudoLongo(); track linha) {
                <p>{{ linha }}</p>
              }
            </div>
            <div ndsDialogFooter>
              <button ndsDialogClose ndsButton variant="outline">{{ t('demonstration.labels.cancel') }}</button>
              <button ndsButton>{{ t('demonstration.labels.action') }}</button>
            </div>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplVarNoFooter>
      <div ndsDialog>
        <button ndsDialogTrigger ndsButton variant="outline">{{ t('demonstration.labels.triggerLabel') }}</button>
        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>
          <div ndsDialogContent [closeLabel]="t('demonstration.labels.close')">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>{{ t('demonstration.labels.title') }}</h2>
              <p ndsDialogDescription>{{ t('demonstration.labels.description') }}</p>
            </div>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplVarWithDestructiveAction>
      <div ndsDialog>
        <button ndsDialogTrigger ndsButton variant="outline">{{ t('demonstration.labels.triggerLabel') }}</button>
        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>
          <div ndsDialogContent [closeLabel]="t('demonstration.labels.close')">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>{{ t('demonstration.labels.title') }}</h2>
              <p ndsDialogDescription>{{ t('demonstration.labels.description') }}</p>
            </div>
            <div ndsDialogFooter>
              <button ndsDialogClose ndsButton variant="outline">{{ t('demonstration.labels.cancel') }}</button>
              <button ndsButton variant="destructive">{{ t('demonstration.labels.action') }}</button>
            </div>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplVarCustomCloseInFooter>
      <div ndsDialog>
        <button ndsDialogTrigger ndsButton variant="outline">{{ t('demonstration.labels.triggerLabel') }}</button>
        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>
          <div ndsDialogContent [showCloseButton]="false">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>{{ t('demonstration.labels.title') }}</h2>
              <p ndsDialogDescription>{{ t('demonstration.labels.description') }}</p>
            </div>
            <div ndsDialogFooter [showCloseButton]="true" [closeLabel]="t('demonstration.labels.close')">
              <button ndsButton>{{ t('demonstration.labels.action') }}</button>
            </div>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplVarConfirmEmail>
      <div ndsDialog>
        <button ndsDialogTrigger ndsButton variant="outline">{{ t('variants.items.confirmEmail.name') }}</button>
        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>
          <div ndsDialogContent [closeLabel]="t('demonstration.labels.close')">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>{{ t('variants.items.confirmEmail.name') }}</h2>
              <p ndsDialogDescription>{{ t('variants.items.confirmEmail.use') }}</p>
            </div>
            <div ndsDialogFooter>
              <button ndsDialogClose ndsButton variant="outline">{{ t('demonstration.labels.cancel') }}</button>
              <button ndsButton>{{ t('variants.items.confirmEmail.name') }}</button>
            </div>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplCompMediaPreview>
      <div ndsDialog>
        <button ndsDialogTrigger ndsButton variant="outline">{{ t('variants.compositions.mediaPreview.name') }}</button>
        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>
          <div ndsDialogContent [closeLabel]="t('demonstration.labels.close')">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>{{ t('variants.compositions.mediaPreview.name') }}</h2>
              <p ndsDialogDescription>{{ t('demonstration.labels.coverAlt') }}</p>
            </div>
            <div ndsDialogBody>
              <div ndsAspectRatio [ratio]="16 / 9">
                <!-- A imagem carrega a informação do diálogo: alt vazio aqui
                     apagaria o conteúdo inteiro para quem usa leitor de tela. -->
                <img [src]="imgCapa" [alt]="t('demonstration.labels.coverAlt')" />
              </div>
            </div>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="dialog"
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
          <div ndsDialog (onOpenChange)="aoMudarNaDemo($event)">
            <button ndsDialogTrigger ndsButton variant="outline">
              {{ t('demonstration.labels.triggerLabel') }}
            </button>

            <ng-template ndsDialogPortal>
              <div ndsDialogOverlay></div>

              <div ndsDialogContent [closeLabel]="t('demonstration.labels.close')">
                <div ndsDialogHeader>
                  <h2 ndsDialogTitle>{{ t('demonstration.labels.title') }}</h2>
                  <p ndsDialogDescription>{{ t('demonstration.labels.description') }}</p>
                </div>

                <div ndsDialogBody class="nds-stack" data-spacing="md">
                  @for (campo of camposDoFormulario(); track campo.id) {
                    <div class="nds-stack" data-spacing="xs">
                      <label ndsLabel [attr.for]="'demo-' + campo.id">{{ campo.rotulo }}</label>
                      <input ndsInput [id]="'demo-' + campo.id" [name]="campo.id" [value]="campo.valor" />
                    </div>
                  }
                  <p class="nds-text-caption nds-text-muted-foreground">
                    {{ t('demonstration.labels.footerNote') }}
                  </p>
                </div>

                <div ndsDialogFooter>
                  <button ndsDialogClose ndsButton variant="outline">
                    {{ t('demonstration.labels.cancel') }}
                  </button>
                  <button ndsDialogClose ndsButton (click)="aoConfirmar()">
                    {{ t('demonstration.labels.action') }}
                  </button>
                </div>
              </div>
            </ng-template>
          </div>
        </nds-docs-demonstration>

        <nds-docs-anatomy
          [title]="t('anatomy.title')"
          [items]="anatomyItems()"
          [structureLabel]="t('anatomy.structureLabel')"
          [structureCode]="anatomyCode"
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
          [description]="t('import.basic')"
          [code]="importCode"
          [secondaryDescription]="t('import.withScroll')"
          [secondaryCode]="importCodeButton"
          componentSlug="dialog"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [note]="t('variants.note')"
          [items]="variantItems()"
          componentSlug="dialog"
          id="variantes"
          language="html"
        />

        <nds-docs-compositions
          [title]="t('variants.compositionsTitle')"
          [items]="compositionItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="dialog"
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
          [keyboardTitle]="t('accessibility.keyboardTitle')"
          [keyboardItems]="keyboardItems()"
          [screenReaderTitle]="tNav('common.screenReader')"
          [screenReaderItems]="screenReaderItems()"
        />

        <nds-docs-related
          [title]="t('related.title')"
          [items]="relatedItems()"
          componentSlug="dialog"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="dialog"
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
export class NdsDialogDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly anatomyCode = ANATOMY_CODE;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly extensibilityCode = EXTENSIBILITY_CODE;
  protected readonly importCode = IMPORT_CODE;
  protected readonly importCodeButton = IMPORT_CODE_BUTTON;
  protected readonly tokensCode = TOKENS_CODE;
  protected readonly imgCapa = IMG_CAPA;

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarDefault = viewChild.required<TemplateRef<unknown>>('tplVarDefault');
  private readonly tplVarWithForm = viewChild.required<TemplateRef<unknown>>('tplVarWithForm');
  private readonly tplVarWithScrollContent =
    viewChild.required<TemplateRef<unknown>>('tplVarWithScrollContent');
  private readonly tplVarNoFooter = viewChild.required<TemplateRef<unknown>>('tplVarNoFooter');
  private readonly tplVarWithDestructiveAction =
    viewChild.required<TemplateRef<unknown>>('tplVarWithDestructiveAction');
  private readonly tplVarCustomCloseInFooter =
    viewChild.required<TemplateRef<unknown>>('tplVarCustomCloseInFooter');
  private readonly tplVarConfirmEmail =
    viewChild.required<TemplateRef<unknown>>('tplVarConfirmEmail');
  private readonly tplCompMediaPreview =
    viewChild.required<TemplateRef<unknown>>('tplCompMediaPreview');

  /**
   * Rótulo ruim do primeiro "don't": o exemplo negativo do próprio conteúdo,
   * sem as aspas com que ele é escrito. Derivar do texto traduzido evita
   * literal em português numa página trilíngue.
   */
  protected readonly rotuloGenerico = computed(() => {
    dict();
    return firstExemplo(t('usage.uxWriting.table.title.bad'));
  });

  /** Descrição vaga do mesmo "don't", pela mesma via. */
  protected readonly descricaoVaga = computed(() => {
    dict();
    return firstExemplo(t('usage.uxWriting.table.description.bad'));
  });

  /** Os dois campos do formulário de exemplo. */
  protected readonly camposDoFormulario = computed(() => {
    dict();
    return [
      { id: 'perfil-nome', rotulo: t('demonstration.labels.fieldName'), valor: 'Ana Ribeiro' },
      { id: 'perfil-email', rotulo: t('demonstration.labels.fieldEmail'), valor: 'ana@exemplo.com' },
    ];
  });

  /** Conteúdo longo do exemplo de rolagem — derivado, nunca contado à mão. */
  protected readonly conteudoLongo = computed(() => {
    dict();
    const base = t('demonstration.labels.description');
    return Array.from({ length: 10 }, (_, i) => `${i + 1}. ${base}`);
  });

  /**
   * Analytics da demonstração.
   *
   * Fica na docs page e não no primitivo: `track()` dentro de um componente de
   * UI é o que a regra `analytics_in_ui_primitive` proíbe — a instrumentação
   * pertence a quem consome.
   */
  protected aoMudarNaDemo(evento: RdxDialogOpenChange): void {
    if (evento.open) {
      track('dialog_open', {
        component: 'dialog',
        // Valor estável, nunca o texto traduzido: o mesmo evento viraria três
        // valores no GA4, um por idioma.
        label: 'editar_perfil',
        location: 'docs_demo',
      });
      return;
    }
    track('dialog_close', {
      component: 'dialog',
      label: 'editar_perfil',
      // A ação primária fecha pelo mesmo caminho do botão X (é um
      // `ndsDialogClose`), então o motivo do primitivo diria "close-button".
      // A bandeira preserva a diferença que interessa ao funil: fechou porque
      // desistiu, ou porque concluiu.
      reason: this.confirmou ? 'action' : (MOTIVO[evento.reason] ?? 'action'),
      location: 'docs_demo',
    });
    this.confirmou = false;
  }

  /**
   * `(click)` de quem consome roda ANTES do listener de `host` da diretiva de
   * fechar (armadilha 10 do CLAUDE.md deste stack). É o que garante que a
   * bandeira já esteja de pé quando o fechamento dispara.
   */
  protected aoConfirmar(): void {
    this.confirmou = true;
    track('dialog_action', {
      component: 'dialog',
      action_label: 'salvar_alteracoes',
      location: 'docs_demo',
    });
  }

  private confirmou = false;

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: tNav(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: tNav(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => {
    const d = dict();
    return itemsList(d, 'anatomy');
  });

  protected readonly guidelines = computed(() => {
    const d = dict();
    return { title: t('usage.guidelines.title'), items: itemsList(d, 'usage.guidelines') };
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
      items: itemsFromDict(d, 'usage.scenarios', ['s', 'u', 'a']).map((r) => ({
        s: toPlainText(r.s),
        u: toPlainText(r.u),
        a: toPlainText(r.a),
      })),
    };
  });

  protected readonly uxWriting = computed(() => {
    dict();
    const chaves = ['title', 'description', 'action', 'cancel', 'srOnly'];
    return {
      title: t('usage.uxWriting.title'),
      cols: {
        element: t('usage.uxWriting.table.element'),
        rules: t('usage.uxWriting.table.rules'),
        do: t('usage.uxWriting.table.correct'),
        dont: t('usage.uxWriting.table.avoid'),
      },
      items: chaves.map((k) => ({
        element: toPlainText(t(`usage.uxWriting.table.${k}.name`)),
        rules: toPlainText(t(`usage.uxWriting.table.${k}.format`)),
        do: toPlainText(t(`usage.uxWriting.table.${k}.good`)),
        dont: toPlainText(t(`usage.uxWriting.table.${k}.bad`)),
      })),
    };
  });

  protected readonly usageDo = computed(() => {
    const d = dict();
    return { title: t('usage.do.title'), items: itemsList(d, 'usage.do') };
  });

  protected readonly usageDont = computed(() => {
    const d = dict();
    return { title: t('usage.dont.title'), items: itemsList(d, 'usage.dont') };
  });

  protected readonly doDontPairs = computed(() => {
    dict();
    const pares: [TemplateRef<unknown>, TemplateRef<unknown>][] = [
      [this.tplDoDont1Do(), this.tplDoDont1Dont()],
      [this.tplDoDont2Do(), this.tplDoDont2Dont()],
    ];
    return pares.map(([doTpl, dontTpl], i) => ({
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
    // O nome é a CHAVE, não a primeira frase: `customCloseInFooter` é descrito
    // como "showCloseButton={false} no Content e showCloseButton no Footer",
    // que vira um título ilegível. A chave é o identificador estável que também
    // aparece no snippet, e é o que as outras stacks mostram.
    const mapa: {
      key: keyof typeof VARIANT_CODE;
      tpl: TemplateRef<unknown>;
    }[] = [
      { key: 'default',               tpl: this.tplVarDefault()               },
      { key: 'withForm',              tpl: this.tplVarWithForm()              },
      { key: 'withScrollContent',     tpl: this.tplVarWithScrollContent()     },
      { key: 'noFooter',              tpl: this.tplVarNoFooter()              },
      { key: 'withDestructiveAction', tpl: this.tplVarWithDestructiveAction() },
      { key: 'customCloseInFooter',   tpl: this.tplVarCustomCloseInFooter()   },
    ];
    const itens: DocsVariantItem[] = mapa.map(({ key, tpl }) => ({
      name: key,
      description: stripHtml(t(`variants.items.${key}`)),
      code: VARIANT_CODE[key],
      trackId: key,
      preview: tpl,
    }));
    // `confirmEmail` é o único que traz nome e descrição próprios no conteúdo.
    itens.push({
      name: t('variants.items.confirmEmail.name'),
      description: stripHtml(t('variants.items.confirmEmail.description')),
      code: VARIANT_CODE.confirmEmail,
      trackId: 'confirmEmail',
      preview: this.tplVarConfirmEmail(),
    });
    return itens;
  });

  protected readonly compositionItems = computed(() => {
    dict();
    return [
      {
        name: t('variants.compositions.mediaPreview.name'),
        description: t('variants.compositions.mediaPreview.description'),
        useWhen: t('variants.compositions.mediaPreview.use'),
        code: COMPOSITION_CODE.mediaPreview,
        trackId: 'mediaPreview',
        preview: this.tplCompMediaPreview(),
      },
    ];
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
    return ['closed', 'opening', 'open', 'closing', 'withCloseButtonHidden'].map((k) => ({
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
    const nao = tNav('common.no');
    const sim = tNav('common.yes');
    return [
      {
        title: t('props.rootTitle'),
        cols,
        items: [
          {
            name: 'open',
            type: 'model<boolean>',
            defaultValue: 'false',
            required: nao,
            description: toPlainText(t('props.table.open')),
          },
          {
            name: 'defaultOpen',
            type: 'boolean',
            defaultValue: 'false',
            required: nao,
            description: toPlainText(t('props.table.defaultOpen')),
          },
          {
            // A linha `onOpenChange` do conteúdo compartilhado descreve o
            // callback de mudança; aqui ele é o output `openChange`, o que
            // também habilita a forma de duas vias `[(open)]`.
            name: 'openChange',
            type: 'output<boolean>',
            defaultValue: '—',
            required: nao,
            description: toPlainText(t('props.table.onOpenChange')),
          },
          {
            name: 'modal',
            type: "boolean | 'trap-focus'",
            defaultValue: 'true',
            required: nao,
            description: toPlainText(t('props.table.modal')),
          },
        ],
      },
      {
        title: t('props.contentTitle'),
        cols,
        items: [
          {
            name: 'showCloseButton',
            type: 'boolean',
            defaultValue: 'true',
            required: nao,
            description: toPlainText(t('props.table.showCloseButtonContent')),
          },
          {
            name: 'closeLabel',
            type: 'string',
            defaultValue: "'Fechar'",
            required: nao,
            description: toPlainText(t('props.table.closeLabel')),
          },
          {
            name: 'scroll',
            type: 'boolean',
            defaultValue: 'false',
            required: nao,
            description: toPlainText(t('props.table.scroll')),
          },
          {
            name: 'escapeKeyDown',
            type: 'output<KeyboardEvent>',
            defaultValue: '—',
            required: nao,
            description: toPlainText(t('props.table.escapeKeyDown')),
          },
          {
            name: 'pointerDownOutside',
            type: 'output<Event>',
            defaultValue: '—',
            required: nao,
            description: toPlainText(t('props.table.pointerDownOutside')),
          },
        ],
      },
      {
        title: t('props.footerTitle'),
        cols,
        items: [
          {
            name: 'showCloseButton',
            type: 'boolean',
            defaultValue: 'false',
            required: nao,
            description: toPlainText(t('props.table.showCloseButtonFooter')),
          },
          {
            name: 'closeLabel',
            type: 'string',
            defaultValue: "'Fechar'",
            required: nao,
            description: toPlainText(t('props.table.closeLabel')),
          },
        ],
      },
      {
        title: t('props.titleDescriptionTitle'),
        cols,
        items: [
          {
            // Não há prop `children` neste stack: título e descrição são
            // diretivas sobre os elementos que quem usa já escreveu, e o texto
            // é o conteúdo deles.
            name: 'ndsDialogTitle',
            type: '@Directive (h2 | h3)',
            defaultValue: '—',
            required: sim,
            description: toPlainText(t('anatomy.item7')),
          },
          {
            name: 'ndsDialogDescription',
            type: '@Directive (p)',
            defaultValue: '—',
            required: nao,
            description: toPlainText(t('anatomy.item8')),
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
    // Os tokens são os que a folha compartilhada realmente consome. O conteúdo
    // ainda descreve `z-index 50` e `--radius`, medidas da era Tailwind — a
    // folha usa `--z-modal-backdrop` / `--z-modal` e o raio do Card.
    return [
      { token: '--popover',            classe: 'nds-dialog-content',  k: 'popover'           },
      { token: '--popover-foreground', classe: 'nds-dialog-content',  k: 'popoverForeground' },
      { token: '--foreground',         classe: 'nds-dialog-content',  k: 'foreground'        },
      { token: '--muted',              classe: 'nds-dialog-footer',   k: 'muted'             },
      { token: '--border',             classe: 'nds-dialog-footer',   k: 'border'            },
      { token: '--radius-card',        classe: 'nds-dialog-content',  k: 'radius'            },
      { token: '--z-modal',            classe: 'nds-dialog-overlay',  k: 'zIndex'            },
      { token: '--duration-base',      classe: 'nds-dialog-content',  k: 'duration'          },
    ].map(({ token, classe, k }) => ({
      token,
      value: classe,
      description: toPlainText(t(`tokens.table.${k}`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    const d = dict();
    // Os itens narrativos primeiro, depois as quatro linhas de `aria`, que o
    // conteúdo guarda num bloco à parte e nenhuma outra seção consome.
    return [
      ...itemsList(d, 'accessibility'),
      ...['role', 'modal', 'labelledby', 'describedby'].map((k) => t(`aria.${k}`)),
    ];
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Escape',    description: toPlainText(t('keyboard.escape')) },
      { key: 'Tab',       description: toPlainText(t('keyboard.tab')) },
      { key: 'Shift+Tab', description: toPlainText(t('keyboard.shiftTab')) },
      { key: 'Enter',     description: toPlainText(t('keyboard.enter')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    const byLocale = dialogTranslations as unknown as Record<
      string,
      { screenReader?: Record<string, string> }
    >;
    const bloco = byLocale[locale]?.screenReader ?? {};
    // `title`, quando existe, é o cabeçalho da seção e não uma linha da lista.
    return Object.entries(bloco).filter(([k]) => k !== 'title').map(([, v]) => v);
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { name: 'AlertDialog', k: 'alertDialog', path: '?path=/docs/ui-alertdialog--docs' },
      { name: 'Sheet',       k: 'sheet',       path: '?path=/docs/ui-sheet--docs'       },
      { name: 'Popover',     k: 'popover',     path: '?path=/docs/ui-popover--docs'     },
      { name: 'Form',        k: 'form',        path: '?path=/docs/ui-form--docs'        },
      { name: 'Drawer',      k: 'drawer',      path: '?path=/docs/ui-drawer--docs'      },
    ].map(({ name, k, path }) => ({
      name,
      description: toPlainText(t(`related.${k}`)),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    // `tip1` e `tip3` do conteúdo compartilhado ensinam classes utilitárias
    // (`z-[60]`, `max-h-[80vh] overflow-y-auto`) que não existem neste sistema,
    // e `tip3` ainda nomeia outro stack. O que elas pedem já está resolvido: o
    // z-index sai de `--z-modal` e a rolagem é o par `scroll` do Overlay e do
    // Content.
    return [
      { title: '', content: t('notes.tip2') },
      { title: '', content: t('notes.tip4') },
    ];
  });

  protected readonly analyticsCols = computed(() => {
    dict();
    return {
      event: t('analytics.table.event'),
      trigger: t('analytics.table.trigger'),
      payload: t('analytics.table.payload'),
    };
  });

  protected readonly analyticsItems = computed(() => {
    dict();
    return ['open', 'close', 'action', 'pageView', 'sectionViewed', 'langSwitch'].map((k) => ({
      event: t(`analytics.table.${k}`),
      trigger: toPlainText(t(`analytics.table.${k}Trigger`)),
      payload: toPlainText(t(`analytics.table.${k}Payload`)),
    }));
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
      items: itemsFromDict(d, 'testes.functional', ['action', 'result', 'priority']).map((r) => ({
        action: toPlainText(r.action),
        result: toPlainText(r.result),
        priority: priorityLabel(r.priority),
      })),
    };
  });

  protected readonly testesAccessibility = computed(() => {
    const d = dict();
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      items: itemsFromDict(d, 'testes.accessibility', ['criterion', 'level', 'how']).map((r) => ({
        criterion: toPlainText(r.criterion),
        level: r.level,
        how: toPlainText(r.how),
      })),
    };
  });

  protected readonly testesVisual = computed(() => {
    const d = dict();
    return {
      title: t('testes.visual.title'),
      description: t('testes.visual.description'),
      cols: { story: tNav('common.storyState'), priority: tNav('common.priority') },
      items: itemsFromDict(d, 'testes.visual', ['story', 'priority']).map((r) => ({
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
        componentSlug: 'dialog',
        aiSummary: t('seo.aiSummary'),
        aiEntities: t('seo.aiEntities'),
      });
      track('docs_page_view', {
        component_name: 'dialog',
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
          component_name: 'dialog',
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

/**
 * O primeiro exemplo de uma lista entre aspas: `"Olá!", "Atenção"` → `Olá!`.
 *
 * O conteúdo guarda os exemplos de UX writing assim, e o "don't" da página
 * precisa de UM deles. Derivar mantém a página trilíngue sem literal aqui.
 */
function firstExemplo(bruto: string): string {
  const limpo = toPlainText(bruto);
  const entreAspas = limpo.match(/"([^"]+)"/);
  return entreAspas ? entreAspas[1] : limpo;
}

/**
 * `item1`, `item2`, … de um bloco, na ordem, até a primeira ausência.
 *
 * Contar à mão é o que faz um item novo no conteúdo compartilhado nunca
 * aparecer na página — e ninguém percebe, porque nada quebra.
 */
function itemsList(d: Record<string, string>, base: string): string[] {
  const itens: string[] = [];
  for (let i = 1; d[`${base}.item${i}`] !== undefined; i++) itens.push(d[`${base}.item${i}`]);
  return itens;
}

function itemsFromDict<K extends string>(
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
