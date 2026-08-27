import { describe, expect, it } from 'vitest';
import { editorSnippet, editorSource, editorSourceWith } from './editor.source';

describe('editorSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = editorSnippet();
    expect(code).toContain("import { createEditor } from '@/components/ui/editor';");
    expect(code).toContain('createEditor({');
    expect(code).toContain("document.querySelector('#app')?.append(editor);");
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('role="toolbar"');
  });

  it('mostra os rótulos, que a fábrica exige', () => {
    const code = editorSnippet();
    expect(code).toContain('const labels = {');
    expect(code).toContain("toolbar: 'Formatação'");
    expect(code).toContain("editorField: 'Corpo do texto'");
    expect(code).toContain('labels: labels');
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = editorSnippet();
    expect(code).not.toContain('editable');
    expect(code).not.toContain('preset');
    expect(code).not.toContain('content:');
    expect(code).not.toContain('resolveImage');
    expect(code).not.toContain('describeImage');
    expect(code).not.toContain('class:');
  });

  it('mostra as opções quando a story as usa', () => {
    expect(editorSnippet({ editable: false })).toContain('editable: false');
    expect(editorSnippet({ preset: 'basic' })).toContain("preset: 'basic'");
    expect(editorSnippet({ content: '<p>Olá</p>' })).toContain("content: '<p>Olá</p>'");
    expect(editorSnippet({ class: 'nds-w-full' })).toContain("class: 'nds-w-full'");
  });

  it('não repete `advanced`, que é o padrão, mesmo quando a story o declara', () => {
    expect(editorSnippet({ preset: 'advanced' })).not.toContain('preset');
  });

  it('nunca imprime a função que os args trazem no lugar do corpo do callback', () => {
    const noop = (() => undefined) as unknown as string;
    const code = editorSnippet({ onChange: noop, resolveImage: noop, describeImage: noop });
    expect(code).not.toContain('onChange');
    expect(code).not.toContain('resolveImage');
    expect(code).not.toContain('describeImage');
  });

  it('imprime o corpo do callback quando ele chega como texto', () => {
    expect(editorSnippet({ onChange: '(html) => salvar(html)' })).toContain(
      'onChange: (html) => salvar(html)',
    );
    expect(editorSnippet({ resolveImage: '(file) => enviarAoCdn(file)' })).toContain(
      'resolveImage: (file) => enviarAoCdn(file)',
    );
    expect(editorSnippet({ describeImage: '(file, src) => descrever(file, src)' })).toContain(
      'describeImage: (file, src) => descrever(file, src)',
    );
  });

  it('quebra em várias linhas quando a chamada não cabe em uma', () => {
    const code = editorSnippet({ content: '<p>Um parágrafo longo o bastante para quebrar</p>' });
    expect(code).toContain('createEditor({\n');
  });
});

describe('editorSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = editorSource('<div data-slot="editor">', {});
    const withArgs = editorSource('<div data-slot="editor">', { args: { preset: 'basic' } });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain("preset: 'basic'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(editorSource('<div data-slot="editor" class="nds-editor">', {})).not.toContain(
      'data-slot',
    );
  });
});

describe('editorSourceWith', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = editorSourceWith({ preset: 'basic', editable: false });
    const code = transform('', { args: { preset: 'advanced', editable: true } });
    expect(code).toContain("preset: 'basic'");
    expect(code).toContain('editable: false');
  });

  it('vale para a costura de armazenamento própria', () => {
    const code = editorSourceWith({ resolveImage: '(file) => enviarAoCdn(file)' })('', {});
    expect(code).toContain('resolveImage: (file) => enviarAoCdn(file)');
  });
});
