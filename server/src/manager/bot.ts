import { Position, PositionType } from './position';
import { LogData, LogType, convertCSVtoJSON } from '../utils';
import { socket as mainSocket } from '../index';
import { binanceApi } from "../apis/binance-api.service";
import { myBotManager } from './manager';
import { adaSubs } from "./events";
// import { myBinance } from './prodInstance';

export type TTrend = 'up' | 'down';

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
    histData?: string;
    openLevel?: number;
};

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
    histRawData: string;

    openLevel: number;
    constructor(botConfig: IBotConfig, id: number) {
      const {
          pair,
          initAmount,
          percentForEachTrade,
          leverage,
          strategy,
          yxbd,
          sltp,
          histData,
          openLevel,
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
    
      this.yxbd = yxbd;
      this.sltp = sltp;
      this.histRawData = histData;
  
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
        isHist: histData ? true : false,
      }
      
      this.openLevel = openLevel;
      this.logData(LogType.SUCCESS, `Bot Started!`, logData);
      if (this.histRawData) this.processHistData();
    }
  
    get yx() {
      return this.yxbd.yx;
    }
  
    get bd() {
      return this.yxbd.bd;
    }
  
    async handleAlert(alert: string) {
      this.logData(LogType.SUCCESS, `New Alert: ${alert}`);
      if (this.strategy === 'os') {
          if (alert === 'YX1') {
            if (!this.yx) return;
            if (this.openedPosition?.positionType === "LONG") await this.closePosition();
            if (!this.openedPosition) await this.openPosition('SHORT');
          }

          if (alert === 'BD1') {
            if (!this.bd) return;
            if (this.openedPosition?.positionType === "LONG") await this.closePosition();
            if (!this.openedPosition) await this.openPosition('SHORT');
          }

          if (alert === 'red1_peak_60') {
            if (!this.openedPosition) this.openPosition('SHORT');
          }
    
          if (alert === 'green1_bottom_60') {
            if (!this.openedPosition) this.openPosition('LONG');
          }
      }

      if (this.strategy === 'os-close') {
        if (alert === 'YX1') {
          if (!this.yx) return;
          if (this.openedPosition?.positionType === "LONG") await this.closePosition();
          if (!this.openedPosition) await this.openPosition('SHORT');
        }

        if (alert === 'BD1') {
          if (!this.bd) return;
          if (this.openedPosition?.positionType === "LONG") await this.closePosition();
          if (!this.openedPosition) await this.openPosition('SHORT');
        }

        if (alert === 'red1_peak_60') {
          if (this.openedPosition?.positionType === "LONG") await this.closePosition();
          if (!this.openedPosition) await this.openPosition('SHORT');        }
  
        if (alert === 'green1_bottom_60') {
          if (this.openedPosition?.positionType === "SHORT") await this.closePosition();
          if (!this.openedPosition) this.openPosition('LONG');
        }
    }

      // if (this.strategy === 'tons-7min') {
      //   if (alert === 'BYD7' ) {
      //     if (this.openedPosition?.positionType === "SHORT") await this.closePosition();
      //     if (!this.openedPosition) await this.openPosition('LONG');
      //   }
  
      //   if (alert === 'BRC7') {
      //     if (this.openedPosition?.positionType === "LONG") await this.closePosition();
      //     if (!this.openedPosition) await this.openPosition('SHORT');
      //   }
      // }

      // if (this.strategy === 'tons-30min') {
      //   if (alert === 'SDSO30') {
      //     if (this.openedPosition?.positionType === "SHORT") await this.closePosition();
      //     if (!this.openedPosition) await this.openPosition('LONG');
      //   }
  
      //   if (alert === 'BRC30') {
      //     if (this.openedPosition?.positionType === "LONG") await this.closePosition();
      //     if (!this.openedPosition) await this.openPosition('SHORT');
      //   }
      // }

      // if (this.strategy === 'tons-10-3-long') {
      //   if (alert === '10-3-long-buy') {
      //     if (!this.openedPosition) await this.openPosition('LONG');
      //   }
  
      //   if (alert === '10-3-long-sell') {
      //     if (this.openedPosition?.positionType === "LONG") await this.closePosition();
      //   }
      // }
    }
  
    private async openPosition(type: PositionType, _price: number = null, time: string = undefined) {
      if (this.openedPosition) return;
      const price = _price ? _price : await this.getCurrentPrice();
      if (!price) return;

      // const amount = this.equity >= this.initAmount
      //   ? this.percentForEachTrade * this.equity
      //   : this.percentForEachTrade * this.initAmount;

      // const amount = this.percentForEachTrade * this.initAmount;
  
      const amount = this.percentForEachTrade * this.equity

      // if (this.prod) {
      //   await myBinance.reduceAll();
      //   type === 'LONG' ? await myBinance.buy() : await myBinance.sell();
      // }

      this.openedPosition = new Position(type, amount, price, this.equity, this.leverage, time);
      // if ((this.sltp.sl || this.sltp.tp) && !this.histRawData) this.openSLTPSubscriber(type, price);
      this.logData(LogType.SUCCESS, `New ${type} Position opened!`);
    }
  
    private async closePosition(_price: number = null, time: string = undefined) {
      if (!this.openedPosition) return;
      const price = _price ? _price : await this.getCurrentPrice();
      if (!price) return;

      // if (this.prod) await myBinance.reduceAll();

      this.openedPosition.close(price, time);
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
      // adaSubs.eventEmmiter.addListener('trades', (data: any) => {
      //   console.log(data);
      // })
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
          if (this.sltp.sl && lastPrice < slPrice) this.closePosition();
          if (this.sltp.tp && lastPrice > tpPrice) this.closePosition();
        } else {
          if (this.sltp.sl && lastPrice > slPrice) this.closePosition();
          if (this.sltp.tp && lastPrice < tpPrice) this.closePosition();
        }
        // if (isLong) {
        //   if (lastPrice < slPrice) this.closePosition();
        // } else {
        //   if (lastPrice > slPrice) this.closePosition();
        // }
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
        const openLevel = this.openLevel;
        const revertedOpenLevel = this.openLevel * -1;
        await new Promise((res) => setTimeout(() => res(true), 5));
        const cc = histDataArray[i];
        const time = cc['time'];
        const priceClose = parseFloat(cc['close']);
        const priceHigh = parseFloat(cc['high']);
        const priceLow = parseFloat(cc['low']);
        const longDot = parseFloat(cc['Blue Wave Crossing UP']) || null;
        const shortDot = parseFloat(cc['Blue Wave Crossing Down']) || null;
        const yxSignal = parseFloat(cc['Yellow X']);
        const bdSignal = parseFloat(cc['Blood Diamond']);
        // console.log({time, priceClose, priceHigh, priceLow, longDot, shortDot, yxSignal, bdSignal})

          if (yxSignal && this.yx) {
              if (this.openedPosition?.positionType === "LONG") await this.closePosition(priceClose, time);
              if (!this.openedPosition) await this.openPosition('SHORT', priceClose, time);
          }

          if (bdSignal && this.bd) {
            if (this.openedPosition?.positionType === "LONG") await this.closePosition(priceClose, time);
            if (!this.openedPosition) await this.openPosition('SHORT', priceClose, time);
          }

          if (this.strategy === 'os') {
              if (longDot && longDot <= revertedOpenLevel) {
                if (!this.openedPosition) await this.openPosition('LONG', priceClose, time);
              }
        
              if (shortDot && shortDot >= openLevel) {
                if (!this.openedPosition) await this.openPosition('SHORT', priceClose, time);
              }
          }

          if (this.strategy === 'os-close') {
            if (longDot && longDot <= revertedOpenLevel) {
              if (this.openedPosition?.positionType === "SHORT") await this.closePosition(priceClose, time);
              if (!this.openedPosition) await this.openPosition('LONG', priceClose, time);
            }
            if (shortDot && shortDot >= openLevel) {
              if (this.openedPosition?.positionType === "LONG") await this.closePosition(priceClose, time);
              if (!this.openedPosition) await this.openPosition('SHORT', priceClose, time);
            }
          }

          if (this.openedPosition) {
            const openPrice = this.openedPosition.openPrice;

            if (this.sltp?.sl) {
              if (this.openedPosition?.positionType === 'LONG') {
                const _slPrice = openPrice - (openPrice * this.sltp.sl);
                const slPrice = parseFloat(_slPrice.toFixed(4));
                if (priceLow <= slPrice) await this.closePosition(slPrice, time);
              }
  
              if (this.openedPosition?.positionType === 'SHORT') {
                const _slPrice = openPrice + (openPrice * this.sltp.sl);
                const slPrice = parseFloat(_slPrice.toFixed(4));
                if (priceHigh >= slPrice) await this.closePosition(slPrice, time);
              }
            }

            if (this.sltp?.tp) {
              if (this.openedPosition?.positionType === 'LONG') {
                const _tpPrice = openPrice + (openPrice * this.sltp.tp);
                const tpPrice = parseFloat(_tpPrice.toFixed(4));
                if (priceHigh >= tpPrice) await this.closePosition(tpPrice, time);
              }
  
              if (this.openedPosition?.positionType === 'SHORT') {
                const _tpPrice = openPrice - (openPrice * this.sltp.tp);
                const tpPrice = parseFloat(_tpPrice.toFixed(4));
                if (priceLow <= tpPrice) await this.closePosition(tpPrice, time);
              }
            }
          }
      }
    }
  }