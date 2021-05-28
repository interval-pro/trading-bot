import { Router } from "express";
import { handleAlerts } from '../manager';

export const alert = Router();


const alertsArray = [1,2,3,4,5,6,7,8];
alertsArray.forEach((a: number) => {
    alert.post(`/${a}`, (req, res) => {
        try {
            handleAlerts(a);
            res.send('Success');
        } catch(err) {
            res.send('Fail');
        }
    });
})