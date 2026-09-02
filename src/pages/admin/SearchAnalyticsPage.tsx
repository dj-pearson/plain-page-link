import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SearchAnalyticsDashboard } from '@/components/admin/SearchAnalyticsDashboard';

/**
 * Search-console analytics, under /admin where it belongs (US-120).
 *
 * SearchAnalyticsDashboard — Google Search Console, GA4, Bing and Yandex OAuth
 * connections — was mounted in a "Search Analytics" tab of the agent-facing
 * /dashboard/analytics page, with no admin gate on it at all. It is the
 * platform's own SEO tooling: an agent has no use for it and no business
 * connecting a search-console property through it.
 */
export default function SearchAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold mt-2">Search Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Search Console, GA4, Bing and Yandex connections for agentbio.net
          </p>
        </div>

        <SearchAnalyticsDashboard />
      </div>
    </div>
  );
}
