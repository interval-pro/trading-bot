import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ApiModule } from './api/api.module';
import { ServicesModule } from './services/services.module';

@NgModule({
  imports: [
    ApiModule,
    ServicesModule,
    HttpClientModule,
  ],
  declarations: [],
  providers: [],
})
export class CoreModule { }
