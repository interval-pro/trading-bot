import { Router } from "express";
import { handleAlerts } from '../manager';

export const alert = Router();


const alertsArray = [ 'long1', 'long2', 'long3', 'long4', 'short1', 'short2', 'short3', 'short4'];
alertsArray.forEach((a: string) => {
    alert.post(`/${a}`, (req, res) => {
        try {
            handleAlerts(a);
            res.send('Success');
        } catch(err) {
            res.send('Fail');
        }
    });
})