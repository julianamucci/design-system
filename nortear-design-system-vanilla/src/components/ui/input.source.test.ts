import { describe, expect, it } from 'vitest';
import {
  inputComPrefixoSnippet,
  inputSnippet,
  inputSource,
  inputSourceCom,
  inputSourcePrefixo,
} from './input.source';

describe('inputSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const código = inputSnippet();
    expect(código).toContain("import { createInput } from '@/components/ui/input';");
    expect(código).toContain('createInput({');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('<input');
  });

  it('sai com o rótulo associado — campo sem nome não é anunciado por ninguém', () => {
    const código = inputSnippet();
    expect(código).toContain("import { createLabel } from '@/components/ui/label';");
    expect(código).toContain("createLabel({ text: 'Nome completo', htmlFor: 'campo' })");
    expect(código).toContain("document.querySelector('#app')?.append(rotulo, campo);");
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = inputSnippet();
    expect(código).not.toContain('type');
    expect(código).not.toContain('disabled');
    expect(código).not.toContain('aria-invalid');
    expect(código).not.toContain('aria-describedby');
  });

  it('mostra tipo, texto de exemplo e bloqueio quando a story os usa', () => {
    const código = inputSnippet({ type: 'email', placeholder: 'ex: joao@empresa.com', disabled: true });
    expect(código).toContain("type: 'email'");
    expect(código).toContain("placeholder: 'ex: joao@empresa.com'");
    expect(código).toContain('disabled: true');
  });

  it('não repete o tipo padrão, que a fábrica já assume', () => {
    expect(inputSnippet({ type: 'text' })).not.toContain('type');
  });

  it('liga a mensagem de erro ao campo pelos dois atributos', () => {
    // Borda vermelha sem `aria-invalid` não é anunciada; mensagem sem
    // `aria-describedby` não é lida junto com o campo.
    const código = inputSnippet({ id: 'email', ariaInvalid: true, mensagem: 'Email inválido.' });
    expect(código).toContain("campo.setAttribute('aria-invalid', 'true');");
    expect(código).toContain("campo.setAttribute('aria-describedby', 'email-erro');");
    expect(código).toContain("erro.id = 'email-erro';");
    expect(código).toContain('append(rotulo, campo, erro)');
  });

  it('aponta o texto de apoio e o erro no mesmo describedby', () => {
    const código = inputSnippet({ id: 'email', ajuda: 'Usaremos para notificações.', mensagem: 'Inválido.' });
    expect(código).toContain("campo.setAttribute('aria-describedby', 'email-ajuda email-erro');");
    expect(código).toContain('append(rotulo, campo, apoio, erro)');
  });

  it('mostra a paleta escura como classe do documento, não como outro campo', () => {
    const código = inputSnippet({ temaEscuro: true });
    expect(código).toContain("document.documentElement.classList.add('dark');");
    expect(código.match(/createInput\(/g)).toHaveLength(1);
  });

  it('não vaza o andaime das stories', () => {
    const código = inputSnippet({ ajuda: 'apoio' });
    expect(código).not.toContain('campoRotulado');
    expect(código).not.toContain('createFormField');
  });
});

describe('inputComPrefixoSnippet', () => {
  it('acrescenta a classe do grupo em vez de substituir a base do campo', () => {
    // A regressão que esta forma existe para não ensinar: atribuir a classe
    // apagava `.nds-input` e o campo virava um input cru do navegador.
    const código = inputComPrefixoSnippet();
    expect(código).toContain("campo.classList.add('nds-input-group-control');");
    expect(código).not.toContain('campo.className =');
    expect(código).toContain("grupo.className = 'nds-input-group';");
    expect(código).toContain("prefixo.textContent = 'https://';");
    expect(código).toContain('append(rotulo, grupo)');
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
    const código = inputSourceCom({ type: 'search' })('', { args: { type: 'text' } });
    expect(código).toContain("type: 'search'");
  });
});

describe('inputSourcePrefixo', () => {
  it('troca a forma do snippet, e não só as opções', () => {
    const código = inputSourcePrefixo({ label: 'URL do site', type: 'url' })('', {});
    expect(código).toContain('nds-input-group-addon');
    expect(código).toContain("createLabel({ text: 'URL do site', htmlFor: 'site' })");
  });
});
