import { Bot, IBotConfig } from './bot';
import { addLogRoute } from '../routes/log.route';

class botsManager {
    private _allBots: Bot[] = [];
    private botCount: number = 0;
    get allBots() {
        return this._allBots
    }

    addBot(config: IBotConfig, cb: () => void) {
        this.botCount++;
        const newBot = new Bot(config, this.botCount);
        this._allBots.push(newBot);
        addLogRoute(newBot.id);
        cb();
    }

    removeBot(id: number, cb: () => void) {
        const bot = this.allBots.find(bot => bot.id === id);
        if (!bot) return;
        this._allBots = this.allBots.filter(_bot => _bot !== bot);
        cb();
    }
}


export const myBotManager = new botsManager();

export const handleAlerts = (alert: string) => {
    myBotManager.allBots.filter(bot => !bot.histRawData)
      .forEach(bot => bot.handleAlert(alert));
}

export const getBotLogById = (id: number) => {
    const currentBot = myBotManager.allBots.find(bot => bot.id === id);
    return currentBot.log;
}