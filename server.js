const PORT = process.env.PORT || 8080;
var express = require('express');
var app = express();
const path = require('path');
var http = require('http');
var server = http.Server(app);

app.use(express.static(__dirname + '/dist'));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'index.html'));
});

server.listen(PORT, function() {
  console.log('Chat server running');
});