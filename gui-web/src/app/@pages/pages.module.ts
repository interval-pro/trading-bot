import { NgModule } from '@angular/core';
import { MainPage } from './main/main.page';
  


import { MatIconModule } from '@angular/material/icon'; 
import { BotCardComponent } from './main/bot-card/bot-card.component';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [
    MatIconModule,
    CommonModule
  ],
  declarations: [
    MainPage,
    BotCardComponent,
  ],
  providers: [],
})
export class PagesModule { }
