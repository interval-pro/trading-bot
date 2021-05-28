import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SocketService } from 'src/app/@core/services/sockets.service';

@Component({
  selector: 'new-bot-dialog',
  templateUrl: './new-bot-dialog.component.html',
  styleUrls: ['./new-bot-dialog.component.scss'],
})
export class NewTradingBotDialog implements OnInit {

  constructor(
      private socketService: SocketService,
      private dialogService: MatDialog,
  ) {}

  ngOnInit() {}

  addBot() {
    const botConfig = {
        pair: 'LTCUSDT',
    };
    this.socketService.socket.emit('addNewBot', botConfig);
    this.dialogService.closeAll();
  }
}
