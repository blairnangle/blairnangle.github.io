import React from 'react';

import Layout from './../components/Layout';
import ZoomImage from "../components/ZoomImage";

import beinnChuirn from '../../static/images/home/beinn-chuirn.jpg';
import beinnChuirnZoom from '../../static/images/home/beinn-chuirn-zoom.jpg';
import amaDablam from '../../static/images/home/ama-dablam.jpg';
import amaDablamZoom from '../../static/images/home/ama-dablam-zoom.jpg';

const photoCaptionMap = {
    one:
        {
            photo: beinnChuirn,
            zoom: beinnChuirnZoom,
            caption: 'Beinn Chùirn, Scotland. August, 2019.'
        },
    two:
        {
            photo: amaDablam,
            zoom: amaDablamZoom,
            caption: 'Ama Dablam, Nepal. November, 2019.'
        },
}

// const randomPhoto = () => {
//     const keys = Object.keys(photoCaptionMap);
//     return photoCaptionMap[keys[keys.length * Math.random() << 0]];
// }
//
// const aRandomPhoto = randomPhoto()

const Index = () => (
    <Layout>
        <div className="home-image">
            <ZoomImage src={photoCaptionMap.two.photo} zoomSrc={photoCaptionMap.two.zoom}
                       caption={photoCaptionMap.two.caption}/>
        </div>
    </Layout>
);

export default Index;
