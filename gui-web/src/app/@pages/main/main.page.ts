import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BotsService } from 'src/app/@core/services/bots.service';
import { NewTradingBotDialog } from './new-bot-dialog/new-bot-dialog.component';

@Component({
  selector: 'main-page',
  templateUrl: './main.page.html',
  styleUrls: ['./main.page.scss'],
})
export class MainPage implements OnInit {
  public bots: any[] = [];

  constructor(
    private botsService: BotsService,
    private dialogService: MatDialog,
  ) {}

  ngOnInit() {
    this._subscribeToBotsList()
  }

  private _subscribeToBotsList() {
    this.botsService.$botsList.subscribe((botsList) => {
      this.bots = botsList;
    });
  }
  
  addNew() {
    this.dialogService.open(NewTradingBotDialog)
  }
}
