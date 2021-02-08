import React, { Component } from 'react';
import './CafeInfo.css';
import PropTypes from 'prop-types';
import { Row,Container} from 'reactstrap';

//daum 함수를 인식하기 위한 조치.
declare var daum:any;

class CafeInfo extends Component {
  constructor(props){
  super(props);
  this.state = {
  }
}

  _renderCafeinfos = () => {
    const cafes = this.state.cafes
    .map(cafe => {
      return  <ul key={cafe.id}>{cafe.cafeTitles}{cafe.cafeCallNums}{cafe.cafeImgs}{cafe.cafeAddrs}</ul>
    })
    return cafes
  }

  //데이터베이스에서 애견 카페 정보 받아오기
  _getCafeinfos =   async () => {
     const cafes = await this._callCafeinfo()
     this.setState({
         cafes
      })
      console.log(cafes)
 }
//url을 통해 장고를 통해 서울시 애견 카페 정보 불러오기
 _callCafeinfo = () => {
 return fetch('http://49.247.215.15:8000/api/CafeInfo')
 .then(response => response.json())
 .catch(err => console.log(err))
 }


   componentDidMount() {
    this._getCafeinfos();   //데이터베이스에서 애견 카페 정보 받아오기
    }

    async componentDidUpdate() {
      //div id='map' 위에 카카오지도 보이기.
      const el = document.getElementById('map');
      let map = new daum.maps.Map(el, {
        center: new daum.maps.LatLng(37.5642135, 126.99),//37.5642135, 126.99),  //페이지 요청시 지도의 중심
        level: 8, //지도 확대 수준. 숫자가 작을 수록 확대 비율이 높다.
      });


// 주소-좌표 변환 객체를 생성합니다
let geocoder = new daum.maps.services.Geocoder();

// 주소로 좌표를 검색합니다.
const cafes = await this.state.cafes;

for (let i = 0; i < cafes.length; i ++) {
geocoder.addressSearch(cafes[i].cafeAddrs, function(result, status) {

    // 정상적으로 검색이 완료됐으면
     if (status === daum.maps.services.Status.OK) {

        let coords = new daum.maps.LatLng(result[0].y, result[0].x);

        // 결과값으로 받은 위치를 마커로 표시합니다
        let marker = new daum.maps.Marker({
            map: map,
            position: coords
        });

        // 인포윈도우로 장소에 대한 설명을 표시합니다
        let infowindow = new daum.maps.InfoWindow({
            content:'<div class="wrap" style="color:black; padding:5px; font-size:12px;  height: 300px; width: 400px;" >' +
            '        <p class="title">' +
                    cafes[i].cafeTitles   +
            '        </p>' +
            '                <img src="'+cafes[i].cafeImgs+'" width="150px" height="150px">' +
            '            <div class="desc" style="font-size:3px;text-align:left;">' +
            '                <p>'+cafes[i].cafeAddrs+'</p>' +
            '                <p>'+cafes[i].cafeCallNums+'</p>' +
            '            </div>' +
            '</div>'
        });

    // 마커에 mouseover 이벤트와 mouseout 이벤트를 등록합니다
    // 이벤트 리스너로는 클로저를 만들어 등록합니다
    // for문에서 클로저를 만들어 주지 않으면 마지막 마커에만 이벤트가 등록됩니다
    daum.maps.event.addListener(marker, 'mouseover', makeOverListener(map, marker, infowindow));
    daum.maps.event.addListener(marker, 'mouseout', makeOutListener(infowindow));

    }
});
}
// 인포윈도우를 표시하는 클로저를 만드는 함수입니다
function makeOverListener(map, marker, infowindow) {
   return function() {
       infowindow.open(map, marker);
   };
}

// 인포윈도우를 닫는 클로저를 만드는 함수입니다
function makeOutListener(infowindow) {
   return function() {
       infowindow.close();
   };
}
    }

    render(){
      const { cafes } = this.state;
        return (
          <div style={{ "text-align": "center" }}>
            <p>서울시 애견카페 정보</p>
              <div id="map" style={{"height" : "800px", "width" : "1400px"}}></div>
        </div>
        );
    }
}

export default CafeInfo;
