"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Base {
    constructor(cb) {
        this.cb = cb;
    }
}
class Derived extends Base {
    userService;
    constructor(userService) {
        super(() => this.validate());
        this.userService = userService;
        this.validate = this.validate.bind(this);
    }
    validate() {
        console.log(this.userService);
    }
}
const d = new Derived("hello");
d.cb();
