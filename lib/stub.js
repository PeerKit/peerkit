function DomManager () {
};

DomManager.prototype.getDownloadList = function() {
  return [
    {url: 'a.gif', size: 10000},
    {url: 'b.png', size: 1000}
  ];
}
DomManager.prototype.getAvailableList = function() {
  return [
    {url: 'x.gif', size: 5000},
    {url: 'y.png', size: 2000}
  ];
}