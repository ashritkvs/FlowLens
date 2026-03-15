import { Overview } from '../types';

type Props = { overview: Overview | null };

export default function KpiCards({ overview }: Props) {
  const cards = overview
    ? [
        ['Total Tasks', overview.totalTasks],
        ['Done', overview.doneTasks],
        ['Blocked', overview.blockedTasks],
        ['Overdue', overview.overdueTasks],
        ['Avg Age (days)', overview.averageTaskAgeDays],
        ...(overview.averageLeadTimeDays != null ? [['Avg Lead (days)', overview.averageLeadTimeDays]] : []),
        ...(overview.averageCycleTimeDays != null ? [['Avg Cycle (days)', overview.averageCycleTimeDays]] : []),
      ]
    : [];

  return (
    <div className="kpi-grid">
      {cards.map(([label, value]) => (
        <div className="card kpi-card" key={String(label)}>
          <div className="muted kpi-label">{label}</div>
          <div className="kpi-value">{value}</div>
        </div>
      ))}
    </div>
  );
}
