import { describe, expect, it } from 'vitest';
import {
  editorAdvancedSource,
  editorAiImageDescriptionSource,
  editorBasicSource,
  editorCustomImageStorageSource,
  editorReadOnlySource,
  editorSource,
  editorWithImageSource,
  editorWithTableSource,
} from './editor.source';

describe('editorSource', () => {
  it('sem args, entrega o conjunto avançado com o callback de mudança', () => {
    const output = editorSource();
    expect(output).toContain('import { Editor } from "@/components/ui/editor";');
    expect(output).toContain('let html = $state("");');
    expect(output).toContain('preset="advanced"');
    expect(output).toContain('onchange={(valor) => (html = valor)}');
    // `labels` é obrigatório e é a única coisa que o leitor de tela tem para
    // anunciar: nenhum exemplo pode sair sem ele.
    expect(output).toContain('{labels}');
  });

  it('o conjunto do control chega ao snippet', () => {
    expect(editorSource('', { args: { preset: 'basic' } })).toContain('preset="basic"');
  });

  it('o conteúdo inicial entra como expressão, com as aspas do HTML intactas', () => {
    const output = editorSource('', { args: { content: '<p>a <strong>b</strong></p>' } });
    expect(output).toContain('content={"<p>a <strong>b</strong></p>"}');
  });

  it('conteúdo vazio não escreve o atributo', () => {
    expect(editorSource('', { args: { content: '' } })).not.toContain('content=');
  });

  it('só escreve `editable` quando a edição está desligada', () => {
    expect(editorSource()).not.toContain('editable');
    expect(editorSource('', { args: { editable: false } })).toContain('editable={false}');
  });
});

describe('transforms das stories de conjunto, estado e composição', () => {
  it('o conjunto básico e o avançado se distinguem pelo preset', () => {
    expect(editorBasicSource()).toContain('preset="basic"');
    expect(editorAdvancedSource()).toContain('preset="advanced"');
  });

  it('a leitura desliga a edição e mantém o mesmo conteúdo do conjunto avançado', () => {
    expect(editorReadOnlySource()).toContain('editable={false}');
    expect(editorReadOnlySource()).toContain('<h2>Relatório</h2>');
  });

  it('os estados de tabela e imagem trazem o elemento no conteúdo inicial', () => {
    expect(editorWithTableSource()).toContain('<table>');
    expect(editorWithImageSource()).toContain('alt=\\"Ponto de exemplo\\"');
  });

  it('o armazenamento próprio devolve a URL e recusa por tamanho', () => {
    const output = editorCustomImageStorageSource();
    expect(output).toContain('resolveImage={enviarAoCdn}');
    expect(output).toContain('return null;');
    expect(output).toContain('https://cdn.exemplo.com/');
  });

  it('a descrição automática trata o arquivo ausente', () => {
    const output = editorAiImageDescriptionSource();
    expect(output).toContain('describeImage={descrever}');
    expect(output).toContain('arquivo: File | null');
  });

  it('nenhum snippet vaza o andaime da story nem a lib de baixo', () => {
    for (const build of [
      editorSource,
      editorBasicSource,
      editorAdvancedSource,
      editorReadOnlySource,
      editorWithTableSource,
      editorWithImageSource,
      editorCustomImageStorageSource,
      editorAiImageDescriptionSource,
    ]) {
      const output = build();
      expect(output).not.toContain('tiptap');
      expect(output).not.toContain('ProseMirror');
      expect(output).not.toContain('LABELS');
    }
  });
});
