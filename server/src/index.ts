import * as express from "express";
import * as cors from 'cors';

import * as Rotues from './routes';
import { envConfig } from './config';
import { Server } from 'socket.io';
import { handleSocketConnection } from './sockets';
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser({ limit: '50mb' }))
app.use(bodyParser.json())
Rotues.configureRoutes(app);

const SERVER_PORT = envConfig.PORT;
const listernCB = () => console.log(`Server Started on port ${SERVER_PORT}`);

export const socket = new Server(3004, {
   cors: {
        origin: "*",
        methods: ['GET', "POST"],
    }
});

socket.on('connection', handleSocketConnection)

app.listen(SERVER_PORT, listernCB);