var dTalkConfig = require("../data/dTalkConfig"),
    fs = require('fs'),
    path = require('path');

console.log('dTalkConfig : ' + JSON.stringify(dTalkConfig));

var config = {

    token: dTalkConfig.token,
    encodingAESKey: dTalkConfig.encodingAESKey,
    suiteid: dTalkConfig.suiteid,
    suitesecret: dTalkConfig.suitesecret,

    /*
        "suite_ticket"事件每二十分钟推送一次,数据格式如下
        {"SuiteKey": "suitexxxxxx","EventType": "suite_ticket","TimeStamp": 1234456,"SuiteTicket": "adsadsad"}
        */
    getTicket: function(cb) {
        //var self = this;
        fs.readFile(path.resolve('./data/' + this.suiteid + '_ticket.json'), function(err, data) {
            if (err) {
                cb.error(err);

            } else {
                cb.success({ SuiteTicket: JSON.parse(data.toString()).SuiteTicket });
            }

        });
    },
    setTicket: function(data) {

        fs.writeFile(path.resolve('./data/' + this.suiteid + '_ticket.json'), JSON.stringify(data));
    },
    /*
    "tmp_auth_code"事件将企业对套件发起授权的时候推送,数据格式如下
    {"SuiteKey": "suitexxxxxx", "EventType": " tmp_auth_code","TimeStamp": 1234456,"AuthCode": "adads"}            
    */
    getToken: function(cb) {

        fs.readFile(path.resolve('./data/' + this.suiteid + '_token.json'), function(err, data) {
            if (err) {
                cb.error(err);

            } else {
                cb.success({ AuthCode: JSON.parse(data.toString()).AuthCode });
            }
        });
    },

    setToken: function(data) {

        fs.writeFile(path.resolve('./data/' + this.suiteid + '_token.json'), JSON.stringify(data));
    },
    //{"permanent_code": "xxxx","auth_corp_info":{"corpid": "xxxx","corp_name": "name"}}
    getPermanentCode: function(corpId, cb) {

        fs.readFile(path.resolve('./data/' + this.suiteid + '_' + corpId + '_permanent_code.json'), function(err, data) {

            if (err) {
                cb.error(err);

            } else {
                cb.success({ permanentCode: JSON.parse(data.toString()).permanent_code });
            }
        });
    },

    setPermanentCode: function(corpInfo) {

        fs.writeFile(path.resolve('./data/' + this.suiteid + '_' + corpInfo.auth_corp_info.corpid + '_permanent_code.json'), JSON.stringify(corpInfo));
    }


};

module.exports = config;
