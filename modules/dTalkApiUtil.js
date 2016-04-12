var querystring = require("querystring");
var dTalkHttpsUtil = require('./dTalkHttpsUtil');

module.exports = {

    // POST https://oapi.dingtalk.com/service/get_suite_token
    getSuiteAccessToken: function(suite_key, suite_secret, suite_ticket, cb) {
        var data = {
            suite_key: suite_key,
            suite_secret: suite_secret,
            suite_ticket: suite_ticket
        }
        dTalkHttpsUtil.post('/service/get_suite_token', data, cb);
        //返回{ suite_access_token, expires_in  有效期}
    },

    //POST https://oapi.dingtalk.com/service/get_permanent_code?suite_access_token=xxxx
    getPermanentCode: function(suite_access_token, tmp_auth_code, cb) {
        var data = {
            tmp_auth_code: tmp_auth_code
        }
        dTalkHttpsUtil.post('/service/get_permanent_code?suite_access_token=' + suite_access_token, data, cb);
        //返回 {"permanent_code": "xxxx","auth_corp_info":{"corpid": "xxxx","corp_name": "name"}}
    },

    //POST https://oapi.dingtalk.com/service/activate_suite?suite_access_token=xxxx
    getActivateSuite: function(suite_access_token, suite_key, auth_corpid, permanent_code, cb) {
        var data = {
            suite_key: suite_key,
            auth_corpid: auth_corpid,
            permanent_code: permanent_code
        }
        dTalkHttpsUtil.post('/service/activate_suite?suite_access_token=' + suite_access_token, data, cb);
        //返回 {"errcode":0,"errmsg":"ok"}
    },
    //POST https: //oapi.dingtalk.com/service/get_corp_token?suite_access_token=xxxx
    getAccessToken: function(suite_access_token, auth_corpid, permanent_code, cb) {
        var data = {
            auth_corpid: auth_corpid,
            permanent_code: permanent_code
        }
        dTalkHttpsUtil.post('/service/get_corp_token?suite_access_token=' + suite_access_token, data, cb);
        //返回 {"access_token": "xxxxxx","expires_in": 7200}
    }
};
