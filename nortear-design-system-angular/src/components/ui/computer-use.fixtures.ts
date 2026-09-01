/**
 * Andaime das demonstrações da tela do computador.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface — a
 * palavra que apresenta o endereço e o molde da contagem. Os PASSOS e o ENDEREÇO
 * saem de `@shared/primitives/computer-use-examples`, porque não são idioma: o
 * ponto que o agente clicou é o mesmo nos três, e escrever pontos diferentes por
 * idioma faria as fotos mostrarem marcas em lugares diferentes.
 *
 * A TELA NÃO PODE SER COMPARTILHADA, e é a única parte do andaime que não é. Ela
 * é marcação — que não entra em primitivo compartilhado —, e é ESPAÇO de quem
 * consome (§1 e §2 da guideline 17). Cada stack monta a sua com os próprios
 * primitivos; o que se compartilha é onde as marcas caem sobre ela.
 *
 * Nada de `storybook/test` neste módulo: a docs page importa dele, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
} from '@angular/core';
import { useTranslation } from '@/lib/i18n';
import computerUseTranslations from '@shared/content/computer-use/translations.json';
import { NdsButton } from './button';
import { NdsCard, NdsCardContent, NdsCardHeader, NdsCardTitle } from './card';
import { NdsInput } from './input';
import { NdsLabel } from './label';
import type { ComputerUseLabels } from './computer-use';

const { t, dict } = useTranslation(computerUseTranslations as Record<string, unknown>);

/** A palavra que apresenta o endereço e o molde da contagem. */
export function computerUseLabels(): ComputerUseLabels {
  return { address: t('labels.address'), position: t('labels.position') };
}

/**
 * Escopo de id por instância.
 *
 * A demonstração monta várias telas na mesma página, e cada uma tem dois campos
 * rotulados. Ids derivados só do nome do campo colidiriam, e `for` passaria a
 * resolver para o PRIMEIRO campo do documento — dando ao segundo formulário o
 * rótulo do primeiro. Mesma precaução do bloco de terminal, pelo mesmo motivo, e
 * contador de módulo pela mesma razão: id curto e estável aparece legível no
 * atributo e não polui o diff de snapshot.
 */
let sequencia = 0;

/**
 * A tela de demonstração: uma página de entrada qualquer.
 *
 * NENHUMA CAPTURA DE SISTEMA REAL, e é a §1 da guideline 17 aplicada: uma
 * fotografia de produto de terceiro traz marca registrada e conteúdo que não é
 * nosso. A saída é desenhar a tela com os PRÓPRIOS primitivos do design system —
 * o que, de quebra, mostra o contrato certo: a peça recebe um espaço, e qualquer
 * conteúdo serve.
 *
 * ELA É INERTE, e essa é a decisão que se leva daqui para quem consome. A tela
 * dentro da moldura é uma FOTO: ninguém está preenchendo aquele formulário. Sem
 * `inert`, o teclado entraria em campos de uma tela que não é a de quem navega —
 * parada de tabulação para dentro de um retrato — e o leitor de tela leria um
 * formulário que não existe. Com ele, a figura volta a ser o que a legenda diz
 * que é.
 *
 * OS CAMPOS TÊM RÓTULO DE VERDADE, ainda que inertes. É cinto e suspensório: se
 * a ferramenta de auditoria não honrar `inert`, um campo sem rótulo reprovaria,
 * e o defeito seria do andaime — não da peça.
 *
 * O `inert` mora no HOST, e não num invólucro interno: é o host que vira o filho
 * único da superfície, e é nele que a play procura o atributo.
 */
@Component({
  selector: 'nds-computer-use-demo-screen',
  standalone: true,
  imports: [NdsButton, NdsCard, NdsCardContent, NdsCardHeader, NdsCardTitle, NdsInput, NdsLabel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    inert: '',
  },
  template: `
    <div ndsCard class="nds-h-full nds-w-full">
      <div ndsCardHeader>
        <h3 ndsCardTitle>{{ title() }}</h3>
      </div>

      <div ndsCardContent class="nds-stack" data-spacing="sm">
        <div class="nds-stack" data-spacing="xs">
          <label ndsLabel [attr.for]="emailId">{{ email() }}</label>
          <input ndsInput [id]="emailId" type="email" value="agente@exemplo.com" />
        </div>

        <div class="nds-stack" data-spacing="xs">
          <label ndsLabel [attr.for]="passwordId">{{ password() }}</label>
          <input ndsInput [id]="passwordId" type="password" value="ainda-nao-digitada" />
        </div>

        <button ndsButton type="button" class="nds-w-full">{{ submit() }}</button>
      </div>
    </div>
  `,
})
export class NdsComputerUseDemoScreen {
  private readonly instance = (sequencia += 1);

  protected readonly emailId = `nds-computer-use-demo-${this.instance}-email`;
  protected readonly passwordId = `nds-computer-use-demo-${this.instance}-password`;

  // Os textos da tela são de interface, então acompanham a troca de idioma: sem
  // `dict()` no grafo, a foto ficaria no idioma em que abriu.
  protected readonly title = computed(() => {
    dict();
    return t('demonstration.screen.title');
  });
  protected readonly email = computed(() => {
    dict();
    return t('demonstration.screen.email');
  });
  protected readonly password = computed(() => {
    dict();
    return t('demonstration.screen.password');
  });
  protected readonly submit = computed(() => {
    dict();
    return t('demonstration.screen.submit');
  });
}
