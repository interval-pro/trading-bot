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

  alerts: any = {
    long: ['long1', 'long2', 'long3', 'long4'],
    short: ['short1', 'short2', 'short3', 'short4']
  };

  cbFb: FormGroup = new FormGroup({});
  sFb: FormGroup = new FormGroup({});
  yxbdFb: FormGroup = new FormGroup({});
  sltpFB: FormGroup = new FormGroup({});

  histFileData: any = null;
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
      tslCBRate: [0.01]
    });
    this.sFb = this.fb.group({
      strategy: [null, [Validators.required]]
    });

    this.yxbdFb = this.fb.group({
      yx: [false],
      yxAction: ['openShort'],
      yxTimeout: [3, [Validators.min(1), Validators.max(10)]],
      bd: [false],
      bdAction: ['openShort'],
      bdTimeout: [3, [Validators.min(1), Validators.max(10)]],
    });

    this.sltpFB = this.fb.group({
      sl: [0.01, [Validators.min(0), Validators.max(0.1)]],
      tp: [0.01, [Validators.min(0), Validators.max(0.1)]],
    })
  }

  handleFileInputChange(event: any) {
    const file = event.target.files[0];
    let fileReader = new FileReader();
    fileReader.onload = () => {
      this.histFileData = fileReader.result;
    }
    fileReader.readAsText(file);
  }

  addBot() {
    const {
      pair, initAmount,
      percentForEachTrade, leverage,
      isSl, isTsl, tslCBRate, tslAct,
    } = this.cbFb.value;

    const { strategy } = this.sFb.value;
    const botConfig: any = { pair, initAmount, percentForEachTrade, leverage};
    botConfig.tslCBRate = isTsl ? tslCBRate : null;
    botConfig.tslAct = isTsl ? tslAct : null;
    botConfig.strategy = strategy;

    const { yx, yxAction, yxTimeout, bd, bdAction, bdTimeout } = this.yxbdFb.value;

    // botConfig.yxbd = {
    //   yx: !yx ? null : (yxAction === 'timeout' && yxTimeout) ? `timeout_${yxTimeout}` : yxAction,
    //   bd: !bd ? null : (bdAction === 'timeout' && bdTimeout) ? `timeout_${bdTimeout}` : bdAction,
    // };

    botConfig.yxbd = {
      yx: !!yx,
      bd: !!bd,
    };

    const { sl, tp } = this.sltpFB.value;
    botConfig.sltp = {
      sl: sl || null,
      tp: tp || null,
    };
    botConfig.histData = this.histFileData || null;
    console.log(botConfig);
    this.socketService.socket.emit('addNewBot', botConfig);
    this.dialogService.closeAll();
  }

  extractAlertNameByValue(value: string) {
    return `${value.slice(0, -1)}  ${value.substr(value.length - 1)}`
  }
}
