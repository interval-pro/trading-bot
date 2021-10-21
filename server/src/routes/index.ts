import { alert } from './alert.route';
import { log } from './log.route';

export const configureRoutes = (app: any) => {
    app.use('/alert', alert)
    app.use('/log', log);
};