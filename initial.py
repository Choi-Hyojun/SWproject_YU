
import random
import collections

def Initialization():
    tile_set = []
    board = []
    players = []


    for i in range(1,14):#타일뭉치를 만듭니다.
        tile_set.append("red_"+str(i).zfill(2))
        tile_set.append("red_"+str(i).zfill(2))
        tile_set.append("yellow_"+str(i).zfill(2))
        tile_set.append("yellow_"+str(i).zfill(2))
        tile_set.append("blue_"+str(i).zfill(2))
        tile_set.append("blue_"+str(i).zfill(2))
        tile_set.append("black_"+str(i).zfill(2))
        tile_set.append("black_"+str(i).zfill(2))
     
    random.shuffle(tile_set)

    player_num=int(input("플레이어의 수 : "))#플레이어의 숫자를 받습니다.
    for i in range(player_num):#플레이어들에게 타일 14개씩 나누어줍니다.
        hand=[]
        for j in range(14):
            hand.append(tile_set.pop())
        hand.sort()
        players.append([0,hand])
    
    return board

if __name__ == '__main__':
    Initialization()