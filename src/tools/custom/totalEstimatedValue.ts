// src/tools/custom/totalEstimatedValue.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { walletClient, spotClient } from "../../config/binanceClient.js";

export function registerBinanceTotalEstimatedValue(server: McpServer) {
    server.tool(
        "BinanceCustomTotalEstimatedValue",
        "Get total estimated portfolio value in USDT across all Binance wallets (Spot, Funding, Margin, Futures, Earn, Options, Bots, Copy Trading), matching the 'Importe total estimado' shown on Binance web. Combines wallet balances (BTC-denominated) with live BTC/USDT price.",
        {
            quoteAsset: z.enum(["USDT", "BTC"]).optional().default("USDT").describe("Currency to express total in (USDT or BTC). Default: USDT"),
            includeEmpty: z.boolean().optional().default(false).describe("Include wallets with zero balance in the breakdown")
        },
        async ({ quoteAsset, includeEmpty }) => {
            try {
                const [walletsRes, priceRes] = await Promise.all([
                    walletClient.restAPI.queryUserWalletBalance({}).then(r => r.data()),
                    (spotClient.restAPI as any).tickerPrice({ symbol: "BTCUSDT" }).then((r: any) => r.data())
                ]);

                const wallets: any[] = Array.isArray(walletsRes) ? walletsRes : [];
                const priceData: any = priceRes;
                const btcPrice = parseFloat(priceData?.price ?? "0");

                if (!btcPrice || isNaN(btcPrice)) {
                    throw new Error("Could not fetch BTC/USDT price");
                }

                const rate = quoteAsset === "BTC" ? 1 : btcPrice;

                const breakdown = wallets
                    .map(w => {
                        const btc = parseFloat(w.balance ?? "0");
                        return {
                            wallet: w.walletName,
                            activate: w.activate,
                            btcValue: btc,
                            quoteValue: btc * rate
                        };
                    })
                    .filter(w => includeEmpty || w.btcValue > 0)
                    .sort((a, b) => b.quoteValue - a.quoteValue);

                const totalBtc = breakdown.reduce((acc, w) => acc + w.btcValue, 0);
                const totalQuote = totalBtc * rate;

                const withShare = breakdown.map(w => ({
                    ...w,
                    share: totalQuote > 0 ? (w.quoteValue / totalQuote) * 100 : 0
                }));

                const lines = withShare.map(w =>
                    `  - ${w.wallet.padEnd(22)} ${w.btcValue.toFixed(8)} BTC  ≈  ${w.quoteValue.toFixed(2)} ${quoteAsset}  (${w.share.toFixed(2)}%)`
                ).join("\n");

                const summary = [
                    `Total Estimated Portfolio Value`,
                    `  Total: ${totalQuote.toFixed(2)} ${quoteAsset}  (${totalBtc.toFixed(8)} BTC)`,
                    `  BTC/USDT reference price: ${btcPrice.toFixed(2)}`,
                    ``,
                    `Breakdown by wallet:`,
                    lines
                ].join("\n");

                return {
                    content: [
                        {
                            type: "text",
                            text: `${summary}\n\nData:\n${JSON.stringify({
                                totalQuote,
                                totalBtc,
                                quoteAsset,
                                btcPrice,
                                wallets: withShare
                            }, null, 2)}`
                        }
                    ]
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return {
                    content: [
                        { type: "text", text: `Failed to compute total estimated value: ${errorMessage}` }
                    ],
                    isError: true
                };
            }
        }
    );
}
