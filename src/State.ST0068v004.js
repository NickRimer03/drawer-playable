import resize from 'Lib/resize/v0.2/resize'
import GameObjectsFactory from 'Lib/factory/v0.2/factory'
import {onCtaActionExported, setDimensions, setPosition} from 'Lib/utils'

export default class GameState extends Phaser.State {
  constructor(settings, level, t) {
    super()
    this.settings = settings
    this.level = level
    this.t = t
    //
    this.points = []
    this.lastXY = {
      x: null,
      y: null,
    }
    this.chips = []
    this.draw = false
    this.gameStarted = false
    //
    this.goal = 3
    this.sequence = new Set()
    this.chipSequence = []
    this.targetChip = null
    //
    this.rect = null
    this.animationsToDestroy = []
    //
    this.hintTimeout = null
    this.hintAnimations = []
  }

  create() {
    this.factory = new GameObjectsFactory(this, this.t)
    this.factory.createGameObjects(this.level)
    this.objects = this.factory.objects

    this.chips = Object.values(this.objects.sprites).filter((sprite) => sprite.data && Object.prototype.hasOwnProperty.call(sprite.data, 'hover') && sprite)

    for (const [id, chip] of this.chips.entries()) {
      chip.data = {...chip.data, over: false, id}
      chip.inputEnabled = true
      chip.input.pixelPerfectClick = true
      chip.input.pixelPerfectOver = true
    }

    this.objects.events.ctaClick.add(onCtaActionExported)

    this.game.input.onDown.add(({x, y}) => {
      if (this.gameStarted) {
        if (this.chips.some((chip) => chip.input.pointerOver())) {
          const {hand} = this.objects.sprites
          hand.alpha = 1
          hand.position.set(x, y)

          this.hintStop()
          this.draw = true
        }
      }
    })

    this.game.input.onUp.add(() => {
      if (this.gameStarted) {
        this.resetDrawing()
        this.objects.sprites.hand.alpha = 0
      }
    })

    this.resize()

    this.game.time.events.add(Phaser.Timer.SECOND, () => {
      this.game.add.tween(this.objects.texts.ready.scale)
        .to({x: 1, y: 1}, Phaser.Timer.QUARTER, Phaser.Easing.Linear.None, true)
        .onComplete
        .addOnce(() => {
          this.game.time.events.add(Phaser.Timer.SECOND, () => {
            this.game.add.tween(this.objects.texts.ready)
              .to({alpha: 0}, Phaser.Timer.QUARTER, Phaser.Easing.Linear.None, true)
              .onComplete
              .addOnce(() => {
                this.objects.texts.ready.scale.set(0)
                this.objects.texts.ready.alpha = 1
                this.objects.texts.ready.setText(this.t('go', {locale: __LOCALE__}))
                this.game.add.tween(this.objects.texts.ready.scale)
                  .to({x: 1, y: 1}, Phaser.Timer.QUARTER, Phaser.Easing.Linear.None, true)
                  .onComplete
                  .addOnce(() => {
                    this.game.time.events.add(Phaser.Timer.SECOND, () => {
                      this.game.add.tween(this.objects.texts.ready)
                        .to({alpha: 0}, Phaser.Timer.QUARTER, Phaser.Easing.Linear.None, true)
                      this.game.add.tween(this.objects.containers.scroll)
                        .to({alpha: 0}, Phaser.Timer.QUARTER, Phaser.Easing.Linear.None, true)
                      if (!this.isLandscape) {
                        this.game.add.tween(this.objects.containers.canvas.position)
                          .to({y: 410 * this.factor}, Phaser.Timer.HALF, Phaser.Easing.Linear.None, true)
                          .onComplete
                          .addOnce(() => {
                            this.game.add.tween(this.objects.containers.draw)
                              .to({alpha: 1}, Phaser.Timer.QUARTER, Phaser.Easing.Linear.None, true)
                            this.resize()
                            this.enableGameMechanics()
                          })
                      } else {
                        this.game.add.tween(this.objects.containers.draw)
                          .to({alpha: 1}, Phaser.Timer.QUARTER, Phaser.Easing.Linear.None, true)
                          .onComplete
                          .addOnce(this.enableGameMechanics.bind(this))
                      }
                      this.objects.containers.canvas.data.offset.portrait.top = 410
                    })
                  })
              })
          })
        })
    }, this)
  }

  enableGameMechanics() {
    this.gameStarted = true
    this.game.input.addMoveCallback(this.paint, this)
    this.hintSet()
  }

  hintSet() {
    this.hintTimeout = this.game.time.events.add(Phaser.Timer.SECOND * 3, this.hintPlay.bind(this))
    this.hintTimeout.timer.start()
  }

  hintStop() {
    this.hintTimeout.timer.stop()
    for (const animation of this.hintAnimations) {
      animation.stop()
    }
    for (const chip of this.chips) {
      this.objects.sprites[chip.data.hover].alpha = 0
    }
    this.hintAnimations.length = 0
  }

  hintPlay() {
    const animations = []
    const aliveChips = this.chips.filter(({alive}) => alive)
    const index = this.game.rnd.integerInRange(0, aliveChips.length - 1)
    const hintChipName = aliveChips[index]?.frameName

    if (aliveChips.length === 0) {
      this.hintStop()
      return
    }

    for (const chip of this.chips.filter(({frameName}) => frameName === hintChipName)) {
      animations.push(
        new Promise((resolve) => {
          const animation = this.game.add.tween(this.objects.sprites[chip.data.hover])
            .to({alpha: 1}, Phaser.Timer.QUARTER, Phaser.Easing.Linear.None, true)
            .yoyo(true)
            .repeat(2)
          animation
            .onComplete
            .addOnce(resolve)
          this.hintAnimations.push(animation)
        }),
      )
    }

    Promise.all(animations).then(() => {
      this.hintAnimations.length = 0
      this.hintSet()
    })
  }

  checkWin() {
    if (this.chips.filter(({alive}) => alive).length === 0) {
      this.game.add.tween(this.objects.containers.canvas)
        .to({alpha: 0}, Phaser.Timer.HALF, Phaser.Easing.Linear.None, true)
      this.game.add.tween(this.objects.containers.draw)
        .to({alpha: 0}, Phaser.Timer.HALF, Phaser.Easing.Linear.None, true)
      this.game.add.tween(this.objects.sprites.logo)
        .to({width: 456 * this.factor, height: 253 * this.factor}, Phaser.Timer.HALF, Phaser.Easing.Linear.None, true)
      if (!this.isLandscape) {
        this.animationsToDestroy.push(this.game.add.tween(this.objects.sprites.logo.position)
          .to({y: 301 * this.factor}, Phaser.Timer.SECOND, Phaser.Easing.Linear.None, true))
        this.animationsToDestroy.push(this.game.add.tween(this.objects.containers.cta.position)
          .to({y: 735 * this.factor}, Phaser.Timer.SECOND, Phaser.Easing.Linear.None, true))
      } else {
        this.animationsToDestroy.push(this.game.add.tween(this.objects.sprites.logo.position)
          .to({x: 683 * this.factor}, Phaser.Timer.SECOND, Phaser.Easing.Linear.None, true))
        this.animationsToDestroy.push(this.game.add.tween(this.objects.containers.cta.position)
          .to({x: 683 * this.factor}, Phaser.Timer.SECOND, Phaser.Easing.Linear.None, true))
      }
      this.objects.sprites.logo.data.dimensions.w = 456
      this.objects.sprites.logo.data.dimensions.h = 253
      this.objects.sprites.logo.data.offset.portrait.top = 301
      this.objects.sprites.logo.data.offset.landscape['center-x'] = 0
      this.objects.containers.cta.data.offset.portrait.top = 735
      this.objects.containers.cta.data.offset.landscape['center-x'] = 0
    }
  }

  onPointerOverChip(chip) {
    chip.data.over = true

    this.targetChip = this.targetChip ?? chip.frameName
    if (chip.frameName !== this.targetChip) {
      this.objects.sprites.hand.alpha = 0
      this.redScreenFlash()
      this.resetDrawing()

      return
    }

    const name = `${chip.frameName}-${chip.data.id}`
    if (!this.sequence.has(name)) {
      this.sequence.add(name)
      this.chipSequence.push(chip)

      this.game.add.tween(this.objects.sprites[chip.data.hover])
        .to({alpha: 1}, Phaser.Timer.QUARTER, Phaser.Easing.Linear.None, true)
    }

    if (this.sequence.size === this.goal) {
      for (const chip of this.chipSequence) {
        chip.alive = false
        chip.input.stop()
      }
      this.objects.sprites.hand.alpha = 0
      this.resetDrawing()
      this.checkWin()
    }
  }

  onPointerOutChip(chip) {
    chip.data.over = false
  }

  drawLine(newX, newY, factor) {
    const {x: lx, y: ly} = this.lastXY
    const {x: cx, y: cy} = this.objects.containers.canvas.position
    const {x: dx, y: dy} = this.objects.graphics.canvasBack.position
    const [x, y] = [
      (newX - cx - (dx * factor)) / factor / this.canvasScaleFactor,
      (newY - cy - (dy * factor)) / factor / this.canvasScaleFactor,
    ]

    this.objects.graphics.canvasBack.lineStyle(7, '0xff00ff', 1)
    this.objects.graphics.canvasBack.moveTo(lx ?? x, ly ?? y)
    this.objects.graphics.canvasBack.lineTo(x, y)
    this.lastXY = {x, y}
    this.points.push({x, y})

    this.objects.sprites.hand.position.set(newX, newY)
  }

  resetDrawing() {
    if (this.draw) {
      this.hintSet()
    }
    this.draw = false
    this.lastXY = {x: null, y: null}
    this.sequence.clear()
    this.points.length = 0
    this.chipSequence.length = 0
    this.targetChip = null
    this.objects.graphics.canvasBack.clear()
    this.objects.graphics.canvasBack.drawRect(0, 0, this.objects.graphics.canvasBack.data.w, this.objects.graphics.canvasBack.data.h)
    for (const chip of this.chips) {
      chip.data.over = false
      if (chip.alive) {
        chip.input.reset()
        chip.input.start()
      } else {
        this.game.add.tween(chip)
          .to({alpha: 0}, Phaser.Timer.QUARTER, Phaser.Easing.Linear.None, true)
      }
      this.game.add.tween(this.objects.sprites[chip.data.hover])
        .to({alpha: 0}, Phaser.Timer.QUARTER, Phaser.Easing.Linear.None, true)
    }
  }

  paint(pointer, x, y) {
    if (pointer.isDown && this.draw) {
      if (!this.rect.contains(x, y)) {
        this.objects.sprites.hand.alpha = 0
        this.redScreenFlash()
        this.resetDrawing()

        return
      }

      this.chips.some((chip) => {
        const event1 = chip.input.pointerOver() && !chip.data.over
        const event2 = chip.input.pointerOut() && chip.data.over

        if (event1) {
          this.onPointerOverChip(chip)
        } else if (event2) {
          this.onPointerOutChip(chip)
        }

        return event1 || event2
      })

      this.drawLine(x, y, this.factor)
    }
  }

  redScreenFlash() {
    this.game.add.tween(this.objects.graphics.wall)
      .to({alpha: 1}, Phaser.Timer.QUARTER, Phaser.Easing.Cubic.Out, true)
      .yoyo(true)
  }

  adjustObject(setDim, setPos, object, data) {
    [object.width, object.height] = setDim(data ?? object)
    object.position.set(...setPos(data ?? object))
  }

  resize(w, h) {
    const [width, height, , factorUI, isLandscape] = resize(this, w, h, this.objects.cameraSettings)
    this.factor = factorUI
    this.isLandscape = isLandscape

    const setDim = setDimensions.bind(null, factorUI)
    const setPos = setPosition.bind(null, width, height, factorUI, isLandscape)
    const adjObj = this.adjustObject.bind(this, setDim, setPos)

    if (this.animationsToDestroy.length > 0) {
      for (const animation of this.animationsToDestroy) {
        animation.stop()
      }
    }

    const {logo, hand} = this.objects.sprites
    const {cta, scroll, canvas, readyGo, draw} = this.objects.containers
    const {wall} = this.objects.graphics

    adjObj(hand)
    adjObj(logo)
    adjObj(cta)
    adjObj(scroll)
    adjObj(readyGo)
    adjObj(draw)
    adjObj(wall)

    if (isLandscape) {
      this.canvasScaleFactor = 0.95
      const canvasData = {
        data: {
          dimensions: {
            w: canvas.data.dimensions.w * this.canvasScaleFactor,
            h: canvas.data.dimensions.h * this.canvasScaleFactor,
          },
          offset: {
            landscape: {
              left      : canvas.data.offset.landscape.left,
              'center-y': -canvas.data.dimensions.h * (this.canvasScaleFactor / 2),
            },
          },
        },
      }
      adjObj(canvas, canvasData)
    } else {
      this.canvasScaleFactor = 1
      adjObj(canvas)
    }

    const rect = {
      x: canvas.position.x + this.objects.graphics.canvasBack.position.x * factorUI,
      y: canvas.position.y + this.objects.graphics.canvasBack.position.y * factorUI,
      w: this.objects.graphics.canvasBack.data.w * factorUI * this.canvasScaleFactor,
      h: this.objects.graphics.canvasBack.data.h * factorUI * this.canvasScaleFactor,
    }
    this.rect = new Phaser.Rectangle(rect.x, rect.y, rect.w, rect.h)

    this.resetDrawing()
  }
}
