//@ts-ignore
const Logging = require(`./Logging.js`);
const logging = new Logging();


function log(message: string) {
    logging.addLine(`Negotiation Manager -- ${message}`);
}

function logError(message: string) {
    logging.addLine(`Negotiation Manager ERROR -- ${message}`);
}

type NegoState = "new" | "have offer" | "have answer" | "complete" | "fail" | "retry";

class NegoEvent {
    oldState: NegoState;
    newState: NegoState;
}

interface reply{
    sdp: RTCSessionDescriptionInit
}

interface negoComplete{
    result:boolean;
}


class Negotiation {
    io: any; //Socket IO
    readonly offerSender: string;
    readonly receriver: string;
    private state: NegoState = "new";
    private times: number = 0;
    onStateChange: ((event: NegoEvent) => void) = null;

    constructor(offerSender: string, receriver: string, io: any) {
        this.offerSender = offerSender;
        this.receriver = receriver;
        this.io = io;
    }

    /**
     * Get the key of the negotiation. Negotiations with two same users will have the same key.
     * For example, negotitatonA has offer sender 001 and receiver 002, 
     * and negotiationB has offer sender 002 adn receiver 001. Their keys are the same.
     * @returns 
     */
    getKey() {
        return [this.offerSender, this.receriver].sort().join(`---`);
    }

    /**
     * Start Negotiation
     */
    start() {
        this.times += 1;
        const errorState = this.times > 4 ? `fail`:`retry`
        const timeLimit = 5000;
        this.io.to(this.offerSender).timeout(timeLimit).emit(`NEGO:You need to provide offer to`, this.receriver, (err: any, offer: string) => {
            if (err) {
                // No response in a given time for NEGO:You need to provide offer to
                log(`NEGO(${this.getKey()}):TIME OUT TO GET AN OFFER FROM SOCKET ID ${this.offerSender}.`);
                this.setState(errorState);
            } else {
                //get response for NEGO:You need to provide offer to
                log(`NEGO(${this.getKey()}):GET AN OFFER FROM SOCKET ID ${this.offerSender}.`);
                this.setState(`have offer`);
                this.io.to(this.receriver).timeout(timeLimit).emit(`NEGO:You got a new offer from`, this.offerSender, offer, (err: any, answer: string) => {
                    if (err) {
                        //No response in a given time for NEGO:You got a new offer from
                        log(`NEGO(${this.getKey()}):TIME OUT TO GET AN ANSWER FROM SOCKET ID ${this.receriver}.`);
                        this.setState(errorState);
                    } else {
                        //get response for NEGO:You got a new offer from
                        log(`NEGO(${this.getKey()}):GET AN ANSWER FROM SOCKET ID ${this.receriver}.`);
                        this.setState(`have answer`);
                        this.io.to(this.offerSender).timeout(timeLimit).emit(`NEGO:You got an answer from`, this.receriver, answer, (err: any, negoComplete: string) => {
                            if (err) {
                                //No response in a given time for NEGO:You got an answer from
                                log(`NEGO(${this.getKey()}):TIME OUT TO GET A COMPLETION FROM SOCKET ID ${this.offerSender}.`);
                                this.setState(errorState);
                            } else if (negoComplete == `true`) {
                                console.log(`isCompleted: ${negoComplete}`);
                                log(`NEGO(${this.getKey()}):GET A SUCCESSFUEL COMPLETION FROM SOCKET ID ${this.offerSender}.`);
                                this.setState(`complete`);   
                            } else {
                                console.log(`isCompleted: ${negoComplete}`);
                                log(`NEGO(${this.getKey()}):GET A FAILED COMPLETION FROM SOCKET ID ${this.offerSender}.`);
                                this.setState(errorState);
                            }
                        });
                    }
                });
            }
        });
    }

    private setState(state: NegoState) {
        let event = new NegoEvent();
        event.oldState = this.state;
        this.state = state;
        event.newState = state;
        if(state === `retry`){
            log(`NEGO(${this.getKey()}):RETRY NEGOTIATION.`);
            this.start();
        }
        if (this.onStateChange) {
            this.onStateChange(event);
        }
    }

}

interface NegotiationPromise {
    negotiation: Negotiation;
    promise: Promise<void>;
}

module.exports = class NegotiationManager {

    negotiations: Map<string, Array<NegotiationPromise>> = new Map();
    io: any; //Socket IO
    constructor(io: any) {
        this.io = io;
    }

    addNegotiationAndQueuing(offerSender: string, receiver: string) {
        const key = [offerSender, receiver].sort().join(`---`);
        let newNego = new Negotiation(offerSender, receiver, this.io);
        let newNegoPromise: NegotiationPromise = { negotiation: newNego, promise: null };
        let existingNegos = this.negotiations.get(key);
        if (existingNegos) {
            let previousNegoPromise = existingNegos[existingNegos.length - 1]
            //Add the new negotiation to the negotiations
            this.addNegotiationToManager(key,newNegoPromise);

            //wait for the previous negotiation to complete
            newNegoPromise.promise = previousNegoPromise.promise.then(() => {
                return this.startNegotiation(key, newNegoPromise);
            });

        } else {
            //Add the new negotiation to the negotiations
            this.addNegotiationToManager(key,newNegoPromise);
            //No existing negotitation, start the new negotiation
            newNegoPromise.promise = this.startNegotiation(key, newNegoPromise);
        }
        
        log(`ADD A NEW NEGOTIATION FOR SOCKET IDS (${key}), THERE WAS ${existingNegos?.length ?? 0} ONGOING NEGOTIATIONS.`);
    }

    /**
     * Starts a new negotiation and adds it to the manager
     * @param key The key of the negotiation
     * @param offerSender The user ID of the offer sender
     * @param receiver The user ID of the receiver
     * @param negoPromise A promise that will be resolved when the negotiation is complete
     */
    private startNegotiation(key: string, negoPromise: NegotiationPromise) {
        return new Promise<void>((resolve, reject) => {
            let nego = negoPromise.negotiation;

            nego.onStateChange = (event: NegoEvent) => {
                log(`NEGO(${key}):STATE CHANGED TO ${event.newState}.`);

                if (event.newState == "complete" || event.newState == "fail") {
                    // Remove the negotiation from the manager
                    let negoArray = this.negotiations.get(key);
                    let index = negoArray.indexOf(negoPromise);
                    if (index > -1) {
                        negoArray.splice(index, 1);
                    }

                    if (negoArray.length == 0) {
                        this.negotiations.delete(key);
                    }

                    resolve();
                }
            };

            nego.start();
            log(`NEGOTIATION FOR ${key} STARTED`);
        });
    }

    /**
     * Adds a negotiation promise to the manager
     * @param key The key of the negotiation
     * @param newNegoPromise A promise that will be resolved when the negotiation is complete
     */
    private addNegotiationToManager(key: string, newNegoPromise: NegotiationPromise) {
        let negoArray = this.negotiations.get(key);

        if (!negoArray) {
            negoArray = [];
            this.negotiations.set(key, negoArray);
        }

        negoArray.push(newNegoPromise);
    }

}
