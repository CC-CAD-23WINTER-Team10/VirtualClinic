export enum Status {
    Available = `greenyellow`,
    Leave = `yellow`,
    Busy = `red`,
    Offline = `grey`
}


export class User {
    _id: string;
    lastSocketID: string;
    img: string;
    firstName: string;
    lastName: string;
    status: Status;
    name: string;
    title: string;
    department: string;
    constructor(id: string, img: string, firstName: string, lastName: string, title: string, status: Status) {
        this.lastSocketID = id;
        this.img = img;
        this.firstName = firstName;
        this.lastName = lastName;
        this.title = title;
        this.status = status;
        this.name = this.firstName + ` ` + this.lastName;
    }
}



export interface myDiv extends HTMLDivElement {
    my_relation: string;
}