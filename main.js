(async () => {
    const Shared = await import("./Shared.js")
    const ColorKey = await import("./ColorKey.js")
    
    const Components = await import("./Components.js")
    const Inputs = await import("./Inputs.js")
    const Lines = await import("./Lines.js")
    const Simulator = await import("./Simulator.js")

    const Render = await import("./Render.js")

    Render.startRenderLoop()
})()