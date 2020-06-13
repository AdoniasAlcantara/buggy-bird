function noDelaySetInterval(callback, timeout) {
    callback()
    return setInterval(callback, timeout)
}

function Barrier(position, height) {
    this.element = document.createElement('div')
    this.element.classList.add('barrier', position)
    this.element.style.height = `${height}%`

    this.checkCollision = target => {
        const thisRect = this.element.getBoundingClientRect()
        const targetRect = target.getBoundingClientRect()

        // X axis
        if (!(targetRect.right >= thisRect.left && targetRect.left <= thisRect.right)) {
            return false
        }

        // Y axis
        if (targetRect.bottom >= thisRect.top && targetRect.top <= thisRect.bottom) {
            return true
        }

        return false
    }
}

function BarrierBox(offset, topHeight, bottomHeight) {
    this.top = new Barrier('top', topHeight)
    this.bottom = new Barrier('bottom', bottomHeight)

    this.element = document.createElement('div')
    this.element.className = 'barrier-box'
    this.element.style.left = `${offset}%`
    this.element.appendChild(this.top.element)
    this.element.appendChild(this.bottom.element)

    this.getOffset = () => this.element.style.left.split('%')[0]

    this.setOffset = offset => this.element.style.left = `${offset}%`

    this.checkCollision = target => this.top.checkCollision(target) || this.bottom.checkCollision(target)
}

function BarrierBoxFactory(offset, gapSize) {
    const max = 100 - gapSize

    this.create = () => {
        const topHeight = Math.random() * max
        const bottomHeight = 100 - gapSize - topHeight

        return new BarrierBox(offset, topHeight, bottomHeight)
    }
}

function Bird(sprite) {
    const REFRESH_INTERVAL = 25
    const FLOOR = 0
    const CEIL = 100

    this.element = document.createElement('img')
    this.element.id = 'bird'
    this.element.src = sprite

    let lastFly = null
    let collisionListener = null

    const calcProjection = x => -0.4 * Math.pow(x, 2) +  4 * x

    this.getFlyOffset = () => this.element.style.top.split('%')[0] || 50

    this.setFlyOffset = offset => this.element.style.top = `${offset}%`

    this.fly = () => {
        this.stopFly()

        const initialOffset = this.getFlyOffset()
        let x = 0

        const onFly = () => {
            x += 0.5
            let offset = initialOffset - calcProjection(x)

            if (offset <= FLOOR || offset >= CEIL && collisionListener) {
                collisionListener()
            }

            this.setFlyOffset(offset)
        }

        lastFly = setInterval(onFly, REFRESH_INTERVAL)
    }

    this.stopFly = () => {
        if (lastFly) {
            clearInterval(lastFly)
        }
    }

    this.setControlEnabled = isEnabled => {
        window.onkeydown = !isEnabled ? null : devent => {
            if (event.code == 'Space') {
                this.fly()
            }
        }
    }

    this.setCollisionListener = listener => {
        collisionListener = listener
    }
}

function DisplayLoop(refreshInterval) {
    const L_THRESHOLD = -10
    const R_THRESHOLD = 110
    const M_THRESHOLD = 42
    const GAP = 20

    const main = document.querySelector('main')
    const score = document.getElementById('score')
    const bird = new Bird('bird.png')
    const factory = new BarrierBoxFactory(R_THRESHOLD, GAP)
    const creationInterval = 120 * refreshInterval
    const barrierBoxes = []

    let scoreCounter = 0
    let refreshLoop = null
    let creationLoop = null

    const onCollision = () => this.stop()

    const onCreateBox = () => {
        const box = factory.create()
        barrierBoxes.push(box)
        main.insertBefore(box.element, main.firstChild)
    }

    const onRefresh = () => barrierBoxes.forEach((box, index) => {
        const currentOffset = box.getOffset()

        if (currentOffset <= L_THRESHOLD) {
            main.removeChild(box.element)
            barrierBoxes.splice(index, 1)
            return
        }

        box.setOffset(currentOffset - 0.5)

        if (box.checkCollision(bird.element)) {
            onCollision()
            return
        }

        if (currentOffset <= M_THRESHOLD && !box.isScored) {
            box.isScored = true
            score.innerHTML = ++scoreCounter
        }
    })

    bird.setCollisionListener(onCollision)
    main.appendChild(bird.element)

    this.start = () => {
        refreshLoop = setInterval(onRefresh, refreshInterval)
        creationLoop = noDelaySetInterval(onCreateBox, creationInterval)   
        bird.setControlEnabled(true)
        bird.fly()
    }

    this.stop = () => {  
        clearInterval(creationLoop)
        clearInterval(refreshLoop)
        bird.setControlEnabled(false)
        bird.stopFly()
    }
}

new DisplayLoop(25).start()