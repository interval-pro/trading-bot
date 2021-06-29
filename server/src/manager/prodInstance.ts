import { envConfig } from '../config';
import * as Binance from 'node-binance-api'

export class ProdInstance {
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