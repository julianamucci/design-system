import { describe, expect, it } from 'vitest';
import {
  toggleGroupCombinadoSource,
  toggleGroupControlledCombinadoSource,
  toggleGroupControlledExclusivoSource,
  toggleGroupDisabledSource,
  toggleGroupExclusivoSource,
  toggleGroupItemDisabledSource,
  toggleGroupSource,
  toggleGroupEmptySource,
  toggleGroupVerticalSource,
} from './toggle-group.source';

const ALL = [
  toggleGroupSource,
  toggleGroupExclusivoSource,
  toggleGroupCombinadoSource,
  toggleGroupVerticalSource,
  toggleGroupEmptySource,
  toggleGroupDisabledSource,
  toggleGroupItemDisabledSource,
  toggleGroupControlledExclusivoSource,
  toggleGroupControlledCombinadoSource,
];

describe('toggleGroupSource', () => {
  it('importa o grupo e o item do design system', () => {
    expect(toggleGroupSource()).toContain(
      'import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";',
    );
  });

  it('omite tudo o que é padrão do componente', () => {
    const saida = toggleGroupSource();
    expect(saida).not.toContain('type=');
    expect(saida).not.toContain('orientation=');
    expect(saida).not.toContain('variant=');
    expect(saida).not.toContain('size=');
    expect(saida).not.toContain('disabled');
  });

  it('a forma do valor inicial acompanha o modo', () => {
    expect(toggleGroupSource(undefined, { args: { type: 'single' } })).toContain(
      'defaultValue="left"',
    );
    const combinado = toggleGroupSource(undefined, { args: { type: 'multiple' } });
    expect(combinado).toContain('type="multiple"');
    expect(combinado).toContain('defaultValue={["left"]}');
  });

  it('leva ao snippet só o que difere do padrão', () => {
    const saida = toggleGroupSource(undefined, {
      args: { orientation: 'vertical', variant: 'outline', size: 'lg', disabled: true },
    });
    expect(saida).toContain('orientation="vertical"');
    expect(saida).toContain('variant="outline"');
    expect(saida).toContain('size="lg"');
    expect(saida).toContain('disabled');
  });

  it('não inventa valor fora da união', () => {
    const saida = toggleGroupSource(undefined, {
      args: { variant: 'roxo' as never },
    });
    expect(saida).not.toContain('roxo');
  });

  it('o espião de onValueChange nunca vira código no painel', () => {
    const spy = () => 'CORPO_DO_MOCK';
    const saida = toggleGroupSource(undefined, { args: { onValueChange: spy } as never });
    expect(saida).not.toContain('CORPO_DO_MOCK');
    expect(saida).not.toContain('onValueChange');
  });

  it('o rótulo do control chega ao snippet, e um espião cai no padrão', () => {
    expect(toggleGroupSource(undefined, { args: { 'aria-label': 'Formatação' } })).toContain(
      'aria-label="Formatação"',
    );
    const spy = () => 'CORPO_DO_MOCK';
    const saida = toggleGroupSource(undefined, { args: { 'aria-label': spy } as never });
    expect(saida).toContain('aria-label="Alinhamento do texto"');
    expect(saida).not.toContain('CORPO_DO_MOCK');
  });
});

describe('nome acessível', () => {
  it('o grupo sempre tem o seu — três ícones lado a lado não dizem de que categoria são', () => {
    for (const fn of ALL) {
      expect(fn(), `${fn.name}`).toMatch(/<ToggleGroup[\s\S]*?aria-label="/);
    }
  });

  it('e cada item só-ícone também, com o ícone fora da árvore de acessibilidade', () => {
    for (const fn of ALL) {
      const saida = fn();
      expect(saida).toMatch(/<ToggleGroupItem[^>]*aria-label="/);
      expect(saida).toContain('aria-hidden="true"');
    }
  });
});

describe('modos', () => {
  it('o exclusivo é o padrão e não escreve type', () => {
    const saida = toggleGroupExclusivoSource();
    expect(saida).toContain('defaultValue="center"');
    expect(saida).not.toContain('type=');
  });

  it('o combinado declara o modo e passa a lista', () => {
    const saida = toggleGroupCombinadoSource();
    expect(saida).toContain('type="multiple"');
    expect(saida).toContain('defaultValue={["bold", "italic"]}');
  });
});

describe('estados', () => {
  it('sem seleção o grupo simplesmente não tem defaultValue', () => {
    expect(toggleGroupEmptySource()).not.toContain('defaultValue');
  });

  it('desabilitar o grupo é uma prop no grupo', () => {
    expect(toggleGroupDisabledSource()).toMatch(/<ToggleGroup[\s\S]*?\n\s*disabled\n/);
  });

  it('desabilitar um item é uma prop no item, e os vizinhos seguem vivos', () => {
    const saida = toggleGroupItemDisabledSource();
    expect(saida).toContain('<ToggleGroupItem disabled value="center"');
    expect(saida).toContain('<ToggleGroupItem value="left"');
    expect(saida).toContain('<ToggleGroupItem value="right"');
  });
});

describe('controlado', () => {
  it('o exclusivo recebe string, e é a forma pública documentada do valor', () => {
    const saida = toggleGroupControlledExclusivoSource();
    expect(saida).toContain('import { useState } from "react";');
    expect(saida).toContain('const [alinhamento, setAlinhamento] = useState("left");');
    expect(saida).toContain('value={alinhamento}');
    expect(saida).toContain('onValueChange={(valor) => setAlinhamento(valor)}');
  });

  it('o combinado recebe a seleção inteira a cada troca', () => {
    const saida = toggleGroupControlledCombinadoSource();
    expect(saida).toContain('const [formatos, setFormatos] = useState(["bold"]);');
    expect(saida).toContain('type="multiple"');
    expect(saida).toContain('value={formatos}');
  });

  it('nenhum dos dois ensina o invólucro que a story usa para montar', () => {
    expect(toggleGroupControlledExclusivoSource()).not.toContain('Render');
    expect(toggleGroupControlledCombinadoSource()).not.toContain('Render');
  });
});

describe('nenhum snippet ensina o andaime da story', () => {
  it('não há fixture, invólucro nem largura de captura', () => {
    for (const fn of ALL) {
      const saida = fn();
      expect(saida, `${fn.name}`).not.toContain('fixtures');
      expect(saida).not.toContain('definir');
      // `width: 18rem` existe só para a captura do Chromatic enquadrar a barra.
      expect(saida).not.toContain('18rem');
      expect(saida).not.toContain('style=');
    }
  });
});
