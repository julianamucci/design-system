import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
} from '@angular/core';

// ─── ThinkingIndicator ────────────────────────────────────────────────────────
//
// O lugar da resposta enquanto ela não chegou.
//
// Desenho em docs/shared/styles/nds/agent-run.css, no bloco do indicador de
// geração, que também guarda as três decisões de acessibilidade.
//
// NÃO É O ESTADO DA EXECUÇÃO, e a diferença é de lugar antes de ser de desenho.
// Aquela é uma linha de informação com ação — diz em que pé está a resposta e
// oferece o que fazer a respeito —, e mora FORA da resposta. Este é o lugar da
// resposta enquanto ela não chegou, e mora ONDE o texto vai aparecer. Quem
// escolhe entre os dois escolhe pelo lugar, não pela aparência.
//
// A EXCEÇÃO DA FAMÍLIA: aqui existe região viva. A folha inteira proíbe região
// viva porque um número que se reanuncia torna a tela impossível de ouvir; aqui
// vale porque o indicador anuncia UMA vez que a resposta começou a vir, e
// depois some. É a diferença entre avisar que algo começou e narrar cada passo.
//
// O QUE O COMPONENTE NÃO FAZ: aparecer, sumir, contar o tempo ou oferecer o que
// interromper. Ele não sabe quando o primeiro trecho de texto chegou — só quem
// monta a conversa sabe —, e por isso sumir é responsabilidade de quem consome.
// Indicador que fica é indicador que mente.
//
// A RAIZ É O PRÓPRIO PARÁGRAFO, e é por isso que o seletor é de atributo. A
// folha declara `display: flex` na raiz e conta com ela estando no lugar em que
// a resposta vai aparecer; um seletor de elemento (`<nds-thinking-indicator>`)
// somaria uma caixa entre esse lugar e o `.nds-thinking`, e essa caixa quebraria
// a linha que a folha desenha. Mesma escolha do `ul[ndsComposerContext]`, do
// `button[ndsButton]` e do `div[ndsProgressIndicator]`.
//
// MOVIMENTO REDUZIDO já está resolvido na folha, e não se duplica aqui: a
// camada de token zera a duração, e o bloco de mídia mantém os pontos visíveis
// em vez de congelá-los no quadro mais apagado. Repetir a decisão em TypeScript
// criaria uma segunda fonte para a mesma regra.

/**
 * Os três pontos que dizem que a resposta está vindo.
 *
 * TRÊS, e não uma opção: o atraso escalonado que os faz parecer uma ONDA — em
 * vez de três pontos piscando juntos — está escrito na folha para o segundo e o
 * terceiro filho. Um quarto ponto pulsaria junto com o primeiro, e a opção
 * existiria para produzir um desenho que o sistema não desenha. Por isso os três
 * `<span>` são literais no template, e não um laço sobre uma contagem.
 *
 * Sem entrada de aparecer ou sumir: as duas são de quem monta a conversa.
 */
@Component({
  selector: 'p[ndsThinkingIndicator]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-thinking',
    '[attr.data-slot]': '"thinking-indicator"',
    // Região de estado: anuncia uma vez, sem cortar o que estiver sendo lido. É
    // a única região viva desta família, e ela só se justifica porque o elemento
    // sai de cena quando o texto chega.
    role: 'status',
  },
  template: `
    <!-- Os pontos são DESENHO, e saem do que é lido em voz: animação não se lê,
         e três pontos anunciados a cada quadro tornariam a tela impossível de
         ouvir. Os três elementos ficam na MESMA linha de propósito: assim não há
         nó de texto entre eles, e o conteúdo lido continua sendo só a frase. -->
    <span class="nds-thinking-dots" aria-hidden="true"><span></span><span></span><span></span></span>

    <!-- A frase, escondida do olho e presente para o ouvido. Ela é o CONTEÚDO da
         região, e não um rótulo dela: rótulo substituiria o conteúdo no anúncio,
         e aqui o conteúdo é a informação inteira. -->
    <span class="nds-sr-only">{{ label() }}</span>
  `,
})
export class NdsThinkingIndicator {
  /**
   * A frase que diz o que está acontecendo.
   *
   * Obrigatória e sem valor padrão de propósito: o padrão escondido seria uma
   * frase numa língua só, e esta é a única coisa daqui que chega a quem ouve a
   * tela.
   */
  readonly label = input.required<string>();
}
