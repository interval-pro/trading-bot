import { binanceApi } from "../apis/binance-api.service";
import { getDate, LogData, LogType } from '../utils';
import { socket as mainSocket } from '../index';
import { addLogRoute } from '../routes/log.route';
import { Interface } from "readline";

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



export class Position {
  positionType: PositionType = null;
  leverage: number = null;
  positionAmount: number = null;
  tokens: number = null;
  borrowAmount: number = null;

  openAt: string = null;
  openPrice: number = null;
  openAmount: number = null;
  openEquity: number = null;

  closedAt: string = null;
  closePrice: number = null;
  closeAmount: number = null;
  closeEquity: number = null;

  pnlRatio: number = null;
  pnlAmount: number = null;

  win: boolean = null;

  constructor(
    positionType: PositionType,
    amount: number,
    price: number,
    equity: number,
    leverage: number,
  ) {
    this.positionType = positionType;

    this.openAt = getDate();
    this.openPrice = price;
    this.openAmount = amount;
    this.openEquity = equity;

    this.leverage = leverage;
    this.positionAmount = amount * leverage;
    this.tokens = this.positionAmount / price;
    this.borrowAmount = this.positionAmount - amount;
  }

  close(price: number) {
    const isLong = this.positionType === 'LONG';
    this.closedAt = getDate();
    this.closePrice = price;
    this.closeAmount = isLong
        ? ((this.tokens * price) - this.positionAmount) + this.openAmount
        : (this.positionAmount - (this.tokens * price)) + this.openAmount;

    this.pnlRatio = this.closeAmount / this.openAmount;
    this.pnlAmount = this.closeAmount - this.openAmount;

    this.win = this.pnlAmount > 0;
    this.closeEquity = this.openEquity + this.pnlAmount;
  }
}

export type TTrend = 'up' | 'down';
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

  openedPosition: Position = null;

  log: any[] = [];

  trend: TTrend;
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

  async handleAlert(alert: string) {
    // const isLong = alert.startsWith('long');
    // const alertType: AlertType = this.alerts[alert] as AlertType;
    // const positionType: PositionType = isLong ? "LONG" : "SHORT";
    // this.logData(LogType.WARNING, `New Alert: ${alert}`);

    // if (alertType === 'OP') {
    //   await this.openPosition(positionType);
    // }

    // if (alertType === 'CP') {
    //   await this.closePosition();
    // }

    // if (alertType === 'COP') {
    //   await this.closePosition();
    //   await this.openPosition(positionType);
    // }
    console.log(alert)
    if (alert.includes('5')) {
      this.changeTrend(alert);
      return;
    }

    if (alert.includes('1')) {
      this.handleBuySell(alert)
      return;
    }
  }

  private handleBuySell(alert: string) {
    if (this.trend === 'up') {
      alert === 'green1'
        ? this.openPosition('LONG')
        : this.closePosition();
    }

    if (this.trend === 'down') {
      alert === 'red1'
        ? this.openPosition('SHORT')
        : this.closePosition();
    }
  }

  private async changeTrend(alert: string) {
    if (alert === 'green5') {
      await this.closePosition();
      this.trend = 'up';
      this.openPosition('LONG')
    }
    if (alert === 'red5') {
      await this.closePosition();
      this.trend = 'down'
      this.openPosition('SHORT')
    };
  }

  private async openPosition(type: PositionType) {
    if (this.openedPosition) return;
    const price = await this.getCurrentPrice();
    if (!price) return;
    this._addOneTxs();
    const amount = this.equity >= this.initAmount
        ? this.percentForEachTrade * this.equity
        : this.percentForEachTrade * this.initAmount;
    this.openedPosition = new Position(type, amount, price, this.equity, this.leverage)
    this.equity -= amount;
    this.logData(LogType.SUCCESS, `New ${type} Position opened!`);
  }

  private async closePosition() {
    if (!this.openedPosition) return;
    const price = await this.getCurrentPrice();
    if (!price) return;
    this.openedPosition.close(price);
    this.equity += this.openedPosition.closeAmount;
    this.logData(LogType.SUCCESS, `Closed ${this.openedPosition.positionType} position!`, this.openedPosition);
    this.openedPosition = null;
  }

  private async getCurrentPrice(): Promise<number> {
    const result = await binanceApi.getPrice(this.pair);
    const { error, data } = result;
    if (!error && data?.price) return parseFloat(data.price);
    this.logData(LogType.ERROR, `Error with getting Price`, result);
    return 0;
  }

  private _addOneTxs() {
    this.txs = this.txs + 1;
  }

  private logData(type: string, log: string, data: any = {}) {
    const _log = new LogData(type, log, data);
    const logData = _log.save(`${this.pair}-${this.id}`);
    this.log.unshift(logData);
    mainSocket.emit('botsList', myBotManager.allBots);
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
        console.log(this._allBots)
        addLogRoute(newBot.id);
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
  // const botsWithCurrentAlert = myBotManager.allBots.filter(bot => bot.alerts[alert]);
  myBotManager.allBots.forEach(bot => bot.handleAlert(alert));
}

export const getBotLogById = (id: number) => {
  const currentBot = myBotManager.allBots.find(bot => bot.id === id);
  return currentBot.log;
}