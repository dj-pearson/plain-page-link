// ============================================
// Mortgage Calculator Widget Component
// ============================================

import { useState, useEffect } from 'react';
import { Calculator, DollarSign, Home, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  calculateMortgage,
  calculateAffordability,
  formatCurrency,
  formatPercent,
  type MortgageInputs,
  type AffordabilityInputs,
} from '@/lib/mortgageCalculator';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';

interface Props {
  listingId?: string;
  defaultHomePrice?: number;
  showLeadCapture?: boolean;
  agentId?: string;
}

export function MortgageCalculator({
  listingId,
  defaultHomePrice = 400000,
  showLeadCapture = false,
  agentId,
}: Props) {
  const { user } = useAuthStore();

  // Mortgage Calculator State
  const [homePrice, setHomePrice] = useState(defaultHomePrice);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(7.0);
  const [loanTermYears, setLoanTermYears] = useState(30);
  const [propertyTaxAnnual, setPropertyTaxAnnual] = useState(
    Math.round(defaultHomePrice * 0.012)
  );
  const [homeInsuranceAnnual, setHomeInsuranceAnnual] = useState(1200);
  const [hoaMonthly, setHoaMonthly] = useState(0);

  // Affordability Calculator State
  const [annualIncome, setAnnualIncome] = useState(100000);
  const [monthlyDebts, setMonthlyDebts] = useState(500);
  const [downPaymentAmount, setDownPaymentAmount] = useState(80000);

  // Lead Capture State
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [leadCaptured, setLeadCaptured] = useState(false);

  // Calculate derived values
  const downPayment = Math.round((homePrice * downPaymentPercent) / 100);
  const pmiMonthly = downPaymentPercent < 20 ? Math.round((homePrice - downPayment) * 0.005 / 12) : 0;

  const mortgageInputs: MortgageInputs = {
    homePrice,
    downPayment,
    downPaymentPercent,
    interestRate,
    loanTermYears,
    propertyTaxAnnual,
    homeInsuranceAnnual,
    hoaMonthly,
    pmiMonthly,
  };

  const affordabilityInputs: AffordabilityInputs = {
    annualIncome,
    monthlyDebts,
    downPayment: downPaymentAmount,
    interestRate,
    loanTermYears,
  };

  const mortgageResults = calculateMortgage(mortgageInputs);
  const affordabilityResults = calculateAffordability(affordabilityInputs);

  // Auto-update property tax when home price changes
  useEffect(() => {
    setPropertyTaxAnnual(Math.round(homePrice * 0.012)); // 1.2% default
  }, [homePrice]);

  // Track usage when calculator is used
  const trackCalculatorUsage = async () => {
    if (!agentId) return;

    try {
      await supabase.from('mortgage_calculations').insert({
        user_id: agentId,
        listing_id: listingId,
        home_price: homePrice,
        down_payment: downPayment,
        down_payment_percent: downPaymentPercent,
        interest_rate: interestRate,
        loan_term_years: loanTermYears,
        property_tax_annual: propertyTaxAnnual,
        home_insurance_annual: homeInsuranceAnnual,
        hoa_monthly: hoaMonthly,
        pmi_monthly: pmiMonthly,
        loan_amount: mortgageResults.loanAmount,
        monthly_payment: mortgageResults.monthlyPayment,
        monthly_payment_breakdown: mortgageResults.breakdown,
        total_interest: mortgageResults.totalInterest,
        total_cost: mortgageResults.totalCost,
      });
    } catch (error) {
      console.error('Failed to track calculator usage:', error);
    }
  };

  // Capture lead
  const handleLeadCapture = async () => {
    if (!visitorName || !visitorEmail || !agentId) return;

    try {
      const { data: lead, error } = await supabase
        .from('leads')
        .insert({
          user_id: agentId,
          name: visitorName,
          email: visitorEmail,
          phone: visitorPhone || undefined,
          source: 'mortgage_calculator',
          notes: `Used mortgage calculator. Home price: ${formatCurrency(homePrice)}, Monthly payment: ${formatCurrency(mortgageResults.monthlyPayment)}`,
        })
        .select()
        .single();

      if (error) throw error;

      // Update calculation with lead info
      await supabase
        .from('mortgage_calculations')
        .update({
          visitor_name: visitorName,
          visitor_email: visitorEmail,
          visitor_phone: visitorPhone || undefined,
          lead_id: lead.id,
        })
        .order('created_at', { ascending: false })
        .limit(1);

      setLeadCaptured(true);
      trackCalculatorUsage();
    } catch (error) {
      console.error('Failed to capture lead:', error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-6 w-6" />
          Mortgage Calculator
        </CardTitle>
        <CardDescription>
          Calculate your monthly payment and see what you can afford
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="mortgage" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mortgage">Monthly Payment</TabsTrigger>
            <TabsTrigger value="affordability">What Can I Afford?</TabsTrigger>
          </TabsList>

          {/* MORTGAGE CALCULATOR TAB */}
          <TabsContent value="mortgage" className="space-y-6">
            {/* Inputs */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Home Price</Label>
                  <span className="font-semibold">{formatCurrency(homePrice)}</span>
                </div>
                <Slider
                  value={[homePrice]}
                  onValueChange={([value]) => setHomePrice(value)}
                  min={50000}
                  max={2000000}
                  step={10000}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Down Payment</Label>
                  <span className="font-semibold">
                    {downPaymentPercent}% ({formatCurrency(downPayment)})
                  </span>
                </div>
                <Slider
                  value={[downPaymentPercent]}
                  onValueChange={([value]) => setDownPaymentPercent(value)}
                  min={0}
                  max={50}
                  step={1}
                />
                {downPaymentPercent < 20 && (
                  <p className="text-sm text-orange-600">
                    PMI required: {formatCurrency(pmiMonthly)}/month
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Interest Rate</Label>
                  <span className="font-semibold">{formatPercent(interestRate, 2)}</span>
                </div>
                <Slider
                  value={[interestRate * 10]}
                  onValueChange={([value]) => setInterestRate(value / 10)}
                  min={30}
                  max={120}
                  step={1}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Loan Term</Label>
                  <select
                    value={loanTermYears}
                    onChange={(e) => setLoanTermYears(Number(e.target.value))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value={15}>15 years</option>
                    <option value={20}>20 years</option>
                    <option value={30}>30 years</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>HOA/Month</Label>
                  <Input
                    type="number"
                    value={hoaMonthly}
                    onChange={(e) => setHoaMonthly(Number(e.target.value))}
                    min={0}
                  />
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="rounded-lg border bg-accent/50 p-6 space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Monthly Payment</p>
                <p className="text-4xl font-bold text-primary">
                  {formatCurrency(mortgageResults.monthlyPayment)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Principal & Interest</p>
                  <p className="font-semibold">
                    {formatCurrency(
                      mortgageResults.breakdown.principal + mortgageResults.breakdown.interest
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Property Tax</p>
                  <p className="font-semibold">
                    {formatCurrency(mortgageResults.breakdown.propertyTax)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Home Insurance</p>
                  <p className="font-semibold">
                    {formatCurrency(mortgageResults.breakdown.insurance)}
                  </p>
                </div>
                {pmiMonthly > 0 && (
                  <div>
                    <p className="text-muted-foreground">PMI</p>
                    <p className="font-semibold">{formatCurrency(pmiMonthly)}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Loan Amount</span>
                  <span className="font-semibold">
                    {formatCurrency(mortgageResults.loanAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Interest</span>
                  <span className="font-semibold">
                    {formatCurrency(mortgageResults.totalInterest)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Cost</span>
                  <span className="font-semibold">
                    {formatCurrency(mortgageResults.totalCost)}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* AFFORDABILITY CALCULATOR TAB */}
          <TabsContent value="affordability" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Annual Income</Label>
                <Input
                  type="number"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(Number(e.target.value))}
                  min={0}
                  step={1000}
                />
              </div>

              <div className="space-y-2">
                <Label>Monthly Debts (car, student loans, etc.)</Label>
                <Input
                  type="number"
                  value={monthlyDebts}
                  onChange={(e) => setMonthlyDebts(Number(e.target.value))}
                  min={0}
                  step={50}
                />
              </div>

              <div className="space-y-2">
                <Label>Down Payment Available</Label>
                <Input
                  type="number"
                  value={downPaymentAmount}
                  onChange={(e) => setDownPaymentAmount(Number(e.target.value))}
                  min={0}
                  step={1000}
                />
              </div>
            </div>

            {/* Affordability Results */}
            <div className="rounded-lg border bg-accent/50 p-6 space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">You Can Afford</p>
                <p className="text-4xl font-bold text-primary">
                  {formatCurrency(affordabilityResults.maxHomePrice)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Max Loan Amount</p>
                  <p className="font-semibold">
                    {formatCurrency(affordabilityResults.maxLoanAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Monthly Payment</p>
                  <p className="font-semibold">
                    {formatCurrency(affordabilityResults.monthlyPayment)}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Debt-to-Income Ratio</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {formatPercent(affordabilityResults.debtToIncomeRatio, 1)}
                    </span>
                    <QualificationBadge status={affordabilityResults.qualificationStatus} />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  {affordabilityResults.qualificationStatus === 'excellent' &&
                    'Excellent! You have a strong debt-to-income ratio.'}
                  {affordabilityResults.qualificationStatus === 'good' &&
                    'Good! You should qualify for most conventional loans.'}
                  {affordabilityResults.qualificationStatus === 'marginal' &&
                    'Marginal. Consider reducing debt or increasing income.'}
                  {affordabilityResults.qualificationStatus === 'unlikely' &&
                    'Unlikely to qualify. Reduce debt or increase down payment.'}
                </p>

                {downPaymentAmount < affordabilityResults.recommendedDownPayment && (
                  <p className="text-xs text-orange-600">
                    💡 Tip: Save {formatCurrency(affordabilityResults.recommendedDownPayment)} (20%)
                    to avoid PMI and get better rates.
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Lead Capture Form */}
        {showLeadCapture && !leadCaptured && (
          <div className="mt-6 pt-6 border-t space-y-4">
            <div className="text-center">
              <h3 className="font-semibold text-lg">Get a Personalized Quote</h3>
              <p className="text-sm text-muted-foreground">
                Connect with me to discuss your home buying options
              </p>
            </div>

            <div className="grid gap-3">
              <Input
                placeholder="Your Name"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
              />
              <Input
                type="email"
                placeholder="Email Address"
                value={visitorEmail}
                onChange={(e) => setVisitorEmail(e.target.value)}
              />
              <Input
                type="tel"
                placeholder="Phone Number (optional)"
                value={visitorPhone}
                onChange={(e) => setVisitorPhone(e.target.value)}
              />
              <Button onClick={handleLeadCapture} disabled={!visitorName || !visitorEmail}>
                Request Consultation
              </Button>
            </div>
          </div>
        )}

        {leadCaptured && (
          <div className="mt-6 pt-6 border-t text-center">
            <div className="inline-flex items-center justify-center rounded-full bg-green-100 p-3 mb-3">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-semibold">Thank You!</h3>
            <p className="text-sm text-muted-foreground mt-1">
              I'll reach out to you shortly to discuss your home buying journey.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QualificationBadge({ status }: { status: string }) {
  const colors = {
    excellent: 'bg-green-100 text-green-800',
    good: 'bg-blue-100 text-blue-800',
    marginal: 'bg-orange-100 text-orange-800',
    unlikely: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status as keyof typeof colors]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default MortgageCalculator;
