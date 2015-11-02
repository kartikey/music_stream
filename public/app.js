var musicApp = angular.module('musicApp',['ui.bootstrap']);
var socket = io();
var stream = ss.createStream();
ss.forceBase64 = true;

musicApp.controller('chatController', function ($scope, $q){
  
    $scope.results = [];
    $scope.songList = [];
    $scope.results = [];
    $scope.musicid = 0;

    var dropbox = document.getElementById("dropbox");

    dropbox.addEventListener("dragenter", dragenter, false);
    dropbox.addEventListener("dragover", dragover, false);
    dropbox.addEventListener("drop", drop, false);

    function dragenter(e) {
        e.stopPropagation();
        e.preventDefault();
    }

    function dragover(e) {
        e.stopPropagation();
        e.preventDefault();
    }

    function drop(e) {
        e.stopPropagation();
        e.preventDefault();


        var dt = e.dataTransfer;
        var files = dt.files;
        var x = 0;
      
        // For each file dragged and dropped check ID3 tag 
        // and send to server.
        _.forEach(files,function (file) {
            x++;
            file.musicid = $scope.musicid;
            $scope.musicid += 1;

            id3(file, function(err, tags) {        
                file.title = tags.v2.title || tags.v1.title || tags.title;
                file.artist = tags.v2.artist || tags.v1.artist || tags.artist;
                $scope.songList.push(file);
                socket.emit("add_entry", {"title": file.title, "artist":file.artist,"musicid":file.musicid});
                $scope.$apply();
            });
        });    
    }

    // Function called when search bar search button is pressed.
    // Sends string to the server.
    $scope.send = function () {
        socket.emit("query", {"query":$scope.query});
    };

    // Results from the query sent using send function.
    socket.on('results', function (data) {
        $scope.results = data.results;
        $scope.$apply();
    });

    // Received request to playsong from other client.
    socket.on('sendover', function (data) {
        console.log("sendover");
        var f;

        _.forEach($scope.songList, function (song) {
            if(song.musicid == data.musicid) {
                f = song;
            }
        });

        /*var i = 0;


        function dothis () {
            var x = f.slice(i,i+262144);

            socket.emit('chunk', {"chunk": x, "socketid":data.socketid}, function (res) {
                if(res.bool) {
                    i=i+262145;
                    dothis();
                } else {
                    return;
                }
            });
        }

        dothis();*/


   
    

    var r = new FileReader();

    var l = r.readAsBinaryString(f);

        //ss(socket).emit("file", stream, {},function(){});
    var bs = ss.createBlobReadStream(f); //.pipe(stream);

    bs.on("data", function (data) {
        var d = data.btoa();
        console.log(d);
        socket.emit('chunk',{"chunk" : data});
    });
    

});

    socket.on("chunk", function (data) {
        console.log("chunking");
        console.log(data.chunk);
    });

    /*ss(socket).on('file', function(stream) {
        objectURL = URL.createObjectURL(stream);
        console.log(objectURL);
    });*/

});

musicApp.directive('songdir', function(){
    return {
        link: function(scope, elm, attr){
            scope.playSong = function () {
                socket.emit("playreq",{"musicid": attr.musicid, "socketid": attr.socketid});
            };
        }
    }
});