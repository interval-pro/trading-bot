import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { SocketService } from 'src/app/@core/services/sockets.service';

@Component({
  selector: 'new-bot-dialog',
  templateUrl: './new-bot-dialog.component.html',
  styleUrls: ['./new-bot-dialog.component.scss'],
})
export class NewTradingBotDialog implements OnInit {

  cbFb: FormGroup = new FormGroup({});
  constructor(
      private socketService: SocketService,
      private dialogService: MatDialog,
      private fb: FormBuilder,
  ) {}

  ngOnInit() {
    this._buildForms();
  }

  private _buildForms() {
    this.cbFb = this.fb.group({
      pair: [null, [Validators.required]],
      initAmount: [100, [Validators.required, Validators.min(10)]],
      percentForEachTrade: [0.1, [Validators.required, Validators.min(0), Validators.max(1)]],
      leverage: [5, [Validators.required, Validators.min(2), Validators.max(50)]],
      isSl: [false],
      isTsl: [false],
      sl: [0.01],
      tsl: [0.01]
    })
  }

  addBot() {
    const {
      pair, initAmount,
      percentForEachTrade, leverage,
      isSl, isTsl, sl, tsl,
    } = this.cbFb.value;
    const botConfig: any = { pair, initAmount, percentForEachTrade, leverage};
    botConfig.sl = isSl ? sl : null;
    botConfig.tsl = isTsl ? tsl : null;
    console.log({botConfig})
    this.socketService.socket.emit('addNewBot', botConfig);
    this.dialogService.closeAll();
  }
}
