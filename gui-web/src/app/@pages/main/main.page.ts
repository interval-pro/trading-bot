import { Component, OnInit } from '@angular/core';
import { BotsService } from 'src/app/@core/services/bots.service';

@Component({
  selector: 'main-page',
  templateUrl: './main.page.html',
  styleUrls: ['./main.page.scss'],
})
export class MainPage implements OnInit {
  public bots: any[] = [];

  constructor(
    private botsService: BotsService,
  ) {}

  ngOnInit() {
    this._subscribeToBotsList()
  }

  private _subscribeToBotsList() {
    this.botsService.$botsList.subscribe((botsList) => {
      console.log(botsList);
      this.bots = botsList;
    });
  }
  
  addNew() {
  }
}
