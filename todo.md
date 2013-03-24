# TODO:


~~* Move images not on page out of ResourceManager into memory for possible sharing~~
~~* What to do if getFile fails for image we thought was in cache? (Image will not make it on to downloadList)~~: use xhr
~~* If we get expired images, we currently use it anyways but remove from cache for next time. What if a peer requests this image (that is expired but in memory)?~~: use xhr to get latest, do not share expired images
~~* What is expiry of image received from peer? (This should be coming from server but currently is not)~~ give in client options + fixed time
~~* https images do not work~~
~~* _pc is null after .destroy call, can cause exceptiosn

* Detect if browser not compatible and fallback gracefully
* Replenish CONN objects with message from server to client
* Implement this._pc.oniceconnections when it is implemented. https://groups.google.com/d/msg/discuss-webrtc/vTCvw-L0P20/kie7GKDOKj4J
* Global directory does not know about collisions even though stores will be keyed on url (wasted space possible)
* Save files that fail due to frame not loading have global directory available space leak
* Test whether more performant to convert blob -> binarystring in resourcemanager or iframe.html
* Server needs to expire cahced images
* Failing util.xhrFile?
