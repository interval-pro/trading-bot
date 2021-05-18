import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { CoreModule } from './@core/core.module';
import { PagesModule } from './@pages/pages.module';
import { SharedModule } from './@shared/shared.modules';

import {MatCardModule} from '@angular/material/card'; 

const NG_MODULES = [
  BrowserModule,
  AppRoutingModule,
  BrowserAnimationsModule,
];

const CUSTOM_MODULES = [
  CoreModule,
  PagesModule,
  SharedModule,
];

const MATERIAL_MODULES = [
  MatCardModule,
];

const imports = [
  ...NG_MODULES,
  ...CUSTOM_MODULES,
  ...MATERIAL_MODULES,
];

const declarations = [
  AppComponent
];

const bootstrap = [AppComponent];
@NgModule({ declarations, imports, bootstrap})
export class AppModule { }
