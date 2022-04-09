import i18n         from 'i18n-js'
import bootstrap    from 'Lib/bootstrap_mraid'
import PreloadState from 'Lib/states/preload'
import config       from './config'
import level        from './level.json'
import GameState    from './State.ST0068v004'
import strings      from './i18n'

import './fonts.css'

i18n.translations = strings

config.states = [
  {
    key        : config.constants.States.PRELOAD,
    constructor: new PreloadState(config.gameResources, config.preloadSettings),
  },
  {
    key        : config.constants.States.GAME,
    constructor: new GameState(config.gameSettings, level, i18n.t),
  },
]

const userAgent = navigator.userAgent || navigator.vendor
if (/android/i.test(userAgent)) {
  window.g5gameurl = 'https://play.google.com/store/apps/details?id=com.g5e.jewelsofthewildwestmatch3.android&hl=en&gl=US'
} else {
  window.g5gameurl = 'https://apps.apple.com/us/app/jewels-of-the-wild-west/id1501557204'
}

bootstrap(config)
