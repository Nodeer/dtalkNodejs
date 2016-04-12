$(document).ready(function() {

    //var myprovince = remote_ip_info['province']; 
    //var mycity = remote_ip_info['city'] 
    //var mydistrict = remote_ip_info['district'];
    //alert(myprovince+mycity+mydistrict);

    sendAjax();
});

function isEmpty(val) {
    return (val === undefined || val == null || val.length <= 0) ? true : false;
}

function sendAjax() {

    var localStorage = window.localStorage;

    var url = window.location.href;
    var cityId = url.substring(url.lastIndexOf("/")).replace("/", "");
    if (!cityId) {
        cityId = localStorage.cityId;
        if (!cityId) {
            cityId = '101210101';
            localStorage.setItem('cityId', '101210101');
        }
    }


    var dataStr = DataCache.getItem(cityId + 'data', true);

    if (dataStr) {
        fillData(dataStr);
        return;
    }


    $.ajax({
        type: "get", //也可以是type  
        async: true, //发送同步请求，此值可忽略,不影响结果  
        timeout: 1000,
        url: "/weather?cityId=" + cityId, //请求地址
        dataType: "text",
        success: function(data) { //成功后的回调函数,返回的数据放在data参数里  

            fillData(data);

            DataCache.setItem(cityId + 'data', data);

        },
        error: function(xhr, type) { //成功后的回调函数,返回的数据放在data参数里  

            var dataStr = DataCache.getItem(cityId + 'data');
            if (dataStr) {
                fillData(dataStr);
                console.log('error from cached ' + cityId);
            } else {
                $("body").append("网络异常啦！");

            }



        }
    });
};


function fillData(data) {

    var weatherData = JSON.parse(data);
    //today
    fillWeatherToday(weatherData);
    //forcast
    fillForcastDays(weatherData.weathers);

};

function fillWeatherToday(weatherData) {

    var realtime = weatherData.weatherNow;
    realtime.aqi = weatherData.aqi.aqi + " " + weatherData.aqi.quality;
    realtime.city = weatherData.city;

    var tempTemplate = $("#template-weather-today").html();

    $("#weather-today").html(nanoReplace(tempTemplate, { "realtime": realtime }));

    //var bgImg = 'imgs/day'+realtime.img+".png";
    var bgImg = 'http://i.tq121.com.cn/i/wap/index390/d04.jpg';
    //$("#weather-today").css("background-image", "url("+bgImg+")");
};

function fillForcastDays(days) {
    var forcastHtml = '';

    var day = days[0];
    days.shift();
    days.shift();
    days.unshift(day);
    days.pop();

    var forcast = $("#template-weather-day").html();

    for (var id in days) {
        var dayWther = days[id];

        forcastHtml += nanoReplace(forcast, { "dayWther": dayWther });
    }

    $("#weather-forcast").html(forcastHtml);

    $("#weather-forcast").children().first().removeClass('mui--divider-left').addClass('weatherDay-first');
};
