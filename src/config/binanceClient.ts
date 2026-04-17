// src/config/binanceClient.ts
import { Spot } from "@binance/spot";
import { SimpleEarn } from "@binance/simple-earn";
import { Algo } from "@binance/algo";
import { C2C } from "@binance/c2c";
import { Convert } from "@binance/convert";
import { Wallet } from "@binance/wallet";
import { CopyTrading } from "@binance/copy-trading";
import { Fiat } from "@binance/fiat";
import { NFT } from "@binance/nft";
import { Pay } from "@binance/pay";
import { Rebate } from "@binance/rebate";
import { DualInvestment } from "@binance/dual-investment";
import { Mining } from "@binance/mining";
import { VipLoan } from "@binance/vip-loan";
import { Staking } from "@binance/staking";
import { DerivativesTradingUsdsFutures } from "@binance/derivatives-trading-usds-futures";

import { ensureConfig } from "./validator.js";

const API_KEY = process.env.BINANCE_API_KEY;
const API_SECRET = process.env.BINANCE_API_SECRET;
const BASE_URL = "https://api.binance.com";

const configurationRestAPI = {
    apiKey: API_KEY ?? "",
    apiSecret: API_SECRET ?? "",
    basePath: BASE_URL ?? ""
};

// Función para crear un cliente protegido por validación
function createProtectedClient<T extends object>(clientInstance: T): T {
    return new Proxy(clientInstance, {
        get(target, prop, receiver) {
            // Validamos la configuración antes de permitir cualquier acceso a métodos del cliente
            ensureConfig();
            return Reflect.get(target, prop, receiver);
        }
    });
}

export const spotClient = createProtectedClient(new Spot({ configurationRestAPI }));
export const algoClient = createProtectedClient(new Algo({ configurationRestAPI }));
export const simpleEarnClient = createProtectedClient(new SimpleEarn({ configurationRestAPI }));
export const c2cClient = createProtectedClient(new C2C({ configurationRestAPI }));
export const convertClient = createProtectedClient(new Convert({ configurationRestAPI }));
export const walletClient = createProtectedClient(new Wallet({ configurationRestAPI }));
export const copyTradingClient = createProtectedClient(new CopyTrading({ configurationRestAPI }));
export const fiatClient = createProtectedClient(new Fiat({ configurationRestAPI }));
export const nftClient = createProtectedClient(new NFT({ configurationRestAPI }));
export const payClient = createProtectedClient(new Pay({ configurationRestAPI }));
export const rebateClient = createProtectedClient(new Rebate({ configurationRestAPI }));
export const dualInvestmentClient = createProtectedClient(new DualInvestment({ configurationRestAPI }));
export const miningClient = createProtectedClient(new Mining({ configurationRestAPI }));
export const vipLoanClient = createProtectedClient(new VipLoan({ configurationRestAPI }));
export const stakingClient = createProtectedClient(new Staking({ configurationRestAPI }));

// Futures: testnet uses a different base URL
const futuresBasePath = process.env.BINANCE_ENV === "testnet"
    ? "https://testnet.binancefuture.com"
    : "https://fapi.binance.com";
const futuresRestAPI = { apiKey: API_KEY ?? "", apiSecret: API_SECRET ?? "", basePath: futuresBasePath };
export const usdsFuturesClient = createProtectedClient(new DerivativesTradingUsdsFutures({ configurationRestAPI: futuresRestAPI }));
