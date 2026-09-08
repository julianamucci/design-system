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
//   · rótulos dos exemplos que o conteúdo compartilhado não tem — hoje a
//     descrição e o corpo da confirmação de e-mail, e o `alt` da capa — e que,
//     escritos direto no template, ficariam em português nas três versões da
//     página. Os dez que estavam aqui (o botão de fechar, os nomes de campo, o
//     contraexemplo vago, o exemplo negativo destrutivo e o trio de
//     remover-item) SUBIRAM para `demonstration.labels` e saíram desta lista:
//     override que repete o conteúdo compartilhado o sombreia, e a correção do
//     texto lá em cima deixaria de chegar aqui. O `coverAlt` fica, e o motivo
//     é medido: só esta stack renderiza um `<img>` de verdade na composição
//     de mídia, então o `alt` não é conteúdo comum às cinco.
//
//     O par do CONVITE (`inviteAction`/`inviteDescription`) saiu junto com o
//     cenário: a variante de confirmação convidava em vez de confirmar, e era
//     a única das cinco a fazê-lo. `confirmEmailTitle` e `confirmEmailAction`
//     existem no compartilhado e entraram no lugar; sobraram aqui só a
//     descrição e o corpo, que lá não têm chave.
//
// `import.withScroll` é substituição, não acréscimo: o texto original diz
// "(Vue)", e nomear outro stack numa página que é lida sozinha vaza contexto.
const { t, dict } = useTranslation(dialogTranslations as Record<string, unknown>, {
  'pt-BR': {
    'demonstration.labels.confirmEmailDescription':
      'Verifique o endereço antes de enviar o link de acesso.',
    'demonstration.labels.confirmEmailBody':
      'Vamos enviar um link para maria@exemplo.com. Confirme o endereço antes de prosseguir.',
    'demonstration.labels.coverAlt': 'Padrão geométrico em tons de cinza',
    'import.withScroll': 'No componente que compõe:',
    'props.table.modal':
      'Trava a rolagem da página e torna o restante do documento inerte enquanto aberto.',
    'props.table.closeLabel':
      'Nome acessível do botão de fechar. Vai como texto para leitor de tela, não como atributo.',
    'props.table.escapeKeyDown':
      'Emitido antes do fechamento por Escape. Permite cancelar o fechamento.',
    'props.table.pointerDownOutside':
      'Emitido antes do fechamento por clique fora. Permite cancelar o fechamento.',
  },
  en: {
    'demonstration.labels.confirmEmailDescription':
      'Check the address before sending the access link.',
    'demonstration.labels.confirmEmailBody':
      'We will send a link to maria@example.com. Confirm the address before continuing.',
    'demonstration.labels.coverAlt': 'Geometric pattern in shades of grey',
    'import.withScroll': 'In the composing component:',
    'props.table.modal':
      'Locks page scrolling and makes the rest of the document inert while open.',
    'props.table.closeLabel':
      'Accessible name of the close button. Rendered as screen-reader text, not as an attribute.',
    'props.table.escapeKeyDown':
      'Emitted before closing via Escape. Allows cancelling the dismissal.',
    'props.table.pointerDownOutside':
      'Emitted before closing via outside click. Allows cancelling the dismissal.',
  },
  es: {
    'demonstration.labels.confirmEmailDescription':
      'Verifica la dirección antes de enviar el enlace de acceso.',
    'demonstration.labels.confirmEmailBody':
      'Enviaremos un enlace a maria@ejemplo.com. Confirma la dirección antes de continuar.',
    'demonstration.labels.coverAlt': 'Patrón geométrico en tonos de gris',
    'import.withScroll': 'En el componente que compone:',
    'props.table.modal':
      'Bloquea el desplazamiento de la página y vuelve inerte el resto del documento mientras está abierto.',
    'props.table.closeLabel':
      'Nombre accesible del botón de cerrar. Se renderiza como texto para lector de pantalla, no como atributo.',
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

  withForm: `<!-- O form envolve o corpo E o rodapé: é o que faz o Enter em qualquer campo
     disparar a ação primária. Um type="submit" fora de form não submete nada. -->
<form (submit)="salvar($event)">
  <div ndsDialogBody class="nds-stack" data-spacing="md">
    <div class="nds-stack" data-spacing="xs">
      <label ndsLabel for="profile-name">Nome</label>
      <input ndsInput id="profile-name" name="name" />
    </div>

    <div class="nds-stack" data-spacing="xs">
      <label ndsLabel for="perfil-email">E-mail</label>
      <input ndsInput id="perfil-email" name="email" type="email" />
    </div>
  </div>

  <div ndsDialogFooter>
    <button ndsDialogClose ndsButton variant="outline">Cancelar</button>
    <button ndsButton type="submit">Salvar alterações</button>
  </div>
</form>`,

  withScrollContent: `<!-- Quem rola é o CORPO: o painel fica parado e centralizado, e cabeçalho e
     rodapé continuam visíveis. O teto e a barra vêm da classe de rolagem;
     tabindex, papel e nome vêm junto, senão a caixa só rola para quem tem
     ponteiro (WCAG 2.1.1). -->
<ng-template ndsDialogPortal>
  <div ndsDialogOverlay></div>

  <div ndsDialogContent closeLabel="Fechar">
    <div ndsDialogHeader>
      <h2 ndsDialogTitle>Termos de uso</h2>
      <p ndsDialogDescription>Leia atentamente antes de aceitar.</p>
    </div>

    <div
      ndsDialogBody
      class="nds-dialog-body-scroll nds-stack"
      data-spacing="sm"
      tabindex="0"
      role="group"
      aria-label="Termos de uso"
    >
      <!-- conteúdo longo -->
    </div>

    <div ndsDialogFooter>
      <button ndsDialogClose ndsButton variant="outline">Recusar</button>
      <button ndsButton>Aceitar</button>
    </div>
  </div>
</ng-template>`,

  noFooter: `<div ndsDialogContent closeLabel="Fechar">
  <div ndsDialogHeader>
    <h2 ndsDialogTitle>Sobre este recurso</h2>
    <p ndsDialogDescription>Detalhes técnicos exibidos para fins informativos. Sem ações.</p>
  </div>

  <!-- Sem rodapé, o corpo diz por onde se fecha. -->
  <div ndsDialogBody>
    <p>O fechamento ocorre via X, Escape ou clique no overlay.</p>
  </div>
</div>`,

  withDestructiveAction: `<div ndsDialogFooter>
  <button ndsDialogClose ndsButton variant="outline">Cancelar</button>
  <button ndsButton variant="destructive">Remover item</button>
</div>`,

  customCloseInFooter: `<div ndsDialogContent [showCloseButton]="false">
  <div ndsDialogHeader>
    <h2 ndsDialogTitle>Próximos passos</h2>
    <p ndsDialogDescription>Continue o fluxo ou volte ao início.</p>
  </div>

  <div ndsDialogBody>
    <p>O guia continua disponível no menu de ajuda.</p>
  </div>

  <!-- O fechar é a ação de MENOR ênfase das três, então abre a lista e vai de
       ghost; a primária fecha. O rodapé empilha ao contrário no estreito e
       alinha à direita no largo, e das duas leituras sai a primária em cima e
       à direita. Quem o emite é o [showCloseButton] do próprio rodapé. -->
  <div ndsDialogFooter [showCloseButton]="true">
    <button ndsButton variant="outline">Voltar</button>
    <button ndsButton>Continuar</button>
  </div>
</div>`,

  confirmEmail: `<div ndsDialogContent closeLabel="Fechar">
  <div ndsDialogHeader>
    <h2 ndsDialogTitle>Confirmar e-mail</h2>
    <p ndsDialogDescription>Verifique o endereço antes de enviar o link de acesso.</p>
  </div>

  <div ndsDialogBody>
    <p>Vamos enviar um link para maria@exemplo.com. Confirme o endereço antes de prosseguir.</p>
  </div>

  <div ndsDialogFooter>
    <button ndsDialogClose ndsButton variant="outline">Cancelar</button>
    <button ndsButton>Enviar link</button>
  </div>
</div>`,
};

const COMPOSITION_CODE = {
  profileEdit: `<div ndsDialogContent closeLabel="Fechar">
  <div ndsDialogHeader>
    <h2 ndsDialogTitle>Editar perfil</h2>
    <p ndsDialogDescription>Atualize suas informações pessoais.</p>
  </div>

  <!-- O rodapé fica DENTRO do form: é o que faz o Enter em qualquer campo
       disparar a ação primária. -->
  <form (submit)="$event.preventDefault()">
    <div ndsDialogBody class="nds-grid" data-spacing="md">
      <div class="nds-stack" data-spacing="sm">
        <label ndsLabel for="profile-name">Nome completo</label>
        <input ndsInput id="profile-name" name="name" value="Maria Silva" />
      </div>
    </div>

    <div ndsDialogFooter>
      <button ndsDialogClose ndsButton type="button" variant="outline">Cancelar</button>
      <button ndsButton type="submit">Salvar alterações</button>
    </div>
  </form>
</div>`,
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
      <div ndsDialog (onOpenChange)="aoMudarNoExemplo('par1_do', 'docs_do_dont', $event)">
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
           diz o que vai acontecer ao confirmar.

           Os textos são rótulos PRÓPRIOS deste contraexemplo, e não mais as
           células "bad" da tabela de UX Writing: aquelas existem para ser
           EXIBIDAS como contraexemplo dentro da tabela, e derivá-las por
           expressão regular para dentro de um componente vivo fazia a página
           renderizar de verdade o que a tabela ao lado condena — além de
           prender o rótulo à pontuação de uma string traduzida. -->
      <div ndsDialog (onOpenChange)="aoMudarNoExemplo('par1_dont', 'docs_do_dont', $event)">
        <button ndsDialogTrigger ndsButton variant="outline">{{ t('demonstration.labels.vagueTitle') }}</button>
        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>
          <div ndsDialogContent [closeLabel]="t('demonstration.labels.close')">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>{{ t('demonstration.labels.vagueTitle') }}</h2>
              <p ndsDialogDescription>{{ t('demonstration.labels.vagueDescription') }}</p>
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
      <div ndsDialog (onOpenChange)="aoMudarNoExemplo('par2_do', 'docs_do_dont', $event)">
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
      <div ndsDialog (onOpenChange)="aoMudarNoExemplo('par2_dont', 'docs_do_dont', $event)">
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
      <div ndsDialog (onOpenChange)="aoMudarNoExemplo('default', 'docs_variantes', $event)">
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
      <div ndsDialog (onOpenChange)="aoMudarNoExemplo('with_form', 'docs_variantes', $event)">
        <button ndsDialogTrigger ndsButton variant="outline">{{ t('demonstration.labels.triggerLabel') }}</button>
        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>
          <div ndsDialogContent [closeLabel]="t('demonstration.labels.close')">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>{{ t('demonstration.labels.title') }}</h2>
              <p ndsDialogDescription>{{ t('demonstration.labels.description') }}</p>
            </div>
            <!-- O form envolve o corpo E o rodapé: sem ele o type="submit" da
                 ação primária não submete nada, e o Enter num campo não faz
                 nada — numa variante cujo assunto É o formulário. -->
            <form (submit)="$event.preventDefault()">
              <div ndsDialogBody class="nds-stack" data-spacing="md">
                @for (field of camposDoFormulario(); track field.id) {
                  <div class="nds-stack" data-spacing="xs">
                    <label ndsLabel [attr.for]="field.id">{{ field.label }}</label>
                    <input ndsInput [id]="field.id" [name]="field.id" [value]="field.value" />
                  </div>
                }
              </div>
              <div ndsDialogFooter>
                <button ndsDialogClose ndsButton variant="outline">{{ t('demonstration.labels.cancel') }}</button>
                <button ndsButton type="submit">{{ t('demonstration.labels.action') }}</button>
              </div>
            </form>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplVarWithScrollContent>
      <div ndsDialog (onOpenChange)="aoMudarNoExemplo('with_scroll_content', 'docs_variantes', $event)">
        <button ndsDialogTrigger ndsButton variant="outline">{{ t('demonstration.labels.termsTitle') }}</button>
        <ng-template ndsDialogPortal>
          <!-- Quem rola é o CORPO: o painel fica parado e centralizado, e o
               cabeçalho e o rodapé continuam visíveis, que é o que o conteúdo
               compartilhado descreve como "Header e Footer fixos". -->
          <div ndsDialogOverlay></div>
          <div ndsDialogContent [closeLabel]="t('demonstration.labels.close')">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>{{ t('demonstration.labels.termsTitle') }}</h2>
              <p ndsDialogDescription>{{ t('demonstration.labels.termsDescription') }}</p>
            </div>
            <div
              ndsDialogBody
              class="nds-dialog-body-scroll nds-stack"
              data-spacing="sm"
              tabindex="0"
              role="group"
              [attr.aria-label]="t('demonstration.labels.termsTitle')"
            >
              @for (line of conteudoLongo(); track line) {
                <p>{{ line }}</p>
              }
            </div>
            <!-- "Recusar", e não "Cancelar": o par de um documento que se
                 aceita é aceitar/recusar, e é o rótulo que o vanilla — a
                 referência cross-stack — usa nesta mesma variante. -->
            <div ndsDialogFooter>
              <button ndsDialogClose ndsButton variant="outline">{{ t('demonstration.labels.decline') }}</button>
              <button ndsButton>{{ t('demonstration.labels.accept') }}</button>
            </div>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplVarNoFooter>
      <!-- O cenário é o painel INFORMATIVO, e ele vem do conteúdo compartilhado.
           Aqui a prévia mostrava "Editar perfil" — um painel de edição sem
           nenhuma ação para confirmar a edição, que é o contrário do que a
           composição ensina — e divergia das outras stacks. O corpo diz por
           onde se fecha, já que não há rodapé para dizê-lo. -->
      <div ndsDialog (onOpenChange)="aoMudarNoExemplo('no_footer', 'docs_variantes', $event)">
        <button ndsDialogTrigger ndsButton variant="outline">{{ t('demonstration.labels.aboutTitle') }}</button>
        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>
          <div ndsDialogContent [closeLabel]="t('demonstration.labels.close')">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>{{ t('demonstration.labels.aboutTitle') }}</h2>
              <p ndsDialogDescription>{{ t('demonstration.labels.aboutDescription') }}</p>
            </div>
            <div ndsDialogBody>
              <p>{{ t('demonstration.labels.aboutBody') }}</p>
            </div>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplVarWithDestructiveAction>
      <!-- A ação destrutiva é REMOVER, e o rótulo diz isso. "Salvar alterações"
           com a variante destructive pintava de perigo uma ação que não destrói
           nada, e contradizia o snippet ao lado, que já mostrava "Remover
           item". Destrutivo é para o que destrói. -->
      <div ndsDialog (onOpenChange)="aoMudarNoExemplo('with_destructive_action', 'docs_variantes', $event)">
        <button ndsDialogTrigger ndsButton variant="outline">{{ t('demonstration.labels.removeItemAction') }}</button>
        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>
          <div ndsDialogContent [closeLabel]="t('demonstration.labels.close')">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>{{ t('demonstration.labels.removeItemTitle') }}</h2>
              <p ndsDialogDescription>{{ t('demonstration.labels.removeItemDescription') }}</p>
            </div>
            <div ndsDialogFooter>
              <button ndsDialogClose ndsButton variant="outline">{{ t('demonstration.labels.cancel') }}</button>
              <button ndsButton variant="destructive">{{ t('demonstration.labels.removeItemAction') }}</button>
            </div>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplVarCustomCloseInFooter>
      <!-- O cenário é o painel do GUIA, com TRÊS ações no rodapé — o mesmo que
           as outras stacks mostram. Aqui a prévia exibia "Editar perfil" com uma
           ação só.

           O fechar é DESENHADO pelo [showCloseButton] do rodapé, que o projeta
           antes do ng-content e em ghost — a variante da ação terciária pela
           tabela da guideline 06. A ordem de DOM é a da guideline 04 —
           secundários primeiro, primária por último; a folha põe o primeiro
           embaixo no empilhamento e à esquerda no lado a lado. -->
      <div ndsDialog (onOpenChange)="aoMudarNoExemplo('custom_close_in_footer', 'docs_variantes', $event)">
        <button ndsDialogTrigger ndsButton variant="outline">{{ t('demonstration.labels.guideTrigger') }}</button>
        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>
          <div ndsDialogContent [showCloseButton]="false">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>{{ t('demonstration.labels.guideTitle') }}</h2>
              <p ndsDialogDescription>{{ t('demonstration.labels.guideDescription') }}</p>
            </div>
            <div ndsDialogBody>
              <p>{{ t('demonstration.labels.guideBody') }}</p>
            </div>
            <div ndsDialogFooter [showCloseButton]="true" [closeLabel]="t('demonstration.labels.close')">
              <button ndsButton variant="outline">{{ t('demonstration.labels.back') }}</button>
              <button ndsButton>{{ t('demonstration.labels.continueAction') }}</button>
            </div>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplVarConfirmEmail>
      <!-- Os rótulos saem de demonstration.labels, nunca de
           variants.items.confirmEmail.name: aquele campo é o NOME DO CARD de
           variante, e é dele que o DocsVariants tira o snippet_id do evento
           docs_code_copy. Usá-lo como texto de botão misturava dado de
           analytics com interface — e ainda punha "Confirmação de e-mail" num
           botão de ação. O texto agora é o mesmo do snippet ao lado. -->
      <div ndsDialog (onOpenChange)="aoMudarNoExemplo('confirm_email', 'docs_variantes', $event)">
        <button ndsDialogTrigger ndsButton variant="outline">{{ t('demonstration.labels.confirmEmailTitle') }}</button>
        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>
          <div ndsDialogContent [closeLabel]="t('demonstration.labels.close')">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>{{ t('demonstration.labels.confirmEmailTitle') }}</h2>
              <p ndsDialogDescription>{{ t('demonstration.labels.confirmEmailDescription') }}</p>
            </div>
            <!-- O endereço vai no CORPO: é o dado que a pessoa confere antes de
                 decidir, e o título sozinho não diz para onde o link vai. -->
            <div ndsDialogBody>
              <p>{{ t('demonstration.labels.confirmEmailBody') }}</p>
            </div>
            <div ndsDialogFooter>
              <button ndsDialogClose ndsButton variant="outline">{{ t('demonstration.labels.cancel') }}</button>
              <button ndsButton>{{ t('demonstration.labels.confirmEmailAction') }}</button>
            </div>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplCompProfileEdit>
      <div ndsDialog (onOpenChange)="aoMudarNoExemplo('profile_edit', 'docs_composicoes', $event)">
        <button ndsDialogTrigger ndsButton variant="outline">{{ t('variants.compositions.profileEdit.name') }}</button>
        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>
          <div ndsDialogContent [closeLabel]="t('demonstration.labels.close')">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>{{ t('variants.compositions.profileEdit.name') }}</h2>
              <p ndsDialogDescription>{{ t('demonstration.labels.description') }}</p>
            </div>
            <!-- O rodapé fica DENTRO do form: é o que faz o Enter em qualquer
                 campo disparar a ação primária, e é o que separa esta
                 composição de um painel com dois botões soltos. -->
            <form (submit)="$event.preventDefault()">
              <div ndsDialogBody class="nds-grid" data-spacing="md">
                <div class="nds-stack" data-spacing="sm">
                  <label ndsLabel for="profile-name">{{ t('demonstration.labels.fieldFullName') }}</label>
                  <input
                    ndsInput
                    id="profile-name"
                    name="name"
                    [value]="t('demonstration.labels.samplePersonName')"
                  />
                </div>
              </div>
              <div ndsDialogFooter>
                <button ndsDialogClose ndsButton type="button" variant="outline">{{ t('demonstration.labels.cancel') }}</button>
                <button ndsButton type="submit">{{ t('demonstration.labels.action') }}</button>
              </div>
            </form>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplCompMediaPreview>
      <div ndsDialog (onOpenChange)="aoMudarNoExemplo('media_preview', 'docs_composicoes', $event)">
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

                <!-- O form envolve o corpo E o rodapé (PRD D10): a ação primária é
                     type="submit" e precisa estar DENTRO dele, senão é botão
                     inerte — não submete, e o Enter num campo não faz nada.
                     Nada na tela denuncia, porque o botão continua clicável e
                     com a aparência certa. -->
                <form (submit)="$event.preventDefault()">
                  <div ndsDialogBody class="nds-stack" data-spacing="md">
                    @for (field of camposDoFormulario(); track field.id) {
                      <div class="nds-stack" data-spacing="xs">
                        <label ndsLabel [attr.for]="'demo-' + field.id">{{ field.label }}</label>
                        <input ndsInput [id]="'demo-' + field.id" [name]="field.id" [value]="field.value" />
                      </div>
                    }
                    <p class="nds-text-caption nds-text-muted-foreground">
                      {{ t('demonstration.labels.footerNote') }}
                    </p>
                  </div>

                  <div ndsDialogFooter>
                    <button ndsDialogClose ndsButton type="button" variant="outline">
                      {{ t('demonstration.labels.cancel') }}
                    </button>
                    <!-- type="submit" AQUI vence o type="button" que o
                         RdxDialogClose põe como atributo estático de host: o
                         ndsButton expõe type como INPUT e o reemite por
                         [attr.type], e binding de update vence atributo
                         estático. A primária continua fechando (o listener do
                         ndsDialogClose) e agora também submete — clique e Enter
                         percorrem o mesmo caminho, porque o Enter num campo
                         dispara um clique no botão padrão do form. -->
                    <button ndsDialogClose ndsButton type="submit" (click)="aoConfirmar()">
                      {{ t('demonstration.labels.action') }}
                    </button>
                  </div>
                </form>
              </div>
            </ng-template>
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
  private readonly tplCompProfileEdit =
    viewChild.required<TemplateRef<unknown>>('tplCompProfileEdit');
  private readonly tplCompMediaPreview =
    viewChild.required<TemplateRef<unknown>>('tplCompMediaPreview');

  /** Os dois campos do formulário de exemplo. */
  protected readonly camposDoFormulario = computed(() => {
    dict();
    return [
      { id: 'profile-name', label: t('demonstration.labels.fieldName'), value: 'Ana Ribeiro' },
      { id: 'perfil-email', label: t('demonstration.labels.fieldEmail'), value: 'ana@exemplo.com' },
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
   * Analytics dos exemplos VIVOS das outras seções.
   *
   * `location` sai de ONDE O ELEMENTO ESTÁ, e por isso vem como argumento: o Do
   * & Don't, as Variantes e as Composições instanciam o componente de verdade,
   * e um clique ali é tão real quanto o da demonstração. Com `docs_demo` cravado
   * em tudo, o funil somava quatro seções numa só — é o que a regra
   * `location_so_da_demo` do `audit.mjs` mede.
   *
   * `qual` é identificador estável do exemplo, nunca o texto traduzido: um único
   * evento viraria três valores no GA4, um por idioma.
   */
  protected aoMudarNoExemplo(qual: string, secao: string, evento: RdxDialogOpenChange): void {
    if (evento.open) {
      track('dialog_open', { component: 'dialog', label: qual, location: secao });
      return;
    }
    track('dialog_close', {
      component: 'dialog',
      label: qual,
      reason: MOTIVO[evento.reason] ?? 'action',
      location: secao,
    });
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
    // O nome é a CHAVE, não a primeira frase: `customCloseInFooter` é descrito
    // como "showCloseButton={false} no Content e showCloseButton no Footer",
    // que vira um título ilegível. A chave é o identificador estável que também
    // aparece no snippet, e é o que as outras stacks mostram.
    const mapa: {
      key: string;
      tpl: TemplateRef<unknown>;
      code: string;
    }[] = [
      { key: 'default',               tpl: this.tplVarDefault(),               code: VARIANT_CODE.default               },
      { key: 'withForm',              tpl: this.tplVarWithForm(),              code: VARIANT_CODE.withForm              },
      { key: 'withScrollContent',     tpl: this.tplVarWithScrollContent(),     code: VARIANT_CODE.withScrollContent     },
      { key: 'noFooter',              tpl: this.tplVarNoFooter(),              code: VARIANT_CODE.noFooter              },
      { key: 'withDestructiveAction', tpl: this.tplVarWithDestructiveAction(), code: VARIANT_CODE.withDestructiveAction },
      { key: 'customCloseInFooter',   tpl: this.tplVarCustomCloseInFooter(),   code: VARIANT_CODE.customCloseInFooter   },
    ];
    const items: DocsVariantItem[] = mapa.map(({ key, tpl, code }) => ({
      name: key,
      description: stripHtml(t(`variants.items.${key}`)),
      code,
      trackId: key,
      preview: tpl,
    }));
    // `confirmEmail` é o único que traz nome e descrição próprios no conteúdo.
    items.push({
      name: t('variants.items.confirmEmail.name'),
      description: stripHtml(t('variants.items.confirmEmail.description')),
      code: VARIANT_CODE.confirmEmail,
      trackId: 'confirmEmail',
      preview: this.tplVarConfirmEmail(),
    });
    return items;
  });

  protected readonly compositionItems = computed(() => {
    dict();
    return [
      {
        name: t('variants.compositions.profileEdit.name'),
        description: t('variants.compositions.profileEdit.description'),
        useWhen: t('variants.compositions.profileEdit.use'),
        code: COMPOSITION_CODE.profileEdit,
        trackId: 'profileEdit',
        preview: this.tplCompProfileEdit(),
      },
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
    const not = tNav('common.no');
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
            required: not,
            description: toPlainText(t('props.table.open')),
          },
          {
            name: 'defaultOpen',
            type: 'boolean',
            defaultValue: 'false',
            required: not,
            description: toPlainText(t('props.table.defaultOpen')),
          },
          {
            // A linha `onOpenChange` do conteúdo compartilhado descreve o
            // callback de mudança; aqui ele é o output `openChange`, o que
            // também habilita a forma de duas vias `[(open)]`.
            name: 'openChange',
            type: 'output<boolean>',
            defaultValue: '—',
            required: not,
            description: toPlainText(t('props.table.onOpenChange')),
          },
          {
            name: 'modal',
            type: "boolean | 'trap-focus'",
            defaultValue: 'true',
            required: not,
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
            required: not,
            description: toPlainText(t('props.table.showCloseButtonContent')),
          },
          {
            name: 'closeLabel',
            type: 'string',
            defaultValue: "'Fechar'",
            required: not,
            description: toPlainText(t('props.table.closeLabel')),
          },
          {
            name: 'escapeKeyDown',
            type: 'output<KeyboardEvent>',
            defaultValue: '—',
            required: not,
            description: toPlainText(t('props.table.escapeKeyDown')),
          },
          {
            name: 'pointerDownOutside',
            type: 'output<Event>',
            defaultValue: '—',
            required: not,
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
            required: not,
            description: toPlainText(t('props.table.showCloseButtonFooter')),
          },
          {
            name: 'closeLabel',
            type: 'string',
            defaultValue: "'Fechar'",
            required: not,
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
            required: not,
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
      { token: '--popover',            className: 'nds-dialog-content',  k: 'popover'           },
      { token: '--popover-foreground', className: 'nds-dialog-content',  k: 'popoverForeground' },
      { token: '--foreground',         className: 'nds-dialog-content',  k: 'foreground'        },
      { token: '--muted',              className: 'nds-dialog-footer',   k: 'muted'             },
      { token: '--border',             className: 'nds-dialog-footer',   k: 'border'            },
      { token: '--radius-card',        className: 'nds-dialog-content',  k: 'radius'            },
      // O overlay lê `--z-modal-backdrop`; `--z-modal` é do painel.
      { token: '--overlay',            className: 'nds-dialog-overlay',  k: 'overlay'           },
      { token: '--z-modal',            className: 'nds-dialog-content',  k: 'zIndex'            },
      { token: '--duration-base',      className: 'nds-dialog-content',  k: 'duration'          },
    ].map(({ token, className, k }) => ({
      token,
      value: className,
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
    const block = byLocale[locale]?.screenReader ?? {};
    // `title`, quando existe, é o cabeçalho da seção e não uma linha da lista.
    return Object.entries(block).filter(([k]) => k !== 'title').map(([, v]) => v);
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { name: 'AlertDialog', k: 'alertDialog', path: '?path=/docs/components-overlay-alertdialog--docs' },
      { name: 'Sheet',       k: 'sheet',       path: '?path=/docs/components-overlay-sheet--docs'       },
      { name: 'Popover',     k: 'popover',     path: '?path=/docs/components-overlay-popover--docs'     },
      { name: 'Form',        k: 'form',        path: '?path=/docs/components-form-form--docs'        },
      { name: 'Drawer',      k: 'drawer',      path: '?path=/docs/components-overlay-drawer--docs'      },
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
    // z-index sai de `--z-modal` e a rolagem é a do CORPO, com
    // `.nds-dialog-body-scroll` mais `tabindex`, papel e nome.
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
 * `item1`, `item2`, … de um bloco, na ordem, até a primeira ausência.
 *
 * Contar à mão é o que faz um item novo no conteúdo compartilhado nunca
 * aparecer na página — e ninguém percebe, porque nada quebra.
 */
function itemsList(d: Record<string, string>, base: string): string[] {
  const items: string[] = [];
  for (let i = 1; d[`${base}.item${i}`] !== undefined; i++) items.push(d[`${base}.item${i}`]);
  return items;
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
