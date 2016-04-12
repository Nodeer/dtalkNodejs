var querystring = require("querystring"),
    dTalkHttpsUtil = require('./dTalkHttpsUtil'),
    DTalkCrypt = require('./dTalkCrypt'),
    dTalkApiUtil = require('./dTalkApiUtil'),
    config = require("./dTalkConfig");

var WebAppUtil = {

        // GET https://oapi.dingtalk.com/department/list?access_token=ACCESS_TOKEN
        getDepartmentList: function(access_token, cb) {

            dTalkHttpsUtil.get('/department/list?access_token=' + access_token, data, cb);
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

exports.doAction = function (corpId, res) {

            var permanentCode = '';


            config.getPermanentCode(corpId, {

                success: function(data) {
                    permanentCode = data.permanentCode;


                    config.getTicket({

                        success: function(data) {

                            dTalkApiUtil.getSuiteAccessToken(config.suiteid, config.suitesecret, data.SuiteTicket, {

                                success: function(result) {
                                    //save SuiteAccessToken
                                    var suiteAccessToken = result.suite_access_token;

                                    dTalkApiUtil.getAccessToken(suiteAccessToken, corpId, permanentCode, {
                                        success: function(data) {
                                            console.log(data);
                                            var access_token = data.access_token;

                                            WebAppUtil.getDepartmentList(access_token, {
                                                success: function(data) {
                                                    console.log(data);

                                                },
                                                error: function(err) {
                                                    console.log(err);
                                                }
                                            });
                                        },
                                        error: function(err) {
                                            console.log(err);
                                        }
                                    });

                                },
                                error: function(err) {
                                    console.log(err);

                                }
                            });
                        },
                        error: function(err) {
                            console.log(err);
                        }
                    });




                },
                error: function(err) {
                    console.log(err);
                }
            });


        };
