import { describe, expect, it } from 'vitest';
import {
  textareaFormSnippet,
  textareaSnippet,
  textareaSource,
  textareaSourceWith,
} from './textarea.source';

describe('textareaSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const código = textareaSnippet();
    expect(código).toContain("import { createTextarea } from '@/components/ui/textarea';");
    expect(código).toContain('createTextarea({');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('<textarea');
  });

  it('nomeia o campo pelo rótulo — a fábrica não tem nome acessível próprio', () => {
    const código = textareaSnippet();
    expect(código).toContain("createLabel({ htmlFor: 'descricao', text: 'Descrição' })");
    expect(código).toContain("id: 'descricao'");
  });

  it('a medida vem de utilitário, nunca de style inline', () => {
    const código = textareaSnippet();
    expect(código).toContain("class: 'nds-resize-y nds-min-h-30'");
    expect(código).not.toContain('style');
    expect(código).not.toContain('minHeight');
  });

  it('omite o que a story não pede', () => {
    const código = textareaSnippet();
    expect(código).not.toContain('rows');
    expect(código).not.toContain('disabled');
    expect(código).not.toContain('maxLength');
    expect(código).not.toContain('readOnly');
    expect(código).not.toContain('aria-invalid');
  });

  it('mostra as opções da fábrica quando a story as usa', () => {
    const código = textareaSnippet({ rows: 3, disabled: true, value: 'Rascunho', name: 'bio' });
    expect(código).toContain('rows: 3');
    expect(código).toContain('disabled: true');
    expect(código).toContain("value: 'Rascunho'");
    expect(código).toContain("name: 'bio'");
  });

  it('o que não é opção da fábrica vai pela API do DOM, e não como opção falsa', () => {
    // `readOnly`, `maxLength` e `aria-invalid` NÃO existem em `TextareaOptions`:
    // mostrá-los dentro da chamada seria inventar API.
    const código = textareaSnippet({ readOnly: true, maxLength: 280, ariaInvalid: true });
    expect(código).toContain('campo.readOnly = true;');
    expect(código).toContain('campo.maxLength = 280;');
    expect(código).toContain("campo.setAttribute('aria-invalid', 'true');");
    expect(código).not.toContain('readOnly: true');
    expect(código).not.toContain('maxLength: 280');
  });

  it('a direção do redimensionamento vira a classe correspondente', () => {
    expect(textareaSnippet({ resize: 'none' })).toContain('nds-resize-none');
    expect(textareaSnippet({ resize: 'free' })).toContain("class: 'nds-resize nds-min-h-30'");
  });

  it('o contador é anunciado, e não só desenhado', () => {
    const código = textareaSnippet({ maxLength: 500, hint: 'Descreva com clareza.' });
    expect(código).toContain("contador.setAttribute('aria-live', 'polite')");
    expect(código).toContain('caracteres usados');
    expect(código).toContain("apoio.textContent = 'Descreva com clareza.'");
    expect(código).toContain("campo.addEventListener('input', atualizar)");
  });

  it('a mensagem de erro é apontada por aria-describedby', () => {
    const código = textareaSnippet({ erro: 'A descrição precisa de 20 caracteres.' });
    expect(código).toContain("campo.setAttribute('aria-describedby', 'descricao-erro');");
    expect(código).toContain("mensagem.id = 'descricao-erro'");
    expect(código).toContain('nds-text-destructive');
  });

  it('não vaza o andaime das stories', () => {
    const código = textareaSnippet({ maxLength: 500 });
    expect(código).not.toContain('buildLabeled');
    expect(código).not.toContain('createTextareaField');
    expect(código).not.toContain('labeled(');
    expect(código).not.toContain('CLASSE_DE_RESIZE');
  });
});

describe('textareaSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = textareaSource('<textarea data-slot="textarea">', {});
    const withArgs = textareaSource('<textarea data-slot="textarea">', {
      args: { rows: 6, maxLength: 280, resize: 'none' },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain('rows: 6');
    expect(withArgs).toContain('campo.maxLength = 280;');
    expect(withArgs).toContain('nds-resize-none');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(textareaSource('<textarea data-slot="textarea" rows="3">', {})).not.toContain(
      'data-slot=',
    );
  });
});

describe('textareaSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const código = textareaSourceWith({ resize: 'none' })('', { args: { resize: 'y' } });
    expect(código).toContain('nds-resize-none');
    expect(código).not.toContain('nds-resize-y');
  });
});

describe('textareaFormularioSnippet', () => {
  it('é o `name` que faz o valor chegar ao FormData', () => {
    const código = textareaFormSnippet({ name: 'feedback', maxLength: 280 });
    expect(código).toContain("name: 'feedback'");
    expect(código).toContain('new FormData(formulario)');
    expect(código).toContain("dados.get('feedback')");
    expect(código).toContain("createButton({ type: 'submit', label: 'Enviar' })");
    // O grupo do campo entra no formulário — não há duas montagens na página.
    expect(código.match(/document\.querySelector\('#app'\)/g)).toHaveLength(1);
  });
});
