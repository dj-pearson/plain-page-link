import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react';
import { useConnectedPlatforms, useOAuthInit, useSyncPlatform } from '@/hooks/useSearchAnalytics';
import type { SearchPlatform } from '@/types/searchAnalytics';

const PLATFORM_INFO: Record<SearchPlatform, { name: string; description: string; icon: string }> = {
  google_search_console: {
    name: 'Google Search Console',
    description: 'Search performance and indexing data',
    icon: '🔍',
  },
  google_analytics: {
    name: 'Google Analytics 4',
    description: 'Website traffic and user behavior',
    icon: '📊',
  },
  bing_webmaster: {
    name: 'Bing Webmaster Tools',
    description: 'Bing search performance data',
    icon: '🅱️',
  },
  yandex_webmaster: {
    name: 'Yandex Webmaster',
    description: 'Yandex search performance data',
    icon: '🇷🇺',
  },
};

export function PlatformConnections() {
  const { data: platforms, isLoading } = useConnectedPlatforms();
  const oauthInit = useOAuthInit();
  const syncMutation = useSyncPlatform();

  const handleConnect = (platform: SearchPlatform) => {
    oauthInit.mutate(platform);
  };

  const handleSync = (platform: SearchPlatform) => {
    syncMutation.mutate({ platform });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Platform Connections</CardTitle>
          <CardDescription>Loading connection status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Connections</CardTitle>
        <CardDescription>Connect and manage your analytics platforms</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {platforms?.map((platform) => {
            const info = PLATFORM_INFO[platform.platform];
            const isConnected = platform.is_connected;
            const isActive = platform.credential_status === 'active';
            const isExpired = platform.credential_status === 'expired';

            return (
              <Card key={platform.platform} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{info.icon}</span>
                      <div>
                        <CardTitle className="text-sm">{info.name}</CardTitle>
                      </div>
                    </div>
                    {isActive && (
                      <Badge variant="default" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    )}
                    {isExpired && (
                      <Badge variant="destructive" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Expired
                      </Badge>
                    )}
                    {!isConnected && (
                      <Badge variant="secondary" className="text-xs">
                        <XCircle className="h-3 w-3 mr-1" />
                        Not Connected
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs mt-1">
                    {info.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {platform.last_sync && (
                    <p className="text-xs text-muted-foreground mb-3">
                      Last sync: {new Date(platform.last_sync).toLocaleDateString()}
                    </p>
                  )}
                  <div className="flex flex-col gap-2">
                    {!isConnected || isExpired ? (
                      <Button
                        size="sm"
                        onClick={() => handleConnect(platform.platform)}
                        disabled={oauthInit.isPending}
                        className="w-full"
                      >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        {isExpired ? 'Reconnect' : 'Connect'}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSync(platform.platform)}
                        disabled={syncMutation.isPending}
                        className="w-full"
                      >
                        Sync Data
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
