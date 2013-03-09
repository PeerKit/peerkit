
ResourceManager = {};

ResourceManager._store = {};

ResourceManager.get = function(url) {
  return ResourceManager._store[url];

}
ResourceManager.save = function(url, data) {
  ResourceManager._store[url] = data;
}


