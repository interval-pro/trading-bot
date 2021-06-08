import { binanceApi } from "../apis/binance-api.service";
import { getDate, LogData, LogType } from '../utils';
import { socket as mainSocket } from '../index';
import { addLogRoute } from '../routes/log.route';
import { PriceSubscriber } from "./events";
import { envConfig } from '../config'
import * as Binance from 'node-binance-api'
export interface IBotConfig {
    pair: string,
    initAmount: number;
    percentForEachTrade: number;
    leverage: number;
    strategy: string;
    yxbd: {
      yx: string | null,
      bd: string | null,
    };

    sltp?: {
      sl: number,
      tp: number,
    },
    sl?: number;
    tslAct?: number;
    tslCBRate?: number;
};

var id = 0;
const getId = () => {
  id += 1;
  return id;
};

export type PositionType = "SHORT" | "LONG";
export type AlertType = "OP" | "CP" | "COP";

class ProdInstance {
  private binance: Binance;

  constructor() {
    this.binance = new Binance().options({
      APIKEY: envConfig.BINANCE_API_KEY,
      APISECRET: envConfig.BINANCE_API_SECRET,
    });
  }

  async getBalance() {
    const res = await this.binance.futuresBalance();
    const myBalance = res.find((balObj: any) => balObj.asset === 'USDT').balance;
    return parseFloat(myBalance);
  }

  async getADAprice() {
    const allMarketsPrices = await this.binance.futuresPrices();
    const adaPrice = allMarketsPrices.ADAUSDT;
    return parseFloat(adaPrice)
  }

  async buy() {
    const balance = await this.getBalance();
    const price = await this.getADAprice();
    const numberTokens = Math.round((balance * 10) / price);

    await this.reduceAll();
    console.log({numberTokens: (numberTokens / 2)})
    // await this.binance.futuresMarketBuy('ADAUSDT', (numberTokens / 2))
  }

  async sell() {
    const balance = await this.getBalance();
    const price = await this.getADAprice();
    const numberTokens = Math.round((balance * 10) / price);

    await this.reduceAll();
    console.log({numberTokens: (numberTokens / 2)})

    // await this.binance.futuresMarketSell('ADAUSDT', (numberTokens / 2))
  }

  async reduceAll() {
    const balance = await this.getBalance();
    const price = await this.getADAprice();
    const maxTokens = Math.round((balance * 10) / price);

    const reduceAmount = maxTokens - 20;
    console.log({reduceAmount})
    // await this.binance.futuresMarketSell('ADAUSDT', reduceAmount, { reduceOnly: true });
    // await this.binance.futuresMarketBuy('ADAUSDT', reduceAmount, { reduceOnly: true });
  }
} 

const myBinance = new ProdInstance();

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

  strategy: string;

  tslAct: number;
  tslCBRate: number;

  pnl: number = 0;
  txs: number = 0;
  alerts: { [key: string]: string };

  equity: number;

  openedPosition: Position = null;

  log: any[] = [];

  trend: TTrend;

  yxbd: {
    yx: string | null,
    bd: string | null,
  };

  sltp: {
    sl: number | null,
    tp: number | null,
  };

  prod: boolean = false;

  listener: any;
  constructor(botConfig: IBotConfig) {
    const {
        pair,
        initAmount,
        percentForEachTrade,
        leverage,
        strategy,
        yxbd,
        sltp,
    } = botConfig;
    this.id = getId();

    // if (id === 1) {
    //   this.prod = true;
    // }

    this.pair = pair;
    this.initAmount = initAmount;
    this.equity = initAmount;

    this.percentForEachTrade = percentForEachTrade;
    this.leverage = leverage;
    this.strategy = strategy,
    sltp ? this.sltp = sltp : null;
  
    this.yxbd = yxbd;
    this.sltp = sltp;
  
    const logData = {
      id: this.id,
      pair: this.pair,
      initAmount: this.initAmount,
      percentForEachTrade: this.percentForEachTrade,
      leverage: this.leverage,
      strategy: this.strategy,
      yx: yxbd.yx,
      bd: yxbd.bd,
      sl: sltp?.sl,
      tp: sltp?.tp,
    }

    this.logData(LogType.SUCCESS, `Bot Started!`, logData);

  }

  get yx() {
    return this.yxbd.yx;
  }

  get bd() {
    return this.yxbd.bd;
  }

  async handleAlert(alert: string) {
    const alertMatchStrategy = this.checkMatchStrategy(alert);
    if (!alertMatchStrategy) return;
    this.logData(LogType.SUCCESS, `New Alert: ${alert}`);

    const changeTrendAlertsArray = ['green5', 'red5', 'green60', 'red60'];
    if (changeTrendAlertsArray.includes(alert)) return this.changeTrend(alert);

    const handleBuySellAlerts = ['green1', 'red1', 'green7', 'red7', 'green15', 'red15'];
    if (handleBuySellAlerts.includes(alert)) return this.handleBuySell(alert);

    const yxAlerts = ['YX1', 'YX7' , 'YX15'];
    if (yxAlerts.includes(alert)) return this.handleYX();

    const bdAlerts = ['BD1', 'BD7' , 'BD15'];
    if (bdAlerts.includes(alert)) return this.handleBD();

    const newStrategyAlerts = ['green1_peak_60', 'red1_peak_60', 'green1_bottom_60', 'red1_bottom_60'];
    if (newStrategyAlerts.includes(alert)) return this.handleNewStrategy(alert);

  }

  handleNewStrategy(alert: string) {
    if (alert === 'red1_peak_60' && !this.openedPosition) {
      this.openPosition('SHORT');
    } 

    if (alert === 'green1_bottom_60' && !this.openedPosition) {
      this.openPosition('LONG');
    }

    if (alert === 'green1_peak_60' && this.openedPosition) {
      this.closePosition();
    }

    if (alert === 'red1_bottom_60' && this.openedPosition) {
      this.closePosition();
    }
  }

  private async handleYX() {
    if (!this.yx) return;
    if (this.trend === 'up' && this.openedPosition.positionType === 'LONG') {
      await this.closePosition()
    }
    if (this.trend === 'down' && !this.openedPosition) {
      await this.openPosition('SHORT');
    }
  }

  private async handleBD() {
    if (!this.bd) return;
    if (this.trend === 'up' && this.openedPosition.positionType === 'LONG') {
      await this.closePosition()
    }
    if (this.trend === 'down' && !this.openedPosition) {
      await this.openPosition('SHORT');
    }
  }

  private checkMatchStrategy(a: string) {
    const alerts_1_5_array = ['green1', 'red1', 'green5', 'red5', 'YX1' , 'BD1'];
    const alerts_60_7_array = ['green7', 'red7', 'green60', 'red60', 'YX7' , 'BD7'];
    const alerts_60_15_array = ['green15', 'red15', 'green60', 'red60', 'YX15' , 'BD15'];
    const alert_PEAK_BOTTOM_ARRAY = ['green1_peak_60', 'red1_peak_60', 'green1_bottom_60', 'red1_bottom_60'];
    if (this.strategy === '1m-5m') return alerts_1_5_array.includes(a) ? true : false;
    if (this.strategy === '1h-7m') return alerts_60_7_array.includes(a) ? true : false;
    if (this.strategy === '1h-15m') return alerts_60_15_array.includes(a) ? true : false;
    if (this.strategy === 'pb') return alert_PEAK_BOTTOM_ARRAY.includes(a) ? true : false;

    return false;
  }

  private handleBuySell(alert: string) {
    if (this.trend === 'up') {
      alert.includes('green')
        ? this.openPosition('LONG')
        : this.closePosition();
    }

    if (this.trend === 'down') {
      alert.includes('red')
        ? this.openPosition('SHORT')
        : this.closePosition();
    }
  }

  private async changeTrend(alert: string) {
    if (alert.includes('green') && this.trend !== 'up') {
      this.trend = 'up';
    }
    if (alert.includes('red') && this.trend !== 'down') {
      this.trend = 'down'
    };
  }

  private async openPosition(type: PositionType) {
    if (this.openedPosition) return;
    if (this.prod) {
      if (type === 'LONG') myBinance.buy();
      if (type === 'SHORT') myBinance.sell();
    }
    const price = await this.getCurrentPrice();
    if (!price) return;
    const amount = this.equity >= this.initAmount
        ? this.percentForEachTrade * this.equity
        : this.percentForEachTrade * this.initAmount;

    this.openedPosition = new Position(type, amount, price, this.equity, this.leverage);
    if (this.sltp.sl || this.sltp.tp) this.openSLTPSubscriber(type, price)
    this.logData(LogType.SUCCESS, `New ${type} Position opened!`);
  }

  private async closePosition() {
    if (!this.openedPosition) return;
    if (this.prod) {
      myBinance.reduceAll();
    }
    const price = await this.getCurrentPrice();
    if (!price) return;
    this.openedPosition.close(price);
    adaSubs.eventEmmiter.removeListener('priceSubs', this.listener)
    this.equity += this.openedPosition.pnlAmount;
    this.pnl = this.equity - this.initAmount;
    this.logData(LogType.SUCCESS, `Closed ${this.openedPosition.positionType} position!`, this.openedPosition);
    this.openedPosition = null;
    this._addOneTxs();
    mainSocket.emit('botsList', myBotManager.allBots);

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

  private openSLTPSubscriber(type: PositionType, price: number) {
    const isLong: boolean = type === 'LONG';
    this.listener = this.onPriceSubs(isLong, price).bind(this);
    adaSubs.eventEmmiter.addListener('priceSubs', this.listener);
  }

  onPriceSubs(isLong: boolean, openPrice: number) {
    return (data: any) => {
      const slPrice = isLong
        ? openPrice - (openPrice * this.sltp.sl)
        : openPrice + (openPrice * this.sltp.sl);
  
      const tpPrice = isLong
        ? openPrice + (openPrice * this.sltp.tp)
        : openPrice - (openPrice * this.sltp.tp);
  
      const { lastPrice } = data;
      console.log({lastPrice, tpPrice, slPrice})
      if (isLong) {
        if (lastPrice < slPrice || lastPrice > tpPrice) this.closePosition();
      } else {
        if (lastPrice > slPrice || lastPrice < tpPrice) this.closePosition();
      }
    }
  }

  private logData(type: string, log: string, data: any = {}) {
    const _log = new LogData(type, log, data);
    const logData = _log.save(`${this.pair}-${this.id}`);
    this.log.unshift(logData);
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

const adaSubs = new PriceSubscriber('ADAUSDT');