var chai = require("chai");
var sinonChai = require("sinon-chai");

chai.use(sinonChai);
chai.should();

global.sinon = require("sinon");
