const botsList = [
    {
        id: 1,
        txs: 23,
        pnl: 12,
        pair: 'LTCUSDT'
      },
      {
        id: 2,
        txs: 12,
        pnl: -62,
        pair: 'LTCUSDT'
      },
];


const botsList2 = [
    {
        id: 1,
        txs: 23,
        pnl: 12,
        pair: 'LTCUSDT'
      },
      {
        id: 2,
        txs: 12,
        pnl: -62,
        pair: 'LTCUSDT'
      },
      {
        id: 2,
        txs: 12,
        pnl: -62,
        pair: 'LTCUSDT'
      },
];

export const handleSocketConnection = (socket: any) => {
    console.log(`New Connection: ${socket.id}`);

    setInterval(() => {
        const list = Math.random() < 0.5 ? botsList : botsList2;
        socket.emit('botsList', list)
    }, 2000)
}
