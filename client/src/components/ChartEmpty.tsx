type Props = {
  state: 'loading' | 'empty' | 'error';
  message?: string;
};

export default function ChartEmpty({ state, message }: Props) {
  const defaultMessages = {
    loading: 'Loading…',
    empty: 'No data to display',
    error: 'Failed to load data',
  };
  const text = message ?? defaultMessages[state];
  return (
    <div className={`chart-state chart-state-${state}`}>
      <div className="chart-state-text">{text}</div>
    </div>
  );
}
