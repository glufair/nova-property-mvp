import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
  aiSummary?: string;
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

    let aiSummary: string | undefined;

    if (process.env.OPENAI_API_KEY) {
      try {
        const prompt = `
You are an experienced UK residential property investment analyst.

Use British English spelling.

You are given deal inputs. Provide:
- Two short paragraphs explaining the deal in plain language.
- A short bullet list of 3 pros and 3 cons.

Deal inputs:
- Purchase price: £${price.toFixed(0)}
- Monthly rent: £${monthlyRent.toFixed(0)}
- Deposit: ${depositPercent.toFixed(1)} percent
- Interest rate: ${interestRate.toFixed(2)} percent (interest-only)
- Refurb: £${refurb.toFixed(0)}
- SDLT: £${sdlt.toFixed(0)}
- Operating costs: ${expensePercent.toFixed(1)} percent of rent
- Total cash in: £${totalCashIn.toFixed(0)}
- Gross yield: ${grossYield.toFixed(2)} percent
- Net monthly cashflow (estimate): £${netMonthlyCashflow.toFixed(0)}

Focus on:
- Whether this is likely to be a sensible buy to let on these assumptions.
- Sensitivity to interest rate changes and voids.
- Any obvious red flags or things the investor should double-check (area demand, condition, lease details, etc).
        `.trim();

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a concise, numerate UK property investment analyst. Use British English and keep the tone clear, calm and professional."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 350
        });

        aiSummary =
          completion.choices[0]?.message?.content?.trim() || undefined;
      } catch (e) {
        console.error("AI summary error:", e);
        aiSummary = undefined;
      }
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
      otherMonthlyCosts,
      aiSummary
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error while analysing deal" },
      { status: 500 }
    );
  }
}