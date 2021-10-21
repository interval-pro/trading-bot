import { getDate } from '../utils'

export type PositionType = "SHORT" | "LONG";

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
    slClose: boolean = false;
    constructor(
      positionType: PositionType,
      amount: number,
      price: number,
      equity: number,
      leverage: number,
      time: string | undefined = undefined,
    ) {
      this.positionType = positionType;
  
      this.openAt = getDate(time);
      this.openPrice = price;
      this.openAmount = amount;
      this.openEquity = equity;
  
      this.leverage = leverage;
      this.positionAmount = amount * leverage;
      this.tokens = this.positionAmount / price;
      this.borrowAmount = this.positionAmount - amount;
    }
  
    close(price: number, time: string = undefined, slClose: boolean = false) {
      const isLong = this.positionType === 'LONG';
      this.closedAt = getDate(time);
      this.closePrice = price;
      this.closeAmount = isLong
          ? ((this.tokens * price) - this.positionAmount) + this.openAmount
          : (this.positionAmount - (this.tokens * price)) + this.openAmount;
  
      this.pnlRatio = this.closeAmount / this.openAmount;
      this.pnlAmount = this.closeAmount - this.openAmount;
  
      this.win = this.pnlAmount > 0;
      this.closeEquity = this.openEquity + this.pnlAmount;
      if (slClose) this.slClose = slClose;
    }
  }