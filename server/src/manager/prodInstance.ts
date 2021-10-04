import { envConfig } from '../config';
import * as Binance from 'node-binance-api'
import { addProductionLog } from '../utils';

class ProdInstance {
    private binance: Binance;
    private procentForEachTrade: number = 0.8;
    private laverage: number = 10;

    constructor() {
      this.binance = new Binance().options({
        APIKEY: envConfig.BINANCE_API_KEY,
        APISECRET: envConfig.BINANCE_API_SECRET,
      });
      addProductionLog(`PRODUCTION BOT STARTED!`);
    }
  
    private async getBalance() {
      try {
        const res = await this.binance.futuresBalance();
        const myBalance = res.find((balObj: any) => balObj.asset === 'BUSD').availableBalance;
        addProductionLog(`Balance: ${myBalance}`);
        return parseFloat(parseFloat(myBalance).toFixed(0));
      } catch(err) {
        addProductionLog(err.message);
        return null;
      }
    }
  
    private async getADAprice() {
      try {
        const allMarketsPrices = await this.binance.futuresPrices();
        const adaPrice = allMarketsPrices.ADAUSDT;
        addProductionLog(`ADA Price: ${adaPrice}`);
        return parseFloat(adaPrice)
      } catch(err) {
        addProductionLog(err.message);
        return null;
      }
    }
  
    async buy() {
      const amountOfTokens = await this.getAmountForPosition();
      if (!amountOfTokens) return;
      try {
        await this.binance.futuresMarketBuy('ADAUSDT', amountOfTokens);
        addProductionLog(`Buy! ${amountOfTokens}`);
      } catch(err) {
        console.log(`Error: ${err.message}`);
        addProductionLog(err.message);
      }
    }
  
    async sell() {
      const amountOfTokens = await this.getAmountForPosition();
      if (!amountOfTokens) return;
      try {
        await this.binance.futuresMarketSell('ADAUSDT', amountOfTokens);
        addProductionLog(`Sell! ${amountOfTokens}`);
      } catch(err) {
        console.log(`Error: ${err.message}`);
        addProductionLog(err.message);
      }
    }
  
    async reduceAll() {
      const openedPositionAmount = await this.getOpenedPositionAmount();
      if (!openedPositionAmount) return;

      try {
        const absoluteValueOfOpenedAmount = Math.abs(openedPositionAmount);
        openedPositionAmount > 0
          ? await this.binance.futuresMarketSell('ADABUSD', absoluteValueOfOpenedAmount, { reduceOnly: true })
          : await this.binance.futuresMarketBuy('ADABUSD', absoluteValueOfOpenedAmount, { reduceOnly: true });
          addProductionLog(`Closed! ${openedPositionAmount}`);
      } catch(err) {
        console.log(`Error: ${err.messaga}`);
        addProductionLog(err.message);
      }
    }

    private async getOpenedPositionAmount() {
      try {
        const fetauresAccAda = (await this.binance.futuresAccount()).positions.find(e => e.symbol === 'ADABUSD');
        const positionAmt = fetauresAccAda.positionAmt;
        addProductionLog(`Position Amount ${positionAmt}`);
        return parseFloat(positionAmt);
      } catch (err) {
        addProductionLog(err.message);
        return null;
      }
    }
    private async getAmountForPosition() {
      try {
        const balance = await this.getBalance();
        const price = await this.getADAprice();
        if (!balance || !price) return null;
        const _amount = (this.procentForEachTrade * balance) * this.laverage;
        const amountOfTokens = _amount.toFixed(0);
        addProductionLog(`Calculating Amount of Tokens:  ${amountOfTokens}`);
        return parseFloat(amountOfTokens);
      } catch (err) {
        addProductionLog(err.message);
        return null;
      }
    }
  }

  export const myBinance = new ProdInstance();