import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  fractionLevel,
  fractionPercent,
  remainingUnits,
  spentFraction,
  type BudgetLevel,
} from '@shared/primitives/token-budget';
import { NdsBadge, type BadgeVariant } from './badge';

// ─── QuotaBanner ──────────────────────────────────────────────────────────────
//
// Quanto ainda resta de uma cota, quando ela renova, e o que dá para fazer.
//
// Desenho em docs/shared/styles/nds/medicao.css, no bloco "Faixa de cota", que
// também guarda as nove decisões de acessibilidade. A CONTA — o resto, a razão,
// o limiar e o nível — vem de `@shared/primitives/token-budget`, e é a MESMA
// que as três medições irmãs leem: se duas delas aparecem na mesma tela usando
// a palavra "perto do fim", ela precisa querer dizer a mesma coisa nas duas.
//
// A PERGUNTA É O RESTO, e é ela que faz desta peça um slug em vez de uma
// composição de `alert` com um medidor da família. As irmãs medem o que JÁ FOI;
// esta mede o que AINDA HÁ, e o número da manchete é `teto − uso`. Virar a
// medição do avesso muda a decisão de quem lê: "84% usados" se confere,
// "32 restantes" se gasta. Junto com o resto vêm três coisas que nenhuma irmã
// tem — um HORIZONTE, um ESPAÇO DE CONTROLES e o estado ESGOTADA —, e são elas
// que uma faixa genérica de aviso não saberia desenhar.
//
// NÃO HÁ CASO SEM TETO, e essa é a divergência desta peça em relação às irmãs.
// Nelas o teto é opcional porque o que se mede existe sem ele: consumo sem
// janela conhecida é uma contagem, custo sem orçamento é o caso comum. Aqui o
// teto É O ASSUNTO — "quanto ainda resta" não tem resposta sem ele —, e por
// isso ele não é opcional no tipo, e por isso `data-level` está SEMPRE na raiz,
// ao contrário das irmãs, onde o atributo some quando não há teto. A regra da
// família continua valendo, um passo antes: em vez de desenhar um trilho vazio
// que leria como zero, a peça não existe. Quem não tem teto não monta a faixa.
//
// O HORIZONTE CHEGA ESCRITO, pelo mesmo precedente do relógio do estado da
// execução, do tempo decorrido do ditado, do carimbo do rascunho e da quantia
// do custo: formato de duração é decisão de idioma E de lugar. A PALAVRA que o
// antecede, essa vem dos rótulos — ela é interface, tem três traduções, e
// grudá-la na cadeia a tiraria da `translations.json`. É a mesma divisão que a
// peça do custo faz entre a quantia escrita e a palavra que a liga ao teto.
//
// ESGOTADA NÃO É UM QUARTO NÍVEL: o resto só chega a zero quando a razão chega
// a um, então o nível já é o mais apertado. O que muda é o TEXTO da manchete, e
// texto não precisa de gancho de folha — não há `data-state` novo aqui.
//
// E A DECISÃO QUE GOVERNA A FAMÍLIA INTEIRA: o que muda a cada quadro é
// DECORATIVO, e o número é TEXTO. O medidor não tem papel ARIA nem valor, não
// há `aria-live` em lugar nenhum, e nada aqui se reanuncia. Aqui isso precisou
// ser DECIDIDO em vez de herdado, porque "sua cota acabou" tem cara de ser da
// natureza do chão saindo — a folha guarda o porquê de não ser, em duas linhas
// que valem ler antes de acrescentar região viva por fora.
//
// O QUE O COMPONENTE NÃO FAZ: buscar cota, contar uso, formatar duração,
// decidir o que acontece quando a cota acaba, saber o que o controle faz. Ele
// recebe a medição e desenha — §2 da guideline 17.
//
// A RAIZ É A PRÓPRIA CAIXA, e é por isso que o seletor é de ATRIBUTO. Um
// seletor de elemento (`<nds-quota-banner>`) somaria uma caixa sem papel entre
// a pilha e a faixa, e as cinco stacks deixariam de renderizar a mesma árvore —
// markup divergente não é a exceção de "API de framework". Mesma escolha do
// `div[ndsApprovalCard]`, do `p[ndsCostMeter]` e do `button[ndsButton]`.
//
// AS DIVERGÊNCIAS DE API que se REGISTRAM em vez de se "alinhar":
//   - `actions` é uma lista de `TemplateRef`, e não de elementos prontos. Quem
//     consome declara os templates e o componente os instancia por
//     `ngTemplateOutlet` — a mesma escolha que `actions` já faz no cartão de
//     autorização e no `chat-thread`. Montar DOM à mão perderia detecção de
//     mudança e os inputs dos componentes projetados.
//   - não há entrada `class`: `class` é nativo do host, e quem consome a escreve
//     direto no elemento. Mesmo registro de `cost-meter` e `context-display`.
//   - não há saída nenhuma, e a ausência não é divergência: a faixa não decide o
//     que o controle faz, então não tem o que relatar. Quem passou o controle é
//     quem sabe o que ele significa (§7 da guideline 17).
//   - o `data-slot` da etiqueta de nível é escrito no template, mas o `ndsBadge`
//     liga o dele por host binding e os dois disputam sem ordem garantida (§8 do
//     RULES.md). Quem procura a etiqueta — folha e teste — procura pela CLASSE
//     `.nds-quota-banner-level`, que não disputa com ninguém. O mesmo vale para
//     a caixa dos controles, que hospeda botões vindos de fora com o
//     `data-slot` deles junto.

/**
 * A cota: o que já foi usado, e o teto.
 *
 * Os dois lados andam juntos num objeto só porque são a mesma medição, e
 * porque o teto é OBRIGATÓRIO aqui. Como duas propriedades soltas, uma delas
 * opcional, existiria a faixa sem cota — que não é uma medição pela metade, é a
 * ausência da pergunta.
 */
export interface QuotaAllowance {
  /**
   * Quanto da cota já foi usado.
   *
   * Número puro, sem unidade: quem nomeia o que está sendo contado é o texto,
   * porque "mensagens" tem três traduções e um número não tem nenhuma.
   */
  used: number;
  /**
   * O teto da cota.
   *
   * Sem ele não há resto, não há razão e não há nível — ou seja, não há faixa.
   * É por isso que ele não é opcional, ao contrário do teto das medições irmãs.
   */
  limit: number;
}

export interface QuotaBannerLabels {
  /**
   * De qual cota se trata.
   *
   * A manchete já diz o que é contado ("32 mensagens restantes"), então o
   * título responde a OUTRA pergunta: a cota do plano, a do dia, a do projeto.
   * Ele não aparece na tela porque quem vê sabe pelo lugar em que a faixa está;
   * quem ouve não sabe.
   */
  title: string;
  /** O que está sendo contado. Aparece na manchete e na razão do rodapé. */
  unit: string;
  /**
   * A palavra que acompanha o resto.
   *
   * É ela que impede a manchete de ser lida como o que já foi gasto — "32
   * mensagens" sozinho aponta para os dois lados. Vem depois da unidade porque
   * é a ordem que serve aos três idiomas do conteúdo compartilhado.
   */
  left: string;
  /**
   * O que dizer quando não sobra nada.
   *
   * Sem esta palavra a manchete contaria zero, e zero contado lê como medição —
   * não como fim. É a mesma escolha que faz a peça do custo dizer que não há
   * teto em vez de desenhar um trilho vazio.
   */
  exhausted: string;
  /** A palavra que antecede o horizonte: RENOVA EM três horas e doze minutos. */
  renews: string;
  /** Liga o usado ao teto na razão do rodapé: cento e sessenta e oito DE duzentos. */
  of: string;
  /**
   * A palavra de cada nível.
   *
   * É ela que descreve, e não a cor: cor sozinha não descreve estado (WCAG
   * 1.4.1), e aqui a cor está em dois lugares — moldura e medidor —, o que só
   * torna a palavra mais necessária: duas superfícies coloridas ainda são zero
   * palavras. `Record` completo de propósito — nível novo no primitivo
   * compartilhado reprova a compilação aqui, em vez de desenhar uma etiqueta em
   * branco que ninguém repara.
   */
  level: Record<BudgetLevel, string>;
}

/**
 * A cor de reforço de cada nível, em tabela.
 *
 * Tabela em vez de cadeia de ternários, pelo mesmo motivo do badge: com a
 * tabela não há ramo para cobrir nem ramo inalcançável a ignorar. A ETIQUETA é
 * quem carrega a palavra; a cor dela é reforço, e é curta o bastante para o
 * limiar de 3:1.
 *
 * Os mesmos três valores das peças irmãs, e isso é o eixo da família: mesmo
 * limiar, mesma palavra, mesma cor. Uma tabela diferente aqui faria duas
 * medições da mesma tela discordarem sobre o que é aviso.
 */
const LEVEL_VARIANT: Record<BudgetLevel, BadgeVariant> = {
  normal: 'default',
  warning: 'warning',
  critical: 'destructive',
};

@Component({
  selector: 'div[ndsQuotaBanner]',
  standalone: true,
  imports: [NdsBadge, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-quota-banner',
    '[attr.data-slot]': '"quota-banner"',
    // SEMPRE PRESENTE, ao contrário das irmãs — lá o atributo some quando não
    // há teto, e aqui não há caso sem teto.
    '[attr.data-level]': 'level()',
    // Nenhum papel ARIA e nenhuma região viva (decisão 2 da folha), e a
    // ausência é deliberada: quem quiser anunciar põe a região por fora.
  },
  template: `
    <!-- O NÚMERO TEM NOME, e o nome é o ESCOPO (decisão 4). Ele não aparece na
         tela: quem vê já sabe de qual cota se trata pelo lugar em que a faixa
         está, e quem ouve não sabe. -->
    <span
      class="nds-sr-only"
      data-slot="quota-banner-title"
    >{{ labels().title }}</span>

    <p class="nds-quota-banner-headline" data-slot="quota-banner-headline">
      <!-- O QUE AINDA RESTA abre a linha, porque é ele que muda a decisão de
           quem lê. Com a cota esgotada a manchete troca o número pela palavra:
           zero contado lê como medição, e não como fim. -->
      <span
        class="nds-quota-banner-remaining"
        data-slot="quota-banner-remaining"
      >{{ headline() }}</span>

      <!-- O HORIZONTE, quando existe. A duração chegou ESCRITA; a palavra que a
           antecede é interface e veio dos rótulos (decisão 7). -->
      @if (horizon(); as line) {
        <span
          class="nds-quota-banner-renews"
          data-slot="quota-banner-renews"
        >{{ line }}</span>
      }

      <!-- O NÍVEL É PALAVRA (decisão 3), e a cor acompanha em vez de substituir.
           Ele aparece SEMPRE, inclusive com folga: uma faixa que só falasse
           quando a notícia é ruim deixaria a boa notícia indistinguível de uma
           medição que não chegou.

           A CLASSE é o que a folha lê e o que o teste procura — o data-slot
           estático daqui disputa com o host binding do ndsBadge (§8 do
           RULES.md), e essa disputa não tem ordem garantida. -->
      <span
        ndsBadge
        [variant]="levelVariant()"
        class="nds-quota-banner-level"
        data-slot="quota-banner-level"
      >{{ labels().level[level()] }}</span>
    </p>

    <!-- O MEDIDOR FICA ENTRE AS DUAS LINHAS DE TEXTO, e é por isso que ele vem
         aqui no DOM: pô-lo no fim exigiria a propriedade de ordenação para
         desfazer a ordem de leitura, e ordenação que discorda do foco é a
         armadilha da decisão 5.

         Ele existe SEMPRE, porque sempre há teto — é a diferença em relação às
         irmãs, onde o medidor some quando não há fração.

         O MEDIDOR É DECORATIVO (decisão 1) e sai inteiro do que é lido em voz:
         a razão do rodapé já diz o mesmo, e repeti-la em desenho não acrescenta
         nada a quem ouve. Nenhum papel, nenhum aria-valuenow — um segundo
         portador da mesma fração a faria ser lida duas vezes, uma delas como
         controle.

         A propriedade personalizada é valor de RUNTIME, e por isso é a exceção
         legítima à proibição de estilo embutido. Ela fica no TRILHO, e não no
         preenchimento: ela herda, então o preenchimento a lê de graça, e o
         número mora sempre no mesmo elemento. -->
    <span
      class="nds-quota-banner-bar"
      data-slot="quota-banner-meter"
      aria-hidden="true"
      [style.--nds-quota-used]="percent()"
    >
      <span class="nds-quota-banner-bar-fill"></span>
    </span>

    <div class="nds-quota-banner-footer" data-slot="quota-banner-footer">
      <!-- A RAZÃO EM TEXTO, e não um segundo por cento: "168 de 200 mensagens"
           diz exatamente o que a barra desenha, e com mais precisão, porque não
           passa pelo truncamento do inteiro. É este elemento que permite à barra
           ser só desenho — sem ele, ela viraria a única portadora da fração e
           passaria a dever 3:1 entre a parte cheia e a vazia. -->
      <span
        class="nds-quota-banner-detail"
        data-slot="quota-banner-detail"
      >{{ detail() }}</span>

      <!-- OS CONTROLES VÊM POR ÚLTIMO (decisões 5 e 8), e a caixa deles só
           existe quando há o que pôr dentro: um container vazio deixaria um
           espaço que ninguém pediu e um data-slot que não descreve nada.

           Cada entrada é um pedaço do espaço de quem responde: a peça instancia
           o que chega, na ordem em que chega, e não conta controles. -->
      @if (controls().length) {
        <div class="nds-quota-banner-actions" data-slot="quota-banner-actions">
          @for (control of controls(); track $index) {
            <ng-container *ngTemplateOutlet="control" />
          }
        </div>
      }
    </div>
  `,
})
export class NdsQuotaBanner {
  /** O uso e o teto. */
  readonly quota = input.required<QuotaAllowance>();

  /**
   * Quando a cota renova, JÁ ESCRITO.
   *
   * Ausente é a resposta de que ela não renova — crédito comprado uma vez é
   * caso real —, e aí a linha some em vez de dizer "renova em nunca".
   */
  readonly renewsIn = input<string>();

  /**
   * Os controles, prontos de quem consome.
   *
   * Ação é ESPAÇO, e não política (§2 e §7 da guideline 17): a peça desenha o
   * lugar de quem responde e nada mais. O que "mudar de plano" faz, se há um
   * segundo botão, se a cota pode ser comprada avulsa — nada disso está aqui.
   * Mesmo contrato das ações da mensagem e do cartão de autorização.
   *
   * Vazio ou ausente não desenha a caixa.
   */
  readonly actions = input<readonly TemplateRef<unknown>[] | undefined>(undefined);

  /** O texto da peça. Obrigatório, porque tudo aqui é texto de tela. */
  readonly labels = input.required<QuotaBannerLabels>();

  /**
   * A RAZÃO SAI DO PRIMITIVO, e não de uma divisão daqui.
   *
   * O `null` desta chamada NÃO é "sem teto declarado", porque o tipo exige
   * teto: é teto que não é teto — zero, negativo ou não-finito. Uma cota cujo
   * teto é zero não tem nada a restar, e a razão cheia é a resposta certa para
   * ela: é a mesma que `remainingUnits` já deu, do outro lado da conta.
   */
  protected readonly fraction = computed(
    () => spentFraction(this.quota().used, this.quota().limit) ?? 1,
  );

  /**
   * O RESTO, pela conta compartilhada — e nunca por uma subtração daqui.
   *
   * O piso em zero é o que impede "-14 mensagens restantes" no dia em que
   * alguém passar do teto, e a subtração é justamente a conta que mais parece
   * dispensar uma função.
   */
  protected readonly remaining = computed(
    () => remainingUnits(this.quota().used, this.quota().limit),
  );

  protected readonly percent = computed(() => fractionPercent(this.fraction()));

  /**
   * O nível, pela mesma comparação que as medições irmãs leem.
   *
   * Dois limiares fariam "perto do fim" querer dizer uma coisa acima e outra
   * abaixo na mesma tela, e aí a palavra deixaria de decidir o que fazer.
   */
  protected readonly level = computed(() => fractionLevel(this.fraction()));

  /**
   * A manchete: o resto contado, ou a palavra de que acabou.
   *
   * ESGOTADA NÃO É UM QUARTO NÍVEL — o resto só chega a zero quando a razão
   * chega a um, então o nível já é o mais apertado. O que muda aqui é o TEXTO,
   * e texto não precisa de gancho de folha.
   */
  protected readonly headline = computed(() => {
    const labels = this.labels();
    const remaining = this.remaining();
    if (remaining === 0) return labels.exhausted;
    return `${remaining.toLocaleString()} ${labels.unit} ${labels.left}`;
  });

  /**
   * A linha do horizonte, montada aqui e não no template.
   *
   * A palavra e a duração viram uma cadeia só num lugar só: interpolação
   * partida no template deixaria o espaço entre as duas à mercê de como o
   * compilador trata espaço em branco, e o que se lê em voz é a frase inteira.
   */
  protected readonly horizon = computed(() => {
    const at = this.renewsIn();
    return at ? `${this.labels().renews} ${at}` : null;
  });

  protected readonly detail = computed(() => {
    const labels = this.labels();
    const { used, limit } = this.quota();
    return `${used.toLocaleString()} ${labels.of} ${limit.toLocaleString()} ${labels.unit}`;
  });

  /** Os pedaços do espaço da resposta, sempre como lista. */
  protected readonly controls = computed(() => this.actions() ?? []);

  /** A cor da etiqueta, pela tabela. Sempre há nível, porque sempre há teto. */
  protected readonly levelVariant = computed<BadgeVariant>(
    () => LEVEL_VARIANT[this.level()],
  );
}
