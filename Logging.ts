const fs = require('fs'); 

module.exports = class Logging {
    static readonly runningTime = Date.now();
    static readonly logFilePath = `logs/${Logging.runningTime}.txt`;
    static readonly dirOfLogs = 'logs';
    private static fileOpened = false;


    constructor(){
        if (!fs.existsSync(Logging.dirOfLogs)){
            fs.mkdirSync(Logging.dirOfLogs);
        }
        if(!Logging.fileOpened){
            fs.open(Logging.logFilePath, 'w', function (err:any, file:number) {
                if (err) throw err;
                console.log('Log file Saved!');
            }); 
    
            this.addLine(`The application run on ${this.getTime()}.`);
            Logging.fileOpened = true;
        }
        
    }

    getTime(){
        const time = new Date(Date.now())
        return time.toUTCString();
    }

    addLine(message:string){
        fs.appendFile(Logging.logFilePath, `${this.getTime()} :: ${message}\r\n`, function (err:any) {
            if (err) {
                console.log(`File System ERROR :::: `, err);
            } 
        });
    }
}
