import { describe, expect, it } from 'vitest';
import {
  textareaFormSnippet,
  textareaSnippet,
  textareaSource,
  textareaSourceWith,
} from './textarea.source';

describe('textareaSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = textareaSnippet();
    expect(code).toContain("import { createTextarea } from '@/components/ui/textarea';");
    expect(code).toContain('createTextarea({');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('<textarea');
  });

  it('nomeia o campo pelo rótulo — a fábrica não tem nome acessível próprio', () => {
    const code = textareaSnippet();
    expect(code).toContain("createLabel({ htmlFor: 'descricao', text: 'Descrição' })");
    expect(code).toContain("id: 'descricao'");
  });

  it('a medida vem de utilitário, nunca de style inline', () => {
    const code = textareaSnippet();
    expect(code).toContain("class: 'nds-resize-y nds-min-h-30'");
    expect(code).not.toContain('style');
    expect(code).not.toContain('minHeight');
  });

  it('omite o que a story não pede', () => {
    const code = textareaSnippet();
    expect(code).not.toContain('rows');
    expect(code).not.toContain('disabled');
    expect(code).not.toContain('maxLength');
    expect(code).not.toContain('readOnly');
    expect(code).not.toContain('aria-invalid');
  });

  it('mostra as opções da fábrica quando a story as usa', () => {
    const code = textareaSnippet({ rows: 3, disabled: true, value: 'Rascunho', name: 'bio' });
    expect(code).toContain('rows: 3');
    expect(code).toContain('disabled: true');
    expect(code).toContain("value: 'Rascunho'");
    expect(code).toContain("name: 'bio'");
  });

  it('o que não é opção da fábrica vai pela API do DOM, e não como opção falsa', () => {
    // `readOnly`, `maxLength` e `aria-invalid` NÃO existem em `TextareaOptions`:
    // mostrá-los dentro da chamada seria inventar API.
    const code = textareaSnippet({ readOnly: true, maxLength: 280, ariaInvalid: true });
    expect(code).toContain('campo.readOnly = true;');
    expect(code).toContain('campo.maxLength = 280;');
    expect(code).toContain("campo.setAttribute('aria-invalid', 'true');");
    expect(code).not.toContain('readOnly: true');
    expect(code).not.toContain('maxLength: 280');
  });

  it('a direção do redimensionamento vira a classe correspondente', () => {
    expect(textareaSnippet({ resize: 'none' })).toContain('nds-resize-none');
    expect(textareaSnippet({ resize: 'free' })).toContain("class: 'nds-resize nds-min-h-30'");
  });

  it('o contador é anunciado, e não só desenhado', () => {
    const code = textareaSnippet({ maxLength: 500, hint: 'Descreva com clareza.' });
    expect(code).toContain("contador.setAttribute('aria-live', 'polite')");
    expect(code).toContain('caracteres usados');
    expect(code).toContain("apoio.textContent = 'Descreva com clareza.'");
    expect(code).toContain("campo.addEventListener('input', atualizar)");
  });

  it('a mensagem de erro é apontada por aria-describedby', () => {
    const code = textareaSnippet({ error: 'A descrição precisa de 20 caracteres.' });
    expect(code).toContain("campo.setAttribute('aria-describedby', 'descricao-erro');");
    expect(code).toContain("mensagem.id = 'descricao-erro'");
    expect(code).toContain('nds-text-destructive');
  });

  it('não vaza o andaime das stories', () => {
    const code = textareaSnippet({ maxLength: 500 });
    expect(code).not.toContain('buildLabeled');
    expect(code).not.toContain('createTextareaField');
    expect(code).not.toContain('labeled(');
    expect(code).not.toContain('CLASSE_DE_RESIZE');
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
    const code = textareaSourceWith({ resize: 'none' })('', { args: { resize: 'y' } });
    expect(code).toContain('nds-resize-none');
    expect(code).not.toContain('nds-resize-y');
  });
});

describe('textareaFormularioSnippet', () => {
  it('é o `name` que faz o valor chegar ao FormData', () => {
    const code = textareaFormSnippet({ name: 'feedback', maxLength: 280 });
    expect(code).toContain("name: 'feedback'");
    expect(code).toContain('new FormData(formulario)');
    expect(code).toContain("dados.get('feedback')");
    expect(code).toContain("createButton({ type: 'submit', label: 'Enviar' })");
    // O grupo do campo entra no formulário — não há duas montagens na página.
    expect(code.match(/document\.querySelector\('#app'\)/g)).toHaveLength(1);
  });
});
