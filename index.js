const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

var games=new Map();
var rooms=[];
var client_info=new Map();
var max_player=2;
const register_index = 0;
const hand_index = 1;
var clientlist=[];
var gameclient=[];
//var gameindex = 0;
//var ready = false;

// ---------------

const path = require('path');
const static = require('serve-static');
const socket = require('socket.io');

app.use('/login', static(path.join(__dirname, 'login.html')));

var userInfo = {};

//io.on('setSocketId', function(data) {
//    var userName = data.user_name;
//    var userId = data.user_id;

//    userInfo[userName] = userId;
//});

app.get('/login', function(req, res) {
    const username = req.query.name;

    res.send(`name : ${username}`);
});

app.post('/login', (req, res) => {
    const username = req.body.name;

    res.send(`name : ${username}`);
})

app.post('/game', (req, res) => {
    res.sendFile(__dirname + '/index.html');
})

//app.use('/game', static(path.join(__dirname, 'index.html')));

// ---------------

function put_room(id){
  if(rooms==[]){
    rooms.push([id]);
    client_info.set(id,'room1');
    console.log(rooms);
    return;
  }
  if((rooms[rooms.length-1]).length<max_player){
    rooms[rooms.length-1].push(id);
    client_info.set(id,'room'+rooms.length.toString());
  }
  else if(rooms[rooms.length-1].length<max_player){
    rooms.push([id]);
    client_info.set(id,'room'+rooms.length.toString());
  }
}


app.get('/game', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  //console.log('a user connected');
  clientlist.push(socket.id);
  put_room(socket.id);
  socket.join(map.get(socket.id));

  if(rooms[rooms.length-1].length==max_player){
    gameclient=[];
    for(var c of rooms[rooms.length-1]){
      gameclient.push(c);
    }
    console.log(gameclient);
    var [tile_set, board, players] = initialization();
    room=new Map();
    room.set('tile_set', tile_set);room.set('board', board);room.set('players', players);room.set('gameindex', 0);
    room.set('ready', false);room.set('gameclient', rooms[rooms.length-1]);
    games.set('room'+rooms.length.toString(), room);
    game_start('room'+rooms.length.toString(), room.get(board), room.get(gameclient), room.get(gameindex));
    gameclient=[];
  }
  

  socket.on('chat message', (msg) => {
    var now_room = games.get(client_info.get(socket.id));
    var temp_index = now_room.get('gameindex');
    temp_turn(now_room.get('gameclient'), client_info.get(socket.id), socket, msg);
    if(player_hand(players,gameindex).length==0){
      io.sockets.in(client_info.get(socket.id)).emit('chat message', "Game over. Player"+now_room.get('gameindex').toString()+" wins.");
    }
    if(gameindex!=temp_index){
      next_turn_start(now_room.get('gameclient'), now_room.get('gameindex'), now_room.get('board'), client_info.get(socket.id));
    }
  });
  
  socket.on('disconnect', () => {
    for( i in clientlist){
      if(clientlist[i]==socket.id){
        clientlist.splice(i,1);
      }
    }
    for(i of gameclient){
      if(i == socket.id){
        io.sockets.in('room').emit('chat message', "Someone left.");
        io.sockets.in('room').emit('chat message', "Game over.");
      }
    }
    //console.log('user disconnected');
  });

});

server.listen(3000, () => {
  console.log('listening on *:3000');
});


function shuffle(array) {
  array.sort(() => Math.random() - 0.5);
}
function game_start(room, board, gameclient, gameindex){
  gameindex = 0;
  io.sockets.in(room).emit('chat message', "Board: ");
  io.sockets.in(room).emit('chat message', board);
  for(i in gameclient){
    io.to(gameclient[i]).emit('chat message', "You are player"+i.toString());
    io.to(gameclient[i]).emit('chat message', "Your hand:");
    io.to(gameclient[i]).emit('chat message', player_hand(players, i).sort());
  }
  io.to(gameclient[gameindex]).emit('chat message', "Your turn. Are you going to register? (y or n)");
}

function temp_turn(gameclient, room, socket, msg){
  if(gameclient[gameindex]==socket.id){
    console.log("right user");
    if(ready){
      var submit_tile = msg.split(',');
      if(players[gameindex][register_index]==0){
        if(able_to_register(submit_tile)){
          console.log(submit_tile);
          board.push(submit_tile);
          players[gameindex][register_index]=1;
          gameindex=(gameindex+1)%max_player;
          console.log(board);
          ready=false;
        }
        else{
          io.to(gameclient[gameindex]).emit('chat message', "Not available.");
          ready=false;
        }
        return;
      }
      if(hand_able(players[gameindex][hand_index], submit_tile)){
        var total_board = separate_baord(board);
        for(var t of submit_tile){
          total_board.push(t);
        }
        var [abl, set] = board_able(total_board);
        if(abl){
          board = set;
          gameindex=(gameindex+1)%max_player;
          ready=false;
        }
        else{
          io.to(gameclient[gameindex]).emit('chat message', "Not available.");
          ready=false;
        }
      }
      else{
        io.to(gameclient[gameindex]).emit('chat message', "Not available.");
        ready=false;
      }
      return;
    }

    if(msg=="y"){
      io.to(gameclient[gameindex]).emit('chat message', "Type your tiles");
      ready = true;
    }
    else if (msg == "n"){
      recieve_tile(players, gameindex, tile_set);
      io.sockets.in(room).emit('chat message', "Player "+gameindex.toString()+" recieved tile.");
      io.to(gameclient[gameindex]).emit('chat message', "Your hand:");
      io.to(gameclient[gameindex]).emit('chat message', player_hand(players, gameindex).sort());
      gameindex=(gameindex+1)%max_player;
    }
    else{
      io.to(gameclient[gameindex]).emit('chat message', "Please answer y or n.");
    }
  }
  else{
    io.to(socket.id).emit('chat message', "It's not your turn.");
  }
}

function next_turn_start(gameclient, gameindex, board,room){
  io.sockets.in(room).emit('chat message', "Board:");
  for(var tiles of board){
    io.sockets.in(room).emit('chat message', tiles);
  }
  io.sockets.in(room).emit('chat message', "Now it's player"+gameindex.toString()+"'s turn.");
  io.to(gameclient[gameindex]).emit('chat message', "Your hand:");
  io.to(gameclient[gameindex]).emit('chat message', player_hand(players, i).sort());
  if(players[gameindex][register_index]==0){
    io.to(gameclient[gameindex]).emit('chat message', "Your turn. Are you going to register? (y or n)");
  }
  else{
    io.to(gameclient[gameindex]).emit('chat message', "Your turn. Are you going to submit your tile? (y or n)");
  }
}




function initialization(){
  var tile_set = [];
  var board = [];
  var players = [];
  
  for(var i=1;i<14;i++){
    for(var j=0;j<2;j++){
      if(i<10){
        tile_set.push('red_0'+i.toString());
        tile_set.push('yellow_0'+i.toString());
        tile_set.push('black_0'+i.toString());
        tile_set.push('blue_0'+i.toString());
      }
      else{
        tile_set.push('red_'+i.toString());
        tile_set.push('yellow_'+i.toString());
        tile_set.push('black_'+i.toString());
        tile_set.push('blue_'+i.toString());
      }
    }
  }
  shuffle(tile_set);
  var player_num = max_player;
  
  for(var i =0;i<player_num;i++){
    var hand = [];
    for(var j=0;j<14;j++){
      hand.push(tile_set.pop());
    }
    players.push([0,hand]);
  }
  return [tile_set, board, players];
}


function tile_number(tile){
  return parseInt(tile.slice(-2));
}

function tile_color(tile){
  return tile.slice(0, -3);
}

function tiles_number(tiles){
  var numbers = [];

  for(var tile of tiles){
      numbers.push(tile_number(tile));
  }
  return numbers;
}

function tiles_color(tiles){
  var colors = [];

  for(var tile of tiles){
      colors.push(tile_color(tile));
  }
  return colors;
}

function same_color(tiles){
  var colors = tiles_color(tiles);

  samecolor = true;
  for(i=0; i<colors.length-1;i++){
      if(colors[i]!=colors[i+1]){
          samecolor=false;
      }
  }
  return samecolor;
}

function same_number(tiles){
  var numbers = tiles_number(tiles);

  samenumber = true;
  for(i=0; i<numbers.length-1;i++){
      if(numbers[i]!=numbers[i+1]){
          samenumber=false;
      }
  }

  return samenumber;
}

function different_color(tiles){
  var colors = tiles_color(tiles);
  var color_num = [0,0,0,0];
  var differentcolor = true;

  for(color of colors){
      switch(color){
          case "black" :
              color_num[0]++;
              break;
          case "red" :
              color_num[1]++;
              break;
          case "blue" :
              color_num[2]++;
              break;
          case "yellow" :
              color_num[3]++;
              break;
      }
  }

  for(num of color_num){
      if(num>1){
          differentcolor = false;
          break;
      }
  }
  return differentcolor;
}

function number_in_a_row(tiles){
  var numbers = tiles_number(tiles);
  numbers.sort((a,b)=>a-b);
  var numberinarow = true;
  for(i=0;i<numbers.length-1;i++){
      if(numbers[i]+1!=numbers[i+1]){
          numberinarow = false;
      }
  }
  return numberinarow;
}

function available_tiles(tiles){
  if(same_number(tiles)){
      return different_color(tiles);
  }
  else if (same_color(tiles)){
      return number_in_a_row(tiles);
  }
  else{
      return false;
  }
}

function able_to_register(tiles){
  var sum = 0;
  for(var tile of tiles){
      sum += tile_number(tile);
  }
  if(sum<30){
      return false;
  }
  return available_tiles(tiles);
}

function recieve_tile(players, order, tile_set){
  (players[order][1]).push(tile_set.pop());
  (players[order][1]).sort();
}
function player_hand(players, order){
  return players[order][1];
}

function separate_baord(board){
  var temp_board = [];
  for(var set of board){
      for(var tile of set){
          temp_board.push(tile);
      }
  }
  return temp_board;
}

function hand_able(player_tile, tiles){
  check = 0;
  hand_tile = player_tile;
  for(var t1 of tiles){
    for(var t2 in hand_tile){
      if(t1==hand_tile[t2]){
        check++;
        hand_tile.splice(t2, 1);
        break;
      }
    }
  }
  if(check == tiles.length){
    return true;
  }
  else{
    return false;
  }
}

function board_able(board){
  var temp_board =board;
  if(temp_board.length==0){
      return [true, []];
  }

  var minnum = 15;
  var mintile = "";
  for(var tile of temp_board){
      if(tile_number(tile)<minnum){
          minnum = tile_number(tile);
          mintile = tile;
      }
  }

  var able_sets = [];
  var min_tiles = [];

  for(var tile of temp_board){
      if(tile_number(tile)==minnum){
          min_tiles.push(tile);
      }
  }

  var temp_diff = [];
  for(var color of ["red", "blue", "black", "yellow"]){
      for(var tile of min_tiles){
          if(tile_color(tile)==color){
              temp_diff.push(tile);
              break;
          }
      }
  }
  if(temp_diff.length==3){
      for(var tile of temp_diff){
        for(var i in temp_board){
          if(temp_board[i] == tile){
            temp_board.splice(i,1);
            break
          }
        }
          //temp_board.pop(tile);
      }
      var [able, part_set] = board_able(temp_board);
      if(able){
          part_set.push(temp_diff);
          return [true, part_set];
      }
  }
  else if (temp_diff.length==4){ 
      if(minnum<10){
          var set1 = ["red_0"+minnum.toString(), "blue_0"+minnum.toString(), "black_0"+minnum.toString()];
          var set2 = ["red_0"+minnum.toString(), "blue_0"+minnum.toString(), "yellow_0"+minnum.toString()];
          var set3 = ["red_0"+minnum.toString(), "yellow_0"+minnum.toString(), "black_0"+minnum.toString()];
          var set4 = ["yellow_0"+minnum.toString(), "blue_0"+minnum.toString(), "black_0"+minnum.toString()];
          var set5 = ["red_0"+minnum.toString(), "blue_0"+minnum.toString(), "black_0"+minnum.toString(), "yellow_0"+minnum.toString()];
      }
      else{
          var set1 = ["red_"+minnum.toString(), "blue_"+minnum.toString(), "black_"+minnum.toString()];
          var set2 = ["red_"+minnum.toString(), "blue_"+minnum.toString(), "yellow_"+minnum.toString()];
          var set3 = ["red_"+minnum.toString(), "yellow_"+minnum.toString(), "black_"+minnum.toString()];
          var set4 = ["yellow_"+minnum.toString(), "blue_"+minnum.toString(), "black_"+minnum.toString()];
          var set5 = ["red_"+minnum.toString(), "blue_"+minnum.toString(), "black_"+minnum.toString(), "yellow_"+minnum.toString()];
      }
      for(var set of [set1, set2, set3, set4, set5]){
          temp_board = board;
          for(var tile of set){
              temp_board.pop(tile);
          }
          var [able, part_set] = board_able(temp_board);
          if(able){
              part_set.push(set);
              return [true, part_set];
          }
      }
  }
  temp_board = board;

  var samecolors = [];
  var mincolor = tile_color(mintile)
  var temp_num = minnum;

  while(true){
      var check = true;
      for(var tile of temp_board){
          if(tile_color(tile)==mincolor && tile_number(tile)==temp_num){
              samecolors.push(tile);
              temp_num++;
              check = false;
              temp_board.pop(tile)
              if(samecolors.length>=3){
                  var [able, part_set] = board_able(temp_board);
                  if(able){
                      part_set.push(samecolors);
                      return [true, part_set];
                  }
              }
              break;
          }
      }
      if(check){
          break;
      }
  }
  return [false, []];
}
