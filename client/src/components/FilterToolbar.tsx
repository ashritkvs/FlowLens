import { TaskFilters as Filters } from '../types';

type Props = {
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  onClear: () => void;
};

const STATUS_OPTIONS = ['', 'Backlog', 'In Progress', 'Blocked', 'Review', 'Done'];
const PRIORITY_OPTIONS = ['', 'Low', 'Medium', 'High', 'Critical'];

export default function FilterToolbar({ filters, onFiltersChange, onClear }: Props) {
  const hasActive = [
    filters.status,
    filters.priority,
    filters.assignee,
    filters.search,
    filters.dateFrom,
    filters.dateTo,
  ].some(Boolean);

  return (
    <div className="filter-toolbar card">
      <div className="filter-toolbar-row">
        <input
          type="text"
          className="filter-search"
          placeholder="Search by title..."
          value={filters.search ?? ''}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value || undefined })}
        />
        <select
          value={filters.status ?? ''}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value || undefined })}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s || 'All statuses'}
            </option>
          ))}
        </select>
        <select
          value={filters.priority ?? ''}
          onChange={(e) => onFiltersChange({ ...filters, priority: e.target.value || undefined })}
        >
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p || 'All priorities'}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Assignee"
          value={filters.assignee ?? ''}
          onChange={(e) => onFiltersChange({ ...filters, assignee: e.target.value || undefined })}
          className="filter-assignee"
        />
        <span className="filter-dates">
          <input
            type="date"
            value={filters.dateFrom ?? ''}
            onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value || undefined })}
            title="Due from"
          />
          <span className="muted">–</span>
          <input
            type="date"
            value={filters.dateTo ?? ''}
            onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value || undefined })}
            title="Due to"
          />
        </span>
        {hasActive && (
          <button type="button" className="btn-secondary" onClick={onClear}>
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
