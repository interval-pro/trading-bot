import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { CoreModule } from './@core/core.module';
import { PagesModule } from './@pages/pages.module';
import { SharedModule } from './@shared/shared.modules';

const NG_MODULES = [
  BrowserModule,
  AppRoutingModule,
];

const CUSTOM_MODULES = [
  CoreModule,
  PagesModule,
  SharedModule,
];

const imports = [
  ...NG_MODULES,
  ...CUSTOM_MODULES,
];

const declarations = [
  AppComponent
];

const bootstrap = [AppComponent];
@NgModule({ declarations, imports, bootstrap})
export class AppModule { }
