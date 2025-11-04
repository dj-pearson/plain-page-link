// ============================================
// Mortgage Calculator Service
// ============================================
// Pure calculations - no API calls needed

export interface MortgageInputs {
  homePrice: number;
  downPayment: number;
  downPaymentPercent: number;
  interestRate: number;
  loanTermYears: number;
  propertyTaxAnnual?: number;
  homeInsuranceAnnual?: number;
  hoaMonthly?: number;
  pmiMonthly?: number;
}

export interface MortgageResults {
  loanAmount: number;
  monthlyPayment: number;
  breakdown: {
    principal: number;
    interest: number;
    propertyTax: number;
    insurance: number;
    hoa: number;
    pmi: number;
  };
  totalInterest: number;
  totalCost: number;
  amortizationSchedule: Array<{
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }>;
}

export interface AffordabilityInputs {
  annualIncome: number;
  monthlyDebts: number;
  downPayment: number;
  interestRate: number;
  loanTermYears: number;
  propertyTaxRate?: number; // Annual rate as percentage
  insuranceRate?: number; // Annual rate as percentage
}

export interface AffordabilityResults {
  maxHomePrice: number;
  maxLoanAmount: number;
  monthlyPayment: number;
  debtToIncomeRatio: number;
  recommendedDownPayment: number;
  qualificationStatus: 'excellent' | 'good' | 'marginal' | 'unlikely';
}

/**
 * Calculate monthly mortgage payment
 */
export function calculateMortgage(inputs: MortgageInputs): MortgageResults {
  const {
    homePrice,
    downPayment,
    interestRate,
    loanTermYears,
    propertyTaxAnnual = 0,
    homeInsuranceAnnual = 0,
    hoaMonthly = 0,
    pmiMonthly = 0,
  } = inputs;

  // Loan amount
  const loanAmount = homePrice - downPayment;

  // Monthly interest rate
  const monthlyRate = interestRate / 100 / 12;

  // Number of payments
  const numberOfPayments = loanTermYears * 12;

  // Calculate principal & interest payment
  let principalAndInterest = 0;

  if (monthlyRate > 0) {
    principalAndInterest =
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  } else {
    // If interest rate is 0
    principalAndInterest = loanAmount / numberOfPayments;
  }

  // Monthly additional costs
  const propertyTaxMonthly = propertyTaxAnnual / 12;
  const insuranceMonthly = homeInsuranceAnnual / 12;

  // Total monthly payment
  const totalMonthly =
    principalAndInterest +
    propertyTaxMonthly +
    insuranceMonthly +
    hoaMonthly +
    pmiMonthly;

  // Generate amortization schedule
  const amortizationSchedule = generateAmortizationSchedule(
    loanAmount,
    monthlyRate,
    numberOfPayments,
    principalAndInterest
  );

  // Calculate total interest
  const totalInterest = amortizationSchedule.reduce((sum, month) => sum + month.interest, 0);

  // Total cost = down payment + all payments
  const totalCost = downPayment + totalMonthly * numberOfPayments;

  // Average monthly breakdown (first month's split)
  const firstMonth = amortizationSchedule[0] || { principal: 0, interest: 0 };

  return {
    loanAmount,
    monthlyPayment: totalMonthly,
    breakdown: {
      principal: firstMonth.principal,
      interest: firstMonth.interest,
      propertyTax: propertyTaxMonthly,
      insurance: insuranceMonthly,
      hoa: hoaMonthly,
      pmi: pmiMonthly,
    },
    totalInterest,
    totalCost,
    amortizationSchedule,
  };
}

/**
 * Generate amortization schedule
 */
function generateAmortizationSchedule(
  loanAmount: number,
  monthlyRate: number,
  numberOfPayments: number,
  monthlyPayment: number
): Array<{ month: number; payment: number; principal: number; interest: number; balance: number }> {
  const schedule = [];
  let balance = loanAmount;

  for (let month = 1; month <= numberOfPayments; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;

    balance -= principalPayment;

    // Don't go negative on final payment
    if (balance < 0) balance = 0;

    schedule.push({
      month,
      payment: monthlyPayment,
      principal: principalPayment,
      interest: interestPayment,
      balance,
    });
  }

  return schedule;
}

/**
 * Calculate home affordability
 */
export function calculateAffordability(inputs: AffordabilityInputs): AffordabilityResults {
  const {
    annualIncome,
    monthlyDebts,
    downPayment,
    interestRate,
    loanTermYears,
    propertyTaxRate = 1.2, // Default 1.2% annual
    insuranceRate = 0.5, // Default 0.5% annual
  } = inputs;

  const monthlyIncome = annualIncome / 12;

  // DTI ratios - conventional loan limits
  const frontEndRatio = 0.28; // Housing costs should be ≤28% of gross income
  const backEndRatio = 0.36; // Total debt should be ≤36% of gross income

  // Maximum housing payment (28% rule)
  const maxHousingPayment = monthlyIncome * frontEndRatio;

  // Maximum total debt payment (36% rule)
  const maxTotalDebt = monthlyIncome * backEndRatio;

  // Available for housing after existing debts
  const availableForHousing = maxTotalDebt - monthlyDebts;

  // Use the lower of the two
  const maxMonthlyPayment = Math.min(maxHousingPayment, availableForHousing);

  // Estimate taxes and insurance as percentage of home price
  // Monthly property tax = (home price * tax rate) / 12
  // Monthly insurance = (home price * insurance rate) / 12

  const monthlyRate = interestRate / 100 / 12;
  const numberOfPayments = loanTermYears * 12;

  // Work backwards from max monthly payment to find max home price
  // This requires iteration because taxes/insurance depend on home price

  let maxHomePrice = 0;
  let maxLoanAmount = 0;

  // Binary search for max home price
  let low = 0;
  let high = 10000000; // $10M max
  let iterations = 0;
  const maxIterations = 50;

  while (low <= high && iterations < maxIterations) {
    iterations++;
    const testPrice = (low + high) / 2;
    const testLoan = testPrice - downPayment;

    // Calculate PI payment
    let piPayment = 0;
    if (monthlyRate > 0) {
      piPayment =
        (testLoan * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    } else {
      piPayment = testLoan / numberOfPayments;
    }

    // Add taxes and insurance
    const monthlyTax = (testPrice * (propertyTaxRate / 100)) / 12;
    const monthlyInsurance = (testPrice * (insuranceRate / 100)) / 12;

    // PMI if down payment < 20%
    const ltvRatio = testLoan / testPrice;
    const monthlyPmi = ltvRatio > 0.8 ? testLoan * 0.005 / 12 : 0; // 0.5% annual PMI

    const totalPayment = piPayment + monthlyTax + monthlyInsurance + monthlyPmi;

    if (Math.abs(totalPayment - maxMonthlyPayment) < 1) {
      // Close enough
      maxHomePrice = testPrice;
      maxLoanAmount = testLoan;
      break;
    } else if (totalPayment < maxMonthlyPayment) {
      // Can afford more
      low = testPrice;
      maxHomePrice = testPrice;
      maxLoanAmount = testLoan;
    } else {
      // Too expensive
      high = testPrice;
    }
  }

  // Calculate actual DTI ratio
  const housingPayment = maxMonthlyPayment;
  const totalDebtPayment = housingPayment + monthlyDebts;
  const dtiRatio = (totalDebtPayment / monthlyIncome) * 100;

  // Qualification status
  let qualificationStatus: 'excellent' | 'good' | 'marginal' | 'unlikely';

  if (dtiRatio <= 28) {
    qualificationStatus = 'excellent';
  } else if (dtiRatio <= 36) {
    qualificationStatus = 'good';
  } else if (dtiRatio <= 43) {
    qualificationStatus = 'marginal';
  } else {
    qualificationStatus = 'unlikely';
  }

  // Recommended down payment (20% to avoid PMI)
  const recommendedDownPayment = maxHomePrice * 0.2;

  return {
    maxHomePrice: Math.round(maxHomePrice),
    maxLoanAmount: Math.round(maxLoanAmount),
    monthlyPayment: Math.round(maxMonthlyPayment),
    debtToIncomeRatio: Math.round(dtiRatio * 10) / 10,
    recommendedDownPayment: Math.round(recommendedDownPayment),
    qualificationStatus,
  };
}

/**
 * Get current average interest rates
 * In production, fetch from an API (Freddie Mac, Bankrate, etc.)
 */
export async function getCurrentRates(): Promise<{
  thirtyYear: number;
  fifteenYear: number;
  fiveYearArm: number;
  lastUpdated: string;
}> {
  // Mock rates - in production, fetch from API
  return {
    thirtyYear: 7.25,
    fifteenYear: 6.75,
    fiveYearArm: 6.5,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Calculate break-even point for refinancing
 */
export function calculateRefinanceBreakEven(
  currentLoanBalance: number,
  currentRate: number,
  newRate: number,
  refinanceCosts: number,
  loanTermYears: number
): {
  monthsToBreakEven: number;
  monthlySavings: number;
  totalSavings: number;
  worthRefinancing: boolean;
} {
  const monthlyRate1 = currentRate / 100 / 12;
  const monthlyRate2 = newRate / 100 / 12;
  const payments = loanTermYears * 12;

  // Current payment
  const currentPayment =
    (currentLoanBalance * monthlyRate1 * Math.pow(1 + monthlyRate1, payments)) /
    (Math.pow(1 + monthlyRate1, payments) - 1);

  // New payment
  const newPayment =
    (currentLoanBalance * monthlyRate2 * Math.pow(1 + monthlyRate2, payments)) /
    (Math.pow(1 + monthlyRate2, payments) - 1);

  const monthlySavings = currentPayment - newPayment;

  const monthsToBreakEven = refinanceCosts / monthlySavings;

  const totalSavings = monthlySavings * payments - refinanceCosts;

  const worthRefinancing = monthsToBreakEven <= 36; // Break-even within 3 years

  return {
    monthsToBreakEven: Math.round(monthsToBreakEven),
    monthlySavings: Math.round(monthlySavings),
    totalSavings: Math.round(totalSavings),
    worthRefinancing,
  };
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}
