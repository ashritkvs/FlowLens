import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { StatusBreakdownItem } from '../types';
import ChartEmpty from './ChartEmpty';

type Props = {
  data: StatusBreakdownItem[];
  loading?: boolean;
  error?: boolean;
};

const STATUS_COLORS: Record<string, string> = {
  Backlog: '#64748b',
  'In Progress': '#3b82f6',
  Blocked: '#ef4444',
  Review: '#f59e0b',
  Done: '#10b981',
};

export default function StatusBarChart({ data, loading, error }: Props) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current || loading || error) return;
    const hasData = data.length > 0 && data.some((d) => d.count > 0);
    if (!hasData) return;

    const width = 460;
    const height = 260;
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const maxCount = Math.max(1, d3.max(data, (d) => d.count) ?? 0);
    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.status))
      .range([margin.left, width - margin.right])
      .padding(0.25);

    const y = d3
      .scaleLinear()
      .domain([0, maxCount])
      .nice()
      .range([height - margin.bottom, margin.top]);

    svg
      .append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x));

    svg
      .append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y).ticks(5));

    svg
      .append('g')
      .selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', (d) => x(d.status) ?? 0)
      .attr('y', (d) => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', (d) => y(0) - y(d.count))
      .attr('rx', 6)
      .attr('fill', (d) => STATUS_COLORS[d.status] ?? '#7c3aed');
  }, [data, loading, error]);

  if (loading) return <ChartEmpty state="loading" />;
  if (error) return <ChartEmpty state="error" />;
  if (!data.length || !data.some((d) => d.count > 0)) {
    return <ChartEmpty state="empty" />;
  }

  return <svg ref={ref} className="chart-svg" />;
}
