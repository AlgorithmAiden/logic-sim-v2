console.log('Inputs.js loaded')

import { traceWrap } from "./Shared.js"
import { settings } from "./Shared.js"
import * as Lines from "./Lines.js"
import * as Render from "./Render.js"

export class Input {
    constructor() {
        //the only top level data is rows and title, and only rows is an object
        this.rows = []

        //creates the wrapper that everything is put inside
        //since the wrapper never gets removed, the order of inputs doesn't change when an input updates
        this.wrapper = document.createElement('div')
        this.wrapper.classList.add('input_wrapper')
        document.getElementById('inputsDiv').appendChild(this.wrapper)

        //wrapping to detect any changes
        return traceWrap(this, this.update.bind(this))
    }
    update(property, value) {
        //remove all the old html
        this.wrapper.innerHTML = ''

        //add the title, if any
        if (this.title != undefined) {
            const titleElement = document.createElement('div')
            titleElement.classList.add('input_title')
            titleElement.innerText = this.title
            this.wrapper.appendChild(titleElement)
        }

        //create a div to store all the rows
        const rowsWrapper = document.createElement('div')
        rowsWrapper.classList.add('input_rowsWrapper')

        //add the rows
        for (const row of this.rows) {

            //create a wrapper for the row
            const rowWrapper = document.createElement('div')
            rowWrapper.classList.add('input_rowWrapper')

            //add the title (if any) first to the wrapper
            if (row.title != undefined) {
                const titleElement = document.createElement('div')
                titleElement.classList.add('input_row_title')
                titleElement.innerText = row.title
                rowWrapper.appendChild(titleElement)
            }

            //create a wrapper for the row's items
            const rowElement = document.createElement('div')
            rowElement.classList.add('input_row')

            //add the items
            for (const index in row.items) {
                const item = row.items[index]
                let itemElement
                if (item.type == 'button') {
                    itemElement = document.createElement('button')
                    itemElement.innerText = item.title
                    itemElement.onclick = item.func
                }
                itemElement.classList.add('input_item')

                //add special styles to the end items
                if (index == 0) itemElement.classList.add('input_row_left')
                if (index == row.items.length - 1) itemElement.classList.add('input_row_right')


                rowElement.appendChild(itemElement)
            }
            rowWrapper.appendChild(rowElement)
            rowsWrapper.appendChild(rowWrapper)
        }
        this.wrapper.appendChild(rowsWrapper)
    }
}

const canvas = document.getElementById('canvas')

canvas.addEventListener('wheel', event => {
    settings.viewport.scale *= (Math.abs(event.deltaY) / 750) ** 1.1 * (event.deltaY < 0 ? -1 : 1) + 1
})

let isDragging = false
let lastPosition
let rawDragStart
let dragStartViewportX
let dragStartViewportY

canvas.addEventListener('contextmenu', event => {
    event.preventDefault()
})

canvas.addEventListener('mousedown', event => {
    isDragging = true
    const rect = canvas.getBoundingClientRect()
    const position = Render.getGridPosition(event.clientX - rect.left, event.clientY - rect.top)
    rawDragStart = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    dragStartViewportX = settings.viewport.x
    dragStartViewportY = settings.viewport.y
    Lines.handleMouseDown(position.x, position.y, event.shiftKey, event.button)
    lastPosition = position
})
canvas.addEventListener('mousemove', event => {
    const rect = canvas.getBoundingClientRect()
    const position = Render.getGridPosition(event.clientX - rect.left, event.clientY - rect.top)
    Lines.handleMouseMove(position.x, position.y)
    if (isDragging)
        if (!Lines.handleMouseDrag(position.x, position.y)) {
            settings.viewport.x = dragStartViewportX + (rawDragStart.x - (event.clientX - rect.left)) / Render.getUnit()
            settings.viewport.y = dragStartViewportY + (rawDragStart.y - (event.clientY - rect.top)) / Render.getUnit()
        }

    lastPosition = position
})
canvas.addEventListener('mouseup', event => {
    if (isDragging) {
        isDragging = false
        rawDragStart = dragStartViewportX = dragStartViewportY = undefined
        const rect = canvas.getBoundingClientRect()
        const position = Render.getGridPosition(event.clientX - rect.left, event.clientY - rect.top)
        Lines.handleMouseUp(position.x, position.y)
    }
})
canvas.addEventListener('mouseleave', () => {
    if (isDragging) {
        isDragging = false
        rawDragStart = dragStartViewportX = dragStartViewportY = undefined
        Lines.handleMouseUp(lastPosition.x, lastPosition.y)
    }
})

const currentKeys = []
document.addEventListener('keydown', event => {
    const key = event.key
    if (!currentKeys.includes(key)) {
        currentKeys.push(key)
        Lines.handleKeyDown(key)
    }
})
document.addEventListener('keyup', event => {
    const key = event.key
    if (currentKeys.includes(key))
        currentKeys.splice(currentKeys.indexOf(key), 1)
})

setInterval(() => {
    if (currentKeys.includes('q') && !currentKeys.includes('e')) settings.viewport.scale *= 0.95
    if (currentKeys.includes('e') && !currentKeys.includes('q')) settings.viewport.scale *= 1.05
    if (currentKeys.includes('w') && !currentKeys.includes('s')) settings.viewport.y -= settings.viewport.scale * .025
    if (currentKeys.includes('s') && !currentKeys.includes('w')) settings.viewport.y += settings.viewport.scale * .025
    if (currentKeys.includes('a') && !currentKeys.includes('d')) settings.viewport.x -= settings.viewport.scale * .025
    if (currentKeys.includes('d') && !currentKeys.includes('a')) settings.viewport.x += settings.viewport.scale * .025
}, 1000 / 30)