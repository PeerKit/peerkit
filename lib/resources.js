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
  Object.keys(ResourceManager._store);
}


