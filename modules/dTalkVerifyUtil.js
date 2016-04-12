var DTalkCrypt = require('./dTalkCrypt'),
    dTalkApiUtil = require('./dTalkApiUtil'),
    fs = require('fs'),
    path = require('path');

var config = require("../data/dTalkConfig");
console.log('dTalkConfig : ' + JSON.stringify(config));
/*
    "suite_ticket"事件每二十分钟推送一次,数据格式如下
    {"SuiteKey": "suitexxxxxx","EventType": "suite_ticket","TimeStamp": 1234456,"SuiteTicket": "adsadsad"}
    */
config.prototype.getTicket = function(cb) {
    //var self = this;
    fs.readFile(path.resolve('./data/' + this.suiteid + '_ticket.json'), function(err, data) {
        if (err) {
            cb.error(err);

        } else {
            cb.success({ SuiteTicket: JSON.parse(data.toString()).SuiteTicket });
        }

    });
};
config.prototype.setTicket = function(data) {

    fs.writeFile(path.resolve('./data/' + this.suiteid + '_ticket.json'), JSON.stringify(data));
};
/*
"tmp_auth_code"事件将企业对套件发起授权的时候推送,数据格式如下
{"SuiteKey": "suitexxxxxx", "EventType": " tmp_auth_code","TimeStamp": 1234456,"AuthCode": "adads"}            
*/
config.prototype.getToken = function(cb) {

    fs.readFile(path.resolve('./data/' + this.suiteid + '_token.json'), function(err, data) {
        if (err) {
            cb.error(err);

        } else {
            cb.success({ AuthCode: JSON.parse(data.toString()).AuthCode });
        }
    });
};

config.prototype.setToken = function(data) {

    fs.writeFile(path.resolve('./data/' + this.suiteid + '_token.json'), JSON.stringify(data));
};
//{"permanent_code": "xxxx","auth_corp_info":{"corpid": "xxxx","corp_name": "name"}}
config.prototype.getPermanentCode = function(corpId, cb) {

    fs.readFile(path.resolve('./data/' + this.suiteid + '_' + corpId + '_permanent_code.json'), function(err, data) {

        if (err) {
            cb.error(err);

        } else {
            cb.success({ permanentCode: JSON.parse(data.toString()).permanent_code });
        }
    });
};

config.prototype.setPermanentCode = function(corpInfo) {

    fs.writeFile(path.resolve('./data/' + this.suiteid + '_' + corpInfo.auth_corp_info.corpid + '_permanent_code.json'), JSON.stringify(corpInfo));
};

var dTalkCrypt = new DTalkCrypt(config.token, config.encodingAESKey, config.suiteid || 'suite4xxxxxxxxxxxxxxx');

var nonce_success = 'success';

var dTalkVerifyUtil = {


    verification: function(params, cb) {
        console.log(params);
        /*
        { nonce: 'beoX0mcQ',
          timestamp: '1459480970197',
          signature: '5e99e6776f0175bb46e2be2fe9a86451a7cfed39',
          url: '/ddWebapp/verification?signature=5e99e6776f0175bb46e2be2fe9a86451a7cfed39&timestamp=1459480970197&nonce=beoX0mcQ',
          encrypt: 'EyLLPYREzxteWl2T3BQ==' 
        }
        */
        var signature = params.signature;
        var timestamp = params.timestamp;
        var nonce = params.nonce;
        var encrypt = params.encrypt;

        if (signature !== dTalkCrypt.getSignature(timestamp, nonce, encrypt)) {
            console.log('Invalid signature');
            cb.success({ message: 'Invalid signature' });

            return;
        }

        var result = dTalkCrypt.decrypt(encrypt);
        console.log('decrypt message:' + result.message);

        var message = JSON.parse(result.message);

        if (message.EventType === 'check_update_suite_url' || message.EventType === 'check_create_suite_url') { //创建套件第一步，验证有效性。

            /*
            "check_create_suite_url"事件将在创建套件的时候推送
               {
                  "EventType":"check_create_suite_url",
                  "Random":"brdkKLMW",
                  "TestSuiteKey":"suite4xxxxxxxxxxxxxxx"
                }
             */
            /* 
            "check_update_suite_url"事件将在更新套件的时候推送
               {
                  "EventType":"check_update_suite_url",
                  "Random":"Aedr5LMW",
                  "TestSuiteKey":"suited6db0pze8yao1b1y"
                }
             */
            var returnData = {};

            returnData.encrypt = dTalkCrypt.encrypt(message.Random);
            returnData.timeStamp = timestamp;
            returnData.nonce = nonce;
            returnData.msg_signature = dTalkCrypt.getSignature(returnData.timeStamp, returnData.nonce, returnData.encrypt); //新签名

            cb.success(returnData);

        } else if (message.EventType === 'suite_ticket') {
            /*
            "suite_ticket"事件每二十分钟推送一次,数据格式如下
               {
                  "SuiteKey": "suitexxxxxx",
                  "EventType": "suite_ticket",
                  "TimeStamp": 1234456,
                  "SuiteTicket": "adsadsad"
                }
             */

            var returnData = {};
            returnData.encrypt = dTalkCrypt.encrypt(nonce_success);
            returnData.timeStamp = timestamp;
            returnData.nonce = nonce;
            returnData.msg_signature = dTalkCrypt.getSignature(returnData.timeStamp, returnData.nonce, returnData.encrypt); //新签名


            console.log("SuiteTicket " + message.SuiteTicket);
            cb.success(returnData);
            config.setTicket(message);


        } else if (message.EventType === 'tmp_auth_code') {
            /*
            "tmp_auth_code"事件将企业对套件发起授权的时候推送,数据格式如下
            {
              "SuiteKey": "suitexxxxxx",
              "EventType": " tmp_auth_code",
              "TimeStamp": 1234456,
              "AuthCode": "adads"
            }            
            */
            var returnData = {};

            returnData.encrypt = dTalkCrypt.encrypt(nonce_success);
            returnData.timeStamp = timestamp;
            returnData.nonce = nonce;
            returnData.msg_signature = dTalkCrypt.getSignature(returnData.timeStamp, returnData.nonce, returnData.encrypt); //新签名


            console.log("AuthCode " + message.AuthCode);
            cb.success(returnData);
            config.setToken(message);

            config.getTicket({

                success: function(data) {

                    dTalkApiUtil.getSuiteAccessToken(config.suiteid, config.suitesecret, data.SuiteTicket, {

                            success: function(result) {
                                //save SuiteAccessToken
                                var suiteAccessToken = result.suite_access_token;

                                dTalkApiUtil.getPermanentCode(suiteAccessToken, message.AuthCode, {
                                        success: function(corpInfo) {
                                            //{"permanent_code": "xxxx","auth_corp_info":{"corpid": "xxxx","corp_name": "name"}}
                                            dTalkApiUtil.getActivateSuite(suiteAccessToken, config.suiteid, corpInfo.auth_corp_info.corpid, corpInfo.permanent_code, {
                                                success: function(resultInfo) {
                                                    console.log('resultInfo ' + resultInfo);
                                                },
                                                error: function(err) {
                                                    console.log(err);
                                                }
                                            });

                                            config.setPermanentCode(corpInfo);
                                        },
                                        error: function(err) {
                                            console.log(err);
                                        }
                                    }


                                );
                            },
                            error: function(err) {
                                console.log(err);
                            }
                        }

                    );

                },
                error: function(err) {
                    console.log(err);
                }
            });


        } else if (message.EventType === 'change_auth') {
            /*
            "change_auth"事件将在企业授权变更消息发生时推送,数据格式如下
            {
              "SuiteKey": "suitexxxxxx",
              "EventType": " change_auth",
              "TimeStamp": 1234456,
              "AuthCorpId": "xxxxx"
            }
            */
            var returnData = {};

            returnData.encrypt = dTalkCrypt.encrypt(nonce_success);
            returnData.msg_signature = dTalkCrypt.getSignature(timestamp, nonce_success, returnData.encrypt); //新签名
            returnData.timeStamp = timestamp;
            returnData.nonce = nonce;

            console.log("AuthCorpId " + message.AuthCorpId);
            cb.success(returnData);

        }
    }

};

module.exports = dTalkVerifyUtil;
