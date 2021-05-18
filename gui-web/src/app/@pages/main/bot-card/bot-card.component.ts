import { Component } from '@angular/core';

@Component({
  selector: 'bot-card',
  templateUrl: './bot-card.component.html',
  styleUrls: ['./bot-card.component.scss'],
})
export class BotCardComponent {
  private _isExpanded: boolean = false;
  bot: any = {
    id: 2,
    txs: 123,
    pnl: -2,
    pair: 'LTCUSDT'
  }
  constructor() {}

  get isExpanded() {
    return this._isExpanded;
  }

  set isExpanded(value: boolean) {
    this._isExpanded = value
  }

  toggleExapnd() {
    this.isExpanded = !this.isExpanded;
  }
  getLog() {}
  openSettings() {}
  deleteBot() {}
}
