import { config as dotEnvConfig } from 'dotenv';
import * as fs from 'fs';

dotEnvConfig();
export const envConfig = {
    PORT: process.env.PORT,
}

export const certObj = {
    key: fs.readFileSync('../server.key'),
    cert: fs.readFileSync('../server.cert')
};