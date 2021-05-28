export interface IBotConfig {
    pair: string,
    initAmount: number;
    percentForEachTrade: number;
    leverage: number;

    sl?: number;
    tslAct?: number;
    tslCBRate?: number;
    alerts: { [key: string]: boolean }
};

var id = 0;
const getId = () => {
  id += 1;
  return id;
};

export class Bot implements IBotConfig {
  id: number;
  pair: string;
  initAmount: number;
  percentForEachTrade: number;
  leverage: number;

  sl: number;
  tslAct: number;
  tslCBRate: number;

  pnl: number = 0;
  txs: number = 0;
  alerts: { [key: string]: boolean };

  equity: number;
  constructor(botConfig: IBotConfig) {
    const {
        pair,
        initAmount,
        percentForEachTrade,
        leverage,
        sl,
        tslAct,
        tslCBRate,
        alerts,
    } = botConfig;
    this.id = getId();

    this.pair = pair;
    this.initAmount = initAmount;
    this.equity = initAmount;

    this.percentForEachTrade = percentForEachTrade;
    this.leverage = leverage;
    this.alerts = alerts,
    sl ? this.sl = sl : null;
  
    if (tslAct && tslCBRate) {
      this.tslAct = tslAct;
      this.tslCBRate = tslCBRate;
    }
  }

  handleAlert(alert: string) {
    console.log(`Handle alert: ${alert}`);
  }
}

class botsManager {
    private _allBots: Bot[] = [];

    get allBots() {
        return this._allBots
    }

    addBot(config: IBotConfig, cb: () => void) {
        const newBot = new Bot(config)
        this._allBots.push(newBot)
        console.log(newBot)
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

export const handleAlerts = (alertNumber: number) => {
  const alert = `a${alertNumber}`
  const botsWithCurrentAlert = myBotManager.allBots.filter(bot => bot.alerts[alert] === true);
  botsWithCurrentAlert.forEach(bot => bot.handleAlert(alert));
}