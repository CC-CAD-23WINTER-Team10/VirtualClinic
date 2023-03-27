export enum Status {
    Available = `greenyellow`,
    Leave = `yellow`,
    Busy = `red`,
    Offline = `grey`
}

/**
 * An Interface identical to the database User model
 */
export interface User {
    _id: string;
    lastSocketID: string;
    img: string;
    firstName: string;
    lastName: string;
    status: Status;
    title: string;
    department: string;
}


/**
 * Add one property to the div element, so that it can be found
 * when the info in that div need to be updated(like Detail section, Video previews).
 */
export interface myDiv extends HTMLDivElement {
    my_relation: string;
}