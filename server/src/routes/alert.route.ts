import { Router } from "express";
import { handleAlerts } from '../manager/manager';

export const alert = Router();


const alertsArray = [
    'BYD7', 
    'BRC7', 
    'SDSO30', 
    'BRC30', 
    '10-3-long-buy', 
    '10-3-long-sell',
    'YX1',
    'BD1',
    'green1close',
    'red1close',
    'green1open',
    'red1open',
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