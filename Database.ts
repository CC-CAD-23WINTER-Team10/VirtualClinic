//@ts-ignore
//import mongoose, { Schema } from "mongoose";
const {mongoose, Schema, model} = require('mongoose');

module.exports = class Database {
    constructor(url:string){
        this.connect(url);
        /*
        setTimeout(async()=>{
            console.log( await this.getAllUser());
        },1000)
        

        let a = new this.User();
        a.username = `001`;
        a.password = `001`;
        a.firstName = `Andrew`;
        a.lastName = `Dip`;
        a.email = `001@001.com`;
        a.kind = `physician`; 
        //a.save();
        */
    }

    private readonly userSchema = new Schema({
        firstName: String,
        lastName: String,
        username: {type:String, required: true, unique: true},
        email: String,
        password: {type:String, required: true},
        kind: String,
        lastSocketID: {type:String, default: ``}
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

    async getOneUserAuth(username:string,password:string){
        const user = await this.User.findOne({username:username,password:password}).select(`firstName lastName lastSocketID`);
        return user;
    }


    async updateSocketID(id:string,username:string){
        let user = await this.User.findOne({username:username});
        user.lastSocketID = id;
        user.save();
        //console.log( await this.getAllUser());
    }
}