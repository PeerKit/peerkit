ResourceManager = {};

ResourceManager._store = window.localStorage;

ResourceManager.get = function(key) {
  return ResourceManager._store.getItem(key);
};
ResourceManager.save = function(key, data) {
  ResourceManager._store.setItem(key, data);
};

