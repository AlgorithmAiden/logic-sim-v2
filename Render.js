console.log('Render.js loaded')

import { ColorKey } from "./ColorKey.js"
import * as Lines from "./Lines.js"
import * as Components from "./Components.js"
import { settings } from "./Shared.js"

const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

let unit, charWidth, offsetX, offsetY

export function getUnit() { return unit }

function render() {
    //size the canvas and calculate related values
    // canvas.width = canvas.height = 0

    const wrapperStyles = window.getComputedStyle(document.getElementById('canvasWrapper'))

    unit = Math.min((parseFloat(wrapperStyles.width) - 10) / settings.viewport.scale, (parseFloat(wrapperStyles.height) - 10) / settings.viewport.scale)
    canvas.width = (parseFloat(wrapperStyles.width) - 10)
    canvas.height = (parseFloat(wrapperStyles.height) - 10)

    ctx.font = `${unit}px Fira Code`
    charWidth = ctx.measureText('0').width / unit

    offsetX = canvas.width / unit / 2 - settings.viewport.x
    offsetY = canvas.height / unit / 2 - settings.viewport.y

    //background
    ctx.fillStyle = ColorKey.background
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    //add the checkered background if needed
    if (settings.showCheckeredBackground) {

        //lots of annoying math to speed rendering up
        const floorOffsetX = Math.floor(offsetX)
        const floorOffsetY = Math.floor(offsetY)
        const modOffsetX = (Math.ceil(Math.abs(offsetX)) + offsetX) % 1
        const modOffsetY = (Math.ceil(Math.abs(offsetY)) + offsetY) % 1
        const checkeredOffset = Math.ceil(Math.abs(floorOffsetX + floorOffsetY) / 2 + 1) * 2 + floorOffsetX + floorOffsetY
        ctx.fillStyle = ColorKey.background_light
        for (let x = -1; x < canvas.width / unit + 1; x++)
            for (let y = -1; y < canvas.height / unit + 1; y++)
                if ((x + y + checkeredOffset) % 2 < 1)
                    ctx.fillRect((x + modOffsetX) * unit, (y + modOffsetY) * unit, unit, unit)
    }

    //render all the modules stuff
    Lines.renderFirst()
    Components.render()
    Lines.renderLast()

    //schedule the next loop
    requestAnimationFrame(render)
}

let hasStarted = false
export function startRenderLoop() {
    if (!hasStarted)
        render()
    hasStarted = true
}

export function getGridPosition(x, y) {
    return { x: x / unit - offsetX, y: y / unit - offsetY }
}

/**
 * Renders a rect with the top left being the x/y if onscreen
 * @param {Number} x 
 * @param {Number} y 
 * @param {Number} width
 * @param {Number} height
 * @param {String} color
 * @returns true if onscreen, false otherwise
 */
export function fillRect(x, y, width, height, color) {
    const renderX = (x + offsetX) * unit
    const renderY = (y + offsetY) * unit
    const renderWidth = width * unit
    const renderHeight = height * unit

    //only render if it will be onscreen
    if (
        renderX <= canvas.width &&
        renderY <= canvas.height &&
        renderX + renderWidth >= 0 &&
        renderY + renderHeight >= 0
    ) {
        ctx.fillStyle = color
        ctx.fillRect(renderX, renderY, renderWidth, renderHeight)
        return true
    }
    return false
}

/**
 * Renders a rect with the top left being the x/y in onscreen
 * @param {Number} x 
 * @param {Number} y 
 * @param {Number} width
 * @param {Number} height
 * @param {String} color
 * @param {Number} lineWidth
 * @returns true if onscreen, false otherwise
 */
export function strokeRect(x, y, width, height, color, lineWidth) {
    const renderX = (x + offsetX) * unit
    const renderY = (y + offsetY) * unit
    const renderWidth = width * unit
    const renderHeight = height * unit
    const renderLineWidth = lineWidth * unit
    const halfRenderLineWidth = renderLineWidth / 2

    //only render if it will be onscreen
    if (
        renderX - halfRenderLineWidth <= canvas.width &&
        renderY - halfRenderLineWidth <= canvas.height &&
        renderX + renderWidth + halfRenderLineWidth >= 0 &&
        renderY + renderHeight + halfRenderLineWidth >= 0
    ) {
        ctx.lineWidth = renderLineWidth
        ctx.strokeStyle = color
        ctx.strokeRect(renderX, renderY, renderWidth, renderHeight)
        return true
    }
    return false
}

/**
 * Renders a circle centered on x/y if onscreen
 * @param {Number} x 
 * @param {Number} y 
 * @param {Number} radius 
 * @param {String} color 
 * @returns true if onscreen, false otherwise
*/
export function fillCircle(x, y, radius, color) {
    const renderX = (x + offsetX) * unit
    const renderY = (y + offsetY) * unit
    const renderRadius = radius * unit

    //only render if onscreen
    if (
        renderX - renderRadius <= canvas.width &&
        renderY - renderRadius <= canvas.height &&
        renderX + renderRadius >= 0 && renderY + renderRadius >= 0
    ) {
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(renderX, renderY, renderRadius, 0, Math.PI * 2)
        ctx.fill()
        return true
    }
    return false
}

/**
 * Renders a circle centered on x/y if onscreen
 * @param {Number} x 
 * @param {Number} y 
 * @param {Number} radius 
 * @param {String} color
 * @param {Number} lineWidth
 * @returns true if onscreen, false otherwise
 */
export function strokeCircle(x, y, radius, color, lineWidth) {
    const renderX = (x + offsetX) * unit
    const renderY = (y + offsetY) * unit
    const renderRadius = radius * unit
    const renderLineWidth = lineWidth * unit
    const halfRenderLineWidth = renderLineWidth / 2

    //only render if onscreen
    if (
        renderX - renderRadius - halfRenderLineWidth <= canvas.width &&
        renderY - renderRadius - halfRenderLineWidth <= canvas.height &&
        renderX + renderRadius + halfRenderLineWidth >= 0 &&
        renderY + renderRadius + halfRenderLineWidth >= 0
    ) {
        ctx.lineWidth = renderLineWidth
        ctx.strokeStyle = color
        ctx.beginPath()
        ctx.arc(renderX, renderY, renderRadius, 0, Math.PI * 2)
        ctx.stroke()
        return true
    }
    return false
}

/**
 * Renders a line if onscreen
 * @param {Number} x1 
 * @param {Number} y1 
 * @param {Number} x2 
 * @param {Number} y2 
 * @param {String} color 
 * @param {Number} lineWidth 
 * @returns true if onscreen, false otherwise
 */
export function line(x1, y1, x2, y2, color, lineWidth) {
    x1 = (x1 + offsetX) * unit
    y1 = (y1 + offsetY) * unit
    x2 = (x2 + offsetX) * unit
    y2 = (y2 + offsetY) * unit

    const renderLineWidth = lineWidth * unit
    const halfRenderLineWidth = renderLineWidth / 2
    const maxX = Math.max(x1, x2)
    const maxY = Math.max(y1, y2)
    const minX = Math.min(x1, x2)
    const minY = Math.min(y1, y2)

    //only render if onscreen
    if (
        minX - halfRenderLineWidth <= canvas.width &&
        minY - halfRenderLineWidth <= canvas.height &&
        maxX + halfRenderLineWidth >= 0 &&
        maxY + halfRenderLineWidth >= 0
    ) {
        ctx.lineWidth = renderLineWidth
        ctx.strokeStyle = color
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
        return true
    }
    return false
}

/**
 * Renders a path if onscreen
 * @param {{x: Number, y: Number}[]} path an array of point objects each with an x/y
 * @param {String} color 
 * @returns true if onscreen, false otherwise
 */
export function fillPath(path, color) {

    //find the bounding box of the path
    let maxX = -Infinity
    let maxY = -Infinity
    let minX = Infinity
    let minY = Infinity
    for (const point of path) {
        maxX = Math.max(maxX, point.x)
        maxY = Math.max(maxY, point.y)
        minX = Math.min(minX, point.x)
        minY = Math.min(minY, point.y)
    }
    maxX = (maxX + offsetX) * unit
    maxY = (maxY + offsetY) * unit
    minX = (minX + offsetX) * unit
    minY = (minY + offsetY) * unit

    //only render if onscreen
    if (
        minX <= canvas.width &&
        minY <= canvas.height &&
        maxX >= 0 &&
        maxY >= 0
    ) {
        ctx.fillStyle = color
        ctx.beginPath()
        for (const point of path)
            ctx.lineTo((point.x + offsetX) * unit, (point.y + offsetY) * unit)
        ctx.fill()
        return true
    }
    return false
}

/**
 * Renders a path if onscreen
 * @param {{x: Number, y: Number}[]} path an array of point objects each with an x/y
 * @param {String} color 
 * @param {Number} lineWidth 
 * @returns true if onscreen, false otherwise
 */
export function strokePath(path, color, lineWidth) {

    //find the bounding box of the path
    let maxX = -Infinity
    let maxY = -Infinity
    let minX = Infinity
    let minY = Infinity
    for (const point of path) {
        maxX = Math.max(maxX, point.x)
        maxY = Math.max(maxY, point.y)
        minX = Math.min(minX, point.x)
        minY = Math.min(minY, point.y)
    }
    const renderLineWidth = lineWidth * unit
    const halfRenderLineWidth = renderLineWidth / 2
    maxX = (maxX + offsetX) * unit + halfRenderLineWidth
    maxY = (maxY + offsetY) * unit + halfRenderLineWidth
    minX = (minX + offsetX) * unit - halfRenderLineWidth
    minY = (minY + offsetY) * unit - halfRenderLineWidth

    //only render if onscreen
    if (
        minX <= canvas.width &&
        minY <= canvas.height &&
        maxX >= 0 &&
        maxY >= 0
    ) {
        ctx.lineWidth = renderLineWidth
        ctx.strokeStyle = color
        ctx.beginPath()
        for (const point of path)
            ctx.lineTo((point.x + offsetX) * unit, (point.y + offsetY) * unit)
        ctx.stroke()
        return true
    }
    return false
}

/**
 * Renders text if onscreen
 * @param {Number} x 
 * @param {Number} y 
 * @param {String} text 
 * @param {String} textAlign left / center / right
 * @param {String} textBaseline top / center / bottom
 * @param {Number} textSize 
 * @param {String} color 
 * @param {Number} maxWidth 
 * @returns true if onscreen, false otherwise
 */
export function fillText(x, y, text, textAlign, textBaseline, textSize, color, maxWidth = undefined) {

    //find the bounding box of the text
    let maxX, maxY, minX, minY
    const textWidth = String(text).length * charWidth * textSize
    if (textAlign == 'left') {
        maxX = x + textWidth
        minX = x
    }
    else if (textAlign == 'center') {
        maxX = x + textWidth / 2
        minX = x - textWidth / 2
    }
    else if (textAlign == 'right') {
        maxX = x
        minX = x - textWidth
    }
    else throw new Error('Invalid textAlign value')
    if (textBaseline == 'top') {
        maxY = y + textSize
        minY = y
    }
    else if (textBaseline == 'center') {
        maxY = y + textSize / 2
        minY = y - textSize / 2
    }
    else if (textBaseline == 'bottom') {
        maxY = y
        minY = y - textSize
    }
    else throw new Error('Invalid textBaseline value')
    maxX = (maxX + offsetX) * unit
    maxY = (maxY + offsetY) * unit
    minX = (minX + offsetX) * unit
    minY = (minY + offsetY) * unit

    //only render if onscreen
    if (
        minX <= canvas.width &&
        minY <= canvas.height &&
        maxX >= 0 &&
        maxY >= 0
    ) {
        ctx.textAlign = textAlign
        ctx.textBaseline = textBaseline
        ctx.fillStyle = color
        ctx.font = `${unit * textSize}px Fira Code`
        ctx.fillText(text, (x + offsetX) * unit, (y + offsetY) * unit, maxWidth == undefined ? undefined : maxWidth * unit)
        return true
    }
    return false
}

/**
 * Renders text if onscreen
 * @param {Number} x 
 * @param {Number} y 
 * @param {String} text 
 * @param {String} textAlign left / center / right
 * @param {String} textBaseline top / center / bottom
 * @param {Number} textSize 
 * @param {String} color 
 * @param {Number} lineWidth 
 * @param {Number} maxWidth 
 * @returns true if onscreen, false otherwise
 */
export function strokeText(x, y, text, textAlign, textBaseline, textSize, color, lineWidth, maxWidth = undefined) {

    //find the bounding box of the text
    let maxX, maxY, minX, minY
    const textWidth = String(text).length * charWidth * textSize
    if (textAlign == 'left') {
        maxX = x + textWidth
        minX = x
    }
    else if (textAlign == 'center') {
        maxX = x + textWidth / 2
        minX = x - textWidth / 2
    }
    else if (textAlign == 'right') {
        maxX = x
        minX = x - textWidth
    }
    else throw new Error('Invalid textAlign value')
    if (textBaseline == 'top') {
        maxY = y + textSize
        minY = y
    }
    else if (textBaseline == 'center') {
        maxY = y + textSize / 2
        minY = y - textSize / 2
    }
    else if (textBaseline == 'bottom') {
        maxY = y
        minY = y - textSize
    }
    else throw new Error('Invalid textBaseline value')
    const renderLineWidth = lineWidth * unit
    const halfRenderLineWidth = renderLineWidth / 2
    maxX = (maxX + offsetX) * unit + halfRenderLineWidth
    maxY = (maxY + offsetY) * unit + halfRenderLineWidth
    minX = (minX + offsetX) * unit - halfRenderLineWidth
    minY = (minY + offsetY) * unit - halfRenderLineWidth

    //only render if onscreen
    if (
        minX <= canvas.width &&
        minY <= canvas.height &&
        maxX >= 0 &&
        maxY >= 0
    ) {
        ctx.textAlign = textAlign
        ctx.textBaseline = textBaseline
        ctx.lineWidth = renderLineWidth
        ctx.strokeStyle = color
        ctx.font = `${unit * textSize}px Fira Code`
        ctx.strokeText(text, (x + offsetX) * unit, (y + offsetY) * unit, maxWidth == undefined ? undefined : maxWidth * unit)
        return true
    }
    return false
}