var _a;
const fs = require('fs');
module.exports = (_a = class Logging {
        constructor() {
            this.logFilePath = `logs/${Logging.runningTime}.txt`;
            this.dirOfLogs = 'logs';
            if (!fs.existsSync(this.dirOfLogs)) {
                fs.mkdirSync(this.dirOfLogs);
            }
            fs.open(this.logFilePath, 'w', function (err, file) {
                if (err)
                    throw err;
                console.log('Log file Saved!');
            });
            this.addLine(`The application run on ${this.getTime()}.`);
        }
        getTime() {
            const time = new Date(Date.now());
            return time.toUTCString();
        }
        addLine(message) {
            fs.appendFile(this.logFilePath, `${this.getTime()} :: ${message}\r\n`, function (err) {
                if (err) {
                    console.log(`File System ERROR :::: `, err);
                }
            });
        }
    },
    _a.runningTime = Date.now(),
    _a);
//# sourceMappingURL=Logging.js.map