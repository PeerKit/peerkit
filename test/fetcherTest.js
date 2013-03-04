describe('fetcher', function(){
  PeerClient = function(options) {
    if (!(this instanceof PeerClient)) return new PeerClient(options);
    
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

  PeerClient.prototype.send = function(msg){
    
  };


  util.inherits(PeerClient, EventEmitter);


  
  /*
  function PeerFetcher2(file, peers, options) {
    PeerFetcher.call(this, file, peers, options); //call super constructor.
  }
   
  PeerFetcher2.prototype = Object.create(PeerFetcher.prototype);
  */

  

 
  describe('_init', function(done){
    it ('should init without errors', function(done){
      var testPeerFetcher = new PeerFetcher({name: 'herp.psd', size: '1024'}, [{}, {}, {}],{chunkSize:1000});
      expect(testPeerFetcher._chunks.length).to.be(2);
      var expectedChunks = [{start:0 , end:999} , {start:1000, end:1023}];
      expect(testPeerFetcher._chunks).to.eql(expectedChunks);
      done();    
    })
  });


  describe('_defineChunks', function(){
    it ('works for fileSize a divisor of maxChunkSize', function(done){
      var testPeerFetcher = new PeerFetcher({name: 'herp.psd', size: '1600'}, [{}, {}, {}]);
      expect(testPeerFetcher._chunks.length).to.be(2);
      var expectedChunks = [{start:0 , end:799} , {start:800, end:1599}];
      expect(testPeerFetcher._chunks).to.eql(expectedChunks);
      done();    
    });
    it ('works for fileSize one less than maxChunkSize', function(done){
      var testPeerFetcher = new PeerFetcher({name: 'herp.psd', size: '799'}, [{}, {}, {}]);
      expect(testPeerFetcher._chunks.length).to.be(1);
      var expectedChunks = [{start:0 , end:798}];
      expect(testPeerFetcher._chunks).to.eql(expectedChunks);
      done();    
    });
    it('works for fileSize one greater than maxChunkSize', function(done){
      var testPeerFetcher = new PeerFetcher({name: 'herp.psd', size: '801'}, [{}, {}, {}]);
      expect(testPeerFetcher._chunks.length).to.be(2);
      var expectedChunks = [{start:0 , end:799}, {start:800 , end:800}];
      expect(testPeerFetcher._chunks).to.eql(expectedChunks);
      done()
    });
  });

  describe('_receiveData', function(){
    it('puts a chunk of data into the correct place in the fileBuffer', function(){


      var testPeerFetcher = new PeerFetcher({name: 'herp.psd', size: '1024'}, [{}, {}, {}], {debug: true});
      var arrayBuffer = new ArrayBuffer(15);
      testPeerFetcher._allPeers[0].emit('open');
      testPeerFetcher._receiveData(0,undefined,790,805,arrayBuffer);
      
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
