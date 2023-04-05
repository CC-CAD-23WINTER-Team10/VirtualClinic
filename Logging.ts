const fs = require('fs'); 

module.exports = class Logging {
    static readonly runningTime = Date.now();
    readonly logFilePath = `logs/${Logging.runningTime}.txt`;
    readonly dirOfLogs = 'logs';


    constructor(){
        if (!fs.existsSync(this.dirOfLogs)){
            fs.mkdirSync(this.dirOfLogs);
        }

        fs.open(this.logFilePath, 'w', function (err:any, file:number) {
            if (err) throw err;
            console.log('Log file Saved!');
        }); 

        this.addLine(`The application run on ${this.getTime()}.`);
    }

    getTime(){
        const time = new Date(Date.now())
        return time.toUTCString();
    }

    addLine(message:string){
        fs.appendFile(this.logFilePath, `${this.getTime()} :: ${message}\r\n`, function (err:any) {
            if (err) {
                console.log(`File System ERROR :::: `, err);
            } 
        });
    }
}
