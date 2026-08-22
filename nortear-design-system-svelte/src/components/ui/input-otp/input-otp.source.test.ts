import { describe, expect, it } from 'vitest';
import {
  inputOtpComErroSource,
  inputOtpComReenvioSource,
  inputOtpComSeparadorSource,
  helperSourceInputOtpWithText,
  inputOtpSource,
} from './input-otp.source';

describe('inputOtpSource', () => {
  it('sem args, entrega o código de seis dígitos com rótulo e estado', () => {
    expect(inputOtpSource()).toBe(
      `<script lang="ts">
  import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
  } from "@/components/ui/input-otp";
  import { Label } from "@/components/ui/label";

  let codigo = $state("");
</script>

<div class="nds-stack" data-spacing="sm">
  <Label for="codigo">Código de verificação</Label>
  <InputOTP
    inputId="codigo"
    maxlength={6}
    bind:value={codigo}
    inputmode="numeric"
    autocomplete="one-time-code"
  >
    {#snippet children({ cells })}
      <InputOTPGroup>
        {#each cells as cell, i (i)}
          <InputOTPSlot {cell} />
        {/each}
      </InputOTPGroup>
    {/snippet}
  </InputOTP>
</div>`,
    );
  });

  it('acompanha o control de comprimento', () => {
    expect(inputOtpSource('', { args: { maxLength: 4 } })).toContain('maxlength={4}');
  });

  it('acompanha o control de valor inicial, que vive no estado', () => {
    expect(inputOtpSource('', { args: { defaultValue: '482913' } })).toContain(
      'let codigo = $state("482913");',
    );
  });

  it('acompanha o control de rótulo', () => {
    expect(inputOtpSource('', { args: { label: 'PIN do aplicativo' } })).toContain(
      '<Label for="codigo">PIN do aplicativo</Label>',
    );
  });

  it('acompanha o teclado pedido e escreve o padrão só quando há um', () => {
    const alfanumerico = inputOtpSource('', {
      args: { inputmode: 'text', pattern: '^[a-zA-Z0-9]+$' },
    });
    expect(alfanumerico).toContain('inputmode="text"');
    expect(alfanumerico).toContain('pattern="^[a-zA-Z0-9]+$"');
    expect(inputOtpSource()).not.toContain('pattern');
  });

  it('só escreve disabled, autofocus e aria-invalid quando diferem do padrão', () => {
    expect(inputOtpSource()).not.toContain('disabled');
    expect(inputOtpSource()).not.toContain('autofocus');
    expect(inputOtpSource()).not.toContain('aria-invalid');
    expect(inputOtpSource('', { args: { disabled: true } })).toContain('disabled');
    expect(inputOtpSource('', { args: { autoFocus: true } })).toContain('autofocus');
    expect(inputOtpSource('', { args: { hasError: true } })).toContain('aria-invalid="true"');
  });
});

describe('transforms das stories de variação e composição', () => {
  it('o separador parte o código em dois blocos de três', () => {
    const saida = inputOtpComSeparadorSource();
    expect(saida).toContain('InputOTPSeparator');
    expect(saida).toContain('cells.slice(0, 3)');
    expect(saida).toContain('cells.slice(3)');
    expect(saida.match(/<InputOTPGroup>/g)).toHaveLength(2);
  });

  it('o texto de apoio é lido junto com o campo', () => {
    const saida = helperSourceInputOtpWithText();
    expect(saida).toContain('aria-describedby="codigo-apoio"');
    expect(saida).toContain('<p id="codigo-apoio"');
    expect(saida).not.toContain('aria-invalid');
  });

  it('o erro marca o campo e liga a mensagem pelo mesmo caminho', () => {
    const saida = inputOtpComErroSource();
    expect(saida).toContain('aria-invalid="true"');
    expect(saida).toContain('aria-describedby="codigo-erro"');
    expect(saida).toContain('<p id="codigo-erro"');
    // A story nasce com o código completo: é o erro depois da tentativa.
    expect(saida).toContain('let codigo = $state("482913");');
  });

  it('o reenvio vem depois do campo na ordem do documento', () => {
    const saida = inputOtpComReenvioSource();
    expect(saida).toContain('from "@/components/ui/button"');
    expect(saida.indexOf('</InputOTP>')).toBeLessThan(saida.indexOf('Reenviar código'));
  });
});
