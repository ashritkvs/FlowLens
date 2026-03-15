import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { AgingTask } from '../types';
import ChartEmpty from './ChartEmpty';

type Props = {
  data: AgingTask[];
  loading?: boolean;
  error?: boolean;
};

const priorityRank: Record<string, number> = { Low: 1, Medium: 2, High: 3, Critical: 4 };

export default function AgingScatterChart({ data, loading, error }: Props) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current || loading || error || data.length === 0) return;

    const width = 500;
    const height = 280;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const maxAge = Math.max(1, d3.max(data, (d) => d.ageDays) ?? 1);
    const x = d3
      .scaleLinear()
      .domain([0, maxAge])
      .nice()
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear().domain([1, 4]).range([height - margin.bottom, margin.top]);

    svg
      .append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(6));

    svg
      .append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(
        d3.axisLeft(y).ticks(4).tickFormat((d) => ['Low', 'Medium', 'High', 'Critical'][Number(d) - 1] ?? '')
      );

    svg
      .append('g')
      .selectAll('circle')
      .data(data)
      .join('circle')
      .attr('cx', (d) => x(d.ageDays))
      .attr('cy', (d) => y(priorityRank[d.priority] ?? 2))
      .attr('r', 7)
      .attr('fill', (d) => (d.blocked ? '#ef4444' : '#3b82f6'))
      .append('title')
      .text((d) => `${d.title} • ${d.ageDays} days`);
  }, [data, loading, error]);

  if (loading) return <ChartEmpty state="loading" />;
  if (error) return <ChartEmpty state="error" />;
  if (data.length === 0) return <ChartEmpty state="empty" />;

  return <svg ref={ref} className="chart-svg" />;
}
