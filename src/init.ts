import prompts, { PromptObject } from 'prompts';
import figlet from 'figlet';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { fileURLToPath } from 'url';

import dotenv from "dotenv";
dotenv.config();

// Binance Gold Color
const yellow = chalk.hex('#F0B90B');

// ESModule __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cancel handler
const onCancel = () => {
    console.log(chalk.red('\n❌ Configuration cancelled by user (Ctrl+C or ESC). Exiting...'));
    process.exit(0);
};

// Show Banner
const showBanner = () => {
    const banner = figlet.textSync('Binance MCP ', { font: 'Big' });
    console.log(yellow(banner));
    console.log(yellow('🚀 Welcome to the Binance MCP Configurator\n'));
};

interface Credentials {
    BINANCE_API_KEY: string;
    BINANCE_API_SECRET: string;
}

const askCredentials = async (label: string): Promise<Credentials> => {
    console.log(chalk.cyan(`\n🔐 ${label} credentials:`));
    const questions: PromptObject[] = [
        {
            type: 'password',
            name: 'BINANCE_API_KEY',
            message: '🔑 API KEY:',
            validate: (val: string) => val.trim() === '' ? 'API KEY is required!' : true,
        },
        {
            type: 'password',
            name: 'BINANCE_API_SECRET',
            message: '🔐 API SECRET:',
            validate: (val: string) => val.trim() === '' ? 'API SECRET is required!' : true,
        },
    ];
    return await prompts(questions, { onCancel }) as Credentials;
};

const writeEnvFile = async (filePath: string, creds: Credentials): Promise<void> => {
    const content = `BINANCE_API_KEY=${creds.BINANCE_API_KEY}\nBINANCE_API_SECRET=${creds.BINANCE_API_SECRET}\n`;
    await fs.writeFile(filePath, content);
};

const generateConfig = async (creds: Credentials): Promise<any> => {
    const indexPath = path.resolve(__dirname, '..', 'build', 'index.js');
    return {
        'binance-mcp': {
            command: 'node',
            args: [indexPath],
            env: {
                BINANCE_API_KEY: creds.BINANCE_API_KEY,
                BINANCE_API_SECRET: creds.BINANCE_API_SECRET,
            },
            disabled: false,
            autoApprove: []
        }
    };
};

const configureClaude = async (config: object): Promise<boolean> => {
    const userHome = os.homedir();
    let claudePath;
    const platform = os.platform();
    if (platform == "darwin") {
        claudePath = path.join(userHome, 'Library/Application Support/Claude/claude_desktop_config.json');
    } else if (platform == "win32") {
        claudePath = path.join(userHome, 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json');
    } else {
        console.log(chalk.red('❌ Unsupported platform.'));
        return false;
    }

    if (!fs.existsSync(claudePath)) {
        console.log(chalk.yellow('⚠️ Claude config file not found. Creating a new one with default configuration.'));
        await fs.writeJSON(claudePath, { mcpServers: {} }, { spaces: 2 });
    }

    const data = JSON.parse(fs.readFileSync(claudePath, 'utf8'));
    data.mcpServers = { ...data.mcpServers, ...config };
    await fs.writeJSON(claudePath, data, { spaces: 2 });
    console.log(yellow('✅ Binance MCP configured for Claude Desktop. Please RESTART your Claude to enjoy it 🎉'));
    return true;
};

const saveFallbackConfig = async (config: object): Promise<void> => {
    await fs.writeJSON('config.json', config, { spaces: 2 });
    console.log(yellow('📁 Saved config.json in root project folder.'));
};

const init = async () => {
    showBanner();

    const buildDir = path.resolve(__dirname, '..', 'build');
    await fs.ensureDir(buildDir);

    // Production credentials
    const prodCreds = await askCredentials('Production');
    await writeEnvFile(path.join(buildDir, '.env'), prodCreds);
    console.log(yellow('✅ build/.env generated.'));

    // Testnet credentials (optional)
    const { setupTestnet } = await prompts({
        type: 'confirm',
        name: 'setupTestnet',
        message: '🧪 Do you also have Binance Testnet credentials? (testnet.binancefuture.com)',
        initial: true,
    }, { onCancel });

    if (setupTestnet) {
        const testCreds = await askCredentials('Testnet');
        await writeEnvFile(path.join(buildDir, '.env.testnet'), testCreds);
        console.log(yellow('✅ build/.env.testnet generated.'));
    }

    // Claude Desktop config (uses production keys)
    const config = await generateConfig(prodCreds);
    const { setupClaude } = await prompts({
        type: 'confirm',
        name: 'setupClaude',
        message: '🧠 Do you want to configure in Claude Desktop?',
        initial: true,
    }, { onCancel });

    if (setupClaude) {
        const success = await configureClaude(config);
        if (!success) await saveFallbackConfig(config);
    } else {
        await saveFallbackConfig(config);
    }
};

init();
