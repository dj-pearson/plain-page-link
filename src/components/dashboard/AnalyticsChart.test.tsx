import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnalyticsChart } from './AnalyticsChart';

const data = [
  { name: 'Nov 1', views: 10, visitors: 4 },
  { name: 'Nov 2', views: 25, visitors: 9 },
  { name: 'Nov 3', views: 3, visitors: 1 },
];
const series = [
  { dataKey: 'views', name: 'Total Views', color: '#3B82F6' },
  { dataKey: 'visitors', name: 'Unique Visitors', color: '#10B981' },
];

describe('AnalyticsChart', () => {
  it('renders title, legend and an accessible data table', () => {
    render(<AnalyticsChart title="Profile Views" data={data} series={series} type="area" />);
    expect(screen.getByText('Profile Views', { selector: '[class*="font"]' })).toBeInTheDocument();
    const table = screen.getByRole('table');
    expect(table).toHaveTextContent('Nov 2');
    expect(table).toHaveTextContent('25');
    expect(screen.getAllByText('Total Views').length).toBeGreaterThan(0);
  });

  it('draws one line per series and an area fill for area charts', () => {
    const { container } = render(
      <AnalyticsChart title="t" data={data} series={series} type="area" />
    );
    const paths = container.querySelectorAll('svg path');
    // area + line for each of the two series
    expect(paths).toHaveLength(4);
    expect(container.querySelectorAll('linearGradient')).toHaveLength(2);
  });

  it('draws grouped bars for bar charts', () => {
    const { container } = render(
      <AnalyticsChart title="t" data={data} series={series} type="bar" />
    );
    // 3 points x 2 series, plus the transparent pointer-capture rect
    expect(container.querySelectorAll('svg rect')).toHaveLength(7);
  });

  it('shows a tooltip with every series value on hover and hides it on leave', () => {
    const { container } = render(
      <AnalyticsChart title="t" data={data} series={series} type="line" />
    );
    const svg = container.querySelector('svg')!;
    fireEvent.pointerMove(svg, { clientX: 10_000 });
    const tooltip = screen.getByTestId('analytics-chart-tooltip');
    expect(tooltip).toHaveTextContent('Nov 3');
    expect(tooltip).toHaveTextContent('Total Views');
    expect(tooltip).toHaveTextContent('3');
    fireEvent.pointerLeave(svg);
    expect(screen.queryByTestId('analytics-chart-tooltip')).toBeNull();
  });

  it('copes with a single placeholder point and no legend', () => {
    render(
      <AnalyticsChart
        title="t"
        data={[{ name: 'No data', views: 0, visitors: 0 }]}
        series={series}
        type="area"
        showLegend={false}
      />
    );
    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.getByRole('table')).toHaveTextContent('No data');
  });
});

describe('agent Analytics route weight (US-395)', () => {
  it('does not import recharts, which would put charts-vendor (107 KB gzip) back on the route', () => {
    const root = join(__dirname, '..', '..');
    for (const file of [
      'components/dashboard/AnalyticsChart.tsx',
      'pages/dashboard/Analytics.tsx',
      'components/analytics/ConversionFunnel.tsx',
      'components/analytics/LeadSourceBreakdown.tsx',
      'components/analytics/InsightsPanel.tsx',
      'components/analytics/ReportBuilder.tsx',
      'components/analytics/TopListingsCard.tsx',
      'components/analytics/InsightsWidget.tsx',
    ]) {
      const src = readFileSync(join(root, file), 'utf8');
      expect(src, file).not.toMatch(/from\s+['"]recharts['"]/);
    }
  });
});
