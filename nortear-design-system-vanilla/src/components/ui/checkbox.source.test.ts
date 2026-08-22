import { describe, expect, it } from 'vitest';
import {
  checkboxWithDescriptionSnippet,
  groupSnippetCheckbox,
  checkboxSelectAllSnippet,
  checkboxSnippet,
  checkboxSource,
  checkboxSourceWith,
} from './checkbox.source';

describe('checkboxSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const código = checkboxSnippet();
    expect(código).toContain("import { createCheckbox } from '@/components/ui/checkbox';");
    expect(código).toContain('createCheckbox({');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('role="checkbox"');
    expect(código).not.toContain('aria-checked');
  });

  it('usa o nome acessível canônico, nunca um apelido', () => {
    const código = checkboxSnippet({ label: undefined, 'aria-label': 'Aceitar os termos' });
    expect(código).toContain("'aria-label': 'Aceitar os termos'");
    expect(código).not.toContain('ariaLabel');
    // Sem rótulo visível não há `<label>` para associar, e o par cai fora.
    expect(código).not.toContain('htmlFor');
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = checkboxSnippet();
    expect(código).not.toContain('checked');
    expect(código).not.toContain('indeterminate');
    expect(código).not.toContain('disabled');
    expect(código).not.toContain('aria-invalid');
  });

  it('mostra os estados quando a story os usa', () => {
    expect(checkboxSnippet({ checked: true })).toContain('checked: true');
    expect(checkboxSnippet({ indeterminate: true })).toContain('indeterminate: true');

    const desabilitado = checkboxSnippet({ disabled: true });
    expect(desabilitado).toContain('disabled: true');
    // O estado alcança também a linha que envolve o par e o cursor do rótulo.
    expect(desabilitado).toContain("linha.dataset.disabled = 'true';");
    expect(desabilitado).toContain('nds-cursor-default');
    expect(checkboxSnippet()).toContain('nds-cursor-pointer');
  });

  it('o par rótulo+caixa se liga só por for/id, sem ouvinte escrito à mão', () => {
    const código = checkboxSnippet();
    expect(código).toContain("rotulo.htmlFor = 'aceite-termos'");
    expect(código).toContain("createCheckbox({ id: 'aceite-termos' })");
    // A caixa é um <button>, que é controle rotulável: o clique no texto já move
    // o foco E alterna. Um ouvinte no rótulo seria andaime.
    expect(código).not.toContain("rotulo.addEventListener('click'");
  });

  it('o estado de erro traz a mensagem e a ligação com a caixa', () => {
    const código = checkboxSnippet({ invalid: true });
    expect(código).toContain("caixa.setAttribute('aria-invalid', 'true');");
    expect(código).toContain("caixa.setAttribute('aria-describedby', 'erro-aceite-termos');");
    expect(código).toContain("mensagem.id = 'erro-aceite-termos';");
    expect(código).toContain('nds-text-destructive');
  });

  it('não deixa o espião do control vazar como código', () => {
    const código = checkboxSnippet({
      onCheckedChange: (() => {}) as unknown as string,
    });
    expect(código).not.toContain('onCheckedChange');
    expect(checkboxSnippet({ onCheckedChange: '(marcado) => registrar(marcado)' })).toContain(
      'onCheckedChange: (marcado) => registrar(marcado)',
    );
  });

  it('não vaza helper de story', () => {
    const código = checkboxSnippet({ disabled: true });
    expect(código).not.toContain('wrapWithLabel');
    expect(código).not.toContain('buildCheckboxWithLabel');
    expect(código).not.toContain('FERRAMENTAS');
    expect(código).not.toContain('Math.random');
  });
});

describe('checkboxSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = checkboxSource('<button data-slot="checkbox">', {});
    const withArgs = checkboxSource('<button data-slot="checkbox">', {
      args: { checked: true, label: 'Manter sessão ativa' },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain('checked: true');
    expect(withArgs).toContain("rotulo.textContent = 'Manter sessão ativa';");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(
      checkboxSource('<button data-slot="checkbox" role="checkbox" aria-checked="false">', {}),
    ).not.toContain('aria-checked');
  });
});

describe('checkboxSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = checkboxSourceWith({ checked: true, disabled: true });
    const código = transform('', { args: { checked: false, label: 'Manter sessão ativa' } });
    expect(código).toContain('checked: true');
    expect(código).toContain('disabled: true');
    expect(código).toContain("rotulo.textContent = 'Manter sessão ativa';");
  });
});

describe('checkboxComDescricaoSnippet', () => {
  it('o texto auxiliar fica FORA do rótulo', () => {
    const código = checkboxWithDescriptionSnippet();
    expect(código).toContain('auxiliar.textContent =');
    expect(código).toContain('textos.append(rotulo, auxiliar);');
    // Dentro do <label> a frase viraria parte do nome acessível.
    expect(código).not.toContain('rotulo.appendChild(auxiliar)');
    expect(código).not.toContain('data-slot=');
  });

  it('não ensina valor de design solto em atributo de estilo', () => {
    // A story empurra a caixa com um `marginTop` inline; o snippet não o repete.
    expect(checkboxWithDescriptionSnippet()).not.toContain('.style.');
  });
});

describe('checkboxEmGrupoSnippet', () => {
  it('com fieldset, a legenda nomeia o conjunto', () => {
    const código = groupSnippetCheckbox({ fieldset: true });
    expect(código).toContain("document.createElement('fieldset')");
    expect(código).toContain("document.createElement('legend')");
    expect(código).toContain("legenda.textContent = 'Notificações';");
    expect(código).toContain('createCheckbox({ id, checked })');
  });

  it('sem fieldset, as opções viram linhas com borda', () => {
    const código = groupSnippetCheckbox({
      legenda: 'Preferências de contato',
      itens: [
        { id: 'pref-email', label: 'Receber novidades por email', checked: true },
        { id: 'pref-sms', label: 'Alertas por SMS' },
      ],
    });
    expect(código).not.toContain('fieldset');
    expect(código).toContain("titulo.textContent = 'Preferências de contato';");
    expect(código).toContain("{ id: 'pref-email', label: 'Receber novidades por email', checked: true },");
    expect(código).toContain("{ id: 'pref-sms', label: 'Alertas por SMS' },");
    expect(código).toContain('nds-border-default');
  });
});

describe('checkboxSelecionarTodosSnippet', () => {
  it('mostra a engrenagem do estado misto: o pai é recriado, não mutado', () => {
    const código = checkboxSelectAllSnippet();
    expect(código).toContain('function estadoDoPai()');
    expect(código).toContain("return 'indeterminate';");
    expect(código).toContain('pai.replaceWith(novo);');
    expect(código).toContain('indeterminate: estado === \'indeterminate\',');
    expect(código).toContain('nds-checkbox-sublist');
    expect(código).not.toContain('data-slot=');
  });

  it('não vaza helper de story', () => {
    const código = checkboxSelectAllSnippet();
    expect(código).not.toContain('computeParentState');
    expect(código).not.toContain('makeParentCheckbox');
    expect(código).not.toContain('childCheckboxes');
  });
});
