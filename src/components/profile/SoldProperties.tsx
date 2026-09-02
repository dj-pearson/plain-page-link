import { useState } from 'react';
import { Trophy, TrendingUp } from 'lucide-react';
import { parsePrice } from '@/lib/format';
import ListingCard from './ListingCard';
import type { PublicProfileListing } from '@/types';

interface SoldPropertiesProps {
  listings: PublicProfileListing[];
  onListingClick?: (listing: PublicProfileListing) => void;
  /**
   * Render the "Recent Success Stories" summary above the grid.
   *
   * Off by default: the public profile already shows SocialProofBanner with
   * the same properties-sold and volume figures a few sections higher, so this
   * bar restated them a second time on the same page (US-112). Kept as an
   * option for any surface that renders sold properties on their own.
   */
  showStats?: boolean;
}

export default function SoldProperties({
  listings,
  onListingClick,
  showStats = false,
}: SoldPropertiesProps) {
  // Every hook before the early return — a hook after it runs on some renders
  // and not others, which is what react-hooks/rules-of-hooks forbids.
  const [showAll, setShowAll] = useState(false);

  const soldListings = listings.filter((l) => l.status === 'sold');

  if (soldListings.length === 0) {
    return null;
  }

  // Only listings with a real price contribute to the volume figures. Every
  // sold listing counted before, so a missing price pulled the average down and
  // rendered "$0K+" for an agent whose listings simply had no price recorded
  // (US-112).
  const pricedSales = soldListings.map((l) => parsePrice(l.price)).filter((price) => price > 0);
  const totalValue = pricedSales.reduce((sum, price) => sum + price, 0);
  const avgSalePrice = pricedSales.length > 0 ? totalValue / pricedSales.length : 0;
  const hasVolume = totalValue > 0;

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      {showStats && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="h-8 w-8" />
            <div>
              <h2 className="text-2xl font-bold">Recent Success Stories</h2>
              <p className="text-blue-100">Proven track record of successful sales</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-3xl font-bold">{soldListings.length}</p>
              <p className="text-sm text-blue-100">Properties Sold</p>
            </div>
            {hasVolume && (
              <>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <p className="text-3xl font-bold">
                    $
                    {totalValue >= 1000000
                      ? `${(totalValue / 1000000).toFixed(1)}M+`
                      : `${(totalValue / 1000).toFixed(0)}K+`}
                  </p>
                  <p className="text-sm text-blue-100">Total Volume</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 col-span-2 md:col-span-1">
                  <p className="text-3xl font-bold flex items-center gap-2">
                    $
                    {avgSalePrice >= 1000000
                      ? `${(avgSalePrice / 1000000).toFixed(1)}M`
                      : `${(avgSalePrice / 1000).toFixed(0)}K`}
                    <TrendingUp className="h-5 w-5" />
                  </p>
                  <p className="text-sm text-blue-100">Avg Sale Price</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Sold Listings Grid */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Recently Sold</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(showAll ? soldListings : soldListings.slice(0, 6)).map((listing) => (
            <div key={listing.id} className="relative">
              <ListingCard listing={listing} onClick={() => onListingClick?.(listing)} />
              {/* Sold overlay */}
              <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center pointer-events-none">
                <div className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-2xl transform -rotate-12 shadow-xl">
                  SOLD
                </div>
              </div>
            </div>
          ))}
        </div>

        {soldListings.length > 6 && (
          <div className="text-center mt-6">
            {/* Had no onClick at all — a button that named a number and did
                nothing when pressed (US-112). */}
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              {showAll ? 'Show fewer' : `View All ${soldListings.length} Sold Properties →`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
