import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { WorkloadItem } from '../types';
import ChartEmpty from './ChartEmpty';

type Props = {
  data: WorkloadItem[];
  loading?: boolean;
  error?: boolean;
};

const FILL = '#6366f1';

export default function WorkloadChart({ data, loading, error }: Props) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current || loading || error || data.length === 0) return;

    const width = 460;
    const height = 260;
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.assignee))
      .range([margin.left, width - margin.right])
      .padding(0.25);

    const maxCount = Math.max(1, d3.max(data, (d) => d.count) ?? 0);
    const y = d3
      .scaleLinear()
      .domain([0, maxCount])
      .nice()
      .range([height - margin.bottom, margin.top]);

    svg
      .append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-18)')
      .style('text-anchor', 'end');

    svg
      .append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y).ticks(5));

    svg
      .append('g')
      .selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', (d) => x(d.assignee) ?? 0)
      .attr('y', (d) => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', (d) => y(0) - y(d.count))
      .attr('rx', 6)
      .attr('fill', FILL)
      .append('title')
      .text((d) => `${d.assignee}: ${d.count} task(s)`);
  }, [data, loading, error]);

  if (loading) return <ChartEmpty state="loading" />;
  if (error) return <ChartEmpty state="error" />;
  if (!data.length) return <ChartEmpty state="empty" message="No assignees yet" />;

  return <svg ref={ref} className="chart-svg" />;
}
