const expConstants = {
    blocks: 3,
    trialNo: 12,
    trialTime: 60
};

const envConstants = {
    playerSpeed: 120,
    FPS: 60,
    tileSize: 45,
};

const startPos1 = {
    x: 8 * envConstants.tileSize,
    y: 8 * envConstants.tileSize
};
const startPos2 = {
    x: 10 * envConstants.tileSize,
    y: 8 * envConstants.tileSize
};

export default class CollabScene extends Phaser.Scene {
    constructor() {
        super("CollabScene");
    }

    preload() {
        this.load.image('environment', './Assets/environment.png');
        this.load.atlas('agents', './Assets/agents.png', './Assets/agents.json');
        this.load.tilemapCSV('map', './layouts/layout_1V2.csv')
        this.load.atlas('objects', './Assets/objects.png', './Assets/objects.json');
        this.load.atlas('soups', './Assets/soups.png', './Assets/soups.json');

    }

    create() {
        // define keys for player to move
        this.keys = {
            'up': this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            'down': this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
            'left': this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
            'right': this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
            'interact': this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
            'DRT': this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
        }

        // data to record and be sent
        this.state = {
            time:0,
            x:startPos1.x,
            y:startPos1.y,
            direction:'SOUTH',
            interact:0,
            player_collision_tile:null
        };

        // defining directions and suffixes for directions
        this.directions = ['NORTH', 'EAST', 'SOUTH', 'WEST'];
        this.onion = '-onion.png';
        this.onion_soup = '-onion-soup.png';
        this.dish = '-dish.png';
        this.tomato = '-tomato.png';
        this.tomato_soup = '-tomato-soup.png';
        this.pot_onion = ['onion-pot-1.png', 'onion-pot-2.png', 'onion-pot-3.png'];
        this.pot_tomato = ['tomato-pot-1.png', 'tomato-pot-2.png', 'tomato-pot-3.png'];
        this.cooking_onion = ['onion-cooking-1.png', 'onion-cooking-2.png', 'onion-cooking-3.png', 'onion-cooked.png'];

        this.player_collision_tile = null;
        this.interact_key = false;
        this.player_interact = 0;
        const scene = this;

        // Creates and loads the tilemap 
        this.map = this.make.tilemap({ key: 'map', tileWidth: envConstants.tileSize, tileHeight: envConstants.tileSize });
        this.tileset = this.map.addTilesetImage('environment', null, envConstants.tileSize, envConstants.tileSize, 0, 0);
        //creates the collision layer
        this.layer = this.map.createLayer(0, this.tileset, 0, 0);
        
        const tilesToCollideWith = [0, 1, 3, 4, 5]; // Example tile indices to collide with
        this.layer.setCollision(tilesToCollideWith);

        // Set callbacks for collision events
        this.layer.setTileIndexCallback(tilesToCollideWith, this.handleTileCollision, this);

        // creates and loads the players
        this.players = this.physics.add.group();

        // default player image is SOUTH
        this.player = this.physics.add.sprite(startPos1.x, startPos1.y, 'agents', 'SOUTH.png');
        this.otherPlayer = this.physics.add.sprite(startPos2.x, startPos2.y, 'agents', 'SOUTH.png');
        this.physics.world.enable(this.player);
        this.physics.world.enable(this.otherPlayer);

    }
    update() {
        // sets collision
        this.physics.world.collide(this.player, this.layer);
        this.physics.world.collide(this.otherPlayer, this.layer);
        // collision between players
        this.physics.world.collide(this.player, this.otherPlayer);

        // Move player method
        this.movePlayer(this.player, envConstants.playerSpeed, this.keys, this.player_interact);
        // Updating movement of other players

        // updating state
        // each update is 1/FPS seconds
        // all other updates are handled in functions below
        this.state.time += 1/envConstants.FPS;
        this.handleKeyInteraction();
        this.handleTileInteraction();
    }
    
    movePlayer(player, speed, keys, interact) {
        player.body.setVelocity(0);

        // Movement system gives priority to the FIRST key pressed
        if (this.player_interact == 0) {
            if (keys.left.isDown) {
                player.body.setVelocityX(-speed);
                this.updateDirection(player, 'WEST');
            } else if (keys.right.isDown) {
                player.body.setVelocityX(speed);
                this.updateDirection(player, 'EAST');
            } else if (keys.up.isDown) {
                player.body.setVelocityY(-speed);
                this.updateDirection(player, 'NORTH');
            } else if (keys.down.isDown) {
                player.body.setVelocityY(speed);
                this.updateDirection(player, 'SOUTH');
        }
        else if (this.player_interact == 1) {
            if (keys.left.isDown) {
                player.body.setVelocityX(-speed);
                this.updateDirection(player, 'WEST-dish');
            } else if (keys.right.isDown) {
                player.body.setVelocityX(speed);
                this.updateDirection(player, 'EAST-dish');
            } else if (keys.up.isDown) {
                player.body.setVelocityY(-speed);
                this.updateDirection(player, 'NORTH-dish');
            } else if (keys.down.isDown) {
                player.body.setVelocityY(speed);
                this.updateDirection(player, 'SOUTH-dish');
            }
        }
        else if (this.player_interact == 3) {
            if (keys.left.isDown) {
                player.body.setVelocityX(-speed);
                this.updateDirection(player, 'WEST-onion');
            }
            else if (keys.right.isDown) {
                player.body.setVelocityX(speed);
                this.updateDirection(player, 'EAST-onion');
            }
            else if (keys.up.isDown) {
                player.body.setVelocityY(-speed);
                this.updateDirection(player, 'NORTH-onion');
            }
            else if (keys.down.isDown) {
                player.body.setVelocityY(speed);
                this.updateDirection(player, 'SOUTH-onion');
            }
        }
        else if (this.player_interact == 6) {
            if (keys.left.isDown) {
                player.body.setVelocityX(-speed);
                this.updateDirection(player, 'WEST-tomato');
            }
            else if (keys.right.isDown) {
                player.body.setVelocityX(speed);
                this.updateDirection(player, 'EAST-tomato');
            }
            else if (keys.up.isDown) {
                player.body.setVelocityY(-speed);
                this.updateDirection(player, 'NORTH-tomato');
            }
            else if (keys.down.isDown) {
                player.body.setVelocityY(speed);
                this.updateDirection(player, 'SOUTH-tomato');
            }
        }
    }

        // update state to reflect player position
        this.state.x = player.body.x;
        this.state.y = player.body.y;
    }

    updateDirection(player, direction) {
        // Update player frame based on direction
        const filename = `${direction}.png`;
        player.setFrame(filename);
        // update state to reflect direction
        this.state.direction = direction;
    }

    handleTileCollision(player, tile) {
        // Stores tile that the player is colliding with to be used for interactions later
        // we want to have a value that we just refer to, but also one that we store for later 
        // might be a little redundant??
        this.player_collision_tile = tile.index
        this.state.player_collision_tile = tile.index;
    }
    handleKeyInteraction() {
        // literally just returns value if interact key is pressed
        if (this.keys.interact.isDown) {
            this.interact_key = true;
        } else {
            this.interact_key = false;
        }
    }
    handleTileInteraction() {
        // Handle interaction with specific tile
        // Checks if they press key and what tile they are interacting with
        // can then use this to set thier image. 
        //
          if (this.interact_key == true) {
            if (this.player_collision_tile == 1) {
                console.log("Dish");
                this.player_interact = 1;
            }
            else if (this.player_collision_tile == 3) {
                console.log("Onion");
                this.player_interact = 3;
            }
            else if (this.player_collision_tile == 4) {
                console.log("Pot");
                this.player_interact = 4;
            }
            else if (this.player_collision_tile == 5) {
                console.log("Serve");
                this.player_interact = 5;
            }
            else if (this.player_collision_tile == 6) {
                console.log("Tomato");
                this.player_interact = 6;
            }
            else {
                this.player_interact = 0;
            }
        }
    }
}

