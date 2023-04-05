//@ts-ignore
const {mongoose, Schema, model} = require('mongoose');
const Logging = require(`./Logging.js`);



module.exports = class Database {

    url:string = ``;
    logfile:any;
    /**
     * Connect to the database when this instance is created
     * @param url MongoDB url
     */
    constructor(url: string,logging:any) {

        this.url = url;
        this.logfile = logging;

    }

    //User Schema
    private readonly userSchema = new Schema({
        firstName: String,
        lastName: String,
        username: {type:String, required: true, unique: true},
        email: String,
        password: {type:String, required: true},
        kind: String,
        lastSocketID: {type:String, default: ``},
        img: {type:String, default: ``},
        title: String,
        department: String
    });
    
    //User Model(Table)
    User = model('User', this.userSchema);

    /**
     * Connect to the MongoDB
     * 
     */
    async connect(){
        try{
           
            console.log(`DB Connecting......`);
            this.logfile.addLine(`DB Connecting......`);
            //await mongoose.connect(`mongodb://mongo1:27017/virtual-clinic`);
            //await mongoose.connect(`mongodb://127.0.0.1:27017/virtual-clinic`);
            await mongoose.connect(this.url);
            console.log(`DB Connection OK`);
            this.logfile.addLine(`DB Connection OK`);

            console.log(`CHECKING USER INFO IN DATABASE`);
            this.logfile.addLine(`CHECKING USER INFO IN DATABASE`);
            //Add demo users
            let userAmount = (await this.getAllUser() as Array<Object>).length;
            if (userAmount < 1) {
                let a = new this.User();
                a.username = `001`;
                a.password = `001`;
                a.firstName = `Andrew`;
                a.lastName = `Dip`;
                a.email = `001@001.com`;
                a.kind = `physician`;
                a.img = `pexels-yuri-manei-3211476.jpg`;
                a.title = `Dotor`;
                a.department = `Emergency Room`;
                a.save();

                let b = new this.User();
                b.username = `002`;
                b.password = `002`;
                b.firstName = `Anderson`;
                b.lastName = `Delfino`;
                b.email = `002@002.com`;
                b.kind = `physician`;
                b.img = `pexels-yuri-manei-3190334.jpg`;
                b.title = `Nurse`;
                b.department = `Emergency Room`;
                b.save();

                let c = new this.User();
                c.username = `003`;
                c.password = `003`;
                c.firstName = `David`;
                c.lastName = `Smith`;
                c.email = `003@003.com`;
                c.kind = `patient`;
                c.img = `pexels-teodora-popa-photographer-15502152.jpg`;
                c.save();

                let d = new this.User();
                d.username = `004`;
                d.password = `004`;
                d.firstName = `May`;
                d.lastName = `Smith`;
                d.email = `004@004.com`;
                d.kind = `patient`;
                d.img = `pexels-sound-on-3394658.jpg`;
                d.save();


                console.log(`DEMO USERS ARE ADDED`);
                this.logfile.addLine(`EMO USERS ARE ADDED`);
            }

            console.log(`FINISHED CHECKING USER INFO IN DATABASE`);
            this.logfile.addLine(`FINISHED CHECKING USER INFO IN DATABASE`);
        } catch(err) { 
            console.log(`DB ERROR:`);
            console.log(err); 

            this.logfile.addLine(`DB ERROR -- ${err}`);
        }
    }

    /**
     * Retreive all users with their first name, last name, and the last socket ID.
     * @returns 
     */
    async getAllUser(){
        const users = await this.User.find({}).select(`firstName lastName lastSocketID`);
        return users;
    }

    /**
     * To check if the given username and password match any user in the database
     * If it matches, return ture
     * If not, return false
     * @param username 
     * @param password 
     * @returns 
     */
    async getAuth(username:string,password:string){
        if (!username && !password){
            return false;
        }
        const user = await this.User.findOne({username:username,password:password});
        if (user) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Retrieve a user with javascript object notation by username
     * @param username 
     * @returns A User Object 
     */
    async getOneUser(username:string){
        const user = await this.User.findOne({username:username}).select(`firstName lastName lastSocketID kind img title department`);
        if(user){
            return user.toObject();
        }else{
            return null;
        }
        
    }

    async getOneUserByID(_id:any){
        const user = await this.User.findOne({_id:_id}).select(`firstName lastName lastSocketID kind img title department`);
        if(user){
            return user.toObject();
        }else{
            return null;
        }
    }
    /**
     * Retrieve a user with javascript object notation by socket ID
     * @param id 
     * @returns A User Object 
     */
    async getOneUserBySocket(id:string){
        const user = await this.User.findOne({lastSocketID:id}).select(`firstName lastName lastSocketID kind img title department`);
        if(user){
            return user.toObject();
        }else{
            return null;
        }
    }

    /**
     * Check if a user is a physician by username. 
     * If yes, return true. Ortherwise, return false.
     * @param username 
     * @returns 
     */
    async isPhysician(username:string){
        const user = await this.User.findOne({username:username}).select(`kind`);
        if(user.kind == `physician`){
            return true;
        }else{
            return false;
        }
    }

    /**
     * Update the user's the last socket ID
     * @param socketID New Socket ID
     * @param username 
     */
    async updateSocketID(socketID:string,username:string){
        let user = await this.User.findOne({username:username});
        if(user){
            user.lastSocketID = socketID;
            await user.save();
        } else {
            this.logfile.addLine(`ATTEMPT TO UPDATE SOCKET ID IN DATABASE FAILED WITH USERNAME:${username}`)
            console.log(`ATTEMPT TO UPDATE SOCKET ID IN DATABASE FAILED WITH USERNAME:${username}`)
        }
        
        
    }
}
