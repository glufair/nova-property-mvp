import { NextRequest, NextResponse } from "next/server";

type Result = {
  purchasePrice: number;
  rent: number;
  grossYield: number;
  netMonthlyCashflow: number;
  summary: string;
  depositPercent: number;
  interestRate: number;
  refurb: number;
  sdlt: number;
  expensePercent: number;
  totalCashIn: number;
  monthlyInterest: number;
  otherMonthlyCosts: number;
};

export async function POST(
  req: NextRequest
): Promise<NextResponse<Result | { error: string }>> {
  try {
    const body = (await req.json()) as {
      purchasePrice: number;
      rent: number;
      depositPercent?: number;
      interestRate?: number;
      refurb?: number;
      sdlt?: number | null;
      expensePercent?: number;
    };

    const { purchasePrice, rent } = body;

    if (!purchasePrice || !rent) {
      return NextResponse.json(
        { error: "Please provide purchasePrice and rent" },
        { status: 400 }
      );
    }

    const depositPercent =
      typeof body.depositPercent === "number" && body.depositPercent > 0
        ? body.depositPercent
        : 25;

    const interestRate =
      typeof body.interestRate === "number" && body.interestRate > 0
        ? body.interestRate
        : 5.5;

    const refurb =
      typeof body.refurb === "number" && body.refurb > 0 ? body.refurb : 0;

    const sdlt =
      typeof body.sdlt === "number" && body.sdlt > 0 ? body.sdlt : 0;

    const expensePercent =
      typeof body.expensePercent === "number" && body.expensePercent > 0
        ? body.expensePercent
        : 15;

    const price = Number(purchasePrice);
    const monthlyRent = Number(rent);

    const annualRent = monthlyRent * 12;
    const grossYield = (annualRent / price) * 100;

    const depositAmount = (price * depositPercent) / 100;
    const mortgageAmount = price - depositAmount;

    const monthlyInterest =
      (mortgageAmount * (interestRate / 100)) / 12;

    const otherMonthlyCosts = (monthlyRent * expensePercent) / 100;

    const totalMonthlyCosts = monthlyInterest + otherMonthlyCosts;
    const netMonthlyCashflow = monthlyRent - totalMonthlyCosts;

    const totalCashIn = depositAmount + refurb + sdlt;

    let summary: string;

    if (grossYield >= 7 && netMonthlyCashflow > 250) {
      summary =
        "Strong yield and healthy monthly cashflow on these assumptions. Worth serious consideration if the property and area stack up.";
    } else if (grossYield >= 5.5 && netMonthlyCashflow > 100) {
      summary =
        "Acceptable yield with modest cashflow. Could work as a long term hold, but keep an eye on interest rate rises and maintenance.";
    } else if (netMonthlyCashflow > 0) {
      summary =
        "Cashflow is positive but slim. This might rely more on long term capital growth than monthly income. You may want to negotiate harder or increase the deposit.";
    } else {
      summary =
        "On these numbers the deal is likely to be cashflow negative. You would need a lower purchase price, higher rent, more deposit, or a cheaper mortgage product.";
    }

    return NextResponse.json({
      purchasePrice: price,
      rent: monthlyRent,
      grossYield,
      netMonthlyCashflow,
      summary,
      depositPercent,
      interestRate,
      refurb,
      sdlt,
      expensePercent,
      totalCashIn,
      monthlyInterest,
      otherMonthlyCosts
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error while analysing deal" },
      { status: 500 }
    );
  }
}