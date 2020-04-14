// chart dimensions
const dims = {
  height: 300,
  width: 300,
  radius: 150
}
// center 
const cent = {
  x: (dims.width / 2 + 5),
  y: (dims.height/2 + 5)
}
// create svg
const svg = d3.select('.canvas')
  .append('svg')
  .attr('width', dims.width + 150)
  .attr('height', dims.height + 150);

// group to contain & position graph elements
const graph = svg.append('g')
  .attr('transform', `translate(${cent.x}, ${cent.y})`);

// pie generator - returns a function to calculate arcs
const pie = d3.pie()
  .sort(null)
  .value(d => d.cost);

const arcPath = d3.arc() // returns an arc generator
  .outerRadius(dims.radius) // the outer bound of the circle
  .innerRadius(dims.radius / 2); // creates a donut chart

// create color scale using scaleOrdinal
const color = d3.scaleOrdinal(d3['schemeSet3'])

// legend setup
const legendGroup = svg.append('g')
  .attr('transform',`translate(${dims.width + 40}, 10)`);

const legend = d3.legendColor()
  .shape('circle')
  .shapePadding(10)
  .scale(color);

// tooltip setup
const tip = d3.tip()
  .attr('class','tip card')
  .html( d => {
    let content = `
      <div class="name">${d.data.name}</div>
      <div class="cost">$${d.data.cost}</div>
      <div class="delete">Click Slice to Delete</div>

    `
    return content
  });

graph.call(tip);

// Donut Readout Text setup
const donutLable = graph.append('g')

donutLable.append('text')
  .attr('class', 'donutLable')
  .attr('x', 0)
  .attr('y', 10)
  .attr('fill', '#fff')
  .attr('font-size', '2.5rem')
  .attr('text-anchor', 'middle');

const update = (data) => {
  // update color scale domain
  color.domain(data.map(d => d.name))

  // update legend
  legendGroup.call(legend)
    // make text white
  legendGroup.selectAll('text').attr('fill','white')

  // join enhanced pie data to path elements
  const paths = graph.selectAll('path')
    .data(pie(data))

  // draw the enter selection
  paths.enter()
    .append('path')
      .attr('class', 'arc')
      //.attr('d', d => arcPath(d)) // Don't need this if you have the tween transition
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      // set fill color based on color scale
      .attr('fill', d => color(d.data.name))
      // perform a funciton on each element
      .each( function(d) {
        // will help us calculate the difference between the current data and the updated date.
        this._current = d;
      })
      // arc tween
      .transition().duration(500)
        .attrTween('d', arcTweenEnter)

  // handle the exit selection
  paths.exit()
    .transition().duration(500)
    .attrTween('d', arcTweenExit)
    .remove();

  // for modified data
  paths.attr('d', d => arcPath(d))
      .transition().duration(500)
      .attrTween('d', arcTweenUpdate);

  // Tracking total Cost
  let totalCost = d3.sum(data.map(d => d.cost));
  
  // mouse events
  graph.selectAll('path')
    .on('mouseover', (d,i,n) => {
      highlightArc(d,i,n);
      tip.show(d, n[i]);
      donutLableShow(d, i, n, totalCost);
    })
    .on('mouseout', (d,i,n) => {
      unhighlightArc(d,i,n);
      tip.hide(d, n[i]);
      donutLableHide(d, i, n);
    })
    .on('click', deleteArc)
}

var data = [];
db.collection('expenses').onSnapshot(res => {

  res.docChanges().forEach(change => {
    
    const doc = {
      ...change.doc.data(), 
      id: change.doc.id
    };
    //console.log( change, doc);

    // handle the change
    switch (change.type){
      case 'added':
        data.push(doc);
        break;
      case 'modified':
        const index = data.findIndex(item => 
          item.id === doc.id);
        data[index] = doc ;
        break;
      case 'removed':
        data = data.filter(item => 
          item.id !== doc.id);
        break;
      default:
        break;
    }

  })
  // update function
  update(data);
})

// arc tween
const arcTweenEnter = d => {
  // yields a value between end angle and start angle over time
  let i = d3.interpolate(d.endAngle, d.startAngle)
  
  return function (t) {
    // update the value of the start angle over time
    d.startAngle = i(t);
    // return a value for the path evert time the ticker changes
    return arcPath(d)
  }
}

const arcTweenExit = d => {
  // yields a value between end angle and start angle over time
  let i = d3.interpolate(d.startAngle, d.endAngle)
  
  return function (t) {
    // update the value of the start angle over time
    d.startAngle = i(t);
    // return a value for the path evert time the ticker changes
    return arcPath(d)
  }
}

// use function keyword because "this"
function arcTweenUpdate(d) {
  // this._current = the previous start/end angles
  // d = new, refreshed data
  //console.log(this._current, d);

  // interpolate between two objects
  let i = d3.interpolate(this._current, d)
  // update current prop with new updated data
  this._current = d;

  return function (t) {
    // redraw the paths
    return arcPath(i(t));
  }
}

// mouse over event - highlight, show tooltip
const highlightArc = (d, i, n) => {
  //console.log(d);
  d3.select(n[i])
    .transition('highlightArc').duration(300)
    .attr('fill', '#fff')
}
// mouse out event - unhighlight, hide tooltip
const unhighlightArc = (d,i,n) => {
  d3.select(n[i])
    .transition('unhighlightArc').duration(300)
    .attr('fill', color(d.data.name))
}
// delete on click
const deleteArc = (d, i, n) => {
  // submit delete request to firebase for d.data.id
  const id = d.data.id;
  db.collection('expenses').doc(id).delete();
}
// mouse over event - hide percent in donut lable
const donutLableHide = (d, i, n) => {
  d3.select('.donutLable')
    .attr('display', 'none')
}
// mouse over event - show percent in donut lable
const donutLableShow = (d, i, n, totalCost) => {
  // Set Format
  const format = d3.format(".2f")
  // compute percentage
  let pct = format((d.data.cost/totalCost) * 100).toString() + '%'
  // set display and change svg content
  d3.select('.donutLable')
    .attr('display', 'block')
    .text(pct);
  
}