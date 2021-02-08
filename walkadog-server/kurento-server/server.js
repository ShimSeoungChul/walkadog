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

//vod를 위한 동영상 이름, 사용자 이름, 썸네일 이름 저장을 위한 percona(mysql) 연동 모듈
var mysql = require('mysql'); 

//동영상 썸네일 추출 모듈
const ThumbnailGenerator = require('video-thumbnail-generator').default;

 // 서울 시간 측정을 위한  모듈
 var moment = require('moment');
 require('moment-timezone');
 moment.tz.setDefault("Asia/Seoul");

var path = require('path');
var url = require('url');
var express = require('express');
var minimist = require('minimist');
var ws = require('ws'); // 웹소켓 라이브러리
var kurento = require('kurento-client');
var fs    = require('fs');
var https = require('https');

var argv = minimist(process.argv.slice(2), {
    default: {
        as_uri: 'https://localhost:8443',
        ws_uri: 'ws://localhost:8888/kurento',
        file_uri: 'file:///opt/django-react/frontend/src/record'
    }
});

var options =
{
  key:  fs.readFileSync('keys/server.key'),
  cert: fs.readFileSync('keys/server.crt')
};

var app = express();

/*
 * Definition of global variables.
 */
var idCounter = 0;
var candidatesQueue = {};
var kurentoClient = null;
var presenter =  {};
var viewers = [];
var sessionNames = [];
var noPresenterMessage = 'No active presenter. Try again later...';

/*
 * Server startup
 */
var asUrl = url.parse(argv.as_uri);
var port = asUrl.port;
var server = https.createServer(options, app).listen(port, function() {
    console.log('Kurento Tutorial started');
    console.log('Open ' + url.format(asUrl) + ' with a WebRTC capable browser');
});

var wss = new ws.Server({
    server : server,
    path : '/one2many'
});

function nextUniqueId() {
	idCounter++;
	return idCounter.toString();
}

// 접속한 유저의 ID와 웹소켓을 담는 클래스
class Clients{
  constructor(){
    this.clientList = {};
    this.saveClient = this.saveClient.bind(this);
    this.room = {};
    this.deleteClient = this.deleteClient.bind(this);
    this.recordingVideo = {};
  }
  saveClient(username, roomname, client){
    this.clientList[username] = client;
    this.room[username] = roomname;
  }
  deleteClient(username){
    this.clientList[username] = "";
    delete this.clientList[username];
  }
}
//create an array to hold your connections
const clients = new Clients();

//방송룸을 관리하는 객체
const BcRooms = {};

//Management of WebSocket messages
wss.on('connection', function(ws) {

	var sessionId = nextUniqueId();
	console.log('Connection received with sessionId ' + sessionId);

    ws.on('error', function(error) {
        console.log('Connection ' + sessionId + ' error');
        stop(sessionId);
    });

    ws.on('close', function() {
        console.log('Connection ' + sessionId + ' closed');
          stop(sessionId);

    });

    ws.on('message', function(_message) {
        var message = JSON.parse(_message);

        console.log('Connection ' + sessionId + ' received message ', message);

        switch (message.id) {
        case 'recordStart':
        console.log("start 받음")
        recordStart(message.name);
        break;
        console.log("stop 받음")
        case 'recordStop':
        recordStop(message.name);
        break;

        case 'chatToServer':
        var roomname = clients.room[message.name];
        var roomUsersParsing = BcRooms[roomname].split('|'); // 해당 방송룸의 사용자들 정보 파싱

        for(i in roomUsersParsing){
         if(roomUsersParsing[i] !== '' && roomUsersParsing[i] !== message.name){
           console.log("user!!!!!!!:",roomUsersParsing[i]);
              var username = roomUsersParsing[i];
            clients.clientList[username].send(JSON.stringify({
              id : 'chatToClient',
              name : message.name,
              contents : message.contents
            }));
          }
       }

        break;

        case 'presenter':
        sessionNames[sessionId]= message.name;
        console.log("presenter:"+sessionNames[sessionId]);

        clients.saveClient(message.name, message.name, ws);   // 클라이언트의 소켓 객체 저장
        BcRooms[message.name] = message.name; //방만들기,정보 초기화
        console.log("방만들었음!!!!!!!!!!! 이름:"+BcRooms[message.name]);
			startPresenter(sessionId, ws, message.sdpOffer, message.name, function(error, sdpAnswer) {
				if (error) {
					return ws.send(JSON.stringify({
						id : 'presenterResponse',
						response : 'rejected',
						message : error
					}));
				}
				ws.send(JSON.stringify({
					id : 'presenterResponse',
					response : 'accepted',
					sdpAnswer : sdpAnswer
				}));
			});
			break;

        case 'viewer':
        sessionNames[sessionId]= message.name;
        console.log("viewer:"+sessionNames[sessionId]);

        clients.saveClient(message.name, message.room, ws);   // 클라이언트의 소켓 객체 저장
        BcRooms[message.room] = ("|"+BcRooms[message.room]+"|"+message.name);
        //해당 방송 접속 유저 리스트에 사용자 추가.

			startViewer(sessionId, ws, message.sdpOffer, message.room,function(error, sdpAnswer) {
				if (error) {
					return ws.send(JSON.stringify({
						id : 'viewerResponse',
						response : 'rejected',
						message : error
					}));
				}

				ws.send(JSON.stringify({
					id : 'viewerResponse',
					response : 'accepted',
					sdpAnswer : sdpAnswer
				}));

			});
			break;

      case 'roomWaiting':    //대기방에 입장한 유저에게 방 목록을 담은 메세지 전달
        let rooms=[];
        for(let key in BcRooms){
          if(BcRooms[key] != null)
          rooms.push(key);
        }

          ws.send(JSON.stringify({
  					id : 'roomListResponse',
            roomName : rooms
  				}));

      break;

        case 'stop':
            stop(sessionId);
            break;

        case 'onIceCandidate':
            onIceCandidate(sessionId, message.candidate);
            break;

        default:
            ws.send(JSON.stringify({
                id : 'error',
                message : 'Invalid message ' + message
            }));
            break;
        }
    });
});


 // 영상 녹화 함수
function recordStart(userName) {

  var date = moment().format('YYYY-MM-DD HH:mm:ss');  //현재 시간 기록
  var roomName = clients.room[userName];              //사용자가 시청중인 방이름 가져오기

  //녹화 영상 저장 위치, 사용자 이름 저장
  recordParams = {
  uri : 'file:///opt/django-react/frontend/src/record/'+ userName + '님의 VOD^'+date.toString()
  };

    //영상 기록을 위해 해당 영상 파이프라인에 recorderEndpoint 추가
    presenter[roomName].pipeline.create("RecorderEndpoint", recordParams, function(error, recorderEndpoint) {
       if (error) {
           console.log("Recorder problem");
           return sendError(res, 500, error);
       }

       //영상 기록 시작
       recorderEndpoint.record();
       presenter[roomName].recordRtcendpoint = recorderEndpoint;
       presenter[roomName].recordRtcendpoint.record();
       presenter[roomName].webRtcEndpoint.connect(recorderEndpoint, function(error) {
             if (error) {
                 return callback(error);
             }
             //녹화 영상 저장 위치및 이름 저장
             var sourcePath = '/opt/django-react/frontend/src/record/'+ userName.toString() + '님의 VOD^'+date.toString();
            clients.recordingVideo[userName] = sourcePath;

            //영상 정보 데이터베이스에 저장
            var conn = mysql.createConnection({ 
          	  host     : 'localhost', 
          	  user     : 'root', 
          	  password : 'teamnova', 
          	  database : 'walkadog' 
          	});
          	conn.connect(); 
          	var sql = "insert into post_vodinfo (user, title, date) VALUES ?";
            var post = [userName, userName.toString()+'님의 VOD^'+date.toString() , date.toString()]; 

            var records = [
                            [userName.toString(), userName.toString(), date.toString()]
            ];
            conn.query(sql, [records],  function(err){ 
          	if(err){ 
          	console.log(err); 
          	 conn.end();
          	}else{ 
          	console.log('영상 정보 저장성공');
          	    conn.end();
          	}
          }); 

    });
  });

}

// 영상 녹화 완료 함수
function recordStop(userName){
  var roomName = clients.room[userName];
    presenter[roomName].recordRtcendpoint.stop();

    //녹화 영상 썸네일 저장
     const tg = new ThumbnailGenerator({
       sourcePath: clients.recordingVideo[userName],
       thumbnailPath: '/opt/django-react/frontend/src/thumbnail',
       tmpDir: '/tmp/' //only required if you can't write to /tmp/ and you need to generate gifs
     });

     setTimeout(() => {
       tg.generate({
         count: 1,
         size: '320x240'
       })
       .then(console.log);
     }, 100);

}



// Recover kurentoClient for the first time.
function getKurentoClient(callback) {
    if (kurentoClient !== null) {
        return callback(null, kurentoClient);
    }

    kurento(argv.ws_uri, function(error, _kurentoClient) {
        if (error) {
            console.log("Could not find media server at address " + argv.ws_uri);
            return callback("Could not find media server at address" + argv.ws_uri
                    + ". Exiting with error " + error);
        }

        kurentoClient = _kurentoClient;
        callback(null, kurentoClient);
    });
}

function startPresenter(sessionId, ws, sdpOffer, name ,callback) {
	clearCandidatesQueue(sessionId);

presenter[name] = null;
presenter[name] = {
		id : sessionId,
		pipeline : null,
		webRtcEndpoint : null
	}

	getKurentoClient(function(error, kurentoClient) {
		if (error) {
			stop(sessionId);
			return callback(error);
		}

		if (presenter[name] === null) {
			stop(sessionId);
			return callback(noPresenterMessage);
		}

		kurentoClient.create('MediaPipeline', function(error, pipeline) {
			if (error) {
				stop(sessionId);
				return callback(error);
			}

			if (presenter[name] === null) {
				stop(sessionId);
				return callback(noPresenterMessage);
			}

			presenter[name].pipeline = pipeline;
			pipeline.create('WebRtcEndpoint', function(error, webRtcEndpoint) {
				if (error) {
					stop(sessionId);
					return callback(error);
				}

				if (presenter[name] === null) {
					stop(sessionId);
					return callback(noPresenterMessage);
				}

				presenter[name].webRtcEndpoint = webRtcEndpoint;

                if (candidatesQueue[sessionId]) {
                    while(candidatesQueue[sessionId].length) {
                        var candidate = candidatesQueue[sessionId].shift();
                        webRtcEndpoint.addIceCandidate(candidate);
                    }
                }

                webRtcEndpoint.on('OnIceCandidate', function(event) {
                    var candidate = kurento.getComplexType('IceCandidate')(event.candidate);
                    ws.send(JSON.stringify({
                        id : 'iceCandidate',
                        candidate : candidate
                    }));
                });

				webRtcEndpoint.processOffer(sdpOffer, function(error, sdpAnswer) {
					if (error) {
						stop(sessionId);
						return callback(error);
					}

					if (presenter[name] === null) {
						stop(sessionId);
						return callback(noPresenterMessage);
					}

					callback(null, sdpAnswer);
				});

                webRtcEndpoint.gatherCandidates(function(error) {
                    if (error) {
                        stop(sessionId);
                        return callback(error);
                    }
                });
            });
        });
	});
}

function startViewer(sessionId, ws, sdpOffer, name, callback) {
	clearCandidatesQueue(sessionId);
/*
	if (presenter[sessionNames[sessionId]] === null) {
		stop(sessionId);
		return callback(noPresenterMessage);
	}
*/
	presenter[name].pipeline.create('WebRtcEndpoint', function(error, webRtcEndpoint) {
		if (error) {
			stop(sessionId);
			return callback(error);
		}
		viewers[sessionId] = {
			"webRtcEndpoint" : webRtcEndpoint,
			"ws" : ws
		}

		if (presenter[name] === null) {
			stop(sessionId);
			return callback(noPresenterMessage);
		}

		if (candidatesQueue[sessionId]) {
			while(candidatesQueue[sessionId].length) {
				var candidate = candidatesQueue[sessionId].shift();
				webRtcEndpoint.addIceCandidate(candidate);
			}
		}

        webRtcEndpoint.on('OnIceCandidate', function(event) {
            var candidate = kurento.getComplexType('IceCandidate')(event.candidate);
            ws.send(JSON.stringify({
                id : 'iceCandidate',
                candidate : candidate
            }));
        });

		webRtcEndpoint.processOffer(sdpOffer, function(error, sdpAnswer) {
			if (error) {
				stop(sessionId);
				return callback(error);
			}
			if (presenter[name] === null) {
				stop(sessionId);
				return callback(noPresenterMessage);
			}

			presenter[name].webRtcEndpoint.connect(webRtcEndpoint, function(error) {
				if (error) {
					stop(sessionId);
					return callback(error);
				}
				if (presenter === null) {
					stop(sessionId);
					return callback(noPresenterMessage);
				}

				callback(null, sdpAnswer);
		        webRtcEndpoint.gatherCandidates(function(error) {
		            if (error) {
			            stop(sessionId);
			            return callback(error);
		            }
		        });
		    });
	    });
	});
}

// Create a hub port
function createHubPort(callback) {
    getComposite(function(error, _composite) {
        if (error) {
            return callback(error);
        }
        _composite.createHubPort( function(error, _hubPort) {
            console.info("Creating hubPort");
            if (error) {
                return callback(error);
            }
            callback( null, _hubPort );
        });
    });
}

function clearCandidatesQueue(sessionId) {
	if (candidatesQueue[sessionId]) {
		delete candidatesQueue[sessionId];
	}
}

function stop(sessionId) {
  var name = sessionNames[sessionId];

//방송자가 방을 나갈때 해당 방 삭제, 스트리밍 파이프라인 삭제
if (presenter[name]) {
  	for (var i in viewers) {
			var viewer = viewers[i];
			if (viewer.ws) {
				viewer.ws.send(JSON.stringify({
					id : 'stopCommunication'
				}));
			}
		}
      clients.deleteClient(name);   // 클라이언트 id, 소켓 삭제

      var tmp = BcRooms[name];
      var roomUsersParsing = BcRooms[name].split('|');
      //let roomUsersParsing = tmp.split('|'); // 해당 방송룸의 사용자들 정보 파싱
      for(var i in roomUsersParsing){
        if(roomUsersParsing[i] !== '')
         clients.deleteClient(roomUsersParsing[i]);
       }

      BcRooms[name] = null;
      delete BcRooms[name];
      console.log("close presenter:"+name);
	    presenter[name].pipeline.release();
	    presenter[name] = null;
		    viewers = [];

	} else if (viewers[sessionId]) { //시청자가 방을 나갈때 방에서 해당 시청자 이름 삭제

    let roomname = clients.room[name];
    clients.deleteClient(name);   // 클라이언트 id, 소켓 삭제

    let tmp = BcRooms[roomname];
    let roomUsersParsing = tmp.split('|'); // 해당 방송룸의 사용자들 정보 파싱
    let newRoomList;
    for(let i in roomUsersParsing){
      if(roomUsersParsing[i] !== name)
      newRoomList += (roomUsersParsing[i] + '|');
    }

		viewers[sessionId].webRtcEndpoint.release();
		delete viewers[sessionId];
	}

	clearCandidatesQueue(sessionId);

	if (viewers.length < 1 && !presenter) {
        console.log('Closing kurento client');
        kurentoClient.close();
        kurentoClient = null;
    }
}

function onIceCandidate(sessionId, _candidate) {
    var name = sessionNames[sessionId];
    var candidate = kurento.getComplexType('IceCandidate')(_candidate);

    if (presenter[name] && presenter[name].id === sessionId && presenter[name].webRtcEndpoint) {
        console.info('Sending presenter candidate');
        presenter[name].webRtcEndpoint.addIceCandidate(candidate);
    }
    else if (viewers[sessionId] && viewers[sessionId].webRtcEndpoint) {
        console.info('Sending viewer candidate');
        viewers[sessionId].webRtcEndpoint.addIceCandidate(candidate);
    }
    else {
        console.info('Queueing candidate');
        if (!candidatesQueue[sessionId]) {
            candidatesQueue[sessionId] = [];
        }
        candidatesQueue[sessionId].push(candidate);
    }
}

app.use(express.static(path.join(__dirname, 'static')));
