import React, { Component } from 'react';
import './App.css';
import Video from './Video'; //Video component js 파일 등록
import CafeInfo from './CafeInfo'; //CafeInfo component js 파일 등록
import MicroDust from './MicroDust'; //MicroDust component js 파일 등록
import {TabContent, TabPane, Nav, NavItem, NavLink,Row, Col, Button, InputGroup,Container, Input,InputGroupAddon } from 'reactstrap';
import ReactPlayer from 'react-player' // 비디오 재생 모듈
import classnames from 'classnames';
//비디오 재생을 위한 model 설정
import Modal from 'react-modal';
const customStyles = {
  content : {
    top                   : '50%',
    left                  : '50%',
    right                 : 'auto',
    bottom                : 'auto',
    marginRight           : '-50%',
    transform             : 'translate(-50%, -50%)'
  }
};


class App extends Component {
  constructor(props) {
  super(props);
  this.state = {
    value: '', //아이디 입력창에서 변화하는 텍스트.
    id: '아이디를 입력해주세요',
    welcome: '',
    modalIsOpen: false,
    video_uri : require("./record/aaaaa님의 VOD^2019-04-05 14:04:28"), //VOD 목록이 없을 떄 출력되는 요소
    activeTab: '1', //Tab 위치를 나타냄.
  };

  this.toggle = this.toggle.bind(this);    //탭 토글 함수
  this.openModal = this.openModal.bind(this); //VOD 영상 모달을 열고 닫는 함수
  this.afterOpenModal = this.afterOpenModal.bind(this);
  this.closeModal = this.closeModal.bind(this);
  this.handleChange = this.handleChange.bind(this); //사용자가 아이디 입력창에 검색한 텍스트를 보여주는 함수
  this.handleSubmit = this.handleSubmit.bind(this);
  this.startBroadcast = this.startBroadcast.bind(this);
  this.goToRoomList = this.goToRoomList.bind(this);
}

toggle(tab) {
   if (this.state.activeTab !== tab) {
     this.setState({
       activeTab: tab
     });
   }
 }

openModal(user,date) {
  console.log(user);
  this.setState({modalIsOpen: true});  //modal창 열기
  const video_path = require("./record/"+user+"님의 VOD^"+date);
  this.setState({video_uri : video_path}); //재생 비디오 uri 입력
}

afterOpenModal() {

}

closeModal() {
  this.setState({modalIsOpen: false});
}

  handleChange(event) {
   this.setState({value: event.target.value});
  }

  handleSubmit(event){
    if(this.state.value !== '')
    this.setState({id: this.state.value, welcome: '님 환영합니다'});
  }

  startBroadcast(event){
    if(this.state.id === '아이디를 입력해주세요'){
      alert("아이디를 입력해주세요.")
    }else{
    event.preventDefault();
      window.location = "https://49.247.215.15:8443/?type=presenter&name="+this.state.id;
    }
  }
  goToRoomList(event){
      if(this.state.id === '아이디를 입력해주세요'){
      alert("아이디를 입력해주세요.")
    }else{
      event.preventDefault();
      window.location = "https://49.247.215.15:8443/broadCastListWeb.html?name="+this.state.id;
    }
  }

  //비디오 리스트 정보를 통해 만든 비디오 컴포넌트 return
  _renderVideos = () => {
    const videos = this.state.videos
    .sort((a, b) => a.id < b.id)    //비디오 최신 순으로 정렬
    .map(video => {
      console.log(videos)
      return  <Col xs="6" onClick={() => this.openModal(video.user, video.date)}><Video key={video.id} title={video.title} user={video.user} date={video.date}/>
      </Col>
    })
    return videos
  }
  //백엔드에서 비디오 리스트 정보 받아 온 후 state에 저장
  _getVideos =   async () => {
     const videos = await this._callApi()
     this.setState({
         videos
     })
 }
 //url을 통해 백엔드에 비디오 리스트 정보 요청
 _callApi = () => {
 return fetch('http://49.247.215.15:8000/api/VodInfo')
 .then(response => response.json())
 .catch(err => console.log(err))
 }

//컴포넌트 마운트 후 비디오 리스트 정보 데이터 백엔드에서 받아오기.
  async componentDidMount() {
       try {
          this._getVideos();
          Modal.setAppElement('body');
       } catch (e) {
           console.log(e);
       }
   }

  render() {
    const { videos } = this.state;
    return (
<div className="App">
  {/*네비게이션 탭 JSX*/}
  <Row>
  <Nav tabs>
    <NavItem>
      <NavLink
        className={classnames({ active: this.state.activeTab === '1' })}
        onClick={() => { this.toggle('1'); }}
      >
        방송
          </NavLink>
    </NavItem>
    <NavItem>
      <NavLink
        className={classnames({ active: this.state.activeTab === '2' })}
        onClick={() => { this.toggle('2'); }}
      >
        애견카페 정보
          </NavLink>
    </NavItem>
    <NavItem>
      <NavLink
        className={classnames({ active: this.state.activeTab === '3' })}
        onClick={() => { this.toggle('3'); }}
      >
        미세먼지 확인
          </NavLink>
    </NavItem>
  </Nav>
</Row>
  {/*탭 내부 요소 JSX*/}
  {/*첫번쨰 탭, 방송보기, 방송접속, VOD 시청 페이지*/}
  <TabContent activeTab={this.state.activeTab}>
    <br /><br />
    <TabPane tabId="1">
      <Container body className="text-center">
        <a >{this.state.id}{this.state.welcome}</a>
        <InputGroup size="lg" className="InputGroup">
          <Input placeholder="아이디입력" value={this.state.value} onChange={this.handleChange} />
          <InputGroupAddon addonType="append">
            <Button onClick={this.handleSubmit} >Enter</Button>
          </InputGroupAddon>
        </InputGroup>
        <br />
        <Button color="danger" size="lg" onClick={this.startBroadcast} >방송하기</Button>
        <Button color="primary" size="lg" onClick={this.goToRoomList} >시청하기</Button>
        <br /><br />
        <Row body className="text-center">
          <Col sm="12" md={{ size: 6, offset: 3 }}>방송 다시보기</Col>
            {videos ? this._renderVideos() : "Loading"}
        </Row>
      </Container>
    </TabPane>
    {/*두번째 탭, 애견카페 위치 정보를 지도에 표시하는 페이지 */}
    <TabPane tabId="2">
      <Container body className="text-center">
        <br />
        <br /><br />
        <Row body className="text-center">
          <CafeInfo/>
        </Row>
      </Container>
    </TabPane>
  {/*세번째 탭, 미세먼지 농도 정보를 지도에 표시하는 페이지 */}
  <TabPane tabId="3">
    <Container body className="text-center">
      <br />
      <br /><br />
      <Row body className="text-center">
        <MicroDust/>
      </Row>
    </Container>
  </TabPane>
</TabContent>

  {/*VOD 영상이 재생되는 Modal JSX*/}
  <Modal
    isOpen={this.state.modalIsOpen}
    onRequestClose={this.closeModal}
    style={customStyles}
    contentLabel="Example Modal">
    <ReactPlayer
      url={this.state.video_uri}
      playing
      controls />
    <Button body className="text-center" color="danger" size="lg" onClick={this.closeModal}>close</Button>
  </Modal>
</div>
    );
  }
}



export default App;
