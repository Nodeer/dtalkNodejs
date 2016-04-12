/* Nano Templates - https://github.com/trix/nano 

var data = {
            user: {
                login: "tomek",
                first_name: "Thomas",
                last_name: "Mazur",
                account: {
                    status: "active",java
                    expires_at: "2009-12-31"
                }
            },
            count: 2
        };

var htmlStr = '<p>Hello {user.first_name} {count}! Your account is <strong>{user.account.status}</strong></p>';

htmlStr = nanoReplace(htmlStr, data);
*/

function nanoReplace(template, data) {
    return template.replace(/\{([\w\.]*)\}/g, function(str, key) {
        var keys = key.split("."),
            v = data[keys.shift()];
        for (var i = 0, l = keys.length; i < l; i++) v = v[keys[i]];
        return (typeof v !== "undefined" && v !== null) ? v : "";
    });
}

/* 
DataCache.setItem(key,value,timeout);
DataCache.getItem(key,checkTimeout);
*/

var DataCache = {

    setItem: function(key, value, timeout) {
        timeout = timeout || 300000; //5 mins
        var timestamp = Date.now() + timeout;
        window.localStorage.setItem(key, value + '|' + timestamp);
    },
    removeItem: function(key) {
        window.localStorage.removeItem(key);
    },
    clear: function() {

        window.localStorage.clear();
    },
    getItem: function(key, checkTimeout) {
        var dataStr = window.localStorage.getItem(key);

        if (dataStr) {
            var dataArray = dataStr.split('|');

            if (checkTimeout) {

                if (dataArray[1] > Date.now())
                    return dataArray[0];

            } else {
                return dataArray[0];
            }
        }
    }
};
