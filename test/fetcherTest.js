describe('fetcher', function(){
  CdnClient = function(options) {
    if (!(this instanceof CdnClient)) return new CdnClient(options);
    
    EventEmitter.call(this);

    var self = this;
    
    options = util.extend({
      debug: false
    }, options);
    this._options = options;
    
    
    // This connects to the PeerCDN server
    this._socket = new Socket();
    
    // Wait for list of peers from server
    this._socket.on('resource', function(url, peers){
      // Download image from Peers

    });
  }

  util.inherits(CdnClient, EventEmitter);

  
  /*
  function PeerFetcher2(file, peers, options) {
    PeerFetcher.call(this, file, peers, options); //call super constructor.
  }
   
  PeerFetcher2.prototype = Object.create(PeerFetcher.prototype);
  */

  var testPeerFetcher = new PeerFetcher({name: 'herp.psd', size: '1024'}, [{}, {}, {}]);
	
  describe('_defineChunks', function(){
    it('', function(){
      
    });
	});
  describe('_connectPeer', function(){
    it('', function(){
      
    });
  });
  describe('_receiveData', function(){
    it('', function(){
      
    });
  });
  describe('_invalidPeer', function(){
    it('', function(){
      
    });
  });
  describe('_next', function(){
    it('', function(){
      
    });
  });
  describe('_wakeAllPeers', function(){
    it('', function(){
      
    });
  });
});