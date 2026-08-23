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
    const code = inputOtpSnippet();
    expect(code).toContain("import { createInputOTP } from '@/components/ui/input-otp';");
    expect(code).toContain('createInputOTP({');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('input-otp-slot');
  });

  it('mostra sempre o comprimento — é a única opção obrigatória da fábrica', () => {
    expect(inputOtpSnippet()).toContain('length: 6');
    expect(inputOtpSnippet({ length: 4 })).toContain('length: 4');
  });

  it('usa o nome acessível canônico, nunca o apelido depreciado', () => {
    const code = inputOtpSnippet({ 'aria-label': 'Código do aplicativo' });
    expect(code).toContain("'aria-label': 'Código do aplicativo'");
    expect(code).not.toContain('ariaLabel');
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = inputOtpSnippet({ 'aria-label': 'Código de verificação' });
    expect(code).not.toContain('aria-label');
    expect(code).not.toContain('mode');
    expect(code).not.toContain('separatorAt');
    expect(code).not.toContain('disabled');
    expect(code).not.toContain('invalid');
    expect(code).not.toContain('autoFocus');
  });

  it('mostra conjunto aceito, valor e estados quando a story os usa', () => {
    const code = inputOtpSnippet({
      mode: 'alphanumeric',
      value: '482913',
      invalid: true,
      disabled: true,
      autoFocus: true,
    });
    expect(code).toContain("mode: 'alphanumeric'");
    expect(code).toContain("value: '482913'");
    expect(code).toContain('invalid: true');
    expect(code).toContain('disabled: true');
    expect(code).toContain('autoFocus: true');
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
    const code = inputOtpSnippet({ withSeparator: true });
    expect(code).not.toContain('slotsDe');
    expect(code).not.toContain('withLabel');
    expect(code).not.toContain('wrap(');
  });
});

describe('inputOtpComposicaoSnippet', () => {
  it('liga o rótulo visível ao CONJUNTO, que label[for] não alcança', () => {
    const code = inputOtpCompositionSnippet({ label: 'Código de verificação', ligarRotulo: true });
    expect(code).toContain("titulo.id = 'otp-rotulo';");
    expect(code).toContain("codigo.removeAttribute('aria-label');");
    expect(code).toContain("codigo.setAttribute('aria-labelledby', 'otp-rotulo');");
    expect(code).not.toContain('createLabel');
  });

  it('aponta a ajuda pelo describedBy da própria fábrica', () => {
    const code = inputOtpCompositionSnippet({ ajuda: 'Enviamos por SMS, expira em 5 min.' });
    expect(code).toContain("describedBy: 'otp-ajuda'");
    expect(code).toContain("apoio.id = 'otp-ajuda';");
  });

  it('marca o erro e aponta a mensagem pelo mesmo caminho', () => {
    const code = inputOtpCompositionSnippet({ error: 'Código incorreto.' });
    expect(code).toContain('invalid: true');
    expect(code).toContain("describedBy: 'otp-erro'");
    expect(code).toContain("aviso.textContent = 'Código incorreto.';");
  });

  it('põe o reenvio DEPOIS do campo, com a fábrica de botão', () => {
    const code = inputOtpCompositionSnippet({ reenvio: 'Reenviar código' });
    expect(code).toContain("import { createButton } from '@/components/ui/button';");
    expect(code).toContain("createButton({ variant: 'link', size: 'sm', label: 'Reenviar código' })");
    expect(code.indexOf('createInputOTP')).toBeLessThan(code.indexOf('createButton({'));
    expect(code).toContain('append(titulo, codigo, linha)');
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
    const code = inputOtpSourceWith({ length: 4 })('', { args: { length: 6 } });
    expect(code).toContain('length: 4');
    expect(code).not.toContain('length: 6');
  });
});

describe('inputOtpSourceComposicao', () => {
  it('troca a forma do snippet, e não só as opções', () => {
    const code = inputOtpSourceComposition({ label: 'Código', ajuda: 'Expira em 5 min.' })('', {});
    expect(code).toContain("titulo.className = 'nds-text-label';");
    expect(code).toContain("titulo.textContent = 'Código';");
  });
});
