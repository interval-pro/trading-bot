import { alert } from './alert.route';
import { log } from './log.route';
import { bot } from './bot.route';

export const configureRoutes = (app: any) => {
    app.use('/alert', alert)
    app.use('/log', log);
    app.use('/bot', bot);
};