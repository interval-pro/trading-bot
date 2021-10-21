import { Position, PositionType } from './position';
import { LogData, LogType, convertCSVtoJSON } from '../utils';
import { socket as mainSocket } from '../index';
import { binanceApi } from "../apis/binance-api.service";
import { myBotManager } from './manager';
import { adaSubs } from "./events";
import { myBinance } from './prodInstance';

export interface IBotConfig {
    pair: string,
    initAmount: number;
    percentForEachTrade: number;
    leverage: number;
    strategy: string;
    sltp?: {
      sl: number,
      tp: number,
    },
    histData?: string;
};

export class Bot implements IBotConfig {
    id: number;
    pair: string;
    initAmount: number;
    percentForEachTrade: number;
    leverage: number;
    strategy: string;
    pnl: number = 0;
    txs: number = 0;
    equity: number;
    openedPosition: Position = null;
    log: any[] = [];
    sltp: {
      sl: number | null,
      tp: number | null,
    };
    prod: boolean = false;
    listener: any;
    histRawData: string;

    constructor(botConfig: IBotConfig, id: number) {
      const {
          pair,
          initAmount,
          percentForEachTrade,
          leverage,
          strategy,
          sltp,
          histData,
      } = botConfig;

      this.id = id;
      // if (id === 1) this.prod = true;
      this.pair = pair;
      this.initAmount = initAmount;
      this.equity = initAmount;
  
      this.percentForEachTrade = percentForEachTrade;
      this.leverage = leverage;
      this.strategy = strategy,
      sltp ? this.sltp = sltp : null;
    
      // this.histRawData = histData;
  
      const logData = {
        id: this.id,
        pair: this.pair,
        initAmount: this.initAmount,
        percentForEachTrade: this.percentForEachTrade,
        leverage: this.leverage,
        strategy: this.strategy,
        sl: sltp?.sl,
        tp: sltp?.tp,
        isHist: histData ? true : false,
      }
      this.logData(LogType.SUCCESS, `Bot Started!`, logData);
      if (this.histRawData) this.processHistData();
    }
  
    async handleAlert(alert: string) {
      this.logData(LogType.SUCCESS, `New Alert: ${alert}`);

      if (this.strategy === 'os-close') {
        if (alert === 'red1_peak_60') {
          if (this.openedPosition?.positionType === "LONG") await this.closePosition();
          if (!this.openedPosition) await this.openPosition('SHORT');
        }
        if (alert === 'green1_bottom_60') {
          if (this.openedPosition?.positionType === "SHORT") await this.closePosition();
          if (!this.openedPosition) this.openPosition('LONG');
        }
      }
    }
  
    private async openPosition(type: PositionType, _price: number = null, time: string = undefined) {
      if (this.openedPosition) return;
      const price = _price ? _price : await this.getCurrentPrice();
      if (!price) return;
      const amount = this.percentForEachTrade * this.equity

      if (this.prod) {
        await myBinance.reduceAll();
        type === 'LONG' ? await myBinance.buy() : await myBinance.sell();
      }

      this.openedPosition = new Position(type, amount, price, this.equity, this.leverage, time);
      if ((this.sltp.sl || this.sltp.tp) && !this.histRawData) this.openSLTPSubscriber(type, price);
      this.logData(LogType.SUCCESS, `New ${type} Position opened!`);
      mainSocket.emit('botsList', myBotManager.allBots);
    }
  
    private async closePosition(slClose: boolean = false, _price: number = null, time: string = undefined) {
      if (!this.openedPosition) return;
      const price = _price ? _price : await this.getCurrentPrice();
      if (!price) return;

      if (this.prod) await myBinance.reduceAll();

      this.openedPosition.close(price, time, slClose);
      if (this.listener) adaSubs.eventEmmiter.removeListener('priceSubs', this.listener)

      this.equity += this.openedPosition.pnlAmount;
      this.pnl = this.equity - this.initAmount;
      this.logData(LogType.SUCCESS, `Closed ${this.openedPosition.positionType} position!`, this.openedPosition);
      this.openedPosition = null;
      this.txs++;
      mainSocket.emit('botsList', myBotManager.allBots);
    }
  
    private async getCurrentPrice(): Promise<number> {
      const result = await binanceApi.getPrice(this.pair);
      const { error, data } = result;
      if (!error && data?.price) return parseFloat(data.price);
      this.logData(LogType.ERROR, `Error with getting Price`, result);
      return 0;
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
    
        const lastPrice = parseFloat(data?.lastPrice);
        if (!lastPrice || lastPrice < 0) return;
        if (isLong) {
          if (this.sltp.sl && lastPrice < slPrice) this.closePosition(true);
          if (this.sltp.tp && lastPrice > tpPrice) this.closePosition(true);
        } else {
          if (this.sltp.sl && lastPrice > slPrice) this.closePosition(true);
          if (this.sltp.tp && lastPrice < tpPrice) this.closePosition(true);
        }
      }
    }
  
    private logData(type: string, log: string, data: any = {}) {
      const _log = new LogData(type, log, data);
      const logData = _log.save(`${this.pair}-${this.id}`);
      this.log.unshift(logData);
    }
  
    private async processHistData() {
      console.log(`Process Hist data`);
      const histDataArray: any[] = await convertCSVtoJSON(this.histRawData) as any[];
      for (let i = 0; i < histDataArray.length - 1; i++) {
        await new Promise((res) => setTimeout(() => res(true), 5));
        const cc = histDataArray[i];
        const time = cc['time'];
        const priceClose = parseFloat(cc['close']);
        const priceHigh = parseFloat(cc['high']);
        const priceLow = parseFloat(cc['low']);
        const longDot = parseFloat(cc['Blue Wave Crossing UP']) || null;
        const shortDot = parseFloat(cc['Blue Wave Crossing Down']) || null;

        if (this.strategy === 'os-close') {
          if (longDot && longDot <= -60) {
            if (this.openedPosition?.positionType === "LONG") await this.closePosition(false, priceClose, time);
            if (!this.openedPosition) await this.openPosition('SHORT');
          }
          if (shortDot && shortDot >= 60) {
            if (this.openedPosition?.positionType === "SHORT") await this.closePosition(false, priceClose, time);
            if (!this.openedPosition) await this.openPosition('LONG', priceClose, time);
          }
        }

        if (this.openedPosition) {
          const openPrice = this.openedPosition.openPrice;

          if (this.sltp?.sl) {
            if (this.openedPosition?.positionType === 'LONG') {
              const _slPrice = openPrice - (openPrice * this.sltp.sl);
              const slPrice = parseFloat(_slPrice.toFixed(4));
              if (priceLow <= slPrice) await this.closePosition(true, slPrice, time);
            }

            if (this.openedPosition?.positionType === 'SHORT') {
              const _slPrice = openPrice + (openPrice * this.sltp.sl);
              const slPrice = parseFloat(_slPrice.toFixed(4));
              if (priceHigh >= slPrice) await this.closePosition(true, slPrice, time);
            }
          }

          if (this.sltp?.tp) {
            if (this.openedPosition?.positionType === 'LONG') {
              const _tpPrice = openPrice + (openPrice * this.sltp.tp);
              const tpPrice = parseFloat(_tpPrice.toFixed(4));
              if (priceHigh >= tpPrice) await this.closePosition(true, tpPrice, time);
            }

            if (this.openedPosition?.positionType === 'SHORT') {
              const _tpPrice = openPrice - (openPrice * this.sltp.tp);
              const tpPrice = parseFloat(_tpPrice.toFixed(4));
              if (priceLow <= tpPrice) await this.closePosition(true, tpPrice, time);
            }
          }
        }
      }
    }
  }