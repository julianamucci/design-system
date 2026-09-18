import { describe, expect, it } from 'vitest';
import {
  inputWithErrorSource,
  inputWithPlaceholderSource,
  helperInputWithTextSource,
  inputDisabledSource,
  groupWithButtonInputSource,
  groupInputSource,
  inputPaletteDarkSource,
  inputSenhaWithHelperSource,
  inputSource,
  inputTypeFileSource,
  inputTypeSearchSource,
  inputTypeEmailSource,
  inputTypeNumberSource,
  inputTypeSenhaSource,
  inputTypeTextSource,
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
    const output = inputSource('', { args: { type: 'password', disabled: true } });
    expect(output).toContain('<Label for="nome">');
    expect(output).toContain('from "@/components/ui/label"');
  });
});

describe('transforms das stories de tipo', () => {
  it('cada tipo escreve o seu próprio atributo HTML', () => {
    expect(inputTypeTextSource()).toContain('type="text"');
    expect(inputTypeEmailSource()).toContain('type="email"');
    expect(inputTypeSenhaSource()).toContain('type="password"');
    expect(inputTypeNumberSource()).toContain('type="number"');
    expect(inputTypeSearchSource()).toContain('type="search"');
    expect(inputTypeFileSource()).toContain('type="file"');
  });

  it('o tipo arquivo não inventa placeholder, que o navegador ignoraria', () => {
    expect(inputTypeFileSource()).not.toContain('placeholder');
  });

  it('o estado com placeholder reaproveita a marcação do tipo email', () => {
    expect(inputWithPlaceholderSource()).toBe(inputTypeEmailSource());
  });
});

describe('transforms das stories de estado e composição', () => {
  it('o desabilitado escreve o atributo e mantém o rótulo', () => {
    const output = inputDisabledSource();
    expect(output).toContain('disabled');
    expect(output).toContain('<Label for="indisponivel">Campo desabilitado</Label>');
  });

  it('o erro liga a mensagem ao campo, e não confia só na cor', () => {
    const output = inputWithErrorSource();
    expect(output).toContain('aria-invalid="true"');
    expect(output).toContain('aria-describedby="email-erro"');
    expect(output).toContain('<p id="email-erro"');
  });

  it('o texto de apoio chega pelo mesmo caminho da descrição', () => {
    const output = helperInputWithTextSource();
    expect(output).toContain('aria-describedby="email-apoio"');
    expect(output).toContain('<p id="email-apoio"');
    expect(output).not.toContain('aria-invalid');
  });

  it('a senha com apoio traz a política ligada ao campo', () => {
    const output = inputSenhaWithHelperSource();
    expect(output).toContain('type="password"');
    expect(output).toContain('aria-describedby="senha-apoio"');
  });

  it('a paleta escura mostra os três estados na mesma marcação', () => {
    const output = inputPaletteDarkSource();
    expect(output.match(/<Input\b/g)).toHaveLength(3);
    expect(output).toContain('aria-invalid="true"');
    expect(output).toContain('disabled');
  });

  it('o grupo traz os três alinhamentos do acessório', () => {
    const output = groupInputSource();
    expect(output).toContain('from "@/components/ui/input-group"');
    expect(output).toContain('align="inline-start"');
    expect(output).toContain('align="inline-end"');
    expect(output).toContain('align="block-start"');
  });

  it('o grupo com ação traz o botão dentro do acessório final', () => {
    const output = groupWithButtonInputSource();
    expect(output).toContain('<InputGroupButton type="button" size="icon-sm" aria-label="Limpar">');
    expect(output).toContain('aria-hidden="true"');
  });
});
