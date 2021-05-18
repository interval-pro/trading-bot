import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MainPage } from './@pages/main/main.page';

const routes: Routes = [
  {
    path: '',
    component: MainPage,
  },
  { path: '', redirectTo: '', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
