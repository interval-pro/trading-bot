export interface IBot {
    id: number,
    pair: string,
    pnl: number,
    txs: number,
};

class botsManager {
    private _allBots: IBot[] = [];

    get allBots() {
        return this._allBots
    }

    addBot(bot: IBot, cb: () => void) {
        this._allBots.push(bot)
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