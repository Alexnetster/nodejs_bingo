var bingo = {
	is_my_turn: Boolean,
	socket: null,
	
	init: function () {
		var self = this;
		
		this.is_my_turn = true;
		
		this.socket = io.connect('http://localhost:3000');
		
		//상대방이 숫자를 체크했을 때를 처리하는 부분입니다.
		this.socket.on("check_number", function (data) {
			//상대방이 체크한 숫자가 어디있는 지 찾아서 표시해주도록 함수를 호출합니다.
			self.where_is_it(data.num);
			self.print_msg(data.username + " checked '" + data.num + "'");
		});
		
		//게임이 시작되었을 때 처리하는 부분입니다.
		this.socket.on("game_started", function (data) {
			self.print_msg(data.username + " started this game.");
			$("#start_button").hide();
		});
		
		//접속자 목록을 업데이트 하는 부분입니다.
		this.socket.on("update_users", function (data) { 
			self.update_userlist(data);
		});
		
		//소켓이 연결되었을 때를 처리하는 부분입니다.
		this.socket.on("connect", function () {
			self.socket.emit("join", { username: $("#username").val() });
      console.log($("#username").val());
		});
		
		//빙고 판을 랜덤하게 만들기 위한 부분입니다. 우선 numbers라는 배열에 1부터 25까지 하나씩 넣어놓습니다.
		var numbers = [];
		for (var i=1; i<=25; i++) {
			numbers.push(i);
		}
		
		//랜덤하게 정렬합니다. 다시 말해, 순서를 뒤섞어 놓습니다.
		numbers.sort(function (a, b) {
			var temp = parseInt(Math.random() * 10);
			var isOddOrEven = temp % 2;
			var isPosOrNeg = temp > 5 ? 1 : -1;
			return (isOddOrEven*isPosOrNeg);
		});
	
		//빙고 판의 숫자를 클릭할 수 있는 부분을 지정합니다.
		$("table.bingo-board td").each(function (i) {
			$(this).html(numbers[i]);
			
			$(this).click(function () {
				//숫자를 선택하여 서버에게 메시지를 보내도록 함수를 호출합니다.
				self.select_num(this);
			});
		});
		
		//게임 시작 버튼을 클릭하면 서버에 메시지를 보내도록 합니다.
		$("#start_button").click(function () {
			self.socket.emit("game_start", { username: $("#username").val() });
			self.print_msg("You started this game.");
			$("#start_button").hide();
		});
	}, 
	
	//자신이 선택한 번호를 화면에 표시하고, 서버에 전달하여 다른 사용자들도 알 수 있도록 합니다.
	select_num: function (obj) {
		if (this.is_my_turn && !$(obj).attr("checked")) {
			//send num to other players
			this.socket.emit("select", { username: $("#username").val(), num: $(obj).text() });
			
			this.check_num(obj);
			
			this.is_my_turn = false;
		}
		else {
			this.print_msg("it is not your turn!");
		}
	},
	
	//전달받은 번호를 찾아서 체크 시킵니다.
	where_is_it: function (num) {
		var self = this;
		var obj = null;
		
		$("table.bingo-board td").each(function (i) {
			if ($(this).text() == num) {
				self.check_num(this);
			}
		});
	},
	
	//번호를 체크하는 메서드입니다. 
	check_num: function (obj) {
		$(obj).css("text-decoration", "line-through");
		$(obj).css("color", "#ccc");
		$(obj).css("background-color", "#999");
		$(obj).attr("checked", true);
	},
	
	//사용자 목록을 업데이트합니다.
	update_userlist: function (data) {
		var self = this;
		
		$("#list").empty();
		
		$.each(data, function (key, value) {
			var turn = "(-)&nbsp;";
		
			if (value.turn == true) {
				turn = "(*)&nbsp;";
			
				if (value.name == $("#username").val()) {
					self.is_my_turn = true;
				}
			}
		
			$("#list").append(turn + value.name + "<br />");
		});
		
	},
	
	print_msg: function (msg) {
		$("#logs").append(msg + "<br />");
	}
};


$(document).ready(function () {
	//페이지가 완전히 로드되면 빙고 객체를 초기화한다.
	bingo.init();
});