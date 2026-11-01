// Pixel renderer: an ink-night mountain backdrop and a round stone lei tai seen at a 3/4 angle.
// Drawn at 256x144 and scaled up with CSS. World (x, y) maps to screen (CX + x, CY + y * SQ).

const CX = 128, CY = 84, SQ = 0.58;
const sx = x => CX + x, sy = y => CY + y * SQ;

const INK = {
  night: '#0e1424', night2: '#18213a', ink: '#141414', rice: '#ece4d2', jade: '#3f8a4a',
  verm: '#c23b22', gold: '#b8913c', stone: '#9a8f7c', stone2: '#867b69', stoneSide: '#4a4038',
};

const PAL = {
  k: '#141414', f: '#e2b48a', F: '#b9835b', w: '#ece4d2', W: '#bfb6a2', r: '#c23b22', v: '#8f2416',
  n: '#6b4a2f', N: '#4a3220', h: '#c9a65a', H: '#8f7438', u: '#2f4f8a', U: '#1f3460', g: '#c8ccd2',
  c: '#2c5a55', C: '#1d3d3a', o: '#e08a2a', O: '#a85e18', p: '#5a3a7a', P: '#3c2654', y: '#e8c34a',
  R: '#b2382a', d: '#6e1e16', M: '#2a2a35', m: '#45455a', A: '#b8913c', e: '#ffdf6b', j: '#3f8a4a', Q: '#7fe0ff',
  G: '#7da36a', Z: '#4b6b3e', s: '#d8dde3', b: '#9fc8e8', t: '#9a7a55', T: '#5e4630', L: '#4f9a3a', l: '#fff6c8',
  x: '#8a1020', X: '#3a0c14', i: '#d9b26a', z: '#3f7fd0',
  E: '#5dff9a', B: '#ff2a3a', K: '#0a0a12', S: '#ffd84a', q: '#6fc3ff',
};

// Pixel features drawn over any outfit; coordinates are relative to the fighter's feet.
function drawRaceFeatures(g, race, x, y, scale = 1, flip = false) {
  if (!race || race === 'unformed') return;
  const pixel = (dx, dy, w, h, color) => { g.fillStyle = color; g.fillRect(Math.round(x + (flip ? -dx - w : dx) * scale), Math.round(y + dy * scale), Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale))); };
  g.save();
  switch (race) {
    case 'human': pixel(-3, -9, 6, 1, '#d7a85e'); pixel(3, -8, 2, 2, '#c47545'); break; // headband and knot
    case 'stoneborn': pixel(-5,-8,2,6,'#7a8585'); pixel(3,-8,2,6,'#a5ad9c'); pixel(-4,-2,3,2,'#626f72'); break;
    case 'windkin': pixel(-5,-9,3,2,'#b9f1d7'); pixel(2,-9,3,2,'#b9f1d7'); pixel(4,-7,3,1,'#7cd6bf'); break;
    case 'ironblood': pixel(-4,-10,2,3,'#d48745'); pixel(2,-10,2,3,'#d48745'); pixel(-3,-5,6,1,'#a9472f'); break;
    case 'moonfang': pixel(-4,-12,2,4,'#9a9cbf'); pixel(2,-12,2,4,'#9a9cbf'); pixel(3,-3,3,2,'#c8c9df'); pixel(5,-5,2,3,'#c8c9df'); break;
    case 'riverfolk': pixel(-5,-7,2,3,'#4fc5cf'); pixel(3,-7,2,3,'#4fc5cf'); pixel(-2,-4,4,1,'#78dce5'); pixel(-1,-3,2,2,'#388caa'); break;
    case 'ashen': pixel(-4,-11,2,3,'#ef8a4b'); pixel(-1,-13,2,4,'#ffe3a0'); pixel(2,-11,2,3,'#e85b31'); pixel(-4,-3,2,2,'#8d7771'); break;
    case 'mirrorborn': pixel(-4,-7,8,3,'#c8d4ee'); pixel(-3,-6,2,1,'#6b82b0'); pixel(1,-6,2,1,'#6b82b0'); pixel(-2,-2,4,1,'#eaf6ff'); break;
    case 'dragonkin': pixel(-5,-12,2,4,'#f0cf82'); pixel(3,-12,2,4,'#f0cf82'); pixel(-5,-4,3,3,'#b34931'); pixel(3,-4,3,3,'#b34931'); pixel(4,-1,3,1,'#dc9b45'); break;
    case 'voidwalker': pixel(-4,-11,8,3,'#302748'); pixel(-5,-8,10,3,'#302748'); pixel(-2,-6,1,1,'#b992f2'); pixel(1,-6,1,1,'#b992f2'); pixel(3,-4,2,4,'#443058'); break;
    case 'celestial': pixel(-4,-13,8,1,'#ffe087'); pixel(-5,-12,1,2,'#ffe087'); pixel(4,-12,1,2,'#ffe087'); pixel(-6,-5,2,4,'#f9e8c1'); pixel(4,-5,2,4,'#f9e8c1'); break;
    case 'hollow': pixel(-3,-11,6,4,'#222032'); pixel(-2,-8,4,3,'#eee3cf'); pixel(-1,-7,2,1,'#9c49a4'); pixel(-4,-3,8,1,'#b07acd'); break;
  }
  g.restore();
}

const SPRITES = {
  hero: [
    '....kk....',
    '...kkkk...',
    '...rrrr...',
    '...kffk...',
    '....ff....',
    '..wwwwww..',
    '.fwwwwwwf.',
    '.f.wrrw.f.',
    '...kkkk...',
    '...k..k...',
    '..kk..kk..',
  ],
  hero_walk: [
    '....kk....',
    '...kkkk...',
    '...rrrr...',
    '...kffk...',
    '....ff....',
    '..wwwwww..',
    '.fwwwwwwf.',
    '.f.wrrw.f.',
    '...kkkk...',
    '..k....k..',
    '.kk....kk.',
  ],
  hero_punch: [
    '....kk....',
    '...kkkk...',
    '...rrrr...',
    '...kffk...',
    '....ff....',
    '..wwwwwwff',
    '..wwwwww..',
    '...wrrw...',
    '...kkkk...',
    '..k....k..',
    '.kk....kk.',
  ],
  hero_heavy: [
    '....kk....',
    '...kkkk...',
    '...rrrr...',
    '...kffk...',
    '....ff....',
    'ffwwwwww..',
    'f.wwwwww..',
    '...wrrw...',
    '...kkkk...',
    '..k....k..',
    '.kk.....kk',
  ],
  hero_kick: [
    '....kk....',
    '...kkkk...',
    '...rrrr...',
    '...kffk...',
    '....ff....',
    '.fwwwwwf..',
    '..wwwwww..',
    '...wrrw...',
    '...kkkkkkk',
    '...k......',
    '..kk......',
  ],
  hero_guard: [
    '....kk....',
    '...kkkk...',
    '...rrrr...',
    '...kffk.f.',
    '....ff.ff.',
    '..wwwwwf..',
    '..wwwwwff.',
    '...wrrw...',
    '...kkkk...',
    '..k....k..',
    '.kk....kk.',
  ],
  hero_roll: [
    '..........',
    '..........',
    '..........',
    '....kk....',
    '...rrrk...',
    '..wwkffw..',
    '.wwwwwwww.',
    '.wwrrwwww.',
    '..kkkkkk..',
    '..kk..kk..',
    '..........',
  ],

  // bruisers
  bandit: [
    '...kk...',
    '..kkkk..',
    '..kffk..',
    '...ff...',
    '.ffFFff.',
    'f.ffff.f',
    '..nnnn..',
    '..n..n..',
    '.NN..NN.',
  ],
  berserker: [
    '..W....W..',
    '..WggggW..',
    '...gggg...',
    '...kffk...',
    '...rrrr...',
    '.ffffffggg',
    'fffFFfffg.',
    '..tttt..n.',
    '..t..t..n.',
    '.kk..kk...',
  ],
  werewolf: [
    '.T.....T..',
    '.TT...TT..',
    '.TtttttT..',
    '.TtettteT.',
    '..tttttww.',
    '.ttttttt..',
    'tTttttttT.',
    'tT.ttt.Tt.',
    '...tTt....',
    '..tT.Tt...',
    '.TT...TT..',
  ],
  zombie: [
    '..kkk....',
    '.kGGGk...',
    '.GkGkG...',
    '.GGGGG...',
    '..GG.....',
    '.nnnnGGGG',
    '.nNnn....',
    '.nnnn....',
    '.u..u....',
    '.uu.uu...',
  ],

  // duelists
  samurai: [
    '..hhhhh...',
    'hhhhhhhhh.',
    '..kffk....',
    '..kffk....',
    '.MMMMMM...',
    'fMMwwMMf..',
    '.MMMMMMkkk',
    '.MMMMMM...',
    '..M..M....',
    '.kk..kk...',
  ],
  fencer: [
    '.....r.....',
    '..kkkkr....',
    '.kkkkkkk...',
    '..kffk.....',
    '..xwwx.....',
    '.xxwwxfssss',
    '.xxwwx.....',
    '..xxxx.....',
    '..k..k.....',
    '.kk..kk....',
  ],
  spearmaster: [
    '...rr.......',
    '..kkkk......',
    '..kffk......',
    '...ff.......',
    '.jjjjjj.....',
    'fjjjjjjfnnng',
    '..jCCj......',
    '..jjjj......',
    '..k..k......',
    '.kk..kk.....',
  ],
  cultivator: [
    '...kk....',
    '..kjjk...',
    '..kkkk...',
    '..kffk...',
    '.bbbbbb..',
    'bbbbbbbbs',
    'f.bwwb.s.',
    '..bbbb.s.',
    '.bbbbbb..',
    '.bb..bb..',
  ],

  // guardians
  paladin: [
    '..ssss....',
    '.ssssss...',
    '.skkkks...',
    '..ssss....',
    '.swwwwAAA.',
    'swwAwwAwA.',
    's.wAwwAAA.',
    '..wwww.A..',
    '..s..s....',
    '.kk..kk...',
  ],
  buddhist: [
    '..ffff..',
    '.ffffff.',
    '.fkffkf.',
    '..ffff..',
    '.oooooo.',
    'foOooOof',
    'f.oooo.f',
    '..oooo..',
    '..o..o..',
    '.kk..kk.',
  ],
  taichi: [
    '..wwww..',
    '.wwwwww.',
    '.wkffkw.',
    '..wffw..',
    '..wwww..',
    '.wwwwww.',
    'fwkwwkwf',
    '..wwww..',
    '..w..w..',
    '.kk..kk.',
  ],
  cyborg: [
    '..kkkk....',
    '..kQQk....',
    '..ffff....',
    '.mmmmmm...',
    'mgmmmmgQ..',
    'mgmMMmgQQ.',
    '..mmmm....',
    '..m..m....',
    '..g..g....',
    '.kk..kk...',
  ],

  // tricksters
  ninja: [
    '..kkkk..',
    '.kkkkkk.',
    '.kffffk.',
    '..kkkk..',
    '.rkkkkk.',
    'kkkkkkkk',
    'k.kkkk.k',
    '..kkkk..',
    '..k..k..',
    '.kk..kk.',
  ],
  drunk: [
    '..kk......',
    '.kkkk.....',
    '.kffk.....',
    '..fr......',
    '.nnnn.o...',
    'nnnnnnoo..',
    'f.nnn.oo..',
    '.nnnnn....',
    '.n...n....',
    'kk...kk...',
  ],
  vampire: [
    '..kkkkk...',
    '.xkwwwkx..',
    '.xwkwkwx..',
    '.xxwwwxx..',
    'XXkkrkkXX.',
    'XXkkkkkXX.',
    'XXkkkkkXX.',
    'XX.kkk.XX.',
    '...k.k....',
    '..kk.kk...',
  ],
  djinn: [
    '....yy....',
    '...zzzz...',
    '...zkzk...',
    '...zzzz...',
    '.Azzzzzzz.',
    'zzzAzzAzzz',
    'z.zzzzzz.z',
    '...zzzz...',
    '....zzz...',
    '.....zz...',
    '......z...',
  ],

  // marksmen
  gunslinger: [
    '..kkkk...',
    'kkkkkkkk.',
    '..kffk...',
    '..cccc...',
    '.ccccfggg',
    '.cCccc...',
    '.cc..cc..',
    '.k....k..',
    '.kk..kk..',
  ],
  sniper: [
    '..hhhh......',
    '.hhhhhh.....',
    '..kffk......',
    '..cccc......',
    '.ccccfgggggg',
    '.cCccc......',
    '.cc..cc.....',
    '.k....k.....',
    '.kk..kk.....',
  ],

  // casters
  talisman: [
    '...kk....',
    '..kyyk...',
    '..kkkk...',
    '..kffk...',
    '...ff....',
    '.pppppp..',
    'ppPppppy.',
    '.pyppyp..',
    '.pppppp..',
    'pppppppp.',
  ],
  druid: [
    '.n......n.',
    '..n....n..',
    '...LLLL...',
    '..LkffkL..',
    '..LffffL..',
    '.LLLLLLLn.',
    'LLtLLLLLn.',
    '.LLLLLL.n.',
    '.LLLLLL.n.',
    '..k..k..n.',
  ],
  necromancer: [
    '...kkk..W.',
    '..kkkkk.W.',
    '..kWWWk.W.',
    '..kWkWk.n.',
    '.PPPPPP.n.',
    'PPpPPpPPn.',
    '.PPPPPP.n.',
    '.PPPPPP.n.',
    'PPPPPPPP..',
  ],
  angel: [
    '...yyyy....',
    '....ff.....',
    'w..kffk..w.',
    'ww..ff..ww.',
    'wwwwwwwwww.',
    '.wwlwwlww..',
    '..wwwwww...',
    '..wAAAAw...',
    '...wwww....',
    '...f..f....',
  ],

  // colossi
  demon: [
    '.W........W.',
    '.WW......WW.',
    '..WRRRRRRW..',
    '..ReRRRReR..',
    '..RRRWWRRR..',
    '.RRRRRRRRRR.',
    'RRdRRRRRRdRR',
    'RR.RRRRRR.RR',
    'W..kkkkkk..W',
    '...RRRRRR...',
    '...RR..RR...',
    '..kkk..kkk..',
  ],
  eastdragon: [
    '.................A.A',
    '................jjjj',
    '..jj....jjj....jjejA',
    '.jjjj..jjjjj..jjjjjj',
    'jjAAjjjjAAAjjjjjjjAy',
    'jAAAAjjAAAAAjjjj..yy',
    '.jjjj..jjjjj..jj....',
    '..jj....jjj.........',
    '.k.k.....k.k........',
  ],
  westdragon: [
    '......W..W......',
    '.R....RRRR....R.',
    'RRR...ReeR...RRR',
    'RRRR..RRRR..RRRR',
    'RRRRRRRWWRRRRRRR',
    '.RRRRRRRRRRRRRR.',
    '..RRRyyyyyyRRR..',
    '...RRyyyyyyRR...',
    '....RRRRRRRR....',
    '....RR....RR...R',
    '...kkk....kkk.RR',
  ],

  // ---- bosses: form one, then the second form ----
  b_warlord: [
    '......kkkk......',
    '.....kkkkkk.....',
    '.....kffffk.....',
    '.....fBffBf.....',
    '.....ffNNff.....',
    '......NNNN......',
    '..ttTTttttTTtt.g',
    '.tTTffffffffTTgg',
    '.tTfffFFFFfffTg.',
    '.ff.fffffffff.f.',
    '.ff..rrrrrrr..f.',
    '.ff..nnnnnnn....',
    'g....nnnnnnn....',
    '.....nnn.nnn....',
    '.....nn...nn....',
    '....NNN...NNN...',
  ],
  b_warlord2: [
    '..W..........W....',
    '.WW...gggg...WW...',
    '..WWggggggggWW....',
    '....gkkkkkkg......',
    '....gRBRRBRg......',
    '....RRRddRRR......',
    '.....RWWWWR.......',
    'gg.RRRRRRRRRR..gg.',
    'gggRRdRRRRdRRRggg.',
    '.gRRRRRRRRRRRRRg..',
    '..RR.RRRRRRR.RR...',
    '..RR.xxxxxxx.RR...',
    '..W..XXXXXXX..W...',
    '.....XXX.XXX......',
    '.....RR...RR......',
    '....kkk...kkk.....',
  ],
  b_swordsaint: [ // long black hair down his back, a gold pin in the topknot, white robes under a pale-blue outer robe, a blue sash
    '....kkk....',
    '....khk....',
    '...kkkkk...',
    '..kkkfff...',
    '..kkffkf...',
    '..kkkfF....',
    '.kk.wbw....',
    '.kkbwwwbb..',
    '.k.bwzwwbb.',
    '.k.bbwwwbbb',
    '...bbzzzbb.',
    '...bwwwwb..',
    '...bwwwwwb.',
    '..bwwwwwwb.',
    '..bWwwwWwbb',
    '.bbW.ww.Wb.',
  ],
  b_swordsaint2: [ // Perfect Sword Intent: his hair gone silver, eyes and crown burning with sword light, a gold sash
    '....ggg....',
    '....gQg....',
    '...ggggg...',
    '..gggfff...',
    '..ggffQf...',
    '..gggfF....',
    '.gg.wbw....',
    '.ggbwwwbb..',
    '.g.bwhwwbb.',
    '.g.bbwwwbbb',
    '...bbhhhbb.',
    '...bwwwwb..',
    '...bwwwwwb.',
    '..bwwwwwwb.',
    '..bWwwwWwbb',
    '.bbW.ww.Wb.',
  ],
  b_abbot: [
    '......ffff.....A',
    '.....ffffff....A',
    '.....fkffkf....A',
    '.....ffffff....A',
    '......frrf.....A',
    '....oooooooo...A',
    '...oOkoooooko..A',
    '..ooooOOOOooooff',
    '..oookooookooo.A',
    '..ff.oooooooo..A',
    '..ff.oooooooo..A',
    '.....oooooooo..A',
    '.....ooo..ooo..A',
    '....kkk....kkk.A',
  ],
  b_abbot2: [
    '....SSSSSSSS......',
    '...S........S.....',
    '..S..SSSSSS..S....',
    '.....SkSSkS.......',
    '.....SSSSSS.......',
    'SS....SrrS....SS..',
    '.SS.oooooooo.SS...',
    '..SSoOSoooSOoSS...',
    'SS.ooooOOoooo.SS..',
    '.SSooSooooSoooSS..',
    '....oooooooooo....',
    '....oooooooooo....',
    '.....ooo..ooo.....',
    '....SSS....SSS....',
  ],
  b_vampire: [
    '....A.A.A.....',
    '....AAAAA.....',
    '...kkkkkkk....',
    '..xkwwwwwkx...',
    '..xwBwwwBwx...',
    '..xxwwWwwxx...',
    '.XXkkkrkkkXX..',
    'XXXkkkkkkkXXX.',
    'XXXkkkkkkkXXX.',
    'XX.kkkkkkk.XX.',
    'XX.kkkkkkk.XX.',
    'X...kk.kk...X.',
    '....kk.kk.....',
    '...kkk.kkk....',
  ],
  b_vampire2: [
    'XX.......W...W.......XX',
    'XXX......xxxxx......XXX',
    'XXXX....xBxxxBx....XXXX',
    'XXXXX...xxxxxxx...XXXXX',
    '.XXXXX...xWxWx...XXXXX.',
    '..XXXXXxxxxxxxxxXXXXX..',
    '...XXXXxxxxxxxxxXXXX...',
    '....XXX.xxxxxxx.XXX....',
    '........xxxxxxx........',
    '.........xx.xx.........',
    '........WWW.WWW........',
  ],
  b_deadeye: [
    '....kkkkkkk.....',
    '..kkkkkkkkkkk...',
    '....kfffffk.....',
    '....kfkffkf.....',
    '.....ffNNf......',
    '...iiiiiiiiii...',
    '..iiCiiiiiiCii..',
    '.gggiiiiiiiiggg.',
    '..g.iiiiiiii.g..',
    '....cccccccc....',
    '....cc....cc....',
    '....cc....cc....',
    '...kkk....kkk...',
  ],
  b_deadeye2: [
    '.....o.r.o.....',
    '....rorrror....',
    '..kkkkkkkkkkk..',
    '....kWWWWWk....',
    '....WkWWkWW....',
    '....WWWWWWW....',
    '.....WkWkW.....',
    '...XXXXXXXXX...',
    '..XXWXXXXXWXX..',
    '.gggXXXXXXXggg.',
    '..gEXXXXXXXEg..',
    '....XWXXXWX....',
    '....W.....W....',
    '...WW.....WW...',
  ],
  b_lich: [
    '...kkkkk...E.',
    '..kkkkkkk.EEE',
    '..kWWWWWk..n.',
    '..kWEWEWk..n.',
    '..kWWWWWk..n.',
    '.PPPkWkPPP.n.',
    'PPPPPPPPPPPn.',
    'PPpPPPPPpPPn.',
    '.PPPPPPPPP.n.',
    '.PPPPPPPPP.n.',
    'PPPPPPPPPPP..',
    'PP.PP.PP.PP..',
  ],
  b_lich2: [
    '..A.A.A.A.A....',
    '..AAAAAAAAA....',
    '..AEAAEAAEA....',
    '...WWWWWWW.....',
    '...WEWWWEW.....',
    '...WWWkWWW.....',
    '..E.WkWkW.E....',
    '.EEPPPPPPPEE...',
    'EEPPPPPPPPPEE..',
    '.PPpPPWPPpPP...',
    '..PPPPPPPPP....',
    '...PPPPPPP.....',
    '....E.E.E......',
    '.....E.E.......',
  ],
  b_emperor: [
    '......................AA.A...',
    '.....................jjjjjA..',
    '..jjj...............jjejjjjy.',
    '.jAAjj.......jjj...jjjjjj.y..',
    'jjAAAjj.....jjAjj.jjjjAAyy...',
    'jj...jjj...jjAAAjjjjAA.......',
    '.......jjjjAAj..jjjAA........',
    '........jAAjj....jj..........',
    '.........kk.k....k.k.........',
  ],
  b_emperor2: [
    '......................rr.r...',
    '.....................SSSSSr..',
    '..SSS...............SSBSSSSo.',
    '.SllSS.......SSS...SSSSSS.o..',
    'SSlllSS.....SSlSS.SSSSlloo...',
    'SS...SSS...SSlllSSSSll.......',
    '.......SSSSllS..SSSll........',
    '........SllSS....SS..........',
    '.........AA.A....A.A.........',
  ],
  // the super boss: a clock for a face, and later, you
  b_timeadmin: [
    '....yyyyy....',
    '...ywwwwwy...',
    '..ywwwwwwwy..',
    '..ywwwwwwwy..',
    '..ywwwkwwwy..',
    '..ywwwwwwwy..',
    '...ywwwwwy...',
    '....yyyyy....',
    '..MMMMwMMMM..',
    '.MMMmMrMmMMM.',
    '.MMMmMrMmMMM.',
    '.w.MmMMMmM.w.',
    '...MMMMMMM...',
    '...MM...MM...',
    '...kk...kk...',
  ],
  b_future: [
    '...wwwww...',
    '..wwwwwww..',
    '..rrrrrrr..',
    '..kfQkffk..',
    '...fffff...',
    '..KKMMMKK..',
    '.KKKMrMKKK.',
    'fKKKMrMKKKf',
    '.f.KMMMK.f.',
    '...KQQQK...',
    '...KK.KK...',
    '..kkk.kkk..',
  ],

  // ???: a figure in a black windbreaker and hat... and who she really is
  b_mystery: [
    '.....kkk.....',
    '....kMMMk....',
    '....kMMMk....',
    '.kkkkkkkkkkk.',
    '....KKKKK....',
    '....KqKqK....',
    '....KKKKK....',
    '...mMMKMMm...',
    '..MMMMKMMMM..',
    '.MMMmMKMmMMM.',
    '.MMMmMKMmMMM.',
    '.fMMmMKMmMMf.',
    '..MMmMKMmMM..',
    '..MMMMKMMMM..',
    '.MMMM...MMMM.',
    '...KK...KK...',
    '...kk...kk...',
  ],
  b_yunxi: [
    '...wwwww...',
    '..wwwwwww..',
    '.wwrwwwwww.',
    '.wwfffffww.',
    '.wwfqfqfww.',
    '.ww.fff.ww.',
    '.wMMwwwMMw.',
    '.MMMwwwMMM.',
    '.fMMwwwMMf.',
    '..MMMMMMM..',
    '...MMMMM...',
    '...ff.ff...',
    '...kk.kk...',
  ],

  // Satoru Gojo: blindfold first, then the Six Eyes
  b_gojo: [
    '.w.w.w.w.',
    'wwwwwwwww',
    '.wwwwwww.',
    '..kkkkk..',
    '..fkkkf..',
    '...fff...',
    '...MMM...',
    '..MMMMM..',
    '..MmMmM..',
    '.fMMMMMf.',
    '..MMMMM..',
    '..MM.MM..',
    '..MM.MM..',
    '..kk.kk..',
  ],
  b_gojo2: [
    '.w.w.w.w.',
    'wwwwwwwww',
    '.wwwwwww.',
    '..wfffw..',
    '..fQfQf..',
    '...fff...',
    '...MMM...',
    '..MMMMM..',
    '..MmMmM..',
    '.fMMMMMf.',
    '..MMMMM..',
    '..MM.MM..',
    '..MM.MM..',
    '..kk.kk..',
  ],

  // the Time Administrator's last form: you, years ago, a clock-hand scarf already round your neck
  b_past: [
    '...kkk...',
    '..kkkkk..',
    '..rrrrr..',
    '..kfffk..',
    '...fff...',
    '.QQwwwQQ.',
    '.fwwwwwf.',
    '..wwrww..',
    '..wwwww..',
    '...k.k...',
    '..kk.kk..',
  ],

  // the future arsenal, held while winding up
  w_plasma: [
    '.QQQQQ...',
    'kmmmmmQQl',
    '..km.....',
  ],
  w_rail: [
    '...QqQqQqQ...',
    'kkmmmmmmmmmmw',
    '..kk.........',
  ],
  w_beacon: [
    '..B..',
    '.mmm.',
    '.mBm.',
    '.mmm.',
  ],
  w_gravity: [
    '.k.',
    'pPp',
    'PpP',
  ],
  w_emp: [
    '.k.',
    'qbq',
    'bqb',
  ],
  w_shield: [
    '.QQQ.',
    'QmmmQ',
    'QmQmQ',
    '.QQQ.',
  ],

  // the Lich, in pieces
  lichhead: [
    '.y.y.y.',
    '.yyyyy.',
    '.wwwww.',
    '.wEwEw.',
    '..www..',
    '..w.w..',
  ],
  lichtorso: [
    '.PPPPPPP.',
    'PPwPwPwPP',
    'PpwEEEwpP',
    'PPwPwPwPP',
    '.PPPPPPP.',
    '..PpppP..',
    '..P...P..',
  ],
  lichleg: [
    '.PPP.',
    '.PwP.',
    '..w..',
    '..w..',
    '..ww.',
    '..w..',
    '..w..',
    '.www.',
  ],

  // ultimate props: the giant sword and the Buddha's palm that fall from the sky
  u_sword: [
    '..s..',
    '.sss.',
    '.sss.',
    '.sss.',
    '.sss.',
    '.sss.',
    '.sss.',
    '.sss.',
    '.sss.',
    'AAAAA',
    '..n..',
    '..n..',
    '..A..',
  ],

  // the Buddhist's golden palm
  palm: [
    '..A.A.A..',
    '.AeAeAeA.',
    '.AeAeAeA.',
    '.AeeeeeAA',
    '.AeeeeeeA',
    '.AeeeeeA.',
    '..AeeeA..',
    '..AeeeA..',
    '...AAA...',
  ],

  // the Celestial Court's heavenly general and the Lich's skeletons
  general: [
    '...rr.....',
    '..yyyy..s.',
    '..kffk..s.',
    '...ff...s.',
    '.yAyyAy.s.',
    'yyyrryyyfs',
    '.yAyyAy.s.',
    '..yyyy..s.',
    '..A..A..A.',
    '..k..k....',
  ],
  skeleton: [
    '...www....',
    '..wkwkw...',
    '..wwwww...',
    '...wkw....',
    '..w.w.w.s.',
    '.w.www.ws.',
    '...w.w..s.',
    '...www....',
    '...w.w....',
    '..ww.ww...',
  ],
  // Deadeye's second form rides a horse of hellfire
  steed: [
    '.............o.o..',
    '............ooxo..',
    '.o.........okkkkk.',
    'ooo.kkkkkkkkkkBkkk',
    '.oxkkkkkkkkkkkk...',
    '..okkkkkkkkkkk....',
    '...kk.k....k.kk...',
    '...k..k....k..k...',
    '...o..o....o..o...',
  ],

  // the Druid's companions
  tiger: [
    '..........k.',
    'k........ooo',
    'ko.oooooooeo',
    '.okokokooooo',
    '.oooooooowww',
    '..owo..owo..',
    '..k.k..k.k..',
  ],
  bear: [
    '.n.....n...',
    'nnnnnnnnn..',
    'nknnnnnnnn.',
    'nnnNnnnnnnn',
    '.nnnnnnnnnn',
    '.nnnnnnnnnn',
    '.nn..nn..nn',
    '.kk..kk..kk',
  ],
  bunny: [
    '.w.w..',
    '.w.w..',
    'wwwww.',
    'wkwkw.',
    'wwwwww',
    '.w..w.',
  ],
};

TEAM_COLORS.forEach((c, i) => { PAL[String(i)] = c; });

// Pre-render sprites to small canvases: normal, mirrored, white flash, and ink ghost.
// Canary yellow and pale gold stay luminous against the ink-blue cosmic veil.
Object.assign(PAL, { Y: '#fff23c', J: '#eee0a0', V: '#080b20', D: '#424964',
  '!': '#74601c', '#': '#c5a82b', '%': '#fffbd4', '&': '#777994', '^': '#202943' });
Object.assign(SPRITES, {
  b_yellowking: [
    '..........J..........', '......J...Y...J......', '......YJ.JYJ.JY......',
    '......!YJYYYJY!......', '.......!###!!........', '......!J%%%%J!.......',
    '......#%w%%w%#.......', '......#%kwwk%#.......', '......!Jw%%wJ!.......',
    '.....!YJw%%wJY!......', '....!YY#JwwJ#YY!.....', '...!YYY#!JJ!#YYY!....',
    '..!YYY#!J%%J!#YYY!...', '.!YYY#!JYJJYJ!#YYY!..', '!YYY#!JYY!!YYJ!#YYY!.',
    'JYY#!JYY#VV#YYJ!#YYJ.', 'JY#!JYYY!VV!YYYJ!#YJ.', '.J!JYYY#!VV!#YYYJ!J..',
    '..!JYYY#!VV!#YYYJ!...', '..JYYY#!JVVJ!#YYYJ...', '..JYYY#!YVVY!#YYYJ...',
    '.!JYY#!JYVVYJ!#YYJ!..', '.JYYY#!YYVVYY!#YYYJ..', '.JYY#!JYYVVYYJ!#YYJ..',
    '!JYY#!YYYVVYYY!#YYJ!.', 'JYYY!JYY!VV!YYJ!YYYJ.', 'JYY!JYY!..V.!YYJ!YYJ.',
    '.JY!YY!.....!YY!YJ..', '..J!Y!.......!Y!J...',
  ],
  b_yellowking2: Array.from({length:27},(_,y)=>Array.from({length:25},(_,x)=>{
    const dx=(x-12)/11,dy=(y-13)/12;
    const edge=dx*dx+dy*dy;
    if(edge>1+Math.sin(y*1.7)*.13) return '.';
    if(edge>.83 && x<12) return '^';
    if((x*13+y*17)%43===0) return '^';
    return 'V';
  }).join('')),
  courtier: ['....J....','...#Y#...','..#Y!Y#..','..YVVVY..','..#VVV#..','...!V!...',
    '..J!#!J..','.J#!Y!#J.','J.!#Y#!.J','..#!Y!#..','..Y!V!Y..','.J!V.V!J.','..!V.V!..'],
});

// ---- the newer foes: flesh, stone, flame, shell, silk and spirit ----
Object.assign(PAL, { a: '#c86b8a', I: '#7a3a5a', '@': '#9ad04a', $: '#5a5f66', '*': '#a8a294', '+': '#ff7a1a', '~': '#d2502a', '<': '#f2a07a',
  '>': '#2f7f6f', '?': '#d8e8ff', '/': '#7a4ad0', '|': '#2a1f48', ':': '#c9a0ff', ';': '#ff9ad8', ',': '#2a1830', '=': '#5a2a40',
  '{': '#5fe8c8', '}': '#c050ff', '-': '#3a3a40' });
Object.assign(SPRITES, {
  // bruisers: the Oni and its iron kanabo; the Mutant (its growths are drawn on top)
  oni: [
    '...W......W....',
    '...WwwwwwwW....',
    '..wwRRRRRRww..-',
    '..wReeRReeRw.-g',
    '...RRkkkkRR.-g.',
    '....RWRRWR..-g.',
    '..RRRRRRRRRR-..',
    '.RRdRRRRRRdRR..',
    '.RR.RRRRRR.R...',
    '.RR.ykykyky....',
    '....yykyyky....',
    '....RRR..RRR...',
    '...kkkk..kkkk..',
  ],
  oni_wind: [
    '-g.............',
    'g-g............',
    '.g-.W......W...',
    '..-gWwwwwwwW...',
    '...RwRRRRRRww..',
    '...RReeRReeRw..',
    '....RRkkkkRR...',
    '.....RWRRWR....',
    '...RRRRRRRRRR..',
    '..RRdRRRRRRdRR.',
    '..RR.RRRRRR.RR.',
    '.....ykykyky...',
    '.....yykyyky...',
    '.....RRR..RRR..',
    '....kkkk..kkkk.',
  ],
  oni_atk: [
    '...W......W....',
    '...WwwwwwwW....',
    '..wwRRRRRRww...',
    '..wReeRReeRw...',
    '...RRkkkkRR....',
    '....RWRRWR.....',
    '..RRRRRRRRRRR..',
    '.RRdRRRRRRdRRR.',
    '.RR.RRRRRR..RR-',
    '.RR.ykykyky..-g',
    '....yykyyky.-g-',
    '....RRR..RRRg-g',
    '...kkkk..kkk-g-',
  ],
  mutant: [
    '....aaaa....',
    '...aI@@Ia...',
    '..aaBaaBaa..',
    '..aIkWWkIa..',
    '...aaWWaa...',
    '.aaaaaaaaaa.',
    'aaIaa@aaIaaa',
    'aa.aaaaIa.aa',
    'aI.aIaaaa.aI',
    '.@.aaaaaa.@.',
    '...aa..aa...',
    '..IIa..aII..',
  ],

  // duelists: the Boxer (gloves up, jab, cocked hook); the Scythe Reaper
  boxer: [
    '...kkk......',
    '..kkkkk.....',
    '..kfffk.....',
    '...ffF......',
    '..ffffrr....',
    '.ffFfrrrw...',
    'rrfFff.r....',
    'rrrff.......',
    '..uuuu......',
    '..uwwu......',
    '..f..f......',
    '.ww..ww.....',
  ],
  boxer_atk: [
    '...kkk......',
    '..kkkkk.....',
    '..kfffk.....',
    '...ffF......',
    '..ffffffffrr',
    '.ffFff...rrw',
    'rrfFff......',
    'rrrff.......',
    '..uuuu......',
    '..uwwu......',
    '..f...f.....',
    '.ww....ww...',
  ],
  boxer_wind: [
    '....kkk.....',
    '...kkkkk....',
    '...kfffk....',
    '....ffF.....',
    'rr.ffff.....',
    'rrrffFfrr...',
    '..fFff.rrw..',
    '...ff.......',
    '..uuuu......',
    '..uwwu......',
    '..f..f......',
    '.ww..ww.....',
  ],
  reaper: [
    '.........sggg.',
    '..kkk....n..gg',
    '.kkkkk...n...g',
    '.kEWEk...n....',
    '.kWWWk...n....',
    '.MkkkMM..n....',
    'MMMMMMMWWn....',
    'MMMMMMM..n....',
    '.MMMMMM..n....',
    '.MMMMMM..n....',
    'MMMMMMMM.n....',
    'MMMMMMMMMn....',
    '.M.M.M.M.n....',
  ],
  reaper_wind: [
    'gg............',
    '.gsnnWnnnWnn..',
    '..kkk.........',
    '.kkkkk........',
    '.kEWEk........',
    '.kWWWk........',
    '.MkkkMM.......',
    'MMMMMMM.......',
    'MMMMMMM.......',
    '.MMMMMM.......',
    '.MMMMMM.......',
    'MMMMMMMM......',
    'MMMMMMMMM.....',
    '.M.M.M.M......',
  ],
  reaper_atk: [
    '..kkk.........',
    '.kkkkk........',
    '.kEWEk........',
    '.kWWWk........',
    '.MkkkMM.......',
    'MMMMMMMWnn....',
    'MMMMMMM...nn..',
    '.MMMMMM.....n.',
    '.MMMMMM.....s.',
    'MMMMMMMM...gg.',
    'MMMMMMMMM.gg..',
    '.M.M.M.Mggg...',
  ],

  // guardians: the Crab Warrior, shell on and shell off
  crab: [
    '...k..k.......',
    '...~..~...~~~.',
    '..~~~~~~~.~..~',
    '.~~<~~~~<~~~~~',
    '~~~~~~~~~~~~..',
    '~~<~~~~~~<~...',
    '.~~~~~~~~~~...',
    '..<<<<<<<<....',
    '.~.~.~~.~.~...',
    '~..~....~..~..',
  ],
  crab_wind: [
    '...k..k...~~..',
    '...~..~...~...',
    '..~~~~~~~.~...',
    '.~~<~~~~<~~.~~',
    '~~~~~~~~~~~~~.',
    '~~<~~~~~~<~...',
    '.~~~~~~~~~~...',
    '..<<<<<<<<....',
    '.~.~.~~.~.~...',
    '~..~....~..~..',
  ],
  crab_atk: [
    '...k..k.......',
    '...~..~.......',
    '..~~~~~~~.....',
    '.~~<~~~~<~~~~~',
    '~~~~~~~~~~~~~~',
    '~~<~~~~~~<~...',
    '.~~~~~~~~~~...',
    '..<<<<<<<<....',
    '.~.~.~~.~.~...',
    '~..~....~..~..',
  ],

  // tricksters: the Spider Demon (legs are drawn live), the Shapeshifter and its beasts, the Magician and the Kitsune
  spider: [
    '.........W.W..',
    '...,,,,..====.',
    '.,,,,,,,=BB=B=',
    ',,,xx,,,,====.',
    ',,xxxx,,,,===W',
    ',,,xx,,,,,,,..',
    '.,,,,,,,......',
    '..,,,,........',
  ],
  shifter: [
    '..TTTT....',
    '.TnnnnT...',
    '.TneenT...',
    '..nffn....',
    '.TTWWTT...',
    'TnnnnnnT..',
    'f.nTTn.f..',
    '..nnnn....',
    '..n..n....',
    '.kk..kk...',
  ],
  sf_tiger: [
    '...........q..q.',
    '...........oooo.',
    '..........ooeqoo',
    '....oooooooooooo',
    'q..ooqooqooqoo..',
    '.qqoooooooooww..',
    '...ooo.....ooo..',
    '...o.o.....o.o..',
    '..kk.kk...kk.kk.',
  ],
  sf_bear: [
    '..........nn.n.',
    '.........nnnnnn',
    '.........nkennn',
    '...gggggnnnnnkk',
    '..gsgsgsgnnnnW.',
    '.nnnnnnnnnnnn..',
    'nnngnnnngnnnn..',
    'nnnnnnnnnnnnn..',
    '.nnn.....nnn...',
    '.nnn.....nnn...',
    'kkkk....kkkk...',
  ],
  sf_serpent: [
    '..........ZZZZ..',
    '.........ZGGGGZ.',
    '.........GeGGGGW',
    '.........ZGGGG.W',
    '..........GGZ...',
    '..GGGG...GGZ....',
    '.GZ@@ZG.GGZ.....',
    'GZ@ZZ@ZGGZ......',
    '.GZZZZZZZ.......',
  ],
  sf_roc: [
    'w..............w',
    'ww.....bbb....ww',
    '.www..bbbbb..www',
    '..wwwbbbbeby.ww.',
    '...wwbbbbbbwww..',
    '....wbbbbbbww...',
    '.....bbbbbb.....',
    '......b..b......',
    '.....yy..yy.....',
  ],
  sf_drake: [
    '............R...',
    '...........RRR..',
    '.....dd...RReRR.',
    '..R.ddddd.RRRRyy',
    '.RR..RRRRRRRR...',
    '.R..RRoRRoRRR...',
    '..RRRRRRRRRRR...',
    '....RoRRRRoR....',
    '....RR....RR....',
    '....RR....RR....',
    '...kkk...kkk....',
  ],
  magician: [
    '..kkkk....',
    '..kkkk....',
    '..xxxx....',
    '.kkkkkk...',
    '..ffff....',
    '..fkfk....',
    '...ff...w.',
    '.xkwkkx.k.',
    'xxkkkkxxk.',
    'xxkkkkxk..',
    'xx.kk.xx..',
    'x..kk..x..',
    '..kk.kk...',
  ],
  kitsune: [
    '........w..w',
    '........wwww',
    '.......wwqww',
    '.......;www;',
    '..wwwwwwwww.',
    '.wwwwwwwww..',
    '.ww.....ww..',
    '.w.......w..',
    'kk......kk..',
  ],
  rabbit: [
    '.w.w..',
    '.w.w..',
    '.www..',
    'wwkw..',
    'wwww..',
    '.ww.w.',
  ],

  // marksmen: the Archer (bow, drawn bow, knife)
  archer: [
    '...jjj....n..',
    '..jjjjj....n.',
    '..jfkf.....nw',
    '...ff......nw',
    '..jjjjjffffnw',
    '.jjhjjj....nw',
    '.jjhjjj....n.',
    '..hhhh....n..',
    '..j..j.......',
    '..t..t.......',
    '.TT..TT......',
  ],
  archer_wind: [
    '...jjj....n..',
    '..jjjjj....n.',
    '..jfkf......n',
    '...ff.......n',
    '..jjjjwsssssn',
    '.jjhjjj.....n',
    '.jjhjjj.....n',
    '..hhhh.....n.',
    '..j..j....n..',
    '..t..t.......',
    '.TT..TT......',
  ],
  archer_knife: [
    '...jjj.......',
    '..jjjjj......',
    '..jfkf.......',
    '...ff........',
    '..jjjjjfffss.',
    '.jjhjjj......',
    '.jjhjjj..n...',
    '..hhhh..n....',
    '..j..j.n.....',
    '..t..t.......',
    '.TT..TT......',
  ],

  // casters: the Alchemist, the Gravity Mage, the Formation Master
  alchemist: [
    '...nnn.....',
    '..nnnnn....',
    '..nQgQg....',
    '...fff.....',
    '..WWWWW....',
    '.W{W}WoWf..',
    'fWnnnnnW.{.',
    '..nnnnn..{.',
    '..nnnnn....',
    '..n...n....',
    '.kk...kk...',
  ],
  gravmage: [
    '...||||....',
    '..||||||...',
    '..|:|:||...',
    '...|||||...',
    '..//////...',
    './//:///...',
    'f//////f...',
    './/:///....',
    '..//////...',
    '..///////..',
    '...//////..',
    '....////...',
    '.....//....',
  ],
  formation: [
    '....kk.....',
    '...kAAk....',
    '...kffk....',
    '....ff.....',
    '..uuuuuu...',
    '.uuwuuwuu..',
    'fuuukwuufAA',
    '..uuwkuu.AA',
    '.uuuuuuuu..',
    '.uuuuuuuu..',
    'uuuuuuuuuu.',
    '..k....k...',
  ],

  // colossi: the Stone Golem, the Hydra's body (its heads are drawn live), the Phoenix and its egg
  golem: [
    '....$$$$$$....',
    '...$******$...',
    '...$*Q**Q*$...',
    '...$******$...',
    '.$$$$$$$$$$$$.',
    '$**$**$$**$**$',
    '$**$*$QQ$*$**$',
    '$*Z$**$$**$Z*$',
    '$**.$****$.**$',
    '$$..$*$$*$..$$',
    '.Z..$**.*$..Z.',
    '....$**.**$...',
    '...$$**.**$$..',
    '...$$$$.$$$$..',
  ],
  hydra: [
    '.....>>>>>>>......',
    '...>>>>>>>>>>>....',
    '..>>G>>>G>>>>>>...',
    '.>>>>>>>>>>>>>>>..',
    '>>>GGGGGGGGG>>>>..',
    '>>.GGGGGGGGG.>>...',
    '>...>>>..>>>......',
    '....>>>..>>>......',
    '...kkk...kkk......',
  ],
  phoenix: [
    '+..............+',
    '++............++',
    '.++....SS....++.',
    '..+++.S++S.+++..',
    '...++++SeSy++...',
    '....++SSSS++....',
    '.....+SSSS+.....',
    '......S++S......',
    '.......SS.......',
    '......+..+......',
    '.....+....+.....',
    '....+......+....',
  ],
  phoenix_egg: [
    '..+++..',
    '.+SSS+.',
    '+SSlSS+',
    '+SlSSS+',
    '+SSSSS+',
    '+SSSS++',
    '.+SS+..',
    '..++...',
  ],
});
// ---- the newer super bosses and the swarm ----
Object.assign(SPRITES, {
  b_blind: [
    '....www......',
    '...wwwww.....',
    '...wffffw....',
    '...WWWWWW....',
    '...ffffff....',
    '....ffff.....',
    '...mmffmm....',
    '..mmmMMmmm...',
    '.mmmmMMmmmm..',
    '.f.mmMMmm.fn.',
    '...mmMMmm..n.',
    '...mmmmmm..n.',
    '...mmmmmm..n.',
    '...mm..mm..n.',
    '..kkk..kkk.n.',
  ],
  b_blind2: [
    '..wwwww......',
    '.wwwwwww.....',
    '.wwffffww....',
    '.w.WWBffw....',
    '.w.ffffff....',
    '....ffff.....',
    '...xxffxx....',
    '..xxx;;xxx...',
    '.xxxx;;xxxx..',
    '.f.xx;;xx.fs.',
    '...xxmmxx..s.',
    '...xmmmmx..s.',
    '...xmmmmx..s.',
    '...mm..mm..n.',
    '..kkk..kkk.n.',
  ],
  b_wukong: [
    '.rr.........',
    '...rr.......',
    '....rSSSS...',
    '....HHHHHH..',
    '...HHffffHH.',
    '...HfefefH..',
    '...HHffrfH..',
    '....HffffH.R',
    '..HySySyyH.S',
    '.HHyyyyyyHHS',
    'H..okokoo..S',
    'H..ookoko..S',
    '.H.HH..HH..S',
    '..RRR..RRR.R',
  ],
  b_wukong2: [
    '......rr..rr........',
    '.......rSSSSr.......',
    '.......HHHHHH.......',
    '......HHffffHH......',
    '......HfeffefH......',
    '...HHHHffkkffHHHH...',
    '..HHHHHHffffHHHHHH..',
    '.HHHHHHHHHHHHHHHHHH.',
    'HHHHHHFFFFFFFFHHHHHH',
    'HHHH.HFFFFFFFFH.HHHH',
    'HHH..HHFFFFFFHH..HHH',
    'HHH..HHHFFFFHHH..HHH',
    'HHH...ySySySySy..HHH',
    'FFF...okokokoko..FFF',
    '......HHHH.HHHH.....',
    '.....HHHH...HHHH....',
    '.....HHH.....HHH....',
    '....RRRR.....RRRR...',
  ],
  b_mahoraga: [
    '....WW....WW....',
    '...WWW.ww.WWW...',
    '..WWWwwwwwwWWW..',
    '.....wwWWww.....',
    '.....wwkkww.....',
    '......wwww......',
    '...wwwwwwwwww...',
    '..wwwWwwwwWwww..',
    '.wwwwwWwwWwwwwwl',
    '.ww.wwwwwwww.wwl',
    '.ww.wwWwwWww.wsl',
    '.ff..wwwwww..wsl',
    '.....kkkkkk...sl',
    '.....kMkkMk...sl',
    '.....ww..ww....l',
    '.....ww..ww.....',
    '.....ww..ww.....',
    '....kkk..kkk....',
  ],
  b_queen: [
    '.....P....P.....',
    '....PP.pp.PP....',
    '...PP.pppp.PP...',
    '.......pSpS.....',
    '......pppppp....',
    '..W...p@pp@p..W.',
    '.WW..pppppppp.WW',
    'WW..pPpppppPp..W',
    'W..ppPppppppPpp.',
    '...pPPpppppPPp..',
    '...ppPpp@ppPpp..',
    '....ppppppppp...',
    '....pP.pp.Pp....',
    '...pP..pp..Pp...',
    '..pP...pp...Pp..',
    '.PP....PP....PP.',
  ],
  zergling: [
    '.....pp..',
    'W...pSpp.',
    '.WpppppWW',
    '.ppPppp..',
    '.p.p.p.p.',
    'p..p..p..',
  ],
  spitter: [
    '..WWW...',
    '.pppp...',
    'pSpppW..',
    '.ppppW..',
    '..pPpWW.',
    '..pPpp..',
    '..ppp...',
    '.pp.pp..',
    'p.....p.',
  ],
  brute: [
    '.....PPPP....',
    'W...PPPPPPP..',
    'WW.PPPpppPPP.',
    '.WWPSppppppPP',
    '..PpppppppppP',
    '..PPppppppPPP',
    '...PPPPPPPPP.',
    '...PP.PP.PP..',
    '...PP.PP.PP..',
    '..kkk.kk.kkk.',
  ],
  bloater: [
    '..@@@@..',
    '.@@ll@@.',
    '@@@@@@@@',
    '@@@pp@@@',
    '.@@@@@@.',
    '..p..p..',
    '.p....p.',
  ],
});
// Mahoraga's second form: the blade burns gold; the Queen's second form glows with bile
SPRITES.b_mahoraga2 = SPRITES.b_mahoraga.map(r => r.replace(/[Wls]/g, c => c === 'W' ? '?' : 'S'));
SPRITES.b_queen2 = [
  '.....}}}.....',
  '....}}}}}....',
  '...}}::::}...',
  '...}:S::S}...',
  '...}}::::}}..',
  '..}.}:::}.}..',
  'W....::.....W',
  'WW.pPPpPPp.WW',
  '.WWpppPpppWW.',
  '..Wp:pPp:pW..',
  '...p:pppp:p..',
  '...W.pPp.W...',
  '.....pPp.....',
  '....ppPpp....',
  '....pp.pp....',
  '....pp.pp....',
  '....P...P....',
  '....p...p....',
  '....p...p....',
  '...PP...PP...',
  '...P.....P...',
  '..PP.....PP..',
];
SPRITES.bladeguard = [
  '....pp.....',
  '...pSpp....',
  '..ppppp..W.',
  'W..pPp..WW.',
  'WW.pPpWW...',
  '.WWpPp.....',
  '...ppp.....',
  '..pPPp.....',
  '..p..p.....',
  '.p....p....',
  'p......p...',
];


// ---- the Headless Scholar and what lives in his painting ----
Object.assign(SPRITES, {
  b_scholar: [
    '...KKK...',
    '..wKKKw..',
    '.wwbwbww.',
    'wwwwbwwww',
    'ww.wbw.ww',
    'w..wbw..w',
    'f..wwww.f',
    '...wwww..',
    '..wwWwww.',
    '..wwwWww.',
    '.wwwwWwww',
    '..kk..kk.',
  ],
  recitinghead: [
    '.kkkk.',
    'kWWWWk',
    'WkWWkW',
    'WWWWWW',
    '.WkkW.',
    '..kk..',
  ],
  rollinghead: [
    '.kkk.',
    'kWWWk',
    'WkWkW',
    'WWkWW',
    '.WWW.',
  ],
  chessist: [
    '..kkk....',
    '.kWWWk...',
    '..WkW....',
    '..mmm.kwk',
    '.mmmmmwkw',
    'm.mmm.kwk',
    '..mmm....',
    '..m.m....',
    '.kk.kk...',
  ],
  lampbearer: [
    '..kkk..n.',
    '.kWWWk.n.',
    '..WkW..n.',
    '..mmm.rer',
    '.mmmmm.e.',
    'm.mmm..r.',
    '..mmm....',
    '..m.m....',
    '.kk.kk...',
  ],
  butcher: [
    '..kkk....',
    '.kWWWk...',
    '..WkW..gg',
    '..mmm.ggg',
    '.mmmmmgg.',
    'm.mmm.n..',
    '..mmm....',
    '..m.m....',
    '.kk.kk...',
  ],
  coffinbearer: [
    '.NNNNN.....',
    '.NnnnN.kkk.',
    '.NnnnNkWWWk',
    '.NnnnN.WkW.',
    '.NnnnNmmmm.',
    '.NnnnNmmmmm',
    '.NnnnN.mmm.',
    '.NNNNN.mmm.',
    '.......m.m.',
    '......kk.kk',
  ],
  flutist: [
    '..kkk....',
    '.kWWWk...',
    '..WkWnnnn',
    '..mmm....',
    '.mmmmm...',
    'm.mmm.m..',
    '..mmm....',
    '..m.m....',
    '.kk.kk...',
  ],
});
// before the painting opens he still wears his head: long black hair held by a silver pin, a pale face, eyes closed
const SCHOLAR_HEAD = ['...kkk...', '..kkkkkg.', '..kfffk..', '..kFfFk..', '..kfffk..', '.kkkfkkk.'];
SPRITES.b_scholar1 = [...SCHOLAR_HEAD, '.kwbwbwk.', 'wkwwbwwkw', 'wk.wbw.kw', ...SPRITES.b_scholar.slice(5)]; // and it falls down his back, past his shoulders
// the painting's dragons: the eastern dragon in black ink, a red eye
SPRITES.inkdragon = SPRITES.eastdragon.map(r => r.replace(/[jAey]/g, c => ({ j: 'k', A: 'm', e: 'B', y: 'W' })[c]));

// the Archer's knife, the Crab's soft molt, and the Phoenix reborn in blue and then white flame
SPRITES.archer_w_strike = SPRITES.archer_a_strike = SPRITES.archer_w_backflip = SPRITES.archer_a_backflip = SPRITES.archer_knife;
SPRITES.crab_molt = SPRITES.crab.map(r => r.replace(/[~<]/g, c => c === '~' ? '<' : 'w'));
SPRITES.crab_molt_wind = SPRITES.crab_wind.map(r => r.replace(/[~<]/g, c => c === '~' ? '<' : 'w'));
SPRITES.crab_molt_atk = SPRITES.crab_atk.map(r => r.replace(/[~<]/g, c => c === '~' ? '<' : 'w'));
SPRITES.phoenix2 = SPRITES.phoenix.map(r => r.replace(/[+S]/g, c => c === '+' ? 'q' : 'b'));
SPRITES.phoenix3 = SPRITES.phoenix.map(r => r.replace(/[+S]/g, c => c === '+' ? 'S' : 'l'));


// ---------- the worlds' own foes ----------
Object.assign(SPRITES, {
  // Red Dust Temple: a monk with a long staff; a bronze arhat
  staffmonk: [
    '..........A',
    '...ff....A.',
    '..ffff..A..',
    '...ff..A...',
    '.oooooA....',
    'f.oooA.f...',
    '..oAoo.....',
    '.A.oooo....',
    'A..O..O....',
    '...k..k....',
  ],
  arhat: [
    '...AAAA...',
    '..AiAAiA..',
    '..AAAAAA..',
    '...AeeA...',
    '.AAAAAAAA.',
    'AAiAAAAiAA',
    'AA.AAAA.AA',
    '...AHHA...',
    '...AA.AA..',
    '..AAA.AAA.',
  ],
  // Night Country: a stone gargoyle; a pale, hunched ghoul
  gargoyle: [
    '..*......*..',
    '..**....**..',
    '$..******..$',
    '$$.*B**B*.$$',
    '$$$******$$$',
    '.$$$****$$$.',
    '..$.****.$..',
    '....*$$*....',
    '...**..**...',
    '..$$....$$..',
  ],
  ghoul: [
    '..GGG....',
    '.GZGZG...',
    '.GGGGG...',
    '..GxG....',
    '.GGGGGG..',
    'G.GGGG.G.',
    'G..GG..G.',
    '..G..G...',
    '.GG..GG..',
  ],
  // Myriad Sword Peaks: an outer disciple, sword at the ready
  disciple: [
    '...kk....',
    '..kkkk...',
    '..kffk...',
    '...ff..s.',
    '.bbbbbs..',
    'f.bbbb...',
    '..bbbb...',
    '..b..b...',
    '.kk..kk..',
  ],
  // Netherworld Abyss: a little imp; a hound of fire
  imp: [
    'R....R',
    'RRRRRR',
    'RBRRBR',
    '.RRRR.',
    'R.RR.R',
    '.R..R~',
  ],
  hellhound: [
    '+.........',
    'kk+.......',
    'kBkk......',
    'kkkkkkkk+.',
    '.kkkkkkk~+',
    '.k.k..k.k.',
    '.k.k..k.k.',
  ],
  // Eastern Isles: the snow woman; a long-nosed tengu with black wings
  yukionna: [
    '..kkkk..',
    '.kkwwkk.',
    '.kwwwwk.',
    '.k.bb.k.',
    '.?????..',
    'w?????w.',
    '.?b??b..',
    '.??????.',
    '.??????.',
    '..????..',
  ],
  tengu: [
    '...kkk....',
    '..kRRRk...',
    '..RBRRRRR.',
    '...RRR....',
    'kk.www.kk.',
    'kkkwwwkkk.',
    'kk.www.kk.',
    '...wAw....',
    '...w.w....',
    '..kk.kk...',
  ],
  // Timestream: a drone of the swarm; a sentry drone; the chronomancer; the glitch; a paradox twin
  swarmdrone: [
    'g.g.g',
    '.mmm.',
    'gmBmg',
    '.mmm.',
  ],
  sentry: [
    '..ggg...',
    '.gmmmg..',
    'gmmBmmgB',
    '.gmmmg..',
    '..g.g...',
    '........',
    '..m.m...',
  ],
  chronomancer: [
    '...kk...',
    '..kQQk..',
    '..kffk..',
    '...ff...',
    '.zzzzzz.',
    'z.zSSz.z',
    '..zSkz..',
    '..zzzz..',
    '.zzzzzz.',
    '.zz..zz.',
  ],
  glitch: [
    '..}}}...',
    '.}{}{}..',
    '.}}}}}..',
    '..{}....',
    '.}}}}{}.',
    '}.{}}}.{',
    '..}}{}..',
    '..}..{..',
    '.}}..{{.',
  ],
  twin: [
    '...kw...',
    '..kkww..',
    '..kfFw..',
    '...fF...',
    '.kkkwww.',
    'k.kkww.w',
    '..kkww..',
    '..k..w..',
    '.kk..ww.',
  ],
  // Cursed Domain: a fly head; a cursed spirit; a stitched corpse; the straw doll sorcerer; the cursed speech
  // sorcerer, mouth covered; a shikigami hound
  flyhead: [
    'g.....g',
    'gg.f.gg',
    '.gfffg.',
    '..fBf..',
    '..kfk..',
  ],
  cspirit: [
    '..PPPP..',
    '.PpppPP.',
    'PpBppBpP',
    'PppppppP',
    'PpkkkkpP',
    '.PpwwpP.',
    '.P.PP.P.',
    'P..P..P.',
  ],
  ccorpse: [
    '...$$$$...',
    '..$*k*k$..',
    '..$****$..',
    '...$x$$...',
    '.$$$$$$$$.',
    '$*$*x**$*$',
    '$*$x**x$*$',
    '...$**$...',
    '...$..$...',
    '..$$..$$..',
  ],
  strawdoll: [
    '..kkk.....',
    '.kkkkk....',
    '..kffk....',
    '...ff..gg.',
    '.MMMMM.Tg.',
    'M.MMMM.T..',
    'f.MMMM..i.',
    '..MMMM.iii',
    '..M..M..i.',
    '.kk..kk.i.',
  ],
  cspeech: [
    '...kk...',
    '..kkkk..',
    '..kffk..',
    '..kggk..',
    '.kkkkkk.',
    'k.kkkk.k',
    '..kkkk..',
    '..k..k..',
    '.kk..kk.',
  ],
  shikigami: [
    'w.........',
    'ww.w......',
    'wkww......',
    'wwwwwwwww.',
    '.wwwwwwwkw',
    '.w.w..w.w.',
    '.w.w..w.w.',
  ],
  // The Pallid Kingdom: a cultist of Hastur; a byakhee; a pallid dancer; a pallid knight; the horror from the lake
  cultist: [
    '...yy...',
    '..yyyy..',
    '..yJJy..',
    '..yJJy..',
    '.yyyyyy.',
    'y.yyyy.y',
    'J.yyyy.J',
    '..yyyy..',
    '.yyyyyy.',
    '.yy..yy.',
  ],
  byakhee: [
    'D...........D',
    'DD.........DD',
    '.DD..|||..DD.',
    '..DD|BB||DD..',
    '...D||||D....',
    '....||||.....',
    '....|..|.....',
    '...|....|....',
  ],
  dancer: [
    '...JJ...',
    '..JJJJ..',
    '..J%%J..',
    '...JJ...',
    '.;yyyy;.',
    ';.yyyy.;',
    '..yyyy..',
    '.yyyyyy.',
    'yyyyyyyy',
    '...k.k..',
  ],
  pknight: [
    '...##...',
    '..####..',
    '..#%%#..',
    '..#!!#..',
    '.######.',
    '#!####!#',
    '#.####.#',
    '..#!!#..',
    '..#..#..',
    '.!!..!!.',
  ],
  horror: [
    '....DDDDDD....',
    '...D^^^^^^D...',
    '..D^Y^^^^Y^D..',
    '..D^^^^^^^^D..',
    '..D^^kkkk^^D..',
    '.DD^^^^^^^^DD.',
    'D.D^^^^^^^^D.D',
    'D..DD^^^^DD..D',
    '.D..D.DD.D..D.',
    '.D.D..D..D.D..',
    'D..D.D..D..D.D',
    '..D..D..D..D..',
  ],
});

const SPRITE_CACHE = {};
function bakeSprite(name) {
  const rows = SPRITES[name];
  const w = Math.max(...rows.map(r => r.length)), h = rows.length;
  const make = (flip, solid) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.') continue;
        g.fillStyle = solid || PAL[ch];
        g.fillRect(flip ? w - 1 - x : x, y, 1, 1);
      }
    });
    return c;
  };
  const count = {};
  for (const row of rows) for (const ch of row) if (ch !== '.' && ch !== 'k') count[ch] = (count[ch] || 0) + 1;
  const colors = Object.keys(count).sort((a, b) => count[b] - count[a]).slice(0, 2).map(ch => PAL[ch]);
  SPRITE_CACHE[name] = {
    w, h, colors, n: make(false), f: make(true),
    flash: make(false, '#ffffff'), flashF: make(true, '#ffffff'),
    ghost: make(false, '#3a4a6a'), ghostF: make(true, '#3a4a6a'),
  };
}
// the Lich King's dragon: the western dragon, picked down to the bone
SPRITES.bonedragon = SPRITES.westdragon.map(r => r.replace(/e/g, 'E').replace(/[RW]/g, 'w').replace(/y/g, 'W'));
// Foes drawn as a single picture get three derived poses: a stride (legs apart), a wind-up (leaning back) and a swing (leaning in).
function derivePose(rows, kind) {
  const h = rows.length, cut = Math.round(h * 0.6), w = Math.max(...rows.map(r => r.length));
  const shift = (r, d) => (d > 0 ? '.' + r.slice(0, -1) : r.slice(1) + '.');
  return rows.map((r0, y) => {
    let r = '.' + r0.padEnd(w, '.') + '.';
    if (kind === 'wind' && y < cut) r = shift(r, y < cut / 2 ? -1 : -1);
    if (kind === 'atk' && y < cut) r = shift(shift(r, 1), y < cut / 2 ? 1 : -1);
    if (kind === 'walk' && y >= h - 2) { const m = r.length >> 1, L = r.slice(0, m), Rt = r.slice(m); r = y === h - 1 ? L.slice(1) + '.' + '.' + Rt.slice(0, -1) : r; }
    return r;
  });
}
{
  const foeSprites = new Set([...Object.values(ENEMY_TYPES).flatMap(d => [d.sprite, d.sprite2]), ...Object.keys(ENEMY_TYPES), ...Object.values(SHIFT_FORMS).map(f => f.sprite), 'kitsune', 'phoenix2', 'phoenix3']);
  for (const name of [...foeSprites]) {
    if (!name || !SPRITES[name] || typeof SPRITES[name][0] !== 'string' || name === 'b_yellowking2') continue;
    for (const kind of ['wind', 'atk', 'walk']) if (!SPRITES[name + '_' + kind]) SPRITES[name + '_' + kind] = derivePose(SPRITES[name], kind);
  }
}
Object.keys(SPRITES).forEach(bakeSprite);

// a hero pose in its team's colours (baked on first use)
function teamSprite(name, team) {
  const key = name + '@' + team;
  if (!SPRITE_CACHE[key]) { SPRITES[key] = SPRITES[name].map(r => r.replace(/r/g, String(team))); bakeSprite(key); }
  return key;
}

// ---------- skins for the fighter, bought with jade ----------
// Each recolours the fighter by region (hair, headband, skin, gi, belt, legs) and adds an effect of its own.
const HERO_SKINS = [
  { id: 'classic', name: 'Lei Tai Classic', cost: 0, desc: 'White gi, red headband. Where it all started.' },
  { id: 'shadow', name: 'Shadow Ninja', cost: 300, hair: 'M', band: 'B', gi: 'M', belt: 'B', legs: 'k', fx: 'smoke', color: '#5a6278', desc: 'Black on black, leaving smoke where it stood.' },
  { id: 'jade', name: 'Jade Monk', cost: 400, hair: 'f', band: 'A', gi: 'o', belt: 'j', legs: 'O', fx: 'motes', color: '#3f8a4a', desc: 'Shaven head, saffron robe, a jade sash and drifting gold motes.' },
  { id: 'crimson', name: 'Crimson Warlord', cost: 550, hair: 'd', band: 'S', gi: 'R', belt: 'k', legs: 'd', fx: 'embers', color: '#ff3a2a', desc: 'Blood-red armour shedding embers.' },
  { id: 'frost', name: 'Frost Sage', cost: 650, hair: 'w', band: 'b', gi: 'q', belt: 'u', legs: 'U', fx: 'snow', color: '#9fd8ff', desc: 'Ice-blue robes; snow falls around it.' },
  { id: 'sakura', name: 'Sakura Blade', cost: 800, hair: ';', band: 'w', gi: 'w', belt: ';', legs: 'x', fx: 'petals', color: '#ff9ad8', desc: 'Pink hair and a trail of cherry blossom.' },
  { id: 'thunder', name: 'Thunder God', cost: 900, hair: 'S', band: 'Q', gi: 'u', belt: 'S', legs: 'U', fx: 'sparks', color: '#7fe0ff', desc: 'Golden hair crackling with lightning.' },
  { id: 'void', name: 'Void Walker', cost: 1200, hair: '|', band: ':', gi: '/', belt: ':', legs: '|', fx: 'void', color: '#7a4ad0', desc: 'Violet robes, afterimages, space bending around it.' },
  { id: 'golden', name: 'Golden Emperor', cost: 1600, hair: 'S', band: 'B', gi: 'S', belt: 'R', legs: 'A', fx: 'gold', color: '#ffd84a', desc: 'Imperial gold from head to toe, with a halo of light.' },
  { id: 'phoenix', name: 'Phoenix Ascendant', cost: 2200, hair: '+', band: 'S', gi: 'R', belt: '+', legs: 'd', fx: 'wings', color: '#ff7a1a', desc: 'Hair of flame and wings of fire at its back.' },
  { id: 'celestial', name: 'Celestial', cost: 3000, hair: 'l', band: 'Q', gi: 'K', belt: 'Q', legs: 'K', fx: 'stars', color: '#bfe0ff', desc: 'A body of night sky, stars turning inside it.' },
];
const SKIN_BY_ID = Object.fromEntries(HERO_SKINS.map(s => [s.id, s]));
// a pose of the fighter in a skin (baked on first use)
function skinSprite(name, id) {
  const sk = SKIN_BY_ID[id];
  if (!sk || !sk.gi) return name;
  const key = name + '#' + id;
  if (!SPRITE_CACHE[key]) {
    SPRITES[key] = SPRITES[name].map((row, y) => row.replace(/[krfw]/g, c => {
      if (c === 'k') return y < 4 ? sk.hair : y >= 8 ? sk.legs : c;
      if (c === 'r') return y < 4 ? sk.band : sk.belt;
      if (c === 'w') return sk.gi;
      return sk.skin || c;
    }));
    bakeSprite(key);
  }
  return key;
}

const spriteOf = type => (ENEMY_TYPES[type] && ENEMY_TYPES[type].sprite) || type;
const HAZARD_COLORS = {
  sigil: ['#c23b22', '#e8c34a'], smite: ['#e8c34a', '#fff6c8'], roots: ['#4f9a3a', '#9fd36a'], spikes: ['#d8cfb8', '#ffffff'],
  lance: ['#e8c34a', '#fff6c8'], lightning: ['#7fb0ff', '#ffffff'], blood: ['#8a1020', '#ff5a5a'],
  sword: ['#9fd8ff', '#ffffff'], buddha: ['#ffd84a', '#fff3b0'],
  crosshair: ['#ff3030', '#ffffff'], dynamite: ['#ff8a3a', '#ffe14d'],
  orbital: ['#ff3030', '#ffd0d0'], emp: ['#6fc3ff', '#ffffff'], gravity: ['#7a3ad0', '#e0c8ff'],
  goldlightning: ['#ffd84a', '#ffffff'], soulspikes: ['#5dff9a', '#c9a0ff'], hellfire: ['#ff5a1a', '#ffe14d'], buddhaSmall: ['#ffd84a', '#fff3b0'],
  tentacle: ['#424964', '#e8d24a'], frost: ['#9fc8e8', '#ffffff'], sakura: ['#ff9ad8', '#e8f4ff'], swordrain: ['#9fd8ff', '#ffffff'], afterimage: ['#9fd8ff', '#ffffff'], formless: ['#e8f4ff', '#ffffff'], inkrain: ['#141414', '#5a5f66'], inkfist: ['#141414', '#ece4d2'], skystaff: ['#ffd84a', '#c23b22'], staffquake: ['#a8a294', '#ffd84a'], seal: ['#e8c34a', '#c23b22'], levitate: ['#7a4ad0', '#c9a0ff'], gravslam: ['#7a4ad0', '#e0c8ff'], foxfire: ['#3f8cff', '#bfe0ff'],
};

// Signature looks for each ability: colors plus what happens on wind-up, release and impact.
const ABILITY_FX = {
  // the worlds' own foes
  staffsweep:   { c: ['#a8a294', '#ffd84a'], charge: 'dust', release: 'spin', impact: 'stars', snd: ['charge', 'whoosh', 'hit'] },
  staffthrust:  { c: ['#e08a2a', '#ffd84a'], charge: 'glint', release: 'speed', impact: 'stars', snd: ['charge', 'whoosh', 'hit'] },
  belltoll:     { c: ['#b8913c', '#fff3b0'], charge: 'converge', release: null, impact: 'stars', snd: ['gong', 'gong', 'heavyhit'] },
  ironpalm:     { c: ['#b8913c', '#ffd84a'], charge: 'glint', release: null, impact: 'stars', snd: ['charge', 'whoosh', 'heavyhit'] },
  gdive:        { c: ['#a8a294', '#5a5f66'], charge: 'dust', release: 'speed', impact: 'stars', snd: ['rock', 'whoosh', 'heavyhit'] },
  rend:         { c: ['#7da36a', '#8a1020'], charge: 'drool', release: 'speed', impact: 'claw', snd: ['charge', 'whoosh', 'bite'] },
  dswords:      { c: ['#d8dde3', '#9fd8ff'], charge: 'glint', release: 'motes', impact: 'pierce', snd: ['magic', 'zap', 'hit'] },
  firedart:     { c: ['#ff5a1a', '#ffe14d'], charge: 'embers', release: null, impact: 'burn', snd: ['charge', 'fire', 'hit'] },
  burnbite:     { c: ['#ff5a1a', '#141414'], charge: 'embers', release: 'speed', impact: 'claw', snd: ['howl', 'whoosh', 'bite'] },
  frostbreath:  { c: ['#d8e8ff', '#9fc8e8'], charge: 'motes', release: null, impact: 'stars', snd: ['charge', 'wind', 'hit'] },
  icering:      { c: ['#d8e8ff', '#9fc8e8'], charge: 'glyph', release: null, impact: 'stars', snd: ['magic', 'zap', 'hit'] },
  icemirror:    { c: ['#d8e8ff', '#ffffff'], charge: 'glint', release: null, impact: null, snd: ['magic', 'poof', null] },
  fangust:      { c: ['#e8f0f8', '#b8c8d8'], charge: 'converge', release: null, impact: 'stars', snd: ['charge', 'wind', 'hit'] },
  featherdarts: { c: ['#141414', '#ece4d2'], charge: 'glint', release: null, impact: 'pierce', snd: ['charge', 'whoosh', 'hit'] },
  dronedive:    { c: ['#c8ccd2', '#ff2a3a'], charge: 'glint', release: 'speed', impact: 'stars', snd: ['zap', 'whoosh', 'hit'] },
  sentrylaser:  { c: ['#ff3030', '#ffe9a8'], charge: 'glint', release: null, impact: 'pierce', snd: ['charge', 'laser', 'heavyhit'] },
  sentryburst:  { c: ['#6fc3ff', '#ffffff'], charge: 'glint', release: null, impact: 'pierce', snd: ['zap', 'zap', 'hit'] },
  timemine:     { c: ['#5fe0e0', '#8a8f9c'], charge: null, release: null, impact: 'boom', snd: [null, 'zap', 'boom'] },
  slowfield:    { c: ['#7a4ad0', '#5fe0e0'], charge: 'spiral', release: null, impact: null, snd: ['warp', null, null] },
  haste:        { c: ['#5fe0e0', '#ffffff'], charge: 'spiral', release: 'motes', impact: null, snd: ['magic', 'zap', null] },
  glitchcopy:   { c: ['#c050ff', '#5fe8c8'], charge: 'glyph', release: 'motes', impact: 'stars', snd: ['warp', 'zap', 'hit'] },
  glitchcut:    { c: ['#c050ff', '#5fe8c8'], charge: 'glint', release: 'speed', impact: 'stars', snd: ['warp', 'slash', 'slash'] },
  mirrorcut:    { c: ['#ffffff', '#141414'], charge: 'glint', release: 'speed', impact: 'bigslash', snd: ['charge', 'slash', 'slash'] },
  flybite:      { c: ['#c8ccd2', '#8a1020'], charge: 'drool', release: 'speed', impact: 'splat', snd: ['charge', 'whoosh', 'bite'] },
  cslunge:      { c: ['#5a3a7a', '#ff2a3a'], charge: 'rage', release: 'speed', impact: 'claw', snd: ['howl', 'whoosh', 'bite'] },
  csspit:       { c: ['#5a3a7a', '#9ad04a'], charge: null, release: null, impact: 'pierce', snd: [null, 'whoosh', 'hit'] },
  corpseslam:   { c: ['#a8a294', '#5a5f66'], charge: 'dust', release: null, impact: 'stars', snd: ['rock', 'rock', 'heavyhit'] },
  nails:        { c: ['#c8ccd2', '#8a1020'], charge: 'glint', release: null, impact: 'pierce', snd: ['charge', 'whoosh', 'hit'] },
  resonance:    { c: ['#8a1020', '#d9b26a'], charge: 'glyph', release: null, impact: 'stars', snd: ['gong', 'heavyhit', 'hit'] },
  dontmove:     { c: ['#141414', '#c9a0ff'], charge: 'glyph', release: null, impact: 'stars', snd: ['magic', 'roar', 'hit'] },
  blastaway:    { c: ['#141414', '#c9a0ff'], charge: 'glyph', release: null, impact: 'stars', snd: ['magic', 'roar', 'heavyhit'] },
  shadowpounce: { c: ['#141414', '#5a5f66'], charge: 'spiral', release: 'speed', impact: 'claw', snd: ['warp', 'whoosh', 'bite'] },
  yellowsign:   { c: ['#fff23c', '#424964'], charge: 'glyph', release: null, impact: 'stars', snd: ['kingWhisper', null, 'kingDust'] },
  whisper:      { c: ['#fff23c', '#c9a0ff'], charge: 'glyph', release: null, impact: null, snd: ['kingWhisper', 'poof', null] },
  swoop:        { c: ['#424964', '#fff23c'], charge: 'converge', release: 'speed', impact: 'claw', snd: ['wind', 'whoosh', 'bite'] },
  palekiss:     { c: ['#ff9ad8', '#fffbd4'], charge: 'motes', release: null, impact: null, snd: ['foxfire', 'magic', null] },
  spinkick:     { c: ['#fffbd4', '#e8c34a'], charge: 'spiral', release: 'spin', impact: 'stars', snd: ['charge', 'whoosh', 'hit'] },
  tarnished:    { c: ['#c5a82b', '#74601c'], charge: 'glint', release: 'spin', impact: 'bigslash', snd: ['charge', 'slash', 'slash'] },
  edgetentacles:{ c: ['#424964', '#e8d24a'], charge: 'converge', release: null, impact: 'splat', snd: ['kingWhisper', 'vortex', 'hit'] },
  horrorslam:   { c: ['#424964', '#202943'], charge: 'dust', release: null, impact: 'stars', snd: ['rock', 'rock', 'heavyhit'] },
  silkflight: { c: ['#fff23c', '#eee0a0'], charge: 'spiral', release: 'motes', impact: 'stars', snd: ['kingWhisper', null, 'kingDust'] },
  yellowcourt: { c: ['#fff23c', '#424964'], charge: 'converge', release: 'motes', impact: 'stars', snd: ['kingStrings', null, 'hit'] },
  cosmiceye: { c: ['#eee0a0', '#fff23c'], charge: 'converge', release: 'motes', impact: 'stars', snd: ['kingWhisper', 'kingEye', 'kingDust'] },
  tackle:  { c: ['#c9a66b', '#7a5a3a'], charge: 'dust', release: 'speed', impact: 'stars', snd: ['charge', 'whoosh', 'heavyhit'] },
  whirl:   { c: ['#ff4d3c', '#ffd0c0'], charge: 'rage', release: 'spin', impact: 'claw', snd: ['roar', 'slash', 'slash'] },
  maul:    { c: ['#d04030', '#9a7a55'], charge: 'rage', release: 'speed', impact: 'claw', snd: ['howl', 'whoosh', 'bite'] },
  bite:    { c: ['#7da36a', '#8a1020'], charge: 'drool', release: null, impact: 'splat', snd: ['charge', 'bite', 'bite'] },
  iai:     { c: ['#ffffff', '#9fd8ff'], charge: 'glint', release: 'speed', impact: 'bigslash', snd: ['charge', 'slash', 'slash'] },
  fleche:  { c: ['#e8f4ff', '#c23b22'], charge: 'glint', release: 'speed', impact: 'pierce', snd: ['charge', 'whoosh', 'hit'] },
  sweep:   { c: ['#3f8a4a', '#d8f0c0'], charge: 'motes', release: 'spin', impact: 'stars', snd: ['charge', 'slash', 'hit'] },
  swords:  { c: ['#d8dde3', '#9fd8ff'], charge: 'glint', release: 'motes', impact: 'pierce', snd: ['magic', 'zap', 'hit'] },
  smite:   { c: ['#e8c34a', '#fff6c8'], charge: 'rise', release: null, impact: 'cross', snd: ['holy', 'ring', 'heavyhit'] },
  palm:    { c: ['#e8c34a', '#fff3b0'], charge: 'converge', release: 'palm', impact: 'stars', snd: ['gong', 'thud', 'heavyhit'] },
  push:    { c: ['#141414', '#ece4d2'], charge: 'spiral', release: null, impact: 'spiral', snd: ['charge', 'whoosh', 'heavyhit'] },
  rocket:  { c: ['#7fe0ff', '#ffb04a'], charge: 'sparks', release: null, impact: 'boom', snd: ['zap', 'gun', 'boom'] },
  vanish:  { c: ['#5a6278', '#141414'], charge: 'smokeIn', release: null, impact: 'stars', snd: ['smoke', 'smoke', 'hit'] },
  spray:   { c: ['#ff8a3a', '#ffe14d'], charge: 'embers', release: null, impact: 'burn', snd: ['charge', 'fire', 'hit'] },
  bats:    { c: ['#8a1020', '#141414'], charge: 'mist', release: null, impact: 'splat', snd: ['bats', 'bats', 'bite'] },
  vortex:  { c: ['#d9b26a', '#fff3c0'], charge: 'spiral', release: 'motes', impact: 'stars', snd: ['magic', 'vortex', 'hit'] },
  quick:   { c: ['#ffe9a8', '#ff8a3a'], charge: null, release: null, impact: 'stars', snd: [null, 'gun', 'hit'] },
  fan:     { c: ['#ffe9a8', '#ff8a3a'], charge: 'glint', release: null, impact: 'stars', snd: ['charge', 'gun', 'hit'] },
  shot:    { c: ['#ffe9a8', '#ff8a3a'], charge: null, release: null, impact: 'stars', snd: [null, 'gun', 'hit'] },
  aim:     { c: ['#ff3030', '#ffe9a8'], charge: 'glint', release: null, impact: 'pierce', snd: ['charge', 'laser', 'heavyhit'] },
  mine:    { c: ['#ff3030', '#8a8f9c'], charge: null, release: null, impact: 'boom', snd: [null, 'zap', 'boom'] },
  sigil:   { c: ['#e8c34a', '#c23b22'], charge: 'glyph', release: null, impact: 'stars', snd: ['magic', null, 'hit'] },
  orb:     { c: ['#e8c34a', '#c23b22'], charge: 'glyph', release: null, impact: 'stars', snd: ['magic', null, 'hit'] },
  light:   { c: ['#fff6c8', '#e8c34a'], charge: 'rise', release: null, impact: 'cross', snd: ['holy', null, 'hit'] },
  call:    { c: ['#4f9a3a', '#9fd36a'], charge: 'leaves', release: null, impact: 'claw', snd: ['kingStrings', null, 'hit'] },
  roots:   { c: ['#4f9a3a', '#9fd36a'], charge: 'leaves', release: null, impact: 'stars', snd: ['magic', null, 'thud'] },
  spikes:  { c: ['#d8cfb8', '#5a3a7a'], charge: 'mist', release: null, impact: 'stars', snd: ['magic', null, 'slash'] },
  raise:   { c: ['#5a3a7a', '#7da36a'], charge: 'mist', release: null, impact: null, snd: ['magic', 'summon', null] },
  lance:   { c: ['#fff6c8', '#e8c34a'], charge: 'rise', release: null, impact: 'cross', snd: ['holy', null, 'heavyhit'] },
  slam:    { c: ['#ff5a1a', '#ffd04a'], charge: 'embers', release: null, impact: 'burn', snd: ['roar', 'boom', 'heavyhit'] },
  breath:  { c: ['#ff5a1a', '#ffe14d'], charge: 'embers', release: null, impact: 'burn', snd: ['roar', 'fire', 'hit'] },
  gust:    { c: ['#e8f0f8', '#b8c8d8'], charge: 'converge', release: null, impact: 'stars', snd: ['charge', 'wind', 'hit'] },
  thunder: { c: ['#7fb0ff', '#ffffff'], charge: 'sparks', release: null, impact: 'stars', snd: ['charge', null, 'hit'] },
  blood:   { c: ['#8a1020', '#ff5a5a'], charge: 'mist', release: null, impact: 'splat', snd: ['magic', null, 'hit'] },
  gang:    { c: ['#c9a66b', '#c23b22'], charge: 'rage', release: null, impact: null, snd: ['roar', 'drum', null] },
  ricochet: { c: ['#ffe9a8', '#ff8a3a'], charge: 'glint', release: null, impact: 'stars', snd: ['charge', 'gun', 'hit'] },
  highnoon: { c: ['#ff3030', '#ffe9a8'], charge: 'glint', release: null, impact: 'pierce', snd: ['charge', 'laser', 'heavyhit'] },
  dynamite: { c: ['#ff8a3a', '#ffe14d'], charge: 'sparks', release: null, impact: 'boom', snd: ['charge', 'whoosh', 'boom'] },
  timestop: { c: ['#7fe0ff', '#ffffff'], charge: 'converge', release: null, impact: null, snd: ['charge', null, null] },
  rift:     { c: ['#c050ff', '#7fe0ff'], charge: 'spiral', release: null, impact: null, snd: ['magic', null, null] },
  rewind:   { c: ['#7fe0ff', '#ffffff'], charge: null, release: null, impact: null, snd: [null, null, null] },
  hands:    { c: ['#e8c34a', '#141414'], charge: 'glint', release: null, impact: 'stars', snd: ['charge', 'zap', 'hit'] },
  blue:   { c: ['#3f8cff', '#bfe0ff'], charge: 'converge', release: null, impact: null, snd: ['charge', 'vortex', null] },
  red:    { c: ['#ff3030', '#ffb0b0'], charge: 'converge', release: null, impact: null, snd: ['charge', 'zap', null] },
  purple: { c: ['#b040ff', '#ffffff'], charge: 'spiral', release: null, impact: null, snd: ['riser', 'ultboom', null] },
  rct:    { c: ['#bfffd8', '#ffffff'], charge: null, release: null, impact: null, snd: [null, null, null] },
  plasma:  { c: ['#7fe0ff', '#ffffff'], charge: 'sparks', release: null, impact: 'stars', snd: ['charge', 'zap', 'hit'] },
  railgun: { c: ['#ffffff', '#7fe0ff'], charge: 'sparks', release: null, impact: 'pierce', snd: ['charge', 'laser', 'heavyhit'] },
  orbital: { c: ['#ff3030', '#ffffff'], charge: null, release: null, impact: null, snd: [null, 'laser', null] },
  gravity: { c: ['#7a3ad0', '#e0c8ff'], charge: null, release: null, impact: null, snd: [null, 'vortex', null] },
  drones:  { c: ['#8a8f9c', '#ff3030'], charge: null, release: null, impact: 'stars', snd: [null, 'summon', 'hit'] },
  emp:     { c: ['#6fc3ff', '#ffffff'], charge: 'sparks', release: null, impact: null, snd: ['charge', null, null] },
  shield:  { c: ['#7fe0ff', '#ffffff'], charge: null, release: null, impact: null, snd: [null, null, null] },
  pounce:  { c: ['#e08a2a', '#141414'], charge: 'rage', release: 'speed', impact: 'claw', snd: ['roar', 'whoosh', 'bite'] },
};
// the newer foes' abilities
Object.assign(ABILITY_FX, {
  sword1:  { c: ['#ffffff', '#9fd8ff'], charge: 'glint', release: null, impact: 'bigslash', snd: ['charge', 'slash', 'slash'] },
  sword2:  { c: ['#e8f4ff', '#9fd8ff'], charge: 'glint', release: 'speed', impact: 'pierce', snd: ['charge', 'whoosh', 'hit'] },
  sword3:  { c: ['#d8dde3', '#9fd8ff'], charge: 'rise', release: null, impact: 'pierce', snd: ['magic', null, 'hit'] },
  sword4:  { c: ['#ffffff', '#9fd8ff'], charge: 'glint', release: null, impact: 'bigslash', snd: ['charge', 'slash', 'slash'] },
  sword5:  { c: ['#d8dde3', '#9fd8ff'], charge: 'glint', release: null, impact: 'pierce', snd: ['charge', 'whoosh', 'hit'] },
  sword6:  { c: ['#9fd8ff', '#ffffff'], charge: 'motes', release: null, impact: 'bigslash', snd: ['magic', null, 'slash'] },
  sword7:  { c: ['#9fd8ff', '#ffffff'], charge: 'converge', release: null, impact: 'bigslash', snd: ['riser', 'slash', 'heavyhit'] },
  sword8:  { c: ['#9fd8ff', '#ffffff'], charge: 'rise', release: null, impact: 'cross', snd: ['holy', null, 'ultboom'] },
  sword9:  { c: ['#9fd8ff', '#ffffff'], charge: 'converge', release: null, impact: 'pierce', snd: ['magic', null, 'hit'] },
  sword10: { c: ['#e8f4ff', '#ffffff'], charge: null, release: null, impact: 'bigslash', snd: [null, null, 'slash'] },
  sword11: { c: ['#ff5a7a', '#9fd8ff'], charge: 'glyph', release: null, impact: 'bigslash', snd: ['chime', 'slash', 'heavyhit'] },
  sword12: { c: ['#9fd8ff', '#ffffff'], charge: 'glint', release: null, impact: 'bigslash', snd: ['charge', 'laser', 'slash'] },
  umbrellashield: { c: ['#141414', '#c23b22'], charge: null, release: null, impact: null, snd: ['whoosh', null, null] },
  recitation:     { c: ['#141414', '#ece4d2'], charge: 'mist', release: null, impact: null, snd: ['chime', null, null] },
  scholarstep:    { c: ['#141414', '#ece4d2'], charge: null, release: null, impact: null, snd: [null, null, null] },
  umbrellasword:  { c: ['#ece4d2', '#141414'], charge: 'glint', release: null, impact: 'bigslash', snd: ['charge', 'slash', 'hit'] },
  umbrellaspear:  { c: ['#ece4d2', '#141414'], charge: 'glint', release: null, impact: 'pierce', snd: ['charge', 'whoosh', 'heavyhit'] },
  umbrellafan:    { c: ['#141414', '#5a5f66'], charge: 'converge', release: null, impact: 'splat', snd: ['charge', 'wind', 'hit'] },
  umbrellahook:   { c: ['#141414', '#c23b22'], charge: 'glint', release: null, impact: 'pierce', snd: ['charge', 'whoosh', 'hit'] },
  recite:         { c: ['#141414', '#ece4d2'], charge: 'mist', release: null, impact: 'splat', snd: ['hiss', null, 'hit'] },
  chesspieces:    { c: ['#141414', '#ece4d2'], charge: 'glint', release: null, impact: 'stars', snd: ['charge', 'whoosh', 'hit'] },
  lampfire:       { c: ['#7fd0ff', '#ffe14d'], charge: 'embers', release: null, impact: 'burn', snd: ['charge', 'fire', 'hit'] },
  cleave:         { c: ['#d8dde3', '#c23b22'], charge: 'rage', release: null, impact: 'bigslash', snd: ['charge', 'slash', 'heavyhit'] },
  coffinslam:     { c: ['#6b4a2f', '#141414'], charge: 'dust', release: null, impact: 'stars', snd: ['charge', 'thud', 'heavyhit'] },
  melody:         { c: ['#ece4d2', '#141414'], charge: 'motes', release: null, impact: 'stars', snd: ['chime', 'chime', 'hit'] },
  inkbreath:      { c: ['#141414', '#5a5f66'], charge: 'mist', release: null, impact: 'splat', snd: ['roar', 'wind', 'hit'] },
  iaidraw:     { c: ['#ffffff', '#ffb7d5'], charge: 'glint', release: null, impact: 'bigslash', snd: ['charge', null, 'heavyhit'] },
  sakurafall:  { c: ['#ff9ad8', '#e8f4ff'], charge: 'motes', release: null, impact: 'pierce', snd: ['chime', null, 'slash'] },
  ruyi:        { c: ['#ffd84a', '#c23b22'], charge: 'glint', release: null, impact: 'stars', snd: ['charge', 'whoosh', 'heavyhit'] },
  somersault:  { c: ['#ffd84a', '#ffffff'], charge: 'rise', release: null, impact: 'stars', snd: ['whoosh', 'whoosh', 'heavyhit'] },
  hairclones:  { c: ['#c9a65a', '#ffd84a'], charge: 'motes', release: null, impact: null, snd: ['wind', 'poof', null] },
  giantsweep:  { c: ['#ffd84a', '#c23b22'], charge: 'rage', release: 'spin', impact: 'stars', snd: ['roar', 'club', 'heavyhit'] },
  extermination: { c: ['#ffffff', '#ffd84a'], charge: 'glint', release: null, impact: 'bigslash', snd: ['charge', 'slash', 'heavyhit'] },
  exterminate: { c: ['#ffd84a', '#ffffff'], charge: null, release: null, impact: 'bigslash', snd: [null, 'slash', 'heavyhit'] },
  divinefist:  { c: ['#ece4d2', '#ffd84a'], charge: 'rage', release: 'speed', impact: 'stars', snd: ['roar', 'whoosh', 'heavyhit'] },
  mquake:      { c: ['#a8a294', '#ece4d2'], charge: 'rage', release: null, impact: 'stars', snd: ['roar', 'rock', 'heavyhit'] },
  transfuse:   { c: ['#9ad04a', '#b84aff'], charge: 'motes', release: null, impact: null, snd: ['squelch', null, null] },
  brood:       { c: ['#b84aff', '#9ad04a'], charge: 'drool', release: null, impact: null, snd: ['hiss', 'squelch', null] },
  creep:       { c: ['#5a2a7a', '#b84aff'], charge: 'drool', release: null, impact: null, snd: ['squelch', null, null] },
  acidspines:  { c: ['#ece4d2', '#9ad04a'], charge: 'drool', release: null, impact: 'pierce', snd: ['hiss', 'whoosh', 'hit'] },
  spinespit:   { c: ['#ece4d2', '#9ad04a'], charge: null, release: null, impact: 'pierce', snd: [null, 'whoosh', 'hit'] },
  larva:       { c: ['#b84aff', '#9ad04a'], charge: 'drool', release: null, impact: null, snd: ['squelch', 'squelch', null] },
  bilerain:    { c: ['#9ad04a', '#b84aff'], charge: 'drool', release: null, impact: null, snd: ['squelch', 'whoosh', null] },
  skyslam:     { c: ['#ffd84a', '#c23b22'], charge: 'rise', release: null, impact: 'stars', snd: ['whoosh', null, 'heavyhit'] },
  scythes:     { c: ['#ece4d2', '#b84aff'], charge: 'glint', release: null, impact: 'claw', snd: ['hiss', 'slash', 'hit'] },
  queenblades: { c: ['#ece4d2', '#c9a0ff'], charge: 'glint', release: null, impact: 'claw', snd: ['hiss', 'slash', 'heavyhit'] },
  gore:        { c: ['#5a2a40', '#ece4d2'], charge: 'rage', release: 'speed', impact: 'claw', snd: ['roar', 'whoosh', 'heavyhit'] },
  detonate:    { c: ['#9ad04a', '#ffe14d'], charge: 'drool', release: null, impact: null, snd: ['hiss', null, null] },
  onirage:     { c: ['#ff3a1a', '#5a1010'], charge: 'rage', release: null, impact: null, snd: ['roar', null, null] },
  clubcombo:   { c: ['#ff8a5a', '#3a3a40'], charge: 'rage', release: null, impact: 'stars', snd: ['charge', 'club', 'heavyhit'] },
  onismash:    { c: ['#a8a294', '#ff3a1a'], charge: 'rage', release: null, impact: 'stars', snd: ['roar', 'club', 'heavyhit'] },
  mlunge:      { c: ['#c86b8a', '#9ad04a'], charge: 'drool', release: 'speed', impact: 'splat', snd: ['squelch', 'whoosh', 'bite'] },
  lash:        { c: ['#c86b8a', '#ff9ad8'], charge: 'drool', release: null, impact: 'splat', snd: ['squelch', 'whoosh', 'hit'] },
  spew:        { c: ['#9ad04a', '#4b7a2a'], charge: 'drool', release: null, impact: 'splat', snd: ['squelch', null, 'hit'] },
  rush:        { c: ['#ff8a3a', '#ffffff'], charge: 'glint', release: 'speed', impact: 'stars', snd: ['charge', 'punch', 'punch'] },
  uppercut:    { c: ['#ffe14d', '#ff8a3a'], charge: null, release: null, impact: 'bigslash', snd: [null, 'punch', 'heavyhit'] },
  bodyblow:    { c: ['#ff8a3a', '#ece4d2'], charge: 'glint', release: null, impact: 'stars', snd: ['charge', 'punch', 'heavyhit'] },
  reaphook:    { c: ['#d8dde3', '#5dff9a'], charge: 'mist', release: null, impact: 'pierce', snd: ['charge', 'scythe', 'hit'] },
  reap:        { c: ['#5dff9a', '#d8dde3'], charge: 'mist', release: null, impact: 'bigslash', snd: ['charge', 'scythe', 'slash'] },
  deathspin:   { c: ['#5dff9a', '#ffffff'], charge: null, release: null, impact: 'bigslash', snd: [null, 'scythe', 'heavyhit'] },
  crescent:    { c: ['#5dff9a', '#c9ffd8'], charge: 'mist', release: null, impact: 'bigslash', snd: ['magic', 'scythe', 'slash'] },
  pincer:      { c: ['#d2502a', '#f2a07a'], charge: 'glint', release: null, impact: 'claw', snd: ['snap', 'snap', 'heavyhit'] },
  shellspin:   { c: ['#d2502a', '#6fc3ff'], charge: 'dust', release: 'spin', impact: 'stars', snd: ['charge', 'whoosh', 'hit'] },
  bubbles:     { c: ['#bfe8ff', '#ffffff'], charge: 'motes', release: null, impact: null, snd: ['pop', 'pop', null] },
  cocoon:      { c: ['#ece4d2', '#9ad04a'], charge: 'drool', release: null, impact: 'splat', snd: ['hiss', 'bite', 'web'] },
  ambush:      { c: ['#5a2a40', '#ff2a3a'], charge: 'dust', release: null, impact: 'claw', snd: ['hiss', null, 'bite'] },
  webtrap:     { c: ['#ece4d2', '#bfb6a2'], charge: 'mist', release: null, impact: null, snd: ['hiss', 'web', null] },
  webshot:     { c: ['#ece4d2', '#bfb6a2'], charge: null, release: null, impact: null, snd: [null, 'web', 'web'] },
  shift:       { c: ['#c9a66b', '#ece4d2'], charge: 'converge', release: null, impact: null, snd: ['riser', null, null] },
  feral:       { c: ['#c9a66b', '#141414'], charge: 'rage', release: 'speed', impact: 'claw', snd: ['howl', 'whoosh', 'bite'] },
  thunderpounce: { c: ['#6fc3ff', '#ffffff'], charge: 'sparks', release: 'speed', impact: 'claw', snd: ['zap', 'thunder', 'heavyhit'] },
  stormclaw:   { c: ['#6fc3ff', '#ffffff'], charge: 'sparks', release: null, impact: 'claw', snd: ['zap', 'slash', 'hit'] },
  tigerbolt:   { c: ['#6fc3ff', '#ffffff'], charge: 'sparks', release: null, impact: 'stars', snd: ['howl', null, 'hit'] },
  bearslam:    { c: ['#c8ccd2', '#867b69'], charge: 'rage', release: null, impact: 'stars', snd: ['roar', 'rock', 'heavyhit'] },
  ironmaul:    { c: ['#c8ccd2', '#ffffff'], charge: 'rage', release: null, impact: 'claw', snd: ['roar', 'club', 'heavyhit'] },
  venomspit:   { c: ['#9ad04a', '#4b7a2a'], charge: 'drool', release: null, impact: 'splat', snd: ['hiss', 'squelch', 'hit'] },
  fangstrike:  { c: ['#9ad04a', '#ece4d2'], charge: 'drool', release: 'speed', impact: 'splat', snd: ['hiss', 'whoosh', 'bite'] },
  toxiccloud:  { c: ['#9ad04a', '#4b7a2a'], charge: 'drool', release: null, impact: null, snd: ['hiss', 'squelch', null] },
  rocgust:     { c: ['#e8f0f8', '#b8c8d8'], charge: 'converge', release: null, impact: 'stars', snd: ['screech', 'wind', 'hit'] },
  rocdive:     { c: ['#e8f0f8', '#6fc3ff'], charge: 'rise', release: 'speed', impact: 'claw', snd: ['screech', 'whoosh', 'heavyhit'] },
  stormfeathers: { c: ['#e8f0f8', '#6fc3ff'], charge: 'glint', release: null, impact: 'pierce', snd: ['charge', 'whoosh', 'hit'] },
  drakebreath: { c: ['#ff5a1a', '#ffe14d'], charge: 'embers', release: null, impact: 'burn', snd: ['roar', 'fire', 'hit'] },
  tailswipe:   { c: ['#ff5a1a', '#c23b22'], charge: 'embers', release: 'spin', impact: 'stars', snd: ['charge', 'whoosh', 'heavyhit'] },
  magma:       { c: ['#ff3a1a', '#ffb04a'], charge: 'embers', release: null, impact: 'burn', snd: ['roar', 'fire', null] },
  mirage:      { c: ['#ff9ad8', '#ffffff'], charge: 'glint', release: null, impact: null, snd: ['magic', 'poof', null] },
  hex:         { c: ['#ff9ad8', '#c9a0ff'], charge: 'glyph', release: null, impact: null, snd: ['magic', 'poof', null] },
  cards:       { c: ['#ffffff', '#c23b22'], charge: 'glint', release: null, impact: 'pierce', snd: ['charge', 'whoosh', 'hit'] },
  foxfire:     { c: ['#7fd0ff', '#ffffff'], charge: 'spiral', release: null, impact: 'burn', snd: ['foxfire', 'foxfire', 'hit'] },
  charm:       { c: ['#ff9ad8', '#ffffff'], charge: 'motes', release: null, impact: null, snd: ['foxfire', 'magic', null] },
  tails:       { c: ['#ece4d2', '#7fd0ff'], charge: 'spiral', release: 'spin', impact: 'stars', snd: ['foxfire', 'whoosh', 'hit'] },
  backflip:    { c: ['#d8dde3', '#3f8a4a'], charge: null, release: null, impact: 'pierce', snd: [null, 'slash', 'hit'] },
  knife:       { c: ['#d8dde3', '#ffffff'], charge: null, release: null, impact: 'pierce', snd: [null, null, 'hit'] },
  powershot:   { c: ['#ffe14d', '#ffffff'], charge: 'glint', release: null, impact: 'pierce', snd: ['charge', 'laser', 'heavyhit'] },
  trick:       { c: ['#9a7a55', '#ffd84a'], charge: 'glint', release: null, impact: 'pierce', snd: ['charge', 'whoosh', 'hit'] },
  volley:      { c: ['#9a7a55', '#ece4d2'], charge: 'glint', release: null, impact: 'pierce', snd: ['charge', 'whoosh', 'hit'] },
  arrow:       { c: ['#9a7a55', '#ece4d2'], charge: null, release: null, impact: 'pierce', snd: [null, 'whoosh', 'hit'] },
  elixir:      { c: ['#5fe8c8', '#ffffff'], charge: 'rise', release: null, impact: null, snd: ['gulp', null, null] },
  barrage:     { c: ['#5fe8c8', '#c050ff'], charge: 'sparks', release: null, impact: null, snd: ['charge', 'whoosh', null] },
  flask:       { c: ['#5fe8c8', '#c050ff'], charge: null, release: null, impact: null, snd: [null, 'whoosh', null] },
  repulse:     { c: ['#7a4ad0', '#ffffff'], charge: 'converge', release: null, impact: 'stars', snd: ['warp', null, 'hit'] },
  levitate:    { c: ['#c9a0ff', '#7a4ad0'], charge: 'spiral', release: null, impact: null, snd: ['warp', null, null] },
  crush:       { c: ['#7a4ad0', '#2a1f48'], charge: 'spiral', release: null, impact: null, snd: ['warp', null, null] },
  gravwell:    { c: ['#7a4ad0', '#e0c8ff'], charge: 'spiral', release: 'motes', impact: 'stars', snd: ['warp', 'vortex', 'hit'] },
  wardarray:   { c: ['#e8c34a', '#fff3b0'], charge: 'glyph', release: null, impact: null, snd: ['chime', null, null] },
  bagua:       { c: ['#e8c34a', '#141414'], charge: 'glyph', release: null, impact: 'cross', snd: ['chime', null, 'heavyhit'] },
  seal:        { c: ['#e8c34a', '#c23b22'], charge: 'glyph', release: null, impact: 'cross', snd: ['chime', null, 'hit'] },
  swap:        { c: ['#c9a0ff', '#e8c34a'], charge: 'glyph', release: null, impact: null, snd: ['chime', null, null] },
  stomp:       { c: ['#a8a294', '#5a5f66'], charge: 'dust', release: null, impact: 'stars', snd: ['rock', 'rock', 'heavyhit'] },
  boulder:     { c: ['#a8a294', '#5a5f66'], charge: 'dust', release: null, impact: 'stars', snd: ['rock', 'whoosh', 'heavyhit'] },
  tailsweep:   { c: ['#2f7f6f', '#6fc3ff'], charge: 'dust', release: 'spin', impact: 'stars', snd: ['hiss', 'whoosh', 'heavyhit'] },
  headbite:    { c: ['#ece4d2', '#c23b22'], charge: null, release: null, impact: 'claw', snd: [null, null, 'bite'] },
  headflame:   { c: ['#ff5a1a', '#ffe14d'], charge: null, release: null, impact: 'burn', snd: [null, null, 'hit'] },
  acidspit:    { c: ['#9ad04a', '#4b7a2a'], charge: 'drool', release: null, impact: 'splat', snd: ['hiss', 'squelch', 'hit'] },
  sunburst:    { c: ['#ffd84a', '#ff7a1a'], charge: 'embers', release: null, impact: 'burn', snd: ['screech', 'ultboom', 'hit'] },
  phoenixdive: { c: ['#ff7a1a', '#ffd84a'], charge: 'embers', release: 'speed', impact: 'burn', snd: ['screech', 'fire', 'heavyhit'] },
  flare:       { c: ['#ff7a1a', '#ffe14d'], charge: 'embers', release: null, impact: 'burn', snd: ['charge', 'fire', 'hit'] },
  feathers:    { c: ['#ff7a1a', '#ffe14d'], charge: 'embers', release: null, impact: 'burn', snd: ['charge', 'whoosh', 'hit'] },
});
const SIGIL_SOUND = { lightning: 'thunder', lance: 'holy', spikes: 'slash', roots: 'thud', blood: 'bite', smite: 'ring', mine: 'boom', sand: 'wind', sword: 'ultboom', buddha: 'ultboom',
  crosshair: 'laser', dynamite: 'boom', orbital: 'ultboom', emp: 'zap', gravity: 'boom',
  goldlightning: 'thunder', soulspikes: 'slash', hellfire: 'fire', buddhaSmall: 'thud', sakura: 'slash', swordrain: 'hit', afterimage: 'slash', formless: 'slash', inkrain: 'hit', inkfist: 'heavyhit', skystaff: 'ultboom', staffquake: 'rock', seal: 'chime', levitate: 'warp', gravslam: 'thud', foxfire: 'foxfire' };

// Eastern dragons are drawn live: a horned, whiskered head, a scaled serpent body with a dorsal crest, and clawed legs.
const EASTERN_DRAGONS = {
  eastdragon: () => ({ body: '#3f8a4a', dark: '#2a5e33', belly: '#d9c27a', mane: '#e8c34a', horn: '#ece4d2', eye: '#ffe14d', len: 30, th: 4 }),
  emperor: e => e.phase === 2
    ? { body: '#fff3c8', dark: '#e8c34a', belly: '#ffffff', mane: '#7fd0ff', horn: '#ffffff', eye: '#7fd0ff', len: 44, th: 6 }
    : { body: '#e8c34a', dark: '#b8913c', belly: '#fff3b0', mane: '#c23b22', horn: '#ece4d2', eye: '#ff3030', len: 42, th: 6 },
  inkdragon: () => ({ body: '#1e1e24', dark: '#0a0a0e', belly: '#4a4a52', mane: '#5a5f66', horn: '#8a8f9c', eye: '#ff2a2a', len: 28, th: 4 }),
};
// a dragon's head, facing right: h horn, M mane, B head, D shade, e eye, n nostril, w teeth, j jaw
const DRAGON_HEAD = [
  '.h...h......',
  '.hh..hh.....',
  '..hMMMhh....',
  '.MMBBBBBBB..',
  'MMBBeDBBBBBw',
  'MMBBBBBBnBBB',
  '.MDBBjjjjjww',
  '..MDjj..w...',
];

// The Scholar's frontal head uses the SAME five ink/horn/mane colours and
// coarse pixel vocabulary as DRAGON_HEAD. No separately shaded monster face.
const SCHOLAR_DRAGON_FRONT_HALF = [
  '.h...........',
  '.hh..h.......',
  '..hh.hh......',
  '..hMhh....M..',
  '...hMM...MMM.',
  '..MMMBBBBBBMM',
  '.MMBBBBBBBBBB',
  'MMBBDeDDBBBBB',
  '.MMBBDDBBBBBB',
  '..MMBBBBBBBBB',
  '...MDBBBnBBBB',
  '....MDBBBBBBB',
  '.....MDDDDDDD',
];
const SCHOLAR_DRAGON_FRONT = SCHOLAR_DRAGON_FRONT_HALF.map(row=>row+row.slice(0,-1).split('').reverse().join(''));
const BITE_S = 18;

// which picture a foe uses right now (bosses change in their second form)
const spriteFor = e => e.spriteNow || (e.def.boss && e.phase === 2 && e.def.sprite2) || e.def.sprite || spriteOf(e.type);

// (each world's arena, its scene and its ambient life live in js/arenas.js)

class Renderer {
  constructor(canvas) {
    this.cv = canvas;
    this.g = canvas.getContext('2d');
    this.g.imageSmoothingEnabled = false;
    this.parts = [];
    this.falls = [];
    this.banner = null;
    this.combo = null;
    this.flashT = 0;
    this.shake = 0;
    this.bg = this.bakeBackground();
    this.worldBackgrounds = {};
  }

  bakeBackground() {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const rand = mulberry32(11);
    const px = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };

    // night sky with dithered bands
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const t = y / 70 + ((x + y) % 2 ? 0.04 : 0);
        px(x, y, t < 0.45 ? INK.night : t < 0.8 ? '#121a2e' : INK.night2);
      }
    }
    for (let i = 0; i < 40; i++) px(Math.floor(rand() * W), 13 + Math.floor(rand() * 30), rand() < 0.3 ? INK.rice : '#5a6278');

    // moon with dithered halo
    for (let y = -14; y <= 14; y++) for (let x = -14; x <= 14; x++) {
      const d = Math.hypot(x, y);
      if (d <= 8) px(210 + x, 30 + y, d > 6.5 ? '#d8cfb8' : INK.rice);
      else if (d <= 13 && (x + y) % 2 === 0 && rand() < 0.55) px(210 + x, 30 + y, '#2a3350');
    }

    // ink-wash mountain ridges
    const ridge = (base, amp, freq, col, seed) => {
      const r2 = mulberry32(seed);
      const ph = r2() * 10, ph2 = r2() * 10;
      for (let x = 0; x < W; x++) {
        const top = Math.round(base - amp * (0.6 * Math.sin(x * freq + ph) + 0.4 * Math.sin(x * freq * 2.7 + ph2)) - amp * 0.4 * Math.abs(Math.sin(x * freq * 0.5 + ph)));
        for (let y = top; y < H; y++) px(x, y, (y === top && r2() < 0.5) ? '#2e3a52' : col);
      }
    };
    ridge(46, 14, 0.035, '#1a2438', 3);
    ridge(56, 10, 0.05, '#152a2c', 5);
    ridge(64, 6, 0.08, '#10201f', 9);

    // cloud ribbons
    const cloud = (x0, y0, len) => {
      for (let i = 0; i < len; i++) {
        const x = x0 + i, y = y0 + Math.round(Math.sin(i * 0.25) * 1.5);
        px(x, y, '#3d4760');
        if (i % 9 < 4) px(x, y - 1, '#566078');
      }
      // curl at the end
      for (let a = 0; a < 6.2; a += 0.35) px(Math.round(x0 + len + 3 * Math.cos(a)), Math.round(y0 - 2 + 2 * Math.sin(a)), '#566078');
    };
    cloud(8, 24, 46); cloud(130, 40, 34); cloud(176, 18, 22);

    // temple roof silhouette (left) with upturned eaves
    const roof = (x0, y0, w) => {
      for (let i = 0; i < w; i++) {
        const edge = Math.min(i, w - 1 - i);
        const lift = edge < 4 ? 4 - edge : 0;
        for (let y = y0 - lift; y < y0 + 3; y++) px(x0 + i, y, INK.ink);
      }
      for (let y = y0 + 3; y < y0 + 10; y++) for (let x = x0 + 5; x < x0 + w - 5; x++) px(x, y, (x - x0) % 6 === 0 ? '#2a1a14' : INK.ink);
      px(x0 + 6, y0 + 6, INK.verm); px(x0 + w - 7, y0 + 6, INK.verm);
    };
    roof(6, 38, 34); roof(12, 30, 22);

    // twisted pine (right)
    for (let i = 0; i < 26; i++) px(Math.round(238 + Math.sin(i * 0.3) * 3), 64 - i, INK.ink);
    const needles = (x, y, w) => { for (let i = -w; i <= w; i++) { px(x + i, y, INK.ink); if (Math.abs(i) < w - 1) px(x + i, y - 1, '#1d2b22'); } };
    needles(232, 44, 8); needles(245, 50, 6); needles(236, 38, 5);

    // void below the stage with low mist
    for (let y = 90; y < H; y++) for (let x = 0; x < W; x++) if ((x * 7 + y * 13) % 11 === 0 && rand() < 0.5) px(x, y, '#1e2a40');

    // the stage: side wall then top
    const RX = R, RY = R * SQ;
    for (let y = -RY - 1; y <= RY + 8; y++) {
      for (let x = -RX - 1; x <= RX + 1; x++) {
        const top = (x / RX) ** 2 + (y / RY) ** 2;
        const side = (x / RX) ** 2 + ((y - 7) / RY) ** 2;
        const X = CX + x, Y = Math.round(CY + y);
        if (top <= 1) {
          const wx = x, wy = y / SQ, rr = Math.hypot(wx, wy);
          let col = INK.stone;
          if (rr > R - 3) col = INK.verm;
          else if (rr > R - 4) col = '#6e2a1c';
          else if (Math.abs(rr - 30) < 0.8 || Math.abs(rr - 62) < 0.8) col = INK.stone2;
          else if (rr > 30 && Math.abs(Math.sin(Math.atan2(wy, wx) * (rr > 62 ? 12 : 8))) < 0.06) col = INK.stone2;
          else if (((X * 3 + Y * 5) % 17 === 0)) col = '#a69b87';
          else if (((X * 5 + Y * 3) % 23 === 0)) col = '#8c826f';
          if (rr > R - 3 && Math.abs(Math.sin(Math.atan2(wy, wx) * 16)) < 0.12) col = INK.gold;
          px(X, Y, col);
        } else if (side <= 1 && y > 0) {
          px(X, Y, (Y + X) % 4 === 0 ? '#3c332c' : INK.stoneSide);
        }
      }
    }
    // centre emblem: a small ink ring with a jade dot
    for (let a = 0; a < 6.28; a += 0.12) px(Math.round(CX + Math.cos(a) * 12), Math.round(CY + Math.sin(a) * 12 * SQ), '#7a705f');
    px(CX, CY, INK.jade); px(CX + 1, CY, INK.jade);

    // HUD strip
    g.fillStyle = INK.ink; g.fillRect(0, 0, W, 12);
    g.fillStyle = INK.gold; g.fillRect(0, 12, W, 1);
    return c;
  }

  reset() { this.parts = []; this.falls = []; this.banner = null; this.combo = null; this.flashT = 0; this.shake = 0; this.ultFx = null; this.transform = null; this.cosmicImpactT=0; }

  snd(name) { if (this.soundOn && name) sfx.play(name); }

  flash(color, t = 0.08) { this.flashT = t; this.flashColor = color; }

  // Particle recipes shared by the ability effects.
  recipe(kind, ev, c, sx0, sy0) {
    const rand = Math.random, P2 = this.parts;
    const X = sx0 !== undefined ? sx0 : sx(ev.x), Y = sy0 !== undefined ? sy0 : sy(ev.y) - 5;
    const px = (n, sp, life, colors, g = 0, dy = 0) => {
      for (let i = 0; i < n; i++) P2.push({ kind: 'px', x: X, y: Y + dy, vx: (rand() - .5) * sp, vy: (rand() - .5) * sp, g, life, max: life, color: colors[i % colors.length] });
    };
    switch (kind) {
      case 'dust': for (let i = 0; i < 8; i++) P2.push({ kind: 'px', x: X + (rand() - .5) * 10, y: Y + 4, vx: (rand() - .5) * 30, vy: -rand() * 15, life: 0.5, max: 0.5, color: c[i % 2] }); break;
      case 'rage': P2.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 14, r1: 4, life: 0.3, max: 0.3, color: c[0] }); px(8, 60, 0.4, c, -80); break;
      case 'drool': px(5, 20, 0.5, c, 120); break;
      case 'glint': P2.push({ kind: 'star', x: X + (ev.fx || 0) * 6, y: Y - 2, life: 0.12, max: 0.12, color: c[0] }); P2.push({ kind: 'line', x0: X - 6, y0: Y - 3, x1: X + 6, y1: Y - 3, life: 0.15, max: 0.15, color: c[0] }); break;
      case 'motes': for (let i = 0; i < 10; i++) { const a = rand() * 6.28; P2.push({ kind: 'px', x: X + Math.cos(a) * 14, y: Y + Math.sin(a) * 8, vx: -Math.cos(a) * 40, vy: -Math.sin(a) * 24, life: 0.35, max: 0.35, color: c[i % 2] }); } break;
      case 'rise': for (let i = 0; i < 12; i++) P2.push({ kind: 'px', x: X + (rand() - .5) * 14, y: Y + 6, vx: 0, vy: -30 - rand() * 50, life: 0.6, max: 0.6, color: c[i % 2] }); P2.push({ kind: 'column', x: ev.x, y: ev.y, color: c[1], life: 0.18, max: 0.18, w: 1 }); break;
      case 'converge': for (let i = 0; i < 14; i++) { const a = rand() * 6.28, r = 22 + rand() * 8; P2.push({ kind: 'px', x: X + Math.cos(a) * r, y: Y + Math.sin(a) * r * 0.6, vx: -Math.cos(a) * r * 2.4, vy: -Math.sin(a) * r * 1.4, life: 0.4, max: 0.4, color: c[i % 2] }); } break;
      case 'spiral': P2.push({ kind: 'spiral', x: X, y: Y, c, life: 0.45, max: 0.45 }); break;
      case 'sparks': px(10, 120, 0.25, c); break;
      case 'smokeIn': px(12, 50, 0.5, ['#5a6278', '#8a8f9c', '#3d4760']); break;
      case 'embers': for (let i = 0; i < 10; i++) P2.push({ kind: 'px', x: X + (rand() - .5) * 8, y: Y, vx: (rand() - .5) * 30, vy: -20 - rand() * 40, life: 0.5, max: 0.5, color: c[i % 2] }); break;
      case 'mist': px(14, 40, 0.6, c, -30); break;
      case 'glyph': P2.push({ kind: 'glyph', x: X, y: Y - 8, c, life: 0.5, max: 0.5 }); break;
      case 'leaves': for (let i = 0; i < 12; i++) { const a = rand() * 6.28; P2.push({ kind: 'px', x: X, y: Y, vx: Math.cos(a) * 50, vy: Math.sin(a) * 30 - 20, g: 40, life: 0.7, max: 0.7, color: c[i % 2] }); } break;
      case 'speed': for (let i = 0; i < 6; i++) { const oy = (rand() - .5) * 8; P2.push({ kind: 'line', x0: X, y0: Y + oy, x1: X - (ev.fx || 0) * 16, y1: Y + oy - (ev.fy || 0) * 9, life: 0.2, max: 0.2, color: c[i % 2] }); } break;
      case 'spin': for (let k = 0; k < 2; k++) P2.push({ kind: 'arcring', x: ev.x, y: ev.y, r: (ev.range || 20) * (0.7 + k * 0.3), c: c[k], life: 0.25, max: 0.25, a0: rand() * 6.28 }); break;
      case 'palm': P2.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 4, r1: 36, life: 0.45, max: 0.45, color: c[0] }); P2.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 2, r1: 26, life: 0.35, max: 0.35, color: c[1] }); px(20, 160, 0.5, c); this.flash('rgba(255,236,160,0.25)', 0.12); break;
      case 'stars': P2.push({ kind: 'star', x: X, y: Y, life: 0.08, max: 0.08, color: '#ffffff' }); px(6, 90, 0.3, c); break;
      case 'claw': for (let i = -1; i <= 1; i++) P2.push({ kind: 'line', x0: X - 5 + i * 3, y0: Y - 6, x1: X + 3 + i * 3, y1: Y + 5, life: 0.25, max: 0.25, color: i ? c[0] : c[1] }); px(6, 80, 0.3, c); break;
      case 'splat': px(12, 100, 0.45, c, 200); break;
      case 'bigslash': P2.push({ kind: 'line', x0: X - 14, y0: Y + 6, x1: X + 14, y1: Y - 6, life: 0.3, max: 0.3, color: c[0], w: 2 }); P2.push({ kind: 'line', x0: X - 12, y0: Y + 7, x1: X + 12, y1: Y - 5, life: 0.45, max: 0.45, color: c[1] }); this.flash('rgba(255,255,255,0.22)', 0.06); break;
      case 'pierce': P2.push({ kind: 'line', x0: X - (ev.fx || 1) * 12, y0: Y, x1: X + (ev.fx || 1) * 6, y1: Y, life: 0.15, max: 0.15, color: c[0] }); P2.push({ kind: 'star', x: X, y: Y, life: 0.08, max: 0.08, color: c[0] }); break;
      case 'cross': P2.push({ kind: 'cross', x: X, y: Y, c, life: 0.4, max: 0.4 }); px(10, 100, 0.4, c, -60); break;
      case 'boom': P2.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 2, r1: 14, life: 0.3, max: 0.3, color: '#ffb04a' }); px(16, 150, 0.45, ['#ffb04a', '#ff5a1a', '#5a6278']); this.shake = Math.max(this.shake, 4); break;
      case 'burn': px(10, 50, 0.5, c, -90); break;
    }
  }

  abilityFx(phase, ev) {
    const fx = ABILITY_FX[ev.id];
    if (!fx) return;
    const idx = { charge: 0, release: 1, impact: 2 }[phase];
    const kind = fx[phase];
    if (kind) this.recipe(kind, ev, fx.c);
    this.snd(fx.snd[idx]);
  }

  text(str, x, y, color, align = 'left', size = 8) {
    const g = this.g;
    g.font = `${size}px "Press Start 2P", monospace`;
    g.textAlign = align; g.textBaseline = 'top';
    g.fillStyle = INK.ink;
    g.fillText(str, Math.round(x) + 1, Math.round(y) + 1);
    g.fillStyle = color;
    g.fillText(str, Math.round(x), Math.round(y));
  }

  // draw a sprite with its feet at world (x, y)
  sprite(name, x, y, flip, mode, lift = 0, scale = 1) {
    const s = SPRITE_CACHE[name];
    const img = mode === 'flash' ? (flip ? s.flashF : s.flash) : mode === 'ghost' ? (flip ? s.ghostF : s.ghost) : (flip ? s.f : s.n);
    const w = Math.round(s.w * scale), h = Math.round(s.h * scale);
    this.g.drawImage(img, Math.round(sx(x) - w / 2), Math.round(sy(y) - h + 1 - lift), w, h);
  }

  drawCone(x, y, fx, fy, range, angle, color, k) {
    const g = this.g, a0 = Math.atan2(fy, fx);
    g.fillStyle = color;
    for (let rr = 8; rr <= range; rr += 4) {
      const n = Math.max(3, Math.floor(rr * angle / 3));
      for (let i = -n; i <= n; i++) {
        if (rr > range * k + 8 && (i + rr) % 2) continue;
        const a = a0 + angle * i / n;
        g.fillRect(Math.round(sx(x + Math.cos(a) * rr)), Math.round(sy(y + Math.sin(a) * rr)), 1, 1);
      }
    }
  }

  drawHazard(h, t) {
    const g = this.g;
    if (SWORD_HAZARDS.has(h.variant) && this.swordHazard(h, t)) return; // the Thirteen Swords draw their own
    if (h.kind === 'zone') return this.drawZone(h, t);
    if (h.kind === 'formation') return this.drawBagua(h, t);
    if (h.kind === 'swap') return this.drawSwap(h, t);
    if (h.kind === 'beam') return this.drawBeam(h, t);
    if (h.kind === 'bite') { // the dragon's jaws close over all of it but one moving pool of light
      const k = 1 - h.t / h.delay;
      g.globalAlpha = 0.35 + k * 0.45; g.fillStyle = '#000000'; g.fillRect(0, 13, W, H - 13); g.globalAlpha = 1;
      return;
    }
    if (h.kind === 'mine') {
      const armed = h.arm <= 0;
      g.fillStyle = INK.ink; g.fillRect(Math.round(sx(h.x)) - 2, Math.round(sy(h.y)) - 1, 5, 3);
      g.fillStyle = armed ? (Math.floor(t * 4) % 2 ? '#ff3030' : '#7a1010') : '#8a8f9c';
      g.fillRect(Math.round(sx(h.x)), Math.round(sy(h.y)) - 1, 1, 1);
      if (armed) this.ellipse(h.x, h.y, h.r, 'rgba(255,48,48,0.35)', true);
      return;
    }
    if (h.kind === 'vortex' && h.variant === 'gravity') { // a gravity grenade: a dark well folding space inward
      const X = Math.round(sx(h.x)), Y = Math.round(sy(h.y)) - 4;
      for (let ring = 0; ring < 3; ring++) {
        const r = h.r * (1 - ((t * 1.3 + ring / 3) % 1));
        g.fillStyle = ring === 1 ? '#e0c8ff' : '#7a3ad0';
        for (let i = 0; i < 12; i++) { const a = t * 6 + i / 12 * Math.PI * 2; g.fillRect(Math.round(sx(h.x + Math.cos(a) * r)), Math.round(sy(h.y + Math.sin(a) * r)), 1, 1); }
      }
      g.fillStyle = '#141414'; g.fillRect(X - 2, Y - 2, 5, 5); g.fillStyle = '#7a3ad0'; g.fillRect(X - 1, Y - 1, 3, 3);
      return;
    }
    if (h.kind === 'vortex' && h.variant === 'blue') { // Blue: a point of attraction, light bending into it
      const k = 1 - h.t / h.delay, X = Math.round(sx(h.x)), Y = Math.round(sy(h.y)) - 6;
      for (let ring = 0; ring < 4; ring++) {
        const r = h.r * (1 - ((t * 1.6 + ring * 0.25) % 1));
        g.fillStyle = ring % 2 ? '#3f8cff' : '#bfe0ff';
        for (let i = 0; i < 14; i++) { const a = -t * 5 + i / 14 * Math.PI * 2 + ring; g.fillRect(Math.round(sx(h.x + Math.cos(a) * r)), Math.round(sy(h.y + Math.sin(a) * r)), 1, 1); }
      }
      g.fillStyle = '#3f8cff'; g.fillRect(X - 2, Y - 2, 5, 5);
      g.fillStyle = '#ffffff'; g.fillRect(X - 1, Y - 1, 3, 3);
      g.globalAlpha = 0.3 + k * 0.3; this.ellipse(h.x, h.y, h.r, '#3f8cff', true); g.globalAlpha = 1;
      return;
    }
    if (h.kind === 'vortex') {
      g.fillStyle = '#d9b26a';
      for (let ring = 0; ring < 3; ring++) {
        const r = h.r * (0.35 + ring * 0.3);
        for (let i = 0; i < 10; i++) {
          const a = t * (3 - ring) + i / 10 * Math.PI * 2;
          g.fillRect(Math.round(sx(h.x + Math.cos(a) * r)), Math.round(sy(h.y + Math.sin(a) * r)), 1, 1);
        }
      }
      return;
    }
    const k = 1 - h.t / h.delay;
    const [c1, c2] = HAZARD_COLORS[h.variant] || HAZARD_COLORS.sigil;
    if (h.variant === 'afterimage') { // an afterimage of him, holding its pose, then slashing
      if (h.src && SPRITE_CACHE[spriteFor(h.src)]) { g.globalAlpha = 0.25 + k * 0.35; this.sprite(spriteFor(h.src), h.x, h.y, (h.src.fx || 1) < 0, 'ghost', 4, (h.src.def && h.src.def.scale) || 1); g.globalAlpha = 1; }
      if (k > 0.75) this.pline(sx(h.x) - 6, sy(h.y) - 4, sx(h.x) + 6, sy(h.y) - 10, '#ffffff');
      return;
    }
    if (h.variant === 'sword' || h.variant === 'swordrain' || h.variant === 'buddha' || h.variant === 'buddhaSmall') {
      const prop = SPRITE_CACHE[h.variant === 'sword' || h.variant === 'swordrain' ? 'u_sword' : 'palm'], sc = h.variant === 'sword' ? 3 : h.variant === 'swordrain' ? 1 : h.variant === 'buddha' ? 5 : 2;
      const w = prop.w * sc, hh = prop.h * sc, ground = sy(h.y);
      this.ellipse(h.x, h.y, h.r * (0.4 + k * 0.6), c1, false, 0.2 + k * 0.4);
      this.ellipse(h.x, h.y, h.r, c2, true);
      const y = -hh + (ground - hh * (h.variant === 'sword' ? 0.85 : 0.6) + hh) * k * k;
      g.globalAlpha = 0.5 + k * 0.5;
      g.drawImage(prop.n, Math.round(sx(h.x) - w / 2), Math.round(y), w, hh);
      g.globalAlpha = 1;
      return;
    }
    if (h.variant === 'crosshair') { // a red reticle, spinning faster as it locks on
      const X = Math.round(sx(h.x)), Y = Math.round(sy(h.y)), a = t * (3 + k * 12), on = h.t <= 0.35;
      this.ellipse(h.x, h.y, h.r, on ? '#ffffff' : c1, !on);
      g.fillStyle = on && Math.floor(t * 20) % 2 ? '#ffffff' : c1;
      for (let i = 0; i < 4; i++) {
        const ca = a + i * Math.PI / 2;
        for (let r = 4; r <= h.r + 4; r++) if (r < 7 || r > h.r - 1) g.fillRect(Math.round(X + Math.cos(ca) * r), Math.round(Y + Math.sin(ca) * r * SQ), 1, 1);
      }
      g.fillRect(X, Y, 1, 1);
      return;
    }
    if (h.variant === 'orbital') { // a targeting laser painting the ground from orbit
      const X = Math.round(sx(h.x)), Y = Math.round(sy(h.y)), on = h.t < 0.4;
      g.fillStyle = '#c8ccd2'; g.fillRect(X - 3, 15, 7, 1); g.fillStyle = '#3f8cff'; g.fillRect(X - 5, 14, 2, 3); g.fillRect(X + 4, 14, 2, 3); // the satellite
      g.fillStyle = '#ff3030'; g.fillRect(X, 16, 1, 1);
      this.ellipse(h.x, h.y, h.r * (0.4 + 0.6 * (1 - k)), on ? '#ffffff' : '#ff3030', !on);
      g.globalAlpha = 0.25 + k * 0.5; g.fillStyle = '#ff3030'; g.fillRect(X, 14, 1, Y - 14); g.globalAlpha = 1;
      return;
    }
    if (h.variant === 'emp') { // an EMP charge, crackling
      this.ellipse(h.x, h.y, h.r * k, '#6fc3ff', true);
      g.fillStyle = Math.floor(t * 20) % 2 ? '#ffffff' : '#6fc3ff';
      for (let i = 0; i < 5; i++) { const a = Math.random() * 6.28; g.fillRect(Math.round(sx(h.x + Math.cos(a) * h.r * k)), Math.round(sy(h.y + Math.sin(a) * h.r * k)), 1, 1); }
      g.fillStyle = '#3d4760'; g.fillRect(Math.round(sx(h.x)) - 1, Math.round(sy(h.y)) - 2, 3, 2);
      return;
    }
    if (h.variant === 'dynamite') { // a lit stick, fuse fizzing
      const X = Math.round(sx(h.x)), Y = Math.round(sy(h.y));
      this.ellipse(h.x, h.y, h.r * k, 'rgba(255,90,40,0.6)', true);
      g.fillStyle = '#c23b22'; g.fillRect(X - 1, Y - 4, 3, 5);
      g.fillStyle = '#7a5a3a'; g.fillRect(X, Y - 6, 1, 2);
      g.fillStyle = Math.floor(t * 24) % 2 ? '#ffe14d' : '#ffffff'; g.fillRect(X + (Math.floor(t * 12) % 2), Y - 7, 1, 1);
      return;
    }
    this.ellipse(h.x, h.y, h.r, c1, false, 0.25 + k * 0.4);
    this.ellipse(h.x, h.y, h.r * k, c2, true);
    if (h.variant === 'lightning') { g.fillStyle = '#3d4760'; g.fillRect(Math.round(sx(h.x)) - 4, 14, 9, 2); }
    if (h.variant === 'goldlightning') { g.fillStyle = Math.floor(t * 10) % 2 ? '#ffd84a' : '#fff3b0'; g.fillRect(Math.round(sx(h.x)) - 5, 14, 11, 2); }
    if (h.variant === 'hellfire') { // flames licking up off the ground
      for (let i = 0; i < 4; i++) {
        const fx = Math.round(sx(h.x + Math.sin(t * 9 + i * 1.7) * h.r * 0.6)), fy = Math.round(sy(h.y));
        const fh = 2 + ((Math.floor(t * 14) + i) % 3);
        g.fillStyle = i % 2 ? '#ff5a1a' : '#ffb04a'; g.fillRect(fx, fy - fh, 1, fh);
        g.fillStyle = '#ffe14d'; g.fillRect(fx, fy - fh - 1, 1, 1);
      }
    }
    if (h.variant === 'seal') { // a square sealing array turning over the target
      const X = Math.round(sx(h.x)), Y = Math.round(sy(h.y)), a = t * 2, rr = h.r * (1.2 - k * 0.3);
      for (let i = 0; i < 4; i++) { const p0 = a + i * Math.PI / 2, p1 = p0 + Math.PI / 2; this.pline(X + Math.cos(p0) * rr, Y + Math.sin(p0) * rr * SQ, X + Math.cos(p1) * rr, Y + Math.sin(p1) * rr * SQ, '#e8c34a'); }
      for (let i = 0; i < 4; i++) { const p0 = -a + i * Math.PI / 2 + 0.785; this.pix(X + Math.cos(p0) * rr * 0.7, Y + Math.sin(p0) * rr * 0.7 * SQ, '#c23b22'); }
    }
    if (h.variant === 'skystaff') { // the Ruyi Jingu Bang, the size of a pillar, dropping onto its mark
      const X = Math.round(sx(h.x)), Y = Math.round(sy(h.y)), bottom = Math.round(14 + (Y - 14) * k * k), w = Math.max(4, Math.round(h.r / 4));
      g.fillStyle = '#ffd84a'; g.fillRect(X - (w >> 1), 14, w, bottom - 14);
      g.fillStyle = '#fff3b0'; g.fillRect(X - (w >> 1), 14, 1, bottom - 14);
      g.fillStyle = '#c23b22'; g.fillRect(X - (w >> 1) - 1, bottom - 4, w + 2, 4);
      if (Math.random() < 0.6) this.spark(X, bottom, ['#ffd84a', '#ffffff'], -10, 0.3, w * 2);
    }
    if (h.variant === 'sakura') { // petals spiralling down, then a cold glint
      const X = Math.round(sx(h.x)), Y = Math.round(sy(h.y));
      for (let i = 0; i < 5; i++) { const a = t * 3 + i * 1.26, rr = 2 + (1 - k) * 8; this.pix(X + Math.cos(a) * rr, Y - (1 - k) * 18 + Math.sin(a) * rr * 0.4 - 2, i % 2 ? '#ff9ad8' : '#ffd8ec'); }
      if (k > 0.7) this.pline(X - 3, Y - 1, X + 3, Y - 3, Math.floor(t * 30) % 2 ? '#ffffff' : '#bfe8ff');
    }
    if (h.variant === 'levitate') for (let i = 0; i < 3; i++) this.ellipse(h.x, h.y, h.r * (0.3 + ((t * 1.5 + i / 3) % 1) * 0.7), '#c9a0ff', true);
    if (h.variant === 'gravslam') { const X = Math.round(sx(h.x)), Y = Math.round(sy(h.y)); g.fillStyle = '#7a4ad0'; for (let i = 0; i < 3; i++) g.fillRect(X - 1 + i, Y - 22 + Math.round(k * 14) + i, 1, 4 - i); }
    if (h.variant === 'lance' && k > 0.6) {
      g.globalAlpha = (k - 0.6) * 2; g.fillStyle = '#fff6c8';
      g.fillRect(Math.round(sx(h.x)), 14, 1, Math.round(sy(h.y)) - 14);
      g.globalAlpha = 1;
    }
  }

  ellipse(x, y, r, color, dotted, fill) {
    const g = this.g;
    g.fillStyle = color;
    const n = Math.max(14, Math.floor(r * 2.4));
    for (let i = 0; i < n; i++) {
      if (dotted && i % 2) continue;
      const a = i / n * Math.PI * 2;
      g.fillRect(Math.round(sx(x + Math.cos(a) * r)), Math.round(sy(y + Math.sin(a) * r)), 1, 1);
    }
    if (fill) {
      g.globalAlpha *= fill;
      for (let yy = -r; yy <= r; yy += 1 / SQ) for (let xx = -r; xx <= r; xx++) {
        if (xx * xx + yy * yy > r * r) continue;
        const X = Math.round(sx(x + xx)), Y = Math.round(sy(y + yy));
        if ((X + Y) % 2 === 0) g.fillRect(X, Y, 1, 1);
      }
      g.globalAlpha /= fill;
    }
  }

  ingest(sim) {
    const rand = Math.random;
    const num = (ev, text, color, vy = -20, life = 0.6) => this.parts.push({ kind: 'num', x: sx(ev.x), y: sy(ev.y) - 16, vy, life, max: life, text, color });
    const burst = (ev, n, speed, colors, life = 0.35, grav = 0) => {
      const sc = ev.scale || 1; n = Math.round(n * sc); speed *= sc;
      for (let i = 0; i < n; i++) this.parts.push({ kind: 'px', x: sx(ev.x), y: sy(ev.y) - 4, vx: (rand() - .5) * speed, vy: (rand() - .5) * speed - grav * 0.3, g: grav, life, max: life, color: colors[i % colors.length] });
    };
    const tinted = [];
    for (const ev of sim.fx) {
      this.swordEvent(ev);
      if (ev.tint) tinted.push([ev.tint, this.parts.length]); else if (tinted.length) tinted.push([null, this.parts.length]);
      switch (ev.type) {
        case 'hit':
          num(ev, ev.crit ? ev.dmg + '!' : '' + ev.dmg, ev.crit ? INK.gold : INK.rice);
          burst(ev, 4, 70, [INK.rice]);
          this.snd(ev.crit || ev.dmg >= 18 ? 'heavyhit' : 'hit');
          if (ev.combo >= 2) this.combo = { n: ev.combo, life: 1.2 };
          break;
        case 'hurt': num(ev, '-' + ev.dmg, '#ff5a3c', -16, 0.7); this.shake = Math.max(this.shake, 3); this.snd('hurt'); this.flash('rgba(255,40,30,0.12)', 0.05); break;
        case 'parry':
          this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 3, r1: 13, life: 0.25, max: 0.25, color: INK.gold });
          num(ev, 'PARRY', INK.gold, -12, 0.8); burst(ev, 10, 140, [INK.rice, INK.gold], 0.3);
          this.shake = Math.max(this.shake, 2);
          if (ev.hero) this.flash('rgba(236,228,210,0.2)', 0.06);
          this.snd('parry');
          break;
        case 'block': num(ev, 'BLOCK', '#a8a196', -12, 0.5); burst(ev, 4, 70, ['#a8a196']); this.snd('block'); break;
        case 'guardbreak': num(ev, 'GUARD BREAK', '#ff5a3c', -12, 0.8); burst(ev, 8, 120, [INK.rice, INK.verm]); this.shake = Math.max(this.shake, 3); this.snd('heavyhit'); break;
        case 'postureBreak':
          num(ev, ev.hero ? 'STUNNED' : 'BROKEN', ev.hero ? '#ff5a3c' : INK.gold, -10, 1.1);
          this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 2, r1: 18, life: 0.35, max: 0.35, color: INK.gold });
          this.shake = Math.max(this.shake, 4);
          this.snd('stun');
          break;
        case 'interrupt': num(ev, 'FLINCH', '#9fd3a8', -10, 0.5); break;
        case 'whiff': num(ev, 'MISTIMED', '#8a6ab8', -10, 0.8); break;
        case 'strike': burst(ev, 3, 60, [INK.rice, '#fff']); this.parts.push({ kind: 'star', x: sx(ev.x), y: sy(ev.y) - 5, life: 0.07, max: 0.07, s: ev.scale }); if (ev.scale > 1) this.parts.push({ kind: 'arc', x: ev.x, y: ev.y, a: Math.atan2(ev.fy, ev.fx), life: 0.1, max: 0.1, color: '#ffffff', s: ev.scale * 0.8 }); this.snd('whoosh'); break;
        case 'heavy':
          this.parts.push({ kind: 'arc', x: ev.x, y: ev.y, a: Math.atan2(ev.fy, ev.fx), life: 0.16, max: 0.16, color: '#f0a050', s: ev.scale });
          this.parts.push({ kind: 'star', x: sx(ev.x), y: sy(ev.y) - 5, life: 0.1, max: 0.1, s: ev.scale });
          this.snd('slash');
          break;
        case 'kick': this.parts.push({ kind: 'arc', x: ev.x, y: ev.y, a: Math.atan2(ev.fy, ev.fx), life: 0.14, max: 0.14, color: INK.rice, s: ev.scale }); this.snd('whoosh'); break;
        case 'grab': num(ev, 'THROW', '#ff5a3c', -10, 0.7); break;
        case 'slam': {
          const look = ABILITY_FX[ev.id];
          if (ev.id === 'skyslam') { this.parts.push({ kind: 'column', x: ev.x, y: ev.y, color: '#ffd84a', life: 0.3, max: 0.3, w: 4 }); this.flash('rgba(255,220,120,0.25)', 0.06); }
          if (look && look.release === 'spin') this.recipe('spin', { ...ev, range: ev.radius }, look.c);
          else if (ev.id === 'palm') this.recipe('palm', ev, look.c);
          else if (ev.id === 'slam') { for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28 + Math.random() * 0.4; this.parts.push({ kind: 'line', x0: sx(ev.x), y0: sy(ev.y), x1: sx(ev.x + Math.cos(a) * ev.radius), y1: sy(ev.y + Math.sin(a) * ev.radius), life: 0.5, max: 0.5, color: i % 2 ? '#ff5a1a' : '#ffd04a' }); } this.recipe('embers', ev, ['#ff5a1a', '#ffd04a']); }
          this.snd(ev.id === 'slam' ? 'boom' : ev.id === 'palm' ? 'thud' : ev.small ? 'thud' : 'slash');
          const c = ev.small ? '#7a705f' : { quake: '#a8a294', water: '#6fc3ff', repulse: '#c9a0ff', sun: '#ffd84a', foxfire: '#7fd0ff' }[ev.variant] || INK.verm;
          if (ev.variant === 'quake') { burst(ev, 14, 120, ['#867b69', '#5a5f66', '#a8a294'], 0.5, 200); this.snd('rock'); }
          if (ev.variant === 'water') burst(ev, 14, 110, ['#6fc3ff', '#bfe8ff', '#ffffff'], 0.4, 160);
          if (ev.variant === 'repulse') { for (let i = 0; i < 3; i++) this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 3 + i * 3, r1: ev.radius * (1 + i * 0.3), life: 0.35, max: 0.35, color: i % 2 ? '#ffffff' : '#7a4ad0' }); this.snd('warp'); }
          if (ev.variant === 'sun') { burst(ev, 30, 200, ['#ffd84a', '#ff7a1a', '#ffffff'], 0.6, -40); this.flash('rgba(255,210,120,0.25)', 0.08); this.snd('fire'); }
          if (ev.variant === 'foxfire') burst(ev, 16, 110, ['#7fd0ff', '#ffffff', '#ff9ad8'], 0.4);
          this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 4, r1: ev.radius, life: 0.3, max: 0.3, color: c });
          this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 2, r1: ev.radius * 0.7, life: 0.25, max: 0.25, color: '#d8cfb8' });
          this.shake = Math.max(this.shake, ev.small ? 2 : 4);
          break;
        }
        case 'beam': this.parts.push({ kind: 'beam', x: ev.x, y: ev.y, fx: ev.fx, fy: ev.fy, len: ev.len, life: 0.25, max: 0.25 }); this.shake = Math.max(this.shake, 3); break;
        case 'dashcut': burst(ev, 6, 60, ['#d8cfb8']); this.snd('whoosh'); break;
        case 'smoke': burst(ev, 16, 70, ['#5a6278', '#8a8f9c', '#3d4760'], 0.5); this.snd('smoke'); break;
        case 'sigilburst': {
          const [c1, c2] = HAZARD_COLORS[ev.variant] || (ev.variant === 'sand' ? ['#d9b26a', '#fff3c0'] : ev.variant === 'mine' ? ['#ff8a3a', '#ffe14d'] : HAZARD_COLORS.sigil);
          this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: ev.r * 0.3, r1: ev.r * 1.2, life: 0.3, max: 0.3, color: c2 });
          burst(ev, 12, 120, [c1, c2], 0.4);
          if (ev.variant === 'lance') { this.parts.push({ kind: 'column', x: ev.x, y: ev.y, color: c2, life: 0.3, max: 0.3, w: 4 }); this.flash('rgba(255,246,200,0.25)', 0.08); }
          if (ev.variant === 'lightning') { this.parts.push({ kind: 'bolt', x: sx(ev.x), y: sy(ev.y), life: 0.25, max: 0.25, seed: Math.random() * 1000 }); this.flash('rgba(160,200,255,0.3)', 0.06); this.shake = Math.max(this.shake, 3); }
          if (ev.variant === 'goldlightning') {
            for (let i = 0; i < 2; i++) this.parts.push({ kind: 'bolt', gold: true, x: sx(ev.x) + (i ? 2 : -1), y: sy(ev.y), life: 0.3, max: 0.3, seed: Math.random() * 1000 });
            this.parts.push({ kind: 'column', x: ev.x, y: ev.y, color: '#fff3b0', life: 0.2, max: 0.2, w: 3 });
            this.flash('rgba(255,220,120,0.35)', 0.07); this.shake = Math.max(this.shake, 4);
          }
          if (ev.variant === 'soulspikes') for (let i = 0; i < 8; i++) this.parts.push({ kind: 'px', x: sx(ev.x) + (Math.random() - .5) * 6, y: sy(ev.y), vx: (Math.random() - .5) * 40, vy: -70 - Math.random() * 60, g: 220, life: 0.6, max: 0.6, color: i % 2 ? '#5dff9a' : '#c9a0ff' });
          if (ev.variant === 'crosshair') { this.parts.push({ kind: 'column', x: ev.x, y: ev.y, color: '#ffffff', life: 0.12, max: 0.12, w: 2 }); this.flash('rgba(255,60,60,0.25)', 0.06); this.shake = Math.max(this.shake, 4); }
          if (ev.variant === 'orbital') { this.parts.push({ kind: 'column', x: ev.x, y: ev.y, color: '#ffffff', life: 0.35, max: 0.35, w: 7 }); this.parts.push({ kind: 'column', x: ev.x, y: ev.y, color: '#ff3030', life: 0.45, max: 0.45, w: 11 }); this.flash('rgba(255,80,80,0.35)', 0.1); this.shake = Math.max(this.shake, 9); }
          if (ev.variant === 'emp') { for (let i = 0; i < 3; i++) this.parts.push({ kind: 'bolt', x: sx(ev.x) + (Math.random() - .5) * 20, y: sy(ev.y), life: 0.2, max: 0.2, seed: Math.random() * 1000 }); this.flash('rgba(120,200,255,0.3)', 0.06); }
          if (ev.variant === 'gravity') { burst(ev, 24, 160, ['#7a3ad0', '#e0c8ff', '#141414'], 0.4); this.shake = Math.max(this.shake, 6); }
          if (ev.variant === 'dynamite') { this.recipe('boom', ev, ['#ffb04a', '#ff5a1a']); this.shake = Math.max(this.shake, 5); }
          if (ev.variant === 'skystaff') {
            for (let i = 0; i < 4; i++) this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 3, r1: ev.r * (1 + i * 0.45), life: 0.45 + i * 0.12, max: 0.6, color: i % 2 ? '#ffffff' : '#ffd84a' });
            this.parts.push({ kind: 'column', x: ev.x, y: ev.y, color: '#fff3b0', life: 0.35, max: 0.35, w: Math.max(6, Math.round(ev.r / 3)) });
            burst(ev, 46, 280, ['#ffd84a', '#867b69', '#a8a294', '#ffffff'], 0.8, 240);
            this.flash('rgba(255,230,150,0.5)', 0.14); this.shake = Math.max(this.shake, 14);
          }
          if (ev.variant === 'staffquake') { burst(ev, 30, 220, ['#867b69', '#a8a294', '#5a5f66'], 0.6, 260); this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: ev.r * 0.3, r1: ev.r, life: 0.4, max: 0.4, color: '#c8c0ae' }); this.shake = Math.max(this.shake, 8); }
          if (ev.variant === 'buddhaSmall') { this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 3, r1: ev.r * 1.4, life: 0.3, max: 0.3, color: '#ffffff' }); this.shake = Math.max(this.shake, 3); }
          if (ev.variant === 'spikes') for (let i = 0; i < 6; i++) this.parts.push({ kind: 'px', x: sx(ev.x) + (Math.random() - .5) * 6, y: sy(ev.y), vx: (Math.random() - .5) * 40, vy: -60 - Math.random() * 60, g: 260, life: 0.5, max: 0.5, color: '#ece4d2' });
          if (ev.variant === 'roots') for (let i = -2; i <= 2; i++) this.parts.push({ kind: 'line', x0: sx(ev.x) + i * 3, y0: sy(ev.y), x1: sx(ev.x) + i * 4, y1: sy(ev.y) - 7 - (i & 1) * 3, life: 0.6, max: 0.6, color: '#4f9a3a' });
          if (ev.variant === 'smite') this.parts.push({ kind: 'cross', x: sx(ev.x), y: sy(ev.y) - 5, c: ['#e8c34a', '#fff6c8'], life: 0.4, max: 0.4 });
          if (ev.variant === 'mine') this.recipe('boom', ev, ['#ffb04a', '#ff5a1a']);
          if (ev.variant === 'sword' || ev.variant === 'buddha') {
            for (let i = 0; i < 3; i++) this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 4, r1: ev.r * (1.2 + i * 0.5), life: 0.5 + i * 0.1, max: 0.6, color: i === 1 ? '#ffffff' : c1 });
            burst(ev, 40, 260, [c1, c2, '#ffffff'], 0.7);
            this.flash(ev.variant === 'buddha' ? 'rgba(255,220,120,0.5)' : 'rgba(180,220,255,0.5)', 0.14); this.shake = Math.max(this.shake, 9);
          }
          this.snd(SIGIL_SOUND[ev.variant] || 'magic');
          break;
        }
        case 'blink': burst(ev, 12, 90, ['#8a6ab8', '#e8c34a'], 0.4); this.snd('magic'); break;
        case 'death': burst(ev, 18, 130, [INK.ink, INK.ink, INK.verm, ...SPRITE_CACHE[spriteOf(ev.etype)].colors], 0.7, 220); this.snd('death'); break;
        case 'fall':
          this.falls.push({ name: ev.hero ? (sim.battle ? teamSprite('hero', ev.team) : 'hero') : spriteOf(ev.etype), scale: ev.hero ? 1 : (ENEMY_TYPES[ev.etype].scale || 1), x: sx(ev.x), y: sy(ev.y), vy: -40, life: 1.0, flip: ev.x < 0 });
          if (!ev.hero) num(ev, 'RING OUT', INK.verm, -14, 1.0);
          break;
        case 'spawn': burst(ev, 8, 60, ['#5a6278', '#8a8f9c'], 0.5); break;
        case 'roll': burst(ev, 4, 40, ['#7a705f']); break;
        case 'wave': this.banner = { text: ev.boss ? ev.boss.toUpperCase() : 'ROUND ' + ev.n, life: ev.boss ? 1.8 : 1.2 }; this.snd(ev.boss ? 'gong' : 'drum'); break;
        case 'charge':
          this.abilityFx('charge', ev);
          if (ev.hero && ev.ab && HERO_ABILITIES[ev.ab]) num(ev, HERO_ABILITIES[ev.ab].name.toUpperCase(), '#9fe8ff', -10, 0.9);
          break;
        case 'release': this.abilityFx('release', ev); this.weaponFire(ev, num, burst); break;
        case 'projhit':
          if (['bubble', 'web', 'acid', 'venom', 'hex', 'heart', 'foxfire', 'card', 'feather', 'arrow', 'arrow_net', 'bigarrow', 'crescent'].includes(ev.kind)) {
            const c = { bubble: ['#bfe8ff', '#ffffff'], web: ['#ece4d2', '#bfb6a2'], acid: ['#9ad04a', '#4b7a2a'], venom: ['#9ad04a', '#4b7a2a'], hex: ['#ff9ad8', '#c9a0ff'], heart: ['#ff9ad8', '#ffffff'],
              foxfire: ['#7fd0ff', '#ffffff'], card: ['#ffffff', '#c23b22'], feather: ['#ff7a1a', '#ffe14d'], crescent: ['#5dff9a', '#ffffff'], arrow_net: ['#ece4d2', '#9a7a55'] }[ev.kind] || ['#d8dde3', '#9a7a55'];
            burst(ev, 6, 70, c, 0.3);
            this.snd({ bubble: 'pop', web: 'web', acid: 'squelch', venom: 'squelch', hex: 'poof', heart: 'foxfire', foxfire: 'foxfire', arrow_net: 'web' }[ev.kind] || null);
          }
          if (ev.kind === 'plasma') { this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 1, r1: 5, life: 0.15, max: 0.15, color: '#7fe0ff' }); burst(ev, 5, 70, ['#7fe0ff', '#ffffff'], 0.2); }
          if (ev.kind === 'rail') { const a = Math.atan2(ev.fy, ev.fx); for (let i = 0; i < 10; i++) { const b = a + (Math.random() - .5) * 0.9, sp = 80 + Math.random() * 120; this.parts.push({ kind: 'px', x: sx(ev.x), y: sy(ev.y) - 5, vx: Math.cos(b) * sp, vy: Math.sin(b) * sp * SQ, life: 0.25, max: 0.25, color: i % 2 ? '#ffffff' : '#7fe0ff' }); } this.shake = Math.max(this.shake, 4); }
          if (ev.kind === 'drone') { this.recipe('boom', ev, ['#ffb04a', '#ff3030']); this.snd('boom'); }
          break;
        case 'impact': this.abilityFx('impact', ev); break;
        case 'muzzle':
          this.parts.push({ kind: 'star', x: sx(ev.x), y: sy(ev.y) - 5, life: 0.06, max: 0.06, color: '#ffe9a8' });
          this.parts.push({ kind: 'line', x0: sx(ev.x), y0: sy(ev.y) - 5, x1: sx(ev.x + ev.fx * 9), y1: sy(ev.y + ev.fy * 9) - 5, life: 0.07, max: 0.07, color: ev.big ? '#ff3030' : '#ffd04a', w: ev.big ? 2 : 1 });
          this.parts.push({ kind: 'px', x: sx(ev.x), y: sy(ev.y) - 5, vx: -ev.fy * 40 + (Math.random() - .5) * 20, vy: -40, g: 300, life: 0.4, max: 0.4, color: '#c9a65a' });
          if (ev.big) this.flash('rgba(255,80,60,0.15)', 0.05);
          break;
        case 'launch': this.parts.push({ kind: 'star', x: sx(ev.x), y: sy(ev.y) - 5, life: 0.06, max: 0.06, color: '#d8dde3' }); this.snd('zap'); break;
        case 'explode': this.recipe('boom', ev, ['#ffb04a', '#ff5a1a']); this.snd('boom'); break;
        case 'eliminated': num(ev, (ev.label || '').toUpperCase() + ' OUT', TEAM_COLORS[ev.team] || INK.rice, -10, 1.4); break;
        case 'transformStart':
          this.transform = { x: ev.x, y: ev.y, color: ev.color, t: 1.6 };
          num(ev, 'TRANSFORMING', ev.color, -6, 1.5);
          this.snd(ev.yellowKing ? 'kingUnmask' : 'riser');
          break;
        case 'ultCharge':
          if (ev.clone) { this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 18, r1: 4, life: 0.4, max: 0.4, color: ev.color }); break; } // a clone's: no banner, no darkness, or they'd never stop
          this.ultFx = { name: ev.name.toUpperCase(), boss: (ev.boss || '').toUpperCase(), color: ev.color, dark: ev.dark, cosmic: ev.cosmic, charge: ev.charge, t: ev.charge + ev.dur, max: ev.charge + ev.dur };
          this.snd(ev.cosmic ? 'kingCharge' : 'riser');
          break;
        case 'ultStart':
          this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 6, r1: 70, life: 0.6, max: 0.6, color: ev.color });
          this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 4, r1: 45, life: 0.45, max: 0.45, color: '#ffffff' });
          burst(ev, 40, 260, [ev.color, '#ffffff'], 0.7);
          this.flash('rgba(255,255,255,0.45)', 0.12); this.shake = Math.max(this.shake, 8);
          if (!ev.cosmic) this.snd('ultboom');
          break;
        case 'ultdash':
          for (let i = 0; i < 8; i++) { const oy = (Math.random() - .5) * 12; this.parts.push({ kind: 'line', x0: sx(ev.x), y0: sy(ev.y) - 6 + oy, x1: sx(ev.x - ev.fx * 30), y1: sy(ev.y - ev.fy * 30) - 6 + oy, life: 0.3, max: 0.3, color: i % 2 ? ev.color : '#ffffff', w: 2 }); }
          this.shake = Math.max(this.shake, 4); this.snd('roar');
          break;
        case 'ultburst':
          this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 4, r1: 40, life: 0.4, max: 0.4, color: ev.color });
          burst(ev, 24, 200, [ev.color, '#ffffff'], 0.5);
          if(ev.cosmic) { this.cosmicImpactT=.18; this.shake=Math.max(this.shake,16); }
          else { this.flash('rgba(255,255,255,0.2)', 0.06); this.shake = Math.max(this.shake, 5); }
          this.snd(ev.cosmic ? 'kingImpact' : 'boom');
          break;
        case 'ultslash':
          this.parts.push({ kind: 'line', x0: sx(ev.x) - 22, y0: sy(ev.y) + 8, x1: sx(ev.x) + 22, y1: sy(ev.y) - 18, life: 0.4, max: 0.4, color: ev.color, w: 3 });
          this.parts.push({ kind: 'line', x0: sx(ev.x) - 20, y0: sy(ev.y) - 16, x1: sx(ev.x) + 20, y1: sy(ev.y) + 6, life: 0.5, max: 0.5, color: '#ffffff', w: 2 });
          burst(ev, 26, 220, [ev.color, '#ffffff', INK.ink], 0.6, 120);
          this.flash('rgba(255,40,60,0.35)', 0.1); this.shake = Math.max(this.shake, 7);
          this.snd('ultboom');
          break;
        case 'palmhit':
          this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 4, r1: 26, life: 0.4, max: 0.4, color: '#ffe14d' });
          this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 2, r1: 16, life: 0.3, max: 0.3, color: '#fff3b0' });
          burst(ev, 20, 170, ['#ffe14d', '#fff3b0', '#b8913c'], 0.5);
          this.flash('rgba(255,236,160,0.25)', 0.1); this.shake = Math.max(this.shake, 5); this.snd('gong');
          break;
        case 'reviveStart': {
          // a stream of spirit motes from the summoner to the fallen minion
          const x0 = sx(ev.from), y0 = sy(ev.fromY) - 6, x1 = sx(ev.x), y1 = sy(ev.y) - 4;
          for (let i = 0; i < 14; i++) {
            const k = i / 14;
            this.parts.push({ kind: 'px', x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k - Math.sin(k * Math.PI) * 8, vx: (Math.random() - .5) * 10, vy: -10, life: 0.5 + k * 0.6, max: 1.1, color: i % 2 ? '#9fd36a' : '#c9a0ff' });
          }
          this.parts.push({ kind: 'spiral', x: x1, y: y1, c: ['#9fd36a', '#c9a0ff'], life: 1.2, max: 1.2 });
          num(ev, 'REVIVING', '#c9a0ff', -8, 1.0);
          this.snd('summon');
          break;
        }
        case 'phase':
          this.transform = null;
          this.banner = { text: (ev.name || 'PHASE 2').toUpperCase(), life: ev.lore ? 3.4 : 2.0, small: true, color: ev.color, kicker: 'SECOND FORM', lore: ev.lore };
          for (let i = 0; i < 3; i++) this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 4 + i * 6, r1: 60 + i * 25, life: 0.5 + i * 0.15, max: 0.5 + i * 0.15, color: i === 1 ? '#ffffff' : ev.color || INK.gold });
          burst(ev, 60, 300, [ev.color || INK.gold, '#ffffff', INK.verm], 0.9);
          this.flash('rgba(255,255,255,0.7)', 0.18); this.shake = Math.max(this.shake, 10);
          if (ev.yellowKing) this.snd('kingUnveiled'); else { this.snd('ultboom'); this.snd('roar'); }
          if (ev.scholar) { // his head comes off and rolls away; there is only the void now
            const X = Math.round(sx(ev.x)), Y = Math.round(sy(ev.y));
            this.parts.push({ kind: 'scholarhead', x: X, y: Y - 15, vx: 26 * (Math.random() < 0.5 ? -1 : 1), vy: -55, floor: Y, life: 3, max: 3 });
            burst({ x: ev.x, y: ev.y - 10 }, 30, 70, ['#141414', '#3a3a40'], 0.8);
          }
          break;
        case 'sway': num(ev, 'SWAY', '#c9a0ff', -12, 0.6); break;
        case 'ward': this.snd('parry'); num(ev, 'WARD', '#e8c34a', -12, 0.7); this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 4, r1: 11, life: 0.25, max: 0.25, color: '#e8c34a' }); break;
        case 'revive': num(ev, 'RISES', '#9fd36a', -10, 1.0); burst(ev, 14, 60, ['#7da36a', '#4b6b3e'], 0.6); this.snd('roar'); break;
        case 'raise': num(ev, 'RAISED', '#c9a0ff', -10, 1.0); burst(ev, 14, 60, ['#5a3a7a', '#7da36a'], 0.6); break;
        case 'summon': burst(ev, 14, 90, ['#9fd36a', '#e8c34a', '#c9a0ff'], 0.5); this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 2, r1: 16, life: 0.35, max: 0.35, color: '#9fd36a' }); this.snd('summon'); break;
        case 'unsummon': break;
        case 'heal': num(ev, '+' + ev.n, '#7fc98a', -14, 0.6); break;
        case 'burn': burst(ev, 3, 30, ['#ff8a3a', INK.verm], 0.3); break;
        case 'iaido': this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 10, r1: 3, life: 0.15, max: 0.15, color: '#ffffff' }); break;
        case 'bats': burst(ev, 16, 120, [INK.ink, '#3a0c14', '#8a1020'], 0.5); this.snd('bats'); break;
        case 'swordform':
          for (let i = 0; i < 3; i++) this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 2, r1: 14 + i * 8, life: 0.4 + i * 0.1, max: 0.6, color: i === 1 ? '#ffffff' : '#9fd8ff' });
          burst(ev, 24, 160, ['#9fd8ff', '#ffffff', '#d8dde3'], 0.5);
          this.flash('rgba(180,220,255,0.35)', 0.1); this.shake = Math.max(this.shake, 5); this.snd('slash');
          break;
        case 'apparition': this.flash('rgba(255,220,120,0.5)', 0.18); this.shake = Math.max(this.shake, 8); this.snd('gong'); break;
        case 'bloodmoonrise': this.flash('rgba(255,30,50,0.4)', 0.2); this.shake = Math.max(this.shake, 6); this.snd('bats'); break;
        case 'drain':
          this.parts.push({ kind: 'line', x0: sx(ev.x), y0: sy(ev.y) - 6, x1: sx(ev.tx), y1: sy(ev.ty) - 8, life: 0.25, max: 0.25, color: '#ff2a3a' });
          for (let i = 0; i < 5; i++) { const u = Math.random(); this.parts.push({ kind: 'px', x: sx(ev.x + (ev.tx - ev.x) * u), y: sy(ev.y + (ev.ty - ev.y) * u) - 7, vx: (ev.tx - ev.x) * 1.5, vy: (ev.ty - ev.y) * SQ * 1.5, life: 0.3, max: 0.3, color: '#ff5a5a' }); }
          this.snd('bite');
          break;
        case 'silkflight': burst(ev, 24, 100, ['#fff23c', '#eee0a0', '#424964'], 0.65); this.snd(ev.dust ? 'kingDust' : 'kingSilk'); break;
        case 'kingStars': this.snd('kingStars'); break;
        case 'kingGalaxy': this.snd('kingFall'); break;
        case 'infinity':
          this.parts.push({ kind: 'ring', x: ev.x + (ev.ox - ev.x) * 0.4, y: ev.y + (ev.oy - ev.y) * 0.4, r0: 2, r1: 7, life: 0.25, max: 0.25, color: '#bfe0ff' });
          if (!(this.infT > performance.now())) { this.infT = performance.now() + 900; num(ev, 'INFINITY', '#bfe0ff', -16, 0.7); this.snd('parry'); }
          break;
        case 'burnout': num(ev, 'INFINITY DOWN', '#ff9a9a', -16, 1.0); burst(ev, 14, 90, ['#bfe0ff', '#8a8f9c'], 0.4); this.snd('block'); break;
        case 'rct':
          num(ev, 'REVERSE CURSED TECHNIQUE', '#bfffd8', -20, 0.9);
          for (let i = 0; i < 2; i++) this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 14, r1: 3 + i * 4, life: 0.4, max: 0.4, color: i ? '#ffffff' : '#bfffd8' });
          this.snd('holy');
          break;
        case 'tp': this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 2, r1: 10, life: 0.2, max: 0.2, color: '#7fd0ff' }); burst(ev, 6, 60, ['#7fd0ff', '#ffffff'], 0.25); this.snd('zap'); break;
        case 'redburst':
          for (let i = 0; i < 3; i++) this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 2, r1: 10 + i * 7, life: 0.35, max: 0.35, color: ['#ff3030', '#ffffff', '#ff8080'][i] });
          burst(ev, 24, 200, ['#ff3030', '#ffb0b0', '#ffffff'], 0.4); this.shake = Math.max(this.shake, 6); this.flash('rgba(255,40,40,0.2)', 0.06); this.snd('boom');
          break;
        case 'erase': burst(ev, 4, 40, ['#b040ff', '#ffffff'], 0.2); break;
        case 'voidpunch': { // Unlimited Void: blink in, fist lands, gone again
          this.parts.push({ kind: 'ghost', name: ev.sprite, x: ev.gx, y: ev.gy, flip: ev.fx < 0, scale: 1.15, life: 0.18, max: 0.18 });
          this.parts.push({ kind: 'ghost', name: ev.sprite, x: ev.ex, y: ev.ey, flip: ev.fx < 0, scale: 1.15, life: 0.12, max: 0.12 });
          const X = sx(ev.x), Y = sy(ev.y) - 6;
          for (let i = 0; i < 4; i++) { const o = (i - 1.5) * 3; this.parts.push({ kind: 'line', x0: X - ev.fx * 16 - ev.fy * o, y0: Y - ev.fy * 10 + ev.fx * o * 0.6, x1: X - ev.fx * 4, y1: Y - ev.fy * 3, life: 0.1, max: 0.1, color: ev.black ? '#ff2a2a' : '#ffffff' }); }
          if (ev.black) { // Black Flash: the hit lands within a millionth of a second and space bends black
            for (let i = 0; i < 3; i++) this.parts.push({ kind: 'bolt', black: true, x: X + (Math.random() - .5) * 10, y: Y + 6, life: 0.16, max: 0.16, seed: Math.random() * 1000 });
            burst(ev, 14, 160, ['#000000', '#ff2a2a', '#000000', '#ffffff'], 0.25);
            this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 2, r1: 13, life: 0.18, max: 0.18, color: '#ff2a2a' });
            this.flash('rgba(0,0,0,0.45)', 0.05); this.shake = Math.max(this.shake, 5);
            if (!(this.bfT > performance.now())) { this.bfT = performance.now() + 700; num(ev, 'BLACK FLASH', '#ff3030', -18, 0.7); }
            this.snd('heavyhit');
          } else {
            this.parts.push({ kind: 'star', x: X, y: Y, life: 0.08, max: 0.08, color: '#ffffff' });
            burst(ev, 6, 110, ['#ffffff', '#bfe0ff'], 0.18); this.shake = Math.max(this.shake, 2);
            this.snd('hit');
          }
          break;
        }
        case 'domain':
          this.banner = { text: 'UNLIMITED VOID', kicker: 'DOMAIN EXPANSION', life: 2.2, color: '#ffffff' };
          this.flash('rgba(255,255,255,0.8)', 0.2); this.shake = Math.max(this.shake, 8); this.snd('ultboom');
          break;
        case 'purplecharge':
          for (let i = 0; i < 2; i++) this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 40, r1: 2, life: 0.9, max: 0.9, color: i ? '#ff3030' : '#3f8cff' });
          num(ev, 'HOLLOW PURPLE', '#d8a0ff', -22, 1.2); this.snd('riser');
          break;
        case 'purplefire': this.flash('rgba(180,80,255,0.4)', 0.12); this.shake = Math.max(this.shake, 10); this.snd('ultboom'); break;
        case 'honored':
          this.banner = { text: 'THE HONORED ONE', kicker: 'REVIVED', life: 3.2, color: '#7fd0ff' };
          for (let i = 0; i < 4; i++) this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 2, r1: 16 + i * 12, life: 0.6 + i * 0.12, max: 1, color: i % 2 ? '#ffffff' : '#7fd0ff' });
          burst(ev, 50, 200, ['#7fd0ff', '#ffffff', '#bfe0ff'], 0.9);
          this.flash('rgba(200,240,255,0.6)', 0.3); this.snd('piano');
          break;
        case 'resist': num(ev, 'RESIST', '#ffffff', -14, 0.5); break;
        // the worlds' own foes
        case 'speech': num(ev, ev.word, '#c9a0ff', -18, 1.2); this.snd('roar'); break;
        case 'feast': num(ev, 'FEAST', '#ff5a5a', -14, 0.7); this.snd('bite'); break;
        case 'rewindally': num(ev, 'TURNED BACK', '#5fe0e0', -16, 1.0); this.snd('riser'); break;
        case 'paradox': num(ev, 'PARADOX', '#ffffff', -16, 1.0); break;
        case 'maskbreak': num(ev, 'MASK BROKEN', '#c5a82b', -16, 1.0); this.snd('heavyhit'); break;
        case 'resonance': num(ev, 'RESONANCE x' + ev.n, '#d9b26a', -18, 1.0); this.flash('rgba(138,16,32,0.18)', 0.08); break;
        case 'freeze': num(ev, 'FROZEN', '#9fc8e8', -14, 0.8); break;
        case 'glitchcopy': num(ev, 'COPIED' + (ev.name ? ': ' + ev.name.toUpperCase() : ''), '#c050ff', -18, 1.0); break;
        case 'haste': num(ev, 'HASTE', '#5fe0e0', -14, 0.6); break;
        case 'gamblecast': // a die tumbling off her for every cast
          this.parts.push({ kind: 'die', n: 1 + Math.floor(Math.random() * 6), x: sx(ev.x) + (Math.random() - .5) * 30, y: sy(ev.y) - 20 - Math.random() * 14, life: 0.5, max: 0.5 });
          if (ev.ult) num(ev, ev.name.toUpperCase(), '#ffffff', -36, 0.8);
          break;
        case 'arsenal': // a weapon from the future, unfolding out of nothing
          num(ev, ev.name.toUpperCase(), '#7fe0ff', -26, 1.0);
          for (let i = 0; i < 2; i++) this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 2, r1: 9 + i * 5, life: 0.3, max: 0.3, color: i ? '#ffffff' : '#7fe0ff' });
          burst(ev, 10, 80, ['#7fe0ff', '#ffffff', '#8a8f9c'], 0.3); this.snd('summon');
          break;
        case 'shieldup': num(ev, 'PHASE SHIELD', '#7fe0ff', -18, 0.8); this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 2, r1: 14, life: 0.35, max: 0.35, color: '#7fe0ff' }); this.snd('holy'); break;
        case 'shieldhit': this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 12, r1: 10, life: 0.12, max: 0.12, color: '#bfefff' }); this.snd('block'); break;
        case 'shieldbreak': num(ev, 'SHIELD DOWN', '#ff9a9a', -16, 0.7); burst(ev, 16, 120, ['#7fe0ff', '#ffffff'], 0.4); this.snd('boom'); break;
        case 'pastecho': // a pale copy of the target from 3s ago takes the hit first
          this.parts.push({ kind: 'ghost', name: SPRITE_CACHE[ev.sprite] ? ev.sprite : 'hero', x: ev.x, y: ev.y, flip: ev.flip, scale: 1, life: 1.0, max: 1.0 });
          for (let i = 0; i < 2; i++) this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 14, r1: 3 + i * 4, life: 0.9, max: 0.9, color: i ? '#ffd8a0' : '#7fe0ff' });
          num(ev, 'PAST SELF', '#ffd8a0', -18, 0.9); this.snd('ring');
          break;
        case 'pastwound': num(ev, 'PAST WOUND', '#ffd8a0', -14, 0.7); burst(ev, 10, 90, ['#ffd8a0', '#7fe0ff', '#ffffff'], 0.3); this.snd('hit'); break;
        case 'rewindfoe':
          for (let i = 0; i <= 5; i++) { const u = i / 5; this.parts.push({ kind: 'ring', x: ev.x + (ev.tx - ev.x) * u, y: ev.y + (ev.ty - ev.y) * u, r0: 8, r1: 2, life: 0.2 + u * 0.3, max: 0.5, color: i % 2 ? '#7fe0ff' : '#ffd8a0' }); }
          num(ev, 'REWOUND', '#7fe0ff', -14, 0.8); this.snd('riser');
          break;
        case 'pastself':
          this.banner = { text: ev.name, life: 3.2, small: true, color: ev.color, kicker: 'THIRD FORM', lore: ev.lore };
          for (let i = 0; i < 3; i++) this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 60 + i * 20, r1: 3, life: 0.6 + i * 0.1, max: 0.8, color: i === 1 ? '#ffffff' : '#ffd8a0' });
          this.flash('rgba(255,230,190,0.5)', 0.25); this.shake = Math.max(this.shake, 6); this.snd('riser'); this.snd('gong');
          break;
        case 'lastgamble':
          this.banner = { text: 'LAST GAMBLE', life: 2.2, small: true, color: '#ffffff', kicker: 'ALL IN' };
          this.flash('rgba(255,255,255,0.6)', 0.2); this.shake = Math.max(this.shake, 8); this.snd('ultboom');
          break;
        case 'awaken':
          this.banner = { text: ev.name.toUpperCase(), kicker: 'AWAKENING ' + ['I', 'II', 'III', 'IV', 'V'][(ev.tier || 1) - 1], life: 1.8, small: true, color: ev.color };
          for (let i = 0; i < 3; i++) this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 2, r1: 12 + i * 9, life: 0.5 + i * 0.1, max: 0.7, color: i === 1 ? '#ffffff' : ev.color });
          burst(ev, 30, 150, [ev.color, '#ffffff'], 0.6);
          this.flash('rgba(255,255,255,0.3)', 0.12); this.shake = Math.max(this.shake, 5); this.snd('gong');
          break;
        case 'awakenEnd': burst(ev, 8, 40, ['#8a8f9c'], 0.4); break;
        case 'heroUlt':
          this.banner = { text: ev.name.toUpperCase(), kicker: ['ULTIMATE SPECIAL', 'SPECIALIZED', 'SYNTHESIS', 'TRANSCENDENCE'][(ev.stage || 1) - 1], life: 2.0, small: true, color: ev.color };
          this.flash('rgba(255,255,255,0.35)', 0.12); this.shake = Math.max(this.shake, 4);
          for (let i = 0; i < 2; i++) this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 40, r1: 3, life: 0.5, max: 0.5, color: i ? '#ffffff' : ev.color });
          this.snd('riser');
          break;
        case 'herostance': for (let i = 0; i < 2; i++) this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 16, r1: 8 + i * 3, life: 0.8, max: 0.8, color: i ? '#ffffff' : '#7fd0ff' }); num(ev, 'STANCE', '#7fd0ff', -16, 0.7); this.snd('parry'); break;
        case 'stanceblock': this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 6, r1: 12, life: 0.15, max: 0.15, color: '#bfe0ff' }); this.snd('parry'); break;
        case 'herocharge': for (let i = 0; i < 3; i++) this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 30 - i * 6, r1: 2, life: 0.55, max: 0.55, color: i ? '#ffd84a' : '#ffffff' }); this.snd('charge'); break;
        case 'heroquake': this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 4, r1: 34, life: 0.3, max: 0.3, color: '#c8ccd2' }); burst(ev, 14, 120, ['#c8ccd2', '#7a705f'], 0.4); this.shake = Math.max(this.shake, 5); this.snd('thud'); break;
        case 'herodomain':
          this.banner = { text: (ev.title || 'TRANSCENDENCE').toUpperCase(), kicker: 'DOMAIN', life: 2.2, small: true, color: ev.color };
          this.flash('rgba(255,255,255,0.6)', 0.18); this.shake = Math.max(this.shake, 8); this.snd('ultboom');
          break;
        case 'herofinale': this.flash('rgba(255,255,255,0.4)', 0.12); this.shake = Math.max(this.shake, 9); this.snd('gong'); break;
        case 'heroFinisher': {
          const c = ev.color;
          if (ev.kind === 'nova' || ev.kind === 'bulwark' || ev.kind === 'tide') for (let i = 0; i < 4; i++) this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 3, r1: 14 + i * 8, life: 0.4 + i * 0.08, max: 0.7, color: i % 2 ? '#ffffff' : c });
          if (ev.kind === 'pierce') { this.flash('rgba(255,220,120,0.35)', 0.1); }
          if (ev.kind === 'blitz') for (let i = 0; i < 6; i++) this.parts.push({ kind: 'line', x0: sx(ev.x) + (Math.random() - .5) * 40, y0: sy(ev.y) - 5 + (Math.random() - .5) * 20, x1: sx(ev.x) + (Math.random() - .5) * 40, y1: sy(ev.y) - 5 + (Math.random() - .5) * 20, life: 0.25, max: 0.25, color: c });
          if (ev.kind === 'myriad') for (let i = 0; i < 4; i++) this.parts.push({ kind: 'glyph', x: sx(ev.x) + (Math.random() - .5) * 24, y: sy(ev.y) - 8 + (Math.random() - .5) * 12, c: [c, '#ffffff'], life: 0.6, max: 0.6 });
          burst(ev, 26, 180, [c, '#ffffff'], 0.5); this.shake = Math.max(this.shake, 8); this.snd('ultboom');
          break;
        }
        case 'hazemiss': if (!(this.hazeT > performance.now())) { this.hazeT = performance.now() + 600; num(ev, 'MISS', '#c8ccd2', -14, 0.5); } break;
        case 'lichsplit':
          this.banner = { text: 'IT FALLS TO PIECES', life: 1.6, small: true, color: '#5dff9a' };
          burst(ev, 40, 160, ['#5dff9a', '#ece4d2', '#5a3a7a'], 0.7);
          for (let i = 0; i < 3; i++) this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 3, r1: 14 + i * 8, life: 0.5, max: 0.5, color: i === 1 ? '#ece4d2' : '#5dff9a' });
          this.shake = Math.max(this.shake, 7); this.snd('death'); this.snd('raise' in SOUNDS ? 'raise' : 'summon');
          break;
        case 'dice':
          this.parts.push({ kind: 'die', n: ev.n, x: sx(ev.x), y: sy(ev.y) - 26, life: 1.0, max: 1.0 });
          num(ev, ev.skill.toUpperCase() + ' x' + ev.n, ev.n === 6 ? '#ffffff' : '#c8c8c8', -34, 0.9);
          this.snd(ev.n === 6 ? 'learn' : 'block');
          break;
        case 'timestop':
          this.banner = { text: 'TIME STOP', life: 1.0, color: '#d8f4ff' };
          for (let i = 0; i < 3; i++) this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 120, r1: 4 + i * 6, life: 0.4 + i * 0.08, max: 0.6, color: i === 1 ? '#ffffff' : '#7fe0ff' });
          this.flash('rgba(200,230,255,0.5)', 0.15); this.shake = Math.max(this.shake, 6); this.snd('gong'); this.snd('bassdrop');
          break;
        case 'rift':
          for (let i = 0; i < 3; i++) this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 2, r1: 10 + i * 5, life: 0.5, max: 0.5, color: ['#c050ff', '#7fe0ff', '#ffffff'][i] });
          this.parts.push({ kind: 'spiral', x: sx(ev.x), y: sy(ev.y) - 6, c: ['#c050ff', '#7fe0ff'], life: 0.6, max: 0.6 });
          num(ev, 'RIFT', '#c050ff', -14, 0.8); this.snd('vortex');
          break;
        case 'rewind': {
          num(ev, 'REWIND' + (ev.gain ? ' +' + ev.gain : ''), '#7fe0ff', -16, 1.1);
          for (let i = 0; i <= 6; i++) { // afterimages strung back along the way it came
            const u = i / 6;
            this.parts.push({ kind: 'ring', x: ev.x + (ev.tx - ev.x) * u, y: ev.y + (ev.ty - ev.y) * u, r0: 9, r1: 2, life: 0.25 + u * 0.3, max: 0.55, color: i % 2 ? '#7fe0ff' : '#ffffff' });
          }
          this.flash('rgba(127,224,255,0.25)', 0.1); this.snd('riser');
          break;
        }
        case 'phased': num(ev, 'PHASED', '#2affff', -12, 0.6); burst(ev, 8, 80, ['#2affff', '#ff2ad4', '#ffffff'], 0.3); this.snd('zap'); break;
        case 'ricochet': burst(ev, 4, 70, ['#ffe9a8', '#ffffff'], 0.2); this.snd('zap'); break;
        case 'bloodrise':
          num(ev, 'UNDEATH', '#ff2a3a', -16, 1.4);
          for (let i = 0; i < 3; i++) this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 2, r1: 12 + i * 9, life: 0.5 + i * 0.1, max: 0.7, color: ['#8a1020', '#ff2a3a', '#ff9090'][i] });
          burst(ev, 34, 150, ['#8a1020', '#ff2a3a', '#3a0c14'], 0.8);
          this.flash('rgba(255,20,40,0.4)', 0.2); this.shake = Math.max(this.shake, 7); this.snd('bats');
          break;
        case 'chainpull': this.parts.push({ kind: 'line', x0: sx(ev.x), y0: sy(ev.y) - 8, x1: sx(ev.tx), y1: sy(ev.ty) - 6, life: 0.2, max: 0.2, color: '#ffb04a' }); this.snd('whoosh'); break;
        case 'phoenix':
          num(ev, 'PHOENIX', '#ffb04a', -16, 1.2);
          for (let i = 0; i < 3; i++) this.parts.push({ kind: 'ring', x: ev.x, y: ev.y, r0: 2, r1: 12 + i * 8, life: 0.5 + i * 0.1, max: 0.7, color: ['#ff5a1a', '#ffe14d', '#ffffff'][i] });
          burst(ev, 30, 140, ['#ff5a1a', '#ffb04a', '#ffe14d'], 0.7);
          this.parts.push({ kind: 'column', x: ev.x, y: ev.y, color: '#ffb04a', life: 0.4, max: 0.4, w: 5 });
          this.flash('rgba(255,160,60,0.35)', 0.15); this.snd('learn');
          break;
        case 'cone': {
          this.parts.push({ kind: 'cone', x: ev.x, y: ev.y, fx: ev.fx, fy: ev.fy, range: ev.range, angle: ev.angle, variant: ev.variant, life: 0.3, max: 0.3 });
          this.shake = Math.max(this.shake, 3);
          // a stream of fire or wind flowing out along the cone
          const a0 = Math.atan2(ev.fy, ev.fx), gold = ev.variant === 'gold', soul = ev.variant === 'soul' || ev.variant === 'poison', fire = ev.variant === 'fire' || gold || soul;
          for (let i = 0; i < 26; i++) {
            const a = a0 + (Math.random() - .5) * 2 * ev.angle, sp = 60 + Math.random() * ev.range * 3;
            this.parts.push({ kind: 'px', x: sx(ev.x), y: sy(ev.y) - 5, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * SQ, g: fire ? -40 : 0, life: 0.35 + Math.random() * 0.2, max: 0.5,
              color: ev.variant === 'ink' ? ['#141414', '#3a3a40', '#ece4d2'][i % 3] : ev.variant === 'poison' ? ['#9ad04a', '#4b7a2a', '#e8ffb0'][i % 3] : soul ? ['#5dff9a', '#c9a0ff', '#ffffff'][i % 3] : gold ? ['#ffd84a', '#fff3b0', '#ffffff'][i % 3] : fire ? ['#ff5a1a', '#ffb04a', '#ffe14d'][i % 3] : ['#e8f0f8', '#b8c8d8'][i % 2] });
          }
          if (!fire) for (let i = 0; i < 5; i++) { const oy = (Math.random() - .5) * 14; this.parts.push({ kind: 'line', x0: sx(ev.x), y0: sy(ev.y) + oy - 5, x1: sx(ev.x + ev.fx * ev.range), y1: sy(ev.y + ev.fy * ev.range) + oy - 5, life: 0.3, max: 0.3, color: '#e8f0f8' }); }
          this.snd(ev.variant === 'poison' ? 'squelch' : fire ? 'fire' : 'wind');
          break;
        }
        default: this.ingestNew(ev, num, burst);
      }
    }
    tinted.forEach(([c, from], i) => { if (c) this.tintParts(from, i + 1 < tinted.length ? tinted[i + 1][1] : this.parts.length, c); });
    sim.fx.length = 0;
  }

  // Recolour particles to an awakening's colour, keeping white highlights white (numbers keep their own colours).
  tintParts(from, to, c) {
    for (let i = from; i < to; i++) {
      const p = this.parts[i];
      if (!p || p.kind === 'num' || p.kind === 'ghost') continue;
      if (p.color && p.color !== '#ffffff' && p.color !== '#fff') p.color = c;
      if (p.kind === 'bolt' || p.kind === 'cone') p.tintC = c;
      if (Array.isArray(p.c)) p.c = [c, '#ffffff'];
      else if (typeof p.c === 'string') p.c = c;
    }
  }

  // Draw something in its awakening's colour: draw it on a scratch layer, wash that in the colour, lay it down.
  drawTinted(c, draw) {
    if (!this.tintCv) { this.tintCv = document.createElement('canvas'); this.tintCv.width = W; this.tintCv.height = H; this.tintG = this.tintCv.getContext('2d'); this.tintG.imageSmoothingEnabled = false; }
    const main = this.g, tg = this.tintG, n0 = this.parts.length;
    tg.setTransform(1, 0, 0, 1, 0, 0); tg.clearRect(0, 0, W, H);
    tg.setTransform(main.getTransform());
    this.g = tg; draw(); this.g = main;
    tg.setTransform(1, 0, 0, 1, 0, 0);
    tg.globalCompositeOperation = 'source-atop'; tg.globalAlpha = 0.7; tg.fillStyle = c; tg.fillRect(0, 0, W, H);
    tg.globalCompositeOperation = 'source-over'; tg.globalAlpha = 1;
    const tr = main.getTransform(); main.setTransform(1, 0, 0, 1, 0, 0); main.drawImage(this.tintCv, 0, 0); main.setTransform(tr);
    this.tintParts(n0, this.parts.length, c); // trails it left behind
  }

  cosmicProject(x,y,z) {
    const scale=260/(260+y*.4+Math.max(0,z)*.7);
    return {x:CX+x*scale,y:CY+(y*SQ-z)*scale,scale};
  }

  drawCosmicCore(x,y,r) {
    const g=this.g;
    for(let yy=-Math.ceil(r);yy<=r;yy++) for(let xx=-Math.ceil(r);xx<=r;xx++) {
      const d=(xx*xx+yy*yy)/(r*r);if(d>1)continue;
      const lit=Math.sqrt(1-d)*.7-(xx+yy)/r*.2;
      g.fillStyle=lit>.65?'#fff9e5':lit>.35?'#ffd58b':lit>.1?'#d68c8f':'#735a93';
      g.fillRect(Math.round(x+xx),Math.round(y+yy),1,1);
    }
  }

  drawBlackStar3D(x,y,r,spin) {
    const g=this.g;
    const ring=front=>{
      for(let i=0;i<120;i++) {
        const a=i*Math.PI/60+spin,depth=Math.sin(a);if((depth>0)!==front)continue;
        const scale=1+depth*.12,rr=r*(1.45+(i%3)*.12);
        g.fillStyle=['#8d76bc','#c5b1eb','#ead5a1','#5c79b4'][i%4];
        g.fillRect(Math.round(x+Math.cos(a)*rr*scale),Math.round(y+depth*rr*.35-Math.cos(a)*rr*.2),front?2:1,1);
      }
    };
    ring(false);
    for(let yy=-Math.ceil(r);yy<=r;yy++) for(let xx=-Math.ceil(r);xx<=r;xx++) {
      const d=(xx*xx+yy*yy)/(r*r);if(d>1)continue;
      const light=Math.sqrt(1-d)*.35-(xx+yy)/r*.3;
      g.fillStyle=d>.85?(light>.15?'#d4c7ee':'#514968'):light>.4?'#232034':light>.15?'#10101e':'#020309';
      g.fillRect(Math.round(x+xx),Math.round(y+yy),1,1);
    }
    ring(true);
  }

  // Effects are drawn on the native 256x144 canvas, before actors and HUD.
  drawYellowCosmos(sim) {
    const g = this.g, t = sim.t;
    const kings = sim.enemies.filter(e => e.def.yellowKing && !e.dead && e.hp > 0);
    const trueForm = kings.some(e => e.phase === 2);
    g.save();
    if (trueForm) {
      // Keep the original arena pixels. Only the sky/land outside its top and side wall vanish.
      g.fillStyle='#000000';
      for(let y=13;y<H;y++) {
        const top=(y-CY)/(R*SQ), side=(y-CY-7)/(R*SQ);
        const halfTop=Math.abs(top)<=1?R*Math.sqrt(1-top*top):-1;
        const halfSide=y>CY&&Math.abs(side)<=1?R*Math.sqrt(1-side*side):-1;
        const half=Math.max(halfTop,halfSide);
        if(half<0) g.fillRect(0,y,W,1);
        else { const left=Math.ceil(CX-half),right=Math.floor(CX+half)+1;g.fillRect(0,y,left,1);g.fillRect(right,y,W-right,1); }
      }
    }
    const line = (x1, y1, x2, y2, c) => this.kingLine(x1,y1,x2,y2,c);
    const star = (x, y, r) => {
      // Stepped black disks with four uneven rays, rather than smooth vector circles.
      for (let yy = -r; yy <= r; yy++) {
        const half = Math.round(Math.sqrt(Math.max(0, r*r-yy*yy)));
        g.fillStyle = '#eee0a0'; g.fillRect(Math.round(x-half-1), Math.round(y+yy), half*2+2, 1);
        g.fillStyle = '#03040c'; g.fillRect(Math.round(x-half), Math.round(y+yy), half*2, 1);
      }
      line(x-r-4,y,x-r,y,'#fff23c'); line(x+r,y,x+r+4,y,'#fff23c');
      line(x,y-r-5,x,y-r,'#eee0a0'); line(x,y+r,x,y+r+5,'#eee0a0');
    };
    for (const h of sim.cosmicFields || []) {
      if (h.age < 0) continue; // Preview wind-up: the departure clone is not present yet.
      if (h.kind === 'clone') {
        g.globalAlpha = 0.45 + Math.sin(t * 18) * 0.15;
        this.sprite(h.sprite || 'b_yellowking', h.x, h.y, false, 'ghost', 3, 1); g.globalAlpha = 1;
        this.ellipse(h.x, h.y, 28, '#eee0a0', true);
        if (h.age < 0.5) for (let i = 0; i < 24; i++) {
          const u = clamp((h.age-i%6*0.012)/(0.37+i%4*0.012),0,1), spread=Math.sin(u*Math.PI);
          const x=sx(h.x+(h.tx-h.x)*u)+Math.sin(i*2.4)*spread*19;
          const y=sy(h.y+(h.ty-h.y)*u)-16-Math.sin(u*Math.PI)*(10+i%5*3)+Math.cos(i*1.7)*spread*9;
          g.globalAlpha=Math.min(1,(1-u)*5);
          this.drawSilkBird(x,y,t*20+i,h.tx<h.x,i);
        }
        g.globalAlpha=1;
      } else if (h.kind === 'dust') {
        for (let i = 0; i < 30; i++) { const a = i * 2.4, r = h.age * 45; g.fillStyle = i % 2 ? '#fff23c' : '#aaa585'; g.globalAlpha = h.life / 0.6; g.fillRect(Math.round(sx(h.x + Math.cos(a)*r)), Math.round(sy(h.y + Math.sin(a)*r) - 4), 2, 2); } g.globalAlpha = 1;
      } else if (h.kind === 'stars') {
        const merged=h.age>=BLACK_STAR_MERGE;
        // Independent accretion disks and orbital wakes; no lines between the stars.
        if(!merged) {
          const height=105*Math.pow(Math.max(0,1-h.age/BLACK_STAR_MERGE),1.35);
          for(let trail=8;trail>=1;trail--) {
            const age=Math.max(0,h.age-trail*.022),z=105*Math.pow(Math.max(0,1-age/BLACK_STAR_MERGE),1.35);
            g.globalAlpha=(1-trail/9)*.3;
            for(const q of blackStarPositions(age)) {const p=this.cosmicProject(q.x,q.y,z);g.fillStyle='#b0a4d8';g.fillRect(Math.round(p.x),Math.round(p.y),2,1);}
          }
          g.globalAlpha=1;
          for(const q of blackStarPositions(h.age).sort((a,b)=>a.y-b.y)) {
            const p=this.cosmicProject(q.x,q.y,height);
            g.globalAlpha=.25*(1-height/120);this.ellipse(q.x,q.y,10+p.scale*5,'#141020',false,.35);g.globalAlpha=1;
            this.drawBlackStar3D(p.x,p.y,8*p.scale,h.age*7);
          }
          g.globalAlpha=0.25+0.15*Math.sin(h.age*10);
          this.ellipse(0,0,BLACK_STAR_BLAST_RADIUS,'#a48bb9',true);g.globalAlpha=1;
        } else {
          const burst=h.age-BLACK_STAR_MERGE, fade=Math.max(0,1-burst/1.4);
          for(let ring=0;ring<3;ring++) {
            const r=Math.max(0,burst*115-ring*10);
            g.globalAlpha=fade*(1-ring*.2);
            this.ellipse(0,0,r,['#fffbd4','#c6b6ef','#626fb1'][ring],false);
          }
          for(let i=0;i<100;i++) {
            const a=i*2.399, r=burst*(35+(i%11)*9), x=128+Math.cos(a)*r,y=sy(0)+Math.sin(a)*r*.65+burst*24;
            g.fillStyle=['#fffbd4','#d5b2ff','#809df4','#e9b75a'][i%4];
            g.fillRect(Math.round(x),Math.round(y),i%4?1:2,1);
          }
          g.globalAlpha=fade;
          star(128,sy(0),Math.max(1,Math.round(15-burst*12)));
          g.globalAlpha=1;
        }
      } else if (h.kind === 'eye') {
        const open = Math.min(1, h.age * 6, h.life * 3);
        // Nested stepped eyelids, a radial iris, and a narrow abyssal pupil.
        for(let x=-43;x<=43;x++) {
          const arch=Math.sin((x+43)/86*Math.PI), hh=Math.round(arch*15*open);
          g.fillStyle='#7c6b45'; g.fillRect(128+x,34-hh-2,1,hh*2+4);
          g.fillStyle='#c4b58e'; g.fillRect(128+x,34-hh,1,hh*2);
          g.fillStyle='#eee0c1'; g.fillRect(128+x,34-hh+2,1,Math.max(0,hh*2-4));
        }
        for(let i=0;i<56;i++) { const a=i*Math.PI/28, r=10*open; line(128+Math.cos(a)*5,34+Math.sin(a)*5*open,128+Math.cos(a)*r,34+Math.sin(a)*r*open,i%3?'#b79a32':'#fff23c'); }
        g.fillStyle='#080b20'; g.fillRect(126,34-11*open,4,22*open);
        g.fillStyle='#fffbd4'; g.fillRect(130,28,2,2);
        for(let i=-3;i<=3;i++) { const x=128+i*11, y=20+Math.abs(i)*2; line(x,y,x+i*2,y-5,'#9c8c61'); }
      } else if (h.kind === 'galaxy') {
        const k=Math.min(1,h.age/2.5),height=130*(1-k*k),tilt=0.9-k*.5;
        const points=[],colors=['#47d8ef','#667eff','#a979f2','#eb74cc','#f59a94','#ffd48b','#95e7dc'];
        g.globalAlpha=.2+k*.18;this.ellipse(0,0,35+k*55,'#191325',false,.3);g.globalAlpha=1;
        // A tilted, thick disk rotating in 3D; perspective changes its scale and foreshortening.
        for(let arm=0;arm<3;arm++) for(let i=1;i<130;i++) for(let lane=-2;lane<=2;lane++) {
          const u=i/130,a=arm*Math.PI*2/3+u*5.8-h.age*.9+lane*.065,r=u*94;
          const dx=Math.cos(a)*r,dy=Math.sin(a)*r;
          const z=height+dy*Math.sin(tilt)+Math.sin(i*7+lane)*2*(1-u);
          const p=this.cosmicProject(dx,dy*Math.cos(tilt),z);
          points.push({ ...p,depth:dy,color:lane===0&&i%5===0?'#fff4ee':colors[(Math.floor(u*12)+arm*2+Math.abs(lane))%colors.length],alpha:Math.abs(lane)===2?.45:1 });
        }
        points.sort((a,b)=>a.depth-b.depth);
        const core=this.cosmicProject(0,0,height);
        let coreDrawn=false;
        for(const p of points) {
          if(!coreDrawn&&p.depth>0) {g.globalAlpha=1;this.drawCosmicCore(core.x,core.y,8*core.scale);coreDrawn=true;}
          g.globalAlpha=p.alpha;g.fillStyle=p.color;g.fillRect(Math.round(p.x),Math.round(p.y),p.scale>1.1?2:1,1);
        }
        g.globalAlpha=1;
        if(!coreDrawn) this.drawCosmicCore(core.x,core.y,8*core.scale);
        if(!h.hit) {g.globalAlpha=.35;this.ellipse(0,0,R*k,'#c9b568',true);g.globalAlpha=1;}
        else {const burst=h.age-2.5;this.ellipse(0,0,20+burst*170,'#eee0a0',false);}

      }
    }
    g.restore();
  }

  draw(sim, dt, extra = {}) {
    const g = this.g;
    this.tick = sim.t;
    const painted = sim.enemies.some(e => e.painting && !e.dead);
    this.soundOn = !!extra.sound && dt > 0 && !painted; // inside the painting, nothing makes a sound
    if (sim.fx) this.ingest(sim);
    const settled = this.parts.length; // sparks, trails and auras spawned while frozen would never age: see below
    const ox = this.shake > 0 ? Math.round((Math.random() - .5) * this.shake) : 0;
    const oy = this.shake > 0 ? Math.round((Math.random() - .5) * this.shake) : 0;
    this.shake = Math.max(0, this.shake - dt * 20);

    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle='#000';g.fillRect(0,0,W,H);
    g.setTransform(1,0,0,1,ox,oy);
    const world = extra.world;
    const scene = typeof WORLD_SCENES !== 'undefined' && WORLD_SCENES[world];
    if (scene && !this.worldBackgrounds[world]) this.worldBackgrounds[world] = bakeWorldArena(world);
    g.drawImage(this.worldBackgrounds[world] || this.bg, 0, 0);
    if (scene) { this.ambT = (this.ambT || 0) + dt; drawWorldAmbient(g, world, this.ambT); }
    else this.drawLanterns(sim.t);
    this.drawSkyOmens(sim);
    this.drawYellowCosmos(sim);
    if (sim.timeStopT > 0) this.drawTimeStop(sim);
    if (sim.domainT > 0) this.drawVoid(sim);
    if (sim.heroDomain) this.drawHeroDomain(sim);
    if (dt > 0 && sim.enemies.some(e => e.type === 'blind' && !e.dead) && Math.random() < 0.35) this.parts.push({ kind: 'px', x: Math.random() * W, y: 14, vx: -8 - Math.random() * 6, vy: 14 + Math.random() * 8, life: 6, max: 6, color: Math.random() < 0.6 ? '#ff9ad8' : '#ffd8ec' });
    if (this.ultFx) {
      const u = this.ultFx, k = Math.min(1, (u.max - u.t) / 0.3, u.t / 0.4);
      if (!u.cosmic && !sim.enemies.some(e=>e.def.yellowKing && e.phase===2 && !e.dead)) { g.globalAlpha = Math.max(0, k); g.fillStyle = u.dark || 'rgba(0,0,0,0.45)'; g.fillRect(0, 13, W, H - 13); g.globalAlpha = 1; }
      u.t -= dt; if (u.t <= 0) this.ultFx = null;
    }
    if (sim.skySplit) this.drawSkySplit(sim); // above the ultimate's darkness, so the split always shows
    g.setTransform(1, 0, 0, 1, ox, oy);

    // ground telegraphs
    for (const h of sim.hazards) { if (h.tint) this.drawTinted(h.tint, () => this.drawHazard(h, sim.t)); else this.drawHazard(h, sim.t); }
    this.drawSwordLayer(sim, dt, 'g');
    for (const e of sim.enemies) {
      if (e.state !== 'wind' || !e.atk) continue;
      const k = e.windT / e.atk.wind;
      const kind = e.atk.kind;
      if (kind === 'slam') {
        const c = e.atk.unblockable ? INK.verm : '#e8a040';
        this.ellipse(e.x, e.y, e.atk.radius, c, true);
        this.ellipse(e.x, e.y, e.atk.radius * k, c, false, 0.3);
      } else if (kind === 'cone') {
        this.drawCone(e.x, e.y, e.fx, e.fy, e.atk.range + e.r, e.atk.angle, e.atk.variant === 'wind' ? '#b8c8d8' : INK.verm, k);
      } else if (kind === 'pounce' || kind === 'leap') {
        g.fillStyle = kind === 'leap' ? INK.verm : e.atk.untargetable ? '#8a1020' : '#e08a2a';
        const lt = e.tgt || sim.p;
        const len = kind === 'leap' ? Math.min(e.atk.maxRange, Math.hypot(lt.x - e.x, lt.y - e.y)) : (e.atk.lunge * e.atk.lungeTime);
        for (let i = 6; i < len; i += 4) g.fillRect(Math.round(sx(e.x + e.fx * i)), Math.round(sy(e.y + e.fy * i)), 1, 1);
      } else if (kind === 'flurry') { // the arc the string of blows will sweep
        const arc = Math.min(e.atk.arc || 0.7, Math.PI), reach = (e.atk.range || 14) + e.r + 4, a0 = Math.atan2(e.fy, e.fx);
        g.fillStyle = e.atk.breaksGuard || (e.atk.finisher && e.atk.finisher.breaksGuard) ? '#f0a050' : INK.gold;
        for (let i = -6; i <= 6; i++) { const a = a0 + arc * i / 6; if ((i + Math.floor(sim.t * 20)) % 2) g.fillRect(Math.round(sx(e.x + Math.cos(a) * reach)), Math.round(sy(e.y + Math.sin(a) * reach)), 1, 1); }
        if (k > 0.5) this.ellipse(e.x + e.fx * reach * 0.6, e.y + e.fy * reach * 0.6, 3 * k, INK.gold, true);
      } else if (kind === 'climb') {
        const a = Math.atan2(e.y, e.x); g.fillStyle = '#c9a0ff';
        for (let i = 4; i < R - Math.hypot(e.x, e.y); i += 4) g.fillRect(Math.round(sx(e.x + Math.cos(a) * i)), Math.round(sy(e.y + Math.sin(a) * i)), 1, 1);
      } else if (kind === 'armor' || kind === 'shift' || kind === 'decoy') {
        if (Math.random() < 0.6) this.spark(sx(e.x), sy(e.y) - 6, kind === 'armor' ? ['#ff3a1a', '#5a1010'] : kind === 'decoy' ? ['#ff9ad8', '#ffffff'] : ['#c9a66b', '#ece4d2'], -30, 0.4, 14);
      } else if (kind === 'shoot' && e.atk.proj === 'purple') { // the line Hollow Purple will erase
        g.globalAlpha = 0.25 + k * 0.5; g.fillStyle = Math.floor(sim.t * 16) % 2 ? '#b040ff' : '#ffffff';
        for (let i = 8; i < 280; i += 3) {
          const wx = e.x + e.fx * i, wy = e.y + e.fy * i;
          if (Math.hypot(wx, wy) > R + 20) break;
          g.fillRect(Math.round(sx(wx)), Math.round(sy(wy)) - 6, 1, 1);
        }
        g.globalAlpha = 1;
        // blue and red drawing together in his hands
        const X = Math.round(sx(e.x + e.fx * 8)), Y = Math.round(sy(e.y + e.fy * 8)) - 8, sep = Math.round((1 - k) * 8);
        g.fillStyle = '#3f8cff'; g.fillRect(X - sep - 1, Y - 1, 3, 3); g.fillStyle = '#ff3030'; g.fillRect(X + sep - 1, Y - 1, 3, 3);
      } else if (kind === 'shoot' && e.atk.laser) {
        // sniper's laser sight
        g.globalAlpha = 0.4 + k * 0.6;
        g.fillStyle = Math.floor(sim.t * 20) % 2 ? '#ff3030' : '#ff8080';
        for (let i = 6; i < 260; i += 2) {
          const wx = e.x + e.fx * i, wy = e.y + e.fy * i;
          if (Math.hypot(wx, wy) > R + 20) break;
          g.fillRect(Math.round(sx(wx)), Math.round(sy(wy)) - 5, 1, 1);
        }
        g.globalAlpha = 1;
      }
    }

    // shadows
    g.fillStyle = 'rgba(20,20,20,0.35)';
    const shadow = (x, y, r) => g.fillRect(Math.round(sx(x) - r), Math.round(sy(y)) - 1, r * 2, 2);
    for (const h of sim.heroes) if (!h.dead) shadow(h.x, h.y, 4);
    for (const e of sim.enemies) if (e.state !== 'spawn' && !e.climbing) shadow(e.x, e.y, Math.round(e.r * (e.def.floating ? 0.7 : 1)));

    if (painted) this.paintWorld(sim); // the painting drains the world, but not the living
    const actors = sim.enemies.map(e => ({ y: e.y, e }));
    for (const h of sim.heroes) if (!h.dead) actors.push({ y: h.y, p: h });
    actors.sort((a, b) => a.y - b.y);
    const frame = Math.floor(sim.t * 6) % 2;
    // afterimages behind anyone mid-lunge
    if (dt > 0) for (const f of [...sim.heroes, ...sim.enemies]) {
      const dashing = (f.state === 'act' && f.atk && f.atk.kind === 'pounce' && !f.atk.untargetable) || (f.state === 'ult' && f.dashT > 0);
      if (dashing && Math.floor(sim.t * 60) % 2 === 0) {
        this.parts.push({ kind: 'ghost', name: f.isPlayer ? 'hero_walk' : spriteFor(f), x: f.x, y: f.y, flip: f.fx < 0, scale: f.def ? f.def.scale || 1 : 1, life: 0.2, max: 0.2 });
      }
    }
    for (const a of actors) {
      if (a.p) {
        if (a.p.discarded || a.p.guardianEcho) { this.g.save(); this.g.filter = a.p.guardianEcho ? 'grayscale(1) brightness(0.48)' : 'grayscale(1)'; }
        this.drawHero(sim, a.p, frame);
        if (a.p.discarded || a.p.guardianEcho) this.g.restore();
        if (a.p.guardianEcho) { const x = sx(a.p.x), y = sy(a.p.y); this.g.fillStyle = '#17151b'; this.g.fillRect(x - 8, y - 21, 16, 2); this.g.fillRect(x - 5, y - 24, 10, 3); this.g.fillRect(x - 7, y - 9, 3, 7); this.g.fillRect(x + 4, y - 9, 3, 7); }
      }
      else if (a.e.projection) { this.g.save(); this.g.filter = 'grayscale(1) sepia(0.6) hue-rotate(145deg)'; this.drawEnemy(sim, a.e, frame); this.g.restore(); }
      else this.drawEnemy(sim, a.e, frame);
    }

    for (const pr of sim.proj) { if (pr.tint) this.drawTinted(pr.tint, () => this.drawProjectile(pr, sim.t)); else this.drawProjectile(pr, sim.t); }

    this.drawFalls(dt);
    if (!(dt > 0)) this.parts.length = Math.min(this.parts.length, settled); // paused or idle: drop this frame's decorations, or they pile up forever
    this.drawParticles(dt);
    this.drawSwordLayer(sim, dt, 'a');
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (sim.bigDragon) this.drawBigDragon(sim, dt);
    if (this.biteFx) {
      this.biteFx.t -= dt;
      if (this.biteFx.t <= 0) this.biteFx = null;
    }
    if (this.shatter) this.drawShatter(dt);
    if (this.flashT > 0) { this.flashT -= dt; g.fillStyle = this.flashColor || 'rgba(236,228,210,0.18)'; g.fillRect(0, 13, W, H - 13); }
    if(this.cosmicImpactT>0) {
      const age=.18-this.cosmicImpactT;this.cosmicImpactT=Math.max(0,this.cosmicImpactT-dt);
      g.fillStyle=age<.045?'rgba(255,249,229,0.92)':age<.09?'rgba(4,3,12,0.8)':'rgba(221,204,255,0.18)';g.fillRect(0,13,W,H-13);
      for(let i=0;i<18;i++) {
        const a=i*Math.PI/9,r=12+age*220;
        this.kingLine(CX+Math.cos(a)*r,CY+Math.sin(a)*r*.65,CX+Math.cos(a)*(r+28),CY+Math.sin(a)*(r+28)*.65,age<.045?'#191324':'#fff3d4',i%3?1:2);
      }
    }
    this.drawHud(sim, extra, dt);

    this.drawUltTitle();
    this.drawSwordTitle(dt);
    if (this.banner) {
      const b = this.banner;
      b.life -= dt;
      if (b.life <= 0) this.banner = null;
      else if (b.kicker) {
        this.text(b.kicker, W / 2, 34, '#ffffff', 'center');
        this.text(b.text, W / 2, 46, b.color || INK.rice, 'center', b.text.length > 15 ? 8 : 16);
        if (b.lore) this.text(b.lore, W / 2, 62, '#d8d8d8', 'center');
      } else if (Math.floor(b.life * 8) % 2 || b.life < 0.9) this.text(b.text, W / 2, 40, INK.rice, 'center', b.text.length > 15 ? 8 : 16);
    }
    if (extra.paused && !extra.overlay) this.text('PAUSED', W / 2, H / 2 - 8, INK.rice, 'center', 16);
    if (extra.overlay) this.drawOverlay(extra.overlay);
    // The camera is inside the swallowed world: even HUD, particles and flashes
    // are occluded. Draw last so no other boss effect can reveal teeth or scenery.
    this.drawDevouredScreen(sim);

  }

  // The fighter's own domain at Transcendence: the arena washed in its colour, light spiralling in.
  drawHeroDomain(sim) {
    const g = this.g, d = sim.heroDomain, k = Math.min(1, d.t / 0.4, (2.7 - d.t) / 0.3), t = sim.t;
    g.globalAlpha = 0.35 * k; g.fillStyle = '#05050a'; g.fillRect(0, 13, W, H - 13);
    g.globalAlpha = 0.25 * k; g.fillStyle = d.color; g.fillRect(0, 13, W, H - 13);
    g.globalAlpha = 0.8 * k; g.fillStyle = d.color;
    for (let i = 0; i < 40; i++) { const a = i * 2.4 + t * 1.5, r = ((i * 13 + t * 60) % 130); g.fillRect(Math.round(128 + Math.cos(a) * r), Math.round(80 + Math.sin(a) * r * 0.6), 2, 1); }
    g.globalAlpha = 1;
  }

  // Unlimited Void: a black space with endless light streaming out of its centre.
  drawVoid(sim) {
    const g = this.g, t = sim.t, k = Math.min(1, sim.domainT / 0.4, 1);
    g.globalAlpha = 0.9 * k; g.fillStyle = '#04040c'; g.fillRect(0, 13, W, H - 13);
    const r0 = mulberry32(7);
    for (let i = 0; i < 90; i++) { // streaks flying outward forever
      const a = r0() * Math.PI * 2, sp = 0.3 + r0() * 0.7, d = ((t * sp + r0()) % 1) * 170;
      const x = 128 + Math.cos(a) * d, y = 78 + Math.sin(a) * d * 0.62, len = 1 + d / 40;
      g.globalAlpha = k * Math.min(1, d / 40); g.fillStyle = i % 5 ? '#ffffff' : '#9fd8ff';
      g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(Math.abs(Math.cos(a)) * len)), Math.max(1, Math.round(Math.abs(Math.sin(a)) * len * 0.6)));
    }
    g.globalAlpha = 0.6 * k; g.strokeStyle = '#ffffff'; g.lineWidth = 1;
    g.beginPath(); g.ellipse(128.5, 78.5, 36 + Math.sin(t * 3) * 2, 22, 0, 0, 7); g.stroke();
    g.globalAlpha = 1;
  }

  // Time Stop: a cold wash over everything and a frozen clock in the sky.
  drawTimeStop(sim) {
    const g = this.g, k = Math.min(1, sim.timeStopT / 0.3);
    const tc = sim.timeStopTint;
    g.globalAlpha = 0.28 * k; g.fillStyle = tc || '#5a7ab0'; g.fillRect(0, 13, W, H - 13);
    g.globalAlpha = 0.55 * k; g.strokeStyle = tc || '#d8f4ff'; g.lineWidth = 1;
    g.beginPath(); g.arc(128.5, 40.5, 20, 0, 7); g.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.fillStyle = '#d8f4ff'; g.fillRect(Math.round(128 + Math.cos(a) * 17), Math.round(40 + Math.sin(a) * 17), 1, 1); }
    g.beginPath(); g.moveTo(128.5, 40.5); g.lineTo(128.5, 26.5); g.moveTo(128.5, 40.5); g.lineTo(137.5, 44.5); g.stroke();
    g.globalAlpha = 1;
  }

  // How each future weapon goes off.
  weaponFire(ev, num, burst) {
    const X = sx(ev.x), Y = sy(ev.y) - 8;
    switch (ev.id) {
      case 'plasma':
        this.parts.push({ kind: 'ring', x: ev.x + ev.fx * 9, y: ev.y + ev.fy * 9, r0: 1, r1: 6, life: 0.12, max: 0.12, color: '#7fe0ff' });
        break;
      case 'railgun': // a blinding line straight across the ring, and a kick back
        this.parts.push({ kind: 'line', x0: X, y0: Y, x1: X + ev.fx * 300, y1: Y + ev.fy * 300 * SQ, life: 0.18, max: 0.18, color: '#ffffff', w: 3 });
        this.parts.push({ kind: 'line', x0: X, y0: Y, x1: X + ev.fx * 300, y1: Y + ev.fy * 300 * SQ, life: 0.3, max: 0.3, color: '#7fe0ff', w: 1 });
        this.flash('rgba(200,240,255,0.35)', 0.06); this.shake = Math.max(this.shake, 7); this.snd('ultboom');
        break;
      case 'orbital':
        this.parts.push({ kind: 'line', x0: X, y0: Y, x1: X, y1: 14, life: 0.25, max: 0.25, color: '#ff3030' });
        num(ev, 'TARGET LOCKED', '#ff3030', -30, 0.9);
        break;
      case 'gravity': case 'emp': // tossed in a little arc
        for (let i = 0; i < 6; i++) { const u = i / 5; this.parts.push({ kind: 'px', x: X + ev.fx * 40 * u, y: Y + ev.fy * 40 * u * SQ - Math.sin(u * Math.PI) * 12, vx: 0, vy: 0, life: 0.1 + u * 0.2, max: 0.3, color: ev.id === 'gravity' ? '#7a3ad0' : '#6fc3ff' }); }
        this.snd('whoosh');
        break;
      case 'drones': num(ev, 'DRONES OUT', '#c8ccd2', -26, 0.8); burst(ev, 8, 60, ['#8a8f9c', '#ff3030'], 0.3); break;
      case 'shield': // a hexagon lattice snapping shut around him
        for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; this.parts.push({ kind: 'line', x0: X + Math.cos(a) * 12, y0: Y + 4 + Math.sin(a) * 8, x1: X + Math.cos(a + 1.047) * 12, y1: Y + 4 + Math.sin(a + 1.047) * 8, life: 0.5, max: 0.5, color: '#7fe0ff' }); }
        break;
    }
  }

  // Boss second forms that change the sky itself.
  drawSkyOmens(sim) {
    const g = this.g, t = sim.t;
    for (const e of sim.enemies) {
      if (e.dead) continue;
      if (e.moonT > 0) {
        const k = Math.max(0, Math.min(1, e.moonT / 0.6, (6 - e.moonT) / 0.6));
        g.globalAlpha = 0.3 * k; g.fillStyle = '#5a0010'; g.fillRect(0, 13, W, H - 13);
        g.globalAlpha = k;
        for (let r = 16; r >= 9; r -= 3) { g.globalAlpha = k * (r === 9 ? 1 : 0.18); g.fillStyle = r === 9 ? '#ff2a3a' : '#ff5a5a'; g.beginPath(); g.arc(206, 32, r, 0, 7); g.fill(); }
        g.fillStyle = '#b2101e'; g.fillRect(203, 29, 3, 2); g.fillRect(208, 34, 2, 2);
        g.globalAlpha = 1;
      }
      if (e.court && e.phase === 2) this.drawCourt(t);
      if (e.apparitionT > 0) this.drawThousandHands(sim, e);
    }
  }

  // The Celestial Court: golden clouds, a palace in the sky, light pouring down.
  drawCourt(t) {
    const g = this.g;
    g.globalAlpha = 0.18; g.fillStyle = '#ffd84a';
    for (let i = 0; i < 5; i++) { const x = 40 + i * 44 + Math.sin(t + i) * 4; g.fillRect(Math.round(x), 13, 6, 46); }
    g.globalAlpha = 0.85;
    // palace
    const cx = 128;
    g.fillStyle = '#e8c34a'; g.fillRect(cx - 22, 22, 45, 2); g.fillRect(cx - 16, 18, 33, 2); g.fillRect(cx - 9, 15, 19, 2);
    g.fillStyle = '#c23b22'; g.fillRect(cx - 18, 24, 37, 5); g.fillRect(cx - 12, 20, 25, 2);
    g.fillStyle = '#fff3b0'; for (let x = cx - 16; x <= cx + 16; x += 4) g.fillRect(x, 25, 1, 4);
    g.fillStyle = '#ffd84a'; g.fillRect(cx, 13, 1, 2);
    // clouds drifting along the horizon, with sentinels standing on them
    for (let i = 0; i < 9; i++) {
      const x = ((i * 31 + t * 6) % 280) - 12, y = 27 + (i % 3) * 3;
      g.fillStyle = i % 2 ? '#fff3b0' : '#ffe9a8';
      g.fillRect(Math.round(x), y, 14, 3); g.fillRect(Math.round(x) + 3, y - 2, 8, 2);
      if (i % 3 === 1) { g.fillStyle = '#e8c34a'; g.fillRect(Math.round(x) + 6, y - 7, 2, 5); g.fillStyle = '#c23b22'; g.fillRect(Math.round(x) + 6, y - 8, 2, 1); g.fillStyle = '#d8dde3'; g.fillRect(Math.round(x) + 9, y - 9, 1, 7); }
    }
    g.globalAlpha = 1;
  }

  // The Ten-Thousand-Hand Buddha rises behind the Abbot, every hand a weapon.
  drawThousandHands(sim, e) {
    const g = this.g, t = sim.t;
    const k = Math.max(0, Math.min(1, e.apparitionT / 0.5, (4.8 - e.apparitionT) / 0.6));
    const X = Math.round(sx(e.x)), Y = 46;
    g.globalAlpha = 0.25 * k; g.fillStyle = '#ffd84a'; g.fillRect(0, 13, W, H - 13);
    g.globalAlpha = 0.55 * k;
    for (let i = 0; i < 36; i++) { // arms fanning out in rings, slowly turning
      const ring = i % 3, a = i / 36 * Math.PI * 2 + t * (ring === 1 ? -0.4 : 0.3), r = 22 + ring * 9;
      const hx = X + Math.cos(a) * r, hy = Y + Math.sin(a) * r * 0.75;
      g.strokeStyle = '#e8c34a'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(X + Math.cos(a) * 8 + 0.5, Y + Math.sin(a) * 6 + 0.5); g.lineTo(Math.round(hx) + 0.5, Math.round(hy) + 0.5); g.stroke();
      g.fillStyle = '#fff3b0'; g.fillRect(Math.round(hx) - 1, Math.round(hy) - 1, 3, 3);
    }
    g.globalAlpha = 0.8 * k;
    g.strokeStyle = '#fff3b0'; g.beginPath(); g.arc(X + 0.5, Y - 14.5, 9, 0, 7); g.stroke(); // halo
    g.fillStyle = '#e8c34a'; g.fillRect(X - 4, Y - 19, 9, 9); g.fillRect(X - 7, Y - 10, 15, 16); // head, robe
    g.fillStyle = '#ffd84a'; g.fillRect(X - 3, Y - 18, 7, 7);
    g.fillStyle = '#8f7438'; g.fillRect(X - 2, Y - 15, 1, 1); g.fillRect(X + 2, Y - 15, 1, 1);
    g.fillStyle = '#c23b22'; g.fillRect(X, Y - 20, 1, 2);
    g.globalAlpha = 1;
  }

  drawLanterns(t) {
    const g = this.g;
    for (const [x, y] of [[22, 70], [234, 70]]) {
      g.fillStyle = INK.ink; g.fillRect(x, y - 22, 1, 22); g.fillRect(x - 3, y - 22, 7, 1);
      const f = Math.floor(t * 8 + x) % 3;
      g.fillStyle = 'rgba(232,140,60,0.10)'; g.fillRect(x - 7, y - 21, 15, 15);
      g.fillStyle = INK.verm; g.fillRect(x - 2, y - 18, 5, 7);
      g.fillStyle = f ? '#e8703a' : '#f09050'; g.fillRect(x - 1, y - 17, 3, 5);
      g.fillStyle = INK.gold; g.fillRect(x - 2, y - 19, 5, 1); g.fillRect(x - 2, y - 11, 5, 1); g.fillRect(x, y - 10, 1, 2);
    }
  }

  heroPose(p, frame) {
    if (p.state === 'roll') return 'hero_roll';
    if (p.guard) return 'hero_guard';
    if (p.state === 'wind') {
      if (p.atk.id === 'kick') return p.windT > p.atk.wind * 0.5 ? 'hero_kick' : 'hero';
      if (p.atk.id === 'heavy') return 'hero_heavy';
      return 'hero';
    }
    if (p.state === 'recover' && p.atk && p.st > p.atk.recover - 0.12) {
      return p.atk.id === 'kick' ? 'hero_kick' : 'hero_punch';
    }
    return (p.mvx || p.mvy) && frame ? 'hero_walk' : 'hero';
  }

  // guard shield arc in front of a fighter; gold while the parry window is open
  drawGuard(sim, f, lift) {
    const g = this.g;
    const fresh = sim.t - f.guardStart <= PARRY_WIN;
    g.fillStyle = fresh ? INK.gold : '#a8a196';
    const a0 = Math.atan2(f.fy, f.fx), rad = f.r + 4;
    for (let i = -4; i <= 4; i++) {
      const a = a0 + i * 0.2;
      g.fillRect(Math.round(sx(f.x + Math.cos(a) * rad)), Math.round(sy(f.y + Math.sin(a) * rad)) - 4 - lift, 1, 1);
    }
  }

  drawStunStars(x, top, t) {
    const g = this.g;
    g.fillStyle = INK.gold;
    for (let i = 0; i < 3; i++) { const a = t * 8 + i * 2.1; g.fillRect(Math.round(x + Math.cos(a) * 5), Math.round(top - 2 + Math.sin(a) * 1.5), 1, 1); }
  }

  // a small marker over each fighter in a battle, in its team's colour
  drawTeamMark(sim, f, top) {
    const g = this.g, X = Math.round(sx(f.x));
    g.fillStyle = INK.ink; g.fillRect(X - 3, top - 8, 7, 4);
    g.fillStyle = TEAM_COLORS[f.team] || '#ffffff';
    g.fillRect(X - 2, top - 8, 5, 2); g.fillRect(X - 1, top - 6, 3, 1);
    if (f === sim.p && f.controller === 'key') this.text('YOU', X, top - 18, TEAM_COLORS[f.team], 'center');
  }

  drawHero(sim, p, frame) {
    const flip = p.fx < 0;
    const beast = p.beastT > 0 && SHIFT_FORMS[p.beast];
    let name = p.polyT > 0 ? 'rabbit' : beast ? beast.sprite : this.heroPose(p, frame);
    const skin = SKIN_BY_ID[p.skin];
    if (name !== 'rabbit' && !beast) name = skin && skin.gi ? skinSprite(name, p.skin) : sim.battle ? teamSprite(name, p.team) : name;
    this.drawHeroTalents(sim, p, beast, skin); // a skin outranks team colours (the team mark still shows)
    if (skin && skin.fx) this.drawSkinFx(sim, p, skin, 'pre');
    const hurtFlash = p.hurtT > 0 && Math.floor(p.hurtT * 30) % 2;
    if (p.awakeT > 0 && p.awaken) { // awakened: its color rising off it, more with every awakening
      const c = p.awaken.color, sc = p.fxScale || 1;
      this.g.globalAlpha = 0.4 + 0.25 * Math.sin(sim.t * 10); this.ellipse(p.x, p.y, 7 * sc, c, true); this.g.globalAlpha = 1;
      if (p.tier >= 3) { this.g.globalAlpha = 0.3; this.ellipse(p.x, p.y, 10 * sc, '#ffffff', true); this.g.globalAlpha = 1; }
      for (let j = 0; j < (p.tier || 1); j++) if (Math.random() < 0.35) this.parts.push({ kind: 'px', x: sx(p.x) + (Math.random() - .5) * 10, y: sy(p.y) - Math.random() * 12, vx: (Math.random() - .5) * 6, vy: -30 - Math.random() * 25, life: 0.45, max: 0.45, color: Math.random() < 0.6 ? c : '#ffffff' });
    }
    if (p.stanceT > 0 && p.state === 'heroult') { this.g.globalAlpha = 0.6; this.ellipse(p.x, p.y, 9, '#7fd0ff', true); this.g.globalAlpha = 1; }
    if (p.state === 'heroult' && Math.random() < 0.8) this.parts.push({ kind: 'ghost', name: 'hero_walk', x: p.x, y: p.y, flip: p.fx < 0, scale: 1, life: 0.2, max: 0.2 });
    if (p.state === 'roll') { this.g.globalAlpha = 0.85; }
    p.drawScale = (p.drawScale || 1) + (((p.awakeT > 0 && p.fxScale) || 1) - (p.drawScale || 1)) * 0.15; // grows into each awakening
    const held = p.cocoonT > 0 || p.liftT > 0 || p.heldT > 0, hl = p.liftT > 0 ? Math.round(Math.min(1, (1 - p.liftT) * 4) * 10) : 0;
    this.sprite(name, p.x, p.y, flip, hurtFlash ? 'flash' : p.frozenT > 0 && !held ? 'ghost' : null, hl, Math.round(p.drawScale * 8) / 8);
    if (name !== 'rabbit' && !beast) drawRaceFeatures(this.g, p.race, sx(p.x), sy(p.y) - hl, Math.round(p.drawScale * 8) / 8, flip);
    this.g.globalAlpha = 1;
    if (skin && skin.fx) this.drawSkinFx(sim, p, skin, 'post');
    this.drawStatus(sim, p, hl);
    if (p.guard) this.drawGuard(sim, p, 0);
    if (p.rootT > 0) {
      this.g.fillStyle = '#4f9a3a';
      for (let i = -3; i <= 3; i += 2) this.g.fillRect(Math.round(sx(p.x)) + i, Math.round(sy(p.y)) - 2 - (i & 1), 1, 3);
    }
    const top = Math.round(sy(p.y) - SPRITE_CACHE.hero.h - 1);
    if (p.state === 'stun') this.drawStunStars(Math.round(sx(p.x)), top, sim.t);
    if (sim.battle) {
      this.drawTeamMark(sim, p, top);
      if (p !== sim.p) { // other heroes get a small health bar
        const X = Math.round(sx(p.x)) - 6;
        this.g.fillStyle = INK.ink; this.g.fillRect(X, top - 3, 12, 2);
        this.g.fillStyle = INK.verm; this.g.fillRect(X, top - 3, Math.round(12 * p.hp / p.maxHp), 2);
        return;
      }
    }
    // posture pip bar over the fighter once it starts to fill
    if (p.posture > p.postureMax * 0.05) {
      const X = Math.round(sx(p.x)) - 6;
      this.g.fillStyle = INK.ink; this.g.fillRect(X, top - 3, 12, 2);
      this.g.fillStyle = p.posture > p.postureMax * 0.75 && Math.floor(sim.t * 8) % 2 ? '#fff3b0' : INK.gold;
      this.g.fillRect(X, top - 3, Math.round(12 * p.posture / p.postureMax), 2);
    }
  }

  // Bosses: an aura in their colour, energy pouring in while they transform or charge an ultimate.
  drawBossAura(sim, e) {
    const g = this.g, t = sim.t, c = e.def.color || INK.gold, X = sx(e.x), Y = sy(e.y) - 10;
    const charging = e.state === 'transform' || (e.state === 'ult' && e.ultT < 0);
    if (e.phase === 2 || charging) {
      g.globalAlpha = 0.35 + 0.2 * Math.sin(t * 8);
      this.ellipse(e.x, e.y, e.r + 6 + Math.sin(t * 5) * 2, c, true);
      g.globalAlpha = 1;
      if (Math.random() < (charging ? 1 : 0.5)) this.parts.push({ kind: 'px', x: X + (Math.random() - .5) * e.r * 2.5, y: Y + 8, vx: 0, vy: -30 - Math.random() * 40, life: 0.6, max: 0.6, color: Math.random() < 0.5 ? c : '#ffffff' });
    }
    if (charging) {
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * 6.28, r = 30 + Math.random() * 20;
        this.parts.push({ kind: 'px', x: X + Math.cos(a) * r, y: Y + Math.sin(a) * r * 0.6, vx: -Math.cos(a) * r * 2.2, vy: -Math.sin(a) * r * 1.3, life: 0.45, max: 0.45, color: i ? c : '#ffffff' });
      }
      g.globalAlpha = 0.25 + 0.15 * Math.sin(t * 20); g.fillStyle = c;
      g.fillRect(Math.round(X) - 2, 14, 5, Math.round(Y) - 6);
      g.globalAlpha = 1;
      this.shake = Math.max(this.shake, e.state === 'transform' ? 2 + (1.6 - e.st) * 3 : 1.5);
    }
  }

  // The future arsenal in its hand during the wind-up: every weapon looks and charges differently.
  drawWeapon(sim, e, scale, lift) {
    const g = this.g, t = sim.t, id = e.atk.id, k = Math.min(1, e.windT / e.atk.wind);
    const flip = e.fx < 0, hx = Math.round(sx(e.x) + (flip ? -9 : 3)), hy = Math.round(sy(e.y) - 9 * scale - lift);
    const art = { plasma: 'w_plasma', railgun: 'w_rail', orbital: 'w_beacon', gravity: 'w_gravity', emp: 'w_emp', shield: 'w_shield' }[id];
    if (art) { const s = SPRITE_CACHE[art]; g.drawImage(flip ? s.f : s.n, flip ? hx - s.w + 6 : hx, hy, s.w, s.h); }
    const mx = flip ? hx - 6 : hx + 9; // roughly the muzzle
    if (id === 'plasma') { // coils glowing up one by one
      g.fillStyle = '#7fe0ff'; for (let i = 0; i < Math.round(k * 5); i++) g.fillRect(flip ? hx + 4 - i : hx + 1 + i, hy - 1, 1, 1);
    } else if (id === 'railgun') { // a charge gathering at the muzzle, sparks crawling along the rails
      const big = Math.round(1 + k * 3), X = flip ? hx - 7 : hx + 12;
      g.globalAlpha = 0.5 + k * 0.5; g.fillStyle = '#ffffff'; g.fillRect(X - (big >> 1), hy + 1 - (big >> 1), big, big); g.globalAlpha = 1;
      if (Math.random() < 0.6) this.parts.push({ kind: 'px', x: X + (Math.random() - .5) * 6, y: hy + 1 + (Math.random() - .5) * 4, vx: 0, vy: 0, life: 0.1, max: 0.1, color: '#7fe0ff' });
    } else if (id === 'orbital') { // the beacon calling up to a satellite
      if (Math.floor(t * 8) % 2) { g.fillStyle = '#ff3030'; g.fillRect(hx + 2, hy - 1, 1, 1); }
      g.globalAlpha = 0.6; g.fillStyle = '#ff3030'; for (let y = hy - 3; y > 14; y -= 3) g.fillRect(hx + 2, y, 1, 1); g.globalAlpha = 1;
    } else if (id === 'gravity' || id === 'emp') { // the pin comes out, a light blinks faster and faster
      if (Math.floor(t * (6 + k * 20)) % 2) { g.fillStyle = id === 'gravity' ? '#e0c8ff' : '#ffffff'; g.fillRect(flip ? hx + 4 : hx + 1, hy, 1, 1); }
    } else if (id === 'drones') { // drones unfolding and lifting off around him
      for (let i = 0; i < 5; i++) {
        if (i / 5 > k) break;
        const a = t * 4 + i * 1.256, r = 10 + i;
        const X = Math.round(sx(e.x + Math.cos(a) * r)), Y = Math.round(sy(e.y + Math.sin(a) * r) - 12 - lift);
        g.fillStyle = '#8a8f9c'; g.fillRect(X - 1, Y, 3, 1); g.fillStyle = Math.floor(t * 10 + i) % 2 ? '#ff3030' : '#5a1010'; g.fillRect(X, Y, 1, 1);
      }
    } else if (id === 'shield') { // the emitter spinning up
      g.globalAlpha = k; this.ellipse(e.x, e.y, (e.r + 6) * k, '#7fe0ff', true); g.globalAlpha = 1;
    }
  }

  // The Time Administrator: clock hands on its face, and a body that tears and skips.
  drawGlitch(sim, e, name, scale, lift, glitching, flip) {
    const g = this.g, t = sim.t, s = SPRITE_CACHE[name];
    const w = Math.round(s.w * scale), h = Math.round(s.h * scale);
    const x0 = Math.round(sx(e.x) - w / 2), y0 = Math.round(sy(e.y) - h + 1 - lift);
    if (name === 'b_timeadmin' && !(e.frozenT > 0)) {
      const cx = x0 + Math.round(6.5 * scale), cy = y0 + Math.round(4.5 * scale);
      const m = glitching ? -t * 40 + Math.random() * 6 : t * 3, hr = glitching ? Math.random() * 6.28 : t * 0.25;
      g.fillStyle = '#141414';
      for (let i = 1; i <= 4; i++) g.fillRect(Math.round(cx + Math.sin(m) * i), Math.round(cy - Math.cos(m) * i), 1, 1);
      g.fillStyle = '#c23b22';
      for (let i = 1; i <= 2; i++) g.fillRect(Math.round(cx + Math.sin(hr) * i), Math.round(cy - Math.cos(hr) * i), 1, 1);
      if (glitching) { g.fillStyle = Math.random() < 0.5 ? '#ff2ad4' : '#2affff'; g.fillRect(cx - 4 + Math.floor(Math.random() * 8), cy - 3 + Math.floor(Math.random() * 6), 2, 1); }
    }
    if (!glitching) return;
    // torn scanlines: copy a few rows of the body sideways, with colour fringes
    for (let i = 0; i < 3; i++) {
      const ry = y0 + Math.floor(Math.random() * h), rh = 1 + Math.floor(Math.random() * 2), off = Math.round((Math.random() - 0.5) * 8);
      g.drawImage(this.cv, x0, ry, w, rh, x0 + off, ry, w, rh);
    }
    g.globalAlpha = 0.45;
    g.drawImage(flip ? s.ghostF : s.ghost, x0 - 2, y0, w, h);
    g.globalAlpha = 0.35; g.fillStyle = '#ff2ad4'; g.fillRect(x0 + 1, y0 + Math.floor(Math.random() * h), w, 1);
    g.fillStyle = '#2affff'; g.fillRect(x0 - 1, y0 + Math.floor(Math.random() * h), w, 1);
    g.globalAlpha = 1;
  }

  kingLine(x0,y0,x1,y1,color,width=1) {
    const g=this.g, n=Math.max(1,Math.ceil(Math.max(Math.abs(x1-x0),Math.abs(y1-y0))));
    g.fillStyle=color;
    for(let i=0;i<=n;i++) g.fillRect(Math.round(x0+(x1-x0)*i/n),Math.round(y0+(y1-y0)*i/n),width,width);
  }

  drawYellowRegalia(sim,e) {
    const g=this.g,t=sim.t,X=sx(e.x),Y=sy(e.y)-5;
    g.save();
    if(e.def.puppet) {
      for(const off of [-3,3]) {
        g.globalAlpha=0.45; const top=X+off*3+Math.sin(t*1.5+e.id)*3;
        this.kingLine(top,13,X+off,Y-6,'#b4a478');
        g.globalAlpha=1; g.fillStyle='#eee0a0'; g.fillRect(Math.round(X+off),Math.round(Y-6),1,2);
      }
    } else if(e.phase===2) {
      // Tapered muscular tentacles: overlapping black sections, a shaded dorsal
      // ridge, and small underside suckers. Their tips curl independently.
      for(let arm=0;arm<10;arm++) {
        const a=arm*Math.PI/5 + Math.sin(arm*3.7)*.2, length=25+(arm%4)*4;
        for(let j=0;j<=28;j++) {
          const u=j/28, bend=a+Math.sin(t*1.25-u*3+arm)*.32+u*u*(1.2+Math.sin(t*.8+arm)*.7);
          const r=5+u*length, x=X+Math.cos(bend)*r, y=Y-15+Math.sin(bend)*r*.8;
          const width=Math.max(1,Math.round(7*Math.pow(1-u,1.4)));
          g.fillStyle='#04050b';g.fillRect(Math.round(x-width/2),Math.round(y-width/2),width+1,width+1);
          if(width>2) {
            g.fillStyle='#252a38';g.fillRect(Math.round(x-width/2),Math.round(y-width/2),Math.max(1,width-2),1);
            g.fillStyle='#10131e';g.fillRect(Math.round(x-width/2+1),Math.round(y-width/2+1),Math.max(1,width-2),Math.max(1,width-2));
          }
          if(j%4===0&&u>.2&&u<.85) {g.fillStyle='#575466';g.fillRect(Math.round(x+Math.sin(bend)*width*.3),Math.round(y-Math.cos(bend)*width*.3),1,1);}
        }
      }
      // Several overlapping lobes make a breathing black mass instead of a torso.
      for(let lobe=0;lobe<7;lobe++) {
        const a=lobe*2.4, x=X+Math.cos(a)*7,y=Y-16+Math.sin(a)*8;
        const r=8+Math.sin(t*1.3+lobe)*1.2;
        for(let yy=-Math.ceil(r);yy<=r;yy++) {
          const w=Math.round(Math.sqrt(Math.max(0,r*r-yy*yy)));
          g.fillStyle=yy<-r*.65?'#282c3c':'#05060d';g.fillRect(Math.round(x-w),Math.round(y+yy),w*2,1);
        }
      }
    } else {
      // Two layered silk trains drift independently from the shaded robe silhouette.
      for(const side of [-1,1]) for(let ribbon=0;ribbon<2;ribbon++) {
        let px=X+side*7,py=Y-17;
        for(let j=1;j<=18;j++) {
          const x=X+side*(7+j*.6)+Math.sin(t*2.1-j*.35+ribbon)*2,y=Y-17+j*.9+ribbon*3;
          this.kingLine(px,py,x,y,ribbon?'#c5a82b':'#eee0a0',ribbon?1:2);px=x;py=y;
        }
      }
      if(e.state==='transform') {
        const fall=Math.max(0,1.6-e.st)*16;
        g.fillStyle='#eee0a0';g.fillRect(Math.round(X+fall),Math.round(Y-25+fall),5,7);
        for(let j=0;j<7;j++) this.kingLine(X+(j-3)*fall*.5,Y-18+fall,X+(j-3)*fall*.7,Y-10+fall,'#c5a82b',2);
      }
    }
    if(e.def.yellowKing) {
      g.globalAlpha=0.32;
      for(let i=0;i<5;i++) {
        const yy=Math.round(Y-32+i*8),off=Math.round(Math.sin(t*3+i)*2);
        g.drawImage(this.cv,Math.max(0,Math.round(X-18)),Math.max(0,yy),36,1,Math.round(X-18)+off,yy,36,1);
      }
    }
    g.restore();
  }

  drawSilkBird(x,y,wing,flip,index) {
    const g=this.g, direction=flip?-1:1, pose=Math.floor(wing)%3;
    x=Math.round(x);y=Math.round(y);
    // A bright head, dark beak, paired flapping wings and a forked silk tail.
    g.fillStyle=index%3?'#fff23c':'#eee0a0';g.fillRect(x-1,y,3,2);
    g.fillStyle='#fffbd4';g.fillRect(x+direction*2,y-1,2,2);
    g.fillStyle='#74601c';g.fillRect(x+direction*4,y,1,1);
    const rise=[-3,0,2][pose];
    this.kingLine(x,y,x-direction*3,y+rise,'#fff23c');
    this.kingLine(x,y+1,x+direction,y-rise,'#eee0a0');
    this.kingLine(x-direction,y+1,x-direction*5,y+2+Math.sin(wing)*2,'#c5a82b');
    g.fillStyle='#eee0a0';g.fillRect(x-direction*6,y+3,1,1);
  }

  drawSilkDissolve(sim,e,name) {
    const g=this.g,s=SPRITE_CACHE[name],t=sim.t;
    const leaving=e.state==='wind' && e.atk && e.atk.id==='silkflight';
    const progress=leaving?clamp((e.windT-0.3)/0.35,0,1):clamp(1-(e.silkUntil-t)/0.45,0,1);
    const visible=leaving?1-progress:clamp((progress-0.45)/0.55,0,1);
    const x=Math.round(sx(e.x)-s.w/2),y=Math.round(sy(e.y)-s.h-4);
    // The silhouette unweaves in staggered horizontal strips, then knits back together.
    for(let row=0;row<s.h;row+=2) {
      if(((row*7)%s.h)/s.h>visible) continue;
      const off=Math.round(Math.sin(t*19+row)*(1-visible)*5);
      g.globalAlpha=0.25+visible*0.75;
      g.drawImage(e.fx<0?s.f:s.n,0,row,s.w,Math.min(2,s.h-row),x+off,y+row,s.w,Math.min(2,s.h-row));
    }
    g.globalAlpha=1;
    if(leaving) for(let i=0;i<12;i++) {
      const r=progress*(8+i%4*4),a=i*2.4+t;
      g.globalAlpha=progress;
      this.drawSilkBird(sx(e.x)+Math.cos(a)*r,sy(e.y)-15+Math.sin(a)*r*.6,t*20+i,e.fx<0,i);
    }
    g.globalAlpha=1;
  }

  drawEnemy(sim, e, frame) {
    const g = this.g, t = sim.t, def = e.def;
    const name = spriteFor(e), scale = def.rollingHead ? 1 + Math.max(0, 1 - (e.growT ?? 2.2) / 2.2) * 1.1 : def.scale || 1; // a rolling head swells before it becomes a person
    if (e.climbing) return this.drawClimbing(sim, e);
    if (e.vanished) { if (Math.random() < 0.15) this.parts.push({ kind: 'ghost', name, x: e.x + (Math.random() - .5) * 60, y: e.y + (Math.random() - .5) * 40, flip: Math.random() < 0.5, scale, life: 0.12, max: 0.12 }); return; } // gone between the cuts
    if (def.yellowKing && ((e.silkUntil || 0)>t || (e.state==='wind' && e.atk && e.atk.id==='silkflight' && e.windT>0.3))) {
      this.drawSilkDissolve(sim,e,name); return;
    }
    if (def.boss || def.kingClone) this.drawBossAura(sim, e); // his clones wear his aura too
    if (def.yellowKing || def.puppet) this.drawYellowRegalia(sim, e);
    const s = SPRITE_CACHE[name];
    if (e.state === 'spawn') {
      const k = e.st / (e.revived ? 1.2 : 0.6);
      g.globalAlpha = 1 - k * 0.6;
      this.sprite(name, e.x, e.y, e.x > 0, null, e.revived ? 0 : Math.round(k * k * 30), scale);
      g.globalAlpha = 1;
      return;
    }
    const flip = e.fx < 0;
    let mode = null;
    const winding = e.state === 'wind' && e.atk;
    if (e.flash > 0) mode = 'flash';
    else if (winding) {
      const k = e.windT / e.atk.wind;
      if (Math.floor(t * (8 + k * 20)) % 2) mode = 'flash';
    }
    let jx = 0, lift = def.floating ? 4 + Math.round(Math.sin(t * 3 + e.id)) : 0;
    if (e.state === 'stun' || e.state === 'flinch' || e.state === 'recoil') jx = Math.floor(t * 30) % 2 ? 1 : -1;
    if (e.state === 'idle' && (e.mvx || e.mvy) && frame && !def.floating) lift = 1;
    if (e.state === 'act' && e.atk.kind === 'leap') lift = Math.round(Math.sin((1 - e.st / e.atk.lungeTime) * Math.PI) * 18);
    if (e.swordForm) return this.drawSwordForm(sim, e); // man and sword become one
    if ((e.state === 'act' && e.atk.untargetable) || e.batForm) {
      // a swarm of bats instead of a body
      g.fillStyle = INK.ink;
      for (let i = 0; i < 7; i++) {
        const a = t * 9 + i * 0.9, r = 4 + (i % 3) * 2;
        const X = Math.round(sx(e.x + Math.cos(a) * r)), Y = Math.round(sy(e.y + Math.sin(a) * r)) - 6;
        g.fillRect(X - 1, Y, 3, 1); g.fillRect(X, Y + 1, 1, 1);
      }
      return;
    }
    if (e.steed) { // the rider sits up on a burning horse
      this.sprite('steed', e.x - (flip ? -2 : 2), e.y, flip, mode === 'flash' ? 'flash' : null, 0, 1);
      if (Math.random() < 0.6) this.parts.push({ kind: 'px', x: sx(e.x) + (Math.random() - .5) * 16, y: sy(e.y) - 1, vx: (Math.random() - .5) * 10, vy: -20 - Math.random() * 30, life: 0.35, max: 0.35, color: Math.random() < 0.5 ? '#ff5a1a' : '#ffe14d' });
      lift += 5;
    }
    if (def.infinity && sim.infinityUp && sim.infinityUp(e) && Math.floor(t * 8) % 3 === 0) { // Infinity, faintly visible
      g.globalAlpha = 0.25; this.ellipse(e.x, e.y, e.r + 6, '#bfe0ff', true); g.globalAlpha = 1;
    }
    if (e.invulnT > 0 && Math.floor(t * 20) % 2) mode = 'flash'; // invincible right after rising
    if (e.honored) { // the Honored One: blue-white light pouring off him
      g.globalAlpha = 0.35 + 0.2 * Math.sin(t * 8); this.ellipse(e.x, e.y, e.r + 5, '#7fd0ff', true); g.globalAlpha = 1;
      if (Math.random() < 0.7) this.parts.push({ kind: 'px', x: sx(e.x) + (Math.random() - .5) * 14, y: sy(e.y) - Math.random() * 18, vx: (Math.random() - .5) * 8, vy: -35 - Math.random() * 30, life: 0.5, max: 0.5, color: Math.random() < 0.5 ? '#ffffff' : '#7fd0ff' });
    }
    if (def.mystery && !e.instinct) { // ???: smoke at its feet, eyes that glint under the brim
      if (Math.random() < 0.45) this.parts.push({ kind: 'px', x: sx(e.x) + (Math.random() - .5) * 16, y: sy(e.y) - Math.random() * 4, vx: (Math.random() - .5) * 8, vy: -8 - Math.random() * 12, life: 0.9, max: 0.9, color: Math.random() < 0.5 ? '#2a2a35' : '#45455a' });
      if (Math.floor(t * 2 + e.id) % 7 === 0 && Math.random() < 0.04) this.parts.push({ kind: 'num', text: '?', x: sx(e.x) + (Math.random() - .5) * 20, y: sy(e.y) - 22, vy: -10, life: 0.8, max: 0.8, color: '#6a6a80' });
    }
    if (e.lastStand) { // her last gamble: flickering, already half gone
      g.globalAlpha = 0.5 + 0.4 * Math.sin(t * 25); this.ellipse(e.x, e.y, e.r + 7, '#ffffff', false, 0.3); g.globalAlpha = 1;
    }
    if (e.instinct) { // a silver-white aura, like a flame that never flickers the wrong way
      g.globalAlpha = 0.35 + 0.25 * Math.sin(t * 10); this.ellipse(e.x, e.y, e.r + 4 + Math.sin(t * 6), '#ffffff', true); g.globalAlpha = 1;
      for (let i = 0; i < 2; i++) this.parts.push({ kind: 'px', x: sx(e.x) + (Math.random() - .5) * 14, y: sy(e.y) - Math.random() * 16, vx: (Math.random() - .5) * 6, vy: -30 - Math.random() * 30, life: 0.5, max: 0.5, color: Math.random() < 0.6 ? '#ffffff' : '#c8e8ff' });
      if (e.state === 'roll' && Math.random() < 0.5) this.parts.push({ kind: 'ghost', name: spriteFor(e), x: e.x, y: e.y, flip: e.fx < 0, scale: def.scale || 1, life: 0.25, max: 0.25 });
    }
    if (e.shieldHp > 0) { // the future's phase shield
      g.globalAlpha = 0.3 + 0.15 * Math.sin(t * 9); this.ellipse(e.x, e.y, e.r + 6, '#7fe0ff', false, 0.2); g.globalAlpha = 0.8;
      const cx = Math.round(sx(e.x)), cy = Math.round(sy(e.y)) - 9, rr = e.r + 7;
      g.strokeStyle = '#bfefff'; g.lineWidth = 1; g.beginPath();
      for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI * 2 + t * 0.6, px = cx + Math.cos(a) * rr + 0.5, py = cy + Math.sin(a) * rr * 0.9 + 0.5; i ? g.lineTo(px, py) : g.moveTo(px, py); }
      g.stroke(); g.globalAlpha = 1;
    }
    if (e.frenzyT > 0) { // blood frenzy after rising from death
      g.globalAlpha = 0.5 + 0.3 * Math.sin(t * 14); this.ellipse(e.x, e.y, e.r + 5, '#ff2a3a', true); g.globalAlpha = 1;
      if (Math.random() < 0.7) this.parts.push({ kind: 'px', x: sx(e.x) + (Math.random() - .5) * 14, y: sy(e.y) - 4 - Math.random() * 12, vx: 0, vy: 25, g: 60, life: 0.5, max: 0.5, color: '#ff2a3a' });
    }
    if (e.state === 'roll') g.globalAlpha = 0.8;
    if (e.life !== undefined && e.life < 1) g.globalAlpha = Math.max(0.1, e.life);
    if (e.illusion) g.globalAlpha *= 0.5 + 0.15 * Math.sin(t * 9);
    if (e.state === 'transform' && Math.floor(t * (6 + (1.6 - e.st) * 14)) % 2) mode = 'flash';
    if (e.frozenT > 0) mode = 'ghost';
    if (def.camo) g.globalAlpha *= e.revealT > 0 ? 0.55 + e.revealT * 0.5 : 0.22 + 0.1 * Math.sin(t * 7 + e.id);
    const glitching = def.glitch && (e.state === 'transform' || Math.floor(t * 7 + e.id * 3) % 11 === 0 || (e.state === 'wind' && Math.random() < 0.15));
    if (glitching) jx += Math.random() < 0.5 ? -2 : 2;
    if (e.state === 'ult' && e.ultT < 0 && Math.floor(t * 16) % 2) mode = 'flash';
    let pic = e.polyT > 0 ? 'rabbit' : this.foePose(e, name, frame);
    const egg = e.state === 'egg';
    if (e.type === 'shadowclone') { pic = e.skin ? skinSprite(pic, e.skin) : pic; g.globalAlpha *= 0.55; } // a shadow of the fighter, in its skin
    if (e.type === 'spider' && !(e.polyT > 0)) lift += 3; // up on its legs
    if (e.climbUpT > 0) lift -= Math.round(e.climbUpT * 8); // hauling itself back over the edge
    if (e.liftT > 0) lift += Math.round(Math.min(1, (1 - e.liftT) * 4) * 10);
    if (egg) { mode = e.flash > 0 ? 'flash' : null; g.globalAlpha = 1; }
    if (!(e.polyT > 0)) this.drawFoeExtras(sim, e, pic, scale, lift, flip, jx, 'pre');
    const dragon = EASTERN_DRAGONS[e.type] && !(e.polyT > 0);
    if (dragon) this.drawEasternDragon(sim, e, EASTERN_DRAGONS[e.type](e), jx, lift, mode === 'flash', scale);
    else if (!(def.yellowKing && e.phase === 2)) this.sprite(pic, e.x + jx, e.y, flip && !egg, mode, lift, scale);
    g.globalAlpha = 1;
    if (!(e.polyT > 0)) this.drawFoeExtras(sim, e, pic, scale, lift, flip, jx, 'post');
    this.drawStatus(sim, e, lift);
    if (def.glitch) this.drawGlitch(sim, e, name, scale, lift, glitching, flip);
    if (e.finalKeeper) { // a broken gold dial follows every form of the reconstructed keeper
      const g = this.g, x = sx(e.x), y = sy(e.y) - 18 - lift, a = sim.t * (e.past ? -1.8 : 1.1);
      g.save(); g.globalAlpha = 0.8; g.fillStyle = '#d7aa67';
      for (let i = 0; i < 12; i++) { if (i === 3 || i === 8) continue; const q = a + i * Math.PI / 6; g.fillRect(Math.round(x + Math.cos(q) * 13), Math.round(y + Math.sin(q) * 13), 2, 2); }
      g.fillStyle = '#f5dfaf'; g.fillRect(Math.round(x - 1), Math.round(y - 15), 3, 3);
      g.fillStyle = '#a36b50'; g.fillRect(Math.round(x - 6), Math.round(y + 10), 12, 2);
      g.restore();
    }
    if (e.state === 'wind' && e.atk && e.atk.weapon) this.drawWeapon(sim, e, scale, lift);
    if (name === 'b_mystery' && !(e.frozenT > 0)) { // eyes glinting in the shadow of the brim
      const sp = SPRITE_CACHE[name], w = Math.round(sp.w * scale), hh = Math.round(sp.h * scale);
      const x0 = Math.round(sx(e.x + jx) - w / 2), y0 = Math.round(sy(e.y) - hh + 1 - lift), ey = y0 + Math.round(5.5 * scale);
      g.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(t * 2.3 + e.id)); g.fillStyle = '#bfefff';
      g.fillRect(x0 + Math.round(5.5 * scale), ey, 1, 1); g.fillRect(x0 + Math.round(7.5 * scale), ey, 1, 1);
      g.globalAlpha = 1;
    }
    if (e.guard) this.drawGuard(sim, e, lift);

    const h = Math.round(s.h * scale);
    const top = Math.round(sy(e.y) - h - 1 - lift) - (e.heads ? 12 : 0); // above the Hydra's heads
    const X = Math.round(sx(e.x));

    if (def.aura && Math.floor(t * 10) % 2) this.ellipse(e.x, e.y, e.r + 22, 'rgba(255,120,40,0.35)', true);
    if (def.ward && sim.t >= e.wardAt) this.ellipse(e.x, e.y, e.r + 3, 'rgba(232,195,74,0.6)', true);
    if (sim.battle) this.drawTeamMark(sim, e, top);
    else if (e.ally) { g.fillStyle = '#9fd36a'; g.fillRect(X - 1, top - 7, 3, 2); }
    if (winding) {
      const a = e.atk;
      const [mark, col] = a.unblockable ? ['!!', '#ff5a3c'] : a.breaksGuard || (a.blockPosture || 0) >= 30 ? ['!', '#f0a050'] : a.ignoresGuard ? ['!', '#9fd3a8'] : ['!', INK.gold];
      this.text(mark, X, top - 13, col, 'center');
    }
    if (e.state === 'stun') this.drawStunStars(X, top, t);
    if (def.boss || def.kingClone) return; // bosses get the big bar at the top (and a clone gives nothing away)
    const w = Math.max(10, e.r * 2 + 2);
    g.fillStyle = INK.ink; g.fillRect(X - w / 2, top - 4, w, 4);
    const twin = e.mirrorOf != null && sim.enemies.find(o => o.id === e.mirrorOf), hpk = twin ? twin.hp / twin.maxHp : e.hp / e.maxHp; // a decoy wears its maker's wounds
    if (hpk < 1) { g.fillStyle = INK.verm; g.fillRect(X - w / 2, top - 4, Math.round(w * hpk), 2); }
    else { g.fillStyle = '#5a2016'; g.fillRect(X - w / 2, top - 4, w, 2); }
    if (e.posture > 0) {
      g.fillStyle = e.state === 'stun' || (e.posture > e.postureMax * 0.75 && Math.floor(t * 8) % 2) ? '#fff3b0' : INK.gold;
      g.fillRect(X - w / 2, top - 2, Math.round(w * e.posture / e.postureMax), 1);
    }
  }

  // ---------- the newer foes: poses, living parts, conditions, zones and thrown things ----------

  // a pose for the wind-up and the swing, when the foe has one
  foePose(e, name, frame) {
    const has = n => (SPRITE_CACHE[n] ? n : null), a = e.atk;
    if (e.state === 'idle' && (e.mvx || e.mvy) && frame) return has(name + '_walk') || name;
    if (!a) return name;
    if (e.state === 'wind') return has(`${name}_w_${a.id}`) || has(name + '_wind') || name;
    if ((e.state === 'recover' && e.st > a.recover - 0.16) || (e.state === 'act' && a.kind !== 'climb')) return has(`${name}_a_${a.id}`) || has(name + '_atk') || name;
    return name;
  }

  pix(x, y, c) { this.g.fillStyle = c; this.g.fillRect(Math.round(x), Math.round(y), 1, 1); }

  // a crisp one-pixel line
  pline(x0, y0, x1, y1, c, thick) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    this.g.fillStyle = c;
    for (let i = 0; i <= n; i++) {
      const X = Math.round(x0 + (x1 - x0) * i / n), Y = Math.round(y0 + (y1 - y0) * i / n);
      this.g.fillRect(X, Y, thick ? 2 : 1, 1);
    }
  }

  spark(x, y, colors, vy = -25, life = 0.4, spread = 10) {
    this.parts.push({ kind: 'px', x: x + (Math.random() - .5) * spread, y: y + (Math.random() - .5) * spread * 0.6, vx: (Math.random() - .5) * 10, vy: vy - Math.random() * 15, life, max: life, color: colors[Math.floor(Math.random() * colors.length)] });
  }

  // Parts of a foe drawn live around its sprite: behind it ('pre') or over it ('post').
  drawFoeExtras(sim, e, pic, scale, lift, flip, jx, phase) {
    const g = this.g, t = sim.t, s = SPRITE_CACHE[pic], w = Math.round(s.w * scale), h = Math.round(s.h * scale);
    const x0 = Math.round(sx(e.x + jx) - w / 2), y0 = Math.round(sy(e.y) - h + 1 - lift), X = Math.round(sx(e.x + jx)), base = Math.round(sy(e.y));
    const F = flip ? -1 : 1, at = (fx, fy) => [flip ? x0 + w - 1 - fx * scale : x0 + fx * scale, y0 + fy * scale], r = Math.random;
    const type = e.type, def = e.def;
    if (phase === 'pre') {
      if (e.armorT > 0) { g.globalAlpha = 0.45 + 0.25 * Math.sin(t * 16); this.ellipse(e.x, e.y, e.r + 4, '#ff3a1a', true); g.globalAlpha = 1; }
      if (e.form && SHIFT_FORMS[e.form]) { g.globalAlpha = 0.3 + 0.15 * Math.sin(t * 7); this.ellipse(e.x, e.y, e.r + 4, SHIFT_FORMS[e.form].color, true); g.globalAlpha = 1; }
      if (def.phoenix && e.state !== 'egg') { // a heat haze that widens as it burns hotter
        const k = (e.heat || 0) / 100, c = ['#ff7a1a', '#6fc3ff', '#ffffff'][Math.min(2, e.rebirths || 0)];
        g.globalAlpha = 0.2 + k * 0.35; this.ellipse(e.x, e.y, e.r + 3 + k * 10 + Math.sin(t * 9), c, true, k > 0.9 ? 0.25 : 0); g.globalAlpha = 1;
      }
      if (type === 'spider') this.drawSpiderLegs(e, X, base, lift, t, F);
      if (def.sprite === 'kitsune') this.drawTails(at, t, F, e.state === 'wind');
      if (e.heads) this.drawHeads(e, at, t, F, 'necks');
      if (def.manual) this.drawImmortalBack(sim, e, X, y0, F, t);
      return;
    }
    if (e.heads) this.drawHeads(e, at, t, F, 'heads');
    if (e.adapt) this.drawWheel(e, X, y0, t);
    if (type === 'blind') { // pink petals around him, more as his mind clears
      if (r() < 0.15 + (e.focus || 0) * 0.02) this.parts.push({ kind: 'px', x: X + (r() - .5) * 20, y: y0 - 4, vx: -6 + r() * 4, vy: 10, g: 2, life: 1, max: 1, color: r() < 0.6 ? '#ff9ad8' : '#ffd8ec' });
      if (e.focus >= 10) { g.globalAlpha = 0.2 + e.focus / 100; this.ellipse(e.x, e.y, e.r + 4, '#ffb7d5', true); g.globalAlpha = 1; }
    }
    if (type === 'wukong') {
      if (e.giant) { // golden light pouring off the giant
        if (r() < 0.6) this.spark(X, y0 + 10, ['#ffd84a', '#ff7a1a', '#ffffff'], -30, 0.5, 30);
      } else if (r() < 0.25) this.parts.push({ kind: 'px', x: X + (r() - .5) * 12, y: Math.round(sy(e.y)), vx: (r() - .5) * 8, vy: -2, life: 0.5, max: 0.5, color: r() < 0.5 ? '#ffffff' : '#ffe9a8' });
    }
    if (def.scholar) this.drawScholar(sim, e, at, X, y0, w, h, F, t);
    if (def.manual) this.drawImmortalFront(sim, e, X, y0, base, lift, F, t); // his flying sword, his ribbons, his Sword Intent
    if (e.spinGuardT > 0) { // the staff spun into a golden wheel in front of him
      const cy = y0 + Math.round(h * 0.45), L = e.giant ? 20 : 11;
      for (let k = 0; k < 3; k++) { // a blur of the last few turns
        const a = t * 26 - k * 0.5;
        g.globalAlpha = k ? 0.35 / k : 1;
        this.pline(X - Math.cos(a) * L, cy - Math.sin(a) * L * 0.5, X + Math.cos(a) * L, cy + Math.sin(a) * L * 0.5, '#ffd84a', !k);
        if (!k) { this.pix(X - Math.cos(a) * L, cy - Math.sin(a) * L * 0.5, '#c23b22'); this.pix(X + Math.cos(a) * L, cy + Math.sin(a) * L * 0.5, '#c23b22'); }
      }
      g.globalAlpha = 0.25; this.ellipse(e.x, e.y, L * 0.9, '#ffd84a', true); g.globalAlpha = 1;
    }
    if (type === 'zergqueen' && e.broodSpent) { // the swarm holding her up
      for (const m of sim.enemies) if (m.summoner === e.id && !m.dead) { g.globalAlpha = 0.4 + 0.3 * Math.sin(t * 8 + m.id); this.pline(X, y0 + 8, sx(m.x), sy(m.y) - 4, '#b84aff'); g.globalAlpha = 1; }
      g.globalAlpha = 0.5 + 0.3 * Math.sin(t * 6); this.ellipse(e.x, e.y, e.r + 4, '#b84aff', true); g.globalAlpha = 1;
    }
    if (type === 'zergqueen' && r() < 0.2) this.parts.push({ kind: 'px', x: X + (r() - .5) * 14, y: y0 + 8, vx: 0, vy: 8, g: 60, life: 0.6, max: 0.6, color: '#9ad04a' });
    if (e.state === 'egg') { // the egg: glowing, cracking, a countdown to hatching
      const k = 1 - e.eggT / 4, c = ['#ff7a1a', '#6fc3ff', '#ffffff'][Math.min(2, e.rebirths || 0)];
      g.globalAlpha = 0.3 + 0.3 * Math.sin(t * (8 + k * 30)); this.ellipse(e.x, e.y, 6 + k * 4, c, true); g.globalAlpha = 1;
      for (let i = 0; i < Math.floor(k * 5); i++) { const [cx, cy] = at(2 + (i * 3) % 4, 2 + i); this.pline(cx, cy, cx + (i % 2 ? 1 : -1), cy + 1, '#141414'); }
      if (r() < 0.5 + k) this.spark(X, y0 + 2, [c, '#ffe14d'], -30, 0.4, 8);
      for (let i = 0; i < 12; i++) if (i / 12 < 1 - k) this.pix(X + Math.round(Math.cos(i / 12 * 6.28 - 1.57) * 7), y0 - 3 + Math.round(Math.sin(i / 12 * 6.28 - 1.57) * 3), '#ffe14d');
      return;
    }
    if (def.phoenix) { // flames streaming off the wings and the tail
      const c = [['#ff7a1a', '#ffd84a', '#ff3a1a'], ['#6fc3ff', '#9fc8e8', '#ffffff'], ['#ffffff', '#ffd84a', '#fff6c8']][Math.min(2, e.rebirths || 0)];
      for (const [fx, fy] of [[0, 0], [15, 0], [4, 11], [11, 11]]) if (r() < 0.45 + (e.heat || 0) / 200) { const [px, py] = at(fx, fy); this.spark(px, py, c, -30, 0.35, 4); }
    }
    if (type === 'oni' && e.armorT > 0) { // red steam and burning eyes
      if (r() < 0.8) this.spark(X, y0 + 6, ['#ff3a1a', '#ff8a5a', '#5a1010'], -35, 0.5, 14);
      if (pic === 'oni' || pic === 'oni_atk') for (const fx of [4, 5, 7, 8]) { const [px, py] = at(fx, 3); this.pix(px, py, Math.floor(t * 12) % 2 ? '#ffffff' : '#ffe14d'); }
    }
    if (e.mutations) this.drawMutations(e, at, t, F, base);
    if (type === 'golem' && e.stone > 0) { // stone plates settling over it, layer by layer
      const spots = [[1, 5], [11, 5], [4, 0], [8, 0], [5, 9]];
      for (let i = 0; i < e.stone; i++) {
        const [px, py] = at(spots[i][0], spots[i][1]);
        g.fillStyle = '#5a5f66'; g.fillRect(px - 1, py, 4, 3); g.fillStyle = '#c8c0ae'; g.fillRect(px, py, 2, 1);
      }
      if (e.stone >= 5) { const [px, py] = at(6, 6); g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 6); g.fillStyle = '#7fe0ff'; g.fillRect(px, py, 2, 1); g.globalAlpha = 1; if (r() < 0.2) this.spark(X, base - 2, ['#8a8f9c', '#a8a294'], -8, 0.5, 18); }
    }
    if (type === 'boxer' && e.momentum > 0) { // gloves heating up with every landed punch
      const k = e.momentum / 10;
      if (r() < k) this.spark(X + F * 3, y0 + 5, ['#ff8a3a', '#ffe14d', '#ffffff'], -20, 0.3, 8);
      if (e.momentum >= 5) { g.globalAlpha = 0.25 + 0.2 * Math.sin(t * 14); this.ellipse(e.x, e.y, e.r + 2 + k * 3, '#ff8a3a', true); g.globalAlpha = 1; }
    }
    if (type === 'boxer' && e.state === 'roll' && r() < 0.6) this.parts.push({ kind: 'ghost', name: pic, x: e.x, y: e.y, flip, scale, life: 0.2, max: 0.2 }); // slipping the punch
    if (type === 'reaper' && r() < 0.25) { const a = t * 3 + r() * 6; this.spark(X + Math.cos(a) * 7, y0 + 5 + Math.sin(a) * 3, ['#5dff9a', '#c9ffd8'], -12, 0.6, 2); }
    if (type === 'crab' && r() < 0.06) { const [px, py] = at(9, 3); this.parts.push({ kind: 'px', x: px, y: py, vx: F * 6, vy: -14, life: 0.7, max: 0.7, color: '#bfe8ff' }); }
    if (e.form === 'tiger' && r() < 0.4) this.spark(X, y0 + 4, ['#6fc3ff', '#ffffff'], -10, 0.15, 14);
    if (e.form === 'bear' && Math.floor(t * 3 + e.id) % 5 === 0) { const [px, py] = at(3 + Math.floor(t * 20) % 6, 3); this.pix(px, py, '#ffffff'); }
    if (e.form === 'serpent' && r() < 0.2) { const [px, py] = at(14, 3); this.parts.push({ kind: 'px', x: px, y: py, vx: 0, vy: 10, g: 80, life: 0.5, max: 0.5, color: '#9ad04a' }); }
    if (e.form === 'roc' && r() < 0.3) this.parts.push({ kind: 'line', x0: X - 8, y0: y0 + 3 + r() * 6, x1: X - 14, y1: y0 + 3 + r() * 6, life: 0.15, max: 0.15, color: '#e8f0f8' });
    if (e.form === 'drake' && r() < 0.5) this.spark(X, y0 + 6, ['#ff5a1a', '#ffb04a', '#ffe14d'], -25, 0.4, 12);
    if (type === 'magician' && def.sprite !== 'kitsune' && Math.floor(t * 3 + e.id) % 4 === 0) { const [px, py] = at(8, 6); this.pix(px, py - 1, '#ffffff'); this.pix(px - 1, py, '#ffd84a'); this.pix(px + 1, py, '#ffd84a'); }
    if (def.sprite === 'kitsune') for (let i = 0; i < 2; i++) { // foxfire circling her
      const a = t * 3 + i * Math.PI, fx = X + Math.cos(a) * 9, fy = y0 + 4 + Math.sin(a) * 3;
      this.pix(fx, fy, '#7fd0ff'); this.pix(fx, fy - 1, Math.floor(t * 12 + i) % 2 ? '#ffffff' : '#bfe0ff');
    }
    if (type === 'alchemist' && r() < 0.2) { const [px, py] = at(9, 6); this.parts.push({ kind: 'px', x: px, y: py, vx: 0, vy: -10, life: 0.5, max: 0.5, color: ['#5fe8c8', '#c050ff', '#9ad04a'][Math.floor(r() * 3)] }); }
    if (type === 'gravmage') { // stones held in orbit, and space sagging under it
      for (let i = 0; i < 3; i++) {
        const a = t * 1.8 + i * 2.09, fx = X + Math.cos(a) * 10, fy = y0 + 6 + Math.sin(a) * 4;
        g.fillStyle = Math.sin(a) > 0 ? '#867b69' : '#5a5f66'; g.fillRect(Math.round(fx), Math.round(fy), 2, 2);
      }
      if (r() < 0.3) this.parts.push({ kind: 'px', x: X + (r() - .5) * 8, y: base - 2, vx: 0, vy: 14, life: 0.3, max: 0.3, color: '#7a4ad0' });
    }
    if (type === 'formation') for (let i = 0; i < 4; i++) { // trigram plates turning around it
      const a = -t * 1.2 + i * Math.PI / 2, fx = Math.round(X + Math.cos(a) * 9), fy = Math.round(y0 + 6 + Math.sin(a) * 3);
      g.fillStyle = '#e8c34a'; g.fillRect(fx - 1, fy - 1, 3, 3); g.fillStyle = '#141414'; g.fillRect(fx - 1, fy, 3, 1); if (i % 2) g.fillRect(fx, fy - 1, 1, 1);
    }
    if (type === 'archer' && e.state === 'wind' && e.atk && e.atk.id === 'powershot') { const [px, py] = at(12, 4); g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 30); this.ellipse(e.x + F * 6, e.y, 2, '#ffe14d'); g.globalAlpha = 1; this.pix(px, py, '#ffffff'); }
    if (type === 'spider' && r() < 0.08) { const [px, py] = at(13, 4); this.parts.push({ kind: 'px', x: px, y: py, vx: 0, vy: 8, g: 60, life: 0.6, max: 0.6, color: '#9ad04a' }); }
  }

  // eight legs, stepping in turn
  drawSpiderLegs(e, X, base, lift, t, F) {
    const moving = e.mvx || e.mvy || e.state === 'act', top = base - 5 - lift;
    for (let side = 0; side < 2; side++) for (let i = 0; i < 4; i++) {
      const ph = t * 16 + i * 1.6 + side * 0.8, step = moving ? Math.sin(ph) * 2 : 0, up = moving ? Math.max(0, Math.cos(ph)) * 2 : 0;
      const ax = X + (i - 1.5) * 2.5, kx = X + (i - 1.5) * 5.5 + step * 0.5, ky = top - 3 - (side ? 0 : 1), fx = X + (i - 1.5) * 7 + step, fy = base - up - (side ? 1 : 0);
      const c = side ? '#2a1830' : '#5a2a40';
      this.pline(ax, top, kx, ky, c); this.pline(kx, ky, fx, fy, c);
    }
  }

  // nine tails, fanning out behind
  drawTails(at, t, F, winding) {
    const [ox, oy] = at(2, 4);
    for (let i = 0; i < 9; i++) {
      const spread = winding ? 0.22 : 0.15, a = -Math.PI / 2 - F * (0.35 + i * spread) + Math.sin(t * 3 + i * 0.7) * 0.12, L = 7 + (i % 3);
      let x = ox, y = oy;
      for (let k = 0; k < L; k++) {
        const bend = a + Math.sin(t * 4 + i + k * 0.4) * 0.15;
        x += Math.cos(bend); y += Math.sin(bend) * 0.8;
        this.pix(x, y, k >= L - 2 ? (Math.floor(t * 10 + i) % 3 ? '#ff9ad8' : '#7fd0ff') : '#ece4d2');
      }
    }
  }

  // The Hydra: a neck and a head for each one it has, stumps where one was cut, buds where two are growing back.
  drawHeads(e, at, t, F, part) {
    const H = e.heads, n = H.length, c = (n - 1) / 2;
    H.forEach((h, i) => {
      const off = i - c, [bx, by] = at(12 + Math.round(off * 0.6), 1);
      const rear = h.wind > 0 ? 1 - h.wind / 0.5 : 0;
      let L = h.alive ? 10 - rear * 3 : h.grow > 0 ? 3 + Math.max(0, 1 - h.grow / 5) * 7 : 0;
      if (!L) return;
      const ang = -1.15 + off * 0.32 + Math.sin(t * 2.5 + i * 1.3) * 0.08;
      const hx = bx + F * Math.cos(ang) * L, hy = by + Math.sin(ang) * L * 0.9;
      if (part === 'necks') {
        const mx = (bx + hx) / 2 - F * 2, my = (by + hy) / 2 + 2;
        for (let k = 0; k <= 8; k++) {
          const u = k / 8, x = (1 - u) * (1 - u) * bx + 2 * u * (1 - u) * mx + u * u * hx, y = (1 - u) * (1 - u) * by + 2 * u * (1 - u) * my + u * u * hy;
          this.pix(x, y, '#2f7f6f'); this.pix(x + 1, y, k % 2 ? '#7da36a' : '#2f7f6f');
        }
        return;
      }
      if (!h.alive) { // a bleeding stump, or a bud growing back
        if (h.grow > 1.5) { this.pix(hx, hy, '#c23b22'); if (Math.random() < 0.2) this.parts.push({ kind: 'px', x: hx, y: hy, vx: 0, vy: 8, g: 90, life: 0.4, max: 0.4, color: '#c23b22' }); }
        else { this.pix(hx, hy, '#7da36a'); this.pix(hx + F, hy, '#2f7f6f'); }
        return;
      }
      const flash = h.wind > 0 && Math.floor(t * 24) % 2, body = flash ? '#ffffff' : '#2f7f6f', X = Math.round(hx), Y = Math.round(hy);
      this.g.fillStyle = body; this.g.fillRect(X - 1, Y - 1, 3, 2); this.g.fillRect(X + F * 2, Y, 1, 1);
      this.pix(X + F, Y - 1, h.act === 'flame' || h.kind === 'flame' ? '#ffb04a' : '#ffe14d'); // the eye
      if (h.wind > 0) this.pix(X + F * 2, Y + 1, '#ece4d2'); // jaws open
      if (h.kind === 'spit' && Math.random() < 0.08) this.parts.push({ kind: 'px', x: X + F * 2, y: Y + 1, vx: 0, vy: 10, g: 80, life: 0.4, max: 0.4, color: '#9ad04a' });
      if (h.kind === 'flame' && Math.random() < 0.15) this.spark(X + F * 2, Y, ['#ff5a1a', '#ffb04a'], -15, 0.25, 1);
    });
  }

  // the Mutant's growths, each its own shape
  drawMutations(e, at, t, F, base) {
    const g = this.g, M = e.mutations, wob = Math.sin(t * 5 + e.id);
    if (M.includes('carapace')) for (const [fx, fy] of [[1, 5], [2, 6], [1, 7], [3, 5]]) { const [x, y] = at(fx, fy); this.pix(x, y, '#5a5f66'); }
    if (M.includes('spikes')) for (const [fx, fy] of [[3, 0], [5, -1], [7, -1], [1, 4], [0, 6]]) { const [x, y] = at(fx, fy); this.pix(x, y, '#ece4d2'); this.pix(x, y - 1, '#bfb6a2'); }
    if (M.includes('sac')) { const [x, y] = at(1, 3), k = 1 + Math.round(Math.sin(t * 4) * 0.5 + 0.5); g.fillStyle = '#9ad04a'; g.fillRect(x - k, y - k, 2 + k, 2 + k); this.pix(x, y - 1, '#e8ffb0'); }
    if (M.includes('arm')) { const [x, y] = at(0, 6); this.pline(x, y, x - F * 2, y + 3 + wob, '#c86b8a'); this.pix(x - F * 2, y + 4 + wob, '#ece4d2'); }
    if (M.includes('tentacle')) {
      let [x, y] = at(10, 6);
      for (let k = 0; k < 8; k++) { x += F; y += Math.sin(t * 6 + k * 0.8) * 0.8 + 0.2; this.pix(x, y, k > 5 ? '#ff9ad8' : k % 2 ? '#7a3a5a' : '#c86b8a'); }
    }
    if (M.includes('maw')) { const [x, y] = at(5, 7), open = Math.floor(t * 4) % 2; g.fillStyle = '#ff2a3a'; g.fillRect(x, y, 2, 1 + open); this.pix(x, y, '#ece4d2'); }
    if (M.includes('legs')) for (const fx of [4, 8]) { const [x, y] = at(fx, 10); this.pline(x, y, x + Math.sin(t * 12 + fx) * 1.5, base, '#7a3a5a'); }
    if (M.includes('acid') && Math.random() < 0.15) { const [x, y] = at(4 + Math.floor(Math.random() * 5), 6); this.parts.push({ kind: 'px', x, y, vx: 0, vy: 6, g: 80, life: 0.6, max: 0.6, color: '#9ad04a' }); }
  }

  // The Spider Demon under the lip of the stage: only its claws and eyes show.
  drawClimbing(sim, e) {
    const t = sim.t, a = Math.atan2(e.y, e.x), X = Math.round(sx(Math.cos(a) * R)), Y = Math.round(sy(Math.sin(a) * R));
    const front = Math.sin(a) > 0, y = front ? Y + 3 : Y;
    for (let i = -2; i <= 2; i++) if (i) { const k = Math.sin(t * 18 + i) > 0 ? 1 : 0; this.pline(X + i * 3, y - 1 - k, X + i * 3 + (i > 0 ? 1 : -1), y + 1, '#2a1830'); }
    if (front) { this.pix(X - 1, y + 2, '#ff2a3a'); this.pix(X + 1, y + 2, '#ff2a3a'); }
    if (Math.random() < 0.3) this.parts.push({ kind: 'px', x: X + (Math.random() - .5) * 8, y, vx: 0, vy: 10, g: 60, life: 0.4, max: 0.4, color: '#7a705f' });
  }

  // conditions anyone can carry: poison, slows, charm, cocoons, levitation, webs, a barrier array's cover
  drawStatus(sim, f, lift) {
    const g = this.g, t = sim.t, X = Math.round(sx(f.x)), Y = Math.round(sy(f.y)), r = Math.random;
    const hgt = f.isPlayer ? 11 : Math.round((SPRITE_CACHE[spriteFor(f)] || { h: 10 }).h * ((f.def && f.def.scale) || 1)), top = Y - hgt - lift;
    if (f.poisonT > 0 && r() < 0.3) this.parts.push({ kind: 'px', x: X + (r() - .5) * 8, y: Y - r() * hgt - lift, vx: 0, vy: -10, life: 0.5, max: 0.5, color: r() < 0.5 ? '#9ad04a' : '#5a8a2a' });
    if (f.slowT > 0 && r() < 0.15) this.parts.push({ kind: 'px', x: X + (r() - .5) * 10, y: top, vx: 0, vy: 12, life: 0.6, max: 0.6, color: '#bfe8ff' });
    if (f.corrodeT > 0 && r() < 0.2) this.parts.push({ kind: 'px', x: X + (r() - .5) * 8, y: Y - hgt * 0.6 - lift, vx: 0, vy: 10, g: 60, life: 0.5, max: 0.5, color: '#c8e04a' });
    if (f.charmT > 0) { const hy = top - 4 + Math.round(Math.sin(t * 6)); g.fillStyle = '#ff9ad8'; g.fillRect(X - 2, hy, 2, 1); g.fillRect(X + 1, hy, 2, 1); g.fillRect(X - 2, hy + 1, 5, 1); g.fillRect(X - 1, hy + 2, 3, 1); this.pix(X, hy + 3, '#ff9ad8'); }
    if (f.gravT > 0) for (let i = -1; i <= 1; i++) this.pix(X + i * 4, top - 2 + ((Math.floor(t * 20) + i) % 4), '#7a4ad0');
    if (f.wardedT > 0) { g.globalAlpha = 0.5; this.ellipse(f.x, f.y, f.r + 3, '#e8c34a', true); g.globalAlpha = 1; }
    if (f.inkBound) for (let i = 0; i < 3; i++) { g.fillStyle = '#141414'; g.fillRect(X - 4, Y - 2 - i * Math.max(2, Math.round(hgt / 3)) - lift, 9, 1); if (r() < 0.04) this.parts.push({ kind: 'px', x: X + (r() - .5) * 8, y: Y - r() * hgt - lift, vx: 0, vy: 8, life: 0.5, max: 0.5, color: '#141414' }); } // bound in ink by the scripture
    if (f.webT > 0) for (let i = -2; i <= 2; i++) this.pline(X + i * 2, Y - 1, X + i * 3, Y - 5 - (i & 1) * 2, 'rgba(236,228,210,0.7)');
    if (f.liftT > 0) { this.ellipse(f.x, f.y, 5 + Math.sin(t * 12), '#c9a0ff', true); if (r() < 0.5) this.parts.push({ kind: 'px', x: X + (r() - .5) * 8, y: Y, vx: 0, vy: -30, life: 0.4, max: 0.4, color: '#c9a0ff' }); }
    if (f.cocoonT > 0) { // wrapped in silk
      for (let y = top + 1; y <= Y; y++) {
        const k = (y - top) / (Y - top + 1), half = Math.round(Math.sin(k * Math.PI) * 4) + 1;
        g.fillStyle = (y + Math.floor(t * 4)) % 3 ? '#ece4d2' : '#bfb6a2'; g.fillRect(X - half, y, half * 2 + 1, 1);
      }
      this.pline(X - 3, top + 3, X + 3, top + 6, '#8a8f9c'); this.pline(X - 3, top + 7, X + 3, top + 4, '#8a8f9c');
    }
    if (f.kingWeakened) { g.globalAlpha = 0.5; this.ellipse(f.x, f.y, f.r + 2, '#fff23c', true); g.globalAlpha = 1; if (r() < 0.1) this.parts.push({ kind: 'px', x: X, y: top + 2, vx: 0, vy: 6, life: 0.6, max: 0.6, color: '#c5a82b' }); }
    if (f.isPlayer && f.armorT > 0) { g.globalAlpha = 0.4 + 0.2 * Math.sin(t * 16); this.ellipse(f.x, f.y, 7, '#ff3a1a', true); g.globalAlpha = 1; }
  }

  // Lingering zones on the floor.
  drawZone(h, t) {
    const g = this.g, k = Math.min(1, h.life / Math.min(1, h.max), (h.max - h.life) / 0.25 + 0.2), X = Math.round(sx(h.x)), Y = Math.round(sy(h.y)), r = Math.random;
    g.globalAlpha = Math.max(0, Math.min(1, k));
    switch (h.variant) {
      case 'web': // a sticky web: spokes and rings
        for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; this.pline(X, Y, X + Math.cos(a) * h.r, Y + Math.sin(a) * h.r * SQ, '#d8d0c0'); }
        for (const rr of [0.35, 0.65, 0.95]) this.ellipse(h.x, h.y, h.r * rr, '#ece4d2', true);
        break;
      case 'poison': case 'acid': {
        const c = h.variant === 'acid' ? ['#c8e04a', '#7a9a2a'] : ['#9ad04a', '#4b7a2a'];
        this.ellipse(h.x, h.y, h.r, c[1], false, 0.35); this.ellipse(h.x, h.y, h.r, c[0], true);
        if (r() < 0.5) this.parts.push({ kind: 'px', x: X + (r() - .5) * h.r * 2, y: Y + (r() - .5) * h.r, vx: 0, vy: -8, life: 0.8, max: 0.8, color: c[r() < 0.5 ? 0 : 1] });
        break;
      }
      case 'fire':
        this.ellipse(h.x, h.y, h.r, '#5a1a0a', false, 0.4);
        for (let i = 0; i < 6; i++) {
          const fx = Math.round(sx(h.x + Math.sin(t * 7 + i * 2.3) * h.r * 0.7)), fy = Math.round(sy(h.y + Math.cos(t * 5 + i * 1.7) * h.r * 0.5)), fh = 2 + ((Math.floor(t * 14) + i) % 3);
          g.fillStyle = i % 2 ? '#ff5a1a' : '#ffb04a'; g.fillRect(fx, fy - fh, 1, fh); this.pix(fx, fy - fh - 1, '#ffe14d');
        }
        break;
      case 'frost':
        this.ellipse(h.x, h.y, h.r, '#9fc8e8', false, 0.35);
        for (let i = 0; i < 7; i++) { const a = i * 0.9, fx = X + Math.cos(a) * h.r * 0.6, fy = Y + Math.sin(a) * h.r * 0.35; this.pix(fx, fy - 1, '#ffffff'); this.pix(fx, fy, '#bfe8ff'); }
        break;
      case 'rubble':
        for (let i = 0; i < 9; i++) { const a = i * 2.4, rr = (i % 3 + 1) / 3 * h.r, fx = Math.round(X + Math.cos(a) * rr), fy = Math.round(Y + Math.sin(a) * rr * SQ); g.fillStyle = i % 2 ? '#867b69' : '#5a5f66'; g.fillRect(fx, fy - 1, 2, 2); }
        break;
      case 'heavy': // the floor sagging under crushing gravity
        this.ellipse(h.x, h.y, h.r, '#2a1f48', false, 0.35);
        for (let ring = 0; ring < 3; ring++) this.ellipse(h.x, h.y, h.r * (1 - ((t * 0.8 + ring / 3) % 1)), ring === 1 ? '#c9a0ff' : '#7a4ad0', true);
        for (let i = 0; i < 5; i++) { const fx = X + Math.round(Math.cos(i * 1.3) * h.r * 0.7), fy = Y - 14 + ((Math.floor(t * 40) + i * 5) % 14); this.pline(fx, fy, fx, fy + 2, '#c9a0ff'); }
        break;
      case 'creep': // living purple ground, veined and pulsing
        this.ellipse(h.x, h.y, h.r, '#3a1a4a', false, 0.5);
        this.ellipse(h.x, h.y, h.r, '#5a2a7a', true);
        for (let i = 0; i < 7; i++) { const a = i * 0.9 + Math.sin(t + i) * 0.1, rr = h.r * (0.4 + (i % 3) * 0.2); this.pline(X, Y, X + Math.cos(a) * rr, Y + Math.sin(a) * rr * SQ, Math.floor(t * 3 + i) % 4 ? '#5a2a7a' : '#b84aff'); }
        break;
      case 'wardarray': { // a golden hexagonal barrier with a talisman at each corner
        const pts = Array.from({ length: 6 }, (_, i) => { const a = i / 6 * Math.PI * 2 + t * 0.4; return [X + Math.cos(a) * h.r, Y + Math.sin(a) * h.r * SQ]; });
        g.globalAlpha *= 0.6 + 0.3 * Math.sin(t * 5);
        pts.forEach((p, i) => { const q = pts[(i + 1) % 6]; this.pline(p[0], p[1], q[0], q[1], '#e8c34a'); this.pline(p[0], p[1] - 6, q[0], q[1] - 6, 'rgba(255,243,176,0.5)'); });
        g.globalAlpha = Math.max(0, Math.min(1, k));
        for (const [px, py] of pts) { g.fillStyle = '#e8c34a'; g.fillRect(Math.round(px) - 1, Math.round(py) - 9, 2, 4); this.pix(px, py - 8, '#c23b22'); }
        break;
      }
    }
    g.globalAlpha = 1;
  }

  // The Eight Trigrams: eight nodes, filling as it charges, with one life gate left open.
  drawBagua(h, t) {
    const g = this.g, k = 1 - h.t / h.delay, X = Math.round(sx(h.x)), Y = Math.round(sy(h.y));
    const pts = Array.from({ length: 8 }, (_, i) => { const a = h.gate + i / 8 * Math.PI * 2; return [X + Math.cos(a) * h.r, Y + Math.sin(a) * h.r * SQ, a]; });
    pts.forEach((p, i) => { const q = pts[(i + 1) % 8]; this.pline(p[0], p[1], q[0], q[1], i === 0 || i === 7 ? '#4f9a3a' : k > 0.7 && Math.floor(t * 16) % 2 ? '#ffffff' : '#e8c34a'); });
    this.ellipse(h.x, h.y, h.r * 0.95, '#c23b22', false, 0.15 + k * 0.35);
    pts.forEach(([px, py], i) => { // a trigram at every node
      for (let l = 0; l < 3; l++) { const broken = (i >> l) & 1; g.fillStyle = '#141414'; g.fillRect(Math.round(px) - 1, Math.round(py) - 2 + l, broken ? 1 : 3, 1); if (broken) g.fillRect(Math.round(px) + 1, Math.round(py) - 2 + l, 1, 1); }
    });
    // the life gate: a safe sector, glowing green
    const ga = h.gate, gx = X + Math.cos(ga) * h.r * 0.7, gy = Y + Math.sin(ga) * h.r * 0.7 * SQ;
    g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 10); this.ellipse(h.x + Math.cos(ga) * h.r * 0.7, h.y + Math.sin(ga) * h.r * 0.7, 5, '#9fd36a', false, 0.5); this.pix(gx, gy - 1, '#ffffff'); g.globalAlpha = 1;
    // the yin-yang at the heart, spinning faster as it fills
    const a = t * (2 + k * 14);
    for (let i = 0; i < 10; i++) { const b = a + i / 10 * Math.PI * 2; this.pix(X + Math.cos(b) * 4, Y + Math.sin(b) * 4 * SQ, i < 5 ? '#ece4d2' : '#141414'); }
    this.pix(X + Math.cos(a) * 2, Y + Math.sin(a) * 2 * SQ, '#ece4d2'); this.pix(X - Math.cos(a) * 2, Y - Math.sin(a) * 2 * SQ, '#141414');
  }

  // the swapping formation: two marked circles, linked
  drawSwap(h, t) {
    const k = 1 - h.t / h.delay, c = Math.floor(t * 14) % 2 ? '#c9a0ff' : '#e8c34a';
    this.ellipse(h.x, h.y, h.r * (1.4 - k * 0.4), c, true); this.ellipse(h.ax, h.ay, h.r * (1.4 - k * 0.4), c, true);
    const a = h.a;
    if (a && !a.dead) { this.g.globalAlpha = 0.3 + k * 0.5; this.pline(sx(a.x), sy(a.y) - 5, sx(h.x), sy(h.y) - 5, '#c9a0ff'); this.g.globalAlpha = 1; }
  }

  // Something thrown in an arc: where it will land, its shadow, and the thing itself up in the air.
  drawLob(pr, t) {
    const g = this.g, k = Math.min(1, pr.arcT / pr.arcDur), L = pr.land || {}, r = L.r || (L.zone ? L.zone.r * 0.7 : 6);
    this.ellipse(pr.tx, pr.ty, r, k > 0.75 && Math.floor(t * 18) % 2 ? '#ffffff' : pr.owner === 'player' ? INK.gold : '#ff5a3c', true);
    this.ellipse(pr.tx, pr.ty, r * k, pr.owner === 'player' ? INK.gold : '#ff5a3c', false, 0.25);
    g.fillStyle = 'rgba(20,20,20,0.4)'; g.fillRect(Math.round(sx(pr.x)) - 1, Math.round(sy(pr.y)), 3, 1);
    const X = Math.round(sx(pr.x)), Y = Math.round(sy(pr.y)) - 3 - Math.round(pr.z), spin = Math.floor(t * 12 + pr.x) % 4;
    switch (pr.kind) {
      case 'boulder':
        g.fillStyle = '#5a5f66'; g.fillRect(X - 2, Y - 2, 5, 4); g.fillStyle = '#a8a294'; g.fillRect(X - 1, Y - 2, 3, 2); this.pix(X + (spin % 2 ? 1 : -1), Y, '#141414');
        if (Math.random() < 0.3) this.parts.push({ kind: 'px', x: X, y: Y, vx: 0, vy: 5, life: 0.3, max: 0.3, color: '#867b69' });
        break;
      case 'flask': {
        const c = { fire: '#ff5a1a', venom: '#9ad04a', frost: '#9fd8ff', acid: '#c8e04a', blast: '#c050ff' }[pr.flask] || '#5fe8c8';
        g.fillStyle = c; g.fillRect(X - 1, Y - 1, 3, 3); this.pix(X, Y - 2, '#ece4d2'); this.pix(X - 1, Y - 1, '#ffffff');
        if (Math.random() < 0.6) this.parts.push({ kind: 'px', x: X, y: Y, vx: 0, vy: 0, life: 0.25, max: 0.25, color: c });
        break;
      }
      case 'bile': g.fillStyle = '#9ad04a'; g.fillRect(X - 2, Y - 2, 4, 4); this.pix(X - 1, Y - 2, '#e8ffb0'); if (Math.random() < 0.5) this.parts.push({ kind: 'px', x: X, y: Y, vx: 0, vy: 0, life: 0.3, max: 0.3, color: '#b84aff' }); break;
      case 'webball': g.fillStyle = '#ece4d2'; g.fillRect(X - 1, Y - 1, 3, 3); this.pix(X + 1, Y + 1, '#bfb6a2'); break;
      case 'venomball': g.fillStyle = '#9ad04a'; g.fillRect(X - 1, Y - 1, 3, 3); this.pix(X, Y - 1, '#e8ffb0'); if (Math.random() < 0.5) this.parts.push({ kind: 'px', x: X, y: Y, vx: 0, vy: 0, life: 0.3, max: 0.3, color: '#4b7a2a' }); break;
      case 'magma': g.fillStyle = '#ff3a1a'; g.fillRect(X - 2, Y - 2, 4, 4); g.fillStyle = '#ffb04a'; g.fillRect(X - 1, Y - 1, 2, 2); this.spark(X, Y, ['#ff5a1a', '#ffe14d', '#5a1a0a'], 0, 0.3, 3); break;
      case 'arrowlob': { // pointing up on the way up, down on the way down
        const dy = k < 0.5 ? -1 : 1, dx = Math.sign(pr.tx - pr.x0) || 1;
        this.pline(X, Y, X - dx * 2, Y - dy * 2, '#9a7a55'); this.pix(X, Y, '#d8dde3'); this.pix(X - dx * 3, Y - dy * 3, '#ece4d2');
        break;
      }
      default: g.fillStyle = INK.rice; g.fillRect(X - 1, Y - 1, 3, 3);
    }
  }

  // Mahoraga's Dharma wheel: eight handles, a quarter turn for every adaptation.
  drawWheel(e, X, y0, t) {
    e.wheelDraw = (e.wheelDraw || 0) + ((e.wheel || 0) * Math.PI / 4 - (e.wheelDraw || 0)) * 0.12;
    const spinning = Math.abs((e.wheel || 0) * Math.PI / 4 - e.wheelDraw) > 0.05, cy = y0 - 6, R0 = 6;
    for (let i = 0; i < 8; i++) {
      const a = e.wheelDraw + i * Math.PI / 4, x1 = X + Math.cos(a) * R0, y1 = cy + Math.sin(a) * R0 * 0.55;
      this.pline(X, cy, x1, y1, spinning ? '#ffffff' : '#c9a65a');
      this.pix(X + Math.cos(a) * (R0 + 2), cy + Math.sin(a) * (R0 + 2) * 0.55, spinning ? '#ffffff' : '#e8c34a'); // the handles
    }
    this.pix(X, cy, '#ffd84a');
    if (spinning && Math.random() < 0.6) this.spark(X, cy, ['#ffd84a', '#ffffff'], -10, 0.3, 10);
  }

  // a long straight strike: a staff, a cut in space, a pillar, the sword of extermination
  drawBeam(h, t) {
    const k = 1 - h.t / h.delay, x0 = sx(h.x), y0 = sy(h.y) - 4, x1 = sx(h.x + Math.cos(h.a) * h.len), y1 = sy(h.y + Math.sin(h.a) * h.len) - 4;
    const nx = -Math.sin(h.a) * h.w / 2, ny = Math.cos(h.a) * h.w / 2 * SQ, g = this.g;
    const col = { ruyi: '#ffd84a', pillar: '#ffd84a', cut: '#ffffff', bigcut: '#ffb7d5', sever: '#ffffff', exterminate: '#ffd84a' }[h.variant] || '#ff5a3c';
    if (h.delay < 0.1) return; // too fast to telegraph
    if (h.variant === 'inkstroke') { // one stroke of a brush the size of the stage, laid down as you watch
      const u = Math.min(1, k * 1.4), ex = x0 + (x1 - x0) * u, ey = y0 + (y1 - y0) * u, th = Math.max(2, Math.round(h.w / 5));
      for (let o = -th; o <= th; o++) this.pline(x0 + nx * o / (h.w / 2) * th, y0 + ny * o / (h.w / 2) * th, ex + nx * o / (h.w / 2) * th * 0.7, ey + ny * o / (h.w / 2) * th * 0.7, Math.abs(o) === th ? '#3a3a40' : '#141414');
      if (Math.random() < 0.6) this.parts.push({ kind: 'px', x: ex, y: ey, vx: (Math.random() - .5) * 30, vy: (Math.random() - .5) * 20, life: 0.4, max: 0.4, color: '#141414' });
      g.globalAlpha = 0.3 + k * 0.4; for (let i = 0; i <= 24; i += 2) { const v = i / 24; this.pix(x0 + (x1 - x0) * v + nx * 1.6, y0 + (y1 - y0) * v + ny * 1.6, '#c23b22'); this.pix(x0 + (x1 - x0) * v - nx * 1.6, y0 + (y1 - y0) * v - ny * 1.6, '#c23b22'); } g.globalAlpha = 1;
      return;
    }
    if (h.variant === 'dragonstrike') { // the serpent's shadow sweeping down across the stage
      g.globalAlpha = 0.25 + k * 0.5; g.fillStyle = '#000000';
      g.beginPath(); g.moveTo(x0 + nx, y0 + ny); g.lineTo(x1 + nx, y1 + ny); g.lineTo(x1 - nx, y1 - ny); g.lineTo(x0 - nx, y0 - ny); g.fill(); g.globalAlpha = 1;
      if (k > 0.7 && Math.floor(t * 20) % 2) this.pline(x0, y0, x1, y1, '#ff2a2a');
      return;
    }
    g.globalAlpha = 0.35 + k * 0.5;
    for (let i = 0; i <= 24; i++) { if ((i + Math.floor(t * 30)) % 2) continue; const u = i / 24; this.pix(x0 + (x1 - x0) * u + nx, y0 + (y1 - y0) * u + ny, col); this.pix(x0 + (x1 - x0) * u - nx, y0 + (y1 - y0) * u - ny, col); }
    g.globalAlpha = 1;
    if (h.variant === 'pillar') { // a staff as long as the stage, lowering out of the sky onto the line
      const up = Math.round((1 - k) * (1 - k) * 70);
      for (let o = -1; o <= 1; o++) this.pline(x0, y0 - up + o, x1, y1 - up + o, o ? '#c9a65a' : '#ffd84a');
      g.fillStyle = '#c23b22'; g.fillRect(Math.round(x0) - 2, Math.round(y0) - up - 2, 4, 5); g.fillRect(Math.round(x1) - 2, Math.round(y1) - up - 2, 4, 5);
      g.globalAlpha = 0.3 + k * 0.4; this.pline(x0, y0 + 2, x1, y1 + 2, '#141414'); g.globalAlpha = 1; // its shadow on the stage
    } else if (h.variant === 'ruyi') { // the staff growing out along the line
      const u = Math.min(1, k * 1.3), ex = x0 + (x1 - x0) * u, ey = y0 + (y1 - y0) * u;
      this.pline(x0, y0, ex, ey, '#ffd84a', h.w > 10);
      g.fillStyle = '#c23b22'; g.fillRect(Math.round(ex) - 1, Math.round(ey) - 1, 3, 3);
    } else if (h.variant === 'cut' || h.variant === 'bigcut') {
      if (Math.floor(t * 24) % 2) this.pline(x0, y0, x1, y1, h.variant === 'bigcut' ? '#ffb7d5' : '#e8f4ff');
    } else if (h.variant === 'exterminate') this.pline(x0 + (x1 - x0) * 0.5 * (1 - k), y0 + (y1 - y0) * 0.5 * (1 - k), x1 - (x1 - x0) * 0.5 * (1 - k), y1 - (y1 - y0) * 0.5 * (1 - k), '#fff3b0');
  }

  // Severing the Heavens: the sky split in two along the cut, and a crack across space itself.
  drawSkySplit(sim) {
    const S = sim.skySplit, g = this.g, k = Math.min(1, S.t / 0.6);
    const cx = S.x !== undefined ? sx(S.x) : CX, cy = S.y !== undefined ? sy(S.y) - 6 : 60, dx = Math.cos(S.a), dy = Math.sin(S.a) * SQ;
    g.globalAlpha = 0.55 * k; g.fillStyle = '#000000';
    g.beginPath(); g.moveTo(cx - dx * 400 - 3, cy - dy * 400); g.lineTo(cx + dx * 400 - 3, cy + dy * 400); g.lineTo(cx + dx * 400 + 3, cy + dy * 400); g.lineTo(cx - dx * 400 + 3, cy - dy * 400); g.fill();
    g.globalAlpha = k;
    for (let i = -40; i <= 40; i++) { const jag = Math.sin(i * 1.7 + sim.t * 40) * 1.5; this.pix(cx + dx * i * 5 + jag, cy + dy * i * 5, i % 3 ? '#ffffff' : '#ffb7d5'); }
    g.globalAlpha = 1;
    if (Math.random() < 0.5) { const u = (Math.random() - .5) * 300; this.spark(cx + dx * u, cy + dy * u, ['#ffffff', '#ffb7d5', '#141414'], 0, 0.5, 4); }
  }

  // auras the fighter's talents put on it
  drawHeroTalents(sim, p, beast, skin) {
    const g = this.g, t = sim.t, X = Math.round(sx(p.x)), Y = Math.round(sy(p.y)), r = Math.random;
    if (beast) { g.globalAlpha = 0.35 + 0.2 * Math.sin(t * 8); this.ellipse(p.x, p.y, 8, (skin && skin.color) || beast.color, true); g.globalAlpha = 1; if (r() < 0.4) this.spark(X, Y - 5, [beast.color, '#ffffff'], -20, 0.4, 14); }
    if (p.tal && p.tal.kaioken && p.hp > p.maxHp * 0.3 && sim.nearestEnemy(p)) { // Kaioken: a red aura flaring off it
      g.globalAlpha = 0.4 + 0.3 * Math.sin(t * 20); this.ellipse(p.x, p.y, 7 + Math.sin(t * 12), '#ff2a2a', true); g.globalAlpha = 1;
      if (r() < 0.8) this.parts.push({ kind: 'px', x: X + (r() - .5) * 12, y: Y - r() * 12, vx: 0, vy: -45, life: 0.3, max: 0.3, color: r() < 0.6 ? '#ff2a2a' : '#ffffff' });
    }
    if (p.berserkT > 0) { g.globalAlpha = 0.5 + 0.3 * Math.sin(t * 18); this.ellipse(p.x, p.y, 8, '#141414', false, 0.4); this.ellipse(p.x, p.y, 7, '#c23b22', true); g.globalAlpha = 1; if (r() < 0.6) this.spark(X, Y - 6, ['#141414', '#c23b22'], -15, 0.5, 10); }
  }

  // The picture cracks like a mirror around the cut, then falls apart into the void behind it.
  startShatter(cx, cy, strong) {
    const snap = document.createElement('canvas'); snap.width = W; snap.height = H;
    snap.getContext('2d').drawImage(this.g.canvas, 0, 0);
    const n = strong ? 14 : 10, angles = Array.from({ length: n }, (_, i) => (i + Math.random() * 0.7) / n * Math.PI * 2), pieces = [];
    const at = (a, rr) => [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
    for (let i = 0; i < n; i++) {
      const a0 = angles[i], a1 = angles[(i + 1) % n] + (i === n - 1 ? Math.PI * 2 : 0), r1 = 18 + Math.random() * 26, r1b = 18 + Math.random() * 26;
      const mid = (a0 + a1) / 2;
      pieces.push({ pts: [[cx, cy], at(a0, r1), at(a1, r1b)], dx: Math.cos(mid), dy: Math.sin(mid), sp: 30 + Math.random() * 40, rot: (Math.random() - .5) * 0.6 });
      pieces.push({ pts: [at(a0, r1), at(a0, 400), at(a1, 400), at(a1, r1b)], dx: Math.cos(mid), dy: Math.sin(mid), sp: 12 + Math.random() * 25, rot: (Math.random() - .5) * 0.25 });
    }
    this.shatter = { snap, pieces, t: 0, cx, cy, strong };
    this.snd('glass'); this.snd('ultboom');
  }

  // Severing the Heavens: the far side of the cut freezes, time stopped in it, while the near side keeps moving;
  // then the frozen half cracks from the cut outward and falls away like a broken pane.
  startSever(cx, cy, a) {
    const snap = document.createElement('canvas'); snap.width = W; snap.height = H;
    snap.getContext('2d').drawImage(this.g.canvas, 0, 0);
    const dx = Math.cos(a), dy = Math.sin(a);
    let nx = -dy, ny = dx; if (ny > 0) { nx = -nx; ny = -ny; } // the half above the cut (the sky side) is the one that freezes
    const along = u => [cx + dx * u, cy + dy * u], pieces = [], cuts = [];
    for (let u = -320; u <= 320; u += 40 + Math.random() * 30) cuts.push(u);
    for (let i = 0; i + 1 < cuts.length; i++) {
      const [ax, ay] = along(cuts[i]), [bx, by] = along(cuts[i + 1]), m1 = 20 + Math.random() * 40, m2 = 20 + Math.random() * 40, far = 400;
      const A = [ax, ay], B = [bx, by], Am = [ax + nx * m1, ay + ny * m1], Bm = [bx + nx * m2, by + ny * m2], Af = [ax + nx * far, ay + ny * far], Bf = [bx + nx * far, by + ny * far];
      pieces.push({ pts: [A, B, Bm, Am], sp: 10 + Math.random() * 20, rot: (Math.random() - .5) * 0.5, delay: Math.random() * 0.15 });
      pieces.push({ pts: [Am, Bm, Bf, Af], sp: 5 + Math.random() * 15, rot: (Math.random() - .5) * 0.25, delay: 0.05 + Math.random() * 0.25 });
    }
    const half = [along(-600), along(600), [cx + dx * 600 + nx * 600, cy + dy * 600 + ny * 600], [cx - dx * 600 + nx * 600, cy - dy * 600 + ny * 600]];
    this.shatter = { mode: 'sever', snap, pieces, half, t: 0, cx, cy, nx, ny, line: [along(-600), along(600)] };
    this.snd('ultboom');
  }

  // Heaven and Earth, One Sword: the arena comes apart along the stroke, a gap of light between the halves, then closes
  startSeparate(cx, cy, a) {
    const snap = document.createElement('canvas'); snap.width = W; snap.height = H;
    snap.getContext('2d').drawImage(this.g.canvas, 0, 0);
    const dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx, L = 600;
    const side = sgn => [[cx - dx * L, cy - dy * L], [cx + dx * L, cy + dy * L], [cx + dx * L + nx * L * sgn, cy + dy * L + ny * L * sgn], [cx - dx * L + nx * L * sgn, cy - dy * L + ny * L * sgn]];
    this.shatter = { mode: 'separate', snap, t: 0, halves: [side(1), side(-1)], nx, ny, line: [[cx - dx * L, cy - dy * L], [cx + dx * L, cy + dy * L]] };
    this.snd('ultboom');
  }

  drawSeparate(S) {
    const g = this.g, life = 1.6, path = pts => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
    if (S.t > life) { this.shatter = null; return; }
    const k = S.t < 0.25 ? S.t / 0.25 : S.t > 1.1 ? Math.max(0, 1 - (S.t - 1.1) / 0.5) : 1, gap = 5 * k;
    g.fillStyle = '#ffffff'; g.globalAlpha = 0.9 * k; g.fillRect(0, 13, W, H - 13); g.globalAlpha = 1; // light pouring through the cut
    S.halves.forEach((pts, i) => {
      const sgn = i ? -1 : 1;
      g.save(); g.translate(S.nx * gap * sgn, S.ny * gap * sgn); path(pts); g.clip(); g.imageSmoothingEnabled = false; g.drawImage(S.snap, 0, 0); g.restore();
    });
    g.strokeStyle = '#ffffff'; g.lineWidth = 1; g.globalAlpha = k; g.beginPath(); g.moveTo(...S.line[0]); g.lineTo(...S.line[1]); g.stroke(); g.globalAlpha = 1;
  }

  drawShatter(dt) {
    const S = this.shatter, g = this.g;
    S.t += dt;
    if (S.mode === 'separate') return this.drawSeparate(S);
    if (S.mode === 'sever') return this.drawSever(S, dt);
    const crack = 0.28, life = S.strong ? 1.5 : 1.15;
    if (S.t > life) { this.shatter = null; return; }
    const line = (pts, c) => { g.strokeStyle = c; g.lineWidth = 1; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x + 0.5, y + 0.5) : g.moveTo(x + 0.5, y + 0.5))); g.closePath(); g.stroke(); };
    if (S.t < crack) { // the cracks spread out from the cut
      g.globalAlpha = Math.min(1, S.t / 0.08);
      for (const p of S.pieces) line(p.pts, Math.floor(S.t * 40) % 2 ? '#ffffff' : '#ffd8ec');
      g.globalAlpha = 1;
      return;
    }
    const u = S.t - crack, fade = Math.max(0, 1 - u / (life - crack));
    g.fillStyle = S.strong ? '#05040c' : '#0a0612'; g.globalAlpha = Math.min(1, fade * 1.4); g.fillRect(0, 13, W, H - 13); // the void behind the glass
    for (let i = 0; i < 30; i++) { const x = (i * 97 + 13) % W, y = 14 + (i * 53) % (H - 14); g.fillStyle = i % 3 ? '#ffb7d5' : '#ffffff'; g.fillRect(x, y, 1, 1); }
    g.globalAlpha = fade;
    for (const p of S.pieces) {
      const ox = p.dx * p.sp * u, oy = p.dy * p.sp * u + 60 * u * u, [px, py] = p.pts[1];
      g.save(); g.translate(px + ox, py + oy); g.rotate(p.rot * u); g.translate(-px, -py);
      g.beginPath(); p.pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.clip();
      g.imageSmoothingEnabled = false; g.drawImage(S.snap, 0, 0);
      g.restore();
      g.save(); g.translate(px + ox, py + oy); g.rotate(p.rot * u); g.translate(-px, -py); line(p.pts, 'rgba(255,255,255,0.8)'); g.restore();
    }
    g.globalAlpha = 1;
  }

  drawSever(S, dt) {
    const g = this.g, hold = 1.0, crack = 0.3, fall = 1.4, path = pts => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
    if (S.t > hold + crack + fall) { this.shatter = null; return; }
    if (S.t < hold + crack) { // the frozen half: a still picture, tinted cold, the seam of the cut burning white
      g.save(); path(S.half); g.clip(); g.imageSmoothingEnabled = false; g.drawImage(S.snap, 0, 0);
      g.globalAlpha = 0.34; g.fillStyle = '#cfe6ff'; g.fillRect(0, 13, W, H - 13); // time stopped on this side: cold and colourless
      g.globalAlpha = 0.5; g.fillStyle = '#ffffff'; for (let i = 0; i < 40; i++) g.fillRect((i * 67 + 11) % W, 14 + (i * 29) % (H - 14), 1, 1); // frost glinting on the pane
      g.restore();
      g.globalAlpha = 1;
      const [[x0, y0], [x1, y1]] = S.line, flick = Math.floor(S.t * 30) % 2;
      for (let o = -1; o <= 1; o++) { g.strokeStyle = o ? '#ffb7d5' : flick ? '#ffffff' : '#fff3f8'; g.lineWidth = 1; g.beginPath(); g.moveTo(x0, y0 + o + 0.5); g.lineTo(x1, y1 + o + 0.5); g.stroke(); }
      if (S.t > hold) { // the cracks run out from the cut across the frozen half
        g.globalAlpha = Math.min(1, (S.t - hold) / crack);
        for (const p of S.pieces) { g.strokeStyle = '#ffffff'; path(p.pts); g.stroke(); }
        g.globalAlpha = 1;
      }
      if (Math.random() < 0.5) { const u = (Math.random() - .5) * 300; this.parts.push({ kind: 'px', x: S.cx + (x1 - x0) / 600 * u, y: S.cy + (y1 - y0) / 600 * u, vx: S.nx * 20, vy: S.ny * 20, life: 0.4, max: 0.4, color: Math.random() < 0.5 ? '#ffffff' : '#ffb7d5' }); }
      if (S.t - dt < hold && S.t >= hold) this.snd('glass');
      return;
    }
    const u = S.t - hold - crack; // the pane falls apart and drops away, the live world showing through behind it
    for (const p of S.pieces) {
      const k = Math.max(0, u - p.delay), [px, py] = p.pts[0], ox = S.nx * p.sp * k * 0.3, oy = 90 * k * k + p.sp * k * 0.2, alpha = Math.max(0, 1 - k / (fall - 0.2));
      if (!alpha) continue;
      g.save(); g.globalAlpha = alpha; g.translate(px + ox, py + oy); g.rotate(p.rot * k * 2); g.translate(-px, -py);
      path(p.pts); g.clip(); g.imageSmoothingEnabled = false; g.drawImage(S.snap, 0, 0);
      g.fillStyle = 'rgba(191,224,255,0.18)'; g.fillRect(0, 0, W, H);
      g.restore();
      g.save(); g.globalAlpha = alpha; g.translate(px + ox, py + oy); g.rotate(p.rot * k * 2); g.translate(-px, -py); g.strokeStyle = 'rgba(255,255,255,0.9)'; path(p.pts); g.stroke(); g.restore();
    }
    g.globalAlpha = 1;
  }

  // A skin's signature effect around the fighter.
  drawSkinFx(sim, p, sk, phase) {
    const g = this.g, t = sim.t, X = Math.round(sx(p.x)), Y = Math.round(sy(p.y)), r = Math.random, P = this.parts, F = p.fx < 0 ? -1 : 1;
    const moving = p.mvx || p.mvy || p.state === 'roll' || p.state === 'act';
    if (phase === 'pre') {
      if (sk.fx === 'wings') for (const side of [-1, 1]) { // wings of fire at its back
        for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + side * (0.5 + i * 0.22) + Math.sin(t * 6) * 0.08, L = 5 + i; this.pline(X - F * 2, Y - 7, X - F * 2 + Math.cos(a) * L, Y - 7 + Math.sin(a) * L * 0.8, i % 2 ? '#ffd84a' : '#ff7a1a'); }
        if (r() < 0.5) this.spark(X - F * 2 + side * 8, Y - 11, ['#ff7a1a', '#ffe14d'], -20, 0.3, 4);
      }
      if (sk.fx === 'gold') { g.globalAlpha = 0.3 + 0.15 * Math.sin(t * 4); this.ellipse(p.x, p.y, 7, '#ffd84a', true); g.globalAlpha = 1; for (let i = 0; i < 8; i++) { const a = t * 2 + i * 0.785; this.pix(X + Math.cos(a) * 4, Y - 13 + Math.sin(a) * 1.2, '#fff3b0'); } }
      if (sk.fx === 'void') { g.globalAlpha = 0.35; this.ellipse(p.x, p.y, 6 + Math.sin(t * 5), '#7a4ad0', false, 0.3); g.globalAlpha = 1; }
      return;
    }
    switch (sk.fx) {
      case 'smoke': if (r() < (moving ? 0.6 : 0.2)) P.push({ kind: 'px', x: X + (r() - .5) * 8, y: Y - r() * 4, vx: (r() - .5) * 6, vy: -8, life: 0.7, max: 0.7, color: r() < 0.5 ? '#3d4760' : '#5a6278' }); break;
      case 'motes': if (r() < 0.25) this.spark(X, Y - 6, ['#ffd84a', '#fff3b0'], -12, 0.8, 14); break;
      case 'embers': if (r() < 0.45) this.spark(X, Y - 4, ['#ff3a1a', '#ffb04a', '#ffe14d'], -25, 0.45, 8); break;
      case 'snow': if (r() < 0.3) P.push({ kind: 'px', x: X + (r() - .5) * 16, y: Y - 16, vx: (r() - .5) * 4, vy: 10, life: 1, max: 1, color: r() < 0.5 ? '#ffffff' : '#bfe8ff' }); break;
      case 'petals': if (r() < (moving ? 0.5 : 0.2)) P.push({ kind: 'px', x: X + (r() - .5) * 10, y: Y - 8 - r() * 6, vx: -F * 12 + (r() - .5) * 8, vy: 6, g: 4, life: 1.1, max: 1.1, color: r() < 0.6 ? '#ff9ad8' : '#ffd8ec' }); break;
      case 'sparks': if (r() < 0.35) { const x0 = X + (r() - .5) * 8, y0 = Y - 4 - r() * 8; P.push({ kind: 'line', x0, y0, x1: x0 + (r() - .5) * 6, y1: y0 + (r() - .5) * 6, life: 0.08, max: 0.08, color: r() < 0.5 ? '#7fe0ff' : '#ffffff' }); } break;
      case 'void': if (moving && Math.floor(t * 30) % 3 === 0) P.push({ kind: 'ghost', name: 'hero_walk', x: p.x, y: p.y, flip: p.fx < 0, scale: 1, life: 0.25, max: 0.25 }); if (r() < 0.3) this.spark(X, Y - 5, ['#c9a0ff', '#7a4ad0'], 10, 0.5, 12); break;
      case 'gold': if (r() < 0.3) this.spark(X, Y - 6, ['#ffd84a', '#ffffff'], -18, 0.5, 12); break;
      case 'wings': break;
      case 'stars': for (let i = 0; i < 3; i++) { const k = Math.floor(t * 3 + i * 7 + p.id) % 9; this.pix(X - 2 + (k % 4), Y - 8 + ((k * 3) % 5), Math.floor(t * 8 + i) % 2 ? '#ffffff' : '#bfe0ff'); } if (r() < 0.15) this.spark(X, Y - 6, ['#bfe0ff', '#ffffff'], -6, 0.9, 16); break;
    }
  }

  // The Headless Scholar: the void at his neck, and the umbrella of ten thousand uses.
  drawScholar(sim, e, at, X, y0, w, h, F, t) {
    const g = this.g, r = Math.random, P = this.parts, grot = e.phase === 2;
    // measure from his own picture (not a pose), so the umbrella and the neck stay put; the head adds rows on top
    const base = SPRITE_CACHE[spriteFor(e)], bx0 = Math.round(X - base.w / 2), by0 = Math.round(sy(e.y) - base.h + 1) - (e.def.floating ? 4 : 0) + (grot ? 0 : SCHOLAR_HEAD.length - 2);
    const pt = (fx, fy) => [F < 0 ? bx0 + base.w - 1 - fx : bx0 + fx, by0 + fy];
    const [nx, ny] = pt(4, 0);
    if (grot && r() < 0.35) P.push({ kind: 'px', x: nx + (r() - .5) * 3, y: ny - 1, vx: (r() - .5) * 6, vy: -10 - r() * 8, life: 0.9, max: 0.9, color: r() < 0.6 ? '#141414' : '#5a5f66' }); // calligraphy drifting off the void
    if (grot && r() < 0.1) P.push({ kind: 'line', x0: nx - 1, y0: ny - 4 - r() * 4, x1: nx + 1 + r() * 2, y1: ny - 5 - r() * 4, life: 0.6, max: 0.6, color: '#141414' });
    if (grot && Math.floor(t * 2) % 2) this.pix(nx, ny - 2, '#bfe0ff'); // a faint glint over the void, like a halo
    if (!grot) for (const s of [0, 1]) { // his long hair stirring behind him
      let [x, y] = pt(2 + s, s - 2);
      for (let k = 0; k < 5 + s * 2; k++) { x -= F * (0.45 + k * 0.05); y += 1 + Math.sin(t * 3 + k * 0.7 + s * 2) * 0.3; this.pix(x, y, '#141414'); }
    }
    const form = e.inkShieldT > 0 ? 'shield' : e.state === 'wind' || e.state === 'recover' || e.state === 'act' || e.state === 'ult' ? e.umbrella || 'closed' : 'closed';
    const [hx, hy] = pt(8, 6);
    const ahead = F > 0 ? 0 : Math.PI;
    switch (form) {
      case 'closed': this.umbrellaClosed(hx, hy, F > 0 ? 1.95 : Math.PI - 1.95, 11); break; // resting, tip to the ground
      case 'sword': this.umbrellaClosed(hx, hy, ahead, 12, false, true); break;                         // the tip as a blade
      case 'spear': this.umbrellaClosed(hx + F * 3, hy, ahead, 17, false, true); break;                 // the tip, much further
      case 'hook': this.umbrellaClosed(hx - F * 9, hy, ahead, 12, true); break;                         // turned round: the crook leads
      case 'brush': this.umbrellaClosed(hx, hy - 6, F > 0 ? 1.2 : Math.PI - 1.2, 11, false, false, true); break;
      case 'shield': this.umbrellaOpen(hx + F * 3, hy - 2, 8, F > 0 ? 'right' : 'left'); break;         // opened toward you
      case 'fan': this.umbrellaOpen(hx + F * 2, hy - 1, 9, 'fan', F); break;                            // opened and swept
    }
  }

  // the umbrella folded: a crook handle, the bound red canopy, a white ferrule at the tip
  umbrellaClosed(hx, hy, a, len, reversed, glint, drip) {
    const dx = Math.cos(a), dy = Math.sin(a) * 0.9, at = u => [hx + dx * len * u, hy + dy * len * u];
    const [tx, ty] = at(1), [c0x, c0y] = at(0.3), [c1x, c1y] = at(0.85);
    this.pline(hx, hy, tx, ty, '#6b4a2f');
    this.pline(c0x, c0y, c1x, c1y, '#c23b22'); this.pline(c0x - dy, c0y + dx, c1x - dy * 0.4, c1y + dx * 0.4, '#8a1020');
    const crook = reversed ? [tx, ty, 1] : [hx, hy, -1]; // the crook at the handle (or leading, for the hook)
    this.pix(crook[0] + dx * crook[2], crook[1] + dy * crook[2], '#6b4a2f'); this.pix(crook[0] + dx * crook[2] - dy * 1.5, crook[1] + dy * crook[2] + dx * 1.5, '#6b4a2f'); this.pix(crook[0] - dy * 2, crook[1] + dx * 2, '#6b4a2f');
    const [fx, fy] = reversed ? [hx, hy] : [tx, ty];
    this.pix(fx, fy, glint && Math.floor(this.tick * 20) % 2 ? '#ffffff' : '#d8dde3');
    if (drip && Math.random() < 0.5) this.parts.push({ kind: 'px', x: tx, y: ty, vx: 0, vy: 20, g: 80, life: 0.5, max: 0.5, color: '#141414' });
  }

  // the umbrella opened: red paper ribs round a starless black sky
  umbrellaOpen(cx, cy, rr, how, F = 1) {
    const g = this.g;
    if (how === 'up') {
      g.fillStyle = '#141414'; g.beginPath(); g.ellipse(cx, cy + 2, rr, 3, 0, 0, Math.PI * 2); g.fill();
      for (let i = -rr; i <= rr; i++) this.pix(cx + i, cy + Math.round(i * i / (rr * 3.2)), '#c23b22');
      for (let i = -rr + 2; i <= rr - 2; i += 4) this.pline(cx, cy - 2, cx + i, cy + Math.round(i * i / (rr * 3.2)), '#8a1020');
      this.pline(cx, cy - 3, cx, cy + 9, '#6b4a2f');
      return;
    }
    if (how === 'fan') {
      for (let i = 0; i < 9; i++) { const a = -0.9 + i * 0.22; this.pline(cx, cy, cx + F * Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.7, i % 2 ? '#c23b22' : '#141414'); }
      return;
    }
    g.fillStyle = '#141414'; g.beginPath(); g.ellipse(cx, cy, 3, rr, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#c23b22'; g.lineWidth = 1; g.beginPath(); g.ellipse(cx + 0.5, cy + 0.5, 3.5, rr + 0.5, 0, 0, Math.PI * 2); g.stroke();
    for (let i = -rr + 2; i <= rr - 2; i += 3) this.pix(cx, cy + i, '#8a1020');
  }

  // a pixel dragon head at any size (for the great serpent of the ultimate too)
  dragonHead(hx, hy, F, P, s = 1, open = 0) {
    const g = this.g, map = { h: P.horn, M: P.mane, B: P.body, D: P.dark, e: P.eye, n: P.dark, w: '#ffffff', j: P.belly };
    DRAGON_HEAD.forEach((row, y) => { for (let x = 0; x < row.length; x++) {
      const c = row[x]; if (c === '.') continue;
      const yy = y + (y >= 6 && open ? open : 0); // the lower jaw drops when it opens
      g.fillStyle = map[c]; g.fillRect(Math.round(hx + F * (x - 6) * s - (F < 0 ? s : 0)), Math.round(hy + (yy - 4) * s), Math.ceil(s), Math.ceil(s));
    } });
  }

  // an eastern dragon: the body follows a slow wave behind the head, tapering to the tail
  drawEasternDragon(sim, e, P, jx, lift, flash, scale) {
    const g = this.g, t = sim.t, F = e.fx < 0 ? -1 : 1, X = sx(e.x + jx), base = sy(e.y) - lift - 5, L = P.len * scale, th0 = P.th * scale, n = Math.round(L / 1.5);
    if (flash) P = { body: '#ffffff', dark: '#ffffff', belly: '#ffffff', mane: '#ffffff', horn: '#ffffff', eye: '#ffffff' };
    const pts = [];
    for (let i = 0; i <= n; i++) { const u = i / n; pts.push([X + F * (L * 0.45 - u * L), base + Math.sin(t * 3.5 + e.id - u * 6) * 3 * scale + u * 1.5]); }
    for (let i = n; i >= 0; i--) { // the body, tail first so the head sits on top
      const [x, y] = pts[i], u = i / n, th = Math.max(1, th0 * (1 - u * 0.75) * (u < 0.08 ? 0.8 : 1));
      g.fillStyle = P.body; g.fillRect(Math.round(x), Math.round(y - th / 2), 2, Math.ceil(th));
      g.fillStyle = P.belly; g.fillRect(Math.round(x), Math.round(y + th / 2) - 1, 2, 1);
      if (i % 3 === 0) { g.fillStyle = P.dark; g.fillRect(Math.round(x), Math.round(y), 1, 1); } // scales
      if (i % 4 === 1 && u < 0.92) { g.fillStyle = P.mane; g.fillRect(Math.round(x), Math.round(y - th / 2) - 1 - (i % 8 === 1 ? 1 : 0), 1, i % 8 === 1 ? 2 : 1); } // the dorsal crest
    }
    const [tx, ty] = pts[n]; g.fillStyle = P.mane; g.fillRect(Math.round(tx) - 1, Math.round(ty) - 2, 2, 4); // the tail tuft
    for (const k of [0.22, 0.62]) { // clawed legs, paddling at the air
      const i = Math.round(k * n), [x, y] = pts[i], sw = Math.sin(t * 6 + k * 9) * 2 * scale, th = th0 * (1 - k * 0.75);
      for (const side of [0, 1]) { const lx = x + (side ? 2 : -1) * scale + sw * (side ? 1 : -1), ly = y + th / 2 + 3 * scale; this.pline(x + side * 2, y + th / 2, lx, ly, P.dark); g.fillStyle = P.horn; g.fillRect(Math.round(lx) - 1, Math.round(ly), 3, 1); }
    }
    const [hx, hy] = pts[0];
    this.dragonHead(hx, hy, F, P, scale, Math.floor(t * 2 + e.id) % 5 === 0 || e.state === 'wind' ? 1 : 0);
    // whiskers trailing back from the snout
    for (const o of [-1, 1]) { let x = hx + F * 5 * scale, y = hy + o * scale; for (let k = 0; k < 8; k++) { x -= F * 1.2; y += Math.sin(t * 5 + k * 0.8 + o) * 0.6 + o * 0.25; this.pix(x, y, P.mane); } }
  }

  // World Within a Painting: everything drained to ink on paper (the dragon's red eye stays red)
  paintWorld(sim) {
    const g = this.g;
    if (!this.paintBuf) { this.paintBuf = document.createElement('canvas'); this.paintBuf.width = W; this.paintBuf.height = H; }
    const b = this.paintBuf.getContext('2d');
    b.clearRect(0, 0, W, H); b.drawImage(g.canvas, 0, 0);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    g.filter = 'grayscale(1) contrast(1.25) brightness(1.08)';
    g.drawImage(this.paintBuf, 0, 13, W, H - 13, 0, 13, W, H - 13);
    g.filter = 'none';
    g.globalAlpha = 0.16; g.fillStyle = '#e8dcc0'; g.fillRect(0, 13, W, H - 13); // the paper
    g.globalAlpha = 0.5; g.fillStyle = '#141414';
    for (let i = 0; i < 4; i++) { const x = (i * 71 + Math.floor(sim.t * 2)) % W; g.fillRect(x, 14, 1, 3 + (i % 3)); } // ink running down from the top of the scroll
    g.restore(); g.globalAlpha = 1;
    for (let i = 0; i < 6; i++) { const x = (i * 43 + sim.t * 90 * (1 + i % 3)) % W, y = 14 + ((i * 37 + sim.t * 160) % (H - 14)); g.fillStyle = '#3a3a40'; g.fillRect(Math.round(x), Math.round(y), 1, 3); } // Rain From Another World
  }

  // The Dragon Devours the Sun: one great serpent of ink circling the sky as the dark spreads, then its jaws close over the stage.
  drawBigDragon(sim, dt) {
    const D = sim.bigDragon, g = this.g, grow = Math.min(1, D.t / 2.2), t = sim.t;
    const P = { body: '#141418', dark: '#000000', belly: '#3a3a42', mane: '#5a5f66', horn: '#bfb6a2', eye: D.eye ? '#ff2a2a' : '#7a0a12' };
    const bite = sim.hazards.find(h => h.kind === 'bite'), k = bite ? 1 - bite.t / bite.delay : 0;
    g.fillStyle = '#000000'; g.globalAlpha = Math.min(0.85, grow * 0.85); g.fillRect(0, 13, W, 52); g.globalAlpha = Math.min(0.5, grow * 0.5); g.fillRect(0, 65, W, H - 65); g.globalAlpha = 1;
    // the body: thick, scaled, crested, coiling round the sky
    const n = 150, th0 = 4 + grow * 11, ang0 = t * 0.85, pts = [];
    for (let i = 0; i <= n; i++) { const a = ang0 - i * 0.04; pts.push([CX + Math.cos(a) * 112, 44 + Math.sin(a) * 24 + Math.sin(a * 3 + t * 3) * 4]); }
    const headGone = !!bite; // the approach owns the head, including its first frame
    for (let i = n; i >= (headGone ? 8 : 0); i--) {
      const [x, y] = pts[i], u = i / n, th = th0 * (1 - u * 0.65), [px, py] = pts[Math.max(0, i - 1)];
      g.lineCap = 'round'; g.strokeStyle = P.body; g.lineWidth = th; g.beginPath(); g.moveTo(x, y); g.lineTo(px, py); g.stroke(); // one unbroken body
      g.strokeStyle = P.belly; g.lineWidth = Math.max(1, th * 0.25); g.beginPath(); g.moveTo(x, y + th * 0.35); g.lineTo(px, py + th * 0.35); g.stroke();
      g.lineCap = 'butt';
      if (i % 2 === 0) { g.fillStyle = '#2a2a32'; g.fillRect(Math.round(x), Math.round(y - th / 4 + (i % 4)), 1, 1); } // scales
      if (i % 5 === 0) { g.fillStyle = P.mane; g.fillRect(Math.round(x), Math.round(y - th / 2) - 3, 1, 3); g.fillRect(Math.round(x) - 1, Math.round(y - th / 2) - 1, 3, 1); } // the crest
      if (i % 37 === 12) for (const side of [-1, 1]) { const lx = x + side * 3, ly = y + th / 2 + 5; this.pline(x, y + th / 2, lx, ly, '#000000'); g.fillStyle = '#bfb6a2'; g.fillRect(Math.round(lx) - 2, Math.round(ly), 5, 1); } // claws
    }
    if (!headGone) { const [hx, hy] = pts[0], F = Math.cos(ang0 + Math.PI / 2) > 0 ? 1 : -1; this.dragonHead(hx, hy, F, P, 2.5 + grow * 1.5, Math.floor(t * 3) % 4 === 0 ? 1 : 0);
      for (const o of [-1, 1]) { let x = hx + F * 14, y = hy + o * 3; for (let q = 0; q < 16; q++) { x -= F * 2; y += Math.sin(t * 4 + q * 0.5 + o) * 1.2 + o * 0.4; this.pix(x, y, P.mane); } } } // long whiskers
    if (bite) {
      // Spend the first 0.8s turning out of the coil before the main camera lunge.
      const turn=clamp(k/.4,0,1),yaw=turn*turn*(3-2*turn),angle=yaw*Math.PI/2;
      const approach=clamp((k-.22)/.6,0,1),ease=approach*approach*(3-2*approach);
      const [x0,y0]=pts[0],S=1.7*Math.pow(BITE_S/1.7,ease),gap=S*(2+approach*8);
      const F=Math.cos(ang0+Math.PI/2)>0?1:-1;
      const hx=x0+(CX-x0)*ease,headY=y0+(CY-5*S-gap*.38-y0)*ease;
      const hy=headY+5*S+gap*.38;
      // The neck bends along a cubic curve: its tangent gradually follows the
      // head's yaw instead of snapping from the coil to a straight camera neck.
      const [nx,ny]=pts[8];
      const c1x=nx+(x0-nx)*.65,c1y=ny+(y0-ny)*.65;
      const c2x=hx-F*(1-yaw)*(14+S*2),c2y=headY-8*yaw;
      for(let i=0;i<40;i++) {
        const u=i/39,v=1-u,x=v*v*v*nx+3*v*v*u*c1x+3*v*u*u*c2x+u*u*u*hx;
        const y=v*v*v*ny+3*v*v*u*c1y+3*v*u*u*c2y+u*u*u*headY;
        const w=th0+(S*8-th0)*u;
        g.fillStyle=P.body;g.fillRect(Math.round(x-w/2),Math.round(y-w*.25),Math.ceil(w),Math.ceil(w*.5));
        g.fillStyle=P.belly;g.fillRect(Math.round(x-w*.35),Math.round(y+w*.18),Math.ceil(w*.7),Math.max(1,Math.round(w*.08)));
      }
      // Foreshorten the familiar profile while the frontal plane turns into view.
      if(yaw<1) {
        g.save();g.translate(hx,headY);g.scale(Math.max(.05,Math.cos(angle)),1);
        g.globalAlpha=1-yaw;
        this.dragonHead(0,0,F,P,(2.5+grow*1.5)*(S/1.7),0);g.restore();
      }
      if(yaw>0) {
        g.save();g.translate(hx,0);g.scale(Math.max(.05,Math.sin(angle)),1);g.globalAlpha=yaw;
        this.dragonJaws(0,hy,S,gap,D.eye,t);g.restore();
      }
    }
  }

  // Same ink dragon viewed down its snout: broad brow, narrow red slits, pale
  // swept horns and long whiskers. The opening is an unlit void, never anatomy.
  dragonJaws(cx,cy,S,gap,eye,t=0) {
    const g=this.g,top=cy-gap*.38;
    const pal={h:'#bfb6a2',M:'#5a5f66',B:'#141418',D:'#000000',n:'#000000',e:'#ff2a2a'};
    // Coarse stepped lower-jaw silhouette matches the body's charcoal underside.
    for(let row=0;row<7;row++) {
      const half=6.5-Math.floor(row*.65),yy=top+gap+(row-2)*S;
      g.fillStyle=row<2?'#3a3a42':'#141418';g.fillRect(Math.round(cx-half*S),Math.round(yy),Math.ceil(half*2*S),Math.ceil(S));
    }
    // A narrower throat framed by ink-dark cheeks, rather than a wide central box.
    for(let row=0;row<Math.ceil(gap/S)+2;row++) {
      const u=row/(gap/S+2),half=Math.round(6*Math.sqrt(Math.max(0,1-Math.pow((u-.45)/.65,2))));
      g.fillStyle='#141418';g.fillRect(Math.round(cx-(half+1)*S),Math.round(top+row*S),Math.ceil((half+1)*2*S),Math.ceil(S));
      g.fillStyle='#000000';g.fillRect(Math.round(cx-half*S),Math.round(top+row*S),Math.ceil(half*2*S),Math.ceil(S));
    }
    const rows=SCHOLAR_DRAGON_FRONT,w=rows[0].length;
    rows.forEach((row,y)=>{for(let x=0;x<row.length;x++){
      if(row[x]==='.')continue;g.fillStyle=pal[row[x]];
      g.fillRect(Math.round(cx+(x-w/2)*S),Math.round(top+(y-rows.length+1)*S),Math.ceil(S),Math.ceil(S));
    }});
    // Curved, inward-hooking fangs: long corner canines, shorter staggered inner
    // teeth, dark roots and a narrow ivory edge. Rasterized rather than smooth cones.
    for(const lower of [false,true]) for(const offset of (lower?[-3.3,-.9,1.3,3.5]:[-3.8,-1.4,1.4,3.8])) {
      const canine=Math.abs(offset)>3,dir=lower?-1:1;
      const length=Math.min(gap*.34,S*(canine?(lower?2.05:2.65):1.15));
      const root=lower?top+gap+.4*S:top+.8*S,steps=Math.max(4,Math.ceil(length));
      for(let step=0;step<steps;step++) {
        const u=step/steps,curve=-Math.sign(offset)*S*(canine?.65:.2)*u*u;
        const width=Math.max(.15*S,S*(canine?.95:.65)*Math.pow(1-u,.8));
        const x=cx+offset*S+curve-width/2,y=root+dir*length*u;
        g.fillStyle=u<.18?'#706b61':'#bfb6a2';
        g.fillRect(Math.round(x),Math.round(y-(lower?length/steps:0)),Math.max(1,Math.ceil(width)),Math.max(1,Math.ceil(length/steps)));
        if(u>.18) {g.fillStyle='#ece4d2';g.fillRect(Math.round(x),Math.round(y-(lower?length/steps:0)),Math.max(1,Math.round(width*.35)),Math.max(1,Math.ceil(length/steps)));}
      }
    }
    // Whiskers retain the curling, angular strokes of the side-view serpent.
    for(const side of [-1,1]) {
      let px=cx+side*7*S,py=top-2*S;
      for(let i=1;i<=13;i++) {
        const x=cx+side*(7+i*.85)*S,y=top+(-2+Math.sin(i*.4+t*2)*.8+i*.13)*S;
        const n=Math.max(1,Math.ceil(Math.max(Math.abs(x-px),Math.abs(y-py))/Math.max(1,S*.4)));
        g.fillStyle='#5a5f66';for(let j=0;j<=n;j++)g.fillRect(Math.round(px+(x-px)*j/n),Math.round(py+(y-py)*j/n),Math.max(1,Math.round(S*.45)),Math.max(1,Math.round(S*.45)));
        px=x;py=y;
      }
    }
    if(eye) {g.fillStyle='#ff2a2a';g.fillRect(Math.round(cx-S*.5),Math.round(top-7*S),Math.ceil(S),Math.ceil(2*S));}
  }

  drawDevouredScreen(sim) {
    const bite=sim.bigDragon&&sim.hazards.find(h=>h.kind==='bite');
    if(!(this.biteFx&&this.biteFx.t>0)&&!(bite&&1-bite.t/bite.delay>=.82))return;
    const g=this.g;g.save();g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;
    g.fillStyle='#000000';g.fillRect(0,0,W,H);g.restore();
  }

  tri(x, y, h, w = 3) { const g = this.g; g.beginPath(); g.moveTo(x - w, y); g.lineTo(x + w, y); g.lineTo(x, y + h); g.closePath(); g.fill(); }

  // the newer foes' shots; returns true if it drew one
  drawNewProjectile(pr, t, X, Y, ux, uy) {
    const g = this.g, r = Math.random;
    switch (pr.kind) {
      case 'arrow': case 'arrow_split':
        this.pline(X, Y, X - ux * 5, Y - uy * 5, '#9a7a55'); this.pix(X, Y, '#d8dde3'); this.pix(X - ux * 5, Y - uy * 5, '#ece4d2');
        if (pr.kind === 'arrow_split') { this.pix(X - ux * 2 - uy * 2, Y - uy * 2 + ux * 2, '#ffd84a'); this.pix(X - ux * 2 + uy * 2, Y - uy * 2 - ux * 2, '#ffd84a'); }
        return true;
      case 'bigarrow': // a charged arrow, white-hot at the tip
        this.pline(X, Y, X - ux * 9, Y - uy * 9, '#c9a65a', true); this.pix(X, Y, '#ffffff'); this.pix(X + ux, Y + uy, '#ffe14d');
        if (r() < 0.8) this.parts.push({ kind: 'px', x: X - ux * 4, y: Y - uy * 4, vx: 0, vy: 0, life: 0.2, max: 0.2, color: '#ffe14d' });
        return true;
      case 'arrow_net':
        this.pline(X, Y, X - ux * 5, Y - uy * 5, '#9a7a55');
        for (let i = -1; i <= 1; i++) this.pline(X, Y, X - ux * 3 - uy * i * 3, Y - uy * 3 + ux * i * 3, '#ece4d2');
        return true;
      case 'arrow_bomb':
        this.pline(X, Y, X - ux * 5, Y - uy * 5, '#9a7a55'); g.fillStyle = Math.floor(t * 16) % 2 ? '#ff3030' : '#ffe14d'; g.fillRect(X - 1, Y - 1, 2, 2);
        if (r() < 0.6) this.parts.push({ kind: 'px', x: X, y: Y, vx: 0, vy: -10, life: 0.3, max: 0.3, color: '#8a8f9c' });
        return true;
      case 'card': { // spinning razor cards
        const a = t * 20 + pr.x, cx = Math.cos(a), cy = Math.sin(a) * 0.6;
        this.pline(X - cx * 2, Y - cy * 2, X + cx * 2, Y + cy * 2, '#ffffff'); this.pix(X, Y, '#c23b22');
        return true;
      }
      case 'hex': // a twinkling polymorph star
        g.fillStyle = Math.floor(t * 20) % 2 ? '#ff9ad8' : '#c9a0ff'; g.fillRect(X - 1, Y, 3, 1); g.fillRect(X, Y - 1, 1, 3); this.pix(X, Y, '#ffffff');
        if (r() < 0.7) this.parts.push({ kind: 'px', x: X, y: Y, vx: (r() - .5) * 10, vy: (r() - .5) * 10, life: 0.3, max: 0.3, color: r() < 0.5 ? '#ff9ad8' : '#ffffff' });
        return true;
      case 'heart':
        g.fillStyle = '#ff9ad8'; g.fillRect(X - 2, Y - 1, 2, 1); g.fillRect(X + 1, Y - 1, 2, 1); g.fillRect(X - 2, Y, 5, 1); g.fillRect(X - 1, Y + 1, 3, 1); this.pix(X, Y + 2, '#ff9ad8');
        return true;
      case 'foxfire': // a blue ghost flame
        g.fillStyle = '#7fd0ff'; g.fillRect(X - 1, Y - 1, 3, 3); this.pix(X, Y - 2, Math.floor(t * 16) % 2 ? '#ffffff' : '#bfe0ff'); this.pix(X, Y, '#ffffff');
        if (r() < 0.8) this.parts.push({ kind: 'px', x: X - ux * 2, y: Y - uy * 2, vx: 0, vy: -8, life: 0.35, max: 0.35, color: r() < 0.5 ? '#7fd0ff' : '#3f8cff' });
        return true;
      case 'feather': {
        const c = pr.src && pr.src.rebirths ? (pr.src.rebirths >= 2 ? '#ffffff' : '#6fc3ff') : '#ff7a1a';
        this.pline(X, Y, X - ux * 4, Y - uy * 4, c); this.pix(X - uy, Y + ux, '#ffd84a');
        if (r() < 0.7) this.parts.push({ kind: 'px', x: X - ux * 3, y: Y - uy * 3, vx: 0, vy: -10, life: 0.25, max: 0.25, color: r() < 0.5 ? c : '#ffe14d' });
        return true;
      }
      case 'moonblade': { // a wide crescent of moonlight, sweeping across
        for (let i = -5; i <= 5; i++) { const bend = Math.abs(i) * 0.5; this.pix(X - uy * i - ux * bend, Y + ux * i - uy * bend, Math.abs(i) > 3 ? '#9fd8ff' : '#ffffff'); this.pix(X - uy * i - ux * (bend + 1), Y + ux * i - uy * (bend + 1), '#bfe0ff'); }
        if (r() < 0.6) this.parts.push({ kind: 'px', x: X, y: Y, vx: 0, vy: 0, life: 0.3, max: 0.3, color: '#9fd8ff' });
        return true;
      }
      case 'swallow': // a flying sword, turning like a swallow
        this.pline(X, Y, X - ux * 6, Y - uy * 6, '#d8dde3'); this.pix(X - ux * 6, Y - uy * 6, INK.gold); this.pix(X, Y, '#ffffff');
        if (r() < 0.7) this.parts.push({ kind: 'px', x: X - ux * 3, y: Y - uy * 3, vx: 0, vy: 0, life: 0.25, max: 0.25, color: '#9fd8ff' });
        return true;
      case 'inkhook': {
        const src = pr.src;
        if (src && !src.dead) { const x0 = sx(src.x), y0 = sy(src.y) - 7, n = Math.max(1, Math.floor(Math.hypot(X - x0, Y - y0) / 2)); for (let i = 0; i < n; i++) this.pix(x0 + (X - x0) * i / n, y0 + (Y - y0) * i / n, i % 3 ? '#141414' : '#c23b22'); }
        this.pline(X, Y, X - uy * 3, Y + ux * 3, '#141414'); return true;
      }
      case 'inkorb': g.fillStyle = '#141414'; g.fillRect(X - 1, Y - 1, 3, 3); this.pix(X, Y, '#ece4d2'); if (r() < 0.6) this.parts.push({ kind: 'px', x: X, y: Y, vx: 0, vy: 4, life: 0.4, max: 0.4, color: '#3a3a40' }); return true;
      case 'chesspiece': { const white = Math.floor(pr.x) % 2; g.fillStyle = white ? '#ece4d2' : '#141414'; g.fillRect(X - 1, Y - 1, 2, 3); this.pix(X, Y - 2, white ? '#ece4d2' : '#141414'); return true; }
      case 'note': g.fillStyle = '#141414'; g.fillRect(X, Y - 3, 1, 4); g.fillRect(X - 1, Y, 2, 2); this.pix(X + 1, Y - 3, '#141414'); return true;
      case 'spine': this.pline(X, Y, X - ux * 3, Y - uy * 3, '#ece4d2'); this.pix(X, Y, '#9ad04a'); return true;
      case 'bubble': for (let i = 0; i < 8; i++) this.pix(X + Math.round(Math.cos(i * 0.785) * 2), Y + Math.round(Math.sin(i * 0.785) * 2), '#bfe8ff'); this.pix(X - 1, Y - 1, '#ffffff'); return true;
      case 'web': g.fillStyle = '#ece4d2'; g.fillRect(X - 1, Y - 1, 2, 2); if (pr.src && !pr.src.dead) { g.globalAlpha = 0.4; this.pline(X, Y, sx(pr.src.x), sy(pr.src.y) - 5, '#d8d0c0'); g.globalAlpha = 1; } return true;
      case 'acid': case 'venom':
        g.fillStyle = '#9ad04a'; g.fillRect(X - 1, Y - 1, 2, 2); this.pix(X, Y - 1, '#e8ffb0');
        if (r() < 0.5) this.parts.push({ kind: 'px', x: X, y: Y, vx: 0, vy: 8, g: 60, life: 0.3, max: 0.3, color: '#4b7a2a' });
        return true;
      case 'scythehook': case 'tentacle': { // a hooked chain (or a fleshy tentacle) back to whoever threw it
        const src = pr.src, fl = pr.kind === 'tentacle';
        if (src && !src.dead) {
          const x0 = sx(src.x), y0 = sy(src.y) - 7, n = Math.max(1, Math.floor(Math.hypot(X - x0, Y - y0) / 2));
          for (let i = 0; i < n; i++) this.pix(x0 + (X - x0) * i / n, y0 + (Y - y0) * i / n + (fl ? Math.sin(t * 20 + i) : 0), fl ? (i % 2 ? '#c86b8a' : '#7a3a5a') : i % 2 ? '#8a8f9c' : '#2a2a35');
        }
        if (fl) { this.pix(X, Y, '#ff9ad8'); return true; }
        this.pline(X, Y, X - uy * 3, Y + ux * 3, '#d8dde3'); this.pline(X, Y, X + ux * 2, Y + uy * 2, '#d8dde3');
        return true;
      }
      case 'crescent': // a green crescent of soul energy, sweeping sideways
        for (let i = -3; i <= 3; i++) { const bend = Math.abs(i) * 0.6; this.pix(X - uy * i - ux * bend, Y + ux * i - uy * bend, Math.abs(i) > 2 ? '#c9ffd8' : '#5dff9a'); }
        if (r() < 0.6) this.parts.push({ kind: 'px', x: X, y: Y, vx: 0, vy: -6, life: 0.3, max: 0.3, color: '#5dff9a' });
        return true;
    }
    return false;
  }

  // Effects for the newer foes' events.
  ingestNew(ev, num, burst) {
    const P = this.parts, ring = (r0, r1, color, life = 0.3) => P.push({ kind: 'ring', x: ev.x, y: ev.y, r0, r1, life, max: life, color });
    switch (ev.type) {
      case 'armorup': num(ev, 'SUPER ARMOR', '#ff3a1a', -10, 0.9); ring(14, 3, '#ff3a1a'); burst(ev, 14, 90, ['#ff3a1a', '#5a1010', '#ff8a5a'], 0.5, -60); this.snd('roar'); this.shake = Math.max(this.shake, 3); break;
      case 'flurryhit': {
        const look = ABILITY_FX[ev.id] || ABILITY_FX.rush, a = Math.atan2(ev.fy, ev.fx), spin = ev.arc >= 3.1;
        if (spin) P.push({ kind: 'arcring', x: ev.x - ev.fx * 8, y: ev.y - ev.fy * 8, r: ev.range * 0.8, c: look.c[0], life: 0.25, max: 0.25, a0: Math.random() * 6.28 });
        else P.push({ kind: 'arc', x: ev.x, y: ev.y, a, life: 0.12, max: 0.12, color: look.c[0], s: (ev.scale || 1) * (ev.arc > 1 ? 1.4 : 0.9) });
        if (ev.last) { P.push({ kind: 'star', x: sx(ev.x), y: sy(ev.y) - 5, life: 0.1, max: 0.1, s: 1.5 }); this.shake = Math.max(this.shake, 3); }
        this.snd(look.snd[1] || 'whoosh');
        break;
      }
      case 'lobland': {
        const k = ev.kind;
        if (k === 'boulder') { ring(2, ev.r, '#867b69', 0.35); burst(ev, 16, 140, ['#5a5f66', '#a8a294', '#867b69'], 0.5, 200); this.shake = Math.max(this.shake, 5); this.snd('rock'); }
        else if (k === 'flask') {
          const c = { fire: ['#ff5a1a', '#ffe14d'], venom: ['#9ad04a', '#4b7a2a'], frost: ['#9fd8ff', '#ffffff'], acid: ['#c8e04a', '#7a9a2a'], blast: ['#c050ff', '#ffb04a'] }[ev.flask] || ['#5fe8c8', '#ffffff'];
          burst(ev, 6, 80, ['#ece4d2', '#ffffff'], 0.3, 150); burst(ev, 14, 110, c, 0.5); ring(2, ev.r, c[0]);
          if (ev.flask === 'blast') this.recipe('boom', ev, c);
          if (ev.flask === 'frost') this.flash('rgba(180,230,255,0.15)', 0.05);
          this.snd('glass');
        } else if (k === 'blast') { this.recipe('boom', ev, ['#ffb04a', '#ff5a1a']); this.snd('boom'); }
        else if (k === 'webball') { burst(ev, 12, 70, ['#ece4d2', '#bfb6a2'], 0.4); this.snd('web'); }
        else if (k === 'venomball') { burst(ev, 12, 70, ['#9ad04a', '#4b7a2a'], 0.4, 100); this.snd('squelch'); }
        else if (k === 'magma') { ring(2, ev.r, '#ff5a1a'); burst(ev, 16, 120, ['#ff3a1a', '#ffb04a', '#ffe14d'], 0.5, -40); this.snd('fire'); this.shake = Math.max(this.shake, 3); }
        else if (k === 'arrowlob') { burst(ev, 3, 40, ['#7a705f']); this.snd('hit'); }
        else burst(ev, 8, 70, [INK.rice]);
        break;
      }
      case 'sever': num(ev, 'SEVERED', '#ff5a3c', -16, 0.9); burst({ ...ev, y: ev.y - 10 }, 18, 130, ['#c23b22', '#8a1020', '#2f7f6f'], 0.6, 220); this.snd('slash'); this.shake = Math.max(this.shake, 4); break;
      case 'regrow': num(ev, 'GROWS BACK', '#9fd36a', -18, 0.9); burst({ ...ev, y: ev.y - 10 }, 12, 60, ['#7da36a', '#2f7f6f'], 0.6, -40); this.snd('hiss'); break;
      case 'cauterize': num(ev, 'SEALED', '#ffb04a', -18, 0.9); burst({ ...ev, y: ev.y - 10 }, 14, 80, ['#ff5a1a', '#ffe14d', '#3d4760'], 0.5, -60); this.snd('fire'); break;
      case 'headwind': this.snd(ev.kind === 'flame' ? 'charge' : 'hiss'); break;
      case 'headbite': this.recipe('claw', ev, ['#ece4d2', '#c23b22']); this.snd('bite'); break;
      case 'headspit': this.snd('squelch'); break;
      case 'egg': num(ev, 'BREAK THE EGG!', '#ffd84a', -14, 1.6); ring(18, 3, '#ff7a1a', 0.5); burst(ev, 20, 120, ['#ff7a1a', '#ffd84a', '#ffffff'], 0.6, -30); this.snd('crackle'); break;
      case 'rebirth': {
        const c = ev.n >= 2 ? '#ffffff' : '#6fc3ff';
        this.banner = { text: 'REBORN', life: 1.4 };
        for (let i = 0; i < 3; i++) ring(4, 36 + i * 10, i === 1 ? '#ffffff' : c, 0.5 + i * 0.1);
        burst(ev, 40, 240, [c, '#ffd84a', '#ff7a1a', '#ffffff'], 0.8, -40);
        P.push({ kind: 'column', x: ev.x, y: ev.y, color: c, life: 0.4, max: 0.4, w: 5 });
        this.flash('rgba(255,200,120,0.35)', 0.12); this.shake = Math.max(this.shake, 8); this.snd('screech'); this.snd('ultboom');
        break;
      }
      case 'heatup': num(ev, 'HEAT ' + ['', 'I', 'II', 'III'][ev.lvl], ev.lvl >= 3 ? '#ffffff' : '#ff8a3a', -16, 0.9); burst(ev, 10, 80, ['#ff7a1a', '#ffe14d'], 0.4, -60); this.snd('fire'); break;
      case 'harden': ring(10, 4, '#a8a294', 0.25); if (ev.n >= 5) { num(ev, 'STONESKIN', '#c8c0ae', -14, 0.9); this.snd('rock'); } break;
      case 'crack': num(ev, 'CRACK', '#c8c0ae', -12, 0.6); burst(ev, 10, 110, ['#5a5f66', '#a8a294'], 0.45, 200); this.snd('rock'); break;
      case 'mutate': num(ev, (ev.name || 'MUTATION').toUpperCase(), '#c86b8a', -16, 1.3); burst(ev, 22, 120, ['#c86b8a', '#9ad04a', '#7a3a5a'], 0.6, 160); ring(3, 16, '#9ad04a'); this.snd('squelch'); this.shake = Math.max(this.shake, 3); break;
      case 'momentum': num(ev, 'MOMENTUM x' + ev.n, '#ff8a3a', -14, 0.9); ring(3, 10, '#ff8a3a', 0.2); this.snd('punch'); break;
      case 'slip': num(ev, 'SLIP', '#a8a196', -10, 0.4); break;
      case 'clank': if (Math.random() < 0.6) { burst(ev, 3, 50, ['#ffffff', '#d2502a']); this.snd('block'); } break;
      case 'molt': num(ev, 'MOLT', '#f2a07a', -14, 1.0); burst(ev, 24, 160, ['#d2502a', '#f2a07a', '#7a3010'], 0.7, 220); this.snd('crackle'); this.shake = Math.max(this.shake, 3); break;
      case 'grab': num(ev, 'GRABBED', '#ff5a3c', -12, 0.7); this.snd('snap'); this.shake = Math.max(this.shake, 2); break;
      case 'throw': burst(ev, 8, 60, ['#7a705f'], 0.4); this.snd('whoosh'); break;
      case 'skitter': burst(ev, 6, 50, ['#7a705f']); this.snd('web'); break;
      case 'climbdown': burst(ev, 10, 60, ['#7a705f', '#2a1830'], 0.5, 120); break;
      case 'climbburst': num(ev, '!', '#ff2a3a', -10, 0.5); burst(ev, 18, 140, ['#867b69', '#5a5f66', '#2a1830'], 0.5, 220); this.snd('heavyhit'); this.shake = Math.max(this.shake, 4); break;
      case 'climbback': num(ev, 'CLIMBS BACK', '#c9a0ff', -12, 0.9); burst(ev, 8, 50, ['#7a705f']); this.snd('web'); break;
      case 'webbed': num(ev, 'WEBBED', '#ece4d2', -12, 0.7); burst(ev, 8, 50, ['#ece4d2', '#bfb6a2']); this.snd('web'); break;
      case 'cocoon': num(ev, 'COCOONED', '#ece4d2', -14, 0.9); burst(ev, 16, 80, ['#ece4d2', '#ffffff', '#bfb6a2'], 0.5); this.snd('web'); break;
      case 'poof':
        burst(ev, 14, 70, ['#ece4d2', '#bfb6a2', '#ffffff'], 0.5, -20);
        if (ev.hair) burst(ev, 8, 90, ['#c9a65a', '#ffd84a'], 0.5, 80);
        if (ev.decoy || ev.sub) { burst(ev, 8, 120, ['#ff9ad8', '#ffd84a', '#7fd0ff', '#9fd36a'], 0.6, 120); num(ev, ev.sub ? 'DECOY!' : 'POOF', '#ff9ad8', -10, 0.7); }
        this.snd('poof');
        break;
      case 'polymorph': num(ev, 'POLYMORPH!', '#ff9ad8', -14, 1.0); burst(ev, 18, 110, ['#ff9ad8', '#c9a0ff', '#ffffff'], 0.5); this.snd('poof'); this.snd('magic'); break;
      case 'charm': num(ev, 'CHARMED', '#ff9ad8', -14, 0.9); for (let i = 0; i < 4; i++) P.push({ kind: 'num', text: '*', x: sx(ev.x) + (Math.random() - .5) * 12, y: sy(ev.y) - 14, vy: -12, life: 0.7, max: 0.7, color: '#ff9ad8' }); this.snd('foxfire'); break;
      case 'morphStart': num(ev, '...', ev.color || INK.rice, -10, 1.0); ring(18, 2, ev.color || '#7fd0ff', 1.0); this.snd('riser'); break;
      case 'trueform':
        this.banner = { text: (ev.name || '').toUpperCase(), life: 1.4 };
        for (let i = 0; i < 2; i++) ring(4, 30 + i * 12, i ? '#ffffff' : ev.color, 0.5);
        burst(ev, 34, 200, [ev.color, '#ffffff', '#ff9ad8'], 0.7); this.flash('rgba(160,210,255,0.3)', 0.1); this.shake = Math.max(this.shake, 5); this.snd('gong'); this.snd('foxfire');
        break;
      case 'shiftform': num(ev, (ev.name || '').toUpperCase(), ev.color || INK.rice, -16, 1.0); burst(ev, 20, 110, [ev.color || '#c9a66b', '#ece4d2', '#8a8f9c'], 0.5); ring(3, 16, ev.color || '#c9a66b'); this.snd(ev.back ? 'poof' : 'howl'); break;
      case 'backflip': burst(ev, 6, 40, ['#7a705f']); this.snd('whoosh'); break;
      case 'splitarrow': P.push({ kind: 'star', x: sx(ev.x), y: sy(ev.y) - 5, life: 0.06, max: 0.06, color: '#ffd84a' }); this.snd('zap'); break;
      case 'elixir': num(ev, 'ELIXIR', '#5fe8c8', -14, 0.9); burst(ev, 14, 60, ['#5fe8c8', '#ffffff'], 0.6, -60); this.snd('gulp'); break;
      case 'zonecast': ring(2, 14, { heavy: '#7a4ad0', wardarray: '#e8c34a' }[ev.variant] || '#ece4d2'); this.snd(ev.variant === 'heavy' ? 'warp' : ev.variant === 'wardarray' ? 'chime' : 'magic'); break;
      case 'formationcast': this.snd('chime'); break;
      case 'baguaburst': {
        for (let i = 0; i < 16; i++) {
          const a = i / 16 * Math.PI * 2, da = Math.atan2(Math.sin(a - ev.gate), Math.cos(a - ev.gate));
          if (Math.abs(da) < 0.45) continue; // the gate stays dark
          P.push({ kind: 'line', x0: sx(ev.x), y0: sy(ev.y) - 2, x1: sx(ev.x + Math.cos(a) * ev.r), y1: sy(ev.y + Math.sin(a) * ev.r) - 2, life: 0.4, max: 0.4, color: i % 2 ? '#e8c34a' : '#ffffff' });
        }
        ring(4, ev.r, '#e8c34a', 0.4); burst(ev, 26, 180, ['#e8c34a', '#ffffff', '#c23b22'], 0.5);
        this.flash('rgba(255,230,140,0.25)', 0.08); this.shake = Math.max(this.shake, 5); this.snd('boom'); this.snd('chime');
        break;
      }
      case 'lifegate': num(ev, 'LIFE GATE', '#9fd36a', -14, 0.9); this.snd('holy'); break;
      case 'swap': P.push({ kind: 'line', x0: sx(ev.x), y0: sy(ev.y) - 5, x1: sx(ev.tx), y1: sy(ev.ty) - 5, life: 0.3, max: 0.3, color: '#c9a0ff', w: 2 }); burst(ev, 10, 70, ['#c9a0ff', '#e8c34a']); burst({ x: ev.tx, y: ev.ty }, 10, 70, ['#c9a0ff', '#e8c34a']); num({ x: ev.tx, y: ev.ty }, 'SWAPPED', '#c9a0ff', -12, 0.8); this.snd('warp'); break;
      case 'escaped': num(ev, 'SLIPPED FREE', '#9fd3a8', -12, 0.7); break;
      case 'shatter': burst(ev, 6, 70, ['#e8c34a', '#fff3b0']); this.snd('glass'); break;
      case 'claimed': num(ev, 'JOINS THE DEAD', '#c9a0ff', -16, 1.0); break;
      case 'lift': num(ev, 'LIFTED', '#c9a0ff', -14, 0.8); ring(10, 2, '#c9a0ff', 0.3); this.snd('warp'); break;
      case 'iaidraw': { // the line he leaves behind, and petals scattering off it
        P.push({ kind: 'line', x0: sx(ev.x), y0: sy(ev.y) - 6, x1: sx(ev.x1), y1: sy(ev.y1) - 6, life: 0.35, max: 0.35, color: '#ffffff', w: 2 });
        P.push({ kind: 'line', x0: sx(ev.x), y0: sy(ev.y) - 5, x1: sx(ev.x1), y1: sy(ev.y1) - 5, life: 0.5, max: 0.5, color: ev.color });
        for (let i = 0; i < 16; i++) { const u = Math.random(); P.push({ kind: 'px', x: sx(ev.x + (ev.x1 - ev.x) * u), y: sy(ev.y + (ev.y1 - ev.y) * u) - 6, vx: (Math.random() - .5) * 30, vy: (Math.random() - .5) * 20, g: 20, life: 0.8, max: 0.8, color: i % 2 ? '#ff9ad8' : '#ffffff' }); }
        this.flash('rgba(255,255,255,0.35)', 0.05); this.shake = Math.max(this.shake, 4); this.snd('slash'); this.snd('chime');
        break;
      }
      case 'undying': {
        const names = ['', 'SECOND LIFE', 'THIRD LIFE', 'FOURTH LIFE', 'LAST LIFE'];
        this.banner = { kicker: 'UNDYING HEART', text: names[ev.n] || 'AGAIN', color: ev.color, life: 1.8 };
        for (let i = 0; i < 3; i++) ring(4, 22 + i * 10, i === 1 ? '#ffffff' : ev.color, 0.6);
        burst(ev, 40, 200, ['#ff9ad8', '#ffffff', '#ffd8ec'], 0.9, -20); this.flash('rgba(255,180,220,0.3)', 0.1); this.shake = Math.max(this.shake, 6); this.snd('gong'); this.snd('piano');
        break;
      }
      case 'focus': num(ev, 'CLEAR MIND x' + ev.n, '#ffb7d5', -16, 0.9); this.snd('chime'); break;
      case 'vanish': burst(ev, 20, 120, ['#ff9ad8', '#ffffff'], 0.5); this.snd('whoosh'); break;
      case 'reappear': burst(ev, 14, 80, ['#ff9ad8', '#ffffff'], 0.4); P.push({ kind: 'star', x: sx(ev.x), y: sy(ev.y) - 8, life: 0.15, max: 0.15, s: 2 }); this.snd('chime'); break;
      case 'truehit': P.push({ kind: 'star', x: sx(ev.x), y: sy(ev.y) - 5, life: 0.1, max: 0.1, color: '#ffb7d5', s: 1.5 }); break;
      case 'beamhit': {
        const c = { riverwave: ['#9fd8ff', '#ffffff'], shadowcut: ['#ffffff', '#9fd8ff'], onethrust: ['#ffffff', '#9fd8ff'], onesword: ['#ffffff', '#bfe0ff'], inkstroke: ['#141414', '#ece4d2'], dragonstrike: ['#141414', '#5a5f66'], ruyi: ['#ffd84a', '#c23b22'], pillar: ['#ffd84a', '#ffffff'], cut: ['#ffffff', '#bfe8ff'], bigcut: ['#ffb7d5', '#ffffff'], sever: ['#ffffff', '#141414'], exterminate: ['#ffd84a', '#ffffff'] }[ev.variant] || ['#ffffff', '#ff5a3c'];
        const big = ev.w >= 14;
        P.push({ kind: 'line', x0: sx(ev.x), y0: sy(ev.y) - 4, x1: sx(ev.x1), y1: sy(ev.y1) - 4, life: big ? 0.45 : 0.2, max: big ? 0.45 : 0.2, color: c[0], w: big ? 3 : 1 });
        if (big) P.push({ kind: 'line', x0: sx(ev.x), y0: sy(ev.y) - 3, x1: sx(ev.x1), y1: sy(ev.y1) - 3, life: 0.6, max: 0.6, color: c[1], w: 1 });
        for (let i = 0; i < (big ? 24 : 6); i++) { const u = Math.random(); P.push({ kind: 'px', x: sx(ev.x + (ev.x1 - ev.x) * u), y: sy(ev.y + (ev.y1 - ev.y) * u) - 4, vx: (Math.random() - .5) * 60, vy: (Math.random() - .5) * 40, life: 0.4, max: 0.4, color: c[i % 2] }); }
        if (ev.variant === 'bigcut') this.startShatter(sx((ev.x + ev.x1) / 2), sy((ev.y + ev.y1) / 2) - 4, false);
        if (ev.variant === 'onesword') this.startSeparate(sx((ev.x + ev.x1) / 2), sy((ev.y + ev.y1) / 2) - 4, Math.atan2((ev.y1 - ev.y) * SQ, ev.x1 - ev.x));
        if (ev.variant === 'sever') this.startSever(sx((ev.x + ev.x1) / 2), sy((ev.y + ev.y1) / 2) - 4, Math.atan2((ev.y1 - ev.y) * SQ, ev.x1 - ev.x));
        if (big) { this.shake = Math.max(this.shake, ev.variant === 'sever' ? 12 : 7); this.flash(ev.variant === 'sever' ? 'rgba(255,255,255,0.6)' : 'rgba(255,230,140,0.3)', ev.variant === 'sever' ? 0.18 : 0.08); }
        this.snd(ev.variant === 'cut' || ev.variant === 'cleave' ? 'slash' : ev.variant === 'sever' ? 'ultboom' : big ? 'boom' : 'heavyhit');
        break;
      }
      case 'staffspin': num(ev, 'STAFF SPIN', '#ffd84a', -16, 0.7); this.snd('whoosh'); break;
      case 'deflect': num(ev, 'DEFLECT', '#ffd84a', -12, 0.5); burst(ev, 6, 90, ['#ffd84a', '#ffffff'], 0.25); this.snd('parry'); break;
      case 'broodbuff': num(ev, 'EMPOWERED', '#b84aff', -12, 0.7); burst(ev, 10, 80, ['#b84aff', '#9ad04a', '#ffffff'], 0.5, -40); this.snd('squelch'); break;
      case 'broodfeed': P.push({ kind: 'line', x0: sx(ev.x), y0: sy(ev.y) - 3, x1: sx(ev.tx), y1: sy(ev.ty) - 8, life: 0.35, max: 0.35, color: '#9ad04a' }); break;
      case 'swordname': case 'swordchain': case 'swordformation': break; // drawn in swordfx.js
      case 'swordghost': burst(ev, 4, 40, ['#7f8cff', '#1c2440'], 0.3); break;
      case 'swordlightdash': this.snd('slash'); break;
      case 'swordshatter': break;
      case 'stillness': this.snd('chime'); break;
      case 'onesworddraw': this.snd('riser'); break;
      case 'forbidden': num(ev, 'THE FORBIDDEN SWORD TAKES ITS PRICE', '#ff5a7a', -26, 1.6); burst(ev, 16, 80, ['#ff5a7a', '#9fd8ff'], 0.6); break;
      case 'inkblock': num(ev, 'UNTOUCHED', '#ece4d2', -12, 0.5); burst(ev, 6, 70, ['#141414', '#c23b22'], 0.3); this.snd('block'); break;
      case 'umbrellaopen': break;
      case 'inkdissolve': burst(ev, 12, 50, ['#141414', '#3a3a40'], 0.5); num(ev, 'ERASED', '#ece4d2', -10, 0.7); break;
      case 'scholarstep': burst(ev, 8, 40, ['#141414', '#5a5f66'], 0.5); burst({ x: ev.tx, y: ev.ty }, 8, 40, ['#141414', '#5a5f66'], 0.5); break;
      case 'scripture': this.banner = { kicker: 'POLLUTED SCRIPTURE', text: ev.name, color: '#ece4d2', life: 1.8 }; this.flash('rgba(20,20,20,0.3)', 0.08); break;
      case 'recorded': num(ev, 'THE PAINTING RECORDS: ' + (ev.name || '').toUpperCase(), '#141414', -26, 1.6); break;
      case 'paintingremembers': num(ev, 'THE PAINTING REMEMBERS', '#ece4d2', -22, 1.0); burst(ev, 10, 60, ['#141414', '#ece4d2'], 0.5); break;
      case 'headroll': break;
      case 'headgrow': num(ev, 'A HEAD BECOMES ' + (ev.name || '').toUpperCase(), '#ece4d2', -14, 1.2); ring(2, 14, '#141414', 0.4); burst(ev, 22, 110, ['#141414', '#5a5f66', '#ece4d2'], 0.6, -40); break;
      case 'inkdragonrise': burst(ev, 20, 90, ['#141414', '#3a3a40', '#ece4d2'], 0.6, -40); break;
      case 'dragonmerge': burst(ev, 14, 120, ['#141414', '#3a3a40'], 0.5, -120); break;
      case 'bigdragon': this.banner = { text: 'THE DRAGON DEVOURS THE SUN', life: 1.6 }; break;
      case 'redeye': this.flash('rgba(255,30,30,0.35)', 0.15); this.shake = Math.max(this.shake, 4); break;
      case 'dragonbite': this.biteFx = { t: 0.9 }; burst(ev, 40, 260, ['#141414', '#3a3a40', '#ece4d2'], 0.7); this.shake = Math.max(this.shake, 16); this.snd('ultboom'); break;
      case 'mikiri': num(ev, 'MIKIRI', '#ffb7d5', -12, 0.5); P.push({ kind: 'star', x: sx(ev.x), y: sy(ev.y) - 7, life: 0.08, max: 0.08, color: '#ffffff' }); this.snd('parry'); break;
      case 'skystaff': num(ev, 'RUYI JINGU BANG', '#ffd84a', -20, 1.0); this.snd('riser'); break;
      case 'broodshield': num(ev, 'THE BROOD SHIELDS HER', '#b84aff', -18, 1.4); this.snd('hiss'); break;
      case 'forgets': num(ev, 'LETS GO: ' + ev.cat.replace('ab:', '').toUpperCase(), '#a8a196', -30, 1.0); break;
      case 'skysplit': this.banner = { text: 'THE SKY IS CUT IN TWO', life: 1.6 }; this.flash('rgba(255,255,255,0.5)', 0.15); this.snd('riser'); break;
      case 'cloud': for (let i = 0; i < 12; i++) P.push({ kind: 'px', x: sx(ev.x) + (Math.random() - .5) * 16, y: sy(ev.y) - 2 + (Math.random() - .5) * 4, vx: (Math.random() - .5) * 30, vy: -5, life: 0.6, max: 0.6, color: i % 3 ? '#ffffff' : '#ffe9a8' }); if (ev.tx !== undefined) P.push({ kind: 'line', x0: sx(ev.x), y0: sy(ev.y) - 12, x1: sx(ev.tx), y1: sy(ev.ty) - 20, life: 0.3, max: 0.3, color: '#ffe9a8' }); this.snd('whoosh'); break;
      case 'monkeyswarm': num(ev, 'TEN THOUSAND MONKEYS', '#ffd84a', -16, 1.2); burst(ev, 30, 160, ['#c9a65a', '#ffd84a', '#ffffff'], 0.6); this.snd('wind'); this.snd('poof'); break;
      case 'fireproof': if (Math.random() < 0.5) num(ev, 'FIREPROOF', '#ffd84a', -12, 0.6); break;
      case 'wheelturn': ring(3, ev.big ? 30 : 12, '#ffd84a', 0.35); num(ev, ev.cat === 'everything' ? 'THE WHEEL TURNS' : 'WHEEL: ' + ev.cat.replace('ab:', '').toUpperCase(), '#e8c34a', -22, 0.8); this.snd('ring'); break;
      case 'adapted': num(ev, 'ADAPTED: ' + ev.cat.replace('ab:', '').toUpperCase(), '#ffffff', -28, 1.4); ring(4, 24, '#ffffff', 0.5); this.flash('rgba(255,240,200,0.2)', 0.06); this.snd('gong'); break;
      case 'adaptblock': if (Math.random() < 0.4) num(ev, 'ADAPTED', '#e8c34a', -14, 0.5); burst(ev, 4, 60, ['#ffd84a', '#ffffff']); break;
      case 'transfuse': P.push({ kind: 'line', x0: sx(ev.x), y0: sy(ev.y) - 8, x1: sx(ev.tx), y1: sy(ev.ty) - 4, life: 0.4, max: 0.4, color: '#9ad04a' }); this.snd('squelch'); break;
      case 'bileburst': ring(2, 18, '#9ad04a', 0.3); burst(ev, 20, 140, ['#9ad04a', '#4b7a2a', '#e8ffb0'], 0.5, 160); this.snd('squelch'); this.snd('boom'); break;
      case 'swarm': num(ev, 'THE SWARM', '#b84aff', -16, 1.0); burst(ev, 20, 120, ['#b84aff', '#5a2a7a', '#9ad04a'], 0.6); this.snd('hiss'); this.snd('roar'); break;
      case 'foreseen': num(ev, 'FORESEEN', '#c9a0ff', -10, 0.6); this.snd('whoosh'); break;
      case 'seriouspunch': this.banner = { text: 'SERIOUS PUNCH', life: 1.0 }; ring(4, 40, '#ffffff', 0.4); burst(ev, 30, 260, ['#ffffff', '#ffe14d'], 0.5); this.flash('rgba(255,255,255,0.5)', 0.1); this.shake = Math.max(this.shake, 10); this.snd('ultboom'); break;
      case 'sharingan': num(ev, 'COPIED', '#ff2a3a', -12, 0.6); ring(6, 2, '#ff2a3a', 0.25); break;
      case 'berserk': this.banner = { kicker: 'BERSERKER ARMOR', text: 'NOT YET', color: '#c23b22', life: 1.4 }; burst(ev, 26, 160, ['#141414', '#c23b22', '#5a1010'], 0.6); this.shake = Math.max(this.shake, 6); this.snd('roar'); break;
      case 'theworld': this.banner = { kicker: 'THE WORLD', text: 'TIME STOPS', color: '#ffd84a', life: 1.6 }; this.snd('gong'); break;
      case 'standrush': num(ev, 'ORA ORA ORA', '#c9a0ff', -18, 0.9); this.snd('punch'); break;
      case 'orahit': { const sp = 18; P.push({ kind: 'px', x: sx(ev.x) + (Math.random() - .5) * sp, y: sy(ev.y) - 6 + (Math.random() - .5) * 8, vx: 0, vy: 0, life: 0.12, max: 0.12, color: '#c9a0ff' }); P.push({ kind: 'star', x: sx(ev.x) + (Math.random() - .5) * 10, y: sy(ev.y) - 6, life: 0.06, max: 0.06, color: '#e0c8ff' }); this.snd('punch'); break; }
      case 'element': {
        const c = { fire: ['#ff5a1a', '#ffe14d'], water: ['#6fc3ff', '#ffffff'], earth: ['#867b69', '#a8a294'], air: ['#e8f0f8', '#b8c8d8'] }[ev.el];
        burst(ev, 10, 90, c, 0.4, ev.el === 'fire' ? -60 : ev.el === 'earth' ? 160 : 0); this.snd({ fire: 'fire', water: 'pop', earth: 'rock', air: 'wind' }[ev.el]);
        break;
      }
      case 'kaioken': this.banner = { text: 'KAIOKEN', life: 1.0 }; burst(ev, 20, 140, ['#ff2a2a', '#ffffff'], 0.4); this.snd('roar'); break;
      case 'dot': if (ev.dmg >= 1) P.push({ kind: 'num', x: sx(ev.x) + (Math.random() - .5) * 6, y: sy(ev.y) - 12, vy: -12, life: 0.45, max: 0.45, text: '' + ev.dmg, color: ev.kind === 'fire' ? '#ffb04a' : '#9ad04a' }); break;
    }
  }

  drawProjectile(pr, t) {
    const g = this.g;
    if (pr.lob) return this.drawLob(pr, t);
    if (this.swordProjectile(pr, t)) return;
    const X = Math.round(sx(pr.x)), Y = Math.round(sy(pr.y)) - 5;
    // trails
    const trail = { rocket: ['#8a8f9c', '#5a6278'], fire: ['#ff5a1a', '#ffb04a'], orb: ['#e8c34a'], sword: ['#9fd8ff'], qi: ['#e8f4ff'], hellfire: ['#ff5a1a', '#ffe14d', '#ffb04a'], bat: ['#8a1020'], axe: ['#c23b22'], crescent: ['#5dff9a'], foxfire: ['#3f8cff'] }[pr.kind];
    if (trail && !(pr.delay > 0) && Math.random() < 0.7) {
      this.parts.push({ kind: 'px', x: X + (Math.random() - .5) * 2, y: Y + (Math.random() - .5) * 2, vx: (Math.random() - .5) * 10, vy: pr.kind === 'rocket' ? -8 : 0, life: 0.3, max: 0.3, color: trail[Math.floor(Math.random() * trail.length)] });
    }
    const sp = Math.hypot(pr.vx, pr.vy) || 1, ux = pr.vx / sp, uy = pr.vy / sp * SQ;
    if (this.drawNewProjectile(pr, t, X, Y, ux, uy)) return;
    if (pr.kind === 'axe') { // a spinning war axe
      const a = t * 18;
      g.fillStyle = '#6b4a2f';
      for (let i = -3; i <= 3; i++) g.fillRect(Math.round(X + Math.cos(a) * i), Math.round(Y + Math.sin(a) * i), 1, 1);
      g.fillStyle = '#d8dde3';
      for (let i = -1; i <= 1; i++) g.fillRect(Math.round(X + Math.cos(a) * 3 - Math.sin(a) * i), Math.round(Y + Math.sin(a) * 3 + Math.cos(a) * i), 1, 1);
      return;
    }
    if (pr.kind === 'plasma') { // a cyan plasma bolt
      g.fillStyle = '#7fe0ff'; for (let i = 0; i < 4; i++) g.fillRect(Math.round(X - ux * i), Math.round(Y - uy * i), 1, 1);
      g.fillStyle = '#ffffff'; g.fillRect(X, Y, 1, 1);
      if (Math.random() < 0.5) this.parts.push({ kind: 'px', x: X, y: Y, vx: 0, vy: 0, life: 0.15, max: 0.15, color: '#7fe0ff' });
      return;
    }
    if (pr.kind === 'rail') { // a railgun slug: a long white-hot streak
      g.fillStyle = '#7fe0ff'; for (let i = 0; i < 14; i++) g.fillRect(Math.round(X - ux * i), Math.round(Y - uy * i) + 1, 1, 1);
      g.fillStyle = '#ffffff'; for (let i = 0; i < 14; i++) g.fillRect(Math.round(X - ux * i), Math.round(Y - uy * i), 1, 1);
      return;
    }
    if (pr.kind === 'drone') { // a small drone, red light blinking
      g.fillStyle = '#8a8f9c'; g.fillRect(X - 2, Y, 5, 1); g.fillRect(X - 1, Y - 1, 3, 3);
      g.fillStyle = Math.floor(t * 10 + pr.orbit) % 2 ? '#ff3030' : '#5a1010'; g.fillRect(X, Y, 1, 1);
      return;
    }
    if (pr.kind === 'red') { // Red: a hard crimson point, ringed
      g.globalAlpha = 0.4; this.ellipse(pr.x, pr.y, 5 + Math.sin(t * 30), '#ff3030', false, 0.5); g.globalAlpha = 1;
      g.fillStyle = '#ff3030'; g.fillRect(X - 2, Y - 2, 5, 5); g.fillStyle = '#ffe0e0'; g.fillRect(X - 1, Y - 1, 3, 3);
      if (Math.random() < 0.8) this.parts.push({ kind: 'px', x: X, y: Y, vx: -ux * 40 + (Math.random() - .5) * 20, vy: -uy * 40 + (Math.random() - .5) * 20, life: 0.25, max: 0.25, color: '#ff5050' });
      return;
    }
    if (pr.kind === 'purple') { // Hollow Purple: imaginary mass, erasing what it touches
      const rr = (pr.radius || 13) * 0.75;
      g.globalAlpha = 0.35; g.fillStyle = '#6a10c0'; g.beginPath(); g.arc(X, Y, rr + 4, 0, 7); g.fill();
      g.globalAlpha = 1; g.fillStyle = '#b040ff'; g.beginPath(); g.arc(X, Y, rr, 0, 7); g.fill();
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(X, Y, rr * 0.45, 0, 7); g.fill();
      for (let i = 0; i < 4; i++) this.parts.push({ kind: 'px', x: X + (Math.random() - .5) * rr * 2, y: Y + (Math.random() - .5) * rr * 2, vx: -ux * 50, vy: -uy * 50, life: 0.35, max: 0.35, color: ['#b040ff', '#ffffff', '#3f8cff', '#ff3030'][i] });
      return;
    }
    if (pr.kind === 'clockhand') { // a spinning clock hand
      const a = t * 22 + pr.x;
      g.fillStyle = '#e8c34a';
      for (let i = -3; i <= 3; i++) g.fillRect(Math.round(X + Math.cos(a) * i), Math.round(Y + Math.sin(a) * i * 0.8), 1, 1);
      g.fillStyle = '#141414'; g.fillRect(Math.round(X + Math.cos(a) * 3), Math.round(Y + Math.sin(a) * 2.4), 1, 1);
      return;
    }
    if (pr.kind === 'bat') {
      const up = Math.floor(t * 16 + pr.x) % 2;
      g.fillStyle = INK.ink; g.fillRect(X - 2, Y - up, 2, 1); g.fillRect(X + 1, Y - up, 2, 1); g.fillRect(X, Y, 1, 1);
      g.fillStyle = '#ff2a3a'; g.fillRect(X, Y, 1, 1);
      return;
    }
    if (pr.kind === 'hellfire') { // a burning skull
      g.fillStyle = Math.floor(t * 20) % 2 ? '#ff5a1a' : '#ffb04a';
      g.fillRect(X - 2, Y - 3, 5, 2); g.fillRect(Math.round(X - ux * 3), Math.round(Y - uy * 3) - 1, 2, 2);
      g.fillStyle = '#ece4d2'; g.fillRect(X - 1, Y - 1, 3, 3);
      g.fillStyle = INK.ink; g.fillRect(X - 1, Y, 1, 1); g.fillRect(X + 1, Y, 1, 1);
      return;
    }
    if (pr.kind === 'chain') { // links back to the rider, hook at the end
      if (pr.src && !pr.src.dead) {
        const x0 = sx(pr.src.x), y0 = sy(pr.src.y) - 8, n = Math.max(1, Math.floor(Math.hypot(X - x0, Y - y0) / 2));
        for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? '#8a8f9c' : '#ffb04a'; g.fillRect(Math.round(x0 + (X - x0) * i / n), Math.round(y0 + (Y - y0) * i / n), 1, 1); }
      }
      g.fillStyle = '#ffe14d'; g.fillRect(X - 1, Y - 1, 3, 1); g.fillRect(X + 1, Y, 1, 2);
      return;
    }
    if (pr.kind === 'palm') {
      // a giant golden palm with a halo
      const s = SPRITE_CACHE.palm, sc = 2;
      if (Math.random() < 0.8) this.parts.push({ kind: 'px', x: X + (Math.random() - .5) * 12, y: Y + (Math.random() - .5) * 10, vx: -ux * 30, vy: -uy * 30 - 10, life: 0.4, max: 0.4, color: Math.random() < 0.5 ? '#ffe14d' : '#fff3b0' });
      g.globalAlpha = 0.35; this.ellipse(pr.x, pr.y, 10 + Math.sin(t * 20), '#ffe14d', true); g.globalAlpha = 1;
      g.drawImage(ux < 0 ? s.f : s.n, X - s.w * sc / 2, Y - s.h * sc / 2 - 2, s.w * sc, s.h * sc);
      return;
    }
    if (pr.kind === 'sword' && pr.owner !== 'player') {
      const ax = pr.delay > 0 ? 0 : ux, ay = pr.delay > 0 ? -1 : uy;
      g.fillStyle = '#d8dde3';
      for (let i = 0; i < 6; i++) g.fillRect(Math.round(X - ax * i), Math.round(Y - ay * i), 1, 1);
      g.fillStyle = INK.gold; g.fillRect(Math.round(X - ax * 5), Math.round(Y - ay * 5), 1, 1);
      return;
    }
    if (pr.kind === 'qi' && pr.owner !== 'player') {
      g.fillStyle = '#e8f4ff';
      for (let i = -2; i <= 2; i++) g.fillRect(Math.round(X - uy * i - ux * Math.abs(i) * 0.5), Math.round(Y + ux * i - uy * Math.abs(i) * 0.5), 1, 1);
      return;
    }
    if (pr.owner === 'player') {
      g.fillStyle = INK.rice;
      for (let i = 0; i < 4; i++) g.fillRect(Math.round(X - ux * i), Math.round(Y - uy * i), 1, 1);
      g.fillStyle = INK.gold; g.fillRect(X, Y, 1, 1);
    } else if (pr.kind === 'bullet') {
      g.fillStyle = '#7a6a4a';
      for (let i = 1; i < 4; i++) g.fillRect(Math.round(X - ux * i), Math.round(Y - uy * i), 1, 1);
      g.fillStyle = '#ffe9a8'; g.fillRect(X, Y, 1, 1);
    } else if (pr.kind === 'star') {
      g.fillStyle = '#c8ccd2';
      const f = Math.floor(t * 20) % 2;
      if (f) { g.fillRect(X - 1, Y, 3, 1); g.fillRect(X, Y - 1, 1, 3); }
      else { g.fillRect(X - 1, Y - 1, 1, 1); g.fillRect(X + 1, Y - 1, 1, 1); g.fillRect(X - 1, Y + 1, 1, 1); g.fillRect(X + 1, Y + 1, 1, 1); g.fillRect(X, Y, 1, 1); }
    } else if (pr.kind === 'rocket') {
      g.fillStyle = '#8a8f9c'; g.fillRect(X - 1, Y - 1, 3, 2);
      g.fillStyle = '#ffb04a';
      for (let i = 2; i < 6; i++) if ((i + Math.floor(t * 30)) % 2) g.fillRect(Math.round(X - ux * i), Math.round(Y - uy * i), 1, 1);
    } else if (pr.kind === 'orb') {
      g.fillStyle = '#e8c34a'; g.fillRect(X - 1, Y - 2, 3, 4);
      g.fillStyle = INK.verm; g.fillRect(X, Y - 1, 1, 2);
      if (Math.floor(t * 12) % 2) { g.fillStyle = '#e8c34a'; g.fillRect(X - 1, Y + 2, 1, 1); }
    } else {
      g.fillStyle = INK.verm; g.fillRect(X - 1, Y - 1, 3, 3);
      g.fillStyle = '#ffb04a'; g.fillRect(X, Y, 1, 1);
      g.fillStyle = 'rgba(194,59,34,0.5)';
      for (let i = 2; i < 5; i++) g.fillRect(Math.round(X - ux * i), Math.round(Y - uy * i), 1, 1);
    }
  }

  drawFalls(dt) {
    const g = this.g;
    for (const f of this.falls) {
      f.life -= dt; f.vy += 260 * dt; f.y += f.vy * dt;
      const s = SPRITE_CACHE[f.name], sc = f.scale || 1;
      g.globalAlpha = Math.max(0, f.life);
      g.drawImage(f.flip ? s.f : s.n, Math.round(f.x - s.w * sc / 2), Math.round(f.y - s.h * sc), Math.round(s.w * sc), Math.round(s.h * sc));
    }
    g.globalAlpha = 1;
    this.falls = this.falls.filter(f => f.life > 0);
  }

  drawParticles(dt) {
    const g = this.g;
    for (const pt of this.parts) {
      pt.life -= dt;
      const k = pt.life / pt.max;
      if (pt.kind === 'px') {
        pt.vy += (pt.g || 0) * dt;
        pt.x += pt.vx * dt; pt.y += pt.vy * dt;
        g.fillStyle = pt.color; g.globalAlpha = Math.min(1, k * 2);
        g.fillRect(Math.round(pt.x), Math.round(pt.y), 1, 1);
      } else if (pt.kind === 'scholarhead') { // his severed head: falls, bounces, rolls to a stop, its long hair trailing
        pt.vy += 180 * dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt;
        const grounded = pt.y >= pt.floor - 2;
        if (grounded) { pt.y = pt.floor - 2; pt.vy = Math.abs(pt.vy) > 20 ? -Math.abs(pt.vy) * 0.4 : 0; pt.vx *= 0.96; }
        pt.spin = (pt.spin || 0) + pt.vx * dt * 0.5;
        const X = Math.round(pt.x), Y = Math.round(pt.y), d = Math.floor(Math.abs(pt.spin)) % 2 ? -1 : 1, back = pt.vx < 0 ? 1 : -1, tt = this.tick || 0;
        g.globalAlpha = Math.min(1, k * 3);
        g.fillStyle = '#141414';
        for (const s of [-1, 1]) for (let q = 0; q < 7; q++) g.fillRect(Math.round(X + back * (2 + q)), Math.round(Y + s + (grounded && Math.abs(pt.vx) < 6 ? 1 : Math.sin(tt * 12 + q * 0.8 + s) * 0.8)), 1, 1); // the hair, streaming
        g.fillRect(X - 2, Y - 2, 5, 5);
        g.fillStyle = '#e2b48a'; g.fillRect(X - 1, Y - 1 + (d > 0 ? 1 : 0), 3, 2); // the face, turning over as it rolls
        g.fillStyle = '#b9835b'; g.fillRect(X - 1, Y, 1, 1); g.fillRect(X + 1, Y, 1, 1); // eyes still closed
        g.fillStyle = '#c8ccd2'; g.fillRect(X + 2 * back * -1, Y - 2 * d, 1, 1); // the silver pin
      } else if (pt.kind === 'num') {
        pt.y += pt.vy * dt;
        g.globalAlpha = Math.min(1, k * 2);
        this.text(pt.text, pt.x, pt.y, pt.color, 'center');
      } else if (pt.kind === 'die') { // a white die showing the roll
        const X = Math.round(pt.x) - 3, Y = Math.round(pt.y - (1 - k) * 6) - 3;
        g.globalAlpha = Math.min(1, k * 3);
        g.fillStyle = '#141414'; g.fillRect(X - 1, Y - 1, 9, 9);
        g.fillStyle = '#ffffff'; g.fillRect(X, Y, 7, 7);
        g.fillStyle = pt.n === 1 ? '#c23b22' : '#141414';
        const P = { 1: [[3, 3]], 2: [[1, 1], [5, 5]], 3: [[1, 1], [3, 3], [5, 5]], 4: [[1, 1], [5, 1], [1, 5], [5, 5]], 5: [[1, 1], [5, 1], [3, 3], [1, 5], [5, 5]], 6: [[1, 1], [5, 1], [1, 3], [5, 3], [1, 5], [5, 5]] }[pt.n] || [];
        for (const [px, py] of P) g.fillRect(X + px, Y + py, 1, 1);
      } else if (pt.kind === 'ring') {
        g.globalAlpha = k;
        this.ellipse(pt.x, pt.y, pt.r1 + (pt.r0 - pt.r1) * k, pt.color);
      } else if (pt.kind === 'star') {
        g.globalAlpha = 1; g.fillStyle = pt.color || '#ffffff';
        const h2 = Math.round(2 * (pt.s || 1));
        g.fillRect(Math.round(pt.x) - h2, Math.round(pt.y), h2 * 2 + 1, 1); g.fillRect(Math.round(pt.x), Math.round(pt.y) - h2, 1, h2 * 2 + 1);
      } else if (pt.kind === 'arc') {
        g.globalAlpha = Math.min(1, k * 1.5);
        const S = pt.s || 1;
        for (let rr = Math.round(6 * S); rr <= Math.round(13 * S); rr++) {
          g.fillStyle = rr > 11 ? '#ffffff' : pt.color;
          for (let i = -5; i <= 5; i++) {
            if ((rr + i) % 2 && rr < 10) continue;
            const a = pt.a + i * 0.2;
            g.fillRect(Math.round(sx(pt.x - Math.cos(pt.a) * 6 + Math.cos(a) * rr)), Math.round(sy(pt.y - Math.sin(pt.a) * 6 + Math.sin(a) * rr)) - 3, 1, 1);
          }
        }
      } else if (pt.kind === 'line') {
        g.globalAlpha = Math.min(1, k * 1.5); g.strokeStyle = pt.color; g.lineWidth = pt.w || 1;
        g.beginPath(); g.moveTo(Math.round(pt.x0) + 0.5, Math.round(pt.y0) + 0.5); g.lineTo(Math.round(pt.x1) + 0.5, Math.round(pt.y1) + 0.5); g.stroke();
      } else if (pt.kind === 'ghost') {
        g.globalAlpha = k * 0.5;
        this.sprite(pt.name, pt.x, pt.y, pt.flip, 'ghost', 0, pt.scale);
      } else if (pt.kind === 'bolt') {
        // zig-zag lightning from the sky
        g.globalAlpha = k; g.strokeStyle = pt.tintC ? (Math.floor(pt.life * 40) % 2 ? '#ffffff' : pt.tintC) : pt.black ? (Math.floor(pt.life * 60) % 2 ? '#000000' : '#ff2a2a') : Math.floor(pt.life * 40) % 2 ? '#ffffff' : pt.gold ? '#ffd84a' : '#9fc8ff'; g.lineWidth = 1;
        const r = mulberry32(pt.seed | 0);
        g.beginPath(); let x = pt.x, y = pt.black ? pt.y - 18 : 13; g.moveTo(x, y);
        while (y < pt.y - 4) { y += 4 + r() * 6; x += (r() - 0.5) * 10; g.lineTo(Math.round(x) + 0.5, Math.round(Math.min(y, pt.y)) + 0.5); }
        g.stroke();
      } else if (pt.kind === 'spiral') {
        g.globalAlpha = k;
        for (let i = 0; i < 16; i++) {
          const a = i * 0.7 + (1 - k) * 12, r = 2 + i * 0.7;
          g.fillStyle = pt.c[i % 2];
          g.fillRect(Math.round(pt.x + Math.cos(a) * r), Math.round(pt.y + Math.sin(a) * r * 0.7), 1, 1);
          g.fillStyle = pt.c[(i + 1) % 2];
          g.fillRect(Math.round(pt.x - Math.cos(a) * r), Math.round(pt.y - Math.sin(a) * r * 0.7), 1, 1);
        }
      } else if (pt.kind === 'glyph') {
        // a spinning talisman square
        g.globalAlpha = k;
        const a = (1 - k) * 8, r = 5;
        g.fillStyle = pt.c[0];
        for (let i = 0; i < 4; i++) {
          const c0 = a + i * Math.PI / 2, c1 = c0 + Math.PI / 2;
          for (let s2 = 0; s2 <= 4; s2++) {
            const u = s2 / 4;
            g.fillRect(Math.round(pt.x + Math.cos(c0) * r * (1 - u) + Math.cos(c1) * r * u), Math.round(pt.y + Math.sin(c0) * r * (1 - u) + Math.sin(c1) * r * u), 1, 1);
          }
        }
        g.fillStyle = pt.c[1]; g.fillRect(Math.round(pt.x), Math.round(pt.y), 1, 1);
      } else if (pt.kind === 'cross') {
        g.globalAlpha = k; g.fillStyle = pt.c[1];
        const n = Math.round(4 + (1 - k) * 6);
        g.fillRect(Math.round(pt.x) - n, Math.round(pt.y), n * 2 + 1, 1); g.fillRect(Math.round(pt.x), Math.round(pt.y) - n - 3, 1, n * 2 + 4);
        g.fillStyle = pt.c[0]; g.fillRect(Math.round(pt.x) - 1, Math.round(pt.y) - 1, 3, 3);
      } else if (pt.kind === 'arcring') {
        g.globalAlpha = k;
        const n = 28;
        for (let i = 0; i < n; i++) {
          if ((i + Math.floor((1 - k) * 20)) % 4 > 1) continue;
          const a = pt.a0 + i / n * Math.PI * 2 + (1 - k) * 6;
          g.fillStyle = pt.c;
          g.fillRect(Math.round(sx(pt.x + Math.cos(a) * pt.r)), Math.round(sy(pt.y + Math.sin(a) * pt.r)) - 4, 1, 2);
        }
      } else if (pt.kind === 'cone') {
        g.globalAlpha = k;
        this.drawCone(pt.x, pt.y, pt.fx, pt.fy, pt.range, pt.angle, pt.tintC ? pt.tintC : pt.variant === 'wind' ? '#e8f0f8' : pt.variant === 'fire' ? '#ff8a3a' : pt.variant === 'gold' ? '#ffd84a' : pt.variant === 'soul' ? '#5dff9a' : pt.variant === 'poison' ? '#9ad04a' : pt.variant === 'ink' ? '#141414' : INK.rice, 1);
      } else if (pt.kind === 'column') {
        g.globalAlpha = k; g.fillStyle = pt.color;
        const w = pt.w || 3;
        g.fillRect(Math.round(sx(pt.x)) - Math.floor(w / 2), 14, w, Math.round(sy(pt.y)) - 14);
      } else if (pt.kind === 'beam') {
        g.globalAlpha = k;
        for (let i = 6; i < pt.len; i++) {
          const wx = pt.x + pt.fx * i, wy = pt.y + pt.fy * i;
          if (Math.hypot(wx, wy) > R + 20) break;
          const X = Math.round(sx(wx)), Y = Math.round(sy(wy)) - 5;
          g.fillStyle = '#ffe0d0'; g.fillRect(X, Y, 1, 1);
          g.fillStyle = INK.verm; g.fillRect(X, Y - 1, 1, 1); g.fillRect(X, Y + 1, 1, 1);
        }
      }
    }
    g.globalAlpha = 1;
    this.parts = this.parts.filter(pt => pt.life > 0);
  }

  bar(x, y, w, v, color, back) {
    const g = this.g;
    g.fillStyle = '#000'; g.fillRect(x - 1, y - 1, w + 2, 6);
    g.fillStyle = back; g.fillRect(x, y, w, 4);
    g.fillStyle = color; g.fillRect(x, y, Math.round(w * clamp(v, 0, 1)), 4);
    g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(x, y, Math.round(w * clamp(v, 0, 1)), 1);
  }

  drawHud(sim, extra, dt) {
    const p = sim.p, s = sim.stats;
    if (typeof WORLD_SCENES !== 'undefined' && WORLD_SCENES[extra.world]) { this.g.fillStyle = 'rgba(9, 13, 19, 0.82)'; this.g.fillRect(0, 0, W, 13); }
    if (sim.battle) this.drawTeamCounts(sim);
    this.bar(4, 4, 40, p.hp / p.maxHp, INK.verm, '#3a1410');
    this.bar(48, 4, 28, p.energy / p.energyMax, '#5fb86a', '#16301a');
    const hot = p.posture > p.postureMax * 0.75 && Math.floor(sim.t * 8) % 2;
    this.bar(80, 4, 28, p.posture / p.postureMax, hot ? '#fff3b0' : INK.gold, '#2e2610');
    this.text('K' + (sim.battle ? p.kills : s.kills), 114, 2, INK.rice);
    // awakening and special gauges, just under the bars
    if (p.awaken) {
      const g = this.g, c = p.awaken.color;
      g.fillStyle = '#000'; g.fillRect(3, 10, 42, 3);
      g.fillStyle = c; g.fillRect(4, 11, Math.round(40 * (p.awakeT > 0 ? p.awakeT / 8 : Math.min(1, p.awakenGauge / 100))), 1);
      if (p.awakeT > 0 && Math.floor(sim.t * 8) % 2) { g.fillStyle = '#ffffff'; g.fillRect(4, 11, 1, 1); }
      if (p.special) { g.fillStyle = '#000'; g.fillRect(47, 10, 30, 3); g.fillStyle = p.ultGauge >= 100 && Math.floor(sim.t * 10) % 2 ? '#ffffff' : '#e8c34a'; g.fillRect(48, 11, Math.round(28 * Math.min(1, p.ultGauge / 100)), 1); }
    }
    if (this.combo) {
      this.combo.life -= dt;
      if (this.combo.life <= 0 || sim.t - p.lastHitT > COMBO_GAP) this.combo = null;
      else this.text('COMBO x' + this.combo.n + ' +' + Math.round(Math.min(COMBO_CAP, COMBO_STEP * (this.combo.n - 1)) * 100) + '%', 4, 16, INK.gold);
    }
    this.text(sim.demoDummy ? 'DEMO' : Math.max(0, sim.timeLimit - sim.t).toFixed(0) + 's', 252, 2, '#8a8f9c', 'right');
    if (extra.label) this.text(extra.label, 214, 2, extra.labelColor || INK.rice, 'right');
    // equipped abilities, bottom-left: source foe, cooldown shade, gold edge when ready
    for (let i = 0; i < 2; i++) {
      const ab = p.abilities && p.abilities[i];
      const x0 = 4 + i * 17, y0 = 128, g = this.g;
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(x0, y0, 15, 13);
      if (!ab) continue;
      const manual = HERO_ABILITIES[ab.from] && HERO_ABILITIES[ab.from].manual, s = !manual && SPRITE_CACHE[spriteOf(ab.from)];
      if (manual) this.miniSword(x0 + 12, y0 + 2, -Math.PI / 4, 12, 1, 0.3); // a sword of the Thirteen: a flying sword, not a foe's face
      else if (s) { const sc = Math.min(1, 13 / s.w, 11 / s.h); g.drawImage(s.n, x0 + Math.round((15 - s.w * sc) / 2), y0 + 12 - Math.round(s.h * sc), Math.round(s.w * sc), Math.round(s.h * sc)); }
      const cd = Math.max(0, p.abCd[i]) / ab.cd;
      if (cd > 0) { g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(x0, y0, 15, Math.round(13 * cd)); }
      g.fillStyle = cd <= 0 && p.energy >= ab.cost ? INK.gold : '#5a6278';
      g.fillRect(x0, y0 + 12, 15, 1);
    }
    const b = sim.enemies.find(e => e.def.boss && e.state !== 'spawn');
    if (b) {
      const g = this.g;
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(48, 132, 160, 10);
      g.fillStyle = '#3a1410'; g.fillRect(50, 138, 156, 3);
      g.fillStyle = INK.verm; g.fillRect(50, 138, Math.round(156 * b.hp / b.maxHp), 3);
      g.fillStyle = INK.gold; g.fillRect(50, 141, Math.round(156 * b.posture / b.postureMax), 1);
      g.font = '8px "Press Start 2P", monospace'; g.textAlign = 'center'; g.textBaseline = 'top';
      g.fillStyle = b.phase === 2 ? (b.def.color || INK.rice) : INK.rice;
      g.fillText((b.phase === 2 ? b.def.form2 || b.def.name : b.def.name).toUpperCase(), 128, 129);
    }
  }

  // live fighters per team, as coloured pips along the top
  drawTeamCounts(sim) {
    const g = this.g, alive = {};
    for (const f of sim.fighters()) if (!f.dead && f.summoner == null) alive[f.team] = (alive[f.team] || 0) + 1;
    let x = 140;
    for (const team of Object.keys(alive).sort((a, b) => a - b)) {
      g.fillStyle = TEAM_COLORS[team] || '#ffffff';
      for (let i = 0; i < alive[team]; i++) { g.fillRect(x, 4, 2, 4); x += 3; }
      x += 3;
    }
  }

  drawUltTitle() {
    const u = this.ultFx;
    if (!u || u.max - u.t > u.charge + 0.4) return;
    const g = this.g, k = Math.min(1, (u.max - u.t) / 0.25);
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, 40, W, 34 * k);
    g.fillStyle = u.color; g.fillRect(0, 40, W * k, 1); g.fillRect(W * (1 - k), 73, W * k, 1);
    if (k < 1) return;
    this.text('ULTIMATE', W / 2, 44, u.color, 'center', 16);
    this.text(u.name, W / 2, 62, '#ffffff', 'center');
  }

  drawOverlay(o) {
    const g = this.g;
    g.fillStyle = 'rgba(14,20,36,0.82)'; g.fillRect(0, H / 2 - 38, W, 76);
    g.fillStyle = INK.gold; g.fillRect(0, H / 2 - 38, W, 1); g.fillRect(0, H / 2 + 37, W, 1);
    this.text(o.title, W / 2, H / 2 - 28, o.color, 'center', 16);
    if (o.sub) this.text(o.sub, W / 2, H / 2 - 4, INK.rice, 'center');
    if (o.sub2) this.text(o.sub2, W / 2, H / 2 + 10, '#8a8f9c', 'center');
    if (o.sub3) this.text(o.sub3, W / 2, H / 2 + 22, '#8a8f9c', 'center');
  }
}
