function ResourceManager () {
  this._store = {};
};

ResourceManager.prototype.get = function(url) {
  return this._store[url];

}
ResourceManager.prototype.save = function(url, data) {
  this._store[url] = data;
}