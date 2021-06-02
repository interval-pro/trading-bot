import { Component, Input } from '@angular/core';
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
    var myjson = JSON.stringify(this.bot.log, null, 2);
    var x = window.open() as any;
    x.document.open();
    x.document.write('<html><body><pre>' + myjson + '</pre></body></html>');
    x.document.close();
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
