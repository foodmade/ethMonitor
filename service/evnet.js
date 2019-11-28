const events  = require('events');
const request = require('./request');
const log     = require('./log');

//Create a event listener handler.
const emitter = new events.EventEmitter();

emitter.addListener("processPendingTransferEvnet",function(options){
    log.info(`Submit processPendingTransferEvent request. ${JSON.stringify(options)}`);
});

emitter.addListener("processBlockConfirmEvent",function(options){
    log.info(`Submit processBlockConfirmEvent request. ${JSON.stringify(options)}`);
})