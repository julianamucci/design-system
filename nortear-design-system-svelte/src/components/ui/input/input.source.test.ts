import { describe, expect, it } from 'vitest';
import {
  inputComErroSource,
  inputWithPlaceholderSource,
  helperSourceInputWithText,
  inputDesabilitadoSource,
  groupWithButtonSourceInput,
  groupSourceInput,
  inputPaletaEscuraSource,
  inputSenhaWithHelperSource,
  inputSource,
  inputTipoArquivoSource,
  inputTipoBuscaSource,
  inputTipoEmailSource,
  inputTipoNumeroSource,
  inputTipoSenhaSource,
  inputTipoTextoSource,
} from './input.source';

describe('inputSource', () => {
  it('sem args, entrega o par rótulo + campo com os valores padrão', () => {
    expect(inputSource()).toBe(
      `<script lang="ts">
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
</script>

<div class="nds-stack" data-spacing="xs">
  <Label for="nome">Nome completo</Label>
  <Input id="nome" type="text" placeholder="ex: João da Silva" />
</div>`,
    );
  });

  it('acompanha o control de tipo', () => {
    expect(inputSource('', { args: { type: 'email' } })).toContain('type="email"');
  });

  it('acompanha o control de placeholder, e omite o atributo quando vazio', () => {
    expect(inputSource('', { args: { placeholder: 'ex: 000.000.000-00' } })).toContain(
      'placeholder="ex: 000.000.000-00"',
    );
    expect(inputSource('', { args: { placeholder: '' } })).not.toContain('placeholder');
  });

  it('só escreve disabled quando o valor difere do padrão', () => {
    expect(inputSource('', { args: { disabled: false } })).not.toContain('disabled');
    expect(inputSource('', { args: { disabled: true } })).toContain('disabled');
  });

  it('só escreve aria-invalid no estado de erro', () => {
    expect(inputSource('', { args: { 'aria-invalid': 'false' } })).not.toContain('aria-invalid');
    expect(inputSource('', { args: { 'aria-invalid': 'true' } })).toContain('aria-invalid="true"');
  });

  it('mantém o rótulo em qualquer combinação de args', () => {
    const saida = inputSource('', { args: { type: 'password', disabled: true } });
    expect(saida).toContain('<Label for="nome">');
    expect(saida).toContain('from "@/components/ui/label"');
  });
});

describe('transforms das stories de tipo', () => {
  it('cada tipo escreve o seu próprio atributo HTML', () => {
    expect(inputTipoTextoSource()).toContain('type="text"');
    expect(inputTipoEmailSource()).toContain('type="email"');
    expect(inputTipoSenhaSource()).toContain('type="password"');
    expect(inputTipoNumeroSource()).toContain('type="number"');
    expect(inputTipoBuscaSource()).toContain('type="search"');
    expect(inputTipoArquivoSource()).toContain('type="file"');
  });

  it('o tipo arquivo não inventa placeholder, que o navegador ignoraria', () => {
    expect(inputTipoArquivoSource()).not.toContain('placeholder');
  });

  it('o estado com placeholder reaproveita a marcação do tipo email', () => {
    expect(inputWithPlaceholderSource()).toBe(inputTipoEmailSource());
  });
});

describe('transforms das stories de estado e composição', () => {
  it('o desabilitado escreve o atributo e mantém o rótulo', () => {
    const saida = inputDesabilitadoSource();
    expect(saida).toContain('disabled');
    expect(saida).toContain('<Label for="indisponivel">Campo desabilitado</Label>');
  });

  it('o erro liga a mensagem ao campo, e não confia só na cor', () => {
    const saida = inputComErroSource();
    expect(saida).toContain('aria-invalid="true"');
    expect(saida).toContain('aria-describedby="email-erro"');
    expect(saida).toContain('<p id="email-erro"');
  });

  it('o texto de apoio chega pelo mesmo caminho da descrição', () => {
    const saida = helperSourceInputWithText();
    expect(saida).toContain('aria-describedby="email-apoio"');
    expect(saida).toContain('<p id="email-apoio"');
    expect(saida).not.toContain('aria-invalid');
  });

  it('a senha com apoio traz a política ligada ao campo', () => {
    const saida = inputSenhaWithHelperSource();
    expect(saida).toContain('type="password"');
    expect(saida).toContain('aria-describedby="senha-apoio"');
  });

  it('a paleta escura mostra os três estados na mesma marcação', () => {
    const saida = inputPaletaEscuraSource();
    expect(saida.match(/<Input\b/g)).toHaveLength(3);
    expect(saida).toContain('aria-invalid="true"');
    expect(saida).toContain('disabled');
  });

  it('o grupo traz os três alinhamentos do acessório', () => {
    const saida = groupSourceInput();
    expect(saida).toContain('from "@/components/ui/input-group"');
    expect(saida).toContain('align="inline-start"');
    expect(saida).toContain('align="inline-end"');
    expect(saida).toContain('align="block-start"');
  });

  it('o grupo com ação traz o botão dentro do acessório final', () => {
    const saida = groupWithButtonSourceInput();
    expect(saida).toContain('<InputGroupButton type="button" size="icon-sm" aria-label="Limpar">');
    expect(saida).toContain('aria-hidden="true"');
  });
});
