/***


 Current bugs to fix :
  - When user click on svg but near an element, dont create a new point but click on the nearest
  - Moving around the nearest el (when another is near ?) will remove/add/remove/add the .nearest class to the right element (if it's the same the add/remove action have to be avoided)



*/



var loadMathC = (function(window){
    //I recommend this
    'use strict';
    console.log("## Use strict")

    function define_MathC() {
    console.log("## define_MathC")

      // Define object
      let MathC = function(main, opts) {
        console.log("## new MathC(main, opts)")
        // Initiale instance object
        let instance = createInstance(this, main, opts)

        // Load listerners
        loadInstanceListeners(instance)
      }

      console.log("## will loadPublicPrototypes")

      // Prototypes
      loadPublicPrototypes(MathC)

      // Return
      return MathC
    }


    // Define globally if it doesn't already exist
    if(typeof(MathC) === 'undefined'){
      window.MathC = define_MathC()
    }
});

/*
 * CONST
 */
var NEAR_DIST = 30

/*
 * MathCanvas Init
 */

// Create the new instance
var createInstance = function(instance, main, opts) {
  console.log("## createInstance")

  // Handle main
  main.classList.add('mathc')
  // Create SVG
  let svg = createTagSVG('svg', {class: 'mathc-svg'})
  main.appendChild(svg)
  // Create UI
  let ui = document.createElement('div')
  ui.setAttribute('class', 'mathc-ui')
  main.appendChild(ui)

  // Create instance vars
  instance._dom = {
    _main: main,
    _svg: svg,
    _ui: ui
  }
  instance._opts = opts // Opts given for this instance
  instance._els_idx = 0 // Keep idx for new id
  instance._els = {} // Existing elements {id: {el_opts}, id2: {el_opts}}
  instance._nearest = null // Current el_opts nearest of the cursor
  instance._selected = null // Current el_opts selected

  return instance
}

var loadInstanceListeners = function(instance) {
  // On click on SVG: Action
  instance._dom._svg.onclick = function(e) {
    // If svg are clicked, but an element are close of the cursor
    console.log("Click ! nearest : ", instance._nearest)
    if (instance._nearest) {
      return onElementClicked(instance._nearest)
    }
    // In other case, create point
    instance.addPoint({x: e.offsetX, y: e.offsetY})
  }

  // Mouse move: Compute .near && .nearest elements
  instance._dom._svg.onmousemove = function(e) {
    updateNearestElement(instance, {x: e.offsetX, y: e.offsetY})
  }
}

var updateNearestElement = function(instance, pos) {
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

    // If it's the same nearest, don't update
    if (nearest && instance.nearest && nearest.id === instance.nearest.id) {
      return
    }

    if (instance.nearest) {
      console.log("Remove nearest")
      instance.nearest.el.classList.remove('nearest')
      instance.nearest = null
      // Remove global css class
      if (!nearest) {
       instance._dom._main.classList.remove('have-nearest')
     }
    }
    if (nearest) {
      console.log("add nearest")
      instance.nearest = nearest
      instance.nearest.el.classList.add('nearest')
      // Add global css class
      if (!instance._dom._main.classList.contains('have-nearest')) {
       instance._dom._main.classList.add('have-nearest')
      }
    }
  })
}

/*
 * Public Prototypes
 */
var loadPublicPrototypes = function(MathC) {
  MathC.prototype.addPoint = function(opts) {
    let instance = this
    let el_opts = createElementSVG(instance, 'circle', {class: 'point el', cx: opts.x, cy: opts.y, r: '4'}, {x: opts.x, y: opts.y})
    // Pre-select it
    instance.selectEl(el_opts)

    el_opts.el.onclick = function (e) {
      e.stopPropagation() // Don't click on svg
      onElementClicked(instance, el_opts)
    }
  }
  MathC.prototype.selectEl = function(el_opts) {
    let instance = this
    if (instance._selected) {
      instance.unselectEl()
    }
    el_opts.el.classList.add('selected')
    instance._selected = el_opts
      console.log("Select " + instance._selected.id)
  }
  MathC.prototype.unselectEl = function() {
    let instance = this
    if (instance._selected) {
      console.log("Unselect " + instance._selected.id)
      instance._selected.el.classList.remove('selected')
      instance._selected = null
    }
  }
}

/*
 * Events
 */
var onElementClicked = function(instance, el_opts) {
  if (instance._selected && (instance._selected.id === el_opts.id)) {
    return instance.unselectEl()
  }
  instance.selectEl(el_opts)
}

/*
 * HTML
 */
var createElementSVG = function(instance, type, opts, pos) {
  let id = "el-" + (instance._els_idx++)
  var el= createTagSVG(type, opts)

  opts.el = el
  opts.id = id
  opts.pos = pos
  instance._els[id] = opts

  instance._dom._svg.appendChild(el)
  return opts
}

var createTagSVG = function(type, opts) {
  var tag = document.createElementNS('http://www.w3.org/2000/svg', type);
  for (var k in opts)
      tag.setAttribute(k, opts[k]);
  return tag
}

/*
 * GEOMETRY
 */

// Distances
let getDistanceBetweenPoints = function(p1, p2) {
  var a = p1.x - p2.x
  var b = p1.y - p2.y
  return parseInt(Math.sqrt( a*a + b*b ))
}


console.log("## PRIVATE FUNCTION DEFINED")

// Private function are defined
// We can now try to define MathC
loadMathC(window)