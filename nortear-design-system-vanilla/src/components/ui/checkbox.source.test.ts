import { describe, expect, it } from 'vitest';
import {
  checkboxWithDescriptionSnippet,
  groupCheckboxSnippet,
  checkboxSelectAllSnippet,
  checkboxSnippet,
  checkboxSource,
  checkboxSourceWith,
} from './checkbox.source';

describe('checkboxSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = checkboxSnippet();
    expect(code).toContain("import { createCheckbox } from '@/components/ui/checkbox';");
    expect(code).toContain('createCheckbox({');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('role="checkbox"');
    expect(code).not.toContain('aria-checked');
  });

  it('usa o nome acessível canônico, nunca um apelido', () => {
    const code = checkboxSnippet({ label: undefined, 'aria-label': 'Aceitar os termos' });
    expect(code).toContain("'aria-label': 'Aceitar os termos'");
    expect(code).not.toContain('ariaLabel');
    // Sem rótulo visível não há `<label>` para associar, e o par cai fora.
    expect(code).not.toContain('htmlFor');
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = checkboxSnippet();
    expect(code).not.toContain('checked');
    expect(code).not.toContain('indeterminate');
    expect(code).not.toContain('disabled');
    expect(code).not.toContain('aria-invalid');
  });

  it('mostra os estados quando a story os usa', () => {
    expect(checkboxSnippet({ checked: true })).toContain('checked: true');
    expect(checkboxSnippet({ indeterminate: true })).toContain('indeterminate: true');

    const disabled = checkboxSnippet({ disabled: true });
    expect(disabled).toContain('disabled: true');
    // O estado alcança também a linha que envolve o par e o cursor do rótulo.
    expect(disabled).toContain("linha.dataset.disabled = 'true';");
    expect(disabled).toContain('nds-cursor-default');
    expect(checkboxSnippet()).toContain('nds-cursor-pointer');
  });

  it('o par rótulo+caixa se liga só por for/id, sem ouvinte escrito à mão', () => {
    const code = checkboxSnippet();
    expect(code).toContain("rotulo.htmlFor = 'aceite-termos'");
    expect(code).toContain("createCheckbox({ id: 'aceite-termos' })");
    // A caixa é um <button>, que é controle rotulável: o clique no texto já move
    // o foco E alterna. Um ouvinte no rótulo seria andaime.
    expect(code).not.toContain("rotulo.addEventListener('click'");
  });

  it('o estado de erro traz a mensagem e a ligação com a caixa', () => {
    const code = checkboxSnippet({ invalid: true });
    expect(code).toContain("caixa.setAttribute('aria-invalid', 'true');");
    expect(code).toContain("caixa.setAttribute('aria-describedby', 'erro-aceite-termos');");
    expect(code).toContain("mensagem.id = 'erro-aceite-termos';");
    expect(code).toContain('nds-text-destructive');
  });

  it('não deixa o espião do control vazar como código', () => {
    const code = checkboxSnippet({
      onCheckedChange: (() => {}) as unknown as string,
    });
    expect(code).not.toContain('onCheckedChange');
    expect(checkboxSnippet({ onCheckedChange: '(marcado) => registrar(marcado)' })).toContain(
      'onCheckedChange: (marcado) => registrar(marcado)',
    );
  });

  it('não vaza helper de story', () => {
    const code = checkboxSnippet({ disabled: true });
    expect(code).not.toContain('wrapWithLabel');
    expect(code).not.toContain('buildCheckboxWithLabel');
    expect(code).not.toContain('FERRAMENTAS');
    expect(code).not.toContain('Math.random');
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
    const code = transform('', { args: { checked: false, label: 'Manter sessão ativa' } });
    expect(code).toContain('checked: true');
    expect(code).toContain('disabled: true');
    expect(code).toContain("rotulo.textContent = 'Manter sessão ativa';");
  });
});

describe('checkboxComDescricaoSnippet', () => {
  it('o texto auxiliar fica FORA do rótulo', () => {
    const code = checkboxWithDescriptionSnippet();
    expect(code).toContain('auxiliar.textContent =');
    expect(code).toContain('textos.append(rotulo, auxiliar);');
    // Dentro do <label> a frase viraria parte do nome acessível.
    expect(code).not.toContain('rotulo.appendChild(auxiliar)');
    expect(code).not.toContain('data-slot=');
  });

  it('não ensina valor de design solto em atributo de estilo', () => {
    // A story empurra a caixa com um `marginTop` inline; o snippet não o repete.
    expect(checkboxWithDescriptionSnippet()).not.toContain('.style.');
  });
});

describe('checkboxEmGrupoSnippet', () => {
  it('com fieldset, a legenda nomeia o conjunto', () => {
    const code = groupCheckboxSnippet({ fieldset: true });
    expect(code).toContain("document.createElement('fieldset')");
    expect(code).toContain("document.createElement('legend')");
    expect(code).toContain("legenda.textContent = 'Notificações';");
    expect(code).toContain('createCheckbox({ id, checked })');
  });

  it('sem fieldset, as opções viram linhas com borda', () => {
    const code = groupCheckboxSnippet({
      caption: 'Preferências de contato',
      items: [
        { id: 'pref-email', label: 'Receber novidades por email', checked: true },
        { id: 'pref-sms', label: 'Alertas por SMS' },
      ],
    });
    expect(code).not.toContain('fieldset');
    expect(code).toContain("titulo.textContent = 'Preferências de contato';");
    expect(code).toContain("{ id: 'pref-email', label: 'Receber novidades por email', checked: true },");
    expect(code).toContain("{ id: 'pref-sms', label: 'Alertas por SMS' },");
    expect(code).toContain('nds-border-default');
  });
});

describe('checkboxSelecionarTodosSnippet', () => {
  it('mostra a engrenagem do estado misto: o pai é recriado, não mutado', () => {
    const code = checkboxSelectAllSnippet();
    expect(code).toContain('function estadoDoPai()');
    expect(code).toContain("return 'indeterminate';");
    expect(code).toContain('pai.replaceWith(novo);');
    expect(code).toContain('indeterminate: estado === \'indeterminate\',');
    expect(code).toContain('nds-checkbox-sublist');
    expect(code).not.toContain('data-slot=');
  });

  it('não vaza helper de story', () => {
    const code = checkboxSelectAllSnippet();
    expect(code).not.toContain('computeParentState');
    expect(code).not.toContain('makeParentCheckbox');
    expect(code).not.toContain('childCheckboxes');
  });
});
