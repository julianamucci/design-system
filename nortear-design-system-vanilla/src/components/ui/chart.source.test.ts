import { describe, expect, it } from 'vitest';
import { chartEmCardSnippet, chartSnippet, chartSource, chartSourceWith } from './chart.source';

describe('chartSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = chartSnippet({ 'aria-label': 'Acessos mensais' });
    expect(code).toContain("import { createChart } from '@/components/ui/chart';");
    expect(code).toContain('createChart({');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('<svg');
    expect(code).not.toContain('role="img"');
  });

  it('usa o nome da opção de descrição da fábrica', () => {
    // Quem descreve o desenho aqui é `'aria-label'`, e é ele que vira o
    // atributo do bloco. Um desenho sem descrição é conteúdo perdido.
    const code = chartSnippet({ 'aria-label': 'Acessos mensais no desktop' });
    expect(code).toContain("'aria-label': 'Acessos mensais no desktop'");
    expect(code).not.toContain('ariaLabel');
    // O apelido depreciado não vaza para o painel Code: quem copia dali adota
    // o nome que leu. A âncora de início de linha é o que separa a OPÇÃO da
    // chamada do `label` de cada ponto do dado, que é outra coisa.
    expect(code).not.toMatch(/\n {2}label: /);
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = chartSnippet({ 'aria-label': 'X' });
    // `bar` e o renderer `svg` são o padrão; a legenda sem valor segue a
    // contagem de séries.
    expect(code).not.toContain('type:');
    expect(code).not.toContain('renderer:');
    expect(code).not.toContain('showLegend');
    expect(code).not.toContain('title:');
    // A tabela de dados é emitida SEMPRE. Um `showData: false` no snippet
    // ensinaria que ela depende da opção — e quem copia dali adota o que leu.
    expect(code).not.toContain('showData');
    expect(chartSnippet({ 'aria-label': 'X', type: 'bar', renderer: 'svg' })).toBe(code);
  });

  it('mostra as opções quando a story as usa', () => {
    const code = chartSnippet({
      'aria-label': 'X',
      type: 'line',
      title: 'Vendas mensais',
      showLegend: false,
      showData: true,
      height: 320,
      renderer: 'canvas',
      className: 'nds-max-w-md',
    });
    expect(code).toContain("type: 'line'");
    expect(code).toContain("title: 'Vendas mensais'");
    expect(code).toContain('showLegend: false');
    expect(code).toContain('showData: true');
    expect(code).toContain('height: 320');
    expect(code).toContain("renderer: 'canvas'");
    // O arg do Playground se chama `className`; a opção da fábrica é `class`.
    expect(code).toContain("class: 'nds-max-w-md'");
    expect(code).not.toContain('className');
  });

  it('escolhe a forma do dado que a story exercita', () => {
    const simple = chartSnippet({ data: 'simples' });
    expect(simple).toContain('data: acessosMensais');
    expect(simple).toContain("{ label: 'Jan', value: 186 },");
    expect(simple).not.toContain('xAxis');

    const multi = chartSnippet({ data: 'multi' });
    expect(multi).toContain('xAxis: meses');
    expect(multi).toContain('series: acessosPorDispositivo');
    expect(multi).toContain("{ name: 'Mobile', data: [120, 190, 165, 98, 174, 158] },");

    const rosca = chartSnippet({ data: 'rosca', type: 'pie' });
    expect(rosca).toContain("type: 'pie'");
    expect(rosca).toContain('data: acessosPorDispositivo');
    expect(rosca).toContain("{ label: 'Tablet', value: 180 },");

    const umPonto = chartSnippet({ data: 'umPonto' });
    expect(umPonto).toContain("const acessos = [{ label: 'Jan', value: 186 }];");
  });

  it('no vazio a série chega sem dado, com a frase que explica a ausência', () => {
    const code = chartSnippet({
      data: 'vazio',
      'aria-label': undefined,
      emptyLabel: 'Nenhum dado disponível para o período selecionado.',
    });
    expect(code).toContain('series: []');
    expect(code).toContain("emptyLabel: 'Nenhum dado disponível para o período selecionado.'");
    // Sem desenho não há imagem para narrar: a descrição some junto.
    expect(code).not.toMatch(/\n {2}'aria-label': /);
  });

  it('a cor autoral mora DENTRO do item de série', () => {
    const code = chartSnippet({ data: 'serieUnica', color: '#7c3aed' });
    expect(code).toContain("{ name: 'Desktop', data: [186, 305, 237, 73, 209, 214], color: '#7c3aed' },");
    // E não como uma opção de topo da fábrica, que não existe.
    expect(code).not.toContain("  color: '#7c3aed',\n});");
  });

  it('não vaza helper nem sonda de story', () => {
    const code = chartSnippet({ data: 'multi' });
    expect(code).not.toContain('exigirRaiz');
    expect(code).not.toContain('desenhoPintado');
    expect(code).not.toContain('formasDeDado');
    expect(code).not.toContain('tracados');
  });
});

describe('chartSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = chartSource('<div data-slot="chart">', {});
    const withArgs = chartSource('<div data-slot="chart">', {
      args: { type: 'pie', height: 280 },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(noArgs).toContain('height: 240');
    expect(withArgs).toContain("type: 'pie'");
    expect(withArgs).toContain('height: 280');
  });

  it('preserva o que a playgroundSource local já fazia certo', () => {
    // A função que morava dentro de `chart.stories.ts` declarava o dado antes da
    // chamada e emitia `class` a partir do control `className`. As duas coisas
    // continuam valendo — o que mudou é que agora isto é testável.
    const code = chartSource('', {
      args: { type: 'bar', 'aria-label': 'Acessos mensais', height: 240, className: 'nds-max-w-md' },
    });
    expect(code).toContain('const acessosMensais = [');
    expect(code).toContain('data: acessosMensais');
    expect(code).toContain("class: 'nds-max-w-md'");
    // E o título vazio do Playground continua fora do snippet.
    expect(chartSource('', { args: { title: '' } })).not.toContain('title');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(chartSource('<div data-slot="chart" role="img" aria-label="Gráfico">', {})).not.toContain(
      'role="img"',
    );
  });
});

describe('chartSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = chartSourceWith({ type: 'line', data: 'multi' });
    const code = transform('', { args: { type: 'pie', height: 300 } });
    expect(code).toContain("type: 'line'");
    expect(code).toContain('series: acessosPorDispositivo');
    expect(code).toContain('height: 300');
  });

  it("`'aria-label': undefined` apaga o padrão em vez de reintroduzi-lo", () => {
    const code = chartSourceWith({ title: 'Vendas mensais', 'aria-label': undefined })('', {});
    expect(code).toContain("title: 'Vendas mensais'");
    // A OPÇÃO da chamada, não o `label` de cada ponto do dado: o `{ label: 'Jan',
    // value: 186 }` do bloco de dados é outra coisa, e proibir a palavra
    // inteira mediria a linha errada.
    expect(code).not.toMatch(/\n {2}'aria-label': /);
  });
});

describe('chartEmCardSnippet', () => {
  it('o título fica no cabeçalho em texto, e o desenho no conteúdo', () => {
    const code = chartEmCardSnippet({ cardTitle: 'Acessos mensais', height: 220 });
    expect(code).toContain("from '@/components/ui/card';");
    expect(code).toContain("createCardTitle({ text: 'Acessos mensais' })");
    expect(code).toContain('conteudo.appendChild(createChart({');
    expect(code).toContain('card.append(cabecalho, conteudo);');
    // Título do cartão e título desenhado são coisas diferentes: dentro do
    // desenho ele seria pixel, e a busca da página não o alcançaria.
    expect(code).not.toContain("title: 'Acessos mensais'");
    expect(code).not.toContain('data-slot=');
  });
});
