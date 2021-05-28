import { myBotManager, IBotConfig } from '../manager';

export const handleSocketConnection = (socket: any) => {
    console.log(`New Connection: ${socket.id}`);
    socket.emit('botsList', myBotManager.allBots)

    socket.on('addNewBot', (botConfig: IBotConfig) => {
      myBotManager.addBot(botConfig, () => {
        socket.emit('botsList', myBotManager.allBots);
      })
    })

    socket.on('removeBot', (id: number) => {
      myBotManager.removeBot(id, () => {
        socket.emit('botsList', myBotManager.allBots);
      })
    })
}
