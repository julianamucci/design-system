/**
 * Transforms do painel Code do Textarea.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 *
 * O invólucro das stories monta rótulo, contador e mensagem de erro em volta do
 * campo; aqui só entra o que a pessoa precisa copiar. `nds-resize-y` e o
 * `min-height` da demo ficam de fora: a folha compartilhada já entrega
 * `resize: vertical` e altura mínima, e repetir default ensina ruído.
 */
import { attrsMultilinha, svelteSnippet } from '@/lib/story-source';

export type TextareaArgs = {
  placeholder: string;
  disabled: boolean;
  readonly: boolean;
  'aria-invalid': 'true' | 'false';
  maxLength: number;
};

const IMPORT = `import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";`;

/**
 * Monta a tag do campo já indentada para dentro do bloco de composição: uma
 * linha por atributo quando a fila fica longa demais para o painel.
 */
function tagTextarea(partes: Array<string | false | ''>): string {
  const props = attrsMultilinha(partes, '    ', 52);
  return props.endsWith('\n') ? `<Textarea${props}  />` : `<Textarea${props} />`;
}

/** Bloco `<script>` com os imports e o estado do campo. */
function script(valorInicial = ''): string {
  return `${IMPORT}

let value = $state(${JSON.stringify(valorInicial)});`;
}

/**
 * Forma canônica: rótulo ligado ao campo pelo `for`/`id` e o valor no `$state`.
 * Serve o Playground de `textarea.stories.ts` e cascateia para as stories sem
 * composição própria (Focus, e os defaults de variantes e estados).
 */
export function textareaSource(_gerado?: string, ctx?: { args?: Partial<TextareaArgs> }): string {
  const {
    placeholder = '',
    disabled = false,
    readonly = false,
    'aria-invalid': invalido = 'false',
    maxLength,
  } = ctx?.args ?? {};

  const campo = tagTextarea([
    'id="descricao"',
    'bind:value',
    placeholder ? `placeholder="${placeholder}"` : '',
    maxLength ? `maxlength={${maxLength}}` : '',
    disabled && 'disabled',
    readonly && 'readonly',
    invalido === 'true' && 'aria-invalid="true"',
  ]);

  // O contador é o par do `maxlength`: sem o limite não há o que contar.
  const contador = maxLength
    ? `
  <div class="nds-cluster nds-text-caption nds-text-muted-foreground" data-justify="between">
    <span>Descreva o produto com clareza.</span>
    <span aria-live="polite" aria-label="{value.length} de ${maxLength} caracteres usados">
      {value.length}/${maxLength}
    </span>
  </div>`
    : '';

  return svelteSnippet(
    script(),
    `<div class="nds-stack nds-max-w-md" data-spacing="sm">
  <Label for="descricao">Descrição</Label>
  ${campo}${contador}
</div>`,
  );
}

/** Variante padrão: campo simples, com o redimensionamento vertical da folha. */
export function textareaDefaultSource(): string {
  return svelteSnippet(
    script(),
    `<div class="nds-stack nds-max-w-md" data-spacing="sm">
  <Label for="biografia">Biografia</Label>
  <Textarea id="biografia" bind:value placeholder="Conte um pouco sobre você..." />
</div>`,
  );
}

/** Variante com contador: `maxlength` no campo e a contagem anunciada ao vivo. */
export function textareaWithCounterSource(): string {
  return svelteSnippet(
    script(),
    `<div class="nds-stack nds-max-w-md" data-spacing="sm">
  <Label for="descricao">Descrição</Label>
  <Textarea
    id="descricao"
    bind:value
    placeholder="ex: Camiseta de algodão, gola redonda..."
    maxlength={500}
  />
  <div class="nds-cluster nds-text-caption nds-text-muted-foreground" data-justify="between">
    <span>Descreva com clareza.</span>
    <span aria-live="polite" aria-label="{value.length} de 500 caracteres usados">
      {value.length}/500
    </span>
  </div>
</div>`,
  );
}

/** Variante sem redimensionamento: a alça de arrastar sai pela classe. */
export function textareaNoRedimensionarSource(): string {
  return svelteSnippet(
    script(),
    `<div class="nds-stack nds-max-w-md" data-spacing="sm">
  <Label for="feedback">Feedback</Label>
  <Textarea
    id="feedback"
    bind:value
    placeholder="O que poderíamos melhorar?"
    class="nds-resize-none"
  />
</div>`,
  );
}

/** Estado preenchido: o valor inicial mora no `$state`, não num atributo. */
export function textareaPreenchidoSource(): string {
  return svelteSnippet(
    script('Camiseta de algodão pima, gola redonda, manga curta. Tamanhos P, M, G e GG.'),
    `<div class="nds-stack nds-max-w-md" data-spacing="sm">
  <Label for="biografia">Biografia</Label>
  <Textarea id="biografia" bind:value />
</div>`,
  );
}

/** Estado desabilitado: sem foco, sem digitação e sem alça de redimensionar. */
export function textareaDisabledSource(): string {
  return svelteSnippet(
    script(),
    `<div class="nds-stack nds-max-w-md" data-spacing="sm">
  <Label for="descricao">Descrição</Label>
  <Textarea id="descricao" bind:value placeholder="Não disponível" disabled />
</div>`,
  );
}

/** Estado inválido: `aria-invalid` e a mensagem apontada pelo `aria-describedby`. */
export function textareaInvalidoSource(): string {
  return svelteSnippet(
    script('curto'),
    `<div class="nds-stack nds-max-w-md" data-spacing="sm">
  <Label for="descricao">Descrição</Label>
  <Textarea
    id="descricao"
    bind:value
    aria-invalid="true"
    aria-describedby="descricao-erro"
  />
  <p id="descricao-erro" class="nds-text-caption nds-text-destructive">
    A descrição precisa de pelo menos 20 caracteres.
  </p>
</div>`,
  );
}

/** Estado somente leitura: o texto continua selecionável e o campo, focável. */
export function textareaSomenteLeituraSource(): string {
  return svelteSnippet(
    script('Pedido confirmado em 02/05/2026. Entrega prevista em até 5 dias úteis.'),
    `<div class="nds-stack nds-max-w-md" data-spacing="sm">
  <Label for="observacoes">Observações</Label>
  <Textarea id="observacoes" bind:value readonly />
</div>`,
  );
}

/** Composição com texto de apoio: o parágrafo abaixo do campo, sem erro. */
export function textareaWithHelperSource(): string {
  return svelteSnippet(
    script(),
    `<div class="nds-stack nds-max-w-md" data-spacing="sm">
  <Label for="descricao">Descrição</Label>
  <Textarea id="descricao" bind:value placeholder="ex: Descreva o produto..." />
  <p class="nds-text-caption nds-text-muted-foreground">
    Descreva o produto com clareza.
  </p>
</div>`,
  );
}

/** Composição do contador acessível: `aria-live` e rótulo por extenso. */
export function textareaCounterAccessibleSource(): string {
  return svelteSnippet(
    script(),
    `<div class="nds-stack nds-max-w-md" data-spacing="sm">
  <Label for="biografia">Biografia</Label>
  <Textarea
    id="biografia"
    bind:value
    placeholder="Conte um pouco sobre você..."
    maxlength={200}
  />
  <div class="nds-cluster nds-text-caption nds-text-muted-foreground" data-justify="between">
    <span>Use até 200 caracteres.</span>
    <span aria-live="polite" aria-label="{value.length} de 200 caracteres usados">
      {value.length}/200
    </span>
  </div>
</div>`,
  );
}

/** Composição com erro: a mensagem existe no DOM e é apontada pelo campo. */
export function textareaWithErrorSource(): string {
  return svelteSnippet(
    script(),
    `<div class="nds-stack nds-max-w-md" data-spacing="sm">
  <Label for="feedback">Feedback</Label>
  <Textarea
    id="feedback"
    bind:value
    placeholder="O que poderíamos melhorar?"
    aria-invalid="true"
    aria-describedby="feedback-erro"
  />
  <p id="feedback-erro" class="nds-text-caption nds-text-destructive">
    O feedback precisa ter pelo menos 10 caracteres.
  </p>
</div>`,
  );
}

/** Composição em modal: campo travado no tamanho para não empurrar a caixa. */
export function textareaEmModalSource(): string {
  return svelteSnippet(
    script(),
    `<div class="nds-stack nds-max-w-md" data-spacing="sm">
  <Label for="observacoes">Observações</Label>
  <Textarea
    id="observacoes"
    bind:value
    placeholder="Adicione observações relevantes..."
    class="nds-resize-none"
  />
  <p class="nds-text-caption nds-text-muted-foreground">
    Sem redimensionamento — ideal para modais.
  </p>
</div>`,
  );
}
