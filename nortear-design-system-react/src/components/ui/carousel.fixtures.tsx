/**
 * Fixtures do Carousel — um slide e um medidor, seis consumidores.
 *
 * `SlideCard` existia em SEIS cópias (as cinco stories e a página de
 * documentação) e `visivelNoViewport` em quatro. Todas montavam a mesma coisa,
 * e é por isso que corrigir uma deixava as outras erradas: a moldura do slide
 * mudou numa cópia e as demais ficaram para trás sem ninguém notar.
 *
 * Fica fora dos `*.stories.tsx` porque no CSF TODO export nomeado é lido como
 * story: `export function SlideCard` dentro de um arquivo de story apareceria
 * na sidebar como se fosse um exemplo.
 */

/**
 * Slide de exemplo, sem medida cravada — proporção e cor vêm de classe, nunca
 * de `style`.
 *
 * `preencher` é a única dimensão que varia de verdade entre os consumidores, e
 * variava por CÓPIA: em horizontal a altura vem da proporção 16:9, mas em
 * vertical o slide já tem altura própria (a base `flex: 0 0 100%` resolvida
 * contra o trilho) e o cartão só precisa preenchê-la. O padrão é a proporção,
 * que é o que cinco dos seis consumidores pedem.
 */
export function SlideCard({
  label,
  preencher = false,
}: {
  label: string;
  preencher?: boolean;
}) {
  return (
    <div className={preencher ? "nds-h-full" : "nds-aspect-16-9"}>
      <div
        className="nds-cluster nds-h-full nds-bg-muted-soft nds-rounded-lg"
        data-align="center"
        data-justify="center"
      >
        <span className="nds-text-h3 nds-font-semibold nds-text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

/**
 * O slide divide área com o viewport?
 *
 * O Embla desloca o TRILHO com `transform` e nunca toca em `scrollLeft` — que
 * fica em zero o tempo todo. Só a geometria diz onde o carrossel parou.
 */
// O módulo exporta um componente E um medidor: o Fast Refresh perde o estado
// deste arquivo quando ele muda. É o preço certo — o slide e a medida do slide
// são a MESMA fixture, e separá-los em dois módulos traria de volta a chance de
// um andar sem o outro, que é exatamente o defeito que este arquivo remove.
// eslint-disable-next-line react-refresh/only-export-components
export function visivelNoViewport(slide: Element, viewport: Element): boolean {
  const s = slide.getBoundingClientRect();
  const v = viewport.getBoundingClientRect();
  return s.right > v.left + 1 && s.left < v.right - 1 && s.bottom > v.top + 1 && s.top < v.bottom - 1;
}
