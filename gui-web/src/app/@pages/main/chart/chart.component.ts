import { Component, OnInit } from '@angular/core';
@Component({
  selector: 'tv-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss'],
})
export class ChartComponent implements OnInit {
  constructor() {}

  ngOnInit() {
    this.createChart();
  }

  private createChart() {
    const TV = (window as any).TradingView;
    const chart = new TV.widget({
      "height": 500,
      "symbol": "BINANCE:ADAPERP",
      "interval": "15",
      "timezone": "Europe/Moscow",
      "theme": "dark",
      "locale": "en",
      "allow_symbol_change": true,
      "container_id": "chart"
    });
  }
}
