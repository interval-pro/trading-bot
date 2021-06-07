import { Router } from "express";
import { handleAlerts } from '../manager';

export const alert = Router();


const alertsArray = [
    'green1', 'red1', 'green5', 'red5', 
    'green7', 'red7', 'green15', 'red15', 'green60', 'red60', 
    'YX1', 'YX7' , 'YX15', 'BD1', 'BD7', 'BD15',
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