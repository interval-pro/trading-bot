import { Router } from "express";
import { handleAlerts } from '../manager/manager';

export const alert = Router();


const alertsArray = [
    'red1_peak_60',
    'green1_bottom_60'
];
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