import { myBotManager, IBot } from '../manager';

var id = 0;
const getId = () => {
  id += 1;
  return id;
};

export class Bot implements IBot {
  id: number;
  pair: string;
  pnl: number = 0;
  txs: number = 0;

  constructor(botConfig: any) {
    const { pair } = botConfig;
    this.pair = pair;
    this.id = getId();
  }
}

export const handleSocketConnection = (socket: any) => {
    console.log(`New Connection: ${socket.id}`);
    socket.emit('botsList', myBotManager.allBots)

    socket.on('addNewBot', (botConfig: any) => {
      const newBot = new Bot(botConfig)
      myBotManager.addBot(newBot, () => {
        socket.emit('botsList', myBotManager.allBots);
      })
    })

    socket.on('removeBot', (id: number) => {
      myBotManager.removeBot(id, () => {
        socket.emit('botsList', myBotManager.allBots);
      })
    })
}
