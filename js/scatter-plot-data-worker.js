// Running the loading of the data

// Setup an event listener that will handle messages sent to the worker.
self.addEventListener('message', (e) => {
  /* Bring in D3.js*/
  importScripts( "external/d3.min.js");




  
    let dataPointsX = [], dataPointsY = [], dataPointsColor = [], dataChromosomes = [], yExtent = [0,0];
    //console.log(e.data.results)
    e.data.counter = e.data.x.length;
    // Send the message back.
    self.postMessage(e.data);


}, false);