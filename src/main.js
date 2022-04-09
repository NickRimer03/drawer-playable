import i18n         from 'i18n-js'
import bootstrap    from 'Lib/bootstrap'
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

bootstrap(config)
