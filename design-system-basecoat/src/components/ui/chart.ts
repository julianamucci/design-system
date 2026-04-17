import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChartDataPoint = {
  label: string;
  value: number;
};

export type ChartType = 'bar' | 'line';

export type ChartOptions = {
  data: ChartDataPoint[];
  type?: ChartType;
  height?: number;
  colors?: string[];
  class?: string;
};

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  '#60a5fa',
  '#34d399',
  '#f59e0b',
  '#f87171',
  '#a78bfa',
];

const SVG_NS = 'http://www.w3.org/2000/svg';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createSvgEl<K extends keyof SVGElementTagNameMap>(tag: K): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, tag) as SVGElementTagNameMap[K];
}

// ─── createChart ──────────────────────────────────────────────────────────────

export function createChart(options: ChartOptions): HTMLElement {
  const { data, type = 'bar', height = 200, colors = DEFAULT_COLORS } = options;

  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'chart';
  wrapper.className = cn('w-full overflow-hidden', options.class);

  if (!data.length) {
    const empty = document.createElement('p');
    empty.className = 'text-sm text-muted-foreground text-center py-4';
    empty.textContent = 'No data';
    wrapper.appendChild(empty);
    return wrapper;
  }

  const PADDING = { top: 16, right: 16, bottom: 40, left: 44 };
  const svgWidth = 400;
  const svgHeight = height;
  const chartWidth = svgWidth - PADDING.left - PADDING.right;
  const chartHeight = svgHeight - PADDING.top - PADDING.bottom;

  const maxValue = Math.max(...data.map((d) => d.value), 0);
  const minValue = 0;
  const range = maxValue - minValue || 1;

  const svg = createSvgEl('svg');
  svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', String(svgHeight));
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Chart');
  svg.style.display = 'block';

  const g = createSvgEl('g');
  g.setAttribute('transform', `translate(${PADDING.left},${PADDING.top})`);

  // Y-axis gridlines & labels
  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const val = minValue + (range * i) / yTicks;
    const y = chartHeight - (chartHeight * i) / yTicks;

    const line = createSvgEl('line');
    line.setAttribute('x1', '0');
    line.setAttribute('y1', String(y));
    line.setAttribute('x2', String(chartWidth));
    line.setAttribute('y2', String(y));
    line.setAttribute('stroke', 'currentColor');
    line.setAttribute('stroke-opacity', '0.1');
    line.setAttribute('stroke-width', '1');
    g.appendChild(line);

    const label = createSvgEl('text');
    label.setAttribute('x', '-8');
    label.setAttribute('y', String(y + 4));
    label.setAttribute('text-anchor', 'end');
    label.setAttribute('fill', 'currentColor');
    label.setAttribute('opacity', '0.6');
    label.setAttribute('font-size', '10');
    label.textContent = val % 1 === 0 ? String(Math.round(val)) : val.toFixed(1);
    g.appendChild(label);
  }

  if (type === 'bar') {
    const barWidth = (chartWidth / data.length) * 0.6;
    const barGap = chartWidth / data.length;

    data.forEach((d, i) => {
      const barHeight = (d.value / range) * chartHeight;
      const x = i * barGap + (barGap - barWidth) / 2;
      const y = chartHeight - barHeight;
      const color = colors[i % colors.length];

      const rect = createSvgEl('rect');
      rect.setAttribute('x', String(x));
      rect.setAttribute('y', String(y));
      rect.setAttribute('width', String(barWidth));
      rect.setAttribute('height', String(barHeight));
      rect.setAttribute('fill', color);
      rect.setAttribute('rx', '2');
      rect.setAttribute('role', 'graphics-symbol');
      rect.setAttribute('aria-label', `${d.label}: ${d.value}`);
      g.appendChild(rect);

      // X label
      const xLabel = createSvgEl('text');
      xLabel.setAttribute('x', String(x + barWidth / 2));
      xLabel.setAttribute('y', String(chartHeight + 16));
      xLabel.setAttribute('text-anchor', 'middle');
      xLabel.setAttribute('fill', 'currentColor');
      xLabel.setAttribute('opacity', '0.6');
      xLabel.setAttribute('font-size', '10');
      xLabel.textContent = d.label.length > 8 ? d.label.slice(0, 7) + '…' : d.label;
      g.appendChild(xLabel);
    });
  } else {
    // Line chart
    const stepX = chartWidth / (data.length - 1 || 1);

    const points = data.map((d, i) => {
      const x = i * stepX;
      const y = chartHeight - ((d.value - minValue) / range) * chartHeight;
      return { x, y, d };
    });

    // Area fill
    const areaPoints = [
      `${points[0].x},${chartHeight}`,
      ...points.map((p) => `${p.x},${p.y}`),
      `${points[points.length - 1].x},${chartHeight}`,
    ].join(' ');

    const area = createSvgEl('polygon');
    area.setAttribute('points', areaPoints);
    area.setAttribute('fill', colors[0]);
    area.setAttribute('opacity', '0.15');
    g.appendChild(area);

    // Line path
    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const path = createSvgEl('path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', colors[0]);
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    g.appendChild(path);

    // Dots + labels
    points.forEach(({ x, y, d: dataPoint }, i) => {
      const circle = createSvgEl('circle');
      circle.setAttribute('cx', String(x));
      circle.setAttribute('cy', String(y));
      circle.setAttribute('r', '3');
      circle.setAttribute('fill', colors[i % colors.length]);
      circle.setAttribute('role', 'graphics-symbol');
      circle.setAttribute('aria-label', `${dataPoint.label}: ${dataPoint.value}`);
      g.appendChild(circle);

      const xLabel = createSvgEl('text');
      xLabel.setAttribute('x', String(x));
      xLabel.setAttribute('y', String(chartHeight + 16));
      xLabel.setAttribute('text-anchor', 'middle');
      xLabel.setAttribute('fill', 'currentColor');
      xLabel.setAttribute('opacity', '0.6');
      xLabel.setAttribute('font-size', '10');
      xLabel.textContent = dataPoint.label.length > 8 ? dataPoint.label.slice(0, 7) + '…' : dataPoint.label;
      g.appendChild(xLabel);
    });
  }

  svg.appendChild(g);
  wrapper.appendChild(svg);
  return wrapper;
}
