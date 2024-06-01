console.log('Shared.js loaded')
const wrappedObjects = new WeakMap()

export const settings = {
    viewport: {
        scale: 10, //scale is the min number of cells to display
        x: 0,
        y: 0
    },
    showCheckeredBackground: true
}

export function traceWrap(val = {}, onSet) {
    // Pass non-objects through as-is
    if (val === null || typeof val !== 'object')
        return val

    // Reuse an existing wrapping if there is one for this object already.
    if (wrappedObjects.has(val))
        return wrappedObjects.get(val)

    // Create a new Proxy to wrap the object
    const wrapped = new Proxy(val, {

        // Trace on get so that we don't need to modify the original objects
        get(target, property) {
            return traceWrap(target[property], onSet)
        },

        // Call onSet when a property is set
        set(target, property, value) {
            // Set the property without wrapping
            target[property] = value
            // Trigger the onSet callback
            onSet.call(target, property, value)
            return true
        }
    })

    // Update the cache so that we reuse the same wrapper for the same object
    wrappedObjects.set(val, wrapped)
    wrappedObjects.set(wrapped, wrapped)

    return wrapped
}