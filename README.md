# PeerKit client

## What is PeerKit?

PeerKit is a software-as-a-service that allows assets like images or files on your webpage to be downloaded peer-to-peer instead of from a central server. When many peers are accessing the same asset, PeerKit allows the peers to share with each other, saving you bandwidth and server load.

We're not quite ready for production use but you can sign up for our first beta on our website: http://peerkit.com

## Features

- Integrate into website by just including Javascript
- Automatically serves selected files peer-to-peer
- Falls back to the original file host when peers are not available
- Configurable hashing methods allow you to adjust file security (hashes are distributed by authoritative PeerKit server)
- Supports any format displayable on webpage
- Intelligently chunks files and downloads from multiple peers when available
- Optimized for low-latency applications
- Local caching for all content
- Built on WebRTC DataChannels, found in Chrome, Firefox, and even Chrome for Android and many more browsers soon. Gracefully fallsback in unsupported browsers

### Features we're working on

- Support for streaming HTML5 video
- Support for larger files



## Building: 

PeerKit is under heavy development. We don't recommend trying to run it yourself yet. 

`npm install -d`

`node bin/build.js`


### Running:

`<script src="dist/peerkit.js"></script>`



Thanks for checking out PeerKit. We're working on improving documentation and code comments.

## http://peerkit.com
