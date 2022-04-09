export default {
  width : window.innerWidth,
  height: window.innerHeight,

  constants: {
    FF_BASE: 'PT Serif Bold',

    States: {
      BOOT   : 'boot',
      PRELOAD: 'preload',
      GAME   : 'game',
      FINAL  : 'final',
    },
    Sprites: {
      MAIN     : 'main',
      PRELOADER: 'preloader',
    },
  },

  fonts: [
    'PT Serif Bold',
  ],

  preloadSettings: {
    textStyle: {
      fontSize       : 36,
      fill           : '#fcd769',
      stroke         : '#fcd769',
      strokeThickness: 0,
      offsetY        : 20,
    },
    background: {
      key  : 'background_preload',
      alpha: 1,
    },
    logo: {
      landscape: {
        scale   : 0.38,
        offsetY : -0.2,
        position: Phaser.CENTER,
      },
      portrait: {
        scale   : 0.45,
        offsetY : -0.075,
        position: Phaser.CENTER,
      },
      '1x1': {
        scale   : 0.35,
        offsetY : -0.1,
        position: Phaser.CENTER,
      },
    },
    preloader: {
      landscape: {
        scale   : 1.5,
        offsetY : 0.2,
        position: Phaser.CENTER,
      },
      portrait: {
        scale   : 1.5,
        offsetY : 0.15,
        position: Phaser.CENTER,
      },
    },
    preloaderSprite: 'preloader',
  },

  gameSettings: {},

  finalSettings: {},

  preloadResources: [
    {
      type: 'image',
      key : 'background_preload',
      url : require('Assets/images/jow/sprite/ST0068v004/background.jpg'),
    },
    {
      type: 'image',
      key : 'logo',
      url : require('Assets/images/jow/sprite/ST0068v004/ui/logo.png'),
    },
    {
      type: 'image',
      key : 'preloader',
      url : require('Assets/images/jow/sprite/ST0068v004/ui/preloader.png'),
    },
  ],

  gameResources: [
    {
      type: 'atlas',
      key : 'main',
      url : require('Assets/images/jow/atlas/atlas.png'),
      json: require('Assets/images/jow/atlas/atlas.json'),
    },
  ],
}
