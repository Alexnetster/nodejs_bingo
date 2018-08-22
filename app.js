
/**
* Module dependencies.
*/

console.log("require('express')");
var express = require('express');
console.log("require('./routes')");
var routes = require('./routes');
console.log("require('./routes/user')");
var user = require('./routes/user');
console.log("require('http')");
var http = require('http');
console.log("require('path')");
var path = require('path');
console.log("require('socket.io')");
var socketio = require('socket.io'); //socket.io를 사용하기 위해 모듈을 추가합니다.

var app = express();

app.configure(function(){
	app.set('port', process.env.PORT || 3000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'pug');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
	app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/main', routes.main);
app.get('/users', user.list);


//웹서버를 위한 객체를 생성하고, socket.io를 연결합니다.
var server = http.createServer(app);
var io = socketio.listen(server);

//접속된 사용자들과 게임 턴을 위한 정보를 위한 변수들입니다.
var users = {};
var user_count = 0;
var turn_count = 0;

io.sockets.on('connection', function (socket) {
	
	//사용자 접속을 처리합니다.
	socket.on('join', function (data) {
		var username = data.username;
		
		socket.username = username;
		
		users[user_count] = {};
		users[user_count].name = username;
		users[user_count].turn = false;
    console.log("connnect, user_name:", username);
		
		io.sockets.emit('update_users', users);
		
		user_count++;
    console.log("connnect, user_count:", user_count);
	});
	
	//게임 시작 메시지를 처리합니다.
	socket.on('game_start', function (data) {
		socket.broadcast.emit("game_started", data);
		users[turn_count].turn = true;
		
		io.sockets.emit('update_users', users);
    console.log("game_start, user_name:", users[turn_count].name);
	});
	
	//숫자를 선택했을 때의 이벤트를 처리합니다.
	socket.on('select', function (data) {
		socket.broadcast.emit("check_number", data);
		
		users[turn_count].turn = false;
		turn_count++;
		if (turn_count >= user_count) {
			turn_count = 0;
		}
		users[turn_count].turn = true;
		
		io.sockets.emit('update_users', users);
    console.log("select, user_name:", users[turn_count].name);
	});
	
	//접속이 종료되었을 때를 처리합니다.
	socket.on('disconnect', function () {
    console.log("disconnect, user_name:", users[turn_count].name);
		delete users[socket.username];
	
		io.sockets.emit('update_users', users);
		
		user_count--;
    console.log("disconnect, user_count:", user_count);
	});
});


console.log("startup http://localhost:" + app.get('port'));
server.listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
  console.log("http://localhost:" + app.get('port'));
  console.log("http://localhost:" + app.get('port') + "/main?username=test1");
  console.log("http://localhost:" + app.get('port') + "/main?username=test2");
});