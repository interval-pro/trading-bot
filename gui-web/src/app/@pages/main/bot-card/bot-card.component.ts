import { Component, Input } from '@angular/core';
import { BotsService } from 'src/app/@core/services/bots.service';
import { SocketService } from 'src/app/@core/services/sockets.service';

@Component({
  selector: 'bot-card',
  templateUrl: './bot-card.component.html',
  styleUrls: ['./bot-card.component.scss'],
})
export class BotCardComponent {
  @Input('bot') bot: any;

  defaultTxConainerHeight: string = '12rem'
  private _isExpanded: boolean = false;
  constructor(
    private socketService: SocketService,
    private botsService: BotsService,
  ) {}

  get isExpanded() {
    return this._isExpanded;
  }

  set isExpanded(value: boolean) {
    this._isExpanded = value
  }

  get allTransactions() {
    return this.bot.log.filter((l: any) => l.positionType);
  }

  getAllTxsAmount(win: boolean) {
    const amount = this.allTransactions
      .filter((t: any) => t.win === win)
      .map((e: any) => parseFloat(e.pnlAmount.toFixed(6)))
      .reduce((prev: number, curr: number) => prev + curr, 0);
    return amount ? amount.toFixed(2) : '0.00';
  }

  getSumPercentage(win: boolean) {
    const winsAmount = parseFloat(this.getAllTxsAmount(true));
    const lossesAmount = Math.abs(parseFloat(this.getAllTxsAmount(false)));
    const total = winsAmount + lossesAmount;
    const percent = win
      ? (100 * winsAmount) / total
      : (100 * lossesAmount) / total;
    return  percent ? percent.toFixed(2) : '0.00';
  }

  
  getPercentage(win: boolean) {
    const allTxsLength = this.allTransactions.length;
    const winOrLossTxsLength = this.allTransactions.filter((t: any) => t.win === win).length;
    const percent = (100 * winOrLossTxsLength) / allTxsLength;
    return percent ? percent.toFixed(2) : '0.00';
  }

  toggleExapnd() {
    this.isExpanded = !this.isExpanded;
  }
  
  getLog(e: any) {
    e.stopImmediatePropagation();
    const url = this.botsService.logUrl;
    window.open(url + this.bot.id, "_blank");
  }

  openSettings(e: any) {
    e.stopImmediatePropagation();

  }

  deleteBot(id: number) {
    this.socketService.socket.emit('removeBot', id);
  }

  numberToString(length: number, value: number) {
    return value.toFixed(length)
  }

  getWinLoss(isGetWin: boolean) {
    return isGetWin
      ? this.allTransactions.filter((l: any) => l.win === true).length
      : this.allTransactions.filter((l: any) => l.win === false).length
  }
}
