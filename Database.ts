//@ts-ignore
const {mongoose, Schema, model} = require('mongoose');



module.exports = class Database {

    /**
     * Connect to the database when this instance is created
     * @param url MongoDB url
     */
    constructor(url: string) {
        //connect to database
        this.connect(url);

        //Add demo users
        setTimeout(async () => {
            //console.log(await this.getAllUser());
            console.log(`CHECKING USER INFO IN DATABASE`);
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
            }

            console.log(`FINISHED CHECKING USER INFO IN DATABASE`);
        }, 1000)

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
     * @param url MongoDB url
     */
    async connect(url:string){
        try{
            console.log(`DB Connecting...`);
            //await mongoose.connect(`mongodb://mongo1:27017/virtual-clinic`);
            //await mongoose.connect(`mongodb://127.0.0.1:27017/virtual-clinic`);
            await mongoose.connect(url);
            console.log(`DB Connection OK`);
        } catch(err) { 
            console.log(`DB ERROR:`);
            console.log(err); 
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
        return user.toObject();
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
     * @param id New Socket ID
     * @param username 
     */
    async updateSocketID(id:string,username:string){
        let user = await this.User.findOne({username:username});
        user.lastSocketID = id;
        await user.save();
        //console.log(user);
    }
}
