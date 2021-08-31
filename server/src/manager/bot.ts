import { Position, PositionType } from './position';
import { LogData, LogType, convertCSVtoJSON } from '../utils';
import { socket as mainSocket } from '../index';
import { binanceApi } from "../apis/binance-api.service";
import { myBotManager } from './manager';
import { adaSubs } from "./events";
import { myBinance } from './prodInstance';

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
      if (this.strategy === 'tons-7min') {
        if (alert === 'BYD7' ) {
          if (this.openedPosition?.positionType === "SHORT") await this.closePosition();
          if (!this.openedPosition) await this.openPosition('LONG');
        }
  
        if (alert === 'BRC7') {
          if (this.openedPosition?.positionType === "LONG") await this.closePosition();
          if (!this.openedPosition) await this.openPosition('SHORT');
        }
      }

      if (this.strategy === 'tons-30min') {
        if (alert === 'SDSO30') {
          if (this.openedPosition?.positionType === "SHORT") await this.closePosition();
          if (!this.openedPosition) await this.openPosition('LONG');
        }
  
        if (alert === 'BRC30') {
          if (this.openedPosition?.positionType === "LONG") await this.closePosition();
          if (!this.openedPosition) await this.openPosition('SHORT');
        }
      }
    }
  
    private async openPosition(type: PositionType, _price: number = null, time: string = undefined) {
      if (this.openedPosition) return;
      const price = _price ? _price : await this.getCurrentPrice();
      if (!price) return;

      const amount = this.percentForEachTrade * this.initAmount;
  
      if (this.prod) {
        await myBinance.reduceAll();
        type === 'LONG' ? await myBinance.buy() : await myBinance.sell();
      }

      this.openedPosition = new Position(type, amount, price, this.equity, this.leverage, time);
      if ((this.sltp.sl || this.sltp.tp) && !this.histRawData) this.openSLTPSubscriber(type, price);
      this.logData(LogType.SUCCESS, `New ${type} Position opened!`);
    }
  
    private async closePosition(_price: number = null, time: string = undefined) {
      if (!this.openedPosition) return;
      const price = _price ? _price : await this.getCurrentPrice();
      if (!price) return;

      if (this.prod) await myBinance.reduceAll();

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
      adaSubs.eventEmmiter.addListener('trades', (data: any) => {
        console.log(data);
      })
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
        if (isLong) {
          if (lastPrice < slPrice || lastPrice > tpPrice) this.closePosition();
        } else {
          if (lastPrice > slPrice || lastPrice < tpPrice) this.closePosition();
        }
        if (isLong) {
          if (lastPrice < slPrice) this.closePosition();
        } else {
          if (lastPrice > slPrice) this.closePosition();
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
      let _test: any = null;
      for (let i = 0; i < histDataArray.length - 1; i++) {
        await new Promise((res) => setTimeout(() => res(true), 5));
        ///out_of_ema,ema,sell_signal,buy_signal
        const cc = histDataArray[i];
        const time = cc['time'];
        const priceClose = parseFloat(cc['close'])
        const priceHigh = parseFloat(cc['high']);
        const priceLow = parseFloat(cc['low']);
        const longDot = parseFloat(cc['buy_signal']) || null;
        const shortDot = parseFloat(cc['sell_signal']) || null;
        const emaLevelPrice = parseFloat(parseFloat(cc['ema']).toFixed(3));

        if (!this.openedPosition) {
          if (longDot) await this.openPosition('LONG', priceClose, time);
          if (shortDot) await this.openPosition('SHORT', priceClose, time);
          if (longDot || shortDot) _test = i;
        } else {
          const slPercent = 0.1;
          const isLong = this.openedPosition.positionType === 'LONG';
          const openPrice = this.openedPosition.openPrice;
          if (isLong) {
            const prevCandleLow = parseFloat(histDataArray?.[_test - 1]?.['low']) || null;
            const _slPrice = parseFloat((openPrice - ((openPrice * slPercent) / 100)).toFixed(3));
            const slPrice = prevCandleLow && prevCandleLow < _slPrice ? prevCandleLow : _slPrice;
            if (priceLow < slPrice) {
              console.log({prevCandleLow, _slPrice, slPrice})
              await this.closePosition(slPrice, time);
            }
            if (priceHigh > emaLevelPrice) {
              await this.closePosition(emaLevelPrice, time);
            }
          } else {
            const prevCandleHigh = parseFloat(histDataArray?.[_test - 1]?.['high']) || null;
            const _slPrice = parseFloat((openPrice + ((openPrice * slPercent) / 100)).toFixed(3));
            const slPrice = prevCandleHigh && prevCandleHigh > _slPrice ? prevCandleHigh : _slPrice;
            if (priceHigh > slPrice) {
              console.log({prevCandleHigh, _slPrice, slPrice})
              await this.closePosition(slPrice, time);
            }
            if (priceLow < emaLevelPrice){
              await this.closePosition(emaLevelPrice, time);
            }
          }
        }
        // const outOfEmaPercent = cc['out_of_ema'];
        // const ema = parseFloat(parseFloat(cc['ema']).toFixed(4));
        // const longDot = cc['buy_signal'];
        // const shortDot = cc['sell_signal'];
        // const ct = cc['time'];
        // const 
        // const cp = parseFloat(parseFloat(cc['close']).toFixed(4));
        // if(!this.openedPosition) {
        //   if (longDot && longDot !== 'NaN') await this.openPosition('LONG', cp, ct);
        //   if (shortDot && shortDot !== 'NaN') await this.openPosition('SHORT', cp, ct);
        // } else {
        //   const sl = 0.2;
        //   const isLong = this.openedPosition.positionType === 'LONG';
        //   const openPrice = this.openedPosition.openPrice;
        //   const _slPrice = isLong
        //     ? openPrice - ((openPrice * sl) / 100)
        //     : openPrice + ((openPrice * sl) / 100);
        //   const slPrice = parseFloat(_slPrice.toFixed(4));
        //   if (isLong) {
        //     if (cp < slPrice) await this.closePosition(slPrice, ct);
        //     if (cp > ema) await this.closePosition(ema, ct);
        //   } else {
        //     if (cp > slPrice) await this.closePosition(slPrice, ct);
        //     if (cp < ema) await this.closePosition(ema, ct);          }
        // }
        // const bwcu = cc['Blue Wave Crossing UP'];
        // const bwcd = cc['Blue Wave Crossing Down'];
        // const cp = parseFloat(cc['close']);
        // const ct = cc['time'];
        // const mf = cc['Mny Flow'];
        // if (!this.openedPosition) {
        //   if (bwcu && bwcu !== 'NaN' && parseFloat(bwcu) < bwcuBottomLevel) await this.openPosition('LONG', cp, ct);
        //   if (bwcd && bwcd !== 'NaN' && parseFloat(bwcd) > bwcdTopLevel) await this.openPosition('SHORT', cp, ct);
        // } else {
        //   const isLong = this.openedPosition.positionType === 'LONG';
        //   const openPrice = this.openedPosition.openPrice;
        //   const _slPrice = isLong
        //     ? openPrice - (openPrice * this.sltp.sl)
        //     : openPrice + (openPrice * this.sltp.sl);
        //   const slPrice = parseFloat(_slPrice.toFixed(2));
        //   if (isLong) {
        //     if (cp < slPrice) await this.closePosition(slPrice, ct);
        //     if (parseFloat(bwcd) > 0) await this.closePosition(cp, ct);
        //   } else {
        //     if (cp > slPrice) await this.closePosition(slPrice, ct);
        //     if (parseFloat(bwcu) < 0) await this.closePosition(cp, ct);
          // }
        // }
      }
    }
  }