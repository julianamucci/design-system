import { describe, expect, it } from 'vitest';
import {
  inputFileSource,
  inputSearchSource,
  inputWithErrorSource,
  inputDisabledSource,
  inputEmailSource,
  inputGroupAlinhamentosSource,
  inputGroupButtonInternoSource,
  addonInputGroupClickSource,
  inputGroupWithErrorSource,
  inputGroupDisabledSource,
  inputGroupIconEndSource,
  inputGroupPrefixoESufixoSource,
  inputGroupPrefixoTextSource,
  inputGroupSenhaSource,
  inputGroupSource,
  inputNumberSource,
  inputPaletteDarkSource,
  inputSenhaSource,
  inputSource,
} from './input.source';

const SIMPLE_FIELD = [
  inputSource,
  inputEmailSource,
  inputSenhaSource,
  inputNumberSource,
  inputSearchSource,
  inputFileSource,
  inputDisabledSource,
  inputWithErrorSource,
  inputPaletteDarkSource,
];

const GROUP = [
  inputGroupSource,
  inputGroupIconEndSource,
  inputGroupPrefixoTextSource,
  inputGroupPrefixoESufixoSource,
  inputGroupButtonInternoSource,
  inputGroupSenhaSource,
  inputGroupDisabledSource,
  inputGroupWithErrorSource,
  inputGroupAlinhamentosSource,
  addonInputGroupClickSource,
];

const TODAS = [...SIMPLE_FIELD, ...GROUP];

describe('inputSource', () => {
  it('ensina a importação do design system, não a da lib headless', () => {
    const saida = inputSource();
    expect(saida).toContain('import { Input } from "@/components/ui/input";');
    expect(saida).toContain('import { Label } from "@/components/ui/label";');
  });

  it('omite o type quando é o padrão do HTML', () => {
    const saida = inputSource(undefined, { args: { type: 'text' } });
    expect(saida).not.toContain('type=');
  });

  it('escreve o type quando difere do padrão', () => {
    expect(inputSource(undefined, { args: { type: 'tel' } })).toContain('type="tel"');
  });

  it('não inventa tipo fora da lista dos controls', () => {
    expect(inputSource(undefined, { args: { type: 'roxo' } })).not.toContain('type=');
  });

  it('leva o placeholder do control para o snippet', () => {
    expect(inputSource(undefined, { args: { placeholder: 'ex: 000.000.000-00' } })).toContain(
      'placeholder="ex: 000.000.000-00"',
    );
  });

  it('cai no placeholder padrão quando o control entrega um espião', () => {
    const spy = () => 'CORPO_DO_MOCK';
    const saida = inputSource(undefined, { args: { placeholder: spy as never } });
    expect(saida).toContain('placeholder="ex: João da Silva"');
    expect(saida).not.toContain('CORPO_DO_MOCK');
  });

  it('escreve o disabled só quando ligado', () => {
    expect(inputSource(undefined, { args: { disabled: false } })).not.toContain('disabled');
    expect(inputSource(undefined, { args: { disabled: true } })).toContain('disabled');
  });

  it('ligar o erro traz a mensagem junto, e não um describedby órfão', () => {
    // `aria-describedby` apontando para um id que o snippet não contém é um
    // exemplo que ninguém lê — é o defeito que o estado de erro deveria evitar.
    const saida = inputSource(undefined, { args: { 'aria-invalid': true } });
    expect(saida).toContain('aria-invalid="true"');
    const alvo = saida.match(/aria-describedby="([a-z-]+)"/)?.[1];
    expect(alvo).toBeDefined();
    expect(saida).toContain(`<p id="${alvo}"`);
  });
});

describe('tipos', () => {
  it('cada um escreve o seu, porque o arquivo desliga os controls', () => {
    expect(inputEmailSource()).toContain('type="email"');
    expect(inputSenhaSource()).toContain('type="password"');
    expect(inputNumberSource()).toContain('type="number"');
    // É o `type` que troca o papel implícito para searchbox; nada no visual
    // denuncia se estiver errado.
    expect(inputSearchSource()).toContain('type="search"');
    expect(inputFileSource()).toContain('type="file"');
  });

  it('o campo de arquivo não finge ter placeholder', () => {
    // Quem desenha o miolo é o navegador: um texto de exemplo aqui não
    // apareceria em lugar nenhum.
    expect(inputFileSource()).not.toContain('placeholder=');
  });
});

describe('estados', () => {
  it('o desabilitado é atributo do campo, e não classe de apagamento', () => {
    expect(inputDisabledSource()).toMatch(/<Input[^>]*disabled/);
  });

  it('o erro liga a mensagem ao campo pelas duas pontas', () => {
    const saida = inputWithErrorSource();
    expect(saida).toContain('aria-invalid="true"');
    expect(saida).toContain('aria-describedby="email-erro-msg"');
    expect(saida).toContain('<p id="email-erro-msg"');
  });

  it('a paleta escura mostra os três estados sob o mesmo ancestral', () => {
    const saida = inputPaletteDarkSource();
    expect(saida).toContain('className="dark');
    expect(saida).toContain('aria-invalid="true"');
    expect(saida).toMatch(/<Input[^>]*disabled/);
    // Três campos: o assunto é a comparação entre eles.
    expect(saida.match(/<Input\s/g)).toHaveLength(3);
  });
});

describe('InputGroup', () => {
  it('o campo interno é o InputGroupInput, e nunca o Input nu', () => {
    // Quem desenha a moldura é o grupo; um `Input` dentro traria a borda
    // própria e apareceria uma linha dupla no meio.
    for (const fn of GROUP) {
      const saida = fn();
      expect(saida, `${fn.name} usa Input nu`).not.toMatch(/<Input\s/);
      expect(saida).toContain('<InputGroupInput');
      expect(saida).toContain('from "@/components/ui/input-group"');
    }
  });

  it('todo ícone dentro do grupo é decorativo', () => {
    // O nome acessível vem do rótulo (ou do `aria-label` do botão); um ícone
    // anunciado duplicaria a leitura.
    for (const fn of GROUP) {
      const saida = fn();
      for (const [, tag, atributos] of saida.matchAll(/<(Search|Mail|EyeOff|Eye|X)\b([^>]*)>/g)) {
        expect(atributos, `${fn.name}: <${tag}> sem aria-hidden`).toContain('aria-hidden="true"');
      }
    }
  });

  it('o addon muda de lado por align, e os três alinhamentos aparecem juntos', () => {
    expect(inputGroupSource()).toContain('align="inline-start"');
    expect(inputGroupIconEndSource()).toContain('align="inline-end"');
    const tres = inputGroupAlinhamentosSource();
    for (const align of ['inline-start', 'inline-end', 'block-start']) {
      expect(tres).toContain(`align="${align}"`);
    }
  });

  it('o texto do addon usa a peça própria, não um span solto', () => {
    for (const fn of [inputGroupPrefixoTextSource, inputGroupPrefixoESufixoSource]) {
      expect(fn()).toContain('<InputGroupText>');
    }
    expect(inputGroupPrefixoESufixoSource()).toContain('BRL');
  });

  it('o botão só de ícone ganha nome acessível', () => {
    for (const fn of [inputGroupButtonInternoSource, addonInputGroupClickSource]) {
      expect(fn()).toMatch(/<InputGroupButton[\s\S]*?aria-label="/);
    }
  });

  it('a senha troca o tipo E o nome do botão no mesmo estado', () => {
    // Trocar só o ícone deixaria quem usa leitor de tela sem saber o que o
    // botão passou a fazer.
    const saida = inputGroupSenhaSource();
    expect(saida).toContain('import { useState } from "react";');
    expect(saida).toContain('type={visivel ? "text" : "password"}');
    expect(saida).toContain('aria-label={visivel ? "Ocultar senha" : "Exibir senha"}');
  });

  it('o erro do grupo marca o CONTROLE, não o contêiner', () => {
    const saida = inputGroupWithErrorSource();
    expect(saida).toMatch(/<InputGroupInput[\s\S]*?aria-invalid="true"/);
    // O contêiner não carrega ARIA de validação: quem é inválido é o campo.
    expect(saida).not.toMatch(/<InputGroup\s+[^>]*aria-invalid/);
    expect(saida).toContain('<p id="email-grupo-msg"');
  });

  it('o disabled do grupo também mora no controle', () => {
    expect(inputGroupDisabledSource()).toMatch(/<InputGroupInput[^>]*disabled/);
  });
});

describe('regras que valem para todo snippet', () => {
  it('todo campo tem rótulo programático, e o for aponta para um id que existe', () => {
    for (const fn of TODAS) {
      const saida = fn();
      const targets = [...saida.matchAll(/<Label htmlFor="([a-z0-9-]+)"/g)].map(([, id]) => id);
      expect(targets.length, `${fn.name} não tem rótulo`).toBeGreaterThan(0);
      for (const alvo of targets) {
        expect(saida, `${fn.name}: for="${alvo}" sem campo`).toContain(`id="${alvo}"`);
      }
    }
  });

  it('nenhum snippet crava altura nem valor de design em style', () => {
    // A altura do campo é resultado de padding-block + line-height (WCAG
    // 1.4.4), e valor de design mora em classe `.nds-*`, nunca inline.
    for (const fn of TODAS) {
      expect(fn(), `${fn.name} usa style inline`).not.toContain('style=');
      expect(fn(), `${fn.name} crava altura`).not.toMatch(/\bheight\b/);
    }
  });

  it('nenhum snippet ensina o andaime da story', () => {
    for (const fn of TODAS) {
      const saida = fn();
      expect(saida).not.toContain('fixtures');
      expect(saida).not.toContain('{...args}');
      expect(saida).not.toContain('@base-ui');
    }
  });
});
