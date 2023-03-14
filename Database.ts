//@ts-ignore
//import mongoose, { Schema } from "mongoose";
const {mongoose, Schema, model} = require('mongoose');



module.exports = class Database {
    constructor(url: string) {
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
                console.log(`DEMO USERS ARE ADDED`);
            }

            console.log(`FINISHED CHECKING USER INFO IN DATABASE`);
        }, 1000)

    }

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
    },{
        virtuals: {
            fullName: {
                get() {
                    return this.firstName + ' ' + this.lastName;
                }
            }
        }
    });

    User = model('User', this.userSchema);

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

    async getAllUser(){
        const users = await this.User.find({}).select(`firstName lastName lastSocketID`);
        return users;
    }

    async getAuth(username:string,password:string){
        const user = await this.User.findOne({username:username,password:password});
        if (user) {
            return true;
        } else {
            return false;
        }
    }

    async getOneUser(username:string){
        const user = await this.User.findOne({username:username}).select(`firstName lastName lastSocketID kind img title department`);
        return user.toObject();
    }

    async isPhysician(username:string){
        const user = await this.User.findOne({username:username}).select(`kind`);
        if(user.kind == `physician`){
            return true;
        }else{
            return false;
        }
    }


    async updateSocketID(id:string,username:string){
        let user = await this.User.findOne({username:username});
        user.lastSocketID = id;
        await user.save();
        //console.log(user);
    }
}
