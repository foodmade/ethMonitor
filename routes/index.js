var express = require('express');
var router = express.Router();
var wssTest = require('../service/WssTest');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/testWss',function(req,res,next){
  wssTest.init();
})

module.exports = router;
