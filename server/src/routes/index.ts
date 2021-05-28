import { alert } from './alert.route';

export const configureRoutes = (app: any) => {
    app.use('/alert', alert)
};