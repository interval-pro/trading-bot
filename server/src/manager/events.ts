import { EventEmitter } from 'events';
import * as WebSocket from "ws";

class PriceSubscriber {
    private pair: string;
    private em: EventEmitter;
    private ws: WebSocket;
    private ws2: WebSocket;

    constructor(pair: string) {
        this.pair = pair.toLowerCase();
        this.em = new EventEmitter();
        this.initSubscriber();
        this.initTradesSubscriber();
    }

    get eventEmmiter() {
        return this.em;
    }

    initSubscriber() {
        const url = `wss://stream.binance.com:9443/ws/${this.pair}@ticker`;
        this.ws = new WebSocket(url);
        this.ws.onmessage = (message: any) => {
            try {
              const data = message.data;
              const json = JSON.parse(data);
              const filteredData = this.filterData(json)
              this.em.emit('priceSubs', filteredData);
            } catch (error) {
              console.log(error.message);
            }
          }
          this.timeOutReconnect();
    }

    initTradesSubscriber() {
        const url = `wss://stream.binance.com:9443/ws/${this.pair}@trade`;
        this.ws2 = new WebSocket(url);
        this.ws2.onmessage = (message: any) => {
            try {
              const data = message.data;
              const json = JSON.parse(data);
              if (parseFloat(json['q']) > 10000) {
                  console.log({json});
              }
              this.em.emit('trades', json);
            } catch (error) {
              console.log(error.message);
            }
          }
          this.timeOutReconnect2();
    }

    timeOutReconnect() {
        setTimeout(() => {
            this.ws.close();
            this.initSubscriber();
            console.log('Reconnected!');
        }, 3600000)
    };

    timeOutReconnect2() {
        setTimeout(() => {
            this.ws2.close();
            this.initTradesSubscriber();
            console.log('Trade Subs Reconnected!');
        }, 3600000)
    };

    filterData(data: any) {
        const { E, s, c } = data
        const filteredData = {
            time: E,
            pair: s,
            lastPrice: c,
        }
        return filteredData;
    }
}

export const adaSubs = new PriceSubscriber('ADAUSDT');