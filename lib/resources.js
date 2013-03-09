ResourceManager = {};

ResourceManager._store = window.localStorage;

ResourceManager._storeUrls = ["http://blahblah.com/index.html", "http://blah2.com/index.html"];

ResourceManager._fileRecievedListeners = {};

function receiveMessage(event)
{
   if (event.data.name === "getData"){
     ResourceManager.dataRecieved(event);
   }
}

ResourceManager.dataRecieved = function(event){
  var data = event.data.data;
  var recievedCallback = _fileRecievedListeners[event.data.url];
  recievedCallback.onReceipt(util.binaryStringToArrayBuffer(data));
  _fileRecievedListeners[event.data.url] = '';
}

ResourceManager.get = function(key) {
  return ResourceManager._store.getItem(key);
};

ResourceManager.save = function(key, data) {
  ResourceManager._store.setItem(key, JSON.stringify(data));
};

ResourceManager.remove = function(key){
  ResourceManager._store.removeItem(key);
}
  
ResourceManager.keys = function(){
  Object.keys(ResourceManager._store);
}

ResourceManager._getFrame = function(storeUrl) { 
  var frame;
  
  if( frame = document.getElementById(storeUrl) == null){
      frame = document.createElement('iframe');
      frame.className = storeUrl;
      frame.src = storeUrl;
  } 
  
  return frame;
 }

ResourceManager._getMaxSize = function(){
  //browser dependent file size fetcher
  if (navigator.userAgent.indexOf("Opera") == -1) {
    return 5242880;
  } else {
    return 2097152;
  }

}

ResourceManager._getAvailableUrl = function(file, fileSize){
  if(file.size > _getMaxSize()){
    return null;
  }
  
  for(var i = 0; i < _storeUrls.length; i++){
     var currentSize;
    
     if(currentSize = get(_storeUrls[i]) == null){
        save(_storeUrls[i], fileSize);
        return(_storeUrls[i]);
     } else {
       if (currentSize + file.size <= _getMaxSize()){
         save(_storeUrls[i], fileSize + currentSize);
         return(_storeUrls[i]);
       }
     }
  }
  
  //None of the domain slots can accomodate a file of this size
  return null;
}

ResourceManager._deleteAll = function(storeUrl){
  var message = {};
  message.name = "deleteAll";
  var frame = _getFrame(storeUrl);
  frame.postMessage(message, "*");

}
  
ResourceManager.saveFile = function(file, data, errorCB) {
    
  var callback = function(dataString){
    
    var fileSize = (dataString.length + file.url.length) * 2;
  
    var storeUrl = _getAvailableUrl(file, fileSize);

    if(storeUrl == null){
      errorCB.onFail();
    }
  
    //put this in our index - so we know where this is.
    save(file.url, storeUrl);
    
    var message = {};
  
    message.name = "storeData";
    message.url = file.url;
    message.data = data;
  
    var frame = _getFrame(storeUrl);
    
    frame.postMessage(message);
    errorCB.onSuccess();
  };
  
  util.blobToBinaryString(data, callback);

};
  
ResourceManager.getFile = function(storeUrl, dataUrl, recievedCallBack){
  var frame = document.createElement('iframe');
  frame.className = 'iframe'
  frame.src = storageUrl;
  
  var storeUrl = get(dataUrl);
  
  if(storeUrl == null){
    recievedCallBack.onError();
    return;
  }
  
  _fileRecievedListeners[dataUrl] = recievedCallBack;
  message.name = "getData";
  message.url = dataUrl;
  
  var frame = _getFrame(storeUrl);
  frame.postMessage(message, "*");
  
}

function setFrame (src) {
  var oldFrame = document.querySelector('.iframe')
  if (oldFrame) {
    oldFrame.parentElement.removeChild(oldFrame)
  }
  var frame = document.createElement('iframe')
  frame.className = 'iframe'
  frame.src = src
  document.getElementsByTagName('body')[0].appendChild(frame)
}