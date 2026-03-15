import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ThroughputPoint } from '../types';
import ChartEmpty from './ChartEmpty';

type Props = {
  data: ThroughputPoint[];
  loading?: boolean;
  error?: boolean;
};

export default function ThroughputLineChart({ data, loading, error }: Props) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current || loading || error || data.length === 0) return;

    const parsed = data.map((item) => ({ ...item, parsedDate: new Date(item.date) }));
    const width = 500;
    const height = 260;
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const x = d3
      .scaleTime()
      .domain(d3.extent(parsed, (d) => d.parsedDate) as [Date, Date])
      .range([margin.left, width - margin.right]);

    const yMax = Math.max(1, d3.max(parsed, (d) => d.count) ?? 0);
    const y = d3
      .scaleLinear()
      .domain([0, yMax])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const line = d3
      .line<(typeof parsed)[number]>()
      .x((d) => x(d.parsedDate))
      .y((d) => y(d.count));

    svg
      .append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5));

    svg
      .append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y).ticks(5));

    svg
      .append('path')
      .datum(parsed)
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('strokeWidth', 3)
      .attr('d', line);

    svg
      .append('g')
      .selectAll('circle')
      .data(parsed)
      .join('circle')
      .attr('cx', (d) => x(d.parsedDate))
      .attr('cy', (d) => y(d.count))
      .attr('r', 4)
      .attr('fill', '#10b981');
  }, [data, loading, error]);

  if (loading) return <ChartEmpty state="loading" />;
  if (error) return <ChartEmpty state="error" />;
  if (data.length === 0) return <ChartEmpty state="empty" message="No completions yet" />;

  return <svg ref={ref} className="chart-svg" />;
}
