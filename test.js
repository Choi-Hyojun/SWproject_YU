const e = require("express");

function shuffle(array) {
    array.sort(() => Math.random() - 0.5);
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
    var player_num = 3;
    
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
                  break;
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
                for(var i in temp_board){
                    if(temp_board[i] == tile){
                        temp_board.splice(i,1);
                        break;
                    }
                }
            //temp_board.pop(tile);
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
                for(var i in temp_board){
                    if(temp_board[i] == tile){
                      temp_board.splice(i,1);
                      break;
                    }
                  }
                //temp_board.pop(tile);
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


var testset1 = ["black_02","black_01","black_04","black_03"];
var testset2 = ["black_12","red_12","blue_12","yellow_12"];
var falseset = ["black_02","black_01","blue_12","yellow_12"];


var [tile_set, board, players] = initialization();
var [a, board1] = board_able(["black_13","red_13","blue_13", "yellow_13","blue_01", "blue_03", "blue_02"]);
console.log(board1);