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
    }

    create() {
        // define keys for player to move
        this.keys = {
            'up': this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            'down': this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
            'left': this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
            'right': this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT)
        }
        this.state = {
            time:0,
            x:startPos1.x,
            y:startPos1.y,
            direction:'SOUTH',
            interact:0
        };
        this.player_collision_tile = null;
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
        // sets collision for everything but floor
        // creates the interactable layer


        /*
        We need to define the interact functions later for each kind of tile we might have
        we will then set a setTileIndexCallback for each of these functions to be called
        when they collide with that tile
        This will then change the image and env if applicable.
        */



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
        this.movePlayer(this.player, envConstants.playerSpeed, this.keys);
        // Updating movement of other players

        // updating state
        // each update is 1/FPS seconds
        // all other updates are handled in functions below
        this.state.time += 1/envConstants.FPS;
    }
    
    movePlayer(player, speed, keys) {
        player.body.setVelocity(0);

        // Movement system gives priority to the FIRST key pressed
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
        
        // update state to reflect player position
        this.state.x = player.body.x;
        this.state.y = player.body.y;
        // this.socket.emit('playerMovement', {x: this.player_x, y: this.player_y});
        // Socket.io reference removed
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
        this.player_collision_tile = tile.index
        // update state to reflect interaction
        this.state.interact = tile.index;
    }
}

