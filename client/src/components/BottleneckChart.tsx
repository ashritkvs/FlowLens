import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { BottleneckItem } from '../types';
import ChartEmpty from './ChartEmpty';

type Props = {
  data: BottleneckItem[];
  loading?: boolean;
  error?: boolean;
};

export default function BottleneckChart({ data, loading, error }: Props) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current || loading || error || data.length === 0) return;

    const width = 460;
    const height = 260;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const maxCount = Math.max(1, d3.max(data, (d) => d.count) ?? 0);
    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.status))
      .range([margin.left, width - margin.right])
      .padding(0.3);

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
      .attr('fill', (d) => (d.isBottleneck ? '#f59e0b' : '#475569'))
      .attr('stroke', (d) => (d.isBottleneck ? '#fbbf24' : 'transparent'))
      .attr('stroke-width', (d) => (d.isBottleneck ? 2 : 0))
      .append('title')
      .text(
        (d) =>
          `${d.status}: ${d.count} task(s), avg ${d.averageDaysInStatus} days${d.isBottleneck ? ' (bottleneck)' : ''}`
      );
  }, [data, loading, error]);

  if (loading) return <ChartEmpty state="loading" />;
  if (error) return <ChartEmpty state="error" />;
  if (!data.length) return <ChartEmpty state="empty" />;

  return <svg ref={ref} className="chart-svg" />;
}
