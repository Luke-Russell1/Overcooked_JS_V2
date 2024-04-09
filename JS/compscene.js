const expConstants = {
    blocks: 3,
    trialNo: 12,
    trialTime: 60
};

const envConstants = {
    playerSpeed: 4,
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

export default class CompScene extends Phaser.Scene {
    constructor() {
        super("CollabScene");
    }

    preload() {
        this.load.image('environment', '../Assets/environment.png');
        this.load.atlas('agents', '../Assets/agents.png', '../Assets/agents.json');
        this.load.tilemapCSV('map', '../layouts/layout_1V2.csv')
    }

    create() {
        // define keys for player to move
        this.keys = {
            'up': this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            'down': this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
            'left': this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
            'right': this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT)
        }
        // define cursors and player data to be sent to server
        this.player_x = [];
        this.player_y = [];
        const scene = this;
        // Creates and loads the tilemap 
        this.map = this.make.tilemap({ key: 'map', tileWidth: envConstants.tileSize, tileHeight: envConstants.tileSize });
        this.tileset = this.map.addTilesetImage('environment', null, envConstants.tileSize, envConstants.tileSize, 0, 0);
        //creates the collision layer
        this.collisionLayer = this.map.createStaticLayer(0, this.tileset, 0, 0);
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

        // sets collision for player
        // define directions

    }

    update() {
        // Move player method
        this.movePlayer(this.player, envConstants.playerSpeed, this.keys);
        // Updating movement of other players
    }

    movePlayer(player, speed, keys) {
        player.body.setVelocity(0);
        if (keys.left.isDown) {
            player.body.setVelocityX(-speed)

        } else if (keys.right.isDown) {
            player.body.setVelocityX(speed);
        }
        if (keys.up.isDown) {
            player.body.setVelocityY(-speed);
        } else if (keys.down.isDown) {
            player.body.setVelocityY(speed);
        }
        this.player_x = player.body.x;
        this.player_y = player.body.y;
        // this.socket.emit('playerMovement', {x: this.player_x, y: this.player_y});
        // Socket.io reference removed
    }
}
