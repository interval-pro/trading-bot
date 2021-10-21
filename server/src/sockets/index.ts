import { myBotManager } from '../manager/manager';
import { IBotConfig  } from '../manager/bot';
import { socket as mainSocket } from '../index';

export const handleSocketConnection = (socket: any) => {
    console.log(`New Connection: ${socket.id}`);
    socket.emit('botsList', myBotManager.allBots)

    socket.on('addNewBot', (botConfig: IBotConfig) => {
      myBotManager.addBot(botConfig, () => {
        mainSocket.emit('botsList', myBotManager.allBots);
      });
    });

    socket.on('removeBot', (id: number) => {
      myBotManager.removeBot(id, () => {
        mainSocket.emit('botsList', myBotManager.allBots);
      });
    });
}
