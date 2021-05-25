import { Component, Input } from '@angular/core';

@Component({
  selector: 'bot-card',
  templateUrl: './bot-card.component.html',
  styleUrls: ['./bot-card.component.scss'],
})
export class BotCardComponent {
  @Input('bot') bot: any;

  private _isExpanded: boolean = false;
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
