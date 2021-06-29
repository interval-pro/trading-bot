import { EventEmitter } from 'events';
import * as WebSocket from "ws";

class PriceSubscriber {
    private pair: string;
    private em: EventEmitter;
    private ws: WebSocket;
    constructor(pair: string) {
        this.pair = pair.toLowerCase();
        this.em = new EventEmitter();
        this.initSubscriber();
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

    timeOutReconnect() {
        setTimeout(() => {
            this.ws.close();
            this.initSubscriber();
            console.log('Reconnected!');
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