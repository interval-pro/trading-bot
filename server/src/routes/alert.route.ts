import { Router } from "express";
import { handleAlerts } from '../manager';

export const alert = Router();


const alertsArray = [ 'green1', 'red1', 'green3', 'red3', 'green5', 'red5', 'green7', 'red7'];
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