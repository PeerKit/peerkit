ResourceManager = {};

ResourceManager._store = window.localStorage;

ResourceManager._storeUrls = ["http://notarealsite.zzg:8000/iframe.html", "http://thisexists.ddf:8000/iframe.html"];

ResourceManager._frames = {};

ResourceManager._toLoad = [];

ResourceManager._fileRecievedListeners = {};

window.addEventListener("message", receiveMessage, false);

function receiveMessage(event){
  
  console.log('boa');
   if (event.data.name === "getData"){
     ResourceManager.dataRecieved(event);
   }
  
   if (event.data.name === "ready"){
     ResourceManager.frameLoaded(event);
   }
}

ResourceManager.frameLoaded = function(event){
  var frame = ResourceManager._toLoad.shift();
  for(var i = 0; i < frame.queue.length; i++){
    frame.queue[i](frame);
  }
}
  
ResourceManager.dataRecieved = function(event){
  var data = event.data.data;
  var recievedCallback = ResourceManager._fileRecievedListeners[event.data.url];
  console.log(event.data.url);
  recievedCallback.onReceipt(data);
  ResourceManager._fileRecievedListeners[event.data.url] = '';
}

ResourceManager.get = function(key) {
  return JSON.parse(ResourceManager._store.getItem(key));
};

ResourceManager.save = function(key, data) {
  ResourceManager._store.setItem(key, JSON.stringify(data));
};

ResourceManager.saveFile = function(file, dataString) {
        
    var fileSize = (dataString.length + file.url.length) * 2;
  
    var storeUrl = ResourceManager._getAvailableUrl(file, fileSize);

    if(storeUrl == null){
      return false;
    }
    
    console.log('here');
  
    //put this in our index - so we know where this is.
    ResourceManager.save(file.url, storeUrl);
    
    var message = {};
  
    message.name = "storeData";
    message.url = file.url;
    message.data = dataString;
  
    var afterLoad = function(frame) {frame.iframe.contentWindow.postMessage(message, '*')};
    ResourceManager._getFrame(storeUrl, afterLoad);  
    
    return true;
};

ResourceManager.remove = function(key){
  ResourceManager._store.removeItem(key);
};
  
ResourceManager.keys = function(){
  Object.keys(ResourceManager._store);
};

ResourceManager._getFrame = function(storeUrl, afterLoad) { 
  var frame;
  
  console.log(storeUrl);
  
  if( (frame = ResourceManager._frames[storeUrl]) == null){
      console.log('creating frame');
      frame = {};
      frame.isLoaded = false;
      frame.queue = [];
      frame.iframe = document.createElement('iframe');
      frame.iframe.className = storeUrl;
      frame.iframe.src = storeUrl;
      ResourceManager._frames[storeUrl] = frame;
      ResourceManager._toLoad.push(frame);
      document.getElementsByTagName('body')[0].appendChild(frame.iframe);
  } 
  
  if(frame.isLoaded){
    afterLoad(frame);
  } else {
    frame.queue.push(afterLoad);
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

ResourceManager._getAvailableUrl = function(file, fileSize){
  if(file.size > ResourceManager._getMaxSize()){
    return null;
  }
  
  for(var i = 0; i < ResourceManager._storeUrls.length; i++){
     var currentSize;
    
     if((currentSize = ResourceManager.get(ResourceManager._storeUrls[i])) == null){
        ResourceManager.save(ResourceManager._storeUrls[i], fileSize);
        ResourceManager._deleteAll(ResourceManager._storeUrls[i]);
        return(ResourceManager._storeUrls[i]);
     } else {
       if (currentSize + file.size <= ResourceManager._getMaxSize()){
         ResourceManager.save(ResourceManager._storeUrls[i], fileSize + currentSize);
         return(ResourceManager._storeUrls[i]);
       }
     }
  }
  
  //None of the domain slots can accomodate a file of this size
  return null;
};

ResourceManager._deleteAll = function(storeUrl){
  var message = {};
  message.name = "deleteAll";
  var afterLoad = function(frame) {frame.iframe.contentWindow.postMessage(message, '*')};
  ResourceManager._getFrame(storeUrl, afterLoad);  
};
  

  
ResourceManager.getFile = function(dataUrl, recievedCallBack){
  
  var storeUrl = ResourceManager.get(dataUrl);
  
  console.log(storeUrl);
  
  if(storeUrl == null){
    recievedCallBack.onError();
    return;
  }
  
  message = {};
  
  ResourceManager._fileRecievedListeners[dataUrl] = recievedCallBack;
  message.name = "getData";
  message.url = dataUrl;
  
  var afterLoad = function(frame) {frame.iframe.contentWindow.postMessage(message, '*')};
  ResourceManager._getFrame(storeUrl, afterLoad);   

  
};