import { describe, expect, it } from 'vitest';
import {
  separatorDecorativoSource,
  separatorEmCardSource,
  separatorEmMenuSource,
  separatorEnfaseForteSource,
  separatorHorizontalSource,
  separatorSemanticoSource,
  separatorSource,
  separatorVerticalSource,
} from './separator.source';

describe('separatorSource', () => {
  it('sem args, entrega a forma canônica com a orientação padrão explícita', () => {
    expect(separatorSource()).toBe(
      `<script lang="ts">
  import { Separator } from "@/components/ui/separator";
</script>

<p>Seção superior</p>
<Separator orientation="horizontal" />
<p>Seção inferior</p>`,
    );
  });

  it('acompanha o control de orientação, trocando também o contêiner', () => {
    const output = separatorSource('', { args: { orientation: 'vertical' } });
    expect(output).toContain('<Separator orientation="vertical" />');
    // A linha vertical precisa de uma linha de flex contra a qual esticar.
    expect(output).toContain('nds-cluster');
  });

  it('só escreve decorative quando o valor difere do padrão', () => {
    expect(separatorSource('', { args: { decorative: true } })).not.toContain('decorative');
    expect(separatorSource('', { args: { decorative: false } })).toContain('decorative={false}');
  });

  it('só escreve emphasis quando o valor difere do padrão', () => {
    expect(separatorSource('', { args: { emphasis: 'default' } })).not.toContain('emphasis');
    expect(separatorSource('', { args: { emphasis: 'strong' } })).toContain('emphasis="strong"');
  });
});

describe('transforms das stories de variação e composição', () => {
  it('a variante vertical mostra as duas linhas da barra de navegação', () => {
    const output = separatorVerticalSource();
    expect(output.match(/<Separator orientation="vertical" \/>/g)).toHaveLength(2);
  });

  it('a variante horizontal separa dois blocos empilhados', () => {
    expect(separatorHorizontalSource()).toContain('<Separator orientation="horizontal" />');
  });

  it('o estado decorativo não escreve a prop, e o semântico escreve', () => {
    expect(separatorDecorativoSource()).not.toContain('decorative');
    expect(separatorSemanticoSource()).toContain('decorative={false}');
  });

  it('a composição em card importa o Card junto do Separator', () => {
    const output = separatorEmCardSource();
    expect(output).toContain('from "@/components/ui/card"');
    expect(output).toContain('<Separator orientation="horizontal" />');
  });

  it('a composição em menu marca o divisor como semântico', () => {
    expect(separatorEmMenuSource()).toContain('decorative={false}');
  });

  it('a ênfase forte aparece ao lado da linha padrão, com classe extra', () => {
    const output = separatorEnfaseForteSource();
    expect(output).toContain('emphasis="strong"');
    expect(output).toContain('class="nds-mt-4"');
  });
});
