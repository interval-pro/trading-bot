import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { SocketService } from "./sockets.service";
import { environment } from '../../../environments/environment';

export interface IBot {
    id: number,
    txs: number,
    pnl: number,
    pair: string,
}

@Injectable({ providedIn: 'root' })
export class BotsService {
    private _botsList: IBot[] = [];
    public $botsList: BehaviorSubject<IBot[]> = new BehaviorSubject(this._botsList);
    constructor(
        private socketServic: SocketService,
    ) {}

    get socket() {
        return this.socketServic.socket;
    }

    get botsList() {
        return this._botsList;
    }

    set botsList(value: IBot[]) {
        this._botsList = value;
        this.$botsList.next(value);
    }

    get logUrl() {
        return environment.API_URL + '/log/'
    }

    initBotListSubscription() {
        this.socket.on('botsList', (botsList: IBot[]) => {
            this.botsList = botsList;
        });
    }
}