/**
 * Transforms do painel Code do InputOTP.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções
 * rodarem no projeto `unit` do vitest. A saída do painel não chega ao DOM
 * durante a `play`, então este é o único lugar em que elas têm guarda.
 *
 * O componente entrega as caixas pelo snippet `children({ cells })`: sem esse
 * bloco não há campo nenhum na tela, então ele aparece em todos os snippets.
 */
import { attrsMultilinha, svelteSnippet } from '@/lib/story-source';

export type InputOTPArgs = {
  maxLength: number;
  disabled: boolean;
  autoFocus: boolean;
  defaultValue: string;
  hasError: boolean;
  pattern: string;
  inputmode: 'numeric' | 'text';
  label: string;
};

const IMPORT = `import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";`;

/** Um grupo só, com uma caixa por caractere do código. */
const GROUP_UNICO = `      <InputOTPGroup>
        {#each cells as cell, i (i)}
          <InputOTPSlot {cell} />
        {/each}
      </InputOTPGroup>`;

/**
 * Monta o campo inteiro: rótulo, raiz com os atributos e o snippet das caixas.
 * `apoio` é a marcação que vem depois do campo (ajuda, erro, reenvio), já
 * indentada na coluna do bloco.
 */
function fieldOtp(opcoes: {
  label: string;
  atributos: Array<string | false | null | undefined>;
  celulas?: string;
  apoio?: string;
}): string {
  const props = attrsMultilinha(opcoes.atributos, '    ', 40);
  const abertura = props.startsWith('\n') ? `<InputOTP${props}  >` : `<InputOTP${props}>`;

  return `<div class="nds-stack" data-spacing="sm">
  <Label for="codigo">${opcoes.label}</Label>
  ${abertura}
    {#snippet children({ cells })}
${opcoes.celulas ?? GROUP_UNICO}
    {/snippet}
  </InputOTP>${opcoes.apoio ? `\n${opcoes.apoio}` : ''}
</div>`;
}

/** Estado do código, que a raiz recebe por `bind:value`. */
function estado(valueInitial = ''): string {
  return `\n\nlet codigo = $state("${valueInitial}");`;
}

/**
 * Forma canônica: um código de seis dígitos com rótulo visível. Serve o
 * Playground e todas as stories que só mudam args (comprimento, valor inicial,
 * teclado, padrão aceito, bloqueio).
 */
export function inputOtpSource(_gerado?: string, ctx?: { args?: Partial<InputOTPArgs> }): string {
  const {
    maxLength = 6,
    disabled = false,
    autoFocus = false,
    defaultValue = '',
    hasError = false,
    pattern = '',
    inputmode = 'numeric',
    label = 'Código de verificação',
  } = ctx?.args ?? {};

  return svelteSnippet(
    `${IMPORT}${estado(defaultValue)}`,
    fieldOtp({
      label,
      atributos: [
        'inputId="codigo"',
        `maxlength={${maxLength}}`,
        'bind:value={codigo}',
        `inputmode="${inputmode}"`,
        pattern ? `pattern="${pattern}"` : '',
        'autocomplete="one-time-code"',
        disabled ? 'disabled' : '',
        autoFocus ? 'autofocus' : '',
        hasError ? 'aria-invalid="true"' : '',
      ],
    }),
  );
}

/**
 * Variante com separador: dois blocos de três caixas. O separador tem papel
 * próprio, e é ele que informa que o código vem partido em dois.
 */
export function inputOtpWithSeparatorSource(): string {
  return svelteSnippet(
    `import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";${estado()}`,
    fieldOtp({
      label: 'Código de recuperação',
      atributos: [
        'inputId="codigo"',
        'maxlength={6}',
        'bind:value={codigo}',
        'inputmode="numeric"',
        'autocomplete="one-time-code"',
      ],
      celulas: `      <InputOTPGroup>
        {#each cells.slice(0, 3) as cell, i (i)}
          <InputOTPSlot {cell} />
        {/each}
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        {#each cells.slice(3) as cell, i (i)}
          <InputOTPSlot {cell} />
        {/each}
      </InputOTPGroup>`,
    }),
  );
}

/**
 * Texto de apoio: a origem e a validade do código são lidas junto com o campo,
 * por `aria-describedby`.
 */
export function helperInputOtpWithTextSource(): string {
  return svelteSnippet(
    `${IMPORT}${estado()}`,
    fieldOtp({
      label: 'Código de verificação',
      atributos: [
        'inputId="codigo"',
        'maxlength={6}',
        'bind:value={codigo}',
        'inputmode="numeric"',
        'autocomplete="one-time-code"',
        'aria-describedby="codigo-apoio"',
      ],
      apoio: `  <p id="codigo-apoio" class="nds-text-caption nds-text-muted-foreground">
    Enviamos por SMS, expira em 5 min.
  </p>`,
    }),
  );
}

/**
 * Estado de erro: `aria-invalid` marca o campo e a mensagem chega pelo mesmo
 * caminho da descrição. Serve a story de estado e a de composição.
 */
export function inputOtpWithErrorSource(): string {
  return svelteSnippet(
    `${IMPORT}${estado('482913')}`,
    fieldOtp({
      label: 'Código de verificação',
      atributos: [
        'inputId="codigo"',
        'maxlength={6}',
        'bind:value={codigo}',
        'inputmode="numeric"',
        'autocomplete="one-time-code"',
        'aria-invalid="true"',
        'aria-describedby="codigo-erro"',
      ],
      // Sem `role="alert"`: a mensagem já está no DOM quando a página carrega,
      // e uma região viva em conteúdo estático faz o leitor anunciar o erro sem
      // que nada tenha acontecido.
      apoio: `  <p id="codigo-erro" class="nds-text-caption nds-text-destructive">
    Código incorreto. Verifique e tente novamente.
  </p>`,
    }),
  );
}

/** Composição com reenvio: o botão vem depois do campo na ordem do documento. */
export function inputOtpWithReenvioSource(): string {
  return svelteSnippet(
    `${IMPORT}
import { Button } from "@/components/ui/button";${estado()}`,
    fieldOtp({
      label: 'Código de verificação',
      atributos: [
        'inputId="codigo"',
        'maxlength={6}',
        'bind:value={codigo}',
        'inputmode="numeric"',
        'autocomplete="one-time-code"',
      ],
      apoio: `  <div class="nds-cluster" data-align="center" data-spacing="xs">
    <span class="nds-text-caption nds-text-muted-foreground">Não recebeu?</span>
    <Button variant="link" size="sm" type="button">Reenviar código</Button>
  </div>`,
    }),
  );
}
