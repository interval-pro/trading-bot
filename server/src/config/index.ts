import { config as dotEnvConfig } from 'dotenv';
import * as fs from 'fs';

dotEnvConfig();
export const envConfig = {
    PORT: process.env.PORT,
    BINANCE_API_KEY: process.env.BINANCE_API_KEY,
    BINANCE_API_SECRET: process.env.BINANCE_API_SECRET,
}

// export const certObj = {
//     key: fs.readFileSync('./server.key'),
//     cert: fs.readFileSync('./server.cert')
// };