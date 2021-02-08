import React from 'react';
import './Video.css';
import PropTypes from 'prop-types';
import { Container,Card, CardImg, CardText, CardBody,CardTitle} from 'reactstrap';


function Video({title, user, date}) {
  const thumbnail_path = require("./thumbnail/"+user+"님의 VOD^"+date+"-thumbnail-320x240-0001.png");

    return (
    <div className="Video" body className="text-center" style={{ color: '#c5c8c9',fontSize:'15px' }}>
    <Card>
      <CardImg top width="100%" src={thumbnail_path} alt="Card image cap" />
        <CardBody>
          <CardTitle>{title}님의 동영상</CardTitle>
          <CardText>{date}</CardText>
        </CardBody>
    </Card>
  </div>
)
}



Video.propTypes = {
  title: PropTypes.string.isRequired,
  user: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired
}


export default Video;
