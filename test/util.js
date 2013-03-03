describe('util', function(){
	describe('fillBuffer', function(){
    it('should error when lengths not equal', function(){
      var testFillBuffer = new ArrayBuffer(8);
      var testDataBuffer = new ArrayBuffer(4);
      var testDataBufferUint = new Uint8Array(testDataBuffer);
      for (var i = 0; i < testDataBufferUint.length; i++) {
        testDataBufferUint[i] = 0xFF;
      }
      expect(function(){util.fillBuffer(testFillBuffer, 3, 8, testDataBuffer);}, Error).to.throwError();;
    });
		it('should move all 1s into last half of buffer of 8 bytes', function(){
			var testFillBuffer = new ArrayBuffer(8);
			var testDataBuffer = new ArrayBuffer(3);
      var testDataBufferUint = new Uint8Array(testDataBuffer);
      for (var i = 0; i < testDataBufferUint.length; i++) {
        testDataBufferUint[i] = 0xFF;
      }
      var actualFillBuffer = new ArrayBuffer(8)
      var actualFillBufferUint = new Uint8Array(actualFillBuffer);
      for (var i = 4; i < 7; i++) {
        actualFillBufferUint[i] = 0xFF;
      }
      expect(util.fillBuffer(testFillBuffer, 4, 7, testDataBuffer)).to.eql(actualFillBuffer);
		});
	});
});