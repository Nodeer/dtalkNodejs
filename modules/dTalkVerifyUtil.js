var DTalkCrypt = require('./dTalkCrypt'),
    dTalkApiUtil = require('./dTalkApiUtil'),
    async = require('async'),
    dTalkConfig = require("./dTalkConfig");

var dTalkCrypt = new DTalkCrypt(dTalkConfig.token, dTalkConfig.encodingAESKey, dTalkConfig.suiteid || 'suite4xxxxxxxxxxxxxxx');

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
            cb({ message: 'Invalid signature' });

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

            cb(null, returnData);

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
            cb(null, returnData);
            dTalkConfig.setTicket(message);


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
            cb(null, returnData);

            dTalkConfig.setToken(message);

            async.waterfall([
                function(callback) {
                    dTalkConfig.getTicket(function(err, data) {

                        if (err) {
                            callback(err);
                            return;
                        }
                        callback(null, data.SuiteTicket);
                    });
                },
                function(suiteTicket, callback) {
                    dTalkConfig.getSuiteAccessToken(dTalkConfig.suiteid, dTalkConfig.suitesecret, suiteTicket, function(err, data) {

                        if (err) {
                            callback(err);
                            return;
                        }
                        callback(null, data.suite_access_token);
                    });
                },
                function(suiteAccessToken, callback) {
                    dTalkConfig.getPermanentCode(suiteAccessToken, message.AuthCode, function(err, data) {

                        if (err) {
                            callback(err);
                            return;
                        }
                        callback(null, suiteAccessToken, data);
                    });
                },
                function(suiteAccessToken, corpInfo, callback) {
                    dTalkApiUtil.getActivateSuite(suiteAccessToken, dTalkConfig.suiteid, corpInfo.auth_corp_info.corpid, corpInfo.permanent_code,
                        function(err, resultInfo) {

                            if (err) {
                                callback(err, corpInfo);
                                return;
                            }
                            console.log('resultInfo ' + JSON.stringify(resultInfo));

                            callback(null, corpInfo);
                        });
                }
            ], function(err, corpInfo) {

                if (!corpInfo) {
                    dTalkConfig.setPermanentCode(corpInfo);
                }
                if (!err) {
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
            cb(null, returnData);

        }
    }

};

module.exports = dTalkVerifyUtil;
