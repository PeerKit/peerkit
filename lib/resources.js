ResourceManager = {};

ResourceManager._options = {
  frameTimeout: 500
};

ResourceManager._directory = window.localStorage;

ResourceManager._GLOBALURL = 'http://global.peerkit.com/global.html';

ResourceManager._MAXSIZE = (navigator.userAgent.indexOf("Opera") == -1) ? 5242880 : 2097152;

ResourceManager._frames = {};

ResourceManager._fileListeners = {};
ResourceManager._availableUrlListeners = {};

ResourceManager._requestId = 0;


window.addEventListener("message", function (event){
  util.log('Received from child iframe', event.data);
  switch(event.data.name) {
    case 'data':
      ResourceManager._dataReceived(event.data);
      break;
    case 'ready':
      ResourceManager._frameLoaded(event.data.url);
      break;
    case 'available-url':
      ResourceManager._availableUrl(event.data);
      break;
    default: 
      util.log('Other message received: ', event.data)
  };
}, false);



ResourceManager._frameLoaded = function(url){
  frame = ResourceManager._frames[url];
  // Clear the timeout that would mark frame as dead
  clearTimeout(frame.timeout);
  frame.isLoaded = true;
  for(var i = 0; i < frame.queue.length; i++){
    frame.queue[i](null, frame);
  }
  frame.queue = [];
};
  
ResourceManager._dataReceived = function(message){
  var cb = ResourceManager._fileListeners[message.url];
  delete ResourceManager._fileListeners[message.url];
  if (!message.data) {
    cb(new Error('Failed to get data form iframe'), null, message.url);
    return;
  }
  var dataBuf = util.binaryStringToArrayBuffer(message.data);
  message.data = new Blob([new Uint8Array(dataBuf)]);
  cb(null, message.data, message.url);

};

ResourceManager._availableUrl = function(message) {
  // url
  // clear
  var cb = ResourceManager._availableUrlListeners[message.id];
  delete ResourceManager._availableUrlListeners[message.id];
  if (!message.url) {
    cb(new Error('No available storage'), null);
    return;
  }
  if (message.clear) {
    ResourceManager._deleteAll(message.url);
  }
  cb(null, message.url);
};

ResourceManager.directoryGet = function(url) {
  return JSON.parse(ResourceManager._directory.getItem(url));
};

ResourceManager._directorySave = function(url, data) {
  ResourceManager._directory.setItem(url, JSON.stringify(data));
};

ResourceManager.saveFile = function(url, data, expiry, cb) {      
  var dataString;
  if (data.constructor == Blob) {
    util.blobToBinaryString(data, function(str){
      ResourceManager._saveString(url, str, expiry, cb);
    });
  } else {
    cb(new Error("Type not supported"), null, url);
  }
};     
 
ResourceManager._saveString = function(url, str, expiry, cb) {
  var fileSize = (str.length + url.length) * 2;

  ResourceManager._getAvailableUrl(fileSize, function(err, storeUrl){
    if (err) {
      cb(err, null, url);
      return;
    }

    var message = {name: 'store', url: url, data: str};

    ResourceManager._getFrame(storeUrl, function(err, frame) {
      if (err) {
        cb(err, null, url);
        ResourceManager._derequestUrl(storeUrl, fileSize);
        return;
      }
      frame.contentWindow.postMessage(message, '*');
      // Save in local directory
      ResourceManager._directorySave(url, {storeUrl: storeUrl , expiry: expiry, size: fileSize});
      cb(null, true, url);
    });
  });
};

ResourceManager._directoryRemove = function(url){
  ResourceManager._directory.removeItem(url);
};

ResourceManager._derequestUrl = function(storeUrl, size) {
  var delMessage = {name: 'derequest', url: storeUrl, size: size};
  ResourceManager._getFrame(ResourceManager._GLOBALURL, function(err, frame) {
    if (err) {
      return;
    }
    frame.contentWindow.postMessage(delMessage, '*');
  });
};

ResourceManager.removeFile = function(url){
  //remove the file
  var directoryInfo = ResourceManager.directoryGet(url);
  if (directoryInfo){  
    var storeUrl = ResourceManager.directoryGet(url).storeUrl;
    var message = {name: 'delete', url: url};
    ResourceManager._getFrame(storeUrl, function(err, frame) {
      if (err) {
        return;
      }
      frame.contentWindow.postMessage(message, '*');
    });
    ResourceManager._derequestUrl(storeUrl, directoryInfo.size);
    ResourceManager._directoryRemove(url);
  }
};
  
ResourceManager.storedUrls = function(){
  return Object.keys(ResourceManager._directory);
};

ResourceManager._getFrame = function(storeUrl, cb) { 
  var frame;
  
  if ((frame = ResourceManager._frames[storeUrl]) == null) {
    frame = document.createElement('iframe');
    frame.isLoaded = false;
    frame.queue = [];
    frame.timeout = setTimeout(function(){
      for(var i = 0; i < frame.queue.length; i++){
        frame.queue[i](new Error('Could not load frame'), null);
      }
      frame.queue = [];
    }, ResourceManager._options.frameTimeout);
    frame.className = storeUrl;
    frame.src = storeUrl;
    ResourceManager._frames[storeUrl] = frame;
    document.getElementsByTagName('body')[0].appendChild(frame);
  } 
  
  if (frame.isLoaded) {
    cb(null, frame);
  } else {
    frame.queue.push(cb);
  }
};


ResourceManager._getAvailableUrl = function(size, cb){
  if(size > ResourceManager._MAXSIZE){
    cb(new Error('File size too big'), null);
    return;
  }
  
  var id = ResourceManager._requestId++;
  
  var message = {name: 'request', size: size, id: id};
  
  ResourceManager._getFrame(ResourceManager._GLOBALURL, function(err, frame) {
    if (err) {
      cb(err, null);
      return;
    }
    ResourceManager._availableUrlListeners[id] = cb;
    frame.contentWindow.postMessage(message, '*');
  });
};

ResourceManager._deleteAll = function(storeUrl){
  var message = {name: 'deleteAll'};
  ResourceManager._getFrame(storeUrl, function(err, frame) {
    if (err) {
      return;
    }
    frame.contentWindow.postMessage(message, '*');
  });
};
  
  
ResourceManager.getFile = function(url, cb){
  var directoryInfo = ResourceManager.directoryGet(url);
  var storeUrl;
  if (directoryInfo){
    storeUrl = directoryInfo.storeUrl;
  }
  else{
    storeUrl = null;
  }
  if(storeUrl == null){
    cb(new Error('Not stored'), null, url);
    return;
  }
  
  var message = {name: 'getData', url: url};
  
  ResourceManager._getFrame(storeUrl, function(err, frame) {
    if (err) {
      cb(err, null, url);
      return;
    }
    ResourceManager._fileListeners[url] = cb;
    frame.contentWindow.postMessage(message, '*');
  });
};

ResourceManager.isFileStored = function(url){
  // Save time by not checking if it is actually an iframe
  return !!ResourceManager._directory[url];
}