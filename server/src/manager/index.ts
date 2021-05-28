import { binanceApi } from "../apis/binance-api.service";

export interface IBotConfig {
    pair: string,
    initAmount: number;
    percentForEachTrade: number;
    leverage: number;

    sl?: number;
    tslAct?: number;
    tslCBRate?: number;
    alerts: { [key: string]: string }
};

var id = 0;
const getId = () => {
  id += 1;
  return id;
};

export type PositionType = "SHORT" | "LONG";
export type AlertType = "OP" | "CP" | "COP";

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
  alerts: { [key: string]: string };

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
    const isLong = alert.startsWith('long');
    const alertType: AlertType = this.alerts[alert] as AlertType;
    const positionType: PositionType = isLong ? "LONG" : "SHORT";
  
    if (alertType === 'OP') {
      //open position;
    }

    if (alertType === 'CP') {
      //close position;
    }

    if (alertType === 'COP') {
      //close and open;
    }
  }

  private async openPosition(type: PositionType) {
    const price = await this.getCurrentPrice();
    if (!price) return;
    // const amount = this.equity >= this.initAmount
    //     ? this.percentForEachTrade * this.equity
    //     : this.percentForEachTrade * this.initAmount;
    // this.openedPosition = new Position(type, amount, price, this.available, this.leverage, this.percentSL);
    // this.openedPosition = new Position(type, price, this);

    // this.equity -= amount;
  }

  private async closePosition(type: PositionType,) {
    const price = await this.getCurrentPrice();
    if (!price) return;
    // this.openedPosition.close(price);
    // this.equity += this.openedPosition.closeAmount;
  }

  private async getCurrentPrice(): Promise<number> {
    const result = await binanceApi.getPrice(this.pair);
    const { error, data } = result;
    if (!error && data?.price) return parseFloat(data.price);
    return 0;
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
  const botsWithCurrentAlert = myBotManager.allBots.filter(bot => bot.alerts[alert]);
  botsWithCurrentAlert.forEach(bot => bot.handleAlert(alert));
}