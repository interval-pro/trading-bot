import { Router } from "express";
import { handleAlerts } from '../manager/manager';

export const alert = Router();


const alertsArray = ['BYD7', 'BRC7', 'SDSO30', 'BRC30'];
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