/*
 * (C) Copyright 2014-2015 Kurento (http://kurento.org/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
var ws = new WebSocket('wss://' + location.host + '/one2many');
var video;
var chat;
var recordStart;
var recordStop;
var sendButton;
var input
var webRtcPeer;
var name;
var room;
var recordSpinner = [];

window.onload = function() {
	console = new Console();
	video = document.getElementById('video');
	chat = document.getElementById('chat');

	//방송 녹화 버튼을 누르면 등장하는 스피너들
	recordSpinner.push(document.getElementById('recordSpinner'));
	recordSpinner.push(document.getElementById('recordText'))
	//방송 녹화 종료후 발생하는 토스트
	recordSpinner.push(document.getElementById('recordSuc'))

	var urlParams = new URLSearchParams(window.location.search);
	name = urlParams.get('name'); 		  // 유저 ID 파싱
	var type = urlParams.get('type'); // 유저 유형(presenter or viewer) 파싱

 	if(type == 'presenter'){presenter();}
	else if(type == 'viewer'){
		room = urlParams.get('room'); // 입장할 방이름 파싱
		viewer();
		alert('방에 입장합니다.');
	}

	//영상 녹음, 녹음 정지 버튼 초기화
	recordStart = document.getElementById('recordStart').addEventListener('click',function() {
	recordstart();
	 });

	recordStop  = document.getElementById('recordStop').addEventListener('click',function() {
	recordstop()
	 });

	//채팅 전송버튼 초기화
 	sendButton = document.getElementById("sendButton").addEventListener('click',function() {
	input = document.getElementById("sendText").value;
	document.getElementById("sendText").value = "";
	 var chatP = document.createElement("P");
	 var chatText = document.createTextNode("나 : "+input);//parsedMessage.name +": "+parsedMessagea.contents);
	 chatP.appendChild(chatText);
	 document.getElementById("chat").appendChild(chatP);

	 //서버에 채팅 전송
	 var message = {
			 id : 'chatToServer',
			 name : name,
			 contents : input
	 }
	 sendMessage(message);

	 });

	 document.getElementById("sendText").value = "";

	}

	function recordstart(){
		var message = {
 			 id : 'recordStart',
 			 name : name
 	 }
	 sendMessage(message);
	 recordSpinner[0].style.display = "block";
	 recordSpinner[1].style.display = "block";
	}
	function recordstop(){
		var message = {
 			 id : 'recordStop',
 			 name : name
 	 }
	 sendMessage(message);
	 recordSpinner[0].style.display = "none";
	 recordSpinner[1].style.display = "none";
	 // Add the "show" class to DIV
  recordSpinner[2].className = "show";
  // After 3 seconds, remove the show class from DIV
  setTimeout(function(){ recordSpinner[2].className = recordSpinner[2].className.replace("show", ""); }, 3000);
	}

	function getUrlParameter(name) { // 현재 url 파싱 함수
	    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
	    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
	    var results = regex.exec(location.search);
	    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
	}


window.onbeforeunload = function() {
	ws.close();
}

ws.onmessage = function(message) {
	var parsedMessage = JSON.parse(message.data);
	console.info('Received message: ' + message.data);

	switch (parsedMessage.id) {

	case 'chatToClient':
	var chatP = document.createElement("P");
	var chatText = document.createTextNode(parsedMessage.name +": "+parsedMessage.contents);//parsedMessage.name +": "+parsedMessagea.contents);
	chatP.appendChild(chatText);

	document.getElementById("chat").appendChild(chatP);

		//alert("ttt");
		break;
	case 'presenterResponse':
		presenterResponse(parsedMessage);
		break;
	case 'viewerResponse':
		viewerResponse(parsedMessage);
		break;
	case 'roomInfor':
		waitingRoomResponse(parsedMessage);
		break;
	case 'stopCommunication':
		dispose();
		break;
	case 'iceCandidate':
		webRtcPeer.addIceCandidate(parsedMessage.candidate)
		break;
	default:
		console.error('Unrecognized message', parsedMessage);
	}
}

function presenterResponse(message) {
	if (message.response != 'accepted') {
		var errorMsg = message.message ? message.message : 'Unknow error';
		console.warn('Call not accepted for the following reason: ' + errorMsg);
		dispose();
	} else {
		webRtcPeer.processAnswer(message.sdpAnswer);
	}
}

function viewerResponse(message) {
	if (message.response != 'accepted') {
		var errorMsg = message.message ? message.message : 'Unknow error';
		console.warn('Call not accepted for the following reason: ' + errorMsg);
		dispose();
	} else {
		webRtcPeer.processAnswer(message.sdpAnswer);
	}
}

function waitingRoomResponse(message){
	var rooms = message.rooms;
	for(var i in rooms){
		addRoom(rooms[i]);
	}
}

function presenter() {
	if (!webRtcPeer) {
		showSpinner(video);

		var options = {
			localVideo: video,
			onicecandidate : onIceCandidate
	    }

		webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options, function(error) {
			if(error) return onError(error);

			this.generateOffer(onOfferPresenter);
		});
	}
}

function onOfferPresenter(error, offerSdp) {
    if (error) return onError(error);

	var message = {
		id : 'presenter',
		sdpOffer : offerSdp,
		name : name
	};
	sendMessage(message);
}

function viewer() {
	if (!webRtcPeer) {
		showSpinner(video);

		var options = {
			remoteVideo: video,
			onicecandidate : onIceCandidate
		}

		webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function(error) {
			if(error) return onError(error);

			this.generateOffer(onOfferViewer);
		});
	}
}

function onOfferViewer(error, offerSdp) {
	if (error) return onError(error)

	var message = {
		id : 'viewer',
		sdpOffer : offerSdp,
		room : room,
		name : name
	}
	sendMessage(message);
}

function onIceCandidate(candidate) {
	   console.log('Local candidate' + JSON.stringify(candidate));

	   var message = {
	      id : 'onIceCandidate',
	      candidate : candidate
	   }
	   sendMessage(message);
}

function stop() {
	if (webRtcPeer) {
		var message = {
				id : 'stop'
		}
		sendMessage(message);
		dispose();
	}
}

function dispose() {
	if (webRtcPeer) {
		webRtcPeer.dispose();
		webRtcPeer = null;
	}
	hideSpinner(video);
}

function sendMessage(message) {
	var jsonMessage = JSON.stringify(message);
	console.log('Senging message: ' + jsonMessage);
	ws.send(jsonMessage);
}

function showSpinner() {
	for (var i = 0; i < arguments.length; i++) {
		arguments[i].poster = './img/transparent-1px.png';
		arguments[i].style.background = 'center transparent url("./img/spinner.gif") no-repeat';
	}
}

function hideSpinner() {
	for (var i = 0; i < arguments.length; i++) {
		arguments[i].src = '';
		arguments[i].poster = './img/webrtc.png';
		arguments[i].style.background = '';
	}
}

/**
 * Lightbox utility (to display media pipeline image in a modal dialog)
 */
$(document).delegate('*[data-toggle="lightbox"]', 'click', function(event) {
	event.preventDefault();
	$(this).ekkoLightbox();
});
