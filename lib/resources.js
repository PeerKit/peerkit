ResourceManager = {};

ResourceManager._directory = window.localStorage;

ResourceManager._stores = {"http://a.poop:8000/iframe.html": true, "http://b.poop:8000/iframe.html": true, "http://c.poop:8000/iframe.html": true};

ResourceManager._frames = {};

ResourceManager._fileListeners = {};


window.addEventListener("message", function (event){
  util.log('Received from child iframe', event.data);
  switch(event.data.name) {
    case 'data':
      ResourceManager._dataReceived(event.data);
      break;
    case 'ready':
      ResourceManager._frameLoaded(event.data.url);
      break;
    default: 
      util.log('Other message received: ', event.data)
  };
}, false);



ResourceManager._frameLoaded = function(url){
  frame = ResourceManager._frames[url];
  frame.isLoaded = true;
  for(var i = 0; i < frame.queue.length; i++){
    frame.queue[i](null, frame);
  }
};
  
ResourceManager._dataReceived = function(data){
  var dataBuf = util.binaryStringToArrayBuffer(data.data);
  data.data = new Blob([new Uint8Array(dataBuf)]);
  var receivedCallback = ResourceManager._fileListeners[data.url];
  receivedCallback(null, data.data);
  delete ResourceManager._fileListeners[data.url];
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
    cb(new Error("Type not supported"), null);
  }
};     
 
ResourceManager._saveString = function(url, str, expiry, cb) {
  var fileSize = (str.length + url.length) * 2;

  var storeUrl = ResourceManager._getAvailableUrl(fileSize);
  if (storeUrl == null) {
    cb(new Error("No more space available"), null);
    return;
  }

  var message = {name: 'store', url: url, data: str};

  ResourceManager._getFrame(storeUrl, function(err, frame) {
    if (err) {
      cb(err, null);
      return;
    }
    frame.contentWindow.postMessage(message, '*');
    ResourceManager._directorySave(url, {storeUrl: storeUrl , expiry: expiry});
    cb(null, true);
  });
};

ResourceManager._directoryRemove = function(url){
  ResourceManager._directory.removeItem(url);
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

    ResourceManager._directoryRemove(url);
  }
};
  
ResourceManager.storedUrls = function(){
  var out = [];
  var keys = Object.keys(ResourceManager._directory);
  for (var i = 0; i < keys.length; i++) {
    if(!ResourceManager._stores[keys[i]]) {
      out.push(
      keys[i]);
    }    
  }
  return out;
};

ResourceManager._getFrame = function(storeUrl, cb) { 
  var frame;
  
  if ((frame = ResourceManager._frames[storeUrl]) == null) {
    frame = document.createElement('iframe');
    frame.isLoaded = false;
    frame.queue = [];
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

ResourceManager._getMaxSize = function(){
  //browser dependent file size fetcher
  if (navigator.userAgent.indexOf("Opera") == -1) {
    return 5242880;
  } else {
    return 2097152;
  }

};

ResourceManager._getAvailableUrl = function(fileSize){
  if(fileSize > ResourceManager._getMaxSize()){
    return null;
  }
  
  var storeKeys = Object.keys(ResourceManager._stores);

  for(var i = 0; i < storeKeys.length; i++){
    var currentSize;
     
    if((currentSize = ResourceManager.directoryGet(storeKeys[i])) == null){
        ResourceManager._directorySave(storeKeys[i], fileSize);
        ResourceManager._deleteAll(storeKeys[i]);
        return(storeKeys[i]);
    } else {
      if (currentSize + fileSize <= ResourceManager._getMaxSize()){
        ResourceManager._directorySave(storeKeys[i], fileSize + currentSize);
        return(storeKeys[i]);
      }
    }
  }
  
  //None of the domain slots can accomodate a file of this size
  return null;
};

ResourceManager._deleteAll = function(storeUrl){
  var message = {name: 'deleteAll'};
  ResourceManager._getFrame(storeUrl, function(err, frame) {
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
    cb('Not stored', null);
    return;
  }
  
  var message = {name: 'getData', url: url};
  
  ResourceManager._fileListeners[url] = cb;
  
  ResourceManager._getFrame(storeUrl, function(err, frame) {
    frame.contentWindow.postMessage(message, '*');
  });
};

ResourceManager.isFileStored = function(url){
  // Save time by not checking if it is actually an iframe
  return !!ResourceManager._directory[url];
}