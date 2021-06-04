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
}
