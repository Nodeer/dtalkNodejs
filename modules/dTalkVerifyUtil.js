var DTalkCrypt = require('./dTalkCrypt');
var dTalkApiUtil = require('./dTalkApiUtil');
var Rx = require('rx');
var fs = require('fs');

var config = {
    token: 'today8weather',
    encodingAESKey: 'tneaaerppmdarj97z43vs5wd75mht47xt1k4v5aeces',
    suiteid: 'suite3ameqjpytd5vnnrg', //第一次验证没有不用填 
    suitesecret: 'Mw5YrZ2_XxKzmxemIhY3vwtTkku8jAB1ZUVCqTQQOJ7YZ65I_lGS2Lfs_TIcnxfe',

    /*
    "suite_ticket"事件每二十分钟推送一次,数据格式如下
    {"SuiteKey": "suitexxxxxx","EventType": "suite_ticket","TimeStamp": 1234456,"SuiteTicket": "adsadsad"}
    */
    getTicket: function(callback) {

        fs.readFile(this.suiteid + '_ticket.json', function(err, data) {
            if (err) {
                callback(err);
                console.log('getTicket err ' + err);
                return;
            }
            console.log("suite_ticket " + data);
            callback({ SuiteTicket: JSON.parse(data.toString()).SuiteTicket });
        });
    },
    saveTicket: function(data) {

        fs.writeFile(this.suiteid + '_ticket.json', JSON.stringify(data));
    },
    /*
    "tmp_auth_code"事件将企业对套件发起授权的时候推送,数据格式如下
    {"SuiteKey": "suitexxxxxx", "EventType": " tmp_auth_code","TimeStamp": 1234456,"AuthCode": "adads"}            
    */
    getToken: function(callback) {

        fs.readFile(this.suiteid + '_token.json', function(err, data) {
            if (err) {
                callback(err);
                return;
            }
            callback({ AuthCode: JSON.parse(data.toString()).AuthCode });
        });
    },

    saveToken: function(data) {

        fs.writeFile(this.suiteid + '_token.json', JSON.stringify(data));
    }

}

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
            config.saveTicket(message);


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
            config.saveToken(message);

            config.getTicket(function(data) {

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

                                        fs.writeFile(config.suiteid + '_' + corpInfo.auth_corp_info.corpid + '_permanent_code.json', JSON.stringify(corpInfo));
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
