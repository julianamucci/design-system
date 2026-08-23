/**
 * Transforms do painel Code do Textarea.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * Duas decisões valem para todos os snippets daqui:
 *
 * 1. O campo nunca aparece sozinho. Um `textarea` sem rótulo associado é um
 *    controle sem nome acessível, e o par `Label`/`id` é o que o exemplo precisa
 *    ensinar antes de qualquer prop.
 * 2. A moldura vem de classes `.nds-*`, nunca de medida cravada: o eixo de
 *    redimensionamento e a altura mínima são escolha de uso, e é por isso que
 *    elas moram no `class` e não no componente.
 */
import { attr, attrBool, attrNum, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type TextareaArgs = {
  placeholder: string;
  disabled: boolean;
  readonly: boolean;
  maxlength: number;
  rows: number;
};

const IMPORT_PAIR = `import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'`;

/** Redimensiona só na vertical, com piso de altura — a moldura padrão do campo. */
const FRAME = 'nds-resize-y nds-min-h-30';

/**
 * Abre o campo em uma linha quando os atributos cabem, e quebra um por linha
 * quando não cabem — atributo em linha longa demais some na barra de rolagem do
 * painel.
 */
function campo(atributos: Array<string | false | undefined>, recuo = 2): string {
  const p = ' '.repeat(recuo);
  const lista = atributos.filter((a): a is string => Boolean(a));
  const inLine = lista.join(' ');
  if (inLine.length <= 60) return `${p}<Textarea ${inLine} />`;
  return `${p}<Textarea\n${lista.map((a) => `${p}  ${a}`).join('\n')}\n${p}/>`;
}

/** Moldura do formulário: rótulo, campo e o que mais a composição pedir. */
function grupo(...lines: string[]): string {
  return `<div class="nds-stack nds-w-md" data-spacing="sm">
${lines.join('\n')}
</div>`;
}

function rotulo(id: string, texto: string): string {
  return `  <Label for="${id}">${texto}</Label>`;
}

/**
 * Bloco de contador. Ele é `aria-live="polite"` e carrega um `aria-label` por
 * extenso: lido cru, "123/500" vira "cento e vinte e três barra quinhentos".
 */
function counter(helper: string): string {
  return `  <div class="nds-cluster nds-text-caption nds-text-muted-foreground" data-justify="between">
    <span>${helper}</span>
    <span
      aria-live="polite"
      :aria-label="\`\${descricao.length} de \${maximo} caracteres usados\`"
    >
      {{ descricao.length }}/{{ maximo }}
    </span>
  </div>`;
}

/**
 * Forma canônica do painel: rótulo, campo e contador. Os controles decidem o
 * texto de exemplo, o limite, as linhas visíveis e os dois estados de bloqueio.
 */
export const textareaSource: SourceTransform<TextareaArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const limit = typeof args.maxlength === 'number' && args.maxlength > 0 ? args.maxlength : null;
  const lines = [
    rotulo('descricao', 'Descrição'),
    campo([
      'id="descricao"',
      'v-model="descricao"',
      limit !== null && ':maxlength="maximo"',
      attr('placeholder', args.placeholder),
      // `rows` só sobe a altura acima do piso da classe: abaixo dele não muda nada.
      attrNum('rows', args.rows, 2),
      attrBool('readonly', args.readonly, false),
      attrBool('disabled', args.disabled, false),
      `class="${FRAME}"`,
    ]),
    limit !== null && counter('Descreva o produto com clareza.'),
  ].filter((line): line is string => Boolean(line));
  const state = [
    `const descricao = ref('')`,
    limit !== null && `const maximo = ${limit}`,
  ]
    .filter(Boolean)
    .join('\n');
  return vueSnippet(`${IMPORT_PAIR}\nimport { ref } from 'vue'\n\n${state}`, grupo(...lines));
};

/**
 * O par mínimo honesto: rótulo associado pelo `id` e campo com texto de exemplo.
 * É também a composição de partida de quase toda story deste componente.
 */
export function textareaWithLabelSource(): string {
  return vueSnippet(
    IMPORT_PAIR,
    grupo(
      rotulo('descricao', 'Descrição'),
      campo(['id="descricao"', 'placeholder="ex: Descreva o produto..."', `class="${FRAME}"`]),
    ),
  );
}

/** Variante padrão: a mesma moldura, num campo de texto livre e longo. */
export function textareaDefaultSource(): string {
  return vueSnippet(
    IMPORT_PAIR,
    grupo(
      rotulo('biografia', 'Biografia'),
      campo(['id="biografia"', 'placeholder="Conte um pouco sobre você..."', `class="${FRAME}"`]),
    ),
  );
}

/**
 * Com contador: `maxlength` barra o excesso no próprio campo, e o contador conta
 * o que já foi escrito. Um sem o outro deixa o limite invisível até bater nele.
 */
export function textareaWithCounterSource(): string {
  return vueSnippet(
    `${IMPORT_PAIR}
import { ref } from 'vue'

const descricao = ref('')
const maximo = 500`,
    grupo(
      rotulo('descricao', 'Descrição'),
      campo([
        'id="descricao"',
        'v-model="descricao"',
        ':maxlength="maximo"',
        'placeholder="ex: Descreva o produto..."',
        `class="${FRAME}"`,
      ]),
      counter('Descreva com clareza.'),
    ),
  );
}

/**
 * Sem redimensionamento: cabe onde o layout em volta não sobrevive a um campo
 * que cresce. A troca é de classe, não de prop — a alça é decisão de uso.
 */
export function textareaNoRedimensionarSource(): string {
  return vueSnippet(
    IMPORT_PAIR,
    grupo(
      rotulo('feedback', 'Feedback'),
      campo([
        'id="feedback"',
        'placeholder="O que poderíamos melhorar?"',
        'class="nds-resize-none nds-min-h-30"',
      ]),
    ),
  );
}

/**
 * Preenchido na montagem: `default-value` é o valor de partida do campo
 * não-controlado. Quem precisa dirigir o texto depois usa `v-model`.
 */
export function textareaPreenchidoSource(): string {
  return vueSnippet(
    IMPORT_PAIR,
    grupo(
      rotulo('biografia', 'Biografia'),
      campo([
        'id="biografia"',
        'default-value="Designer e desenvolvedora apaixonada por design systems e acessibilidade."',
        `class="${FRAME}"`,
      ]),
    ),
  );
}

/** Desabilitado: o campo sai da ordem de tabulação e a alça trava junto. */
export function textareaDisabledSource(): string {
  return vueSnippet(
    IMPORT_PAIR,
    grupo(
      rotulo('descricao', 'Descrição'),
      campo(['id="descricao"', 'placeholder="Não disponível"', 'disabled', `class="${FRAME}"`]),
    ),
  );
}

/**
 * Somente leitura: o texto continua selecionável e copiável, ao contrário do
 * desabilitado. É o estado de quem mostra um valor já decidido.
 */
export function textareaSomenteLeituraSource(): string {
  return vueSnippet(
    IMPORT_PAIR,
    grupo(
      rotulo('observacoes', 'Observações'),
      campo([
        'id="observacoes"',
        'default-value="Pedido confirmado em 02/05/2026. Entrega prevista em até 5 dias úteis."',
        'readonly',
        `class="${FRAME}"`,
      ]),
    ),
  );
}

/**
 * Erro: `aria-invalid` marca o campo e `aria-describedby` aponta para a
 * mensagem. Sem o vínculo, o leitor de tela anuncia "inválido" sem dizer por quê.
 */
export function textareaInvalidoSource(): string {
  return vueSnippet(
    IMPORT_PAIR,
    grupo(
      rotulo('descricao', 'Descrição'),
      campo([
        'id="descricao"',
        'default-value="curto"',
        'aria-invalid="true"',
        'aria-describedby="descricao-erro"',
        `class="${FRAME}"`,
      ]),
      '  <p id="descricao-erro" class="nds-text-caption nds-text-destructive">',
      '    A descrição precisa de pelo menos 20 caracteres.',
      '  </p>',
    ),
  );
}

/**
 * Texto de apoio: a orientação vem antes do erro e vive no mesmo vínculo —
 * `aria-describedby`. Dentro do `Label`, ela viraria parte do nome do campo.
 */
export function textareaWithHelperSource(): string {
  return vueSnippet(
    IMPORT_PAIR,
    grupo(
      rotulo('biografia', 'Biografia'),
      campo([
        'id="biografia"',
        'placeholder="Conte um pouco sobre você..."',
        'aria-describedby="biografia-apoio"',
        `class="${FRAME}"`,
      ]),
      '  <p id="biografia-apoio" class="nds-text-body">Aparece no seu perfil público.</p>',
    ),
  );
}

/**
 * Campo obrigatório: o asterisco é decoração e sai da árvore de acessibilidade;
 * quem carrega a obrigatoriedade para o leitor de tela é `aria-required`. A
 * legenda embaixo é o que dá sentido ao asterisco para quem enxerga.
 */
export function textareaObrigatorioSource(): string {
  return vueSnippet(
    IMPORT_PAIR,
    grupo(
      `  <Label for="feedback">
    Feedback
    <span class="nds-text-destructive" aria-hidden="true">*</span>
  </Label>`,
      campo([
        'id="feedback"',
        'placeholder="O que poderíamos melhorar?"',
        'aria-required="true"',
        `class="${FRAME}"`,
      ]),
      '  <p class="nds-text-caption nds-text-muted-foreground">Campos com * são obrigatórios.</p>',
    ),
  );
}
