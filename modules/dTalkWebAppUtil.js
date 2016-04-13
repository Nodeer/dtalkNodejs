var querystring = require("querystring"),
    dTalkHttpsUtil = require('./dTalkHttpsUtil'),
    DTalkCrypt = require('./dTalkCrypt'),
    dTalkApiUtil = require('./dTalkApiUtil'),
    dTalkConfig = require("./dTalkConfig");

var WebAppUtil = {

    // GET https://oapi.dingtalk.com/department/list?access_token=ACCESS_TOKEN
    getDepartmentList: function(access_token, cb) {

        dTalkHttpsUtil.get('/department/list?access_token=' + access_token, cb);
        /*
        {
          "errcode": 0,
          "errmsg": "ok",
          "department": [
            {
              "id": 2,
              "name": "钉钉事业部",
              "parentid": 1,
              "createDeptGroup": true,
              "autoAddUser": true
            }
          ]
        }
        */

    }
};

exports.doAction = function(corpId, cb) {

    var permanentCode = '';


    dTalkConfig.getPermanentCode(corpId, function(err, data) {

        if (err) {
            console.log(err);
            return;
        }

        permanentCode = data.permanentCode;


        dTalkConfig.getTicket(function(err, data) {

            if (err) {
                console.log(err);
                return;
            }

            dTalkApiUtil.getSuiteAccessToken(dTalkConfig.suiteid, dTalkConfig.suitesecret, data.SuiteTicket,
                function(err, result) {
                    if (err) {
                        console.log(err);
                        return;
                    }

                    //save SuiteAccessToken
                    var suiteAccessToken = result.suite_access_token;

                    dTalkApiUtil.getAccessToken(suiteAccessToken, corpId, permanentCode,
                        function(err, data) {
                            if (err) {
                                console.log(err);
                                return;
                            }

                            console.log(data);

                            WebAppUtil.getDepartmentList(data.access_token, cb);

                        });

                });

        });

    });


};
