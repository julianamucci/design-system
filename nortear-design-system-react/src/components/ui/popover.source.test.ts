import { describe, expect, it } from 'vitest';
import {
  popoverAboveSource,
  popoverContentLivreSource,
  popoverControlledSource,
  popoverEditarPerfilSource,
  popoverFilterSource,
  popoverFormSource,
  popoverModalSource,
  popoverOpenSource,
  popoverPaletteSource,
  popoverPreferenciasSource,
  popoverSource,
} from './popover.source';

/**
 * O `source-snippets.test.ts` varre TODOS os construtores e prova coerência de
 * IMPORT — que o snippet importa o que usa. O que ele não alcança é se o snippet
 * ensina o CERTO: omitir o valor padrão, bater com a story ao lado, não vazar
 * binding que só existe nela.
 *
 * A distância entre as duas camadas apareceu duas vezes nesta campanha, e as
 * duas em sobreposição: o preview mudou e o snippet ao lado continuou ensinando
 * a forma antiga, sem que nenhum portão visse. Quem lê copia o snippet, não o
 * preview.
 */

const ALL = [
  popoverSource,
  popoverContentLivreSource,
  popoverFormSource,
  popoverOpenSource,
  popoverControlledSource,
  popoverModalSource,
  popoverEditarPerfilSource,
  popoverFilterSource,
  popoverPaletteSource,
  popoverPreferenciasSource,
  popoverAboveSource,
];

/**
 * O bloco de ações do rodapé — do cluster encostado à direita até o `</div>` que
 * o fecha. Recortar antes de afirmar é o que impede a asserção por substring de
 * casar noutro contexto: `variant=` existe no gatilho de todo snippet, e um
 * `toContain` solto não distinguiria os dois lugares.
 */
function footer(output: string): string {
  const start = output.indexOf('data-justify="end"');
  expect(start).toBeGreaterThan(-1);
  return output.slice(start, output.indexOf('</div>', start));
}

describe('popoverSource (transform do meta)', () => {
  it('devolve o componente que se escreve, e não o template da story', () => {
    const output = popoverSource();
    expect(output).toContain('} from "@/components/ui/popover";');
    expect(output).toContain('import { Button } from "@/components/ui/button";');
    // O gatilho é o botão que JÁ existe na interface, recebendo as props de
    // openingTag por `asChild` — um só elemento focável, um só nome acessível.
    expect(output).toContain('<PopoverTrigger asChild>');
    expect(output).toContain('<Button variant="outline">Abrir popover</Button>');
    // O que o renderer imprimiria sozinho, e o andaime que a story monta em
    // volta do painel portalizado. Nada disso é do componente.
    expect(output).not.toContain('args.');
    expect(output).not.toContain('{...args}');
    expect(output).not.toContain('data-slot=');
    expect(output).not.toContain('minHeight');
    expect(output).not.toContain('style=');
  });

  it('omite side, align e sideOffset quando são o padrão do componente', () => {
    const output = popoverSource(undefined, {
      args: { side: 'bottom', align: 'center', sideOffset: 4 },
    });
    // Repetir valor padrão no snippet ensina ruído: quem copia passa a declarar
    // o que já vem de graça, e some a informação de que existe um padrão.
    //
    // A checagem é na TAG, não na substring: o rodapé traz `data-justify="end"`
    // e o cluster do filtro traz `data-spacing`, então um `not.toContain('align=')`
    // ou `not.toContain('side')` casaria fora do painel. Foi exatamente o que
    // reprovou por engano no hover-card.
    expect(output).toContain('<PopoverContent>');
    expect(output).not.toContain('<PopoverContent ');
  });

  it('imprime side, align e sideOffset quando diferem do padrão', () => {
    const output = popoverSource(undefined, {
      args: { side: 'top', align: 'start', sideOffset: 12 },
    });
    expect(output).toContain('<PopoverContent side="top" align="start" sideOffset={12}>');
  });

  it('não inventa posição fora da união quando o control é adulterado', () => {
    const output = popoverSource(undefined, {
      args: { side: 'diagonal' as never, align: 'meio' as never },
    });
    expect(output).toContain('<PopoverContent>');
  });

  it('defaultOpen e modal entram na raiz na forma abreviada, e somem quando falsos', () => {
    expect(popoverSource(undefined, { args: { defaultOpen: false, modal: false } })).toContain(
      '<Popover>',
    );
    expect(popoverSource(undefined, { args: { defaultOpen: true } })).toContain(
      '<Popover defaultOpen>',
    );
    expect(popoverSource(undefined, { args: { defaultOpen: true, modal: true } })).toContain(
      '<Popover defaultOpen modal>',
    );
  });

  it('o espião de action não vaza o corpo do mock para o painel', () => {
    // O Storybook entrega `onOpenChange` como função; interpolada, ela
    // apareceria no painel como se fosse código do design system.
    const spy = () => 'CORPO_DO_MOCK';
    const output = popoverSource(undefined, {
      args: { onOpenChange: spy, sideOffset: spy } as never,
    });
    expect(output).not.toContain('CORPO_DO_MOCK');
    expect(output).not.toContain('onOpenChange');
    expect(output).toContain('<PopoverContent>');
  });
});

describe('a lição do painel sem título', () => {
  it('sem PopoverTitle o painel DECLARA o próprio nome, por aria-label', () => {
    // Decisão da dona nesta campanha, e é o motivo de a variante `default`
    // existir: ela é o conteúdo livre. `role="dialog"` anônimo reprova no axe
    // por `aria-dialog-name`, e um nome herdado do gatilho anunciaria a porta em
    // vez do que há atrás dela.
    const output = popoverContentLivreSource();
    expect(output).toContain('<PopoverContent aria-label="Informações adicionais">');
    expect(output).not.toContain('PopoverTitle');
    expect(output).not.toContain('PopoverHeader');
  });

  it('com PopoverTitle o painel NÃO carrega aria-label — seriam dois contratos de nome', () => {
    for (const fn of [
      popoverSource,
      popoverFormSource,
      popoverOpenSource,
      popoverModalSource,
      popoverEditarPerfilSource,
      popoverFilterSource,
      popoverPreferenciasSource,
      popoverAboveSource,
    ]) {
      const output = fn();
      expect(output).toContain('<PopoverTitle>');
      // Recorte no painel: a paleta usa `aria-label` nas amostras de cor, e uma
      // asserção solta casaria lá dentro.
      const openingTag = output.slice(
        output.indexOf('<PopoverContent'),
        output.indexOf('>', output.indexOf('<PopoverContent')),
      );
      expect(openingTag).not.toContain('aria-label');
    }
  });
});

describe('a lição do rodapé', () => {
  it('o par de ações é Cancelar ghost + ação primária, nessa ordem', () => {
    // A ação de descarte é a discreta e vem primeiro; a que confirma é a única
    // com peso visual, e o peso vem da AUSÊNCIA de `variant` — a primária é o
    // padrão do Button. Escrever `variant="default"` ali ensinaria ruído.
    const actions = footer(popoverSource());
    expect(actions).toContain('<Button variant="ghost" size="sm">Cancelar</Button>');
    expect(actions).toContain('<Button size="sm">Salvar</Button>');
    expect(actions.match(/variant=/g)).toHaveLength(1);
  });

  it('as outras composições com rodapé seguem a mesma forma', () => {
    for (const [fn, primary] of [
      [popoverModalSource, '<Button size="sm">OK</Button>'],
      [popoverEditarPerfilSource, '<Button type="submit" size="sm">Atualizar</Button>'],
      [popoverFilterSource, '<Button size="sm">Aplicar</Button>'],
    ] as const) {
      const actions = footer(fn());
      expect(actions).toContain('variant="ghost"');
      expect(actions).toContain(primary);
      expect(actions.match(/variant=/g)).toHaveLength(1);
    }
  });
});

describe('composições e estados', () => {
  it('o modo controlado ensina o par open + onOpenChange com estado de verdade', () => {
    const output = popoverControlledSource();
    expect(output).toContain('import { useState } from "react";');
    expect(output).toContain('const [aberto, setAberto] = useState(false);');
    expect(output).toContain('<Popover open={aberto} onOpenChange={setAberto}>');
    // Dois botões, e não um que alterna: o `pointerdown` do clique fora dispensa
    // o painel ANTES do `click`, e um alternador reabriria o que acabou de
    // fechar.
    expect(output).toContain('setAberto(true)');
    expect(output).toContain('setAberto(false)');
  });

  it('o modal declara os dois: a prisão de foco e a trava de rolagem vêm juntas', () => {
    expect(popoverModalSource()).toContain('<Popover defaultOpen modal>');
  });

  it('o aberto por estado inicial não escreve modal junto', () => {
    const output = popoverOpenSource();
    expect(output).toContain('<Popover defaultOpen>');
  });

  it('ancorado acima declara lado e distância, e cala o alinhamento padrão', () => {
    // A story ao lado escreve `align="center"` no `render` para deixar a
    // intenção explícita no canvas; o snippet não repete o padrão.
    expect(popoverAboveSource()).toContain('<PopoverContent side="top" sideOffset={12}>');
  });

  it('cada amostra de cor carrega o próprio rótulo — a cor não é o nome', () => {
    const output = popoverPaletteSource();
    for (const label of ['Primária', 'Secundária', 'Sucesso', 'Atenção', 'Informação', 'Destrutiva']) {
      expect(output).toContain(`aria-label="${label}"`);
    }
    // Botão sem texto nenhum reprova no axe por `button-name`.
    expect(output).not.toContain('aria-label=""');
  });

  it('as preferências são caixas independentes, não escolha única', () => {
    const output = popoverPreferenciasSource();
    expect(output).toContain('type="checkbox"');
    expect(output).not.toContain('type="radio"');
  });

  it('os formulários ligam rótulo e campo por id, e não por invólucro', () => {
    for (const fn of [popoverFormSource, popoverEditarPerfilSource]) {
      const output = fn();
      expect(output).toContain('import { Input } from "@/components/ui/input";');
      expect(output).toContain('import { Label } from "@/components/ui/label";');
      expect(output).toMatch(/<Label htmlFor="[^"]+"/);
    }
  });
});

describe('guardas transversais dos snippets', () => {
  it('nenhum snippet ensina a lib headless nem o andaime do arquivo de story', () => {
    for (const fn of ALL) {
      const output = fn();
      // O que se importa é o design system; a lib que o alimenta é detalhe de
      // implementação e trocá-la não pode mudar o que a doc ensina.
      expect(output).toContain('} from "@/components/ui/popover";');
      expect(output).not.toContain('@base-ui');
      // Andaime do canvas: quadro de posicionamento do painel portalizado e alvo
      // inerte da dispensa por clique fora.
      expect(output).not.toContain('minHeight');
      expect(output).not.toContain('contain:');
      expect(output).not.toContain('nds-min-h-');
      expect(output).not.toContain('Área externa');
      expect(output).not.toContain('data-slot=');
      expect(output).not.toContain('{...args}');
    }
  });

  it('todo painel nasce named — por título ou por aria-label, nunca por nada', () => {
    for (const fn of ALL) {
      const output = fn();
      const named = output.includes('<PopoverTitle>') || output.includes('aria-label="Informações');
      expect(named).toBe(true);
    }
  });
});
