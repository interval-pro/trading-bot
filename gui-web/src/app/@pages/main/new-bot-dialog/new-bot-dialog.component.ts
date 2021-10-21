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
  sFb: FormGroup = new FormGroup({});
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
      pair: ['ADAUSDT', [Validators.required]],
      initAmount: [200, [Validators.required, Validators.min(10)]],
      percentForEachTrade: [0.6, [Validators.required, Validators.min(0), Validators.max(1)]],
      leverage: [10, [Validators.required, Validators.min(2), Validators.max(50)]],
    });
    this.sFb = this.fb.group({
      strategy: [null, [Validators.required]]
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
    const { pair, initAmount, percentForEachTrade, leverage } = this.cbFb.value;
    const botConfig: any = { pair, initAmount, percentForEachTrade, leverage };
    const { strategy } = this.sFb.value;
    botConfig.strategy = strategy;
    const { sl, tp } = this.sltpFB.value;
    botConfig.sltp = { sl: sl || null, tp: tp || null };
    botConfig.histData = this.histFileData || null;
    this.socketService.socket.emit('addNewBot', botConfig);
    this.dialogService.closeAll();
  }

  extractAlertNameByValue(value: string) {
    return `${value.slice(0, -1)}  ${value.substr(value.length - 1)}`
  }
}
