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
      tsl: [0.01],
      tslAct: [0.01],
      tslCBRate: [0.01],
      a1: [false],
      a2: [false],
      a3: [false],
      a4: [false],
      a5: [false],
      a6: [false],
      a7: [false],
      a8: [false],
    });

  }

  addBot() {
    const {
      pair, initAmount,
      percentForEachTrade, leverage,
      isSl, isTsl, sl, tslCBRate, tslAct,
    } = this.cbFb.value;

    const {a1,a2,a3,a4,a5,a6,a7,a8} = this.cbFb.value;

    const botConfig: any = { pair, initAmount, percentForEachTrade, leverage};
    botConfig.sl = isSl ? sl : null;
    botConfig.tslCBRate = isTsl ? tslCBRate : null;
    botConfig.tslAct = isTsl ? tslAct : null;
    botConfig.alerts = {a1,a2,a3,a4,a5,a6,a7,a8};
    console.log({botConfig})
    this.socketService.socket.emit('addNewBot', botConfig);
    this.dialogService.closeAll();
  }
}
