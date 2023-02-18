const express = require('express');
const http = require('http');
const path = require('path');
const static = require('serve-static');

const app = express();

app.use('/login', static(path.join(__dirname, 'html')));

i = 0;
clientList[i] = name;
i++;

http.createServer(app).listen(3001, function() {
    console.log('Express Web-server Has Started! :: 3001');
});