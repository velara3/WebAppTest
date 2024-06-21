import {BaseClass} from "base-class-ts/BaseClass.js"


export class MyClass extends BaseClass {

    constructor() {
        super();
        console.log("Hello world") 
    }
}

BaseClass.startWhenReady(MyClass);
