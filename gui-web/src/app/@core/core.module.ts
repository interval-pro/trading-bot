import { NgModule } from '@angular/core';
import { ApiModule } from './api/api.module';
import { ServicesModule } from './services/services.module';

@NgModule({
  imports: [
    ApiModule,
    ServicesModule,
  ],
  declarations: [],
  providers: [],
})
export class CoreModule { }
