import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = process.env.BINANCE_ENV === "testnet" ? ".env.testnet" : ".env";
dotenv.config({ path: join(__dirname, envFile) });
