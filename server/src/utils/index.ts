import * as moment from 'moment';
import * as fs from 'fs';

export const getDate = () => moment().utcOffset(3).format('DD/MM/YYYY hh:mm:ss A');

export const localLog = [];

export const addLog= (name: string, data: LogData) => {
    const stringData = JSON.stringify(data, null, 4);
    fs.appendFile(`${name}.bot.log`, stringData + '\n', (err) => {
        if (err) throw err;
        console.log(stringData)
    });
}

export const LogType = {
    INFO: "Info",
    SUCCESS: "Success",
    ERROR: "Error",
    WARNING: "Warning",
};

export class LogData {
    type: string = null;
    log: string = null;
    data: any = null;
    time: string = getDate();
    
    constructor(type: string, log: string, data: any = {}) {
        this.type = type;
        this.log = log;
        this.data = data;
    }

    public save(name: string) {
        const that = {...this};
        delete that.data;
        const obj = { ...that, ...this.data};
        addLog(name, obj)
        return obj;
    }
}