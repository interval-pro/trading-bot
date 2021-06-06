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
  sFb:FormGroup = new FormGroup({});
  alertsFormGroup = new FormGroup({});

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

    this.alertsFormGroup = this.fb.group({
      bbol_long1: [false],
      bbol_long2: [false],
      bbol_long3: [false],
      bbol_long4: [false],
      bbol_short1: [false],
      bbol_short2: [false],
      bbol_short3: [false],
      bbol_short4: [false],
      long1: [null],
      long2: [null],
      long3: [null],
      long4: [null],
      short1: [null],
      short2: [null],
      short3: [null],
      short4: [null],
    });

    this.sFb = this.fb.group({
      strategy: [null, [Validators.required]]
    })
  }

  addBot() {
    const {
      pair, initAmount,
      percentForEachTrade, leverage,
      isSl, isTsl, sl, tslCBRate, tslAct,
    } = this.cbFb.value;

    // const {a1,a2,a3,a4,a5,a6,a7,a8} = this.cbFb.value;
    const { strategy } = this.sFb.value;
    const botConfig: any = { pair, initAmount, percentForEachTrade, leverage};
    botConfig.sl = isSl ? sl : null;
    botConfig.tslCBRate = isTsl ? tslCBRate : null;
    botConfig.tslAct = isTsl ? tslAct : null;
    botConfig.strategy = strategy;
    // botConfig.alerts = this.extractActiveAlerts()
    this.socketService.socket.emit('addNewBot', botConfig);
    this.dialogService.closeAll();
  }

  extractActiveAlerts() {
    const alertsObj: any = {};
    Object.keys(this.alertsFormGroup.value)
      .filter(a => typeof this.alertsFormGroup.value[a] === 'string')
      .forEach(a => alertsObj[a] = this.alertsFormGroup.value[a]);
    return alertsObj;
  }

  extractAlertNameByValue(value: string) {
    return `${value.slice(0, -1)}  ${value.substr(value.length - 1)}`
  }
}
