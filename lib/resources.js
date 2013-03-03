function ResourceManager (options) {
  if (!(this instanceof ResourceManager)) return new ResourceManager(options);
  
  EventEmitter.call(this);

  var self = this;
  
  options = util.extend({
    debug: false
  }, options);
  this._options = options;
    
}

util.inherits(ResourceManager, EventEmitter);

ResourceManager.prototype.func = function () {
	
};


exports.ResourceManager = ResourceManager;
