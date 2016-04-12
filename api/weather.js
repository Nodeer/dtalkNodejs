var request = require('request');

var logger = require('../modules/logger').logger('weatherAPI');

function isEmpty(val) {
    return (val === undefined || val == null || val.length <= 0) ? true : false;
}

exports.getWeather = function(req, res, myCache) {

    var cityId = req.query.cityId;

    var data = myCache.get(cityId);

    if (data) {
        logger.info('Cached ' + cityId);
        res.setHeader('Content-Type', 'application/json;charset=utf-8');
        res.send(data);

    } else {

        request("http://aider.meizu.com/app/weather/listWeather?cityIds=" + cityId,
            function(error, response, body) {

                if (!error && response.statusCode == 200) {

                    var resultJson = getResultJson(body);

                    res.setHeader('Content-Type', 'application/json;charset=utf-8');
                    res.send(resultJson);

                    logger.info('Cache ' + cityId + ' ' + JSON.stringify(resultJson));
                    myCache.set(cityId, resultJson, 10 * 60); //10*60s

                }
            }
        );

    }



};

function getResultJson(body) {
    var jsonData = JSON.parse(body);

    var weatherData = jsonData.value[0];

    var resultJson = {};

    resultJson.city = weatherData.city;
    resultJson.cityId = weatherData.cityid;
    resultJson.provinceName = weatherData.provinceName;
    resultJson.time = weatherData.realtime.time;

    //resultJson.alarms=weatherData.alarms;

    resultJson.weatherNow = {};
    resultJson.weatherNow.img = weatherData.realtime.img;
    resultJson.weatherNow.temp = weatherData.realtime.temp;
    resultJson.weatherNow.weather = weatherData.realtime.weather;
    resultJson.weatherNow.wind = weatherData.realtime.wD + " " + weatherData.realtime.wS;
    resultJson.weatherNow.temp_day_night = weatherData.weathers[0].temp_day_c + "°~" + weatherData.weathers[0].temp_night_c + "°";

    //resultJson.indexes=weatherData.indexes;

    resultJson.aqi = {};
    resultJson.aqi.aqi = weatherData.pm25.aqi;
    resultJson.aqi.pm25 = weatherData.pm25.pm25;
    resultJson.aqi.rank = weatherData.pm25.cityrank;
    resultJson.aqi.cityCount = weatherData.pm25.citycount;
    resultJson.aqi.quality = weatherData.pm25.quality;

    /*{
    endTime: "2015-11-06 11:00:00",
    highestTemperature: "26",
    img: "1",
    isRainFall: "无降水",
    lowerestTemperature: "20",
    precipitation: "0",
    startTime: "2015-11-06 08:00:00",
    wd: "南风",
    weather: "多云",
    ws: "0级"
    }*/

    //resultJson.weatherHours = weatherData.weatherDetailsInfo.weather3HoursDetailsInfos;

    var days = weatherData.weathers;

    var day = days[days.length - 1];
    days.unshift(day);
    days.pop();

    /*
    {
    date: "2015-11-06",
    img: "7",
    sun_down_time: "17:08",
    sun_rise_time: "06:16",
    temp_day_c: "28",
    temp_day_f: "82.4",
    temp_night_c: "20",
    temp_night_f: "68.0",
    wd: "南风",
    weather: "小雨",
    week: "星期五",
    ws: "0级"
    }*/
    resultJson.weathers = [];
    for (var id in days) {
        var dayW = {};

        dayW.date = days[id].date;
        dayW.week = days[id].week;
        dayW.weather = days[id].weather;
        dayW.img = days[id].img;
        dayW.temp_day_night = days[id].temp_day_c + "°/" + days[id].temp_night_c + "°";

        resultJson.weathers.push(dayW);
    };

    return resultJson;
}
