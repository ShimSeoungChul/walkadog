import React, { Component } from 'react';
import './CafeInfo.css';
import { Container, Row, Col } from 'reactstrap';

//daum 함수를 인식하기 위한 조치.
declare var daum:any;

//서울시 각 구의 위도,경도도 좌표입니다. 순서는 다음과 같습니다.
//0.종로 1.중구 2.용산 3.성동 5.광진
//6.동대문 7.중랑 8.성북 9.강북 10.도봉
//11.노원 12.은평 13.서대문 14.마포 15.양천
//16.강서 17.구로 18.금천 19.영등포 20.동작
//21.관악 22.서초 23.강남 24.송파 25.강동
const seoulLocationX = [
  "37.592128000000002", "37.557335000000002", "37.528582", "37.54824", "37.543059",
  "37.579132000000001", "37.595193999999999",  "37.602916999999998",  "37.640709999999999",  "37.666330000000002",
  "37.649734000000002",  "37.649734000000002",  "37.574997000000003",  "37.574997000000003",  "37.521940000000001",
  "37.558439999999997",  "37.491580999999996",  "37.457774999999998",  "37.519739000000001",  "37.496074999999998",
  "37.464570000000002",  "37.470739999999999",  "37.493712000000002",  "37.502167999999998",  "37.547522000000001"
]

const seoulLocationY = [
  "126.97942","126.997985","126.981987","127.043114","127.088351",
  "127.057221","127.095157","127.01969699999999","127.013272","127.034471",
  "127.077134","126.929119","126.94115499999999","126.910326","126.85752599999999",
  "126.824859","126.858351","126.902894","126.91230299999999","126.953734",
  "126.947435","127.03324499999999","127.06533399999999","127.118003","127.149107"
]


const seulLocations = [
  "종로", "중구", "용산", "성동", "광진",
  "동대문", "중랑", "성북", "강북", "도봉",
  "노원", "은평", "서대문", "마포", "양천",
  "강서", "구로", "금천", "영등포", "동작",
  "관악", "서초", "강남", "송파", "강동"
]


class MicroDust extends Component {
  constructor(props){
  super(props);
  this.state = {
    microLevelArr: [],
  }
}


  _MicroDustparsing = async () => {
  await this.state.microDusts

  }

  //데이터베이스에서 애견 카페 정보 받아오기
  _getMicroDustinfos =   async () => {
     const microDusts = await this._callMicroDustinfo()
     this.setState({
         microDusts
      })
      //서울 각 구별 미세먼지 데이터 배열로 저장
       microDusts.map(microDust => {
         this.state.microLevelArr = [
           microDust.종로, microDust.중구, microDust.용산, microDust.성동, microDust.광진,
           microDust.동대문, microDust.중랑, microDust.성북, microDust.강북, microDust.도봉,
           microDust.노원, microDust.은평, microDust.서대문, microDust.마포, microDust.양천,
           microDust.강서, microDust.구로, microDust.금천, microDust.영등포, microDust.동작,
           microDust.관악, microDust.서초, microDust.강남, microDust.송파, microDust.강동
         ]
       })

       console.log(this.state.microLevelArr)
 }
//url을 통해 장고를 통해 서울시 애견 카페 정보 불러오기
 _callMicroDustinfo = () => {
 return fetch('http://49.247.215.15:8000/api/MicroDustInfo')
 .then(response => response.json())
 .catch(err => console.log(err))
 }


   componentDidMount() {
    this._getMicroDustinfos();   //데이터베이스에서 애견 카페 정보 받아오기
    }

componentDidUpdate() {
  //div id='microDustmap' 위에 카카오지도 보이기.
  const el = document.getElementById('microDustmap');
  let map = new daum.maps.Map(el, {
    center: new daum.maps.LatLng(37.5642135, 126.99), //페이지 요청시 지도의 중심
    level: 8, //지도 확대 수준. 숫자가 작을 수록 확대 비율이 높다.
  });

  //서울 각 구의 이름과 미세먼지 농도를 출력하는 반복문.
  for(let i=0; i<25; i++){

    //미세먼지 측정 농도에 따라 표시 배경색을 다르게 합니다.
    let color="powderblue";
    if(this.state.microLevelArr[i]<=30){ //미세먼지 좋음
      color = "#14efff";
    }else if(30 < this.state.microLevelArr[i] && this.state.microLevelArr[i] <=80 ){ //미세먼지 보통
      color = "#7bd593";
    }else if(80 < this.state.microLevelArr[i] && this.state.microLevelArr[i] <=150){ //미세먼지 나쁨
      color = "#ff5252";
    }else if(150 < this.state.microLevelArr[i]){ //미세먼지 매우나쁨
      color = "#000";
    }

    // 커스텀 오버레이에 표시할 내용입니다. 커스텀 오버레이는 서울 각 구의 이름과 측정 미세먼지 농도를 나타냅니다.
    // HTML 문자열 또는 Dom Element 입니다
    var content = '<div class="overlaybox">' +
      '<p style="color: black; font-size:60%">'+seulLocations[i]+'</p>' +
      '<div style="background-color:'+color+'; font-size:50%; border-radius: 25px; padding: 10px">'+ this.state.microLevelArr[i] +'</div>' +
      '</div>';


    // 커스텀 오버레이가 표시될 위치입니다
    var position = new daum.maps.LatLng(seoulLocationX[i], seoulLocationY[i]);

    // 커스텀 오버레이를 생성합니다
    var customOverlay = new daum.maps.CustomOverlay({
      position: position,
      content: content,
      xAnchor: 0.3,
      yAnchor: 0.91
    });

    // 커스텀 오버레이를 지도에 표시합니다
    customOverlay.setMap(map);
  }

}


render(){
  const { microDusts } = this.state;
  return (
    <div style={{ "text-align": "center" }}>
      <p>서울시 미세먼지 농도</p>
      {/*측정시간 데이터가 로딩되지 않으면 rendering 되지 않습니다.*/}
      {microDusts && microDusts.map(function(microDust, index) {
        return <p key={index}>측정시간: {microDust.측정시간}</p>;
      })}
      <div id="microDustmap" style={{ "height": "800px", "width": "1400px" }}></div>
      <br />
      {/*미세먼지 농도에 따른 좋음, 보통, 나쁨, 매우나쁨 기준에 대한 jsx*/}
      <Row style={{ "font-size": "60%" }}>
        <Col style={{ "background-color": "#14efff" }}>~30 좋음</Col>
        <Col style={{ "background-color": "#7bd593" }}>보통 ~80</Col>
        <Col style={{ "background-color": "#ff5252" }}>나쁨 ~150</Col>
        <Col style={{ "background-color": "#000" }}>매우나쁨 151~</Col>
      </Row>
    </div>

  );
}
}


export default MicroDust;
