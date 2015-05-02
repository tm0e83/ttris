window.addEvent('domready', function() {
	var Tetris = new Class({
		Implements: Options,
		options: {
			wrapper: 'tetris',
			board: 'board',
			grid: 'grid',
			menu: 'menu',
			levelDisplayWrapper: 'levelDisplayWrapper',
			levelDisplayLabel: 'levelDisplayLabel',
			levelDisplayLabelText: 'Level',
			levelDisplay: 'levelDisplay',
			preview: 'preview',
			block: 'block',
			blocked: 'fixed',
			carrier: 'carrier',
			
			scoreBoardWrapper: 'scoreBoardWrapper',
			scoreBoardLabel: 'scoreBoardLabel',
			scoreBoardLabelText: 'Score',
			scoreBoard: 'scoreBoard',
			
			startButton: 'startButton',
			pauseButton: 'pauseButton',
			soundButton: 'soundButton',
			soundBox : 'soundBox',
			
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
			
			rows: 10,
			cols: 20,
			size: 20,
			speed: 3000,
			levelUpSpeed: 10000,
			sound: false,
			
			clearfixClass: 'clearfix'
		},
		
		x: 0,
		y: 0,
		busyChecking: false,
		status: 'off',
		pause: false,
		setLevelInterval : '',
		moveInterval: '',
		score: '',
		currentBrick: '', // enthält aktives Brick Objekt zur Laufzeit
		nextBrick: undefined,
		currentCoordIndex: '',
		nextCoords: '',
		level: 1,
		brickStack: [],
		deletedRows: [],
		bricks: {
			type_1: { color: 'red', coords: [[4,5,6,7],[1,5,9,13],[4,5,6,7],[1,5,9,13]] },
			type_2: { color: 'blue', coords: [[1,2,5,6],[1,2,5,6],[1,2,5,6],[1,2,5,6]] },
			type_3: { color: 'yellow', coords: [[1,4,5,6],[1,5,6,9],[4,5,6,9],[1,4,5,9]] },
			type_4: { color: 'fuchsia', coords: [[1,5,8,9],[0,4,5,6],[1,2,5,9],[4,5,6,10]] },
			type_5: { color: 'lime', coords: [[0,4,8,9],[8,4,5,6],[0,1,5,9],[6,8,9,10]] },
			type_6: { color: 'cyan', coords: [[8,9,5,6],[0,4,5,9],[8,9,5,6],[0,4,5,9]] },
			type_7: { color: 'orange', coords: [[4,5,9,10],[1,5,4,8],[4,5,9,10],[1,5,4,8]] }
		},
		
		initialize: function(options) {
			this.setOptions(options);
			this.buildBoard();
			this.createPreview();
			this.setEvents();
			$(this.options.scoreBoard).set('html', '0');
			$(this.options.levelDisplay).set('html', '0');
		},
		
		setEvents: function() {
			$(this.options.startButton).addEvent('click', function() {
				if(this.status == 'off') {
					this.startNewGame();
				} else {
					this.resetGame();
					this.endGame();
				}
			}.bind(this));
			$(this.options.pauseButton).addEvent('click', function() {
				if(this.status == 'on') {
					if(this.pause == false) {
						this.pauseGame();
					} else {
						this.continueGame();
					}
				}
			}.bind(this));
			
/* 			$(this.options.soundButton).addEvent('click', function() {
				if(this.options.sound == 'false') {
					this.options.sound = 'true';
					$(this.options.soundButton).setStyle('background-position', 'left top');
					if(this.options.status == 'on') this.playSound();
				} else {
					this.options.sound = 'false';
					$(this.options.soundButton).set('html', '');
					$(this.options.soundButton).setStyle('background-position', 'right top');
				}
			}.bind(this)); */
			
			$(this.options.optMenuButton).addEvent('click', function() {
				if($(this.options.optMenu).hasClass('active')) {
					this.toggleOptMenu('hide');
				} else {
					this.toggleOptMenu('show');
				}
			}.bind(this));
			$('optMenu_levelUp').addEvent('click', function() {
				if(parseInt($('optMenu_level').get('value')) < 999) {
					$('optMenu_level').set('value', parseInt($('optMenu_level').get('value')) + 1);
				}
			});
			$('optMenu_levelDown').addEvent('click', function() {
				if(parseInt($('optMenu_level').get('value')) > 0) {
					$('optMenu_level').set('value', parseInt($('optMenu_level').get('value')) - 1);
				}
			});
			$('optMenu_sound').addEvent('click', function() {
				if($('optMenu_soundSetting').get('html') == 'OFF') {
					$('optMenu_soundSetting').set('html', 'ON');
					$('optMenu_soundSetting').removeClass('soundOff');
					$('optMenu_soundSetting').addClass('soundOn');
				} else {
					$('optMenu_soundSetting').set('html', 'OFF');
					$('optMenu_soundSetting').removeClass('soundOn');
					$('optMenu_soundSetting').addClass('soundOff');
				}
			});
			$('optMenu_themeSetting').addEvent('change', function() {
				switch($('optMenu_themeSetting').getSelected()[0].get('html')) {
					case 'none': {
						$(this.options.grid).setStyle('background', 'url(images/black_transp_pixel.png) left top repeat');
						break;
					}
					case 'beach': {
						$(this.options.grid).setStyle('background', 'url(images/beach.jpg) center top no-repeat');
						$(this.options.grid).setStyle('background-size', 'auto 100%');
						$$('#' + this.options.menu + ' *').setStyle('color', '#24a');
						break;
					}
					case 'sunset': {
						$(this.options.grid).setStyle('background', 'url(images/sunset.jpg) center top no-repeat');
						$(this.options.grid).setStyle('background-size', 'auto 100%');
						break;
					}
					case 'forest': {
						$(this.options.grid).setStyle('background', 'url(images/forest.jpg) center top no-repeat');
						$(this.options.grid).setStyle('background-size', 'auto 100%');
						break;
					}
					case 'avatar': {
						$(this.options.grid).setStyle('background', 'url(images/avatar.jpg) center top no-repeat');
						$(this.options.grid).setStyle('background-size', 'auto 100%');
					}
				}
			}.bind(this));
			
			// Speichern der Änderungen im Optionsmenü
			$('optMenu_saveButton').addEvent('click', function() {
				this.level = parseInt($('optMenu_level').get('value'));
				$('levelDisplay').set('html', this.level);
				// Geschwindigkeit an Level anpassen
				for(var i = 0; i < this.level; i++) {
					this.options.speed -= this.options.speed * 0.05;
				}
				if($('optMenu_soundSetting').get('html') == 'OFF') {
					this.options.sound = false;
				} else {
					this.options.sound = true;
				}
				this.toggleOptMenu('hide');
			}.bind(this));
			
			// Verwerfen der Änderungen im Optionsmenü
 			$('optMenu_cancelButton').addEvent('click', function() {
				this.toggleOptMenu('hide');
			}.bind(this)); 
			
			window.addEvent('keydown', function(event) {
				switch(event.key) {
					case 'up': {
						this.turnBrick();
						break;
					}
					case 'left': {
						this.moveBrick('left');
						break;
					}
					case 'right': {
						this.moveBrick('right');
						break;
					}
					case 'down': {
						this.moveBrick('down');
						break;
					}
				}
			}.bind(this));
		},
		
		toggleOptMenu: function(action) {
			if(action == 'hide') {
				var openMenu = new Fx.Morph($(this.options.optMenu), {
					duration: 300,
					transition: Fx.Transitions.Sine.easeInOut
				}).start({
					'opacity': [100,0],
					'width': [200,0],
					'height': [350,0],
					'left': [0,100],
					'top': [0,175]
				});
			} else {
				var openMenu = new Fx.Morph($(this.options.optMenu), {
					duration: 300,
					transition: Fx.Transitions.Sine.easeInOut
				}).start({
					'opacity': [0,100],
					'width': [0,200],
					'height': [0,350],
					'left': [100,0],
					'top': [175,0]
				});
			}
			$(this.options.optMenu).toggleClass('active');
		},
		
		buildBoard: function() {
			var gameOver = new Element('div', { id: this.options.gameOver, html: this.options.gameOverText }).inject($(this.options.wrapper), 'top');
			var board = new Element('div', { id: this.options.board }).inject($(this.options.wrapper), 'top');
			var grid = new Element('div', { id: this.options.grid }).inject($(this.options.wrapper), 'top');
			
			// Spielfeld Raster
			for(var row = 1; row <= 20; row++) {
				for(var column = 1; column <= 10; column++) {
					var block = new Element('div', {
						class: 'block' + ' row_' + row + ' col_' + column
					}).inject($(this.options.board), 'bottom');
					var block2 = new Element('div', {
						class: 'block2'
					}).inject($('grid'), 'bottom');
				}
			}
			
			// Optionsmenü
			var optMenu = new Element('div', { id: this.options.optMenu }).inject($(this.options.board), 'bottom').adopt(
				new Element('ul', {
					id: this.options.optMenuList
				}).adopt(
					new Element('li').adopt(
						new Element('div', { id: 'optMenu_levelLabel', class: 'leftCol', html: 'Level' }),
						new Element('div', { class: 'middleCol' }).adopt(
							new Element('input', { id: 'optMenu_level', type: 'text', maxlength: '3', value: '0' })
						),
						new Element('div', { id: 'optMenu_levelSetting', class: 'rightCol' }).adopt(
							new Element('div', { id: 'optMenu_levelUp', class: 'optMenu_up' }),
							new Element('div', { id: 'optMenu_levelDown', class: 'optMenu_down' })
						)
					),
					new Element('li', { id: 'optMenu_sound' }).adopt(
						new Element('div', { id: 'optMenu_soundLabel', class: 'leftCol', html: 'Sound' }),
						new Element('div', { id: 'optMenu_soundSetting', class: 'middleCol soundOff', html: 'OFF' }),
						new Element('div', { class: 'rightCol' })
					),
					new Element('li', { id: 'optMenu_theme' }).adopt(
						new Element('div', { id: 'optMenu_themeLabel', class: 'leftCol', html: 'Theme' }),
						new Element('div', { class: 'middleCol' }).adopt(
							new Element('select', { id: 'optMenu_themeSetting', size: '1' }).adopt(
								new Element('option', { html: 'none' }),
								new Element('option', { html: 'beach' }),
								new Element('option', { html: 'sunset' }),
								new Element('option', { html: 'forest' }),
								new Element('option', { html: 'avatar' })
							)
						)
					)
				)
			).adopt(
				new Element('div', { id: 'optMenu_buttonWrapper' }).adopt(
					new Element('div', { id: 'optMenu_saveButton', html: 'Save' }),
					new Element('div', { id: 'optMenu_cancelButton', html: 'Cancel' })
				)
			);
			
			// Menü
			var menu = new Element('div', { id: this.options.menu }).adopt(
				new Element('div', { id: this.options.preview, class: this.options.clearfixClass }),
				new Element('ul', { id: this.options.scoreBoardWrapper, class: this.options.clearfixClass }).adopt(
					new Element('li', { id: this.options.scoreBoardLabel, html: this.options.scoreBoardLabelText }),
					new Element('li', { id: this.options.scoreBoard })
				),
				new Element('ul', { id: this.options.levelDisplayWrapper, class: this.options.clearfixClass }).adopt(
					new Element('li', { id: this.options.levelDisplayLabel, html: this.options.levelDisplayLabelText }),
					new Element('li', { id: this.options.levelDisplay })
				),
				new Element('div', { id: this.options.startButton, html: this.options.startText }),
				new Element('div', { id: this.options.pauseButton, html: this.options.pauseText }),
				new Element('div', { id: this.options.optMenuButton, html: this.options.optMenuButtonText }),
				// new Element('div', { id: this.options.soundButton })
				new Element('div', { id: this.options.soundBox })
			).inject($(this.options.wrapper), 'bottom');
			
			// carrier Element
			var carrier = new Element('div', {
				id: this.options.carrier,
				style: 'width:' + 4 * this.options.size + 'px; height:' + 4 * this.options.size + 'px;'
			}).inject($(this.options.board), 'bottom');
			
			// carrier Block Raster
			for(var row = 1; row <= 4; row++) {
				for(var column = 1; column <= 4; column++) {
					var block = new Element('div', {
						class: 'block' + ' row_' + row + ' col_' + column
					}).inject($(this.options.carrier), 'bottom'); 	
				}
			}
		},
		
		createPreview: function() {
			// Preview Raster
			$(this.options.preview).setStyle('width', this.options.size * 4 + 'px');
			for(var row = 1; row <= 4; row++) {
				for(var column = 1; column <= 4; column++) {
					var block = new Element('div', {
						class: 'block' + ' row_' + row + ' col_' + column
					}).inject($(this.options.preview), 'bottom');
				}
			}
		},
		
		startNewGame: function() {
			$(this.options.startButton).set('html', this.options.endText);
			this.status = 'on';
			this.resetGame();
			this.playSound();
			this.score = 0;
			if(this.level == 0) {
				this.level = 1;
			}
			$(this.options.scoreBoard).set('html', this.score);
			$(this.options.levelDisplay).set('html', this.level);
			this.gameRoutine();
			this.setLevelInterval = this.setLevel.periodical(this.options.levelUpSpeed, this);
		},
		
		resetGame: function() {
			this.score = 0;
			this.level = 0;
			$(this.options.gameOver).setStyle('display', 'none');
			$(this.options.scoreBoard).set('html', this.score);
			$(this.options.levelDisplay).set('html', this.level);
			$$('#' + this.options.carrier + '>.' + this.options.block).removeProperty('style');	
			$$('#' + this.options.preview + '>.' + this.options.block).removeProperty('style');	
			$$('#' + this.options.board + '>.' + this.options.blocked).each(function(block, index) {
				block.removeClass(this.options.blocked);
				block.removeProperty('style');
			}.bind(this));	
		},
		
		endGame: function() {
			this.status = 'off';
			clearInterval(this.moveInteral);
			clearInterval(this.setLevelInterval);
			$(this.options.startButton).set('html', this.options.startText);
		},
		
		pauseGame: function() {
			clearInterval(this.moveInterval);
			this.pause = true;
			$(this.options.pauseButton).set('html', this.options.continueText);
		},
		
		continueGame: function() {
			this.pause = false;
			this.moveInterval = this.moveBrick.periodical(this.options.speed, this, 'down');
			$(this.options.pauseButton).set('html', this.options.pauseText);
		},
		
		gameRoutine: function() {
			// Resetten und von vorne anfangen
			this.x = 3;
			this.y = 0;
			$(this.options.carrier).setStyles({
				'top': this.y * this.options.size + 'px',
				'left': this.x * this.options.size + 'px'
			});
			
			this.updateScore();
							
			this.currentBrick = (this.nextBrick == undefined) ? this.chooseBlock() : this.nextBrick;
			this.insertBrick();
			
			this.nextBrick = this.chooseBlock();
			this.updatePreview();
			
			clearInterval(this.moveInterval);
			this.moveInterval = this.moveBrick.periodical(this.options.speed, this, 'down');
		},
		
		chooseBlock: function() {
			// stellt sicher, dass jeder Blocktyp bis zu 4 mal nacheinander
			// erscheinen kann, bevor ein anderes Blocktyp gewählt wird
			if(this.brickStack.length == 0) {
				Object.each(this.bricks, function( bricktype, index) {
					for(var i = 1; i <= 4; i++) {
						this.brickStack.push(bricktype);
					}
				}.bind(this));
			}
			// wählt einen zufälligen Block und entfernt ihn vom Stack
			// gibt das Block Objekt zurück
			var objLength = Object.getLength(this.brickStack);
			var randomindex = Number.random(0, Object.getLength(this.brickStack) - 1);
			var currentBrick = this.brickStack.splice(randomindex, 1);
			return currentBrick[0];
		},
		
		insertBrick: function() {
			this.currentCoordIndex = Number.random(0, 3);
			this.change_x = 0;
			this.change_y = 0;
			if(this.checkNextStep()) {
				this.currentBrick.coords[this.currentCoordIndex].each(function(coord, index) {
					$$('#' + this.options.carrier + ' .' + this.options.block)[coord].setStyle('background', this.currentBrick.color);
				}.bind(this));
			} else {
				$(this.options.gameOver).setStyle('display', 'block');
				this.endGame();
			}
		},
		
		updatePreview: function() {
			$$('#' + this.options.preview + ' .' + this.options.block).setStyle('background', 'none');
			this.nextCoords = this.nextBrick.coords[Number.random(0, 3)];
			this.nextCoords.each(function(coord, index) {
				$$('#' + this.options.preview + ' .' + this.options.block)[coord].setStyle('background', this.nextBrick.color);
			}.bind(this));
		},
		
		turnBrick: function() {
			// welches Koordinatenset würde als nächstes folgen
			if(this.currentCoordIndex <= 2) nxtCoordsIndex = this.currentCoordIndex + 1;
			else nxtCoordsIndex = 0;
			
			blocked = false;
			outside = false;
			
			this.currentBrick.coords[nxtCoordsIndex].each(function(coord, index) {
				block_y = (Math.floor(coord / 4)) + this.y;
				block_x = (Math.floor(coord % 4)) + this.x;
				blockIndex = block_y * 10 + block_x;
				if($$('#' + this.options.board + ' .' + this.options.block)[blockIndex].hasClass('fixed')) {
					blocked = true;
				}
				if(Math.floor(blockIndex / 10) < block_y || Math.floor(blockIndex / 10) > block_y) {
					outside = true;
				}
			}.bind(this));
			
			if(blocked == false && outside == false) {
				this.currentBrick.coords[this.currentCoordIndex].each(function(coord, index) {
					$$('#' + this.options.carrier + ' .' + this.options.block)[coord].removeProperty('style');
				}.bind(this));
				
				// nächstes Koordinatenset auswählen
				if(this.currentCoordIndex <= 2) this.currentCoordIndex++
				else this.currentCoordIndex = 0;
				
				// Blocken entfernen und mit neuen Koordinaten hinzufügen
				$$('#' + this.options.board + ' .' + this.options.current).removeClass('current');
				this.currentBrick.coords[this.currentCoordIndex].each(function(coord, index) {
					$$('#' + this.options.carrier + ' .' + this.options.block)[coord].setStyle('background', this.currentBrick.color);
				}.bind(this));
			}
		},
		
		moveBrick: function(dir) {
			if(this.status == 'on') {
				if(dir != 'down') {
					if(dir == 'left') this.change_x = -1;
					if(dir == 'right') this.change_x = 1;
					this.change_y = 0;
					
					if(this.checkNextStep()) {
						this.x = this.x + this.change_x;
						$(this.options.carrier).setStyle('left', this.x * this.options.size + 'px');
					}
				}
				
				if(dir == 'down') {
					this.change_x = 0;
					this.change_y = 1;

					if(this.checkNextStep()) {
						this.y++;
						$(this.options.carrier).setStyle('top', this.y * this.options.size + 'px');
						this.nextStep.empty();
					} else {
						clearInterval(this.moveInterval);
						this.nextStep.each(function(coord, index) {
							$$('#' + this.options.board + '>.' + this.options.block)[coord].setStyle('background', this.currentBrick.color);
							$$('#' + this.options.board + '>.' + this.options.block)[coord].addClass(this.options.blocked);
						}.bind(this));
						$$('#' + this.options.carrier + '>.' + this.options.block).removeProperty('style');
						
						if(this.busyChecking != true) {
							this.checkRows();
						}
					}
				}
			}
		},
		
		// prüft, ob der nächste Schritt möglich ist
		// liefert true oder false
		checkNextStep: function() {
			this.openWay = true;
			this.outOfBoard = false;
			this.nextBlockIndex;
			this.nextStep = [];
			
			this.currentBrick.coords[this.currentCoordIndex].each(function(coord, index) {
				this.cur_y = (Math.floor(coord / 4)) + this.y;
				this.cur_x = (Math.floor(coord % 4) + this.change_x) + this.x;
				this.next_x = this.cur_x + this.change_x;
				this.next_y = this.cur_y + this.change_y;
				this.curBlockIndex = this.cur_y * 10 + this.cur_x;
				this.nextBlockIndex = this.next_y * 10 + this.cur_x;
				
				this.blockOnTheRight = $$('#' + this.options.board + '>.' + this.options.block)[this.nextBlockIndex];
				this.nextStep.push(this.curBlockIndex);
				
				if(this.change_y != 0 && this.blockOnTheRight == undefined) {
					this.outOfBoard = true;
				}
				if(this.change_y == 0 && (Math.floor(this.nextBlockIndex / 10) < this.cur_y || Math.floor(this.nextBlockIndex / 10) > this.cur_y)) {
					this.outOfBoard = true;
				}
				if(this.blockOnTheRight == undefined || this.blockOnTheRight.hasClass(this.options.blocked)) {
					this.openWay = false;
				}
			}.bind(this));
			if(this.openWay == true && this.outOfBoard == false) {
				return true;
			} else {
				return false;
			}
		},
		
		playSound: function() {
/* 			if(this.options.sound == true) this.options.sound = false;
			else this.options.sound = true; */
			if(this.options.sound == true) {
				var theme = new Swiff('theme.swf',{
					id: 'theme',
					width: 10,
					height: 10,
					container: $(this.options.soundBox),
					vars: {
					},
					params: {
						wMode: 'transparent',
						loop: true
					}
				});
			}
		},
		
		checkRows: function() {
			this.busyChecking = true;
			this.deletedRows.empty();
			var removeRow = true;
			for(var row = 0; row <= 20; row++) {
				removeRow = true;
				$$('#' + this.options.board + '>.' + 'row_' + row).each(function(block, index) {
					if(block.hasClass(this.options.blocked) == false) removeRow = false;
					
					if(index == 9 && removeRow == true) {
						this.deletedRows.push(row);	
					}
				}.bind(this));
			}
			if(this.deletedRows.length > 0) {
				this.rowBlink(0);
			} else {
				this.busyChecking = false;
				if(this.status == 'on') this.gameRoutine();
			}
		},
		
		removeRows: function() {
			this.deletedRows.each(function(row, index) {
				$$('#' + this.options.board + '>.' + 'row_' + row).setStyle('background', 'none');
				$$('#' + this.options.board + '>.' + 'row_' + row).removeClass(this.options.blocked);
				for(var i = row-1; i >= 1; i--) {
					$$('#' + this.options.board + '>.' + 'row_' + i).each(function(block, index) {
						if(block.hasClass(this.options.blocked) == true) {
							$$('#' + this.options.board + '>.' + 'row_' + (i + 1))[index].set('style', block.get('style'));
							$$('#' + this.options.board + '>.' + 'row_' + (i + 1))[index].addClass(this.options.blocked);
							block.setStyle('background', 'none');
							block.removeClass(this.options.blocked);
						}
					}.bind(this));
				}
			}.bind(this));
		},
		
		rowBlink: function(counter) {
			if(counter == 0 || counter == 2) {
				setTimeout(function() {
					this.deletedRows.each(function(row, index) {
						$$('#' + this.options.board + '>.' + 'row_' + row).setStyle('visibility', 'hidden');
					}.bind(this));
					this.rowBlink(++counter);
				}.bind(this), 100);
			}
			if(counter == 1 || counter == 3) {
				setTimeout(function() {
					this.deletedRows.each(function(row, index) {
						$$('#' + this.options.board + '>.' + 'row_' + row).setStyle('visibility', 'visible');
					}.bind(this));
					this.rowBlink(++counter);
				}.bind(this), 100);
			}
			if(counter == 4) {
				this.removeRows();
				this.busyChecking = false;
				if(this.status == 'on') this.gameRoutine();
			}
		},
		
		updateScore: function() {
			this.score += this.deletedRows.length * (this.level * 10 * this.deletedRows.length);
			$(this.options.scoreBoard).set('html', this.score);
		},

		setLevel: function() {
			this.level += 1;
			$(this.options.levelDisplay).set('html', this.level);
			this.options.speed -= this.options.speed * 0.05;
		}
	});
	var tetris = new Tetris();
});