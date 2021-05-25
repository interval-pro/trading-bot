import { Component } from '@angular/core';
import { BotsService } from './@core/services/bots.service';

@Component({
  selector: 'tb-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(
    private botsService: BotsService,
  ) {
    this.botsService.initBotListSubscription();
  }
}
