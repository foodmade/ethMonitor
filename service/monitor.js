const config     = require('./config');
const Web3       = require('web3');
const Promise    = require('es6-promise').Promise;
const logger     = require('./log');
const request    = require('./request');

///////////////////////////////////////////////////////////////////////////////
var web3;
var contractBean;


/**
 * Load contract.
 */
var loadContract = function(){
    return new Promise((resolve,reject) => {
        try{
            logger.info(`Load contract. addrsss:${config.wallet.contractAddress} `);
            const tokenContract = new web3.eth.Contract(config.abi, config.wallet.contractAddress);
            resolve(tokenContract);
        }catch(e){
            reject(e.msg);
        }
    })
}

/**
 * Init web3j client todo: websocket
 */
var initWeb3 = function(){
    return new Promise((resolve,reject) => {
        try{
            logger.info(`Start loading web3 client....`);
            web3 = new Web3(new Web3.providers.WebsocketProvider(config.wallet.wssUrl));
            logger.info(`Web3j client load successful. version: ${web3.version}`);
            if(web3 && web3.version){
                resolve();
            }else{
                reject(`Init web3 client fail.`);
            }
        }catch(e){
            reject(e.msg);
        }
    })
}

/**
 * Invalid contract.
 * 这儿使用默认钱包地址获取余额,如果可以获取到余额,则说明合约有效,反之则无效
 * @param {合约对象}} contract 
 */
var isValid = function(contract){
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
}

var listener = function(){
    return new Promise((resolve,reject) => {
        contractBean.events.Transfer({
            fromBlock: 'latest',
		    toBlock:'latest'
        },(error,event) => {
            if(error){
                logger.error(`Listener event throw err: ${error}`)
            }
        })
        .on('data',(event) => {
            logger.info(`On data : ${JSON.stringify(event)}`)
            confirmEtherTransaction(event.transactionHash,20);
        })
        .on('error', console.error);
    })
}


function confirmEtherTransaction(txHash, confirmations = 10) {
	setTimeout(async () => {  
	  const trxConfirmations = await getConfirmations(txHash)
	  console.log('Transaction with hash ' + txHash + ' has ' + trxConfirmations + ' confirmation(s)');
	  if (trxConfirmations >= confirmations) {
        console.log('Transaction with hash ' + txHash + ' has been successfully confirmed');
		return;
	  }
	  // Recursive call
	  return confirmEtherTransaction(txHash, confirmations)
	}, config.work.refreshTime)
  }

async function getConfirmations(txHash) {
	try {
	  const web3 = new Web3(config.wallet.ipcUrl);
	  const trx = await web3.eth.getTransaction(txHash);
	  const currentBlock = await web3.eth.getBlockNumber();
	  return trx.blockNumber === null ? 0 : currentBlock - trx.blockNumber
	}
	catch (error) {
	  console.log(error)
	}
}

/**
 * Init web3 client.
 */
initWeb3()
    .then(loadContract)
    .then(isValid)
    .then(listener)
    .catch(function(err){
        logger.error(`throw err >>> msg:${err}`);
    })