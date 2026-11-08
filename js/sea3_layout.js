// Раскладка и параметры фазы 3 «МОРЕ». Пишут «Редактор фазы 3.bat» (tools/p10/sem3/editor.html) и «Конструктор моря.bat».
// layers — слои сцены по порядку (см. LAYERS в level10sea.js); WY — вода у плотов; sem — Семён (x, y = линия воды, H); stations — станции (x, y, s, leg);
// bg — горизонт и море; lanes — ряды плотов; atk — параметры атак.
L10.SEA3 = {
 "valeraK": 0.37,
 "lanes": [
  {
   "y": 320,
   "k": 0.86
  },
  {
   "y": 283,
   "k": 0.74
  }
 ],
 "raftSheet": "slab10",
 "raftTop": 0.62,
 "raftSub": 4,
 "WY": 275,
 "sem": {"x": 310.0, "y": 241.0, "H": 236.0},
 "legA": [
  [
   -62,
   -150
  ],
  [
   62,
   -150
  ]
 ],
 "stations": [
  {
   "x": 55,
   "y": 243,
   "s": 0.818,
   "leg": 1
  },
  {
   "x": 143,
   "y": 193,
   "s": 0.608,
   "leg": 0
  },
  {
   "x": 600,
   "y": 240,
   "s": 0.905,
   "leg": 2
  },
  {
   "x": 495,
   "y": 202,
   "s": 0.724,
   "leg": 3
  }
 ],
 "gunK": 0.62,
 "bg": {
  "seaY": 158,
  "seaH": 230,
  "shipZ": 70,
  "ships": 7
 },
 "raftX0": -60,
 "raftEvery": [
  0.8,
  1.4
 ],
 "raftSpeed": [
  0,
  21
 ],
 "raftW": [
  83,
  125
 ],
 "hp": 1000,
 "segs": 3,
 "atk": {
  "tracks": [1, 2, 3],
  "cd": [3, 2.2, 1.6],
  "ballLife": 10,
  "ballSpeed": 92,
  "ballTurn": 2,
  "ballHp": 1,
  "ballDmg": 10,
  "balls": [
   2,
   3,
   4
  ],
  "laserWarn": 1.2,
  "laserTime": 1.7,
  "laserDmg": 12,
  "hoseN": [
   2,
   3,
   4
  ],
  "hoseWarn": 0.9,
  "hoseDmg": 12,
  "clapWarn": 1.4,
  "clapDmg": 24,
  "clapEvery": 1,
  "minions": [2, 3, 5],
  "minionEvery": 5.5,
  "minionDmgK": 0.4,
  "dmg": 14,
  "dmgWeak": 20,
  "splash": 40,
  "breath": 2.5,
  "stationHp": 30,
  "stationBack": 28,
  "smashWarn": 1.2,
  "smashEvery": 1.3,
  "smashDmg": 18,
  "smashR": 42,
  "sweepP": 0.35,
  "sweepWarn": 0.9,
  "sweepTime": 1,
  "sweepDmg": 14,
  "hoseBub": 1,
  "waveV": 120,
  "smashN": [
   3,
   4,
   4
  ],
  "stationRespawn": false
 },
 "layers": [
  {
   "k": "sky"
  },
  {
   "k": "sea"
  },
  {
   "k": "sea",
   "sp": -190,
   "dx": 700,
   "dy": 3,
   "a": 0.33,
   "w": 1.3
  },
  {
   "k": "ships"
  },
  {
   "k": "stFar"
  },
  {
   "k": "sem"
  },
  {
   "k": "semWater"
  },
  {
   "k": "laser"
  },
  {
   "k": "stNear"
  },
  {
   "k": "rafts"
  },
  {
   "k": "hose"
  },
  {
   "k": "actors"
  },
  {
   "k": "arms"
  },
  {
   "k": "fx"
  },
  {
   "k": "rain"
  }
 ]
};
