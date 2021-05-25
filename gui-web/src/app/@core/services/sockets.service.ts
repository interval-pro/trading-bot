import { Injectable } from '@angular/core';
import { io } from "socket.io-client";
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketService {

    private _socket;

    constructor() {
        const socketURL = environment.socket_APIURL
        this._socket = io(socketURL);
    }

    get socket() {
        return this._socket;
    }
}