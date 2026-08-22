import { describe, expect, it } from 'vitest';
import {
  inputOtpAlfanumericoSource,
  inputOtpWithErrorSource,
  inputOtpWithReenvioSource,
  inputOtpWithSeparatorSource,
  inputOtpWithTextAuxiliarSource,
  inputOtpCompletoSource,
  inputOtpDisabledSource,
  inputOtpPreenchendoSource,
  inputOtpQuatroDigitosSource,
  inputOtpSource,
  inputOtpEmptySource,
} from './input-otp.source';

const TODAS = [
  inputOtpSource,
  inputOtpQuatroDigitosSource,
  inputOtpWithSeparatorSource,
  inputOtpAlfanumericoSource,
  inputOtpEmptySource,
  inputOtpPreenchendoSource,
  inputOtpCompletoSource,
  inputOtpDisabledSource,
  inputOtpWithErrorSource,
  inputOtpWithTextAuxiliarSource,
  inputOtpWithReenvioSource,
];

describe('inputOtpSource', () => {
  it('ensina a importação do design system, não a da lib headless', () => {
    const saida = inputOtpSource();
    expect(saida).toContain('} from "@/components/ui/input-otp";');
    expect(saida).toContain('InputOTPSlot');
  });

  it('nunca imprime a fixture que as stories usam para achar o campo', () => {
    // Era o defeito literal: o painel imprimia `campo(canvasElement)`, que só
    // existe no módulo de fixtures, e o snippet não compilava colado.
    for (const fn of TODAS) {
      expect(fn(), `${fn.name} vaza a fixture`).not.toContain('campo(');
      expect(fn()).not.toContain('fixtures');
    }
  });

  it('o espião de onComplete não vira código no painel', () => {
    // O Storybook entrega `onComplete` como FUNÇÃO; interpolá-la despejaria o
    // corpo do mock como se fosse API do design system.
    const spy = () => 'CORPO_DO_MOCK';
    const saida = inputOtpSource(undefined, { args: { onComplete: spy as never } });
    expect(saida).not.toContain('CORPO_DO_MOCK');
    expect(saida).toContain('onComplete={(valor) => verificarCodigo(valor)}');
  });

  it('o comprimento do control manda nas duas pontas ao mesmo tempo', () => {
    // `maxLength` e a contagem de caixas são o MESMO número: declarar seis
    // slots num campo de quatro deixa duas caixas mortas na tela.
    const saida = inputOtpSource(undefined, { args: { maxLength: 4 } });
    expect(saida).toContain('maxLength={4}');
    expect(saida).toContain('{ length: 4 }');
  });

  it('cai em seis dígitos quando o control não diz nada', () => {
    expect(inputOtpSource()).toContain('maxLength={6}');
    expect(inputOtpSource()).toContain('{ length: 6 }');
  });

  it('escreve disabled e autoFocus só quando ligados', () => {
    expect(inputOtpSource()).not.toContain('disabled');
    expect(inputOtpSource(undefined, { args: { disabled: true } })).toContain('disabled');
    expect(inputOtpSource(undefined, { args: { autoFocus: true } })).toContain('autoFocus');
  });
});

describe('o contrato que faz o componente funcionar', () => {
  it('todo snippet é controlado: sem value/onChange as caixas ficam vazias', () => {
    for (const fn of TODAS) {
      const saida = fn();
      expect(saida, `${fn.name} sem estado`).toContain('import { useState } from "react";');
      expect(saida).toContain('value={codigo}');
      expect(saida).toContain('onChange={setCodigo}');
    }
  });

  it('todo snippet pede o código de uso único e escolhe o teclado', () => {
    // São os dois atributos que fazem o sistema oferecer o código que acabou de
    // chegar por SMS — o motivo de existir do componente.
    for (const fn of TODAS) {
      const saida = fn();
      expect(saida, `${fn.name} sem autoComplete`).toContain('autoComplete="one-time-code"');
      expect(saida).toMatch(/inputMode="(numeric|text)"/);
    }
  });

  it('todo snippet dá nome acessível pelo par htmlFor ↔ id', () => {
    // O `<input>` real fica recortado atrás das caixas: sem rótulo ligado, o
    // campo não tem nome nenhum para quem usa leitor de tela.
    for (const fn of TODAS) {
      const saida = fn();
      const alvo = saida.match(/<Label htmlFor="([a-z0-9-]+)"/)?.[1];
      expect(alvo, `${fn.name} sem rótulo`).toBeDefined();
      expect(saida).toContain(`id="${alvo}"`);
    }
  });
});

describe('variantes', () => {
  it('o PIN de quatro casa o maxLength com a contagem de caixas', () => {
    const saida = inputOtpQuatroDigitosSource();
    expect(saida).toContain('maxLength={4}');
    expect(saida).toContain('{ length: 4 }');
  });

  it('o separador divide a LEITURA, e o campo continua sendo um só', () => {
    const saida = inputOtpWithSeparatorSource();
    expect(saida).toContain('<InputOTPSeparator />');
    expect(saida).toContain('maxLength={6}');
    // Índices explícitos e contínuos entre os dois grupos: é o que mostra que a
    // quebra é visual, não de valor.
    for (let i = 0; i < 6; i += 1) expect(saida).toContain(`index={${i}}`);
    expect(saida.match(/<InputOTPGroup>/g)).toHaveLength(2);
  });

  it('o alfanumérico troca o pattern E o teclado', () => {
    // O componente recusa tudo que não for dígito por padrão; aceitar letra sem
    // trocar o `inputMode` abriria o teclado numérico para um código com letras.
    const saida = inputOtpAlfanumericoSource();
    expect(saida).toContain('import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";');
    expect(saida).toContain('pattern={REGEXP_ONLY_DIGITS_AND_CHARS}');
    expect(saida).toContain('inputMode="text"');
  });
});

describe('estados', () => {
  it('o vazio nasce com o cursor posto', () => {
    const saida = inputOtpEmptySource();
    expect(saida).toContain('autoFocus');
    expect(saida).toContain('useState("")');
  });

  it('preenchendo e completo se distinguem pelo valor inicial', () => {
    expect(inputOtpPreenchendoSource()).toContain('useState("123")');
    expect(inputOtpCompletoSource()).toContain('useState("482913")');
    // O código cheio é justamente quando `onComplete` dispara.
    expect(inputOtpCompletoSource()).toContain('onComplete=');
  });

  it('o bloqueado é atributo do campo', () => {
    expect(inputOtpDisabledSource()).toMatch(/<InputOTP[\s\S]*?\n\s+disabled\n/);
  });

  it('o erro liga a mensagem ao campo pelas duas pontas', () => {
    const saida = inputOtpWithErrorSource();
    expect(saida).toContain('aria-invalid="true"');
    const alvo = saida.match(/aria-describedby="([a-z0-9-]+)"/)?.[1];
    expect(alvo).toBeDefined();
    expect(saida).toContain(`<p id="${alvo}"`);
    // Sem `role="alert"`: a mensagem já está no DOM ao carregar, e uma live
    // region em conteúdo estático faz o leitor anunciar erro sem que nada tenha
    // acontecido.
    expect(saida).not.toContain('role="alert"');
  });
});

describe('composições', () => {
  it('o texto auxiliar é ligado, e não só posto ao lado', () => {
    const saida = inputOtpWithTextAuxiliarSource();
    expect(saida).toContain('aria-describedby="codigo-ajuda-texto"');
    expect(saida).toContain('<p id="codigo-ajuda-texto"');
  });

  it('o reenvio vem DEPOIS do campo na ordem do DOM', () => {
    // Quem termina de digitar encontra o reenvio no próximo Tab, sem voltar
    // pelo caminho.
    const saida = inputOtpWithReenvioSource();
    expect(saida.indexOf('</InputOTP>')).toBeLessThan(saida.indexOf('<Button'));
    expect(saida).toContain('import { Button } from "@/components/ui/button";');
  });

  it('nenhum snippet crava altura nem valor de design em style', () => {
    for (const fn of TODAS) {
      expect(fn(), `${fn.name} usa style inline`).not.toContain('style=');
      expect(fn(), `${fn.name} crava altura`).not.toMatch(/\bheight\b/);
    }
  });
});
