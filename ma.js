let ID_USERNAM_INPUT = "#sign_in_username";
let ID_PASSWORD_INPUT = "#sign_in_password";
let ID_GAME = "#game";
let ID_TOP_FACE = "#top_area_face";
let ID_HINT_FREE = "#hint_free";
let ID_HINT_BTN = "#hint_btn";
	
let CSS_LOGIN_BTN = ".btn.btn-info.auth-free";
let CSS_LOGIN_MODAL_BTN = ".modal-footer .btn-info";
let CSS_USER_BTN = ".btn.btn-info.auth-free";
let CSS_TOP_FACE_WIN = ".hd_top-area-face-win";
let CSS_TOP_FACE_LOSE = ".hd_top-area-face-lose";
let CSS_TOP_FACE_UNPRESSSED = ".hd_top-area-face-unpressed";
let CSS_GAME_LEVEL_1  = ".level1-link";
let CSS_GAME_LEVEL_2  = ".level2-link";
let CSS_GAME_LEVEL_3  = ".level3-link";
let CSS_CELL  = ".cell";
let CSS_HINT_CELL  = ".cell.hint-flag, .cell.hint-to-open";
let CSS_HINT_CELL_FLAG  = ".cell.hint-flag";
let CSS_HINT_CELL_OPEN  = ".cell.hint-to-open";
let CSS_START  = ".cell.start";
let CSS_OPENED  = ".cell.hd_opened";
let CSS_DATA_X_0  = ".cell[data-x='0']";
let CSS_DATA_Y_0  = ".cell[data-y='0']";
	
let ATTR_DATA_X = "data-x";
let ATTR_DATA_Y = "data-y";
let ATTR_DATA_CLASS = "class";

let GameState = {
	"WIN": "WIN",
	"LOSE": "LOSE",
	"PLAYING": "PLAYING",
	"CLICKED": "CLICKED",
	"NOT_CLICK": "NOT_CLICK"
}

let CellType = {
	"CLOSED": "CLOSED",
	"OPENED": "OPENED",
	"FLAGED": "FLAGED",
	"CLOSED_OR_FLAGED": "CLOSED_OR_FLAGED",
	"ACTION_TICK": "ACTION_TICK",
	"REMAIN_TOP": "REMAIN_TOP",
	"REMAIN_RIGHT": "REMAIN_RIGHT",
	"REMAIN_BOTTOM": "REMAIN_BOTTOM",
	"REMAIN_LEFT": "REMAIN_LEFT",
	"REMAIN_NONE": "REMAIN_NONE"
}


let mineCellMT = [];
let cellAreas = [];
let mineSetting = {};
let hintFree = false;

let totalGame = 0;
let winStreak = 0;
let maxWinStreak = 0;
let totalWin = 0;
let flagCount = 0;
let bomCount  = 0;
let rows = 0;
let cols = 0;

let me = new MouseEvent("mouseenter", {});
let md = new MouseEvent("mousedown", {});
let mu = new MouseEvent("mouseup", {});
let ml = new MouseEvent("mouseleave", {});
let cm = new MouseEvent("contextmenu", {});

//let mineCell = {
//					"x": x,
//					"y": y,
//					"cellElm": elm,
//					"id": cellId,
//					"isOpen": false,
//					"isFlag": false,
//					"isClear": false,
//					"aroundBom": -1,
//				};


function log(msg) {
	console.log(new Date() + "---" + msg);
}
	
function logTech(tech, pos, x, y) {
	if(checkEndGame() == GameState.LOSE) {
		log(tech + ":" + pos + "-" + x + ":" + y);
	}
}
	

function isBigGame() {
	return mineCellMT.length >= 35 || mineCellMT[0].length >= 35;
}
	
function isSmallGame() {
	return mineCellMT.length <= 10 && mineCellMT[0].length <= 10;
}
	

function getAroudBom(mineCell) {
	if(isCellType(mineCell, CellType.OPENED)) {
		return mineCell.aroundBom;
	}
	return mineCell.aroundBom;
}

function isCellType(mineCell, cellType) {
	switch(cellType) {
		case CellType.OPENED:
			if(mineCell.aroundBom < 0) {
				let clazz = mineCell.cellElm.attr(ATTR_DATA_CLASS)
				if(clazz.includes("hd_opened")) {
					mineCell.isOpen = true;
					mineCell.aroundBom = parseInt(clazz.split("hd_type")[1]);
					if(mineCell.aroundBom == 0) {
						mineCell.isClear = true;
					}
				}
			}
			return mineCell.isOpen;
		case CellType.FLAGED:
			if(!mineCell.isFlag) {
				let clazz = mineCell.cellElm.attr(ATTR_DATA_CLASS)
				if(clazz.includes("hd_flag")) {
					mineCell.isFlag = true;
				}
			}
			return mineCell.isFlag;
		case CellType.CLOSED:
			return !isCellType(mineCell, CellType.FLAGED) && !isCellType(mineCell, CellType.OPENED);
		case CellType.CLOSED_OR_FLAGED:
			return isCellType(mineCell, CellType.FLAGED) || !isCellType(mineCell, CellType.OPENED);
		default:
			return false;
	}
}

function cellClick(mineCell) {
	if(isClear) {
		if(!isCellType(mineCell, CellType.FLAGED)) {
			return false;
		}
	} else {
		if(!isCellType(mineCell, CellType.CLOSED)) {
			return false;
		}
	}
	if(!mineSetting.isEfficiency) {
		mineCell.cellElm.dispatchEvent(me);
		mineCell.cellElm.dispatchEvent(md);
		mineCell.cellElm.dispatchEvent(mu);
		mineCell.cellElm.dispatchEvent(ml);
		if(isClear) {
			mineCell.isClear = true;
		}
	} else {
		if(!isClear) {
			$(mineCell.id).css('border','1.5px solid blue');
		}
	}
	
	return true;
}

function cellFlag(mineCell) {
	if(!isCellType(mineCell, CellType.CLOSED)) {
		return false;
	}
	
	if (mineSetting.isEfficiency || mineSetting.noFlag) {
		$(mineCell.id).css('border','1.5px solid red');
	} else {
		navigator.MaxTouchPoints = 1
		mineCell.cellElm.dispatchEvent(cm);
	}
	mineCell.isFlag = true;
	
	flagCount++;
	$('#game-flaged').text('(Flaged:"+flagCount+")');
	return true;
}

function nextTick(mineCell, radius = 2) {
	for (let i = mineCell.x - radius; i <= mineCell.x + radius; i++) {
		for (let j = mineCell.y - radius; j <= mineCell.y + radius; j++) {
			let mineCell2 = mineCellMT[i][j];
			if(isCellType(mineCell2, CellType.OPENED)) {
				tickFlag(mineCell2);
			}
		}
	}
}

function doHint() {
	$(ID_HINT_BTN).click();
	
	while ($(CSS_HINT_CELL).length == 0) {
		continue;
	}
	let status = GameState.NOT_CLICK;
	let hintMineCells = [];
	$(CSS_HINT_CELL_FLAG).forEach((hintCell) => {
		let x = parseInt(hintCell.attr(ATTR_DATA_X));
		let y = parseInt(hintCell.attr(ATTR_DATA_Y));
		let mineCell = mineCellMT[x][y];
		if(cellFlag(mineCell)) {
			hintMineCells.push(mineCell)
		}
	});
	
	$(CSS_HINT_CELL_OPEN).forEach((hintCell) => {
		let x = parseInt(hintCell.attr(ATTR_DATA_X));
		let y = parseInt(hintCell.attr(ATTR_DATA_Y));
		let mineCell = mineCellMT[x][y];
		if(cellClick(mineCell, false)) {
			hintMineCells.push(mineCell)
		}
	});

	hintMineCells.forEach((hintCell) => {
		getAroundCells(hintCell,1).forEach((hintCellOpened) => {
			if( tickFlag(hintCellOpened)) {
				status = GameState.CLICKED;
			}
		});
	});

	if (status == GameState.NOT_CLICK) {
		return doHint();
	}
	return status;

}

function checkStarted() {
	let elm  = $(CSS_START);
	if (elm.length) {
		let x = parseInt(elm.attr(ATTR_DATA_X));
		let y = parseInt(elm.attr(ATTR_DATA_Y));
		let mineCell = mineCellMT[x][y];
		cellClick(mineCell);
		nextTick(mineCell);
		return true;
	}
	return ($(CSS_OPENED).length > 0)
}

function checkEndGame() {
	if($(CSS_TOP_FACE_WIN).length > 0) {
		return GameState.WIN;
	}
	
	if($(CSS_TOP_FACE_LOSE).length > 0) {
		return GameState.LOSE;
	}
	
	return GameState.PLAYING;
}

function canProcess(mineCell) {
	if (mineCell.isClear) {
		return false;
	}

	if (!isCellType(mineCell, CellType.CLOSED)) {
		return false;
	}
	
	return true;
}

function getAroundCells(mineCell, radius) {
	let closedCells = [];
	let openedCells = [];
	let flagedCells = [];
	for (let i = mineCell.x - radius; i <= mineCell.x + radius; i++) {
		for (let j = mineCell.y - radius; j <= mineCell.y + radius; j++) {
			try {
				let tmpCell = mineCellMT[i][j];
				if(tmpCell.isClear) {
					continue;
				}
				if(tmpCell.id === mineCell.id) {
					continue;
				}
	
				if(isCellType(tmpCell, CellType.OPENED)) {
					openedCells.push(tmpCell);
				} else if(isCellType(tmpCell, CellType.FLAGED)) {
					flagedCells.push(tmpCell);
				} else if(isCellType(tmpCell, CellType.CLOSED)) {
					closedCells.push(tmpCell);
				}
			} catch (error) {
			}
		}
	}
	return {"closedCells":closedCells, "openedCells": openedCells, "flagedCells": flagedCells};
}

function tickFlag(mineCell) {
	if(checkEndGame() != GameState.PLAYING) {
		return GameState.NOT_CLICK;
	}
	let boms = getAroudBom(mineCell);
	let click = GameState.NOT_CLICK;
	
	
	let aroundCells = getAroundCells(mineCell,1);
	let aroundCloseCells = aroundCells.closedCells;
	let aroundFlagCells = aroundCells.flagedCells;
	
	if(aroundCloseCells.length == 0) {
		mineCell.isClear = true;
		return GameState.NOT_CLICK;
	}
	if (boms == aroundCloseCells.length + aroundFlagCells.length) {
		aroundCloseCells.forEach((mineCell2) => {
			if(cellFlag(mineCell2)) {
				click = GameState.CLICKED;
				aroundFlagCells.add(mineCell2);
			}
		});
	}
	if (boms == aroundFlagCells.size()) {
		click = GameState.CLICKED;
		if(mineSetting.noFlag) {
			aroundCloseCells.forEach((mineCell2) => {
				cellClick(mineCell2, false);
			});
		} else {
			cellClick(mineCell, true);
		}
		mineCell.isClear = true;
	}
	if(click == GameState.CLICKED) {
		nextTick(mineCell);
	}
	
	return click;
}

function technique_around(mineCell, cellArea) {
	let click = GameState.NOT_CLICK;
		
	let aroundCells = getAroundCells(mineCell, 1);
	aroundCloseCells = aroundCells.closedCells;
	aroundFlagCells = aroundCells.flagedCells;
	
	aroundCells = getAroundCells(mineCell, 2);
	let aroundOpenCells = aroundCells.openedCells;
	if (aroundOpenCells.length == 0) {
		return click;
	}
	
	let remainBome = getAroudBom(mineCell) - aroundFlagCells.length;
	let mineCell2tmp = null;
	
	const retainCloseCellSet = new Set();
	let retainCloseCellSetBome = 0;
	aroundOpenCells.forEach((mineCell2) => {
		aroundCells = getAroundCells(mineCell2, 1);
		aroundCloseCells2 = aroundCells.closedCells;
		aroundFlagCells2 = aroundCells.flagedCells;
		
		let remainBome2 = getAroudBom(mineCell2) - aroundFlagCells2.length;
		
		let retainClosedCells = aroundCloseCells.filter(value => aroundCloseCells2.includes(value));
		
		if(retainClosedCells.length == 0) {
			continue;
		}
		
		if(bomCount - flagCount == 1 & retainClosedCells.length == 1) {
			if(cellFlag(retainClosedCells[0])) {
				click = GameState.CLICKED;
			}
			return click;
		}
		
		let outRetainBome = aroundCloseCells.length - retainClosedCells.length;
		let outRetainBome2 = aroundCloseCells2.length - retainClosedCells.length;
		if(outRetainBome == outRetainBome2 && outRetainBome == 0) {
			continue;
		}
		
		if(outRetainBome2 == 0 && remainBome <= remainBome2) {
			aroundCloseCells = aroundCloseCells.filter(value => !retainClosedCells.includes(value));
			aroundCloseCells.removeAll(retainClosedCells);
			
			aroundCloseCells.forEach((mineCell3) => {
				if(retainClosedCells.includes(mineCell3)) {
					continue;
				}	
				if(cellClick(mineCell3, false)) {
					click = GameState.CLICKED;
				}
			})
			break;
		} else {
			let inRetainBome = Math.min(retainClosedCells.length, remainBome2);
			if(remainBome2 - inRetainBome >= aroundCloseCells2.length - retainClosedCells.length) {
				aroundCloseCells2.forEach((mineCell3) => {
					if(retainClosedCells.includes(mineCell3)) {
						continue;
					}	
					if(cellFlag(mineCell3)) {
						click = GameState.CLICKED;
						mineCell2tmp = mineCell2;
					}
				})
			}
			if(remainBome - inRetainBome >= aroundCloseCells.length - retainClosedCells.length) {
				aroundCloseCells.forEach((mineCell3) => {
					if(retainClosedCells.includes(mineCell3)) {
						continue;
					}	
					if(cellFlag(mineCell3, false)) {
						click = GameState.CLICKED;
					}
				})
				break;
			}
			
			if (retainCloseCellSet.filter(value => !retainClosedCells.includes(value)).length == 0 ) {
				retainCloseCellSet = new Set([ ...retainCloseCellSet, ...retainClosedCells ])
				retainCloseCellSetBome += inRetainBome;
			}
			
			// add bom map
//			Map<List<MineCell>,Integer> cellBomMap = bomMap.get(mineCell.id());
//			if(Objects.isNull(cellBomMap)) {
//				cellBomMap = new HashMap<List<MineCell>, Integer>();
//			}
//			cellBomMap.put(retainClosedCells, inRetainBome);
//			bomMap.put(mineCell.id(), cellBomMap);
		}
	});
	
	if(remainBome - retainCloseCellSetBome >= aroundCloseCells.length - retainCloseCellSet.length) {
		aroundCloseCells.forEach((mineCell3) => {
			if(retainCloseCellSet.includes(mineCell3)) {
				continue;
			}	
			if(cellFlag(mineCell3)) {
				click = GameState.CLICKED;
			}
		})
	}
	if(click == GameState.CLICKED) {
		if(mineCell2tmp != null) {
			tickFlag(mineCell2tmp);
		}
		nextTick(mineCell);
	}
	
	return click;
}

function technique(cellArea, type) {
	let clickAction = GameState.NOT_CLICK;
	//bomMap = new HashMap<String, Map<List<MineCell>,Integer>>();
	for(let m = cellArea.x1; m < cellArea.x2; m++) {
		for(let n = cellArea.y1; n < cellArea.y2; n++) {
			if(checkEndGame() != GameState.PLAYING) {
				return GameState.NOT_CLICK;
			}
			let mineCell = mineCellMT[m][n];
			if (getAroudBom(mineCell)>=9) {
				return GameState.LOSE;
			}
			
			if(!canProcess(mineCell)) {
				continue;
			}
			//if(type == 1) {
				if(technique_around(mineCell, true, cellArea) == GameState.CLICKED)
					clickAction = GameState.CLICKED;
			//} else {
			//	if(technique_bomMap(mineCell) == GameState.CLICKED)
					clickAction = GameState.CLICKED;
			//}
		}
	}
	return clickAction;
}

function doCheckFlag() {
	let clickAction = GameState.NOT_CLICK;
	mineCellMT.forEach((mineCells) => {
		mineCells.forEach((mineCell) => {
			if(checkEndGame() != GameState.PLAYING) {
				return GameState.NOT_CLICK;
			}
			if (getAroudBom(mineCell) >= 9) {
				return GameState.LOSE;
			}
			
			if(!canProcess(mineCell)) {
				continue;
			}
			
			if (tickFlag(mineCell) == GameState.CLICKED) {
				clickAction = GameState.CLICKED;
			}
		})
	});
	
	if (mineSetting.isEfficiency) {
		return clickAction;
	}
	
	if(clickAction != GameState.CLICKED && !mineSetting.isSpeed) {

		if(technique({"x1": 0,"x2": cols,"y1": 0,"y2": rows,}, 1) == GameState.CLICKED) {
			clickAction = GameState.CLICKED;
		}
		
		if(clickAction != GameState.CLICKED && technique({"x1": 0,"x2": cols,"y1": 0,"y2": rows,}, 2) == GameState.CLICKED) {
			clickAction = GameState.CLICKED;
		}
	}
	return clickAction;
}

function reRandom(mineCell) {
	if(getAroudBom(mineCell) >= 9) {
		return false;
	}
	let click = GameState.NOT_CLICK;

	let x = mineCell.x;
	let y = mineCell.y;
	let x1 = x;
	let x2 = x;
	let y1 = y;
	let y2 = y;
	try {
		while(mineCellMT[x1][y].isOpen) {
			x1--;
		}
	} catch (error) {
	}
	try {
		while(mineCellMT[x2][y].isOpen) {
			x2++;
		}
	} catch (error) {
	}
	try {
		while(mineCellMT[x][y1].isOpen) {
			y1--;
		}
	} catch (error) {
	}
	try {
		while(mineCellMT[x][y2].isOpen) {
			y2++;
		}
	} catch (error) {
	}
	
	x1 = Math.max(x1 - 3, 0);
	x2 = Math.min(x2 + 3, mineCellMT.length - 1);
	
	y1 = Math.max(y1 - 3, 0);
	y2 = Math.min(y2 + 3, mineCellMT[0].length -  1);
	
	let cellArea = {
		"x1": x1,
		"x2": x2,
		"y1": y1,
		"y2": y2,
	}

	let count = 0;
	for(let i = x1; i <= x2; i++) {
		for(let j = y1; j <= y2; j++) {
			let mineCell2 = mineCellMT[i][j];
			if(!mineCell2.isOpen) {
				continue;
			}
			count++;
			if(tickFlag(mineCell2, true) == GameState.CLICKED) {
				click = GameState.CLICKED;
			}
		}
	}
	if(count <= 3) {
		return true;
	}
	
	if(click != GameState.CLICKED) {
		click = technique(cellArea, 1);
	}
	
	return click != GameState.CLICKED;
}

function doRandomClick(newGame) {
	let mineCellList = [];
	if(!newGame) {
		if(hintFree) {
			if(doHint() == GameState.CLICKED) {
				return true;
			}
		}
	}
	
	if(!newGame && !isBigGame()) {
		mineCellMT.forEach((mineCells) => {
			mineCells.forEach((mineCell) => {
				if(isCellType(mineCell, CellType.CLOSED)) {
					mineCellList.push(mineCell);
				}
			});
		});
		if(!mineCellList.length) {
			return false;
		}
	}
	let randx = 0;
	let randy = 0;

	let isReRandom = true;
	
	while (isReRandom) {
		if(checkEndGame() != GameState.PLAYING) {
			return false;
		}
		let mineCell = null;
		if(newGame || isBigGame()) {
			randx = Math.floor(Math.random() * cols);
			randy = Math.floor(Math.random() * rows);
			mineCell = mineCellMT[randx][randy];
		} else {
			let index = Math.floor(Math.random() * mineCellList.length);
			mineCell = mineCellList[index];
		}
		
		if (isCellType(mineCell, CellType.CLOSED)) {
			cellClick(mineCell)
			if(checkEndGame() != GameState.PLAYING) {
				return false;
			}
			isReRandom = reRandom(mineCell);
		}

	}
	return true;
}

function loadGame() {
	log("START LOADGAME");
	if (mineSetting.arena) {
		setTimeout(function() {
		}, 2000);
	}
	if(!mineCellMT.length || mineSetting.arena) {
		let cols = $(CSS_DATA_Y_0).length;
		let rows = $(CSS_DATA_X_0).length;
		for (let x = 0; x < cols; x++) {
			for (let y = 0; x < rows; y++) {
				let mineCells = [];
				let cellId = "#cell_" + y + "_"+ x;
				let elm = $(cellId);
				let mineCell = {
					"x": x,
					"y": y,
					"cellElm": elm,
					"id": cellId,
					"isOpen": false,
					"isFlag": false,
					"isClear": false,
					"aroundBom": -1,
				};
				mineCells.push(mineCell);
			}
		}
	} else {
		mineCellMT.forEach((mineCells) => {
			mineCells.forEach((mineCell) => {
				mineCell.isOpen = fasle;
				mineCell.isFlag = fasle;
				mineCell.isClear = fasle;
				mineCell.aroundBom = -1
				if(mineSetting.isEfficiency || mineSetting.noFlag) {
					mineCell.cellElm.css('border','');
				}
			});
		});
	}
	log("END LOADGAME");
	if(!checkStarted()){
		if (!doRandomClick(true)) {
			return false;
		}
	}
	return true;
}

function play() {
	try {
		document.getElementById('L7').scrollIntoView();
	} catch (error) {
		
	}
	try {
		document.getElementsByClassName('arena-panel')[0].scrollIntoView();
	} catch (error) {
		
	}
	
	js.executeScript("$('#win-streak').text('Win Streak:"+winStreak+"/Max:"+maxWinStreak+"/Total Win:"+totalWin+"(" + totalGame+")');");

	if (loadGame()) {
		let retry = 1;
		while (true) {
			if(checkEndGame() != GameState.PLAYING) {
				break;
			}
			let status = GameState.NOT_CLICK;
			status = doCheckFlag();
			
			if (status == GameState.CLICKED) {
				retry = 1;
			} else {
				retry++;
			}
			
			if (retry <= mineSetting.retry) {
				continue;
			}
			if (!doRandomClick(false)) {
				break;
			}
		}
	}
	
	state = checkEndGame();
	if(state == GameState.WIN) {
		winStreak++;
		totalWin++;
		if(winStreak > maxWinStreak) {
			maxWinStreak = winStreak;
		}
			
		log("WIN");
	}
	if(state ==GameState.LOSE) {
		winStreak = 0;
		log("LOSE");
	}
	flagCount = 0;
	totalGame++;
	
	$(ID_TOP_FACE).click();
	setTimeout(function() {
		play
	}, 1000);
}

function playGame(setting) {
	$('.adsbygoogle').hide();
	$('head').append('<style>.modal-backdrop {display:none!important;}</style>');
	$('head').append('<style>.modal {width:auto!important;left: auto!important;}</style>');
	$('head').append('<style>.modal > .modal-dialog:not(.hint-dialog) {width:0px!important;}</style>');
	mineSetting = setting;
	$('.wrapper-pavel-inside').append($("<div id='win-streak'></div><div id='game-flaged'></div>" ))
	
	play();
}


