import {
  Directive,
  ElementRef,
  computed,
  contentChild,
  effect,
  inject,
  input,
  signal,
  type AfterContentInit,
} from '@angular/core';
import { NgControl } from '@angular/forms';

// ─── Form ─────────────────────────────────────────────────────────────────────
//
// Visual: classes .nds-form-* (docs/shared/styles/nds/form.css).
//
// ESTA STACK DIVERGE NA API, e a divergência é para registrar, não para
// "alinhar". Nas outras stacks o Form é a costura com uma lib de estado de
// formulário — react-hook-form, vee-validate, formsnap — e boa parte do que
// elas expõem (valor, touched, dirty, erros de validação) é a lib falando.
//
// No Angular esse estado já tem dono: os Reactive Forms. `FormGroup`,
// `FormControl`, `Validators` e `formControlName` são API do framework, e
// reimplementá-los aqui daria DOIS donos para a mesma informação — o mesmo
// motivo pelo qual o Input recusou o `RdxInputDirective` (ver input.ts).
//
// O que sobra é justamente o que a lib de estado NÃO faz, e é o que quebra na
// mão de quem monta formulário: a costura de ACESSIBILIDADE em volta do campo.
// É só isso que este arquivo entrega:
//
//   · o <label> aponta para o controle (`for` ↔ `id`), com id gerado quando falta
//   · descrição e mensagem entram no `aria-describedby` do controle
//   · a mensagem de erro nasce com `aria-live="polite"`, então é anunciada
//   · `aria-invalid` acompanha o `FormControl` (inválido E tocado ou sujo)
//   · o rótulo ganha `data-error`, que é o que o CSS usa para pintá-lo
//
// A fiação é FEITA PELO CAMPO, em uma direção só: `NdsFormField` acha o
// controle e escreve nele e no rótulo. As peças menores (label, descrição,
// mensagem) são diretivas mudas — carregam classe, `data-slot` e o próprio id.
// A alternativa, cada peça injetando o campo para pedir um id, criaria
// dependência circular entre as classes deste arquivo sem entregar nada.
//
// Markup e classes seguem o Vanilla (`createFormField` / `createFieldset`):
// `div.nds-form-field` com `data-slot="field"`, `p.nds-form-description` com
// `data-slot="field-description"`, `p.nds-form-error` com
// `data-slot="field-error"`.

// ─── Ids ──────────────────────────────────────────────────────────────────────

/**
 * Contador de módulo. Não é `crypto.randomUUID()` de propósito: id estável e
 * curto aparece legível no `aria-describedby` e não polui o diff de snapshot.
 */
let sequencia = 0;

function nextId(prefixo: string): string {
  sequencia += 1;
  return `nds-${prefixo}-${sequencia}`;
}

// ─── Peças mudas ──────────────────────────────────────────────────────────────

/**
 * O rótulo do campo.
 *
 * NÃO se combina com `ndsLabel` no mesmo elemento: as duas diretivas ligariam
 * `data-slot` no mesmo host, uma sobrescrevendo a outra em ordem não declarada
 * (a armadilha 11 do CLAUDE.md desta stack). Dentro de um campo, o rótulo é
 * este — `.nds-form-label` é a regra que o CSS do Form define, e é ela que
 * reage a `data-error`.
 *
 * Sem `for` próprio: quem escreve o `for` é quem compõe, e quando ele falta o
 * `NdsFormField` o preenche. Um host binding aqui brigaria com o atributo
 * escrito à mão.
 */
@Directive({
  selector: 'label[ndsFormLabel]',
  standalone: true,
  host: {
    class: 'nds-form-label',
    '[attr.data-slot]': '"label"',
  },
})
export class NdsFormLabel {}

/**
 * Texto de apoio abaixo do controle — formato esperado, política, exemplo.
 *
 * O id existe para o `aria-describedby`: sem ele a descrição é vista e não é
 * ouvida. Um id escrito à mão vence o gerado, para o caso de quem compõe já
 * apontar outro `aria-describedby` para cá.
 */
@Directive({
  selector: 'p[ndsFormDescription]',
  standalone: true,
  host: {
    class: 'nds-form-description',
    '[attr.data-slot]': '"field-description"',
    '[attr.id]': 'id',
  },
})
export class NdsFormDescription {
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Lido no construtor: atributo estático do template já está no elemento. */
  readonly id: string = this.hostRef.nativeElement.id || nextId('form-description');
}

/**
 * A mensagem de erro do campo.
 *
 * `aria-live="polite"` no próprio elemento, como no Vanilla: quando a mensagem
 * entra por `@if`, o leitor de tela anuncia sem roubar o foco de quem digita.
 * `role="alert"` seria assertivo demais para erro de campo — interromperia a
 * digitação a cada tecla em validação `change`.
 */
@Directive({
  selector: 'p[ndsFormMessage]',
  standalone: true,
  host: {
    class: 'nds-form-error',
    'aria-live': 'polite',
    '[attr.data-slot]': '"field-error"',
    '[attr.id]': 'id',
  },
})
export class NdsFormMessage {
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly id: string = this.hostRef.nativeElement.id || nextId('form-message');
}

/**
 * Agrupamento semântico de campos relacionados.
 *
 * NÃO se combina com `ndsRadioGroup` no mesmo `<fieldset>` — mesma disputa de
 * `data-slot` do rótulo. Um grupo de rádios já é o próprio agrupamento; se ele
 * precisar conviver com outros campos, o `ndsFieldset` fica no elemento de fora.
 */
@Directive({
  selector: 'fieldset[ndsFieldset]',
  standalone: true,
  host: {
    class: 'nds-form-fieldset',
    '[attr.data-slot]': '"fieldset"',
  },
})
export class NdsFieldset {}

/** O rótulo do agrupamento. Leitores de tela o anunciam antes de cada campo. */
@Directive({
  selector: 'legend[ndsFieldsetLegend]',
  standalone: true,
  host: {
    class: 'nds-form-legend',
    '[attr.data-slot]': '"fieldset-legend"',
  },
})
export class NdsFieldsetLegend {}

/**
 * O `<form>` em si.
 *
 * Não há `.nds-form` no CSS compartilhado e não se inventa uma: o que falta ao
 * elemento é ritmo vertical entre os campos, e isso já existe em
 * `.nds-stack` (16px por padrão, o mesmo gap do fieldset). Quem quiser outro
 * espaçamento escreve `data-spacing` no mesmo elemento.
 *
 * A diretiva não toca em `[formGroup]` nem em `(ngSubmit)` — esses são dos
 * Reactive Forms e continuam sendo escritos no mesmo elemento.
 */
@Directive({
  selector: 'form[ndsForm]',
  standalone: true,
  host: {
    class: 'nds-stack',
    '[attr.data-slot]': '"form"',
  },
})
export class NdsForm {}

// ─── O campo ──────────────────────────────────────────────────────────────────

/**
 * Ordem de prioridade para achar o controle dentro do campo.
 *
 * `querySelector` devolve o primeiro elemento em ordem de DOM, não o primeiro
 * seletor que casa — por isso a busca é seletor a seletor. Os `data-slot` vêm
 * antes dos elementos nativos de propósito: checkbox, switch e select desta
 * stack renderizam um `<input>` escondido para participar do formulário, e ele
 * casaria com `input:not([type="hidden"])` antes do controle de verdade.
 */
const SELECTORS_CONTROL = [
  '[data-slot="input-group-control"]',
  '[data-slot="checkbox"]',
  '[data-slot="switch"]',
  '[data-slot="select-trigger"]',
  '[data-slot="slider"]',
  'input:not([type="hidden"])',
  'textarea',
  'select',
];

interface StateControl {
  invalid: boolean;
  touched: boolean;
  dirty: boolean;
}

/**
 * O campo: label + controle + descrição + mensagem, com a fiação acessível
 * feita a partir do que foi projetado dentro dele.
 */
@Directive({
  selector: 'div[ndsFormField]',
  standalone: true,
  exportAs: 'ndsFormField',
  host: {
    class: 'nds-form-field',
    '[attr.data-slot]': '"field"',
    '[attr.data-invalid]': 'invalido() ? "true" : null',
  },
})
export class NdsFormField implements AfterContentInit {
  /**
   * Força o estado inválido do campo.
   *
   * Ausente (o padrão) significa "o `FormControl` decide". Existe para os dois
   * casos em que não há `FormControl`: validação vinda do servidor e exemplo de
   * documentação, onde o estado é o assunto e não há formulário atrás.
   */
  readonly invalid = input<boolean | undefined>(undefined);

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly descricao = contentChild(NdsFormDescription, { descendants: true });
  private readonly mensagem = contentChild(NdsFormMessage, { descendants: true });

  /**
   * O `NgControl` que `formControlName` / `[formControl]` / `ngModel` provê no
   * elemento do controle. Ausente quando o campo é usado sem Reactive Forms —
   * e é por isso que tudo aqui é opcional.
   */
  private readonly ngControl = contentChild(NgControl, { descendants: true });

  /**
   * Espelho do `FormControl` em signal, porque `AbstractControl` não é reativo
   * a signals. A comparação por conteúdo evita re-fiar o DOM a cada tecla: o
   * `events` do controle emite em toda mudança de valor, e só três bits dele
   * interessam.
   */
  private readonly state = signal<StateControl | null>(null, {
    equal: (a, b) =>
      a === b ||
      (!!a && !!b && a.invalid === b.invalid && a.touched === b.touched && a.dirty === b.dirty),
  });

  /**
   * Inválido é `invalid && (touched || dirty)`, não `invalid` puro: um campo
   * obrigatório nasce inválido, e marcar de vermelho um formulário que ninguém
   * tocou ainda é acusar quem acabou de chegar.
   */
  readonly invalido = computed(() => {
    const manual = this.invalid();
    if (manual !== undefined) return manual;
    const e = this.state();
    return !!e && e.invalid && (e.touched || e.dirty);
  });

  /**
   * Só há o que dizer sobre validade quando existe fonte de verdade. Sem isso,
   * um `aria-invalid="true"` escrito à mão no controle seria APAGADO pelo campo
   * — que é o oposto do que quem escreveu queria.
   */
  private readonly gerenciaValidade = computed(
    () => this.invalid() !== undefined || this.state() !== null,
  );

  /** Ids que quem compõe já tinha escrito no controle — preservados na junção. */
  private describedByEscrito: string[] | null = null;

  private readonly idBase = nextId('form-field');

  constructor() {
    // Assinatura do FormControl. `events` cobre valor, status, touched e
    // pristine numa emissão só — três `subscribe` separados dariam o mesmo
    // resultado com três chances de esquecer um.
    effect((onCleanup) => {
      const controle = this.ngControl()?.control ?? null;
      if (!controle) {
        this.state.set(null);
        return;
      }
      const ler = () =>
        this.state.set({
          invalid: controle.invalid,
          touched: controle.touched,
          dirty: controle.dirty,
        });
      ler();
      const inscricao = controle.events.subscribe(ler);
      onCleanup(() => inscricao.unsubscribe());
    });

    // A fiação em si. Roda de novo quando a mensagem entra ou sai, quando a
    // descrição aparece e quando a validade muda.
    effect(() => this.aplicar());
  }

  /**
   * Uma passada síncrona antes do primeiro `effect`, para que o DOM já esteja
   * ligado quando alguém consultar logo depois da renderização — `effect` roda
   * depois da detecção de mudanças, e um teste que lê `aria-describedby` na
   * primeira linha veria o campo ainda sem fio.
   */
  ngAfterContentInit(): void {
    this.aplicar();
  }

  private findControl(): HTMLElement | null {
    const raiz = this.hostRef.nativeElement;
    for (const selector of SELECTORS_CONTROL) {
      const encontrado = raiz.querySelector<HTMLElement>(selector);
      if (encontrado) return encontrado;
    }
    return null;
  }

  private aplicar(): void {
    const raiz = this.hostRef.nativeElement;
    const descricao = this.descricao();
    const mensagem = this.mensagem();
    const invalido = this.invalido();
    const gerenciaValidade = this.gerenciaValidade();

    const controle = this.findControl();
    const rotulo = raiz.querySelector<HTMLLabelElement>('label');

    if (rotulo) {
      // `for` só quando falta. Label que ENVOLVE o controle já está associado
      // pela estrutura, e escrever `for` ali não acrescenta nada.
      if (controle && !rotulo.getAttribute('for') && !rotulo.contains(controle)) {
        if (!controle.id) controle.id = `${this.idBase}-control`;
        rotulo.setAttribute('for', controle.id);
      }
      // `.nds-form-label[data-error="true"]` é o seletor que pinta o rótulo de
      // destructive. Sem o atributo, o erro só existiria abaixo do campo.
      if (invalido) rotulo.setAttribute('data-error', 'true');
      else rotulo.removeAttribute('data-error');
    }

    if (!controle) return;

    // Junção, não substituição: quem compõe pode já ter apontado o controle
    // para um texto fora do campo, e sobrescrever descartaria essa instrução.
    this.describedByEscrito ??= (controle.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .filter(Boolean);

    const ids = [
      ...this.describedByEscrito,
      ...(descricao ? [descricao.id] : []),
      ...(mensagem ? [mensagem.id] : []),
    ];
    if (ids.length) controle.setAttribute('aria-describedby', ids.join(' '));
    else controle.removeAttribute('aria-describedby');

    if (!gerenciaValidade) return;
    if (invalido) controle.setAttribute('aria-invalid', 'true');
    else controle.removeAttribute('aria-invalid');
  }
}

/** A família inteira — conveniência para o `imports` de quem compõe. */
export const NDS_FORM = [
  NdsForm,
  NdsFormField,
  NdsFormLabel,
  NdsFormDescription,
  NdsFormMessage,
  NdsFieldset,
  NdsFieldsetLegend,
] as const;
