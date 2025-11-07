import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import type { SearchPlatform } from '@/types/searchAnalytics';

interface PlatformFilterProps {
  selectedPlatforms: SearchPlatform[];
  onChange: (platforms: SearchPlatform[]) => void;
}

const PLATFORMS: { value: SearchPlatform; label: string }[] = [
  { value: 'google_search_console', label: 'Google Search Console' },
  { value: 'google_analytics', label: 'Google Analytics' },
  { value: 'bing_webmaster', label: 'Bing Webmaster' },
  { value: 'yandex_webmaster', label: 'Yandex Webmaster' },
];

export function PlatformFilter({ selectedPlatforms, onChange }: PlatformFilterProps) {
  const handleToggle = (platform: SearchPlatform) => {
    if (selectedPlatforms.includes(platform)) {
      onChange(selectedPlatforms.filter(p => p !== platform));
    } else {
      onChange([...selectedPlatforms, platform]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Platforms ({selectedPlatforms.length})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Filter by Platform</h4>
          <div className="space-y-3">
            {PLATFORMS.map((platform) => (
              <div key={platform.value} className="flex items-center space-x-2">
                <Checkbox
                  id={platform.value}
                  checked={selectedPlatforms.includes(platform.value)}
                  onCheckedChange={() => handleToggle(platform.value)}
                />
                <Label
                  htmlFor={platform.value}
                  className="text-sm font-normal cursor-pointer"
                >
                  {platform.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
