const expConstants = {
  blocks: 3,
  trialNo: 12,
  trialTime: 60,
};

const envConstants = {
  playerSpeed: 240,
  FPS: 60,
  tileSize: 45,
  cookingTime: 3000
};

const startPos1 = {
  x: 8 * envConstants.tileSize,
  y: 8 * envConstants.tileSize,
};
const startPos2 = {
  x: 10 * envConstants.tileSize,
  y: 8 * envConstants.tileSize,
};

export default class CollabScene extends Phaser.Scene {
  constructor() {
    super("CollabScene");
  }

  preload() {
    // ENV is used to draw map
    this.load.image("environment", "./Assets/environment.png");
    // Terrain is used to draw images and change them over the map
    this.load.atlas('terrain', './Assets/environment.png', './Assets/environment.json');
    this.load.atlas("agents", "./Assets/agents.png", "./Assets/agents.json");
    this.load.tilemapCSV("map", "./layouts/layout_1V2.csv");
    this.load.atlas("soups", "./Assets/soups.png", "./Assets/soups.json");
  }

  create() {
    // define keys for player to move
    this.keys = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      interact: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      DRT: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    };

    // data to record and be sent
    this.player_state = {
      time: 0,
      x: startPos1.x,
      y: startPos1.y,
      direction: "SOUTH",
      interact: 0,
      player_collision_tile: null,
      player_onions_added :0,
      pot_onions: 0,
      pot_cooking_stage:0,
      player_carrying_soup: false,
      player_soups_served: 0,
    };
    this.env_state = {
        time:0,
    };
    // defining directions and suffixes for directions
    this.directions = ["NORTH", "EAST", "SOUTH", "WEST"];
    this.player_collision_tile = null;
    this.interact_key = false;
    this.player_interact = 0;
    this.interacted = false;
    this.interactedObject = null; // Track the object with which the player has interacted
    this.pot_locations = [];
    this.potImages = [];
    this.interaction_dist = 45;
    this.lastInteractTime = 0;
    this.pot_cooking = false;
    const scene = this;

    // Creates and loads the tilemap
    this.map = this.make.tilemap({
      key: "map",
      tileWidth: envConstants.tileSize,
      tileHeight: envConstants.tileSize,
    });
    this.tileset = this.map.addTilesetImage(
      "environment",
      null,
      envConstants.tileSize,
      envConstants.tileSize,
      0,
      0
    );
    //creates the collision layer
    this.layer = this.map.createLayer(0, this.tileset, 0, 0);

    const tilesToCollideWith = [0, 1, 3, 4, 5]; // Example tile indices to collide with
    this.layer.setCollision(tilesToCollideWith);

    // Set callbacks for collision events
    this.layer.setTileIndexCallback(
      tilesToCollideWith,
      this.handleTileCollision,
      this
    );

    // creates and loads the players
    this.players = this.physics.add.group();

    // default player image is SOUTH
    this.player = this.physics.add.sprite(
      startPos1.x,
      startPos1.y,
      "agents",
      "SOUTH.png"
    );
    this.otherPlayer = this.physics.add.sprite(
      startPos2.x,
      startPos2.y,
      "agents",
      "SOUTH.png"
    );
    this.physics.world.enable(this.player);
    this.physics.world.enable(this.otherPlayer);

    // stores the locations of pots for later when we need to interact with them
    this.map.forEachTile((tile) => {
      if (tile.index === 4) {
        this.pot_locations.push({
          x: tile.pixelX + tile.width / 2,
          y: tile.pixelY + tile.height / 2,
        });
      }
    });
    // save locations and images for a pot
    this.map.forEachTile((tile) => {
        if (tile.index === 4) {
            const potImage = this.add.sprite(tile.pixelX + tile.width / 2, tile.pixelY + tile.height / 2, 'terrain', 'pot.png');            
            potImage.onions = 0;
            this.potImages.push(potImage);
        }
    });
    this.env_state.pots = [];

// Create an object for each pot image and push it into env_state.pots
    this.env_state.pots = [];
    for (let i = 0; i < this.potImages.length; i++) {
        const potImage = this.potImages[i];
        this.env_state.pots.push({
            time: 0,
            onions: 0,
            cooking_stage: 0,
            cooking: false,
            explosion: false,
            x: potImage.x,
            y: potImage.y
        });
    }

  }
  update() {
    // sets collisionå
    this.physics.world.collide(this.player, this.layer);
    this.physics.world.collide(this.otherPlayer, this.layer);
    // collision between players
    this.physics.world.collide(this.player, this.otherPlayer);

    // Move player method
    this.movePlayer(
      this.player,
      envConstants.playerSpeed,
      this.keys,
      this.player_interact
    );
    // Updating movement of other players

    // updating state
    // each update is 1/FPS seconds
    // all other updates are handled in functions below
    this.env_state.time += 1 / envConstants.FPS;
    this.handleKeyInteraction();
    this.updatePlayerImage();
    this.handleTileInteraction();
    this.handleEnvInteraction();
    this.handlePotCooking();
    this.handleServing();
  }

  movePlayer(player, speed, keys, interact) {
    player.body.setVelocity(0);

    // Update player direction based on key inputs
    if (keys.left.isDown) {
      player.body.setVelocityX(-speed);
      this.updateDirection(player, "WEST");
    } else if (keys.right.isDown) {
      player.body.setVelocityX(speed);
      this.updateDirection(player, "EAST");
    } else if (keys.up.isDown) {
      player.body.setVelocityY(-speed);
      this.updateDirection(player, "NORTH");
    } else if (keys.down.isDown) {
      player.body.setVelocityY(speed);
      this.updateDirection(player, "SOUTH");
    }

    // Update state to reflect player position and direction
    this.player_state.x = player.body.x;
    this.player_state.y = player.body.y;
  }

  updateDirection(player, direction) {
    // Update player frame based on direction
    const filename = `${direction}.png`;
    player.setFrame(filename);
    // update state to reflect direction
    this.player_state.direction = direction;
  }
  updatePlayerImage() {
    if (this.interact_key && this.interactedObject) {
      // Update player's image based on interaction and direction
      const filename = `${this.player_state.direction}${this.interactedObject}.png`;
      this.player.setFrame(filename);
    }
    // No else condition needed here to ensure the player's image stays the same
  }

  handleTileCollision(player, tile) {
    // Stores tile that the player is colliding with to be used for interactions later
    // we want to have a value that we just refer to, but also one that we store for later
    // might be a little redundant??
    this.player_collision_tile = tile.index;
    this.player_state.player_collision_tile = tile.index;
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
    /*
        This handles interactions with grab-able tiles specifically
        For example, if they move to the onion, press e, they will pick up the onion
        the same occurs for the dish. If the press e again on that, or on another tile,
        they will drop the item.
        */
    if (this.interact_key && !this.interactedObject) {
      let interactionSuffix = "";
      if (this.player_collision_tile == 1) {
        // picks up dish
        console.log("Dish");
        interactionSuffix = "-dish";
        this.player_state.interact = 1;
      } else if (this.player_collision_tile == 3) {
        // picks up onion
        console.log("Onion");
        interactionSuffix = "-onion";
        this.player_state.interact = 3;
      } else if (this.player_collision_tile == 5) {
        // Resets the player's image to the default when they interact with the serving window
        console.log('serve');
        this.player_state.interact = 0;
        interactionSuffix = '';
      } else if (this.player_collision_tile == 6) {
        // picks up tomato
        console.log("Tomato");
        interactionSuffix = "-tomato";
        this.player_state.interact = 6;
      } 
      this.interactedObject = interactionSuffix; // Mark the object as interacted
      this.updatePlayerImage(); // Update the player's image immediately after interaction
    } else if (!this.interact_key) {
      this.interactedObject = null; // Reset the interaction state when the interact key is released
    }
  }

  handleEnvInteraction() {
    // Add a flag to track whether the player has interacted with the pot during the current interaction
    let potInteracted = false;
    // Check if the interact key was just pressed and there has been sufficient cooldown time
    // Add the cooldown time so that a single player cannot place multiple onions in at once
    if (this.keys.interact.isDown && this.interactedObject === "-onion" && this.time.now > this.lastInteractTime + 3000) {
        for (let i = 0; i < this.potImages.length; i++) {
            let potImage = this.potImages[i];
            console.log('Index:', i, 'Pot Image:', potImage, 'Pots Array:', this.env_state.pots);
            // Calculate the distance between the player and the pot
            const distance = Phaser.Math.Distance.Between(
                this.player.x,
                this.player.y,
                potImage.x,
                potImage.y
            );
            // Check if the player is within a certain distance of the pot
            if (distance < this.interaction_dist && !potInteracted) {
                // Update the last interaction time
                this.lastInteractTime = this.time.now;
                // Check if the pot already contains maximum onions
                if (potImage.onions < 3) {
                    // Increment the number of onions in the pot by 1
                    potImage.onions++;
                    // increase thier total number of onions added
                    this.player_state.player_onions_added += 1;
                    this.env_state.pots[i] = potImage.onions;
                    // Update the pot's image
                    const potImageKey = `onion-pot-${potImage.onions}.png`;
                    potImage.setTexture('soups', potImageKey);
                    // Remove the onion from the player's inventory
                    this.player_state.interact = null;
                    this.updatePlayerImage();
                    // Reset the interacted object to null
                    this.interactedObject = null;
                    // Set the flag to true to indicate that the pot has been interacted with by the player
                    potInteracted = true;
                }

                break;
            }
        }
    }
    }
    /*
    This currently does not scale for multiple pots, need to figure out a better way of doing this. 
    Maybe could assign the pots to a list before hand and then add that list to the pot_cooking state variable. 
    */ 
    handlePotCooking() {
        // Other code...
    
        // Iterate over the potImages array to update pot states
        for (let i = 0; i < this.potImages.length; i++) {
            const potImage = this.potImages[i];
            if (potImage.onions === 3) {
                // Start cooking
                potImage.cooking = true;
                potImage.cooking_stage = 1;
                potImage.onions = 0;
    
                // Ensure that the index i is within the bounds of this.env_state.pots
                if (i < this.env_state.pots.length) {
                    // Update the corresponding pot state in the env_state.pots array
                    this.env_state.pots[i].cooking = true;
                    this.env_state.pots[i].cooking_stage = 1;
                    this.env_state.pots[i].onions = 0;
    
                    // Update the pot's image to show that it is cooking
                    potImage.setTexture('soups', 'onion-cooking-1.png');
    
                    // Start a timer that advances the cooking stage every 3 seconds
                    this.time.addEvent({
                        delay: 3000,
                        callback: () => {
                            // Increment the cooking stage
                            potImage.cooking_stage++;
    
                            // Ensure that the index i is within the bounds of this.env_state.pots
                            if (i < this.env_state.pots.length) {
                                // Update the corresponding pot state in the env_state.pots array
                                this.env_state.pots[i].cooking_stage = potImage.cooking_stage;
    
                                // Update the pot's image
                                const potImageKey = `onion-cooking-${potImage.cooking_stage}.png`;
                                potImage.setTexture('soups', potImageKey);
                            }
                        },
                        repeat: 1
                    });
                }
            }
        }
    }
    

    handleServing(){
        if (this.keys.interact.isDown && this.interactedObject === "-dish" && this.time.now > this.lastInteractTime + 3000) {
            let potInteracted = false;
            for (let potImage of this.potImages) {
                // Calculate the distance between the player and the pot
                const distance = Phaser.Math.Distance.Between(
                    this.player.x,
                    this.player.y,
                    potImage.x,
                    potImage.y
                );
                // Check if the player is within a certain distance of the pot
                if (distance < this.interaction_dist && !potInteracted && potImage.cooking_stage === 3) {
                    potImage.onions = 0;
                    potImage.cooking_stage = 0;
                    potImage.cooking = false;
                    potImage.setTexture('terrain', 'pot.png');
                    this.interactedObject = '-soup-onion';
                    this.updatePlayerImage();
                    potInteracted = true;
            }
        }
    }
    if (this.keys.interact.isDown && this.interactedObject ==  '-soup-onion' && this.player_state.player_collision_tile == 5) {
        this.player_state.player_soups_served += 1;
        this.interactedObject = null;
        this.updatePlayerImage();

    }

}
}