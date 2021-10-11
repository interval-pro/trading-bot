import { Router } from "express";
import { myBotManager } from "../manager/manager";
import { socket as mainSocket } from '../index';
import { IBotConfig } from "../manager/bot";

export const bot = Router();

bot.post(`/new-hist-bot`, (req, res) => {
    try {
        const botConfig = req.body as IBotConfig;
        myBotManager.addBot(botConfig, () => {
            mainSocket.emit('botsList', myBotManager.allBots);
            res.send({ data: true });
        });
    } catch (error) {
        res.send({ error: error.message });
    }
})