'use strict';

let loadMarthy = (function(window){
  function define_Marthy() {
    // Define object
    let Marthy = function(main, opts) {
      // Initiale instance object
      let instance = createInstance(this, main, opts)

      // Load listerners
      loadInstanceListeners(instance)
    }
    // Prototypes
    loadPublicPrototypes(Marthy)
    // Return
    return Marthy
  }

  // Define globally if it doesn't already exist
  if(typeof(Marthy) === 'undefined'){
    window.Marthy = define_Marthy()
  }
})


/*
 * CONST
 */
let NEAR_DIST = 30

/*
 * Marthy Init
 */

// Create the new instance
let createInstance = function(instance, main, opts) {
  // Handle main
  main.classList.add('marthy')
  // Create SVG
  let svg = createTagSVG('svg', {class: 'marthy-svg'})
  main.appendChild(svg)

  // Create cursor point
  let cursor = createTagSVG('circle', {class: 'point cursor', cx: 0, cy: 0, r: '2'})
  svg.appendChild(cursor)

  // Create UI
  // let ui = document.createElement('div')
  // ui.setAttribute('class', 'marthy-ui')
  // main.appendChild(ui)
  // let debug = document.createElement('div')
  // debug.setAttribute('class', 'marthy-debug')
  // ui.appendChild(debug)

  // Create instance vars
  instance._dom = {
    _main: main,
    _svg: svg,
    // _debug: debug,
  }
  instance._opts = opts // Opts given for this instance
  instance._els_idx = 0 // Keep idx for new id
  instance._els = {} // Existing elements {id: {el_opts}, id2: {el_opts}}
  instance._cursor = {
    id: 'el-cursor',
    pos: {x:0, y:0},
    el: cursor
  }

  instance._tool = 'point'
  instance._nearest = null // Current `el_opts` nearest of the cursor
  instance._selected = null // Current `el_opts` selected

  return instance
}

let loadInstanceListeners = function(instance) {
  // On click on SVG: Action
  instance._dom._svg.onclick = function(e) {
    // If svg are clicked, but an element are close of the cursor
    if (instance._nearest) {
      return onElementClicked(instance, instance._nearest)
    }
    // In other case, create point
    onSvgClicked(instance, {x: e.offsetX, y: e.offsetY})
  }

  // Mouse move: Compute .near && .nearest elements
  instance._dom._svg.onmousemove = function(e) {
    updateNearestElement(instance, {x: e.offsetX, y: e.offsetY})
  }
}

let updateNearestElement = function(instance, pos) {
  let nearest = null
  let nearest_dist = NEAR_DIST + 1 // more than max

  Object.keys(instance._els).forEach(id => {
    let el_opts = instance._els[id]
    let dist = getDistanceBetweenPoints(pos, el_opts.pos)

    if (dist < NEAR_DIST) {
      if (!el_opts.el.classList.contains('near')) {
        el_opts.el.classList.add('near')
      }
      if (dist < nearest_dist) {
        nearest_dist = dist
        nearest = el_opts
      }
    } else if (el_opts.el.classList.contains('near')) {
      el_opts.el.classList.remove('near')
    }
  })

  // If it's the same nearest, don't update
  if (nearest && instance._nearest && nearest.id === instance._nearest.id) {
    return
  }

  if (instance._nearest) {
    instance._nearest.el.classList.remove('nearest')
    instance._nearest = null
    // Remove global css class
    if (!nearest) {
     instance._dom._main.classList.remove('have-nearest')
   }
  }
  if (nearest) {
    // Hide the cursor
    instance._cursor.el.classList.add('hidden')
    // Handle nearest
    instance._nearest = nearest
    instance._nearest.el.classList.add('nearest')
    // Add global css class
    if (!instance._dom._main.classList.contains('have-nearest')) {
     instance._dom._main.classList.add('have-nearest')
    }
  } else {
    // Handle cursor position on the svg
    if (instance._tool !== 'hand') {
      // No nearest element
      instance._cursor.el.classList.remove('hidden')
      instance._cursor.el.setAttribute('cx', pos.x)
      instance._cursor.el.setAttribute('cy', pos.y)
      instance._cursor.pos = pos
    }
  }
}

/*
 * Public Prototypes
 */
let loadPublicPrototypes = function(Marthy) {
  Marthy.prototype.addPoint = function(opts) {
    let instance = this
    let el_opts = createElementSVG(instance, 'circle', {class: 'point el', cx: opts.x, cy: opts.y, r: '4'}, {x: opts.x, y: opts.y})
    // Pre-select it
    instance.selectEl(el_opts)

    el_opts.el.onclick = function (e) {
      e.stopPropagation() // Don't click on svg
      onElementClicked(instance, el_opts)
    }
  }
  Marthy.prototype.selectEl = function(el_opts) {
    let instance = this
    if (instance._selected) {
      instance.unselectEl()
    }
    el_opts.el.classList.add('selected')
    instance._selected = el_opts
  }
  Marthy.prototype.unselectEl = function() {
    let instance = this
    if (instance._selected) {
      instance._selected.el.classList.remove('selected')
      instance._selected = null
    }
  }
  Marthy.prototype.setTool = function(tool) {
    this.unselectEl()
    if (tool === 'hand') {
      this._cursor.el.classList.add('hidden')
    }
    else {
      this._cursor.el.classList.remove('hidden')
    }
    return this._tool = tool
  }
  Marthy.prototype.getTool = function(tool) {
    return this._tool
  }
}

/*
 * Events
 */
let onSvgClicked = function(instance, pos) {
  if (instance._tool === 'hand') {
    return instance.unselectEl()
  }
  if (instance._tool === 'point') {
    return instance.addPoint(pos)
  }
}
let onElementClicked = function(instance, el_opts) {
  let is_selected = (instance._selected && (instance._selected.id === el_opts.id)) ? true : false

  //if (instance._tool === 'hand') {
  if (is_selected) {
    return instance.unselectEl()
  }
  return instance.selectEl(el_opts)
}

/*
 * HTML
 */
let createElementSVG = function(instance, type, opts, pos) {
  let id = "el-" + (instance._els_idx++)
  let el= createTagSVG(type, opts)

  opts.el = el
  opts.id = id
  opts.pos = pos
  instance._els[id] = opts

  instance._dom._svg.appendChild(el)
  return opts
}

let createTagSVG = function(type, opts) {
  let tag = document.createElementNS('http://www.w3.org/2000/svg', type);
  for (let k in opts)
      tag.setAttribute(k, opts[k]);
  return tag
}

/*
 * GEOMETRY
 */

// Distances
let getDistanceBetweenPoints = function(p1, p2) {
  let a = p1.x - p2.x
  let b = p1.y - p2.y
  return parseInt(Math.sqrt( a*a + b*b ))
}

// Private function are defined
// We can now try to define Marthy
loadMarthy(window)