const config   = require('./config');
const request  = require('./request');

module.exports = {

    getTransactionEventHost: function () {
        return config.wallet.callback.host + config.wallet.callback.transactionHost.path;
    },

    getConfirmEventHost: function () {
        return config.wallet.callback.host + config.wallet.callback.confirmHost.path;
    },

    getEthTransactionEventHost: function(){
        return config.wallet.callback.host + config.wallet.callback.ethTransactionHost.path;
    },

    strSpecialHandler: function(str){
        str = str.trim();
        str = str.replace('\\s*','');
        return str;
    },

    submitTransactionEvent: function (data,callback,errback) {
        data.tokenName = config.wallet.tokenName;
        request.post(this.getTransactionEventHost(),data,function () {
            callback();
        },function () {
            errback();
        })
    },

    submitConfirmEvent: function (data,callback,errback) {
        request.post(this.getConfirmEventHost(),data,function () {
            callback();
        },function () {
            errback();
        })
    },

    submitEthTransactionEvent: function (data,callback,errback) {
        data.tokenName = 'ETH';
        request.post(this.getEthTransactionEventHost(),data,function (response) {
            callback(response);
        },function () {
            errback();
        })
    }
};