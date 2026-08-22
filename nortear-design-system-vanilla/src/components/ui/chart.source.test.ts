import { describe, expect, it } from 'vitest';
import { chartEmCardSnippet, chartSnippet, chartSource, chartSourceWith } from './chart.source';

describe('chartSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const código = chartSnippet({ 'aria-label': 'Acessos mensais' });
    expect(código).toContain("import { createChart } from '@/components/ui/chart';");
    expect(código).toContain('createChart({');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('<svg');
    expect(código).not.toContain('role="img"');
  });

  it('usa o nome da opção de descrição da fábrica', () => {
    // Quem descreve o desenho aqui é `'aria-label'`, e é ele que vira o
    // atributo do bloco. Um desenho sem descrição é conteúdo perdido.
    const código = chartSnippet({ 'aria-label': 'Acessos mensais no desktop' });
    expect(código).toContain("'aria-label': 'Acessos mensais no desktop'");
    expect(código).not.toContain('ariaLabel');
    // O apelido depreciado não vaza para o painel Code: quem copia dali adota
    // o nome que leu. A âncora de início de linha é o que separa a OPÇÃO da
    // chamada do `label` de cada ponto do dado, que é outra coisa.
    expect(código).not.toMatch(/\n {2}label: /);
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = chartSnippet({ 'aria-label': 'X' });
    // `bar` e o renderer `svg` são o padrão; a legenda sem valor segue a
    // contagem de séries.
    expect(código).not.toContain('type:');
    expect(código).not.toContain('renderer:');
    expect(código).not.toContain('showLegend');
    expect(código).not.toContain('title:');
    expect(chartSnippet({ 'aria-label': 'X', type: 'bar', renderer: 'svg' })).toBe(código);
  });

  it('mostra as opções quando a story as usa', () => {
    const código = chartSnippet({
      'aria-label': 'X',
      type: 'line',
      title: 'Vendas mensais',
      showLegend: false,
      height: 320,
      renderer: 'canvas',
      className: 'nds-max-w-md',
    });
    expect(código).toContain("type: 'line'");
    expect(código).toContain("title: 'Vendas mensais'");
    expect(código).toContain('showLegend: false');
    expect(código).toContain('height: 320');
    expect(código).toContain("renderer: 'canvas'");
    // O arg do Playground se chama `className`; a opção da fábrica é `class`.
    expect(código).toContain("class: 'nds-max-w-md'");
    expect(código).not.toContain('className');
  });

  it('escolhe a forma do dado que a story exercita', () => {
    const simple = chartSnippet({ dados: 'simples' });
    expect(simple).toContain('data: acessosMensais');
    expect(simple).toContain("{ label: 'Jan', value: 186 },");
    expect(simple).not.toContain('xAxis');

    const multi = chartSnippet({ dados: 'multi' });
    expect(multi).toContain('xAxis: meses');
    expect(multi).toContain('series: acessosPorDispositivo');
    expect(multi).toContain("{ name: 'Mobile', data: [120, 190, 165, 98, 174, 158] },");

    const rosca = chartSnippet({ dados: 'rosca', type: 'pie' });
    expect(rosca).toContain("type: 'pie'");
    expect(rosca).toContain('data: acessosPorDispositivo');
    expect(rosca).toContain("{ label: 'Tablet', value: 180 },");

    const umPonto = chartSnippet({ dados: 'umPonto' });
    expect(umPonto).toContain("const acessos = [{ label: 'Jan', value: 186 }];");
  });

  it('no vazio a série chega sem dado, com a frase que explica a ausência', () => {
    const código = chartSnippet({
      dados: 'vazio',
      'aria-label': undefined,
      emptyLabel: 'Nenhum dado disponível para o período selecionado.',
    });
    expect(código).toContain('series: []');
    expect(código).toContain("emptyLabel: 'Nenhum dado disponível para o período selecionado.'");
    // Sem desenho não há imagem para narrar: a descrição some junto.
    expect(código).not.toMatch(/\n {2}'aria-label': /);
  });

  it('a cor autoral mora DENTRO do item de série', () => {
    const código = chartSnippet({ dados: 'serieUnica', color: '#7c3aed' });
    expect(código).toContain("{ name: 'Desktop', data: [186, 305, 237, 73, 209, 214], color: '#7c3aed' },");
    // E não como uma opção de topo da fábrica, que não existe.
    expect(código).not.toContain("  color: '#7c3aed',\n});");
  });

  it('não vaza helper nem sonda de story', () => {
    const código = chartSnippet({ dados: 'multi' });
    expect(código).not.toContain('exigirRaiz');
    expect(código).not.toContain('desenhoPintado');
    expect(código).not.toContain('formasDeDado');
    expect(código).not.toContain('tracados');
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
    const código = chartSource('', {
      args: { type: 'bar', 'aria-label': 'Acessos mensais', height: 240, className: 'nds-max-w-md' },
    });
    expect(código).toContain('const acessosMensais = [');
    expect(código).toContain('data: acessosMensais');
    expect(código).toContain("class: 'nds-max-w-md'");
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
    const transform = chartSourceWith({ type: 'line', dados: 'multi' });
    const código = transform('', { args: { type: 'pie', height: 300 } });
    expect(código).toContain("type: 'line'");
    expect(código).toContain('series: acessosPorDispositivo');
    expect(código).toContain('height: 300');
  });

  it("`'aria-label': undefined` apaga o padrão em vez de reintroduzi-lo", () => {
    const código = chartSourceWith({ title: 'Vendas mensais', 'aria-label': undefined })('', {});
    expect(código).toContain("title: 'Vendas mensais'");
    // A OPÇÃO da chamada, não o `label` de cada ponto do dado: o `{ label: 'Jan',
    // value: 186 }` do bloco de dados é outra coisa, e proibir a palavra
    // inteira mediria a linha errada.
    expect(código).not.toMatch(/\n {2}'aria-label': /);
  });
});

describe('chartEmCardSnippet', () => {
  it('o título fica no cabeçalho em texto, e o desenho no conteúdo', () => {
    const código = chartEmCardSnippet({ cardTitle: 'Acessos mensais', height: 220 });
    expect(código).toContain("from '@/components/ui/card';");
    expect(código).toContain("createCardTitle({ text: 'Acessos mensais' })");
    expect(código).toContain('conteudo.appendChild(createChart({');
    expect(código).toContain('card.append(cabecalho, conteudo);');
    // Título do cartão e título desenhado são coisas diferentes: dentro do
    // desenho ele seria pixel, e a busca da página não o alcançaria.
    expect(código).not.toContain("title: 'Acessos mensais'");
    expect(código).not.toContain('data-slot=');
  });
});
