const request  = require('request');
const logger   = require('./log');
const config   = require('./config');


module.exports = {
    post: function(url,data,callback,errback){
        request({
            url: url,
            method: "POST",
            json: true,
            headers: config.wallet.callback.headers,
            body: data
        }, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                logger.info(`Method:[POST]. Callback process to server successful. rspBody:${JSON.stringify(body)}`);
                callback(body);
            }else{
                logger.warn(`Method:[POST]. Callback process to server fail. exMsg:${JSON.stringify(error)}`);
                errback();
            }
        }); 
    },
    
    get: function(url,callback,errback){
        request({
            url:url,
            method:'GET'
        },(error, response, body) => {
            if(!error && response.statusCode === 200){
                logger.info(`Method:[GET] . Callback process to server successful. rspBody:${body}`);
            }else{
                logger.warn(`Method:[GET]. Callback process to server fail. exMsg:${err}`);
            }
        })
    }
};