import { describe, expect, it } from 'vitest';
import {
  commandWithShortcutsSource,
  commandItemDisabledSource,
  commandItemCheckedSource,
  commandPaletteSource,
  commandSource,
} from './command.source';

describe('commandSource', () => {
  it('ensina a importação do design system, não a da lib headless', () => {
    const saida = commandSource();
    expect(saida).toContain('} from "@/components/ui/command";');
    expect(saida).not.toContain('cmdk');
  });

  it('monta o par que separa a paleta de um menu: campo de busca e lista', () => {
    const saida = commandSource();
    expect(saida).toContain('<CommandInput placeholder="Buscar componente..." />');
    expect(saida).toContain('<CommandList>');
  });

  it('põe a mensagem de vazio DENTRO da lista', () => {
    // Fora dela sobra uma área em branco onde a lista estava — é o espaço da
    // lista que a mensagem preenche.
    const saida = commandSource();
    const startList = saida.indexOf('<CommandList>');
    const endList = saida.indexOf('</CommandList>');
    const vazio = saida.indexOf('<CommandEmpty>');
    expect(vazio).toBeGreaterThan(startList);
    expect(vazio).toBeLessThan(endList);
  });

  it('nomeia cada grupo pelo cabeçalho, e separa os dois blocos', () => {
    const saida = commandSource();
    expect(saida).toContain('<CommandGroup heading="Componentes">');
    expect(saida).toContain('<CommandGroup heading="Utilitários">');
    expect(saida).toContain('<CommandSeparator />');
  });

  it('omite loop e shouldFilter quando são o padrão do componente', () => {
    const saida = commandSource(undefined, { args: { loop: false, shouldFilter: true } });
    expect(saida).toContain('<Command>');
    expect(saida).not.toContain('loop');
    expect(saida).not.toContain('shouldFilter');
  });

  it('escreve as duas quando diferem do padrão', () => {
    const saida = commandSource(undefined, { args: { loop: true, shouldFilter: false } });
    expect(saida).toContain('<Command loop shouldFilter={false}>');
  });

  it('não deixa o espião do onSelect virar código', () => {
    const spy = (() => 'CORPO_DO_MOCK') as never;
    const saida = commandSource(undefined, { args: { loop: spy, shouldFilter: spy } });
    expect(saida).not.toContain('CORPO_DO_MOCK');
    expect(saida).toContain('<Command>');
  });
});

describe('estados de cada comando', () => {
  it('o desabilitado carrega a prop no ITEM, não na paleta', () => {
    const saida = commandItemDisabledSource();
    expect(saida).toContain('<CommandItem value="arquivar" disabled>');
    expect(saida).not.toContain('<Command disabled');
  });

  it('o marcado publica os dois valores, e não mistura marca com atalho', () => {
    const saida = commandItemCheckedSource();
    expect(saida).toContain('<CommandItem value="claro" checked>');
    expect(saida).toContain('checked={false}');
    // Marca e atalho disputam a mesma borda: um por comando.
    expect(saida).not.toContain('CommandShortcut');
  });

  it('o atalho mora dentro do comando e não sai da árvore de acessibilidade', () => {
    const saida = commandWithShortcutsSource();
    expect(saida).toContain('<CommandShortcut>Ctrl+B</CommandShortcut>');
    expect(saida).not.toContain('aria-hidden');
  });
});

describe('composições', () => {
  it('a paleta nomeia o diálogo por title e description', () => {
    const saida = commandPaletteSource();
    expect(saida).toContain('title="Command Palette"');
    expect(saida).toContain('description="Busque por um comando ou ação..."');
  });

  it('o atalho global é listener de janela, com cleanup', () => {
    // Sem o cleanup o listener sobrevive à desmontagem e passa a abrir uma
    // paleta que já saiu da tela.
    const saida = commandPaletteSource();
    expect(saida).toContain('window.addEventListener("keydown", aoTeclar);');
    expect(saida).toContain('return () => window.removeEventListener("keydown", aoTeclar);');
    expect(saida).toContain('evento.preventDefault();');
  });

  it('nenhum snippet ensina o andaime da story', () => {
    for (const fn of [
      commandSource,
      commandWithShortcutsSource,
      commandItemDisabledSource,
      commandItemCheckedSource,
      commandPaletteSource,
    ]) {
      const saida = fn();
      expect(saida).not.toContain('Demo');
      expect(saida).not.toContain('fixtures');
    }
  });
});
