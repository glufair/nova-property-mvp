export function calculateLimitedCompanySdlt(purchasePrice: number): number {
  if (!purchasePrice || purchasePrice <= 0) {
    return 0;
  }

  const bands = [
    { upper: 125_000, rate: 0.05 },
    { upper: 250_000, rate: 0.07 },
    { upper: 925_000, rate: 0.1 },
    { upper: 1_500_000, rate: 0.15 }
  ];

  let sdlt = 0;
  let previousUpper = 0;

  for (const { upper, rate } of bands) {
    if (purchasePrice <= previousUpper) {
      break;
    }

    const taxableAmount = Math.min(purchasePrice, upper) - previousUpper;
    sdlt += taxableAmount * rate;
    previousUpper = upper;
  }

  if (purchasePrice > previousUpper) {
    sdlt += (purchasePrice - previousUpper) * 0.17;
  }

  if (purchasePrice > 500_000) {
    const flatRuleTax = purchasePrice * 0.17;
    sdlt = Math.max(sdlt, flatRuleTax);
  }

  return sdlt;
}
