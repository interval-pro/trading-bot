import { NgModule } from '@angular/core';
import { MainPage } from './main/main.page';
  

import { NewTradingBotDialog } from './main/new-bot-dialog/new-bot-dialog.component';
import { BotCardComponent } from './main/bot-card/bot-card.component';

import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card'; 
import { MatIconModule } from '@angular/material/icon'; 
import { MatInputModule } from '@angular/material/input'; 
import { MatCheckboxModule } from '@angular/material/checkbox'; 
import { ChartComponent } from './main/chart/chart.component';
import { MatFormFieldModule } from '@angular/material/form-field';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    MatInputModule,
    MatCheckboxModule,
    MatFormFieldModule,
    FormsModule,
  ],
  declarations: [
    MainPage,
    BotCardComponent,
    NewTradingBotDialog,
    ChartComponent,
  ],
  providers: [],
})
export class PagesModule { }
