/*
 500 https://hacker-news.firebaseio.com/v0/topstories.json - 50.23.219.162
 1 https://hacker-news.firebaseio.com/v0/item/9139817.json

 * */

var express = require('express'),
    app = express(),
    Memcached = require('memcached'),
    memcached = new Memcached('127.0.0.1:11211', null),
//bodyParser = require('body-parser'),
    port = 5005,
    async = require('async'),
    router = express.Router(),
    http = require('request'),
    singleStorieUrl = 'https://hacker-news.firebaseio.com/v0/item/',
    top500Stories_Url = 'https://hacker-news.firebaseio.com/v0/topstories.json',
    socket = require('socket.io');



/*
 * SETUP
 * */

/* get top 500 stories */
var _stories = [], _limit = 500;

http(top500Stories_Url, function (err, res, body) {

    var storyIds = JSON.parse(body).slice(0, _limit);

    var max = (_limit > 200)? 8: 6;

    var reqOptions = {pool: {maxSockets: max}};/* try 10+ for 500 stories */



    async.map(storyIds, getEachStory, function (err, data) {});

    function getEachStory(id, cb) {

        http(singleStorieUrl + id + '.json', function (err, res, body) {
            var _details = JSON.parse(body);

            _stories.push({

                url: (_details.url || 'no url'),
                title: (_details.title || 'no title'),
                score: (_details.score || 'no score')

            });

            cb(null, _stories);
        });
    }
});

/* not needed, possibly vulnerable to xss */
//app.use(bodyParser.urlencoded({extended: true}));
//app.use(bodyParser.json());


app.use('/api', router);



/*
 * ROUTES
 * */
app.use(express.static(__dirname + '/public'));

app.get('/top-stories', function (req, res) {

    res.setHeader('Access-Control-Allow-Origin', '*');

    res.sendFile(__dirname + '/public/index.html');
});

/* sortOrder: asc | desc/:range 0-9 */
app.get('/api/sorted-stories/:sortOrder/:range', function (req, res) {

    res.setHeader('Access-Control-Allow-Origin', '*');

    var _digits = req.params.range.split('-'),
        start = parseInt(_digits[0], 10),
        end = parseInt(_digits[1], 10),
        step = 9,
        fwdEnd = (end + step),
        fwdStart = (start + step),
        backStart = (start - step),
        backEnd = (backStart + step);



    /* check bounds: fwd */
    fwdEnd = (fwdEnd > _limit) ? _limit : fwdEnd;

    if (end == _limit) {

        fwdStart = 0;

        fwdEnd = step;
    }


    /* check bounds: back */
    backStart = (backStart < 0) ? 0 : backStart;

    if (start == 0) {

        backStart = (_limit - step);

        backEnd = _limit;
    }

    resource = {
        req: req.url,
        name: 'stories',
        data: '',
        range: [start, end],
        links: {
            fwd: '//localhost:5005/api/sorted-stories/asc/' + fwdStart + '-' + fwdEnd,
            back: '//localhost:5005/api/sorted-stories/asc/' + backStart + '-' + backEnd
        }
    };

    memcached.get('stories', function (err, data) {

        resource.data = data.slice(start, end);

        res.json(resource);
    });
});

app.listen(port);
console.log('\n', 'node server running on port 5005, socket.io on 5006, and memcache on port 11211', '\n\n\n');



/*
 * SOCKET.IO
 * */
socket = socket.listen(5006);

/*  wait till we have all stories, send story count, then sort them */
socket.on('connect', function (conn) {

    async.whilst(
        function allStoriesLoaded() {

            return _stories.length != _limit;
        },



        function countStories(callback) {

            conn.emit('story-count', {count: _stories.length, total: _limit});

            setTimeout(callback, 10);
        },



        function finalData(err) {
            /* sort _stories */
            async.series(
                [
                    function (cb) {

                        _stories.sort(function (a, b) {

                            return a.score - b.score;

                        });

                        cb(null, _stories);
                    },

                    function () {

                        memcached.set('stories', _stories, 30, function (err, data) {
                        });
                    }
                ]);

            conn.emit('story-count', {count: _stories.length, total: _limit});
        });

    conn.on('disconnect', function (conn) {
        socket.disconnect();
    });
});




