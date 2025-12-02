"use client";

import { useState } from "react";

interface AnalysisResult {
  purchasePrice: number;
  rent: number;
  grossYield: number;
  netMonthlyCashflow: number;
  summary: string;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [price, setPrice] = useState("");
  const [rent, setRent] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          purchasePrice: Number(price),
          rent: Number(rent)
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Error analysing deal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-centre bg-slate-100">
      <div className="w-full max-w-xl bg-white shadow-lg rounded-xl p-6 space-y-4">
        <h1 className="text-xl font-semibold">
          UK Property Deal Quick Analyser
        </h1>
        <p className="text-sm text-slate-600">
          Paste a listing link and enter the price and expected rent to see a
          quick snapshot of yield and cashflow.
        </p>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1">
              Listing URL (Rightmove / Zoopla / OnTheMarket)
            </label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://www.rightmove.co.uk/properties/..."
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div className="flex space-x-2">
            <div className="w-1/2">
              <label className="block text-sm font-medium mb-1">
                Purchase price (£)
              </label>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium mb-1">
                Monthly rent (£)
              </label>
              <input
                type="number"
                value={rent}
                onChange={e => setRent(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded py-2 text-sm font-medium"
          >
            {loading ? "Analysing..." : "Analyse deal"}
          </button>
        </form>

        {error && (
          <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded p-2">
            {error}
          </div>
        )}

        {result && (
          <div className="border border-slate-200 rounded p-3 space-y-2">
            <div className="text-sm">
              <strong>Purchase price:</strong> £
              {result.purchasePrice.toLocaleString()}
            </div>
            <div className="text-sm">
              <strong>Rent:</strong> £{result.rent.toLocaleString()} per month
            </div>
            <div className="text-sm">
              <strong>Gross yield:</strong>{" "}
              {result.grossYield.toFixed(2)} percent
            </div>
            <div className="text-sm">
              <strong>Net monthly cashflow (estimate):</strong> £
              {result.netMonthlyCashflow.toFixed(0)}
            </div>
            <div className="text-sm text-slate-700 mt-1">
              <strong>Summary:</strong> {result.summary}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}