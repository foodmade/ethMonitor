const config     = require('./config');
const Web3       = require('web3');
const Promise    = require('es6-promise').Promise;
const logger     = require('./log');
const utils      = require('./utils');

///////////////////////////////////////////////////////////////////////////////
var web3;
var web3Http;
var contractBean;


/**
 * Load contract.
 */
const loadContract = function () {
    return new Promise((resolve, reject) => {
        try {
            logger.info(`Load contract. addrsss:${config.wallet.contractAddress} `);
            const tokenContract = new web3.eth.Contract(config.abi, config.wallet.contractAddress);
            resolve(tokenContract);
        } catch (e) {
            reject(e.msg);
        }
    })
};

/**
 * Init web3j client todo: websocket
 */
const initWeb3 = function(){
    return new Promise((resolve,reject) => {
        try{
            logger.info(`Start loading web3 client....`);
            web3 = new Web3(new Web3.providers.WebsocketProvider(config.wallet.wssUrl));
            web3Http = new Web3(config.wallet.ipcUrl);
            logger.info(`Web3j client load successful. version: ${web3.version}`);
            if(web3 && web3.version){
                resolve();
            }else{
                reject(`Init web3 client failed.`);
            }
        }catch(e){
            reject(e.msg);
        }
    })
};

/**
 * Invalid contract.
 * 这儿使用默认钱包地址获取余额,如果可以获取到余额,则说明合约有效,反之则无效
 * @param contract
 */
const isValid = function(contract){
    return new Promise((resolve, reject) => {
        contract.methods.balanceOf(config.wallet.adminAddress)
                            .call()
                            .then((data) => {
                                logger.info(`Balance:${data}`);
                                if(data){
                                    logger.info(`Contract valid:[true]`);
                                    contractBean = contract;
                                    resolve();
                                }else{
                                    logger.info(`Contract valid:[false]`);
                                    reject();
                                }
                            })
    });
};

const listenerContract = function(){
    logger.info(`Start contract transfer listener hanlder.`);
    contractBean.events.Transfer({
        fromBlock: 'latest',
        toBlock:'latest'
    },(error,event) => {
        if(error){
            logger.error(`Listener contract event throw err: ${error}`);
        }
    }).on('data',(event) => {
        logger.info(`On data : ${JSON.stringify(event)}`);
        callServer(event);
        confirmEtherTransaction(event.transactionHash,config.work.confirmCount);
    }).on('error', console.error);
};

const listenerEtherTransfers = function () {
    logger.info(`Start eth transfer listener hanlder.`);
    const subscription = web3.eth.subscribe('newBlockHeaders');
    // Subscribe to pending transactions
    subscription.subscribe((error, result) => {
        if (error) {
            logger.err(`Listener eth transfer event failed. error:${error}`);
        }
    }).on('data', async (event) => {
        try {
            getBlock(event.number);
            // confirmEtherTransaction(txHash);
        }catch (error) {
            logger.err(error)
        }
    })
};

//通知服务器新的充值交易
const callServer = function (data) {
    utils.submitTransactionEvent(data,function () {
        logger.info("Submit TransactionEvent successful.")
    },function () {
        logger.err("Submit TransactionEvent failed.")
    })
};

const callConfirmBlock = function (txHash,trxConfirmations) {
    utils.submitConfirmEvent({
        transactionHash: txHash,
        confirmNumber: trxConfirmations
    },function () {
        logger.info(`Submit confirm block number successful.`)
    },function () {
        logger.err(`Submit confirm block number failed.`)
    })
};

//获取当前区块的信息
const getBlock = function (blockNumber) {
    blockNumber = blockNumber - config.work.frontBlockNum;
    logger.info(`Listening to a new block. Number:${blockNumber}`);
    web3.eth.getBlock(blockNumber).then(
        function(result){
            if(!result){
                logger.info(`Listener is empty block. Result:${result}`);
                return;
            }
            const transactions = result.transactions;
            if(transactions.length === 0){
                logger.info(`Listener transactions is empty. ${JSON.stringify(transactions)}`);
                return;
            }
            getTransactions(transactions);
        });
};

//获取交易信息
const getTransactions  = function (transactions) {
    transactions.forEach(txh => {
        web3.eth.getTransaction(txh).then(
            function(result){
                from = result.from;
                to = result.to;
                logger.info(`from: ${from}`);
                logger.info(`to: ${to}`);
            });
    });
};

function confirmEtherTransaction(txHash, confirmations = 20) {
	setTimeout(async () => {  
	    const trxConfirmations = await getConfirmations(txHash);
	    logger.info('Transaction with hash ' + txHash + ' has ' + trxConfirmations + ' confirmation(s)');
	    callConfirmBlock(txHash,trxConfirmations);
	    if (trxConfirmations >= confirmations) {
            logger.info('Transaction with hash ' + txHash + ' has been successfully confirmed');
		return;
	    }
	    // Recursive call
	    return confirmEtherTransaction(txHash, confirmations);
	}, config.work.refreshTime);
  }

async function getConfirmations(txHash) {
	try {
	  const trx = await web3Http.eth.getTransaction(txHash);
	  const currentBlock = await web3Http.eth.getBlockNumber();
	  return trx.blockNumber === null ? 0 : currentBlock - trx.blockNumber
	}
	catch (error) {
        logger.err(error)
	}
}


    /**
     * Init web3 client.
     */
    initWeb3()
        .then(loadContract)
        .then(isValid)
        .then(listenerContract)
        .then(listenerEtherTransfers)
        .catch(function(err){
            logger.error(`throw err >>> msg:${err}`);
        });


