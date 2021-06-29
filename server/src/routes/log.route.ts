import { Router } from "express";
import { getBotLogById } from '../manager/manager'
export const log = Router();

export const addLogRoute = (id: number) => {
    log.get(`/${id}`, (req, res) => {
        const log = getBotLogById(id);
        res.send(log);
    })
}