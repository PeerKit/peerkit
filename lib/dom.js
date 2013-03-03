function DomManager (options) {
  if (!(this instanceof DomManager)) return new DomManager(options);
  
  EventEmitter.call(this);

  var self = this;
  
  options = util.extend({
    debug: false
  }, options);
  this._options = options;
    
}

util.inherits(DomManager, EventEmitter);

DomManager.prototype.func = function () { ... };


exports.DomManager = DomManager;
