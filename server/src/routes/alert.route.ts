import { Router } from "express";
import { handleAlerts } from '../manager/manager';

export const alert = Router();


const alertsArray = ['red15_peak_60', 'green15_bottom_60', 'close15_green_dot', 'close15_red_dot'];
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