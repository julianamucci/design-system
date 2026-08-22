import { describe, expect, it } from 'vitest';
import {
  inputOtpCompositionSnippet,
  inputOtpSnippet,
  inputOtpSource,
  inputOtpSourceWith,
  inputOtpSourceComposition,
} from './input-otp.source';

describe('inputOtpSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do conjunto', () => {
    const código = inputOtpSnippet();
    expect(código).toContain("import { createInputOTP } from '@/components/ui/input-otp';");
    expect(código).toContain('createInputOTP({');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('input-otp-slot');
  });

  it('mostra sempre o comprimento — é a única opção obrigatória da fábrica', () => {
    expect(inputOtpSnippet()).toContain('length: 6');
    expect(inputOtpSnippet({ length: 4 })).toContain('length: 4');
  });

  it('usa o nome acessível canônico, nunca o apelido depreciado', () => {
    const código = inputOtpSnippet({ 'aria-label': 'Código do aplicativo' });
    expect(código).toContain("'aria-label': 'Código do aplicativo'");
    expect(código).not.toContain('ariaLabel');
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = inputOtpSnippet({ 'aria-label': 'Código de verificação' });
    expect(código).not.toContain('aria-label');
    expect(código).not.toContain('mode');
    expect(código).not.toContain('separatorAt');
    expect(código).not.toContain('disabled');
    expect(código).not.toContain('invalid');
    expect(código).not.toContain('autoFocus');
  });

  it('mostra conjunto aceito, valor e estados quando a story os usa', () => {
    const código = inputOtpSnippet({
      mode: 'alphanumeric',
      value: '482913',
      invalid: true,
      disabled: true,
      autoFocus: true,
    });
    expect(código).toContain("mode: 'alphanumeric'");
    expect(código).toContain("value: '482913'");
    expect(código).toContain('invalid: true');
    expect(código).toContain('disabled: true');
    expect(código).toContain('autoFocus: true');
  });

  it('traduz o atalho do control para os índices que a fábrica recebe', () => {
    // O control da story é um booleano; a fábrica recebe ÍNDICES. Mostrar o
    // booleano ensinaria uma opção que não existe.
    expect(inputOtpSnippet({ withSeparator: true })).toContain('separatorAt: [3]');
    expect(inputOtpSnippet({ length: 8, withSeparator: true })).toContain('separatorAt: [4]');
    expect(inputOtpSnippet({ separatorAt: [3] })).toContain('separatorAt: [3]');
    expect(inputOtpSnippet({ withSeparator: false })).not.toContain('separatorAt');
  });

  it('liga a linha do callback quando a story o exercita', () => {
    expect(inputOtpSnippet({ onComplete: () => {} })).toContain(
      'onComplete: (codigo) => verificar(codigo)',
    );
    expect(inputOtpSnippet({ onComplete: '(codigo) => entrar(codigo)' })).toContain(
      'onComplete: (codigo) => entrar(codigo)',
    );
  });

  it('não vaza o andaime das stories', () => {
    const código = inputOtpSnippet({ withSeparator: true });
    expect(código).not.toContain('slotsDe');
    expect(código).not.toContain('withLabel');
    expect(código).not.toContain('wrap(');
  });
});

describe('inputOtpComposicaoSnippet', () => {
  it('liga o rótulo visível ao CONJUNTO, que label[for] não alcança', () => {
    const código = inputOtpCompositionSnippet({ rotulo: 'Código de verificação', ligarRotulo: true });
    expect(código).toContain("titulo.id = 'otp-rotulo';");
    expect(código).toContain("codigo.removeAttribute('aria-label');");
    expect(código).toContain("codigo.setAttribute('aria-labelledby', 'otp-rotulo');");
    expect(código).not.toContain('createLabel');
  });

  it('aponta a ajuda pelo describedBy da própria fábrica', () => {
    const código = inputOtpCompositionSnippet({ ajuda: 'Enviamos por SMS, expira em 5 min.' });
    expect(código).toContain("describedBy: 'otp-ajuda'");
    expect(código).toContain("apoio.id = 'otp-ajuda';");
  });

  it('marca o erro e aponta a mensagem pelo mesmo caminho', () => {
    const código = inputOtpCompositionSnippet({ erro: 'Código incorreto.' });
    expect(código).toContain('invalid: true');
    expect(código).toContain("describedBy: 'otp-erro'");
    expect(código).toContain("aviso.textContent = 'Código incorreto.';");
  });

  it('põe o reenvio DEPOIS do campo, com a fábrica de botão', () => {
    const código = inputOtpCompositionSnippet({ reenvio: 'Reenviar código' });
    expect(código).toContain("import { createButton } from '@/components/ui/button';");
    expect(código).toContain("createButton({ variant: 'link', size: 'sm', label: 'Reenviar código' })");
    expect(código.indexOf('createInputOTP')).toBeLessThan(código.indexOf('createButton({'));
    expect(código).toContain('append(titulo, codigo, linha)');
  });
});

describe('inputOtpSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const seis = inputOtpSource('<div data-slot="input-otp">', {});
    const quatro = inputOtpSource('<div data-slot="input-otp">', {
      args: { length: 4, invalid: true },
    });
    expect(seis).not.toBe(quatro);
    expect(quatro).toContain('length: 4');
    expect(quatro).toContain('invalid: true');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(inputOtpSource('<div data-slot="input-otp" role="group">', {})).not.toContain(
      'role="group"',
    );
  });
});

describe('inputOtpSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const código = inputOtpSourceWith({ length: 4 })('', { args: { length: 6 } });
    expect(código).toContain('length: 4');
    expect(código).not.toContain('length: 6');
  });
});

describe('inputOtpSourceComposicao', () => {
  it('troca a forma do snippet, e não só as opções', () => {
    const código = inputOtpSourceComposition({ rotulo: 'Código', ajuda: 'Expira em 5 min.' })('', {});
    expect(código).toContain("titulo.className = 'nds-text-label';");
    expect(código).toContain("titulo.textContent = 'Código';");
  });
});
