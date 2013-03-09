ResourceManager = {};

ResourceManager._store = window.localStorage;

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
  return Object.keys(ResourceManager._store);
}

ResourceManager.getCacheExpiryDate = function (url) {
	var req = new XMLHttpRequest();
  req.open('GET', url , false);
  req.send(null);
  var date = req.getAllResponseHeaders().split('expires: ')[1].split('\n');
  var d = new Date(date);
  return d.getTime();
};


