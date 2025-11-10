import { Check, X, ExternalLink } from 'lucide-react';

/**
 * BeforeAfterComparison Component
 * Shows Instagram bio with generic link tool vs AgentBio
 */
export function BeforeAfterComparison() {
  return (
    <section className="py-20 bg-background" id="comparison">
      <div className="container mx-auto px-4">
        <header className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
            <span className="glass-heading">Why Agents Choose AgentBio</span>
          </h2>
          <p className="text-xl glass-body max-w-2xl mx-auto">
            Generic link-in-bio tools weren't built for real estate. AgentBio was.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Before: Generic Link Tool */}
          <div className="relative">
            <div className="absolute -top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold z-10">
              ❌ Generic Link Tool
            </div>
            <div className="bg-glass-background backdrop-blur-md border-2 border-red-200 rounded-xl p-8 pt-12">
              {/* Mock Instagram Profile */}
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-20 h-20 rounded-full bg-gray-300" />
                  <div>
                    <div className="font-semibold text-gray-900">@sarahrealtor</div>
                    <div className="text-sm text-gray-600">Real Estate Agent 🏡</div>
                  </div>
                </div>
                <div className="text-sm text-gray-700 mb-3">
                  Helping families find their dream homes in Austin, TX
                </div>
                <a href="#" className="text-blue-600 text-sm font-medium flex items-center gap-1">
                  linktr.ee/sarahrealtor
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Problems List */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">No way to showcase sold properties or track record</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Generic contact forms don't qualify leads</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Can't display active listings with photos and prices</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">No buyer/seller specific forms or home valuation</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Limited analytics - can't track lead sources</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Looks like every other agent's profile</span>
                </div>
              </div>
            </div>
          </div>

          {/* After: AgentBio */}
          <div className="relative">
            <div className="absolute -top-4 left-4 bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold z-10">
              ✅ With AgentBio
            </div>
            <div className="bg-glass-background backdrop-blur-md border-2 border-green-200 rounded-xl p-8 pt-12">
              {/* Mock Instagram Profile */}
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
                  <div>
                    <div className="font-semibold text-gray-900">@sarahrealtor</div>
                    <div className="text-sm text-gray-600">Real Estate Agent 🏡</div>
                  </div>
                </div>
                <div className="text-sm text-gray-700 mb-3">
                  Helping families find their dream homes in Austin, TX
                </div>
                <a href="#" className="text-blue-600 text-sm font-medium flex items-center gap-1">
                  agentbio.net/sarahrealtor
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Benefits List */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground font-medium">Showcase sold properties with before/after photos</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground font-medium">Buyer & seller forms with automatic lead scoring</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground font-medium">Featured listings with price, beds/baths, MLS#</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground font-medium">Home valuation requests & property inquiries</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground font-medium">Advanced analytics: lead sources, conversions, ROI</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground font-medium">Professional themes designed for real estate</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <a
            href="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/20 transition-all"
          >
            Start With AgentBio Free
          </a>
          <p className="text-sm text-muted-foreground mt-3">
            Setup in under 10 minutes • No credit card required
          </p>
        </div>
      </div>
    </section>
  );
}
