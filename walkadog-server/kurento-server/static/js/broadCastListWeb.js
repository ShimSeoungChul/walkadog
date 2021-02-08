
var connection = new WebSocket('wss://' + location.host + '/one2many');
var video;
var webRtcPeer;
var name;
var list = new Array();

 window.onload = function() {
   var urlParams = new URLSearchParams(window.location.search);
   name = urlParams.get('name'); 		  // 유저 ID 파싱

   var message = {
  		id : 'roomWaiting',
  		name : name
  	};
   connection.onopen = () => {
     sendMessage(message);
   }
   connection.onerror = error => {
     console.log(`WebSocket error: ${error}`);
   }

 }

 connection.onmessage = function(message) {
  var parsedMessage = JSON.parse(message.data);
  switch (parsedMessage.id) {
  case 'roomListResponse':
    roomListResponse(parsedMessage);
    break;
  default:

  }
 }

 function roomListResponse(message) {

	 var rooms = message.roomName;
   for(var i in rooms){
        addRoom(rooms[i]);
   }

 }

 function addRoom(id){

	 var roomButton = document.createElement('BUTTON');
	 var buttonText = document.createTextNode(id +" 님의 방입니다.");
	 roomButton.appendChild(buttonText);
	 roomButton.setAttribute("id", id);

	 roomButton.classList.add('btn', 'btn-default', 'btn-lg', 'btn-block');   //엘리먼트에 클래스 추가. 여러 클래스를 추가할 때는 ,를 사용한다.


	 document.getElementById("roomList").appendChild(roomButton);
	 document.getElementById(id).addEventListener('click',function() {
		  window.location = "https://49.247.215.15:8443/?type=viewer&name="+name+"&room="+id;
	 });

 }

function sendMessage(message) {
 var jsonMessage = JSON.stringify(message);
 connection.send(jsonMessage);
}

function getUrlParameter(name) { // 현재 url 파싱 함수
   name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
   var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
   var results = regex.exec(location.search);
   return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}
