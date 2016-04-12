var log4js = require('log4js');
log4js.configure({
    appenders: [{
        type: 'console'
            //,"category":"console"
    }, {
        type: 'file',
        filename: './logs/weather.log',
        //category: 'normal' ,
        //backup: 4,
        //pattern: "-yyyy-MM-dd",
        //alwaysIncludePattern: true,
        maxLogSize: 1024 * 1024
    }],
    //"replaceConsole": true
});

/*
logger.trace('Entering cheese testing');
logger.debug('Got cheese.');
logger.info('Cheese is Gouda.');
logger.warn('Cheese is quite smelly.');
logger.error('Cheese is too ripe!');
logger.fatal('Cheese was breeding ground for listeria.');
*/

exports.logger = function(name) {
    var logger = log4js.getLogger(name);
    logger.setLevel('INFO');
    return logger;
}
