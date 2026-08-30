import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  TemplateRef,
  ViewEncapsulation,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  viewChild,
} from '@angular/core';
import type { TriggerApplied } from '@shared/primitives/composer-trigger';
import type { Attachment } from '@shared/primitives/chat-protocol';
import { NdsButton } from './button';
import {
  NdsComposerAttachments,
  type ComposerAttachmentLabels,
} from './composer-attachments';
import {
  NdsComposerTriggerPopover,
  type TriggerPopoverLabels,
  type TriggerSource,
} from './composer-trigger-popover';

// ─── Composer ────────────────────────────────────────────────────────────────
//
// A superfície de entrada da conversa. Estrutura e cores em
// docs/shared/styles/nds/composer.css, que também guarda as cinco decisões de
// acessibilidade que valem mais que o desenho.
//
// O QUE O COMPONENTE FAZ: recebe o que foi escrito, diz quando alguém pediu
// para enviar, e troca o botão de enviar por um de interromper enquanto a
// resposta é gerada.
//
// O QUE ELE NÃO FAZ: decidir o que enviar significa. Ele não limpa o campo
// sozinho, não sabe se a mensagem chegou e não guarda rascunho. Emite o texto e
// devolve o controle — a mesma divisão de `approval` no `chat-thread`, e pelo
// mesmo motivo: o que acontece depois do envio é produto, e produto envelhece
// por outro relógio que o sistema de design.
//
// POR QUE A TECLA DIRETA ENVIA, e por que isso é uma entrada
//
// A convenção de conversa em teclado físico é a tecla direta enviar e a
// modificadora quebrar linha, e é o padrão daqui. Mas ela é ERRADA no toque: no
// teclado virtual a tecla direta é a de quebrar linha, e um composer que envia
// ali manda mensagem pela metade a cada tentativa de fazer parágrafo. Por isso
// `submitOn` existe e o composer de toque — a peça vizinha da mesma família —
// nasce com 'modifier'.
//
// A dica embaixo NÃO é decoração: a tecla que envia é comportamento, e quem não
// vê a tela precisa saber disso ANTES de apertar a tecla. Ela entra em
// `aria-describedby` do campo, junto com o limite de caracteres.
//
// AS DUAS DIVERGÊNCIAS DE API, que se REGISTRAM em vez de se "alinharem"
//
// 1. O ESTADO DE GERAÇÃO É UMA ENTRADA. No Vanilla a raiz devolvida expõe
//    `getValue`, `setValue` e `setRunning`; aqui quem sabe que a resposta está
//    sendo gerada é quem consome, e o caminho natural desta stack é um signal
//    ligado a `[running]`. Chamar método em instância obtida por `viewChild`
//    seria escrever Vanilla dentro do Angular.
// 2. O TRILHO É UM `TemplateRef`, e não uma lista de elementos. Quem consome
//    declara `<ng-template>` e o componente instancia por `ngTemplateOutlet` —
//    a mesma escolha que `actions` e `approval` já fazem no `chat-thread`.
//    Montar DOM à mão perderia detecção de mudança e os inputs dos componentes
//    projetados.
//
// A RAIZ É O PRÓPRIO HOST, e não um `<form>`. No Vanilla `.nds-composer` é um
// formulário; aqui o elemento de raiz é `<nds-composer>`, que o seletor decide e
// o consumidor escreve — é ele que carrega a classe, o `data-slot` e o
// `data-state`. Embrulhar um `<form>` dentro do host somaria uma caixa que
// nenhuma outra stack tem, e o host ficaria `inline` por cima dela. Nada se
// perde: o envio nunca dependeu do `submit` nativo — a tecla é ouvida no campo e
// o botão tem manipulador próprio, nas cinco.

/** Como se pede o envio pelo teclado. */
export type ComposerSubmitOn =
  /** A tecla direta envia; com a modificadora, quebra linha. Teclado físico. */
  | 'enter'
  /** A combinação envia; a tecla direta quebra linha. É o certo no toque. */
  | 'modifier';

export interface ComposerLabels {
  /** Nome acessível do campo. */
  input: string;
  placeholder: string;
  /** Nome do botão em repouso. */
  submit: string;
  /** Nome do MESMO botão enquanto gera — troca de nome, não só de ícone. */
  stop: string;
  /** A dica de teclado. `{key}` vira a combinação que envia. */
  hint: string;
  /** Descrição do limite. `{max}` vira o número. */
  limit: string;
}

/** A combinação que envia, para a dica dizer a verdade em cada modo. */
function submitKey(submitOn: ComposerSubmitOn): string {
  return submitOn === 'enter' ? 'Enter' : 'Ctrl+Enter';
}

/** Endereço do campo e da dica. Um por instância, para o `describedby` casar. */
let instances = 0;

@Component({
  selector: 'nds-composer',
  standalone: true,
  imports: [NgTemplateOutlet, NdsButton, NdsComposerAttachments, NdsComposerTriggerPopover],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-composer',
    '[attr.data-slot]': '"composer"',
    '[attr.data-state]': 'running() ? "running" : "idle"',
    '[attr.data-disabled]': 'disabled() ? "true" : null',
  },
  template: `
    <!-- A moldura é do CONJUNTO: o campo perde borda, fundo e anel, e o anel
         acende no \`:focus-within\` daqui. Um anel só em volta do texto deixaria
         o trilho de fora do que está em foco — e ele é a mesma superfície. -->
    <div class="nds-composer-field">
      <!-- A fila vive DENTRO da moldura e ANTES do campo: os anexos fazem parte
           do que está sendo escrito, e uma fila fora dela pareceria uma lista de
           outra coisa. Sem anexo ela não existe no documento — uma lista vazia
           seria anunciada como "lista com zero itens", que promete algo que não
           há. -->
      @if (attachmentQueue(); as queue) {
        <ul
          ndsComposerAttachments
          [attachments]="queue.items"
          [labels]="queue.labels"
          (removeAttachment)="removeAttachment.emit($event)"
        ></ul>
      }

      <!-- O campo APONTA a lista: \`aria-controls\` a endereça e
           \`aria-activedescendant\` diz qual opção está ativa, sem que o foco
           saia daqui. O papel de caixa de combinação NÃO entra — a
           especificação de ARIA em HTML não o admite num campo de várias
           linhas, e o axe reprova por \`aria-allowed-role\`. -->
      <textarea
        #fieldEl
        class="nds-composer-input"
        data-slot="composer-input"
        [id]="inputId"
        [rows]="rows()"
        [value]="text()"
        [disabled]="disabled()"
        [placeholder]="labels().placeholder"
        [attr.aria-label]="labels().input"
        [attr.aria-describedby]="hintId"
        [attr.maxlength]="maxLength() ?? null"
        [attr.aria-controls]="triggerControls()"
        [attr.aria-activedescendant]="triggerActiveId()"
        (input)="onInput($event)"
        (keydown)="onKeydown($event)"
        (keyup)="onKeyup($event)"
        (click)="syncTrigger()"
        (blur)="closeTrigger()"
      ></textarea>

      <!-- O seletor só existe quando há gatilho declarado E texto para o painel
           dizer. Sem rótulo ele abriria com a frase de nenhum resultado em
           branco, que é pior que não abrir. -->
      @if (triggerText(); as popoverLabels) {
        <nds-composer-trigger-popover
          [field]="fieldEl"
          [sources]="triggers()"
          [labels]="popoverLabels"
          (applied)="onTriggerApplied($event, fieldEl)"
        />
      }
    </div>

    <div class="nds-composer-rail">
      <!-- O início é o que se ACRESCENTA à mensagem; o fim é o que se FAZ com
           ela. O contêiner existe mesmo vazio: é ele que separa os dois lados. -->
      <div class="nds-composer-rail-start">
        @if (railStart(); as rail) {
          <ng-container *ngTemplateOutlet="rail" />
        }
      </div>

      <div class="nds-composer-rail-end">
        <!-- O contador é \`aria-hidden\`, e isso é decisão, não esquecimento: ele
             muda a cada tecla, e um número reanunciado a cada letra torna o
             campo impossível de usar por audição. O limite chega UMA vez, pela
             descrição do campo, que é texto estático. -->
        @if (maxLength() !== undefined) {
          <span
            class="nds-composer-counter"
            aria-hidden="true"
            [attr.data-near-limit]="nearLimit()"
          >{{ counterText() }}</span>
        }

        <!-- O MESMO botão, com outro nome. Trocar só o ícone deixaria quem usa
             leitor de tela sem saber o que ele faz agora — e agora ele faz o
             oposto do que fazia. -->
        <button
          ndsButton
          size="sm"
          data-slot="composer-submit"
          [type]="running() ? 'button' : 'submit'"
          [disabled]="submitDisabled()"
          (click)="onAction()"
        >{{ running() ? labels().stop : labels().submit }}</button>
      </div>
    </div>

    <!-- A dica DESCREVE o campo. Saber que uma tecla envia depois de tê-la
         apertado não serve para nada. -->
    <p class="nds-composer-hint" [id]="hintId">{{ hintText() }}</p>
  `,
})
export class NdsComposer {
  /** O texto da interface. Sem padrão em inglês escondido. */
  readonly labels = input.required<ComposerLabels>();
  /** Texto inicial. O componente não guarda rascunho — quem consome guarda. */
  readonly value = input<string>('');
  /** Linhas visíveis em repouso. É contagem de linha, então acompanha a fonte. */
  readonly rows = input<number>(2);
  /** Limite de caracteres. Sem ele não há contador: contar sem teto não informa nada. */
  readonly maxLength = input<number | undefined>(undefined);
  /** Qual combinação envia. A dica muda junto, porque é ela que promete. */
  readonly submitOn = input<ComposerSubmitOn>('enter');
  /**
   * A resposta está sendo gerada.
   *
   * É ENTRADA, e não método: quem sabe se a resposta chegou é quem consome, e o
   * componente não acompanha a rede. Ligar isto troca o botão de enviar pelo de
   * interromper e impede um segundo envio no meio do primeiro.
   */
  readonly running = input<boolean>(false);
  /** Indisponibiliza o conjunto inteiro — campo, trilho e envio. */
  readonly disabled = input<boolean>(false);
  /** Controles do início do trilho — anexar, ferramentas. É um ESPAÇO. */
  readonly railStart = input<TemplateRef<unknown> | undefined>(undefined);
  /**
   * Gatilhos do seletor — menções, comandos, e qualquer outro caractere.
   *
   * Sem eles o campo é só um campo. Com eles, digitar o caractere abre o
   * seletor, e a tecla de envio passa a ESCOLHER enquanto ele estiver aberto.
   */
  readonly triggers = input<TriggerSource[]>([]);
  /** Textos do seletor. Obrigatórios quando há gatilho, porque são texto de tela. */
  readonly triggerLabels = input<TriggerPopoverLabels | undefined>(undefined);
  /**
   * Os arquivos que vão junto com a mensagem.
   *
   * O composer os DESENHA e avisa quando alguém pede para remover; subir,
   * validar e remover de verdade é de quem consome.
   */
  readonly attachments = input<Attachment[]>([]);
  /** Textos da fila de anexos. Obrigatórios quando há anexo. */
  readonly attachmentLabels = input<ComposerAttachmentLabels | undefined>(undefined);

  /** Alguém pediu para enviar. O texto vai sem espaços nas pontas. */
  readonly submitted = output<string>();
  /** Alguém pediu para interromper o que está sendo gerado. */
  readonly stopped = output<void>();
  /**
   * O texto mudou.
   *
   * Existe para o par `[(value)]` funcionar — é o equivalente desta stack ao
   * `onInput` do Vanilla, e o único caminho para quem quer guardar rascunho.
   */
  readonly valueChange = output<string>();
  /** Alguém pediu para remover um anexo, e o anexo vai junto. */
  readonly removeAttachment = output<Attachment>();

  /**
   * A fila, só quando há o que desenhar E texto para nomeá-la.
   *
   * Sem rótulo a lista abriria sem nome e com botões que não dizem o que
   * removem — pior que não existir. Mesma guarda do seletor de gatilho.
   */
  protected readonly attachmentQueue = computed(() => {
    const labels = this.attachmentLabels();
    const items = this.attachments();
    return items.length && labels ? { items, labels } : null;
  });

  protected readonly inputId = `nds-composer-${++instances}`;
  protected readonly hintId = `${this.inputId}-hint`;

  /**
   * O texto agora.
   *
   * `linkedSignal` e não `signal`: quem consome troca `value` para devolver um
   * rascunho, e o campo tem de acompanhar. Digitar não mexe em `value`, então a
   * escrita da pessoa não é desfeita a cada tecla.
   */
  protected readonly text = linkedSignal(() => this.value());

  protected readonly counterText = computed(
    () => `${this.text().length}/${this.maxLength() ?? 0}`,
  );

  /** Perto do limite muda cor E peso — cor sozinha não descreve estado. */
  protected readonly nearLimit = computed(() => {
    const max = this.maxLength();
    if (max === undefined) return null;
    return String(this.text().length >= max * 0.9);
  });

  protected readonly hintText = computed(() => {
    const base = this.labels().hint.replace('{key}', submitKey(this.submitOn()));
    const max = this.maxLength();
    if (max === undefined) return base;
    return `${base} · ${this.labels().limit.replace('{max}', String(max))}`;
  });

  /**
   * Vazio não envia. Enquanto gera, o botão continua vivo — é ele que
   * interrompe.
   */
  protected readonly submitDisabled = computed(
    () => this.disabled() || (!this.running() && this.text().trim() === ''),
  );

  // ── O seletor do caractere gatilho ─────────────────────────────────────────
  //
  // A consulta é por TIPO, e não por variável de referência: a de referência
  // fica presa ao bloco do `@if` que a declara, e o seletor é justamente
  // condicional. Assim os dois atributos do campo continuam saindo do estado
  // real do painel.

  private readonly popover = viewChild(NdsComposerTriggerPopover);

  /** Necessário para agendar `afterNextRender` fora do contexto de injeção. */
  private readonly injector = inject(Injector);

  protected readonly triggerText = computed(() =>
    this.triggers().length ? this.triggerLabels() : undefined,
  );

  /**
   * O campo aponta a lista só enquanto ela existe para ele.
   *
   * Fechada a lista os dois atributos saem: um `aria-controls` apontando um
   * painel escondido promete uma lista que não há.
   */
  protected readonly triggerControls = computed(() => {
    const popover = this.popover();
    return popover?.isOpen() ? popover.id : null;
  });

  protected readonly triggerActiveId = computed(
    () => this.popover()?.activeOptionId() ?? null,
  );

  protected onInput(event: Event): void {
    const next = (event.target as HTMLTextAreaElement).value;
    this.text.set(next);
    this.popover()?.sync();
    this.valueChange.emit(next);
  }

  /**
   * A rolagem e as setas movem o cursor sem disparar `input`.
   *
   * E o gatilho depende de ONDE o cursor está: sem isto o seletor continuaria
   * aberto sobre um `@` que ficou para trás, e não reabriria ao voltar para
   * dentro de uma menção já escrita.
   */
  protected onKeyup(event: KeyboardEvent): void {
    if (event.key.startsWith('Arrow') || event.key === 'Home' || event.key === 'End') {
      this.syncTrigger();
    }
  }

  protected syncTrigger(): void {
    this.popover()?.sync();
  }

  protected closeTrigger(): void {
    this.popover()?.close();
  }

  /**
   * A escolha chegou: o texto passa a ser o do seletor, e o cursor volta.
   *
   * O cursor é reposto DEPOIS da renderização porque `[value]` reescreve o
   * campo na próxima detecção de mudanças, e escrever `value` num campo de
   * texto leva o cursor para o fim. Repor antes seria repor no lugar errado.
   */
  protected onTriggerApplied(applied: TriggerApplied, field: HTMLTextAreaElement): void {
    this.text.set(applied.text);
    this.valueChange.emit(applied.text);
    afterNextRender(
      () => field.setSelectionRange(applied.caret, applied.caret),
      { injector: this.injector },
    );
  }

  protected onKeydown(event: KeyboardEvent): void {
    // COM O SELETOR ABERTO, AS TECLAS SÃO DELE.
    //
    // É a decisão que atravessa o componente inteiro: envio e escolha disputam
    // a mesma tecla, e enviar no meio de uma menção é o defeito que quem
    // escreve encontra na primeira vez que usa. As setas e a tecla de escape
    // também param aqui — sem isso a seta moveria o cursor no texto enquanto a
    // lista parece andar.
    const popover = this.popover();
    if (popover?.isOpen()) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        popover.move(1);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        popover.move(-1);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        popover.close();
        return;
      }
      // A tecla de envio e a de tabulação escolhem. A segunda entra porque quem
      // escreve espera que ela complete, e sem isso ela tiraria o foco do campo
      // com a lista aberta.
      if ((event.key === 'Enter' && !event.isComposing) || event.key === 'Tab') {
        if (popover.applyActive()) {
          event.preventDefault();
          return;
        }
      }
    }

    if (!this.asksToSubmit(event)) return;
    // Só aqui: sem o `preventDefault` a quebra de linha entra junto com o
    // envio, e o campo fica com um enter sobrando depois de limpo.
    event.preventDefault();
    this.submit();
  }

  protected onAction(): void {
    if (this.running()) {
      this.stopped.emit();
      return;
    }
    this.submit();
  }

  /** O evento de teclado pede envio? */
  private asksToSubmit(event: KeyboardEvent): boolean {
    if (event.key !== 'Enter') return false;
    // Composição de IME (acento morto, teclado de idioma com candidatos) usa a
    // tecla direta para CONFIRMAR o caractere. Enviar aqui interromperia quem
    // está escrevendo em japonês no meio de uma palavra — e o campo é
    // multilíngue.
    if (event.isComposing) return false;
    if (this.submitOn() === 'modifier') return event.ctrlKey || event.metaKey;
    return !event.shiftKey;
  }

  /**
   * Emite o texto e devolve o controle.
   *
   * Não limpa o campo: limpar cedo perde a mensagem quando o envio falha, e só
   * quem recebe sabe se ela saiu.
   */
  private submit(): void {
    const trimmed = this.text().trim();
    if (!trimmed || this.running() || this.disabled()) return;
    this.submitted.emit(trimmed);
  }
}
