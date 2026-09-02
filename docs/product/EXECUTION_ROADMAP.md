# AI-Powered Lead Intelligence & Conversion Engine
## Product Requirements Document - Implementation Timeline

**Version:** 2.0  
**Date:** November 11, 2025  
**Project Codename:** AgentBio Intelligence  
**Strategic Priority:** Category-defining competitive moat

---

## Executive Summary

This PRD outlines the 18-month transformation of AgentBio from a portfolio showcase platform into an AI-powered sales intelligence engine. By leveraging proprietary behavioral data, machine learning, and predictive analytics, we will create an unassailable competitive advantage that makes AgentBio indispensable to real estate professionals.

**Core Thesis:** Agents don't just need leads—they need to know *which* leads will close and *how* to close them faster.

---

## Phase 1: Data Foundation (Months 1-3)
### Goal: Instrument platform to capture behavioral intelligence

### Month 1: Enhanced Analytics Infrastructure

#### Week 1-2: Schema Design & Database Extensions

**New Tables:**

```sql
-- Lead behavioral tracking
CREATE TABLE lead_interactions (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  profile_id UUID REFERENCES profiles(id),
  event_type VARCHAR(50), -- 'page_view', 'scroll_depth', 'property_view', 'return_visit'
  event_data JSONB, -- Flexible storage for event-specific data
  property_id UUID REFERENCES listings(id) NULL,
  session_id VARCHAR(255),
  duration_seconds INTEGER,
  scroll_percentage INTEGER,
  device_type VARCHAR(50),
  referrer_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Property engagement metrics
CREATE TABLE property_engagement_metrics (
  id UUID PRIMARY KEY,
  listing_id UUID REFERENCES listings(id),
  profile_id UUID REFERENCES profiles(id),
  date DATE,
  total_views INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  avg_time_on_page INTEGER, -- seconds
  avg_scroll_depth INTEGER, -- percentage
  inquiry_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  inquiry_rate DECIMAL(5,2), -- inquiries / unique_views
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(listing_id, date)
);

-- Agent performance tracking
CREATE TABLE agent_performance_metrics (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  period_start DATE,
  period_end DATE,
  total_leads INTEGER,
  contacted_leads INTEGER,
  qualified_leads INTEGER,
  closed_deals INTEGER,
  avg_days_to_contact DECIMAL(5,2),
  avg_days_to_close DECIMAL(5,2),
  conversion_rate DECIMAL(5,2), -- closed / total leads
  created_at TIMESTAMP DEFAULT NOW()
);

-- Lead outcome tracking (critical for ML training)
CREATE TABLE lead_outcomes (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  profile_id UUID REFERENCES profiles(id),
  outcome VARCHAR(50), -- 'closed_won', 'closed_lost', 'nurturing', 'unresponsive'
  outcome_date DATE,
  deal_value DECIMAL(12,2) NULL, -- commission or sale price
  days_to_close INTEGER,
  loss_reason TEXT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Session tracking for visitor patterns
CREATE TABLE visitor_sessions (
  id UUID PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE,
  profile_id UUID REFERENCES profiles(id),
  first_visit TIMESTAMP,
  last_visit TIMESTAMP,
  visit_count INTEGER DEFAULT 1,
  total_duration_seconds INTEGER DEFAULT 0,
  properties_viewed INTEGER DEFAULT 0,
  converted_to_lead BOOLEAN DEFAULT FALSE,
  lead_id UUID REFERENCES leads(id) NULL,
  device_info JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Market benchmarks (aggregate data)
CREATE TABLE market_benchmarks (
  id UUID PRIMARY KEY,
  metric_type VARCHAR(100), -- 'avg_inquiry_rate', 'avg_time_to_close', etc.
  property_type VARCHAR(50), -- 'single_family', 'condo', etc.
  price_range VARCHAR(50), -- '0-250k', '250k-500k', etc.
  market_area VARCHAR(100), -- city or metro area
  metric_value DECIMAL(10,2),
  sample_size INTEGER,
  calculation_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes for Performance:**
```sql
CREATE INDEX idx_lead_interactions_lead_id ON lead_interactions(lead_id);
CREATE INDEX idx_lead_interactions_property_id ON lead_interactions(property_id);
CREATE INDEX idx_lead_interactions_created_at ON lead_interactions(created_at);
CREATE INDEX idx_property_engagement_listing_date ON property_engagement_metrics(listing_id, date);
CREATE INDEX idx_visitor_sessions_profile_id ON visitor_sessions(profile_id);
CREATE INDEX idx_lead_outcomes_profile_id ON lead_outcomes(profile_id, outcome);
```

#### Week 3-4: Frontend Instrumentation

**Component: Enhanced Analytics Tracker**

```typescript
// /src/lib/analytics/intelligenceTracker.ts

interface AnalyticsEvent {
  eventType: 'page_view' | 'scroll_depth' | 'property_view' | 'property_interaction' | 'form_start' | 'form_abandon' | 'return_visit';
  eventData: Record<string, any>;
  sessionId: string;
  propertyId?: string;
}

class IntelligenceTracker {
  private sessionId: string;
  private startTime: number;
  private scrollThresholds = [25, 50, 75, 90, 100];
  private scrollTracked = new Set<number>();
  private propertyViewTime: Map<string, number> = new Map();

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.startTime = Date.now();
    this.initializeTracking();
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('agentbio_session');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('agentbio_session', sessionId);
    }
    return sessionId;
  }

  private initializeTracking() {
    // Scroll depth tracking
    const scrollHandler = throttle(() => {
      const scrollPercentage = this.calculateScrollPercentage();
      this.scrollThresholds.forEach(threshold => {
        if (scrollPercentage >= threshold && !this.scrollTracked.has(threshold)) {
          this.scrollTracked.add(threshold);
          this.track({
            eventType: 'scroll_depth',
            eventData: { scrollPercentage: threshold }
          });
        }
      });
    }, 1000);

    window.addEventListener('scroll', scrollHandler);

    // Time on page tracking
    window.addEventListener('beforeunload', () => {
      this.trackPageDuration();
    });

    // Visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackPageDuration();
      }
    });
  }

  trackPropertyView(propertyId: string) {
    this.propertyViewTime.set(propertyId, Date.now());
    this.track({
      eventType: 'property_view',
      eventData: { propertyId },
      propertyId
    });
  }

  trackPropertyInteraction(propertyId: string, interactionType: string) {
    this.track({
      eventType: 'property_interaction',
      eventData: { 
        propertyId, 
        interactionType, // 'photo_gallery_open', 'map_view', 'share_click', 'schedule_showing'
        viewDuration: this.getPropertyViewDuration(propertyId)
      },
      propertyId
    });
  }

  trackFormStart(formType: string) {
    this.track({
      eventType: 'form_start',
      eventData: { formType }
    });
  }

  trackFormAbandon(formType: string, fieldsCompleted: string[]) {
    this.track({
      eventType: 'form_abandon',
      eventData: { formType, fieldsCompleted }
    });
  }

  private async track(event: AnalyticsEvent) {
    try {
      await supabase.from('lead_interactions').insert({
        session_id: this.sessionId,
        event_type: event.eventType,
        event_data: event.eventData,
        property_id: event.propertyId,
        device_type: this.getDeviceType(),
        referrer_url: document.referrer,
        duration_seconds: Math.floor((Date.now() - this.startTime) / 1000)
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  private calculateScrollPercentage(): number {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return Math.round((scrollTop / (documentHeight - windowHeight)) * 100);
  }

  private getPropertyViewDuration(propertyId: string): number {
    const startTime = this.propertyViewTime.get(propertyId);
    return startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
  }

  private getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  private trackPageDuration() {
    const duration = Math.floor((Date.now() - this.startTime) / 1000);
    // Send duration data to backend
    navigator.sendBeacon('/api/analytics/page-duration', JSON.stringify({
      sessionId: this.sessionId,
      duration
    }));
  }
}

export const intelligenceTracker = new IntelligenceTracker();
```

**Integration Points:**

```typescript
// /src/pages/Profile.tsx - Public agent profile page
useEffect(() => {
  intelligenceTracker.track({
    eventType: 'page_view',
    eventData: { 
      profileUsername: username,
      referrer: document.referrer 
    }
  });
}, []);

// /src/components/listings/ListingCard.tsx
const handlePropertyClick = (property: Listing) => {
  intelligenceTracker.trackPropertyView(property.id);
  // ... existing click handler
};

// /src/components/forms/LeadForm.tsx
const handleFormStart = () => {
  intelligenceTracker.trackFormStart(formType);
};

const handleFormAbandon = () => {
  const completedFields = Object.keys(formData).filter(key => formData[key]);
  intelligenceTracker.trackFormAbandon(formType, completedFields);
};
```

#### Success Metrics - Month 1:
- ✅ All new tables deployed to production
- ✅ Frontend tracking capturing 95%+ of interactions
- ✅ Zero performance degradation (<50ms tracking overhead)
- ✅ 10,000+ behavioral events captured daily (baseline)

---

### Month 2: Session Analytics & Lead Enrichment

#### Week 1-2: Session Aggregation Pipeline

**New Edge Function: aggregate-session-data**

```typescript
// supabase/functions/aggregate-session-data/index.ts

interface SessionAnalytics {
  sessionId: string;
  profileId: string;
  totalDuration: number;
  propertiesViewed: string[];
  deepEngagementProperties: string[]; // Viewed >30s or >75% scroll
  formStarted: boolean;
  formCompleted: boolean;
  conversionIntent: 'high' | 'medium' | 'low';
}

Deno.serve(async (req) => {
  const { sessionId } = await req.json();

  // Aggregate all interactions for session
  const { data: interactions } = await supabaseAdmin
    .from('lead_interactions')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at');

  const analytics: SessionAnalytics = {
    sessionId,
    profileId: interactions[0]?.profile_id,
    totalDuration: interactions[interactions.length - 1]?.duration_seconds || 0,
    propertiesViewed: [...new Set(interactions
      .filter(i => i.event_type === 'property_view')
      .map(i => i.property_id))],
    deepEngagementProperties: [],
    formStarted: interactions.some(i => i.event_type === 'form_start'),
    formCompleted: interactions.some(i => i.event_type === 'form_submit'),
    conversionIntent: 'low'
  };

  // Calculate deep engagement
  const propertyViewTimes = new Map<string, number>();
  interactions.forEach(interaction => {
    if (interaction.event_type === 'property_view') {
      const nextInteraction = interactions[interactions.indexOf(interaction) + 1];
      if (nextInteraction) {
        const duration = nextInteraction.duration_seconds - interaction.duration_seconds;
        propertyViewTimes.set(interaction.property_id, duration);
      }
    }
  });

  analytics.deepEngagementProperties = Array.from(propertyViewTimes.entries())
    .filter(([_, duration]) => duration > 30)
    .map(([propertyId, _]) => propertyId);

  // Calculate conversion intent
  analytics.conversionIntent = calculateConversionIntent(analytics);

  // Update visitor_sessions table
  await supabaseAdmin
    .from('visitor_sessions')
    .upsert({
      session_id: sessionId,
      profile_id: analytics.profileId,
      last_visit: new Date().toISOString(),
      visit_count: supabaseAdmin.rpc('increment'),
      total_duration_seconds: analytics.totalDuration,
      properties_viewed: analytics.propertiesViewed.length,
      device_info: { /* ... */ }
    });

  return new Response(JSON.stringify(analytics), {
    headers: { 'Content-Type': 'application/json' }
  });
});

function calculateConversionIntent(analytics: SessionAnalytics): 'high' | 'medium' | 'low' {
  let score = 0;
  
  if (analytics.deepEngagementProperties.length >= 2) score += 30;
  if (analytics.totalDuration > 120) score += 20; // 2+ minutes
  if (analytics.formStarted) score += 40;
  if (analytics.formCompleted) score += 50;
  if (analytics.propertiesViewed.length >= 3) score += 20;

  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}
```

#### Week 3-4: Lead Enrichment System

**Enhanced Lead Capture with Behavioral Context**

```typescript
// supabase/functions/submit-lead/index.ts (enhanced)

Deno.serve(async (req) => {
  const { formData, sessionId } = await req.json();

  // Get session analytics
  const { data: sessionData } = await supabaseAdmin
    .from('visitor_sessions')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  // Get viewed properties with engagement metrics
  const { data: viewedProperties } = await supabaseAdmin
    .from('lead_interactions')
    .select('property_id, event_data, duration_seconds')
    .eq('session_id', sessionId)
    .eq('event_type', 'property_view');

  // Calculate behavioral score
  const behavioralScore = calculateBehavioralScore({
    sessionData,
    viewedProperties,
    formData
  });

  // Create lead with enriched data
  const { data: lead } = await supabaseAdmin
    .from('leads')
    .insert({
      ...formData,
      session_id: sessionId,
      behavioral_score: behavioralScore,
      visited_count: sessionData?.visit_count || 1,
      total_engagement_time: sessionData?.total_duration_seconds || 0,
      properties_viewed: viewedProperties?.map(p => p.property_id) || [],
      deep_engagement_properties: viewedProperties
        ?.filter(p => p.duration_seconds > 30)
        .map(p => p.property_id) || [],
      metadata: {
        deviceType: sessionData?.device_info?.type,
        firstVisit: sessionData?.first_visit,
        referrer: sessionData?.device_info?.referrer,
        engagementScore: behavioralScore
      }
    })
    .select()
    .single();

  // Link session to lead
  await supabaseAdmin
    .from('visitor_sessions')
    .update({ 
      converted_to_lead: true, 
      lead_id: lead.id 
    })
    .eq('session_id', sessionId);

  return new Response(JSON.stringify({ success: true, lead }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

function calculateBehavioralScore(data: any): number {
  let score = 50; // baseline

  // Visit frequency
  if (data.sessionData?.visit_count > 1) score += 15;
  if (data.sessionData?.visit_count > 3) score += 10;

  // Engagement depth
  if (data.sessionData?.total_duration_seconds > 120) score += 10;
  if (data.sessionData?.total_duration_seconds > 300) score += 15;

  // Property interest
  if (data.viewedProperties?.length >= 2) score += 10;
  if (data.viewedProperties?.length >= 4) score += 10;

  // Deep engagement
  const deepEngagement = data.viewedProperties?.filter(p => p.duration_seconds > 30).length || 0;
  score += deepEngagement * 5;

  // Form completion quality
  const completedFields = Object.keys(data.formData).filter(k => data.formData[k]).length;
  score += Math.min(completedFields * 2, 20);

  return Math.min(score, 100);
}
```

#### Success Metrics - Month 2:
- ✅ Session analytics aggregating in real-time
- ✅ 100% of leads enriched with behavioral data
- ✅ Behavioral scores assigned to all new leads
- ✅ Agent dashboard shows enriched lead data

---

### Month 3: Agent Performance Tracking & Outcome Labeling

#### Week 1-2: Lead Outcome Tracking UI

**New Dashboard Component: Lead Outcome Manager**

```typescript
// /src/components/leads/LeadOutcomeManager.tsx

interface LeadOutcome {
  leadId: string;
  outcome: 'closed_won' | 'closed_lost' | 'nurturing' | 'unresponsive';
  dealValue?: number;
  daysToClose?: number;
  lossReason?: string;
  notes?: string;
}

export function LeadOutcomeManager({ lead }: { lead: Lead }) {
  const [outcome, setOutcome] = useState<LeadOutcome>({
    leadId: lead.id,
    outcome: 'nurturing'
  });

  const handleOutcomeSubmit = async () => {
    await supabase.from('lead_outcomes').insert({
      lead_id: outcome.leadId,
      profile_id: lead.profile_id,
      outcome: outcome.outcome,
      outcome_date: new Date().toISOString(),
      deal_value: outcome.dealValue,
      days_to_close: outcome.daysToClose,
      loss_reason: outcome.lossReason,
      notes: outcome.notes
    });

    // Update lead status
    await supabase
      .from('leads')
      .update({ status: outcome.outcome })
      .eq('id', lead.id);

    toast.success('Lead outcome recorded');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Lead Status</CardTitle>
        <CardDescription>
          Help us improve predictions by tracking outcomes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>Outcome</Label>
            <Select 
              value={outcome.outcome}
              onValueChange={(value) => setOutcome({...outcome, outcome: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="closed_won">🎉 Closed - Won</SelectItem>
                <SelectItem value="closed_lost">❌ Closed - Lost</SelectItem>
                <SelectItem value="nurturing">🌱 Still Nurturing</SelectItem>
                <SelectItem value="unresponsive">👻 Unresponsive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {outcome.outcome === 'closed_won' && (
            <>
              <div>
                <Label>Deal Value (Commission)</Label>
                <Input
                  type="number"
                  placeholder="5000"
                  value={outcome.dealValue}
                  onChange={(e) => setOutcome({...outcome, dealValue: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label>Days to Close</Label>
                <Input
                  type="number"
                  placeholder="45"
                  value={outcome.daysToClose}
                  onChange={(e) => setOutcome({...outcome, daysToClose: parseInt(e.target.value)})}
                />
              </div>
            </>
          )}

          {outcome.outcome === 'closed_lost' && (
            <div>
              <Label>Why did we lose this lead?</Label>
              <Select
                value={outcome.lossReason}
                onValueChange={(value) => setOutcome({...outcome, lossReason: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Pricing concerns</SelectItem>
                  <SelectItem value="timing">Wrong timing</SelectItem>
                  <SelectItem value="competitor">Chose competitor</SelectItem>
                  <SelectItem value="financing">Financing issues</SelectItem>
                  <SelectItem value="unqualified">Not qualified</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Notes</Label>
            <Textarea
              placeholder="Add context about this outcome..."
              value={outcome.notes}
              onChange={(e) => setOutcome({...outcome, notes: e.target.value})}
            />
          </div>

          <Button onClick={handleOutcomeSubmit} className="w-full">
            Save Outcome
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### Week 3: Agent Performance Dashboard

**New Page: /dashboard/intelligence**

```typescript
// /src/pages/dashboard/Intelligence.tsx

export function IntelligenceDashboard() {
  const { profile } = useAuthStore();
  const { data: performanceMetrics } = useQuery({
    queryKey: ['agent-performance', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('agent_performance_metrics')
        .select('*')
        .eq('profile_id', profile?.id)
        .order('period_start', { ascending: false })
        .limit(6);
      return data;
    }
  });

  const currentPeriod = performanceMetrics?.[0];
  const previousPeriod = performanceMetrics?.[1];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Performance Intelligence</h1>
        <p className="text-muted-foreground">
          Track your conversion metrics and improve over time
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Conversion Rate"
          value={`${currentPeriod?.conversion_rate.toFixed(1)}%`}
          change={calculateChange(currentPeriod?.conversion_rate, previousPeriod?.conversion_rate)}
          icon={TrendingUp}
        />
        <MetricCard
          title="Avg. Days to Close"
          value={currentPeriod?.avg_days_to_close.toFixed(0)}
          change={calculateChange(previousPeriod?.avg_days_to_close, currentPeriod?.avg_days_to_close)} // inverse
          icon={Clock}
        />
        <MetricCard
          title="Closed Deals"
          value={currentPeriod?.closed_deals}
          change={calculateChange(currentPeriod?.closed_deals, previousPeriod?.closed_deals)}
          icon={DollarSign}
        />
        <MetricCard
          title="Response Time"
          value={`${currentPeriod?.avg_days_to_contact.toFixed(1)}d`}
          change={calculateChange(previousPeriod?.avg_days_to_contact, currentPeriod?.avg_days_to_contact)} // inverse
          icon={MessageSquare}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <ConversionFunnelChart data={currentPeriod} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart data={performanceMetrics} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Lead Quality Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadQualityChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

#### Week 4: Automated Performance Calculation

**Edge Function: calculate-agent-performance**

```typescript
// supabase/functions/calculate-agent-performance/index.ts
// Runs daily via cron job

Deno.serve(async (req) => {
  const today = new Date();
  const periodStart = new Date(today.getFullYear(), today.getMonth(), 1); // First of month
  const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last of month

  // Get all agents
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id');

  for (const profile of profiles) {
    // Get leads for period
    const { data: leads } = await supabaseAdmin
      .from('leads')
      .select(`
        *,
        lead_outcomes(*)
      `)
      .eq('profile_id', profile.id)
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString());

    const totalLeads = leads.length;
    const contactedLeads = leads.filter(l => l.status !== 'new').length;
    const closedDeals = leads.filter(l => l.lead_outcomes?.outcome === 'closed_won').length;
    
    // Calculate average days to contact
    const contactedDays = leads
      .filter(l => l.status !== 'new')
      .map(l => {
        const created = new Date(l.created_at);
        const contacted = new Date(l.updated_at);
        return (contacted.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      });
    const avgDaysToContact = contactedDays.length > 0
      ? contactedDays.reduce((a, b) => a + b, 0) / contactedDays.length
      : 0;

    // Calculate average days to close
    const closedDays = leads
      .filter(l => l.lead_outcomes?.outcome === 'closed_won')
      .map(l => l.lead_outcomes.days_to_close);
    const avgDaysToClose = closedDays.length > 0
      ? closedDays.reduce((a, b) => a + b, 0) / closedDays.length
      : 0;

    const conversionRate = totalLeads > 0 ? (closedDeals / totalLeads) * 100 : 0;

    // Upsert performance metrics
    await supabaseAdmin
      .from('agent_performance_metrics')
      .upsert({
        profile_id: profile.id,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        total_leads: totalLeads,
        contacted_leads: contactedLeads,
        qualified_leads: leads.filter(l => l.status === 'qualified').length,
        closed_deals: closedDeals,
        avg_days_to_contact: avgDaysToContact,
        avg_days_to_close: avgDaysToClose,
        conversion_rate: conversionRate
      });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

#### Success Metrics - Month 3:
- ✅ 50% of agents tracking lead outcomes regularly
- ✅ 500+ labeled lead outcomes (training data for ML)
- ✅ Performance dashboard live for all agents
- ✅ Automated performance calculations running daily

---

## Phase 2: Machine Learning Foundation (Months 4-6)
### Goal: Build and deploy predictive models

### Month 4: Data Science Infrastructure & Initial Models

#### Week 1-2: ML Infrastructure Setup

**New Service: Python ML API (FastAPI)**

```
/ml-service/
├── app/
│   ├── models/
│   │   ├── lead_scoring.py
│   │   ├── conversion_prediction.py
│   │   └── churn_prediction.py
│   ├── training/
│   │   ├── train_lead_scorer.py
│   │   └── feature_engineering.py
│   ├── api/
│   │   ├── predict.py
│   │   └── health.py
│   └── main.py
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

**requirements.txt:**
```
fastapi==0.104.1
uvicorn==0.24.0
pandas==2.1.3
scikit-learn==1.3.2
xgboost==2.0.2
pydantic==2.5.0
supabase==2.0.3
python-dotenv==1.0.0
```

**app/models/lead_scoring.py:**
```python
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
import joblib
from datetime import datetime

class LeadScorer:
    def __init__(self):
        self.model = None
        self.feature_columns = [
            'behavioral_score',
            'visited_count',
            'total_engagement_time',
            'properties_viewed_count',
            'deep_engagement_properties_count',
            'form_completion_rate',
            'hour_of_day',
            'day_of_week',
            'is_mobile',
            'is_returning_visitor',
            'avg_time_per_property',
            'scroll_depth_avg',
            'referrer_is_social',
            'price_range_match_score'
        ]
    
    def load_training_data(self, supabase_client):
        """Load labeled leads with outcomes and behavioral data"""
        query = """
        SELECT 
            l.*,
            lo.outcome,
            lo.days_to_close,
            vs.visit_count,
            vs.total_duration_seconds,
            vs.properties_viewed,
            vs.device_info
        FROM leads l
        JOIN lead_outcomes lo ON l.id = lo.lead_id
        JOIN visitor_sessions vs ON l.session_id = vs.session_id
        WHERE lo.outcome IN ('closed_won', 'closed_lost')
        """
        
        response = supabase_client.rpc('execute_sql', {'query': query})
        df = pd.DataFrame(response.data)
        
        return self.engineer_features(df)
    
    def engineer_features(self, df):
        """Create features from raw data"""
        # Binary outcome: 1 for closed_won, 0 for closed_lost
        df['target'] = (df['outcome'] == 'closed_won').astype(int)
        
        # Engagement metrics
        df['properties_viewed_count'] = df['properties_viewed'].apply(len)
        df['deep_engagement_properties_count'] = df['deep_engagement_properties'].apply(len)
        
        # Time-based features
        df['created_datetime'] = pd.to_datetime(df['created_at'])
        df['hour_of_day'] = df['created_datetime'].dt.hour
        df['day_of_week'] = df['created_datetime'].dt.dayofweek
        
        # Device features
        df['is_mobile'] = df['device_info'].apply(lambda x: x.get('type') == 'mobile')
        
        # Visitor behavior
        df['is_returning_visitor'] = df['visited_count'] > 1
        df['avg_time_per_property'] = df['total_engagement_time'] / df['properties_viewed_count'].replace(0, 1)
        
        # Form completion
        df['form_completion_rate'] = df['metadata'].apply(
            lambda x: len([k for k, v in x.items() if v]) / max(len(x), 1) if isinstance(x, dict) else 0
        )
        
        # Referrer analysis
        df['referrer_is_social'] = df['metadata'].apply(
            lambda x: any(social in str(x.get('referrer', '')) for social in ['instagram', 'facebook', 'tiktok'])
        )
        
        # Price range matching (requires additional logic)
        df['price_range_match_score'] = 0  # Placeholder
        
        return df[self.feature_columns + ['target']]
    
    def train(self, X, y):
        """Train the lead scoring model"""
        # Try both Random Forest and XGBoost
        rf_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=20,
            random_state=42
        )
        
        xgb_model = XGBClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42
        )
        
        # Train both and keep the better one
        from sklearn.model_selection import cross_val_score
        
        rf_scores = cross_val_score(rf_model, X, y, cv=5, scoring='roc_auc')
        xgb_scores = cross_val_score(xgb_model, X, y, cv=5, scoring='roc_auc')
        
        if rf_scores.mean() > xgb_scores.mean():
            print(f"Using Random Forest (AUC: {rf_scores.mean():.3f})")
            self.model = rf_model.fit(X, y)
        else:
            print(f"Using XGBoost (AUC: {xgb_scores.mean():.3f})")
            self.model = xgb_model.fit(X, y)
        
        return self.model
    
    def predict_probability(self, features):
        """Predict probability of lead converting"""
        if self.model is None:
            raise ValueError("Model not trained or loaded")
        
        return self.model.predict_proba(features)[:, 1]
    
    def predict_score(self, features):
        """Return score 0-100"""
        probability = self.predict_probability(features)
        return (probability * 100).astype(int)
    
    def save_model(self, path='models/lead_scorer_v1.pkl'):
        """Save trained model"""
        joblib.dump({
            'model': self.model,
            'feature_columns': self.feature_columns,
            'trained_at': datetime.now().isoformat()
        }, path)
    
    def load_model(self, path='models/lead_scorer_v1.pkl'):
        """Load trained model"""
        saved_data = joblib.load(path)
        self.model = saved_data['model']
        self.feature_columns = saved_data['feature_columns']
        return self.model
```

**app/api/predict.py:**
```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import pandas as pd
from ..models.lead_scoring import LeadScorer

router = APIRouter()
lead_scorer = LeadScorer()

# Load model on startup
try:
    lead_scorer.load_model()
except:
    print("No trained model found. Train model first.")

class LeadPredictionRequest(BaseModel):
    behavioral_score: float
    visited_count: int
    total_engagement_time: int
    properties_viewed_count: int
    deep_engagement_properties_count: int
    form_completion_rate: float
    hour_of_day: int
    day_of_week: int
    is_mobile: bool
    is_returning_visitor: bool
    avg_time_per_property: float
    scroll_depth_avg: float = 0
    referrer_is_social: bool
    price_range_match_score: float = 0

class LeadPredictionResponse(BaseModel):
    conversion_probability: float
    lead_score: int
    priority: str  # 'high', 'medium', 'low'
    recommended_action: str
    confidence: float

@router.post("/predict/lead-score", response_model=LeadPredictionResponse)
async def predict_lead_score(request: LeadPredictionRequest):
    try:
        # Convert to DataFrame for prediction
        features_df = pd.DataFrame([request.dict()])
        
        # Get prediction
        probability = lead_scorer.predict_probability(features_df)[0]
        score = int(probability * 100)
        
        # Determine priority and action
        if score >= 70:
            priority = 'high'
            action = 'Call within 1 hour - high conversion probability'
        elif score >= 50:
            priority = 'medium'
            action = 'Follow up within 24 hours via email/text'
        else:
            priority = 'low'
            action = 'Add to nurture campaign'
        
        # Calculate confidence based on feature completeness
        confidence = calculate_confidence(request)
        
        return LeadPredictionResponse(
            conversion_probability=probability,
            lead_score=score,
            priority=priority,
            recommended_action=action,
            confidence=confidence
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def calculate_confidence(features: LeadPredictionRequest) -> float:
    """Calculate confidence based on data completeness"""
    score = 0.5  # baseline
    
    if features.visited_count > 1:
        score += 0.1
    if features.total_engagement_time > 60:
        score += 0.1
    if features.properties_viewed_count > 2:
        score += 0.1
    if features.deep_engagement_properties_count > 0:
        score += 0.1
    if features.form_completion_rate > 0.5:
        score += 0.1
    
    return min(score, 1.0)

@router.post("/predict/batch")
async def predict_batch(leads: List[LeadPredictionRequest]):
    """Batch prediction endpoint"""
    results = []
    for lead in leads:
        result = await predict_lead_score(lead)
        results.append(result)
    return results
```

#### Week 3-4: Model Training Pipeline

**Training Script: app/training/train_lead_scorer.py:**
```python
import os
from supabase import create_client
from ..models.lead_scoring import LeadScorer
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix

def train_lead_scoring_model():
    # Initialize Supabase client
    supabase = create_client(
        os.getenv('SUPABASE_URL'),
        os.getenv('SUPABASE_SERVICE_KEY')
    )
    
    # Initialize scorer
    scorer = LeadScorer()
    
    print("Loading training data...")
    df = scorer.load_training_data(supabase)
    
    print(f"Loaded {len(df)} labeled leads")
    print(f"Conversion rate: {df['target'].mean():.2%}")
    
    # Split features and target
    X = df[scorer.feature_columns]
    y = df['target']
    
    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print("\nTraining model...")
    scorer.train(X_train, y_train)
    
    # Evaluate
    print("\nModel Evaluation:")
    y_pred = scorer.model.predict(X_test)
    y_pred_proba = scorer.predict_probability(X_test)
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Will Not Convert', 'Will Convert']))
    
    print(f"\nROC AUC Score: {roc_auc_score(y_test, y_pred_proba):.3f}")
    
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    # Feature importance
    print("\nTop 10 Most Important Features:")
    feature_importance = pd.DataFrame({
        'feature': scorer.feature_columns,
        'importance': scorer.model.feature_importances_
    }).sort_values('importance', ascending=False)
    print(feature_importance.head(10))
    
    # Save model
    print("\nSaving model...")
    scorer.save_model('models/lead_scorer_v1.pkl')
    
    print("Training complete!")
    
    return scorer

if __name__ == "__main__":
    train_lead_scoring_model()
```

**Deployment:**
```yaml
# docker-compose.yml
version: '3.8'

services:
  ml-api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
    volumes:
      - ./models:/app/models
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### Success Metrics - Month 4:
- ✅ ML API deployed and accessible
- ✅ Initial model trained with 500+ examples
- ✅ Model AUC > 0.70 (acceptable baseline)
- ✅ API response time < 100ms for single prediction

---

### Month 5: Model Integration & Real-Time Scoring

#### Week 1-2: Supabase → ML API Integration

**New Edge Function: score-lead-intelligence**

```typescript
// supabase/functions/score-lead-intelligence/index.ts

const ML_API_URL = Deno.env.get('ML_API_URL') || 'http://ml-api:8000';

interface LeadScoringRequest {
  leadId: string;
  profileId: string;
}

Deno.serve(async (req) => {
  const { leadId, profileId } = await req.json();

  // Get lead with all behavioral data
  const { data: lead } = await supabaseAdmin
    .from('leads')
    .select(`
      *,
      visitor_sessions!inner(*)
    `)
    .eq('id', leadId)
    .single();

  if (!lead) {
    return new Response(JSON.stringify({ error: 'Lead not found' }), {
      status: 404
    });
  }

  // Prepare features for ML model
  const features = {
    behavioral_score: lead.behavioral_score || 0,
    visited_count: lead.visitor_sessions.visit_count,
    total_engagement_time: lead.visitor_sessions.total_duration_seconds,
    properties_viewed_count: lead.properties_viewed?.length || 0,
    deep_engagement_properties_count: lead.deep_engagement_properties?.length || 0,
    form_completion_rate: calculateFormCompletionRate(lead),
    hour_of_day: new Date(lead.created_at).getHours(),
    day_of_week: new Date(lead.created_at).getDay(),
    is_mobile: lead.metadata?.deviceType === 'mobile',
    is_returning_visitor: lead.visited_count > 1,
    avg_time_per_property: lead.total_engagement_time / Math.max(lead.properties_viewed?.length || 1, 1),
    scroll_depth_avg: 0, // TODO: Calculate from interactions
    referrer_is_social: ['instagram', 'facebook', 'tiktok'].some(s => 
      (lead.metadata?.referrer || '').toLowerCase().includes(s)
    ),
    price_range_match_score: 0 // TODO: Calculate based on agent's listings
  };

  // Call ML API
  const mlResponse = await fetch(`${ML_API_URL}/predict/lead-score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(features)
  });

  const prediction = await mlResponse.json();

  // Update lead with ML predictions
  await supabaseAdmin
    .from('leads')
    .update({
      ml_score: prediction.lead_score,
      ml_priority: prediction.priority,
      ml_recommended_action: prediction.recommended_action,
      ml_confidence: prediction.confidence,
      ml_scored_at: new Date().toISOString()
    })
    .eq('id', leadId);

  return new Response(JSON.stringify(prediction), {
    headers: { 'Content-Type': 'application/json' }
  });
});

function calculateFormCompletionRate(lead: any): number {
  const fields = ['name', 'email', 'phone', 'message', 'price_range', 'timeline'];
  const completed = fields.filter(f => lead[f]).length;
  return completed / fields.length;
}
```

**Trigger: Auto-score on lead creation**

```sql
-- Migration: Add ML scoring fields to leads table
ALTER TABLE leads ADD COLUMN ml_score INTEGER;
ALTER TABLE leads ADD COLUMN ml_priority VARCHAR(20);
ALTER TABLE leads ADD COLUMN ml_recommended_action TEXT;
ALTER TABLE leads ADD COLUMN ml_confidence DECIMAL(3,2);
ALTER TABLE leads ADD COLUMN ml_scored_at TIMESTAMP;

CREATE INDEX idx_leads_ml_priority ON leads(ml_priority, ml_score DESC);

-- Database trigger to auto-score leads
CREATE OR REPLACE FUNCTION trigger_score_lead()
RETURNS TRIGGER AS $$
BEGIN
  -- Call edge function asynchronously via pg_net
  PERFORM net.http_post(
    url := 'https://functions.agentbio.net/score-lead-intelligence',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_KEY"}'::jsonb,
    body := json_build_object('leadId', NEW.id, 'profileId', NEW.profile_id)::jsonb
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER score_lead_on_insert
AFTER INSERT ON leads
FOR EACH ROW
EXECUTE FUNCTION trigger_score_lead();
```

#### Week 3-4: Enhanced Lead Dashboard with ML Insights

**Component: Intelligent Lead List**

```typescript
// /src/components/leads/IntelligentLeadList.tsx

interface MLEnhancedLead extends Lead {
  ml_score: number;
  ml_priority: 'high' | 'medium' | 'low';
  ml_recommended_action: string;
  ml_confidence: number;
}

export function IntelligentLeadList() {
  const { profile } = useAuthStore();
  const [sortBy, setSortBy] = useState<'ml_score' | 'created_at'>('ml_score');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const { data: leads, isLoading } = useQuery({
    queryKey: ['intelligent-leads', profile?.id, sortBy, filterPriority],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('*, visitor_sessions(*)')
        .eq('profile_id', profile?.id)
        .order(sortBy, { ascending: sortBy === 'ml_score' ? false : true });

      if (filterPriority !== 'all') {
        query = query.eq('ml_priority', filterPriority);
      }

      const { data } = await query;
      return data as MLEnhancedLead[];
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Intelligent Lead Inbox</h2>
          <p className="text-sm text-muted-foreground">
            Sorted by conversion probability
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">🔴 High Priority</SelectItem>
              <SelectItem value="medium">🟡 Medium Priority</SelectItem>
              <SelectItem value="low">🟢 Low Priority</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ml_score">Sort by ML Score</SelectItem>
              <SelectItem value="created_at">Sort by Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <LeadsListSkeleton />
      ) : (
        <div className="space-y-3">
          {leads?.map((lead) => (
            <IntelligentLeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  );
}

function IntelligentLeadCard({ lead }: { lead: MLEnhancedLead }) {
  const priorityConfig = {
    high: { color: 'bg-red-500', icon: '🔴', label: 'High Priority' },
    medium: { color: 'bg-yellow-500', icon: '🟡', label: 'Medium Priority' },
    low: { color: 'bg-green-500', icon: '🟢', label: 'Low Priority' }
  };

  const config = priorityConfig[lead.ml_priority];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={config.color}>
                {config.icon} {config.label}
              </Badge>
              <Badge variant="outline">
                Score: {lead.ml_score}/100
              </Badge>
              {lead.ml_confidence && (
                <Badge variant="secondary">
                  {Math.round(lead.ml_confidence * 100)}% confidence
                </Badge>
              )}
            </div>

            <h3 className="font-semibold text-lg">{lead.name}</h3>
            <p className="text-sm text-muted-foreground">{lead.email}</p>

            {lead.ml_recommended_action && (
              <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Recommended Action
                    </p>
                    <p className="text-sm text-blue-700">
                      {lead.ml_recommended_action}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {lead.properties_viewed?.length || 0} properties viewed
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {Math.round(lead.visitor_sessions?.total_duration_seconds / 60)}m engaged
              </div>
              {lead.visited_count > 1 && (
                <div className="flex items-center gap-1">
                  <RepeatIcon className="h-4 w-4" />
                  {lead.visited_count} visits
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button size="sm" onClick={() => window.location.href = `tel:${lead.phone}`}>
              <Phone className="h-4 w-4 mr-1" />
              Call Now
            </Button>
            <Button size="sm" variant="outline" onClick={() => {/* Open details */}}>
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### Success Metrics - Month 5:
- ✅ 100% of new leads auto-scored within 5 seconds
- ✅ ML scores visible in lead dashboard
- ✅ Agents reporting "helpful" on 70%+ of ML recommendations
- ✅ Average response time to high-priority leads < 2 hours

---

### Month 6: Model Refinement & Feedback Loop

#### Week 1-2: Continuous Learning Pipeline

**Automated Model Retraining:**

```python
# app/training/continuous_learning.py

import schedule
import time
from datetime import datetime, timedelta
from .train_lead_scorer import train_lead_scoring_model
from supabase import create_client
import os

def should_retrain():
    """Check if we have enough new labeled data"""
    supabase = create_client(
        os.getenv('SUPABASE_URL'),
        os.getenv('SUPABASE_SERVICE_KEY')
    )
    
    # Get count of new outcomes since last training
    last_training = get_last_training_date()
    
    response = supabase.table('lead_outcomes') \
        .select('id', count='exact') \
        .gte('created_at', last_training.isoformat()) \
        .execute()
    
    new_outcomes = response.count
    
    # Retrain if we have 50+ new outcomes
    return new_outcomes >= 50

def retrain_model():
    """Retrain the model with latest data"""
    print(f"\n{'='*50}")
    print(f"Starting model retraining at {datetime.now()}")
    print(f"{'='*50}\n")
    
    try:
        # Train new model
        scorer = train_lead_scoring_model()
        
        # Save with versioned filename
        version = datetime.now().strftime('%Y%m%d_%H%M%S')
        scorer.save_model(f'models/lead_scorer_v{version}.pkl')
        
        # Update active model symlink
        os.symlink(
            f'lead_scorer_v{version}.pkl',
            'models/lead_scorer_active.pkl'
        )
        
        print("\n✅ Model retrained successfully!")
        
        # Log to database
        log_training_event(version, scorer)
        
    except Exception as e:
        print(f"\n❌ Training failed: {e}")
        # Send alert to admin

def log_training_event(version, scorer):
    """Log training metrics to database"""
    supabase = create_client(
        os.getenv('SUPABASE_URL'),
        os.getenv('SUPABASE_SERVICE_KEY')
    )
    
    # TODO: Add model_training_logs table
    # supabase.table('model_training_logs').insert({
    #     'version': version,
    #     'trained_at': datetime.now().isoformat(),
    #     'training_samples': ...,
    #     'test_auc': ...,
    #     'feature_importance': ...
    # })

def get_last_training_date():
    """Get the date of last model training"""
    # Read from model metadata or database
    try:
        import joblib
        model_data = joblib.load('models/lead_scorer_active.pkl')
        return datetime.fromisoformat(model_data['trained_at'])
    except:
        return datetime.now() - timedelta(days=30)

# Schedule retraining checks
schedule.every().day.at("02:00").do(lambda: retrain_model() if should_retrain() else None)

if __name__ == "__main__":
    print("Starting continuous learning scheduler...")
    while True:
        schedule.run_pending()
        time.sleep(3600)  # Check every hour
```

#### Week 3-4: Agent Feedback Integration

**Component: ML Feedback Widget**

```typescript
// /src/components/leads/MLFeedbackWidget.tsx

interface MLFeedback {
  leadId: string;
  wasAccurate: boolean;
  feedback?: string;
}

export function MLFeedbackWidget({ lead }: { lead: MLEnhancedLead }) {
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const submitFeedback = async (wasAccurate: boolean, feedback?: string) => {
    await supabase.from('ml_prediction_feedback').insert({
      lead_id: lead.id,
      ml_score: lead.ml_score,
      ml_priority: lead.ml_priority,
      was_accurate: wasAccurate,
      agent_feedback: feedback,
      created_at: new Date().toISOString()
    });

    setFeedbackGiven(true);
    toast.success('Thank you for your feedback!');
  };

  if (feedbackGiven) {
    return (
      <div className="text-sm text-green-600 flex items-center gap-1">
        <CheckCircle2 className="h-4 w-4" />
        Feedback recorded
      </div>
    );
  }

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-md border">
      <p className="text-sm font-medium mb-2">
        Was this prediction helpful?
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => submitFeedback(true)}
        >
          <ThumbsUp className="h-4 w-4 mr-1" />
          Yes, helpful
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => submitFeedback(false)}
        >
          <ThumbsDown className="h-4 w-4 mr-1" />
          Not helpful
        </Button>
      </div>
    </div>
  );
}
```

**New Table:**
```sql
CREATE TABLE ml_prediction_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  profile_id UUID REFERENCES profiles(id),
  ml_score INTEGER,
  ml_priority VARCHAR(20),
  was_accurate BOOLEAN,
  agent_feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Success Metrics - Month 6:
- ✅ Model retrained automatically every 2 weeks
- ✅ Model AUC improved to > 0.75
- ✅ 60%+ agents providing feedback on predictions
- ✅ 80%+ "helpful" rating on ML recommendations

---

## Phase 3: Intelligent Automation (Months 7-9)
### Goal: Build auto-matching and market intelligence features

### Month 7: Property-Lead Matching Engine

#### Week 1-2: Matching Algorithm

**New Service: Matching Engine**

```python
# app/models/property_matcher.py

from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class PropertyLeadMatcher:
    def __init__(self):
        self.weights = {
            'price': 0.30,
            'location': 0.25,
            'property_type': 0.15,
            'beds': 0.10,
            'baths': 0.10,
            'timeline': 0.10
        }
    
    def find_matches(self, new_listing, existing_leads):
        """Find leads that match a new listing"""
        matches = []
        
        for lead in existing_leads:
            score = self.calculate_match_score(new_listing, lead)
            if score >= 60:  # Threshold for notification
                matches.append({
                    'lead_id': lead['id'],
                    'lead_name': lead['name'],
                    'match_score': score,
                    'match_reasons': self.explain_match(new_listing, lead, score)
                })
        
        return sorted(matches, key=lambda x: x['match_score'], reverse=True)
    
    def calculate_match_score(self, listing, lead):
        """Calculate 0-100 match score"""
        score = 0
        
        # Price match
        if lead.get('price_range'):
            price_min, price_max = parse_price_range(lead['price_range'])
            if price_min <= listing['price'] <= price_max:
                score += self.weights['price'] * 100
            else:
                # Partial credit if close
                distance = min(
                    abs(listing['price'] - price_min),
                    abs(listing['price'] - price_max)
                )
                proximity = max(0, 1 - (distance / listing['price']))
                score += self.weights['price'] * 100 * proximity
        
        # Location match (requires geographic data)
        if lead.get('preferred_areas'):
            if listing['city'].lower() in [a.lower() for a in lead['preferred_areas']]:
                score += self.weights['location'] * 100
        
        # Property type match
        if lead.get('property_type'):
            if listing['property_type'] == lead['property_type']:
                score += self.weights['property_type'] * 100
        
        # Beds match
        if lead.get('min_beds'):
            if listing['beds'] >= lead['min_beds']:
                score += self.weights['beds'] * 100
        
        # Baths match
        if lead.get('min_baths'):
            if listing['baths'] >= lead['min_baths']:
                score += self.weights['baths'] * 100
        
        # Timeline urgency
        if lead.get('timeline'):
            timeline_score = {
                'immediate': 100,
                '1-3 months': 80,
                '3-6 months': 60,
                '6+ months': 40
            }.get(lead['timeline'], 50)
            score += self.weights['timeline'] * timeline_score
        
        return min(round(score), 100)
    
    def explain_match(self, listing, lead, score):
        """Generate human-readable match explanation"""
        reasons = []
        
        if lead.get('price_range'):
            price_min, price_max = parse_price_range(lead['price_range'])
            if price_min <= listing['price'] <= price_max:
                reasons.append(f"Price ${listing['price']:,} is within their budget")
        
        if lead.get('preferred_areas') and listing['city'].lower() in [a.lower() for a in lead['preferred_areas']]:
            reasons.append(f"Located in preferred area: {listing['city']}")
        
        if lead.get('min_beds') and listing['beds'] >= lead['min_beds']:
            reasons.append(f"{listing['beds']} bedrooms meets their requirement")
        
        if lead.get('property_type') and listing['property_type'] == lead['property_type']:
            reasons.append(f"Matches desired property type: {listing['property_type']}")
        
        return reasons

def parse_price_range(price_range_str):
    """Parse price range string like '250000-500000'"""
    parts = price_range_str.replace('$', '').replace(',', '').split('-')
    return int(parts[0]), int(parts[1])
```

#### Week 3-4: Auto-Notification System

**Edge Function: match-listing-to-leads**

```typescript
// supabase/functions/match-listing-to-leads/index.ts

const ML_API_URL = Deno.env.get('ML_API_URL');

Deno.serve(async (req) => {
  const { listingId, profileId } = await req.json();

  // Get the new listing
  const { data: listing } = await supabaseAdmin
    .from('listings')
    .select('*')
    .eq('id', listingId)
    .single();

  // Get active leads for this agent (created in last 6 months, not closed)
  const { data: leads } = await supabaseAdmin
    .from('leads')
    .select('*')
    .eq('profile_id', profileId)
    .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
    .not('status', 'in', '(closed_won,closed_lost)');

  // Call ML matching API
  const matchResponse = await fetch(`${ML_API_URL}/match/property-to-leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      listing,
      leads
    })
  });

  const matches = await matchResponse.json();

  // Create notifications for high-score matches
  for (const match of matches.filter(m => m.match_score >= 70)) {
    // Notify agent
    await supabaseAdmin.from('notifications').insert({
      profile_id: profileId,
      type: 'lead_match',
      title: `New Match: ${match.lead_name}`,
      message: `Your new listing at ${listing.address} matches ${match.lead_name} (${match.match_score}% match)`,
      data: {
        leadId: match.lead_id,
        listingId: listing.id,
        matchScore: match.match_score,
        matchReasons: match.match_reasons
      },
      read: false
    });

    // Optionally: Send email to agent
    await sendEmail({
      to: agent.email,
      subject: `New Property Match: ${match.lead_name}`,
      template: 'lead_match',
      data: {
        leadName: match.lead_name,
        listingAddress: listing.address,
        matchScore: match.match_score,
        matchReasons: match.match_reasons,
        leadUrl: `https://agentbio.net/dashboard/leads/${match.lead_id}`
      }
    });

    // Log match event
    await supabaseAdmin.from('lead_listing_matches').insert({
      lead_id: match.lead_id,
      listing_id: listing.id,
      match_score: match.match_score,
      match_reasons: match.match_reasons,
      notified_at: new Date().toISOString()
    });
  }

  return new Response(JSON.stringify({
    success: true,
    matchesFound: matches.length,
    highPriorityMatches: matches.filter(m => m.match_score >= 70).length
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

**Database Trigger:**

```sql
-- Auto-trigger matching when new listing is published
CREATE OR REPLACE FUNCTION trigger_listing_match()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    PERFORM net.http_post(
      url := 'https://functions.agentbio.net/match-listing-to-leads',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_KEY"}'::jsonb,
      body := json_build_object('listingId', NEW.id, 'profileId', NEW.profile_id)::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER match_listing_on_publish
AFTER INSERT OR UPDATE ON listings
FOR EACH ROW
EXECUTE FUNCTION trigger_listing_match();
```

#### Success Metrics - Month 7:
- ✅ Auto-matching running on 100% of new listings
- ✅ Average 2-3 high-quality matches per listing
- ✅ Agents closing deals from matched leads within 30 days
- ✅ 75%+ match accuracy (agents confirm relevance)

---

### Month 8: Market Intelligence Dashboard

#### Week 1-3: Benchmark Data Collection

**Edge Function: aggregate-market-benchmarks**

```typescript
// supabase/functions/aggregate-market-benchmarks/index.ts
// Runs daily via cron

Deno.serve(async (req) => {
  const today = new Date().toISOString().split('T')[0];

  // Aggregate property engagement metrics by market segment
  const segments = [
    { priceRange: '0-250000', propertyType: 'single_family' },
    { priceRange: '250000-500000', propertyType: 'single_family' },
    { priceRange: '500000-1000000', propertyType: 'single_family' },
    { priceRange: '1000000+', propertyType: 'single_family' },
    // ... more segments for condos, townhomes, etc.
  ];

  for (const segment of segments) {
    // Calculate average inquiry rate
    const { data: properties } = await supabaseAdmin
      .from('listings')
      .select(`
        id,
        property_engagement_metrics(inquiry_rate)
      `)
      .eq('property_type', segment.propertyType)
      .gte('price', getPriceMin(segment.priceRange))
      .lt('price', getPriceMax(segment.priceRange))
      .eq('status', 'active');

    const inquiryRates = properties
      .flatMap(p => p.property_engagement_metrics.map(m => m.inquiry_rate))
      .filter(rate => rate > 0);

    const avgInquiryRate = inquiryRates.length > 0
      ? inquiryRates.reduce((a, b) => a + b, 0) / inquiryRates.length
      : 0;

    // Save benchmark
    await supabaseAdmin.from('market_benchmarks').insert({
      metric_type: 'avg_inquiry_rate',
      property_type: segment.propertyType,
      price_range: segment.priceRange,
      market_area: 'national', // TODO: Add geographic segmentation
      metric_value: avgInquiryRate,
      sample_size: inquiryRates.length,
      calculation_date: today
    });

    // Calculate other metrics: avg_time_on_market, avg_price_per_sqft, etc.
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

#### Week 4: Market Intelligence UI

**New Page: /dashboard/market-intelligence**

```typescript
// /src/pages/dashboard/MarketIntelligence.tsx

export function MarketIntelligencePage() {
  const { profile } = useAuthStore();
  const { data: agentListings } = useQuery({
    queryKey: ['agent-listings', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('listings')
        .select(`
          *,
          property_engagement_metrics(*)
        `)
        .eq('profile_id', profile?.id)
        .eq('status', 'active');
      return data;
    }
  });

  const { data: benchmarks } = useQuery({
    queryKey: ['market-benchmarks'],
    queryFn: async () => {
      const { data } = await supabase
        .from('market_benchmarks')
        .select('*')
        .order('calculation_date', { ascending: false });
      return data;
    }
  });

  const getPerformanceComparison = (listing: Listing) => {
    const benchmark = benchmarks?.find(b =>
      b.property_type === listing.property_type &&
      isPriceInRange(listing.price, b.price_range)
    );

    if (!benchmark) return null;

    const listingInquiryRate = listing.property_engagement_metrics?.[0]?.inquiry_rate || 0;
    const percentDiff = ((listingInquiryRate - benchmark.metric_value) / benchmark.metric_value) * 100;

    return {
      yourRate: listingInquiryRate,
      marketAvg: benchmark.metric_value,
      percentDiff,
      performance: percentDiff > 0 ? 'above' : 'below'
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Market Intelligence</h1>
        <p className="text-muted-foreground">
          See how your listings perform vs. market averages
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agentListings?.map((listing) => {
              const comparison = getPerformanceComparison(listing);
              if (!comparison) return null;

              return (
                <div key={listing.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{listing.address}</h3>
                      <p className="text-sm text-muted-foreground">
                        ${listing.price.toLocaleString()} • {listing.beds}bd {listing.baths}ba
                      </p>
                    </div>
                    <Badge className={comparison.performance === 'above' ? 'bg-green-500' : 'bg-yellow-500'}>
                      {comparison.performance === 'above' ? '📈' : '📉'}
                      {Math.abs(comparison.percentDiff).toFixed(1)}% {comparison.performance} average
                    </Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Your Inquiry Rate</p>
                      <p className="text-2xl font-bold">{comparison.yourRate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Market Average</p>
                      <p className="text-2xl font-bold text-muted-foreground">
                        {comparison.marketAvg.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Difference</p>
                      <p className={`text-2xl font-bold ${comparison.performance === 'above' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {comparison.percentDiff > 0 ? '+' : ''}{comparison.percentDiff.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {comparison.performance === 'below' && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-md border border-yellow-200">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-yellow-900">Improvement Suggestions</p>
                          <ul className="mt-1 text-sm text-yellow-800 list-disc list-inside">
                            <li>Consider adjusting price - similar homes are getting more interest</li>
                            <li>Add professional photos or virtual tour</li>
                            <li>Update description to highlight unique features</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Market Trend: Inquiry Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <MarketTrendChart data={benchmarks} metricType="avg_inquiry_rate" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Market Trend: Time on Market</CardTitle>
          </CardHeader>
          <CardContent>
            <MarketTrendChart data={benchmarks} metricType="avg_time_on_market" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

#### Success Metrics - Month 8:
- ✅ Market benchmarks calculated for all major segments
- ✅ 80%+ of active agents viewing market intelligence
- ✅ Agents adjusting listings based on benchmarks
- ✅ Measurable improvement in underperforming listings

---

### Month 9: AI-Generated Insights & Recommendations

#### Week 1-3: GPT-4 Integration for Insights

**Edge Function: generate-listing-insights**

```typescript
// supabase/functions/generate-listing-insights/index.ts

import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });

Deno.serve(async (req) => {
  const { listingId, profileId } = await req.json();

  // Get listing with engagement metrics
  const { data: listing } = await supabaseAdmin
    .from('listings')
    .select(`
      *,
      property_engagement_metrics(*),
      leads!listing_id(count)
    `)
    .eq('id', listingId)
    .single();

  // Get comparable benchmarks
  const { data: benchmark } = await supabaseAdmin
    .from('market_benchmarks')
    .select('*')
    .eq('property_type', listing.property_type)
    // ... filter by price range
    .single();

  // Build context for GPT-4
  const context = `
Listing Performance Analysis:

Property: ${listing.address}
Price: $${listing.price.toLocaleString()}
Type: ${listing.property_type}
Specs: ${listing.beds}bd, ${listing.baths}ba, ${listing.sqft} sqft

Current Performance:
- Views: ${listing.property_engagement_metrics?.[0]?.total_views || 0}
- Inquiry Rate: ${listing.property_engagement_metrics?.[0]?.inquiry_rate || 0}%
- Days on Market: ${calculateDaysOnMarket(listing.created_at)}

Market Benchmark:
- Average Inquiry Rate: ${benchmark?.metric_value || 'N/A'}%
- Your Performance: ${listing.inquiry_rate > benchmark?.metric_value ? 'Above' : 'Below'} average

Description: ${listing.description}

Generate actionable insights to improve this listing's performance. Consider:
1. Pricing strategy
2. Marketing copy improvements
3. Photo/visual recommendations
4. Target audience adjustments
5. Timing considerations
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are an expert real estate marketing analyst. Provide specific, actionable recommendations to improve listing performance based on data.'
      },
      {
        role: 'user',
        content: context
      }
    ],
    temperature: 0.7,
    max_tokens: 800
  });

  const insights = completion.choices[0].message.content;

  // Store insights
  await supabaseAdmin.from('listing_insights').insert({
    listing_id: listingId,
    profile_id: profileId,
    insights: insights,
    generated_at: new Date().toISOString()
  });

  return new Response(JSON.stringify({ insights }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

#### Week 4: Weekly Digest & Proactive Recommendations

**Edge Function: send-weekly-intelligence-digest**

```typescript
// supabase/functions/send-weekly-intelligence-digest/index.ts
// Runs weekly via cron (Monday mornings)

Deno.serve(async (req) => {
  // Get all active agents
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('*, user:user_id(email)');

  for (const profile of profiles) {
    // Calculate weekly stats
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const { data: weeklyLeads } = await supabaseAdmin
      .from('leads')
      .select('*, lead_outcomes(*)')
      .eq('profile_id', profile.id)
      .gte('created_at', weekStart.toISOString());

    const { data: listings } = await supabaseAdmin
      .from('listings')
      .select('*, property_engagement_metrics(*)')
      .eq('profile_id', profile.id)
      .eq('status', 'active');

    // Generate personalized insights
    const topPerformingListing = listings.sort((a, b) =>
      (b.property_engagement_metrics?.[0]?.inquiry_rate || 0) -
      (a.property_engagement_metrics?.[0]?.inquiry_rate || 0)
    )[0];

    const highPriorityLeads = weeklyLeads.filter(l => l.ml_priority === 'high');

    // Send email digest
    await sendEmail({
      to: profile.user.email,
      subject: `Your AgentBio Intelligence Digest - Week of ${new Date().toLocaleDateString()}`,
      template: 'weekly_digest',
      data: {
        agentName: profile.full_name,
        weeklyLeads: weeklyLeads.length,
        highPriorityLeads: highPriorityLeads.length,
        closedDeals: weeklyLeads.filter(l => l.lead_outcomes?.outcome === 'closed_won').length,
        topPerformingListing: topPerformingListing ? {
          address: topPerformingListing.address,
          inquiryRate: topPerformingListing.property_engagement_metrics[0].inquiry_rate,
          views: topPerformingListing.property_engagement_metrics[0].total_views
        } : null,
        actionItems: [
          highPriorityLeads.length > 0 ? `Follow up with ${highPriorityLeads.length} high-priority leads` : null,
          // ... more AI-generated action items
        ].filter(Boolean)
      }
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

#### Success Metrics - Month 9:
- ✅ AI insights generated for 100% of active listings
- ✅ Weekly digest emails opened by 65%+ of agents
- ✅ Action items completed by 40%+ of agents
- ✅ Measurable improvement in listing performance after implementing AI recommendations

---

## Phase 4: Platform Maturity & Scale (Months 10-12)
### Goal: Refine, optimize, and prepare for scale

### Month 10: Performance Optimization & Observability

#### Week 1-2: ML Pipeline Optimization

**Optimizations:**
1. **Batch Prediction API**: Process multiple leads in parallel
2. **Caching Layer**: Cache property embeddings for faster matching
3. **Model Compression**: Reduce model size for faster inference

```python
# app/api/batch_predict.py

from fastapi import APIRouter, BackgroundTasks
from typing import List
import asyncio

router = APIRouter()

@router.post("/predict/batch-async")
async def batch_predict_async(
    lead_ids: List[str],
    background_tasks: BackgroundTasks
):
    """Asynchronously score multiple leads"""
    
    # Queue background task
    background_tasks.add_task(process_lead_batch, lead_ids)
    
    return {
        "status": "processing",
        "lead_count": len(lead_ids),
        "estimated_time_seconds": len(lead_ids) * 0.1
    }

async def process_lead_batch(lead_ids: List[str]):
    """Process batch of leads"""
    # Fetch all leads from database
    leads = await fetch_leads_from_db(lead_ids)
    
    # Batch prediction
    predictions = lead_scorer.predict_batch(leads)
    
    # Update database
    await update_leads_with_predictions(predictions)
```

#### Week 3-4: Monitoring & Alerts

**Monitoring Dashboard:**

```typescript
// /src/pages/admin/MLMonitoring.tsx

export function MLMonitoringDashboard() {
  const { data: metrics } = useQuery({
    queryKey: ['ml-metrics'],
    queryFn: async () => {
      // Fetch from ML API /metrics endpoint
      const response = await fetch(`${ML_API_URL}/metrics`);
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30s
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">ML System Monitoring</h1>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Predictions/Hour"
          value={metrics?.predictions_per_hour || 0}
          trend="up"
        />
        <MetricCard
          title="Avg Prediction Time"
          value={`${metrics?.avg_prediction_ms || 0}ms`}
          threshold={100}
          alert={metrics?.avg_prediction_ms > 100}
        />
        <MetricCard
          title="Model Accuracy"
          value={`${((metrics?.model_auc || 0) * 100).toFixed(1)}%`}
          threshold={75}
        />
        <MetricCard
          title="Cache Hit Rate"
          value={`${((metrics?.cache_hit_rate || 0) * 100).toFixed(1)}%`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prediction Volume (Last 24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart data={metrics?.prediction_volume_24h} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Model Performance Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart data={metrics?.model_performance_history} />
        </CardContent>
      </Card>
    </div>
  );
}
```

**Alert System:**

```python
# app/monitoring/alerts.py

import httpx
from datetime import datetime

SLACK_WEBHOOK_URL = os.getenv('SLACK_WEBHOOK_URL')

async def send_alert(alert_type: str, message: str, severity: str = 'warning'):
    """Send alert to Slack"""
    
    color_map = {
        'critical': '#FF0000',
        'warning': '#FFA500',
        'info': '#0000FF'
    }
    
    payload = {
        'attachments': [{
            'color': color_map.get(severity, '#FFA500'),
            'title': f'[{severity.upper()}] {alert_type}',
            'text': message,
            'ts': int(datetime.now().timestamp())
        }]
    }
    
    async with httpx.AsyncClient() as client:
        await client.post(SLACK_WEBHOOK_URL, json=payload)

# Alert conditions
async def check_system_health():
    """Check ML system health and send alerts"""
    
    metrics = get_current_metrics()
    
    # Alert if prediction time is slow
    if metrics['avg_prediction_ms'] > 200:
        await send_alert(
            'Slow Predictions',
            f'Average prediction time is {metrics["avg_prediction_ms"]}ms (threshold: 200ms)',
            'warning'
        )
    
    # Alert if model accuracy drops
    if metrics['model_auc'] < 0.70:
        await send_alert(
            'Model Performance Degradation',
            f'Model AUC dropped to {metrics["model_auc"]:.3f} (threshold: 0.70)',
            'critical'
        )
    
    # Alert if prediction volume is unusual
    if metrics['predictions_per_hour'] < 10:
        await send_alert(
            'Low Prediction Volume',
            f'Only {metrics["predictions_per_hour"]} predictions in last hour',
            'info'
        )
```

#### Success Metrics - Month 10:
- ✅ ML API response time < 50ms (p95)
- ✅ 99.9% uptime for ML services
- ✅ Real-time monitoring dashboard operational
- ✅ Automated alerts configured

---

### Month 11: Enterprise Features & White-Label

#### Week 1-2: Multi-Tenant Architecture

**Database Schema Updates:**

```sql
-- Add organization/brokerage table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  custom_domain VARCHAR(255) UNIQUE,
  white_label_enabled BOOLEAN DEFAULT FALSE,
  logo_url TEXT,
  primary_color VARCHAR(7), -- hex color
  secondary_color VARCHAR(7),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Link profiles to organizations
ALTER TABLE profiles ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE profiles ADD COLUMN role_in_org VARCHAR(50); -- 'admin', 'agent', 'viewer'

-- Organization-wide settings
CREATE TABLE organization_settings (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id),
  shared_asset_library BOOLEAN DEFAULT TRUE,
  lead_routing_enabled BOOLEAN DEFAULT FALSE,
  lead_routing_strategy VARCHAR(50), -- 'round_robin', 'geographic', 'specialty'
  analytics_sharing BOOLEAN DEFAULT TRUE,
  custom_css TEXT,
  custom_footer_html TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Shared assets
CREATE TABLE shared_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(```sql
  organization_id UUID REFERENCES organizations(id),
  asset_type VARCHAR(50), -- 'logo', 'image', 'document', 'template'
  name VARCHAR(255),
  url TEXT,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Organization-level analytics
CREATE TABLE organization_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  date DATE,
  total_leads INTEGER DEFAULT 0,
  total_profile_views INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  avg_conversion_rate DECIMAL(5,2),
  top_performing_agent_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, date)
);
```

#### Week 3-4: Brokerage Admin Dashboard

**New Page: /admin/organization**

```typescript
// /src/pages/admin/OrganizationDashboard.tsx

export function OrganizationDashboard() {
  const { profile } = useAuthStore();
  const { data: organization } = useQuery({
    queryKey: ['organization', profile?.organization_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('organizations')
        .select('*, organization_settings(*)')
        .eq('id', profile?.organization_id)
        .single();
      return data;
    }
  });

  const { data: agents } = useQuery({
    queryKey: ['organization-agents', profile?.organization_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select(`
          *,
          leads(count),
          lead_outcomes(count)
        `)
        .eq('organization_id', profile?.organization_id)
        .order('created_at', { ascending: false });
      return data;
    }
  });

  const { data: orgAnalytics } = useQuery({
    queryKey: ['organization-analytics', profile?.organization_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('organization_analytics')
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .order('date', { ascending: false })
        .limit(30);
      return data;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{organization?.name}</h1>
          <p className="text-muted-foreground">Brokerage Management Dashboard</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/organization/settings')}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button onClick={() => navigate('/admin/organization/agents/invite')}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Agent
          </Button>
        </div>
      </div>

      {/* Organization-wide metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Total Agents"
          value={agents?.length || 0}
          icon={Users}
        />
        <MetricCard
          title="Total Leads (30d)"
          value={orgAnalytics?.reduce((sum, day) => sum + day.total_leads, 0) || 0}
          icon={TrendingUp}
        />
        <MetricCard
          title="Avg Conversion Rate"
          value={`${calculateAvgConversionRate(orgAnalytics)}%`}
          icon={Target}
        />
        <MetricCard
          title="Profile Views (30d)"
          value={orgAnalytics?.reduce((sum, day) => sum + day.total_profile_views, 0) || 0}
          icon={Eye}
        />
      </div>

      {/* Performance trend */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Performance (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart
            data={orgAnalytics}
            lines={[
              { dataKey: 'total_leads', name: 'Leads', color: '#3b82f6' },
              { dataKey: 'total_conversions', name: 'Conversions', color: '#10b981' }
            ]}
          />
        </CardContent>
      </Card>

      {/* Agent leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Leaderboard</CardTitle>
          <CardDescription>Top performers this month</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Conversions</TableHead>
                <TableHead>Conversion Rate</TableHead>
                <TableHead>Profile Views</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents?.map((agent) => {
                const conversionRate = agent.leads.length > 0
                  ? ((agent.lead_outcomes.filter(o => o.outcome === 'closed_won').length / agent.leads.length) * 100).toFixed(1)
                  : 0;
                
                return (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar>
                          <AvatarImage src={agent.avatar_url} />
                          <AvatarFallback>{agent.full_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{agent.full_name}</p>
                          <p className="text-sm text-muted-foreground">@{agent.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{agent.leads.length}</TableCell>
                    <TableCell>
                      {agent.lead_outcomes.filter(o => o.outcome === 'closed_won').length}
                    </TableCell>
                    <TableCell>
                      <Badge variant={conversionRate > 10 ? 'default' : 'secondary'}>
                        {conversionRate}%
                      </Badge>
                    </TableCell>
                    <TableCell>{agent.view_count}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {agent.role_in_org}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Shared assets library */}
      <Card>
        <CardHeader>
          <CardTitle>Shared Asset Library</CardTitle>
          <CardDescription>Brand assets available to all agents</CardDescription>
        </CardHeader>
        <CardContent>
          <SharedAssetLibrary organizationId={organization?.id} />
        </CardContent>
      </Card>
    </div>
  );
}
```

**Lead Routing System:**

```typescript
// /src/lib/leadRouting.ts

interface LeadRoutingStrategy {
  type: 'round_robin' | 'geographic' | 'specialty' | 'ml_optimized';
  config: Record<string, any>;
}

export async function routeLead(
  lead: Lead,
  organizationId: string,
  strategy: LeadRoutingStrategy
): Promise<string> {
  // Get eligible agents
  const { data: agents } = await supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('role_in_org', 'agent');

  let selectedAgent: string;

  switch (strategy.type) {
    case 'round_robin':
      selectedAgent = await roundRobinRouting(agents, organizationId);
      break;
    
    case 'geographic':
      selectedAgent = await geographicRouting(lead, agents);
      break;
    
    case 'specialty':
      selectedAgent = await specialtyRouting(lead, agents);
      break;
    
    case 'ml_optimized':
      selectedAgent = await mlOptimizedRouting(lead, agents);
      break;
    
    default:
      selectedAgent = agents[0].id;
  }

  // Assign lead to selected agent
  await supabase
    .from('leads')
    .update({ 
      profile_id: selectedAgent,
      routed_at: new Date().toISOString(),
      routing_strategy: strategy.type
    })
    .eq('id', lead.id);

  return selectedAgent;
}

async function roundRobinRouting(agents: Profile[], orgId: string): Promise<string> {
  // Get last assigned agent
  const { data: lastLead } = await supabase
    .from('leads')
    .select('profile_id')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!lastLead) return agents[0].id;

  const lastIndex = agents.findIndex(a => a.id === lastLead.profile_id);
  const nextIndex = (lastIndex + 1) % agents.length;
  return agents[nextIndex].id;
}

async function geographicRouting(lead: Lead, agents: Profile[]): Promise<string> {
  // Match lead location to agent service areas
  const leadCity = lead.metadata?.city || '';
  
  const matchedAgent = agents.find(agent => 
    agent.service_areas?.includes(leadCity)
  );
  
  return matchedAgent?.id || agents[0].id;
}

async function specialtyRouting(lead: Lead, agents: Profile[]): Promise<string> {
  // Match lead type to agent specialty
  const leadType = lead.type; // 'buyer', 'seller', 'investor'
  
  const matchedAgent = agents.find(agent =>
    agent.specialties?.includes(leadType)
  );
  
  return matchedAgent?.id || agents[0].id;
}

async function mlOptimizedRouting(lead: Lead, agents: Profile[]): Promise<string> {
  // Use ML to predict which agent has highest close probability
  const predictions = await Promise.all(
    agents.map(async (agent) => {
      const response = await fetch(`${ML_API_URL}/predict/agent-lead-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead: lead,
          agent: agent
        })
      });
      const result = await response.json();
      return {
        agentId: agent.id,
        probability: result.close_probability
      };
    })
  );
  
  const bestMatch = predictions.sort((a, b) => b.probability - a.probability)[0];
  return bestMatch.agentId;
}
```

#### Success Metrics - Month 11:
- ✅ Multi-tenant architecture supporting 10+ brokerages
- ✅ White-label deployments for 2+ enterprise clients
- ✅ Lead routing reducing response time by 40%
- ✅ Brokerage admins actively using organization dashboard

---

### Month 12: Advanced AI Features & Public Launch

#### Week 1-2: Conversational Lead Qualification

**AI Chatbot for Lead Pre-Qualification:**

```typescript
// /src/components/profile/AILeadQualificationChat.tsx

export function AILeadQualificationChat({ profileId }: { profileId: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm here to help you find the perfect property. What are you looking for?"
    }
  ]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Call OpenAI to continue conversation
    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId,
        messages: [...messages, userMessage]
      })
    });

    const data = await response.json();
    setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);

    // Check if enough info gathered to create lead
    if (data.shouldCreateLead) {
      const leadData = data.extractedInfo;
      await createLeadFromChat(leadData);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Chat with AI Assistant</CardTitle>
        <CardDescription>Get instant property recommendations</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'rounded-lg px-4 py-2 max-w-[80%]',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <div className="flex w-full gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
          />
          <Button onClick={sendMessage}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
```

**Backend: AI Chat Handler**

```typescript
// supabase/functions/ai-chat/index.ts

import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });

const SYSTEM_PROMPT = `You are a helpful real estate assistant helping potential buyers and sellers. Your goal is to:
1. Understand their needs (buying/selling, property type, budget, timeline)
2. Ask clarifying questions naturally
3. Provide helpful information
4. Extract structured information for lead creation

When you have enough information (name, email, phone, property interest), respond with a special marker:
[LEAD_READY] followed by JSON with extracted info.

Be conversational, friendly, and helpful. Don't be too salesy.`;

Deno.serve(async (req) => {
  const { profileId, messages } = await req.json();

  // Get agent profile for context
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('full_name, bio, service_areas')
    .eq('id', profileId)
    .single();

  const contextMessage = `You're assisting for ${profile.full_name}, who serves: ${profile.service_areas?.join(', ')}. ${profile.bio}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: contextMessage },
      ...messages
    ],
    temperature: 0.7,
    max_tokens: 300
  });

  const reply = completion.choices[0].message.content;

  // Check if lead info is ready
  let shouldCreateLead = false;
  let extractedInfo = null;

  if (reply.includes('[LEAD_READY]')) {
    shouldCreateLead = true;
    const jsonMatch = reply.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      extractedInfo = JSON.parse(jsonMatch[0]);
    }
  }

  return new Response(JSON.stringify({
    reply: reply.replace('[LEAD_READY]', '').replace(/\{[\s\S]*\}/, '').trim(),
    shouldCreateLead,
    extractedInfo
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

#### Week 3-4: Final Polish & Launch Preparation

**Features to Polish:**

1. **Onboarding Flow with AI Setup**
```typescript
// /src/components/onboarding/AIOnboarding.tsx

export function AIOnboardingWizard() {
  const steps = [
    {
      title: "Welcome to AgentBio Intelligence",
      description: "Let's set up your AI-powered platform",
      content: <WelcomeStep />
    },
    {
      title: "Train Your AI",
      description: "Label a few past leads to improve predictions",
      content: <TrainingDataStep />
    },
    {
      title: "Set Preferences",
      description: "How should we prioritize your leads?",
      content: <PreferencesStep />
    },
    {
      title: "You're All Set!",
      description: "Your AI is learning and ready to help",
      content: <CompletionStep />
    }
  ];

  return <MultiStepWizard steps={steps} />;
}
```

2. **AI Success Stories Widget**
```typescript
// Show real-time success stories across platform

export function AISuccessStories() {
  const { data: stories } = useQuery({
    queryKey: ['ai-success-stories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('lead_outcomes')
        .select(`
          *,
          leads!inner(ml_score, profile_id),
          profiles!inner(full_name, avatar_url)
        `)
        .eq('outcome', 'closed_won')
        .gte('leads.ml_score', 70)
        .order('created_at', { ascending: false })
        .limit(5);
      return data;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>🎉 Recent AI-Powered Wins</CardTitle>
        <CardDescription>Deals closed with high ML scores</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stories?.map((story) => (
            <div key={story.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Avatar>
                <AvatarImage src={story.profiles.avatar_url} />
                <AvatarFallback>{story.profiles.full_name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{story.profiles.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  Closed a deal from a {story.leads.ml_score}/100 scored lead
                </p>
              </div>
              <Badge className="bg-green-600">
                ${(story.deal_value || 0).toLocaleString()}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

3. **Pricing Page Update**

```typescript
// /src/pages/Pricing.tsx - Add Intelligence tier

const PRICING_TIERS = [
  // ... existing tiers
  {
    name: 'Intelligence',
    price: 99,
    description: 'AI-powered lead intelligence and conversion optimization',
    features: [
      'Everything in Professional',
      '🤖 Predictive lead scoring with ML',
      '🎯 Auto-matching: listings to leads',
      '📊 Market intelligence dashboard',
      '💡 AI-generated listing insights',
      '🔔 Priority lead notifications',
      '📈 Advanced conversion analytics',
      '⚡ API access for integrations',
      '👨‍💼 Dedicated success manager'
    ],
    cta: 'Start Free Trial',
    popular: true
  }
];
```

#### Week 4: Beta Launch & Marketing

**Launch Checklist:**

```markdown
## Technical
- [ ] All ML models deployed and monitored
- [ ] Database migrations completed
- [ ] Edge functions tested and scaled
- [ ] Monitoring dashboards operational
- [ ] Security audit completed
- [ ] Load testing passed (1000+ concurrent users)
- [ ] Backup and disaster recovery tested

## Product
- [ ] Onboarding flow polished
- [ ] Documentation updated
- [ ] Video tutorials created
- [ ] Help center articles written
- [ ] In-app tooltips and guides
- [ ] Email templates designed

## Marketing
- [ ] Landing page updated with AI features
- [ ] Case studies prepared (3+ success stories)
- [ ] Press release drafted
- [ ] Beta waitlist collected (500+ agents)
- [ ] Social media campaign scheduled
- [ ] Influencer partnerships confirmed
- [ ] Launch event planned

## Support
- [ ] Support team trained on AI features
- [ ] FAQ document created
- [ ] Known issues documented
- [ ] Escalation process defined
- [ ] Feedback collection system ready
```

**Launch Sequence:**

1. **Week 1: Closed Beta** (50 hand-picked agents)
   - Intensive feedback collection
   - Daily check-ins
   - Rapid bug fixes

2. **Week 2: Open Beta** (Waitlist invitations)
   - Gradual rollout to manage load
   - Community Slack channel
   - Weekly AMA sessions

3. **Week 3: Public Launch**
   - Press release distribution
   - Product Hunt launch
   - Webinar series begins
   - Paid advertising starts

4. **Week 4: Optimization**
   - Analyze onboarding funnel
   - Optimize based on user behavior
   - Iterate on feedback
   - Plan Month 13+ roadmap

#### Success Metrics - Month 12:
- ✅ 1,000+ agents signed up for Intelligence tier
- ✅ 50+ closed deals attributed to AI features
- ✅ 4.5+ star rating on reviews
- ✅ <2% churn rate in first month
- ✅ Featured in 3+ major real estate publications

---

## Phase 5: Post-Launch Optimization (Months 13-18)
### Goal: Iterate based on data, expand AI capabilities

### Month 13-15: Data-Driven Iteration

**Key Activities:**

1. **A/B Testing Framework**
```typescript
// Test different ML score thresholds, notification strategies, etc.
const experiments = [
  {
    name: 'lead_priority_threshold',
    variants: [
      { name: 'conservative', threshold: 80 },
      { name: 'balanced', threshold: 70 },
      { name: 'aggressive', threshold: 60 }
    ]
  },
  {
    name: 'notification_timing',
    variants: [
      { name: 'immediate', delay: 0 },
      { name: 'batched', delay: 3600 }
    ]
  }
];
```

2. **Advanced Features Based on Feedback**
   - Voice-to-text property descriptions
   - Automated follow-up email generation
   - Sentiment analysis on lead messages
   - Predictive property valuation

3. **Integration Marketplace**
   - Zapier integration
   - Native CRM connectors (Salesforce, HubSpot)
   - MLS data feeds
   - Transaction management tools

### Month 16-18: Scale & Network Effects

**Focus Areas:**

1. **Agent Network Effects**
   - Referral network (agents refer leads to each other)
   - Best practices sharing
   - Template marketplace
   - Success story library

2. **Data Moat Expansion**
   - More labeled outcomes = better models
   - Market benchmarks become more accurate
   - Predictions improve with scale
   - Competitive advantage compounds

3. **Enterprise Expansion**
   - Target top 50 brokerages
   - Custom integrations
   - White-label partnerships
   - API licensing

---

## Success Metrics Summary

### Technical Metrics
- **Model Performance:** AUC > 0.75, improving 5% quarterly
- **System Reliability:** 99.9% uptime
- **Response Time:** <50ms API calls (p95)
- **Data Quality:** 60%+ leads with outcomes labeled

### Business Metrics
- **User Adoption:** 5,000 active agents by Month 12
- **Revenue:** $500K ARR from Intelligence tier by Month 12
- **Retention:** <5% monthly churn
- **NPS:** 50+ score

### Product Metrics
- **Lead Quality:** ML-scored leads convert 2x better than unscored
- **Time Savings:** Agents save 5+ hours/week on lead qualification
- **Deal Velocity:** 30% faster time-to-close on high-scored leads
- **Agent Satisfaction:** 80%+ report AI features as "very helpful"

---

## Risk Mitigation

### Technical Risks
- **Risk:** ML model bias or poor predictions
- **Mitigation:** Continuous monitoring, human-in-the-loop feedback, model retraining

### Market Risks
- **Risk:** Low agent adoption of AI features
- **Mitigation:** Simple onboarding, clear ROI demonstration, success stories

### Competitive Risks
- **Risk:** Competitors copy AI features
- **Mitigation:** Data moat (proprietary training data), speed of iteration, network effects

---

## Conclusion

This 18-month roadmap transforms AgentBio from a portfolio showcase into an **AI-powered sales intelligence platform** that:

1. **Predicts** which leads will convert
2. **Matches** properties to qualified buyers automatically
3. **Optimizes** listing performance with market intelligence
4. **Accelerates** deals with data-driven insights

The competitive moat is **data accumulation**—each labeled lead outcome makes predictions better, creating a flywheel that competitors can't replicate without years of data.

**The Tagline:**
> "AgentBio Intelligence: Stop guessing. Start closing."

By Month 18, AgentBio won't just be a tool agents use—it will be the platform they can't do business without.
