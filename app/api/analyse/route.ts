import { NextRequest, NextResponse } from "next/server";

type Result = {
  purchasePrice: number;
  rent: number;
  grossYield: number;
  netMonthlyCashflow: number;
  summary: string;
};

export async function POST(
  req: NextRequest
): Promise<NextResponse<Result | { error: string }>> {
  try {
    const { purchasePrice, rent } = (await req.json()) as {
      purchasePrice: number;
      rent: number;
    };

    if (!purchasePrice || !rent) {
      return NextResponse.json(
        { error: "Please provide purchasePrice and rent" },
        { status: 400 }
      );
    }

    const price = Number(purchasePrice);
    const monthlyRent = Number(rent);

    const annualRent = monthlyRent * 12;
    const grossYield = (annualRent / price) * 100;

    // Very rough running costs
    const assumedMonthlyCosts =
      monthlyRent * 0.15 + // management, repairs etc
      (price * 0.75 * 0.055) / 12; // 75 percent LTV, 5.5 percent interest only

    const netMonthlyCashflow = monthlyRent - assumedMonthlyCosts;

    let summary: string;

    if (grossYield >= 7 && netMonthlyCashflow > 250) {
      summary =
        "Strong yield and healthy monthly cashflow. Worth serious consideration if the property and area stack up.";
    } else if (grossYield >= 5.5 && netMonthlyCashflow > 100) {
      summary =
        "Acceptable yield with modest cashflow. Could work as a long term hold, but factor in interest rate rises.";
    } else if (netMonthlyCashflow > 0) {
      summary =
        "Cashflow is positive but slim. This might rely more on long term capital growth than monthly income.";
    } else {
      summary =
        "On these numbers the deal is likely to be cashflow negative. You would need a lower purchase price, higher rent, or more deposit.";
    }

    return NextResponse.json({
      purchasePrice: price,
      rent: monthlyRent,
      grossYield,
      netMonthlyCashflow,
      summary
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error while analysing deal" },
      { status: 500 }
    );
  }
}