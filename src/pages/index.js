import React from 'react';

import Layout from './../components/Layout';
import ZoomImage from "../components/ZoomImage";

import beinnChuirn from '../../static/images/home/beinn-chuirn.jpg';
import beinnChuirnZoom from '../../static/images/home/beinn-chuirn-zoom.jpg';

const Index = () => (
    <Layout>
        <div className="home-image">
            <ZoomImage src={beinnChuirn} zoomSrc={beinnChuirnZoom} caption='Beinn Chùirn, Scotland'/>
        </div>
    </Layout>
);

export default Index;
