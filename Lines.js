console.log('Lines.js loaded')
import * as Render from "./Render.js"

let draggingPoint

const points = []

let lastMouse = {}

let nextId = 0

class Point {
    constructor(x, y, ...connections) {
        points.push(this)
        this.id = nextId++
        this.x = x
        this.y = y
        this.connections = connections
    }
    connect(point) {
        if (!this.connections.includes(point)) {
            this.connections.push(point)
            point.connections.push(this)
        }
        return point
    }
    disconnect(point, update) {
        if (this.connections.includes(point)) {
            checkForUnsafeConnections()
            this.connections.splice(this.connections.indexOf(point), 1)
            point.connections.splice(point.connections.indexOf(this), 1)
            checkForUnsafeConnections()
            if (this.connections.length == 0) this.remove(update)
            checkForUnsafeConnections()
            if (point.connections.length == 0) point.remove(update)
            checkForUnsafeConnections()
            if (update) {
                checkForUnsafeConnections()
                this.merge()
                checkForUnsafeConnections()
                point.merge()
                checkForUnsafeConnections()
            }
        }
    }
    remove(update) {
        checkForUnsafeConnections()
        for (const connection of [...this.connections])
            connection.disconnect(this, update)
        if (points.includes(this))
            points.splice(points.indexOf(this), 1)
        checkForUnsafeConnections()
    }
    removeAll() {
        const alreadyScanned = []
        function scan(point) {
            alreadyScanned.push(point)
            for (const connection of point.connections)
                if (!alreadyScanned.includes(connection))
                    scan(connection)
        }
        scan(this)
        for (const point of alreadyScanned)
            points.splice(points.indexOf(point), 1)
    }
    insertPoint(pointToInsert, pointToChange) {
        checkForUnsafeConnections()
        this.connect(pointToInsert)
        checkForUnsafeConnections()
        pointToChange.connect(pointToInsert)
        checkForUnsafeConnections()
        this.disconnect(pointToChange)
        checkForUnsafeConnections()
        return pointToInsert
    }
    merge() {

        if (!points.includes(this)) return

        checkForUnsafeConnections()

        //see if this point is on any being crossed by any lines, and join them
        const tooClose = getPointOrSegmentAtPos(this.x, this.y, 0, true)
        for (const item of tooClose)
            if (!(
                [item.point, item.pointA, item.pointB].includes(this) ||
                item.type != 'segment' ||
                (item.pointA.x == this.x && item.pointA.y == this.y) ||
                (item.pointB.x == this.x && item.pointB.y == this.y))
            )
                item.pointA.insertPoint(this, item.pointB)

        checkForUnsafeConnections()

        //find every other point at this points position
        for (const point of points)
            if (this != point && this.x == point.x && this.y == point.y) {

                //remove a connection between this point and the other point if it exists
                this.disconnect(point)

                checkForUnsafeConnections()

                //connect to each point the other point was connected to
                for (const connection of point.connections)
                    this.connect(connection)

                checkForUnsafeConnections()

                //remove the other point
                point.remove()

                //if this point has no connections, remove it
                if (this.connections.length == 0)
                    this.remove()

                checkForUnsafeConnections()
            }

        checkForUnsafeConnections()

        //check for any points falling on any segments that include this point, and merge them
        for (const connection of this.connections)
            for (const point of points) {
                if (point != this && point != connection) {
                    const hits = getPointOrSegmentAtPos(point.x, point.y, 0, true)
                    for (const hit of hits)
                        if (hit.type == 'segment' && ((hit.pointA == this && hit.pointB == connection) || (hit.pointA == connection || hit.pointB == this))) {
                            this.insertPoint(point, connection)
                            point.merge()
                        }
                }

            }

        //check if this point or any of its connections are unneeded
        for (const point of [this, ...this.connections])
            if (
                point.connections.length == 2 &&
                (Math.atan2(point.connections[0].y - point.y, point.connections[0].x - point.x) / Math.PI / 2 + 1) % 1 ==
                (Math.atan2(point.connections[1].y - point.y, point.connections[1].x - point.x) / Math.PI / 2 + 1.5) % 1
            ) {
                const pointA = point.connections[0]
                const pointB = point.connections[1]
                pointA.connect(pointB)
                point.remove()
                pointA.merge()
                pointB.merge()
            }
    }
}


const calculateDistance = (x1, y1, x2, y2) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)

/**
 * Returns the closest point within range, or the closest line within range if there is no point within range
 * @param {Number} x 
 * @param {Number} y 
 * @param {Number} maxDistance
 * @param {Boolean} getAll if true returns all points or segments within range instead of just the closest one
 * @returns {Object} {point, distance, type:'point'} or {pointA, pointB, distance, type:'line'}
 */
export function getPointOrSegmentAtPos(x, y, maxDistance = .01, getAll = false) {

    //first check if any point is targeted
    const validPoints = []
    for (const point of points) {
        const distance = calculateDistance(x, y, point.x, point.y)
        if (distance <= maxDistance)
            validPoints.push({ point, distance, type: 'point' })
    }

    if (!getAll && validPoints.length > 0)
        return validPoints.sort((a, b) => a.distance - b.distance)[0]

    //then check if any line segment is valid
    const validSegments = []
    const alreadyDonePoints = []
    for (const pointA of points) {
        alreadyDonePoints.push(pointA)
        for (const pointB of pointA.connections)
            if (
                !alreadyDonePoints.includes(pointB) && //check if this point has been processed
                //check if the target point resides inside the segments bounding box
                Math.max(pointA.x, pointB.x) + maxDistance >= x &&
                Math.max(pointA.y, pointB.y) + maxDistance >= y &&
                Math.min(pointA.x, pointB.x) - maxDistance <= x &&
                Math.min(pointA.y, pointB.y) - maxDistance <= y &&

                //check to see if either point are valid points
                calculateDistance(pointA.x, pointA.y, x, y) > maxDistance &&
                calculateDistance(pointB.x, pointB.y, x, y) > maxDistance
            ) {

                //check if any point of the line is close enough
                const abx = pointB.x - pointA.x
                const aby = pointB.y - pointA.y
                const apx = x - pointA.x
                const apy = y - pointA.y

                const abLenSquared = abx * abx + aby * aby
                const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / abLenSquared))

                const closestX = pointA.x + t * abx
                const closestY = pointA.y + t * aby

                const dx = x - closestX
                const dy = y - closestY

                const distance = Math.sqrt(dx * dx + dy * dy)

                if (distance <= maxDistance)
                    validSegments.push({ pointA, pointB, distance, type: 'segment' })
            }
    }

    if (!getAll && validSegments.length > 0)
        return validSegments.sort((a, b) => a.distance - b.distance)[0]

    if (getAll && (validPoints.length > 0 || validSegments.length > 0))
        return [...validPoints.sort((a, b) => a.distance - b.distance), ...validSegments.sort((a, b) => a.distance - b.distance)]
}

export function renderFirst() {
    for (const point of points)
        if (point.highlighted != undefined)
            delete point.highlighted

    const alreadyScanned = []
    function scan(point, color) {
        alreadyScanned.push(point)
        point.highlighted = color
        for (const connection of point.connections)
            if (!alreadyScanned.includes(connection))
                scan(connection, color)
    }

    if (draggingPoint == undefined) {
        const closest = getPointOrSegmentAtPos(lastMouse.x, lastMouse.y, .5)
        if (closest != undefined)
            scan(closest.type == 'point' ? closest.point : closest.pointA, '#0f03')
    }
    else
        scan(draggingPoint, '#00f3')

    for (const point of points) {
        const color = point.highlighted != undefined ? point.highlighted : '#fff3'
        Render.fillCircle(point.x, point.y, .1, color)
        for (const connection of point.connections)
            Render.line(point.x, point.y, connection.x, connection.y, color, .1)
        Render.fillText(point.x, point.y - .5, point.id, 'center', 'center', .25, color)
    }

    for (const point of points)
        for (const connection of point.connections)
            Render.line(point.x, point.y, (point.x + connection.x) / 2, (point.y + connection.y) / 2, '#f00', .01)



    Render.fillText(lastMouse.x, lastMouse.y - 2, Math.round(lastMouse.x) + '/' + Math.round(lastMouse.y), 'center', 'center', .25, '#fff6')
}
export function renderLast() { }

const log = []
const startTime = Date.now()

export function handleMouseDown(x, y, shift, button) {
    log.push({ type: 'mouseDown', time: Date.now() - startTime, x, y, shift, button })
    const closest = getPointOrSegmentAtPos(x, y, .5)
    if (closest != undefined)
        if (button == 0)
            if (closest.type == 'point')
                if (shift)
                    draggingPoint = closest.point
                else
                    draggingPoint = closest.point.connect(new Point(closest.point.x, closest.point.y))
            else {
                draggingPoint = closest.pointA.insertPoint(new Point(Math.round(x), Math.round(y)), closest.pointB)
                if (!shift)
                    draggingPoint = draggingPoint.connect(new Point(draggingPoint.x, draggingPoint.y))
            }
        else
            if (closest.type == 'point')
                if (shift)
                    closest.point.removeAll()
                else
                    closest.point.remove(true)
            else
                if (shift)
                    closest.pointA.removeAll()
                else
                    closest.pointA.disconnect(closest.pointB, true)
    else if (shift && button == 0) {
        draggingPoint = new Point(Math.round(x), Math.round(y)).connect(new Point(Math.round(x), Math.round(y)))
    }
}

export function handleMouseMove(x, y) {
    lastMouse = { x, y }
}

//return true if consuming the drag event
const lastDragMouse = {}
export function handleMouseDrag(x, y) {
    x = Math.round(x)
    y = Math.round(y)
    if (lastDragMouse.x != x || lastDragMouse.y != y)
        log.push({ type: 'mouseDrag', time: Date.now() - startTime, x, y })
    lastDragMouse.x = x
    lastDragMouse.y = y

    if (draggingPoint) {
        if (draggingPoint.connections.every(connection => Math.atan2(y - connection.y, x - connection.x) / Math.PI / 2 % .125 == 0)) {
            draggingPoint.x = x
            draggingPoint.y = y
        }
        return true
    }

}

export function handleMouseUp() {
    log.push({ type: 'mouseUp', time: Date.now() - startTime })
    if (draggingPoint != undefined)
        draggingPoint.merge()
    draggingPoint = undefined
    checkForUnsafeConnections()
}

function safeStringify(obj) {
    const seen = new WeakSet()
    return JSON.stringify(obj, (key, value) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return "[Circular]"
            }
            seen.add(value)
        }
        return value
    })
}

let hasErrored = false
function checkForUnsafeConnections() {
    function error(...message) {
        log.push({ type: 'error', time: Date.now() - startTime, message })
        console.error(message)
        localStorage.setItem('lastLog', safeStringify(log))
        if (!hasErrored) {
            hasErrored = true
            setTimeout(() => {
                for (let index = 0; index < 100; index++)console.info('\n' + (new Array(index).fill(' ').join('')))
                console.info('-----LOG BELOW-----')
                console.info(log)
                alert('An error has happened, check the console for logs and report them.')
            }, 100)
        }
    }
    const alreadySeenPoints = []
    for (const point of points) {
        if (alreadySeenPoints.includes(point)) error('Duplicate point in list detected:', point)
        alreadySeenPoints.push(point)
        const alreadySeenConnections = []
        for (const connection of point.connections) {
            if (!points.includes(connection)) error('Ghost point detected', point, connection)
            if (!connection.connections.includes(point)) error('One way connection detected', point, connection)
            if (alreadySeenConnections.includes(connection)) error('Duplicate connection detected', point, connection)
            alreadySeenConnections.push(connection)
        }
    }
}

export function handleKeyDown(key) {
    log.push({ type: 'keyDown', time: Date.now() - startTime, key })
    if (key == 'p') {
        console.log(points)
        console.log(points.map(point => [point.id, point.connections.map(connection => connection.id).join(' - ')].join('   -   ')).join('\n'))
    }
    if (key == 'l') console.log('lastLog:', JSON.parse(localStorage.getItem('lastLog')))
}