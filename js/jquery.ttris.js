;(function($, window) {
	'use strict';

	$.Ttris = function(element, options) {
		this.options = {};

		this.x = 0;						// carrier column position
		this.y = 0;						// carries row position
		this.busyChecking = false;		// ensures the brick can't be moved as long as the script runs
		this.status = 'off';			// game is running or not
		this.pause = false;				// is TRUE when game is paused
		this.setLevelInterval  = '';	// interval for updating the level
		this.moveInterval = '';			// interval for brick movement
		this.score = '';				// contains the current score points
		this.currentBrick = ''; 		// contains active brick object at runtime
		this.nextBrick = undefined;		// contains next chosen brick
		this.currentCoordIndex = '';	// contains index of the current bricks turning sequence coordindates
		this.nextCoords = '';			// contains the next array of coordingates (turning sequences)
		this.level = 1;					// level number
		this.brickStack = [];			// contains each brick type 4 times; 1 brick type occurance is removed when chosen --> ensures, that each block type can only recur 4 times in a row
		this.deletedRows = [];			// row numbers of the rows marked for deletion
		this.bricks = {					// brick types {color, turning sequence coordinates}
			type_1: { color: '#c0392b', coords: [[4,5,6,7],[1,5,9,13],[4,5,6,7],[1,5,9,13]] },
			type_2: { color: '#3498db', coords: [[1,2,5,6],[1,2,5,6],[1,2,5,6],[1,2,5,6]] },
			type_3: { color: '#f1c40f', coords: [[1,4,5,6],[1,5,6,9],[4,5,6,9],[1,4,5,9]] },
			type_4: { color: '#9b59b6', coords: [[1,5,8,9],[0,4,5,6],[1,2,5,9],[4,5,6,10]] },
			type_5: { color: '#2ecc71', coords: [[0,4,8,9],[8,4,5,6],[0,1,5,9],[6,8,9,10]] },
			type_6: { color: '#16a085', coords: [[8,9,5,6],[0,4,5,9],[8,9,5,6],[0,4,5,9]] },
			type_7: { color: '#e67e22', coords: [[4,5,9,10],[1,5,4,8],[4,5,9,10],[1,5,4,8]] }
		};

		this.brickWidth = 0;
		this.brickHeight = 0;

		this.init = function(element, options) {
			var self = this;
			self.options = $.extend({}, $.Ttris.defaults, options);
			self.brickWidth = 100 / self.options.cols;
			self.brickHeight = 100 / self.options.rows;
			self.buildBoard();
			self.createPreview();
			self.adjustSize();
			self.addEvents();
			$('#' + self.options.scoreBoard).html(0);
			$('#' + self.options.levelDisplay).html(0);
		};

		this.adjustSize = function() {
			var self = this;

			var proportion = self.options.cols / self.options.rows;
			var maxBlockHeight = $('#columnLeft').height() / self.options.cols;
			var maxBlockWidth = $('#columnLeft').width() / self.options.rows;
			var blockSize = (maxBlockHeight < maxBlockWidth) ? maxBlockHeight : maxBlockWidth;

			$('#board').css({
				'max-width': 'initial',
				'max-height': 'initial'
			});

			if($('#columnLeft').height() / self.options.rows < $('#columnLeft').width() / self.options.cols) {
				$('#board').css({'max-width': $('#columnLeft').height() * proportion + 'px'});
			} else {
				$('#board').css({'max-height': $('#columnLeft').width() / proportion + 'px'});
			}

			$('#preview>div').css({
				'height': $('#preview>div').width() + 'px'
			});
		};

		this.addEvents = function() {
			var self = this;

			$(window).on('resize', function() {
				self.adjustSize();
			});

			$('#' + self.options.startButton).on('click', function() {
				if(self.status === 'off') {
					self.startNewGame();
				} else {
					self.resetGame();
					self.endGame();
				}
			});

			$('#' + self.options.pauseButton).on('click', function() {
				if(self.status === 'on') {
					if(self.pause === false) {
						self.pauseGame();
					} else {
						self.continueGame();
					}
				}
			});

			$('#' + self.options.optMenuButton).on('click', function() {
				if($(self.options.optMenu).hasClass('active')) {
					self.toggleOptMenu('hide');
				} else {
					self.toggleOptMenu('show');
				}
			});

			$('#' + 'optMenu_levelUp').on('click', function() {
				if(parseInt($('#' + 'optMenu_level').attr('value')) < 999) {
					$('#' + 'optMenu_level').attr('value', parseInt($('#' + 'optMenu_level').attr('value')) + 1);
				}
			});

			$('#' + 'optMenu_levelDown').on('click', function() {
				if(parseInt($('#' + 'optMenu_level').attr('value')) > 1) {
					$('#' + 'optMenu_level').attr('value', parseInt($('#' + 'optMenu_level').attr('value')) - 1);
				}
			});

			$('#' + 'optMenu_themeSetting').on('change', function() {
				switch($('#' + 'optMenu_themeSetting' + ' option:selected').val()) {
					case 'none': {
						$('#' + self.options.board).css({
							'background': 'url(images/black_transp_pixel.png) left top repeat'
						});
						break;
					}
					case 'beach': {
						$('#' + self.options.board).css({
							'background': 'url(images/beach.jpg) center top no-repeat',
							'background-size': 'auto 100%'
						});
						$$('#' + self.options.menu + ' *').setStyle('color', '#24a');
						break;
					}
					case 'sunset': {
						$('#' + self.options.board).css({
							'background': 'url(images/sunset.jpg) center top no-repeat',
							'background-size': 'auto 100%'
						});
						break;
					}
					case 'forest': {
						$('#' + self.options.board).css({
							'background': 'url(images/forest.jpg) center top no-repeat',
							'background-size': 'auto 100%'
						});
						break;
					}
					case 'avatar': {
						$('#' + self.options.board).css({
							'background': 'url(images/avatar.jpg) center top no-repeat',
							'background-size': 'auto 100%'
						});
					}
				}
			});

			// save option menu changes
			$('#' + 'optMenu_saveButton').on('click', function() {
				self.level = parseInt($('#' + 'optMenu_level').val());
				$('#levelDisplay').html(self.level);

				// adapt speed to chosen level
				for(var i = 0; i < self.level; i++) {
					self.options.speed -= self.options.speed * 0.05;
				}

				self.toggleOptMenu('hide');
			});

			// discard option menu changes
 			$('#' + 'optMenu_cancelButton').on('click', function() {
				self.toggleOptMenu('hide');
			});

			// keyboard events
			$(window).on('keydown', function(event) {
				switch(event.which) {
					case 38: {
						self.turnBrick();
						break;
					}
					case 37: {
						self.moveBrick('left');
						break;
					}
					case 39: {
						self.moveBrick('right');
						break;
					}
					case 40: {
						self.moveBrick('down');
						break;
					}
				}
			});
		};

		// create preview grid
		this.createPreview = function() {
			var self = this;

			$('#' + self.options.preview).append('<div></div>');

			for(var row = 1; row <= 4; row++) {
				for(var column = 1; column <= 4; column++) {

					var columnClass = 'block row_' + row + ' col_' + column;
					if(column === 4) {
						columnClass += ' last';
					}

					if(column === 1) {
						columnClass += ' first';
					}

					$('#' + self.options.preview + '>div').append('<div class="' + columnClass + '"></div>');
				}
			}
		};

		// create the game board
		this.buildBoard = function() {
			var self = this;

			$('#' + self.options.wrapper).append('<div id="columnLeft"></div>');
			$('#' + self.options.wrapper).append('<div id="columnRight"></div>');

			$('#columnLeft').append('<div id="' + self.options.board + '"></div>');
			$('#board').append('<div id="' + self.options.gameOver + '">' + self.options.gameOverText + '</div>');

			// board grid
			for(var row = 1; row <= self.options.rows; row++) {
				for(var column = 1; column <= self.options.cols; column++) {
					var columnClass = 'block row_' + row + ' col_' + column;
					if(column === 10) {
						columnClass += ' last';
					}

					if(column === 1) {
						columnClass += ' first';
					}

					$('#' + self.options.board).append('<div style="width:' + 100 / self.options.cols + '%; height:' + 100 / self.options.rows + '%" class="' + columnClass + '"></div>');
				}
			}

			// brick carrier
			$('#' + this.options.board).append('<div id="' + self.options.carrier + '"></div>');

			// carrier grid
			for(row = 1; row <= 4; row++) {
				for(var column = 1; column <= 4; column++) {

					var columnClass = 'block row_' + row + ' col_' + column;
					if(column === 10) {
						columnClass += ' last';
					}

					if(column === 1) {
						columnClass += ' first';
					}

					$('#' + this.options.carrier).append('<div style="width:' + self.brickWidth + '%; height:' + self.brickHeight + '%" class="' + columnClass + '"></div>');
				}
			}

			// option menu
			$('#' + this.options.board).append('<div id="' + this.options.optMenu + '"></div>');
			$('#' + this.options.optMenu).append('<ul id="' + this.options.optMenuList + '"></ul>');
			$('#' + this.options.optMenuList).append(
				'<li>' +
					'<div id="optMenu_levelLabel" class="leftCol">Level</div>' +
					'<div class="middleCol">' +
						'<input id="optMenu_level" type="text" maxlength="3" value="1">' +
					'</div>' +
					'<div id="optMenu_levelSetting" class="rightCol">' +
						'<div id="optMenu_levelUp" class="optMenu_up"></div>' +
						'<div id="optMenu_levelDown" class="optMenu_down"></div>' +
					'</div>' +
				'</li>' +
				'<li>' +
					'<div id="optMenu_theme">' +
						'<div id="optMenu_themeLabel" class="leftCol">Theme</div>' +
						'<div class="middleCol">Theme</div>' +
							'<select id="optMenu_themeSetting" size="1">' +
								'<option>none</option>' +
								'<option>beach</option>' +
								'<option>sunset</option>' +
								'<option>forest</option>' +
								'<option>avatar</option>' +
							'</select>' +
						'</div>' +
					'</div>' +
				'</li>'
			);
			$('#' + this.options.optMenu).append('<div id="optMenu_buttonWrapper"></div>');
			$('#optMenu_buttonWrapper').append(
				'<div id="optMenu_saveButton">Save</div>' +
				'<div id="optMenu_cancelButton">Cancel</div>'
			);

			// menu
			$('#columnRight').append(
				'<div id="' + self.options.menu + '">' +
					'<div id="' + self.options.preview + '" class="' + self.options.clearfixClass + '"></div>' +
					'<ul id="' + self.options.scoreBoardWrapper + '" class="' + self.options.clearfixClass + '">' +
						'<li id="' + self.options.scoreBoardLabel + '">' + self.options.scoreBoardLabelText + '</li>' +
						'<li id="' + self.options.scoreBoard + '"></li>' +
					'</ul>' +
					'<ul id="' + self.options.levelDisplayWrapper + '" class="' + self.options.clearfixClass + '">' +
						'<li id="' + self.options.levelDisplayLabel + '">' + self.options.levelDisplayLabelText + '</li>' +
						'<li id="' + self.options.levelDisplay + '">0</li>' +
					'</ul>' +
					'<div id="' + self.options.startButton + '" class="' + self.options.clearfixClass + '">' + self.options.startText + '</div>' +
					'<div id="' + self.options.pauseButton + '" class="' + self.options.clearfixClass + '">' + self.options.pauseText + '</div>' +
					'<div id="' + self.options.optMenuButton + '" class="' + self.options.clearfixClass + '">' + self.options.optMenuButtonText + '</div>' +
				'</div>'
			);
		};

		this.startNewGame = function() {
			var self = this;

			$('#' + self.options.startButton).html(self.options.endText);
			self.status = 'on';
			self.resetGame();
			self.score = 0;

			if(self.level === 0) {
				self.level = 1;
			}

			$('#' + self.options.scoreBoard).html(self.score);
			$('#' + self.options.levelDisplay).html(self.level);

			self.gameRoutine();
			self.setLevelInterval = setInterval(function() {
				self.setLevel();
			}, self.options.levelUpSpeed);
		};

		// set to default values
		this.resetGame = function() {
			var self = this;
			self.score = 0;
			self.level = 0;
			$('#' + self.options.gameOver).css({'display': 'none'});
			$('#' + self.options.scoreBoard).html(self.score);
			$('#' + self.options.levelDisplay).html(self.level);
			$('#' + self.options.carrier + ' .' + self.options.block).css({
				'top': 0,
				'left': 0,
				'background': 'transparent'
			});
			$('#' + self.options.carrier + ' .' + self.options.block).removeClass('colored');
			$('#' + self.options.preview + ' .' + self.options.block).removeAttr('style');
			$('#' + self.options.board + ' .' + self.options.blocked).each(function(index, block) {
				$(block).removeClass(self.options.blocked);
				$(block).css({
					'background': 'transparent'
				});
			});
		};

		this.endGame = function() {
			var self = this;
			self.status = 'off';
			clearInterval(self.moveInteral);
			clearInterval(self.setLevelInterval);
			$('#' + self.options.startButton).html(self.options.startText);
		};

		this.pauseGame = function() {
			var self = this;
			clearInterval(this.moveInterval);
			clearInterval(self.setLevelInterval);
			self.pause = true;
			$('#' + self.options.pauseButton).html(self.options.continueText);
		};

		this.continueGame = function() {
			var self = this;
			self.pause = false;
			self.moveInterval = setInterval(function() {
				self.moveBrick('down');
			}, self.options.speed);
			self.setLevelInterval = setInterval(function() {
				self.setLevel();
			}, self.options.levelUpSpeed);
			$('#' + self.options.pauseButton).html(self.options.pauseText);
		};

		// reset, restart on top with new block
		this.gameRoutine = function() {
			var self = this;
			self.x = 3;
			self.y = 0;

			self.updateScore();

			self.currentBrick = (self.nextBrick === undefined) ? self.chooseBlock() : self.nextBrick;

			self.currentCoordIndex = self.getRandom(0, 3);

			// if block is not in the first row of the carrier
			if(jQuery.grep(self.currentBrick.coords[self.currentCoordIndex], function(coord) { return coord / 4 < 1 }).length === 0) {
				self.y = -1;
			}

			$('#' + self.options.carrier).css({
				'top': self.y * self.brickHeight + '%',
				'left': self.x * self.brickWidth + '%'
			});

			self.insertBrick();

			self.nextBrick = self.chooseBlock();
			self.updatePreview();

			clearInterval(self.moveInterval);
			self.moveInterval = setInterval(function() {
				self.moveBrick('down');
			}, self.options.speed);
		};

		// choose a random block type
		this.chooseBlock = function() {
			var self = this;

			// ensures that a blocktype cannot recur more than 4 times in a row
			if(self.brickStack.length === 0) {
				jQuery.each(self.bricks, function(index, bricktype) {
					for(var i = 1; i <= 4; i++) {
						self.brickStack.push(bricktype);
					}
				});
			}

			// chooses a random block and removes it from stack
			// returns block object
			var randomindex = self.getRandom(0, self.getLength(self.brickStack) - 1);
			var currentBrick = self.brickStack.splice(randomindex, 1);
			return currentBrick[0];
		};

		this.insertBrick = function() {
			var self = this;
			self.change_x = 0;
			self.change_y = 0;

			if(self.checkNextStep()) {
				jQuery.each(self.currentBrick.coords[self.currentCoordIndex], function(index, coord) {
					$('#' + self.options.carrier + ' .' + self.options.block).eq(coord).addClass('colored');
					$('#' + self.options.carrier + ' .' + self.options.block).eq(coord).css({'background': self.currentBrick.color});
				});
			} else {
				$('#' + self.options.gameOver).css({'display': 'block'});
				self.endGame();
			}
		};

		this.updatePreview = function() {
			var self = this;

			$('#' + self.options.preview + ' .' + self.options.block).css({'background': 'none'});
			self.nextCoords = self.nextBrick.coords[self.getRandom(0, 3)];
			jQuery.each(self.nextCoords, function(index, coord) {
				$('#' + self.options.preview + ' .' + self.options.block).eq(coord).css({'background': self.nextBrick.color});
			});
		};

		this.turnBrick = function() {
			var self = this;

			// welches Koordinatenset würde als nächstes folgen
			var nxtCoordsIndex = (self.currentCoordIndex <= 2) ? self.currentCoordIndex + 1 : nxtCoordsIndex = 0;

			var blocked = false;
			var outside = false;

			jQuery.each(self.currentBrick.coords[nxtCoordsIndex], function(index, coord) {
				var block_y = (Math.floor(coord / 4)) + self.y;
				var block_x = (Math.floor(coord % 4)) + self.x;
				var blockIndex = block_y * self.options.cols + block_x;

				if($('#' + self.options.board + ' .' + self.options.block).eq(blockIndex).hasClass('fixed') === true) {
					blocked = true;
				}

				if(blockIndex < 0 || Math.floor(blockIndex / self.options.cols) < block_y || Math.floor(blockIndex / self.options.cols) > block_y) {
					outside = true;
				}
			});

			if(blocked === false && outside === false) {
				jQuery.each(self.currentBrick.coords[self.currentCoordIndex], function(index, coord) {
					$('#' + self.options.carrier + ' .' + self.options.block).eq(coord).removeClass('colored');
					$('#' + self.options.carrier + ' .' + self.options.block).eq(coord).css({'background': 'transparent'});
				});

				// nächstes Koordinatenset auswählen
				self.currentCoordIndex = (self.currentCoordIndex <= 2) ? self.currentCoordIndex + 1 : self.currentCoordIndex = 0;

				// Blocken entfernen und mit neuen Koordinaten hinzufügen
				$('#' + self.options.board + ' .' + self.options.current).removeClass('current');
				jQuery.each(self.currentBrick.coords[self.currentCoordIndex], function(index, coord) {
					$('#' + self.options.carrier + ' .' + self.options.block).eq(coord).addClass('colored');
					$('#' + self.options.carrier + ' .' + self.options.block).eq(coord).css({'background': self.currentBrick.color});
				});
			}
		};

		this.moveBrick = function(dir) {
			var self = this;

			if(self.status === 'on') {
				if(dir !== 'down') {
					if(dir === 'left') self.change_x = -1;
					if(dir === 'right') self.change_x = 1;
					self.change_y = 0;

					if(self.checkNextStep()) {
						self.x = self.x + self.change_x;
						$('#' + self.options.carrier).css({'left': self.x * self.brickWidth + '%'});
					}
				}

				if(dir === 'down') {
					self.change_x = 0;
					self.change_y = 1;

					if(self.checkNextStep()) {
						self.y++;
						$('#' + self.options.carrier).css({'top': self.y * self.brickHeight + '%'});
						self.nextStep = [];
					} else {
						clearInterval(self.moveInterval);
						jQuery.each(self.nextStep, function(index, coord) {
							$('#' + self.options.board + '>.' + self.options.block).eq(coord).css({'background': self.currentBrick.color});
							$('#' + self.options.board + '>.' + self.options.block).eq(coord).addClass(self.options.blocked);
						});
						$('#' + self.options.carrier + '>.' + self.options.block).removeClass('colored');
						$('#' + self.options.carrier + '>.' + self.options.block).css({'background': 'transparent'});

						if(self.busyChecking !== true) {
							self.checkRows();
						}
					}
				}
			}
		};

		// prüft, ob der nächste Schritt möglich ist
		// liefert true oder false
		this.checkNextStep = function() {
			var self = this;
			self.openWay = true;
			self.outOfBoard = false;
			self.nextBlockIndex = -1;
			self.nextStep = [];

			jQuery.each(self.currentBrick.coords[self.currentCoordIndex], function(index, coord) {
				self.cur_y = (Math.floor(coord / 4)) + self.y;
				self.cur_x = (Math.floor(coord % 4) + self.change_x) + self.x;
				self.next_x = self.cur_x + self.change_x;
				self.next_y = self.cur_y + self.change_y;
				self.curBlockIndex = self.cur_y * self.options.cols + self.cur_x;
				self.nextBlockIndex = self.next_y * self.options.cols + self.cur_x;
				self.blockOnTheRight = $('#' + self.options.board + '>.' + self.options.block).eq(self.nextBlockIndex);
				self.nextStep.push(self.curBlockIndex);

				if(self.change_y !== 0 && self.blockOnTheRight.length === 0) {
					self.outOfBoard = true;
				}

				if(self.change_y === 0 && (Math.floor(self.nextBlockIndex / self.options.cols) < self.cur_y || Math.floor(self.nextBlockIndex / self.options.cols) > self.cur_y)) {
					self.outOfBoard = true;
				}
				if(self.blockOnTheRight.length === 0 || self.blockOnTheRight.hasClass(self.options.blocked)) {
					self.openWay = false;
				}
			});

			if(self.openWay === true && self.outOfBoard === false) {
				return true;
			} else {
				return false;
			}
		};

		this.checkRows = function() {
			var self = this;

			self.busyChecking = true;
			self.deletedRows = [];
			var removeRow = true;
			for(var row = 0; row <= self.options.rows; row++) {
				removeRow = true;
				$('#' + self.options.board + '>.' + 'row_' + row).each(function(index, block) {
					if($(block).hasClass(self.options.blocked) === false) {
						removeRow = false;
					}

					if(index === self.options.cols - 1 && removeRow === true) {
						self.deletedRows.push(row);
					}
				});
			}
			if(self.deletedRows.length > 0) {
				self.rowBlink(0);
			} else {
				self.busyChecking = false;
				if(self.status === 'on') {
					self.gameRoutine();
				}
			}
		};

		this.removeRows = function() {
			var self = this;

			jQuery.each(self.deletedRows, function(index, row) {
				$('#' + self.options.board + ' .' + 'row_' + row).css({'background': 'none'});
				$('#' + self.options.board + ' .' + 'row_' + row).removeClass(self.options.blocked);

				for(var i = row-1; i >= 1; i--) {
					$('#' + self.options.board + ' .' + 'row_' + i).each(function(index, block) {
						if($(block).hasClass(self.options.blocked) === true) {
							$('#' + self.options.board + ' .' + 'row_' + (i + 1)).eq(index).attr('style', $(block).attr('style'));
							$('#' + self.options.board + ' .' + 'row_' + (i + 1)).eq(index).addClass(self.options.blocked);
							$(block).css({'background': 'none'});
							$(block).removeClass(self.options.blocked);
						}
					});
				}
			});
		};

		this.rowBlink = function(counter) {
			var self = this;

			if(counter === 0 || counter === 2) {
				setTimeout(function() {
					jQuery.each(self.deletedRows, function(index, row) {
						$('#' + self.options.board + ' .row_' + row).css({'visibility': 'hidden'});
					});
					self.rowBlink(++counter);
				}, 100);
			}
			if(counter === 1 || counter === 3) {
				setTimeout(function() {
					jQuery.each(self.deletedRows, function(index, row) {
						$('#' + self.options.board + ' .row_' + row).css({'visibility': 'visible'});
					});
					self.rowBlink(++counter);
				}, 100);
			}
			if(counter === 4) {
				self.removeRows();
				self.busyChecking = false;
				if(self.status === 'on') {
					self.gameRoutine();
				}
			}
		};

		this.updateScore = function() {
			var self = this;
			self.score += self.deletedRows.length * (self.level * 10 * self.deletedRows.length);
			$('#' + self.options.scoreBoard).html(self.score);
		};

		this.setLevel = function() {
			var self = this;
			self.level += 1;
			$('#' + self.options.levelDisplay).html(self.level);
			self.options.speed -= self.options.speed * 0.05;
		};

		this.toggleOptMenu = function(action) {
			var properties;
			if($('#' + this.options.optMenu).hasClass('active') === false) {
				properties = {
					'left': 0,
					'top': 0
				};
			} else {
				properties = {
					'left': '-100%',
					'top': 0
				};
			}
			$('#' + this.options.optMenu).animate(
				properties,
				{
					duration: 300,
					easing: 'swing'
				}
			);
			$('#' + this.options.optMenu).toggleClass('active');
		};

		// return random Number
		this.getRandom = function(min, max) {
    		return Math.floor(Math.random() * (max - min + 1) + min);
		};

		// return Object length
		this.getLength = function(obj) {
			return Object.keys(obj).length;
		};

		this.init(element, options);
	};

	$.fn.ttris = function(options) {
		return this.each(function() {
			new $.Ttris($(this), options);
		});
	};

	$.Ttris.defaults = {
		wrapper: 'ttris',
		board: 'board',
		menu: 'menu',
		levelDisplayWrapper: 'levelDisplayWrapper',
		levelDisplayLabel: 'levelDisplayLabel',
		levelDisplayLabelText: 'Level',
		levelDisplay: 'levelDisplay',
		preview: 'preview',
		block: 'block',
		blocked: 'fixed',
		carrier: 'carrier',
		clearfixClass: 'clearfix',

		scoreBoardWrapper: 'scoreBoardWrapper',
		scoreBoardLabel: 'scoreBoardLabel',
		scoreBoardLabelText: 'Score',
		scoreBoard: 'scoreBoard',						// Element ID

		startButton: 'startButton',
		pauseButton: 'pauseButton',

		startText: 'New Game',
		endText: 'End Game',
		pauseText: 'Pause',
		continueText: 'Continue',
		gameOver: 'gameover',
		gameOverText: 'Game Over',

		optMenu: 'optMenu',
		optMenuButton: 'optMenuButton',
		optMenuButtonText: 'Options',
		optMenuList: 'optMenuList',

		rows: 20,
		cols: 10,
		size: 20,
		speed: 3000,
		levelUpSpeed: 10000
	};
})(jQuery, window);