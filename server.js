var express  = require('express');
var app      = express();
var port = process.env.PORT || 9000;
var http = require('http').Server(app);
var io = require('socket.io')(http);
var _ = require('lodash');
var mongoose = require('mongoose');
var ss = require('socket.io-stream');
var stream = ss.createStream();
ss.forceBase64 = true;

var fs = require('fs');

//mongoose.connect('mongodb://kartikey:lola123@apollo.modulusmongo.net:27017/omI8nypi');
mongoose.connect('mongodb://localhost:27017/test');

var music = mongoose.model('music', {
    socketid : String,
    artist: String,
    title: String,
    musicid : Number
});

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) { 
    res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', function (socket) {
    
    console.log(socket.id+" has connected.");
  
    socket.on('add_entry', function (msg) {
    	console.log(msg.artist+ " from socket id "+socket.id);
        var entry = new music({"socketid":socket.id,"artist":msg.artist,"title":msg.title,"musicid":msg.musicid});

        entry.save(function (err, musicObj) {
          if (err) {
            console.log(err);
          } else {
            console.log('saved successfully:', musicObj);
          }
        });
    });

    socket.on('query', function (data) {
        console.log("Query received : "+ data.query);

        music.find({$or:[{ "artist": { "$regex": data.query, "$options": "i" } },{ "title": { "$regex": data.query, "$options": "i" } }]}, function (err, musicObj) {
            if(err) {
                console.log(err);
            } else if (musicObj) {
                socket.emit('results', {"results":musicObj});
                //console.log(musicObj);
            } else {
                console.log("Nothing found");
            }
        });
    });

    socket.on('playreq', function (data) {
        //console.log("playsong socket id : "+data.socketid);
        socket.to(data.socketid).emit('sendover', {"musicid": data.musicid, "socketid": socket.id, "bool": true});
    });

    socket.on('chunk', function (data) {
        if (data.chunk) {
            //socket.to(data.socketid).emit('chunk', {'chunk': data.chunk});
            //console.log(data.chunk);
        } else {
            console.log("done");
        }
    });

    ss(socket).on('file', function (data) {
        console.log("-------------FILE -------------");
        
        data.on('readable', function (chunk) {
            console.log(chunk);
        });

        //socket.emit("chunk",{"chunk": data});

        /*var x = fs.createReadStream(data);

        fs.on('data', function (d) {
            console.log("d");
        });*/


        ss(socket).emit("chunk", stream, {},function(){});
        data.pipe(stream);
    });

    socket.on('disconnect', function (){
        console.log(socket.id + " has disconnected.");	
    });
});

http.listen(port, function () {
    console.log("Listening at port: " + port);
});
