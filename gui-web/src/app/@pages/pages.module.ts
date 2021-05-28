import { NgModule } from '@angular/core';
import { MainPage } from './main/main.page';
  



import { MatCardModule } from '@angular/material/card'; 
import { MatIconModule } from '@angular/material/icon'; 
import { BotCardComponent } from './main/bot-card/bot-card.component';
import { CommonModule } from '@angular/common';
import { NewTradingBotDialog } from './main/new-bot-dialog/new-bot-dialog.component';


import {MatButtonModule} from '@angular/material/button'; 
@NgModule({
  imports: [
    MatIconModule,
    CommonModule,
    MatCardModule,
    MatButtonModule,
  ],
  declarations: [
    MainPage,
    BotCardComponent,
    NewTradingBotDialog,
  ],
  providers: [],
})
export class PagesModule { }
