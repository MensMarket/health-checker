/**
 * Created by lmiranda on 3/21/16.
 */
var app = require('express')();
var exphbs = require('express-handlebars');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var schedule = require('node-schedule');
var fs = require('fs');
var scheduleConfig = JSON.parse(fs.readFileSync('./config/schedule.json', 'utf8'));

function Scheduler(service, config) {
    this.service = service;
    this.config = config;
    this.checker = require('./checkers/' + service);
}

Scheduler.prototype.add = function () {
    var $this = this;

    schedule.scheduleJob($this.config.rules, function () {
        io.emit('check', {
            'slug': $this.config.slug,
            'status': 'start'
        });

        var lastCheck = +(new Date());

        $this.checker.check().then(function (results) {
            io.emit('check', {
                'slug': $this.config.slug,
                'status': 'end',
                'timestamp': lastCheck,
                'results': results
            });
        });
    });
};

for (var service in scheduleConfig) {
    var scheduler = new Scheduler(service, scheduleConfig[service]);
    scheduler.add();
}

app.set('views', 'public/views');

app.engine('handlebars', exphbs({
    defaultLayout: 'main',
    layoutsDir: 'public/views/layouts'
}));

app.set('view engine', 'handlebars');

app.get('/', function (req, res) {
    res.render('home');
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});
