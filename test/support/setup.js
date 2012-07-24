var mochaAsPromised = require("mocha-as-promised");
var chai = require("chai");
var sinonChai = require("sinon-chai");
var chaiAsPromised = require("chai-as-promised");

mochaAsPromised();

chai.use(sinonChai);
chai.use(chaiAsPromised);
chai.should();

global.sinon = require("sinon");
global.expect = chai.expect;
