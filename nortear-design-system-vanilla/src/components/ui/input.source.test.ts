import { describe, expect, it } from 'vitest';
import {
  inputWithPrefixoSnippet,
  inputSnippet,
  inputSource,
  inputSourceWith,
  inputSourcePrefixo,
} from './input.source';

describe('inputSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = inputSnippet();
    expect(code).toContain("import { createInput } from '@/components/ui/input';");
    expect(code).toContain('createInput({');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('<input');
  });

  it('sai com o rótulo associado — campo sem nome não é anunciado por ninguém', () => {
    const code = inputSnippet();
    expect(code).toContain("import { createLabel } from '@/components/ui/label';");
    expect(code).toContain("createLabel({ text: 'Nome completo', htmlFor: 'campo' })");
    expect(code).toContain("document.querySelector('#app')?.append(rotulo, campo);");
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = inputSnippet();
    expect(code).not.toContain('type');
    expect(code).not.toContain('disabled');
    expect(code).not.toContain('aria-invalid');
    expect(code).not.toContain('aria-describedby');
  });

  it('mostra tipo, texto de exemplo e bloqueio quando a story os usa', () => {
    const code = inputSnippet({ type: 'email', placeholder: 'ex: joao@empresa.com', disabled: true });
    expect(code).toContain("type: 'email'");
    expect(code).toContain("placeholder: 'ex: joao@empresa.com'");
    expect(code).toContain('disabled: true');
  });

  it('não repete o tipo padrão, que a fábrica já assume', () => {
    expect(inputSnippet({ type: 'text' })).not.toContain('type');
  });

  it('liga a mensagem de erro ao campo pelos dois atributos', () => {
    // Borda vermelha sem `aria-invalid` não é anunciada; mensagem sem
    // `aria-describedby` não é lida junto com o campo.
    const code = inputSnippet({ id: 'email', ariaInvalid: true, mensagem: 'Email inválido.' });
    expect(code).toContain("campo.setAttribute('aria-invalid', 'true');");
    expect(code).toContain("campo.setAttribute('aria-describedby', 'email-erro');");
    expect(code).toContain("erro.id = 'email-erro';");
    expect(code).toContain('append(rotulo, campo, erro)');
  });

  it('aponta o texto de apoio e o erro no mesmo describedby', () => {
    const code = inputSnippet({ id: 'email', ajuda: 'Usaremos para notificações.', mensagem: 'Inválido.' });
    expect(code).toContain("campo.setAttribute('aria-describedby', 'email-ajuda email-erro');");
    expect(code).toContain('append(rotulo, campo, apoio, erro)');
  });

  it('mostra a paleta escura como classe do documento, não como outro campo', () => {
    const code = inputSnippet({ temaEscuro: true });
    expect(code).toContain("document.documentElement.classList.add('dark');");
    expect(code.match(/createInput\(/g)).toHaveLength(1);
  });

  it('não vaza o andaime das stories', () => {
    const code = inputSnippet({ ajuda: 'apoio' });
    expect(code).not.toContain('campoRotulado');
    expect(code).not.toContain('createFormField');
  });
});

describe('inputComPrefixoSnippet', () => {
  it('acrescenta a classe do grupo em vez de substituir a base do campo', () => {
    // A regressão que esta forma existe para não ensinar: atribuir a classe
    // apagava `.nds-input` e o campo virava um input cru do navegador.
    const code = inputWithPrefixoSnippet();
    expect(code).toContain("campo.classList.add('nds-input-group-control');");
    expect(code).not.toContain('campo.className =');
    expect(code).toContain("grupo.className = 'nds-input-group';");
    expect(code).toContain("prefixo.textContent = 'https://';");
    expect(code).toContain('append(rotulo, grupo)');
  });
});

describe('inputSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const padrão = inputSource('<input data-slot="input">', {});
    const senha = inputSource('<input data-slot="input">', {
      args: { type: 'password', disabled: true },
    });
    expect(padrão).not.toBe(senha);
    expect(senha).toContain("type: 'password'");
    expect(senha).toContain('disabled: true');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(inputSource('<input data-slot="input" aria-invalid="true">', {})).not.toContain(
      'aria-invalid',
    );
  });
});

describe('inputSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const code = inputSourceWith({ type: 'search' })('', { args: { type: 'text' } });
    expect(code).toContain("type: 'search'");
  });
});

describe('inputSourcePrefixo', () => {
  it('troca a forma do snippet, e não só as opções', () => {
    const code = inputSourcePrefixo({ label: 'URL do site', type: 'url' })('', {});
    expect(code).toContain('nds-input-group-addon');
    expect(code).toContain("createLabel({ text: 'URL do site', htmlFor: 'site' })");
  });
});
