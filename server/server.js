var express = require('express'),
    app = express(),
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

/* get top 400 stories */
var _stories = [], _limit = 400;

http(top500Stories_Url, function (err, res, body) {
    if (err) throw err;

    var storyIds = JSON.parse(body).slice(0, _limit);

    async.map(storyIds, getEachStory, function (err, data) { if (err) throw err; });

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
        backEnd = (backStart + step),
        resource = {};



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


    resource.data = _stories.slice(start, end);

    res.json(resource);
});

app.listen(port);
console.log('\n\n\n',
    'node server running on port 5005, socket.io on 5006\n',
    'http://localhost:5005/top-stories',
    '\n\n\n');



/*
 * SOCKET.IO
 * */
socket = socket.listen(5006);

/*  send story count,
 *  till we have all stories,
 *  then sort all stories. */
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
                        console.log('sort complete');
                        conn.emit('story-count', {count: _stories.length, total: _limit});

                    }
                ]);
        }
    );

    conn.on('disconnect', function (conn) {
        socket.disconnect();
    });
});




