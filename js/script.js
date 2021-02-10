$(function() {
    console.log(new Date(), "ready!");

    let stageWidth = $('#genome-plot-container').width(); 
    let stageHeight = 444 //0.5 * stageWidth;

    d3.select('#heading-container').html(`Started loading data at <b>${new Date()}</b>...`)

    d3.queue()
    .defer(d3.json, "../json/metadata.json")
    .defer(d3.json, "../json/onekg.random.100.json")
    .awaitAll(function(error, dataInput) {
      if (error) throw error;
      let genomeLength = dataInput[0].metadata.reduce((acc, elem) => (acc + elem.endPoint), 0);
      let boundary = 0;
      let genomeScale = d3.scaleLinear().domain([1, genomeLength]).range([0, stageWidth]);
      let chromoBins = dataInput[0].metadata.reduce((hash, element) => {
        let chromo = element;
        chromo.length = chromo.endPoint;
        chromo.startPlace = boundary;
        hash[element.chromosome] = chromo;
        boundary += chromo.length;
        return hash;
      }, {});
      console.log(genomeLength)
      // Intervals Processing
      let intervals = dataInput[1].intervals;
      let intervalBins = {}, intervalsStartPoint = [], intervalsEndPoint = [], domainY = [0,0], intervalsY = [], domainX = [1, genomeLength],intervalsFill = [], intervalsStroke = [];
      intervals.forEach((d,i) => {
        d.startPlace = chromoBins[`${d.chromosome}`].startPlace + d.startPoint;
        intervalsStartPoint.push(d.startPlace);
        d.endPlace = chromoBins[`${d.chromosome}`].startPlace + d.endPoint;
        intervalsEndPoint.push(d.endPlace);
        intervalsY.push(+d.y);
        intervalsFill.push(rgbtoInteger(d3.rgb(chromoBins[`${d.chromosome}`].color)));
        intervalsStroke.push(rgbtoInteger(d3.rgb(chromoBins[`${d.chromosome}`].color).darker()));
        domainY = [d3.min([domainY[0], +d.y]), d3.max([domainY[1], +d.y])];
        intervalBins[d.iid] = d;
      });
      let intervalStruct = {intervalsStartPoint, intervalsEndPoint, intervalsY, intervalsFill, intervalsStroke, domainX , domainY};
      // Connections Processing
      let connectionsColorMap = {ALT: rgbtoInteger('red'), REF: rgbtoInteger('lightgray'), LOOSE: rgbtoInteger('gray')};
      let connections = dataInput[1].connections;
      let connectionVerticesX = [],connectionVerticesY = [], connectionColors = [], connectionLinks = []; connectionCounter = 0;
      connections.forEach((d,i) => {
        let origin = intervalBins[Math.abs(d.source)];
        let target = intervalBins[Math.abs(d.sink)];
        d.color = connectionsColorMap[d.type];
        if (origin) {
          d.sourcePlace = (Math.sign(d.source) > 0) ? origin.endPlace : origin.startPlace;
          d.sourceY = origin.y;
        }
        if (target) {
          d.sinkPlace = (Math.sign(d.sink) > 0) ? target.endPlace : target.startPlace;
          d.sinkY = target.y;
        }
        if (origin && target) {
          d.edges = [[d.sourcePlace, d.sourceY], [d.sinkPlace, d.sinkY]].sort((a,b) => d3.ascending(a[0], b[0]));
        } else {
          let touchPlace = d.sourcePlace || d.sinkPlace;
          let touchY = d.sourceY || d.sinkY;
          d.edges = [[touchPlace, touchY], [touchPlace, 1.1 * touchY]];
        }
      })

      // rendering part
      d3.select('#heading-container2').html(`Finished loading <b>${intervals.length}</b> intervals at <b>${new Date()}</b>`)
      let rGenomePlot = new ReglGenomePlot('genome-plot-container', stageWidth, stageHeight);
      rGenomePlot.load(intervalStruct, connections);
      rGenomePlot.render();
    });

    function rgbtoInteger(color) {
      rgb = d3.rgb(color);
      return rgb.r * 65536 + rgb.g * 256 + rgb.b;
    }

    function bezier(connection) {
      let controlPoints = [], vertices = [];
      if (['REF', 'ALT'].includes(connection.type)) {
        controlPoints.push(connection.edges[0]);
        controlPoints.push([connection.edges[0][0] + 1, connection.edges[0][1]]);
        if (connection.edges[0][1] === connection.edges[1][1]) {
          controlPoints.push([0.5 * (connection.edges[0][0] + connection.edges[1][0]), 1.5 * connection.edges[0][1]]);
        } else {
          controlPoints.push([0.5 * (connection.edges[0][0] + connection.edges[1][0]), 0.5 * (connection.edges[0][1] + connection.edges[1][1])]);
        }
        controlPoints.push([connection.edges[1][0] - 1, connection.edges[1][1]]);
        controlPoints.push(connection.edges[1]);
      }
      for (t = 0; t <= 1.0; t+= 0.1) {
        let vx = Math.pow(1 - t, 4) * controlPoints[0][0] + 4 * Math.pow(1 - t, 3) * Math.pow(t, 1) * controlPoints[1][0] + 6 * Math.pow(1 - t, 2) * Math.pow(t, 2) * controlPoints[2][0] + 4 * Math.pow(1 - t, 1) * Math.pow(t, 3) * controlPoints[3][0] + Math.pow(t, 4) * controlPoints[4][0];
        let vy = Math.pow(1 - t, 4) * controlPoints[0][1] + 4 * Math.pow(1 - t, 3) * Math.pow(t, 1) * controlPoints[1][1] + 6 * Math.pow(1 - t, 2) * Math.pow(t, 2) * controlPoints[2][1] + 4 * Math.pow(1 - t, 1) * Math.pow(t, 3) * controlPoints[3][1] + Math.pow(t, 4) * controlPoints[4][1];
        vertices.push([vx, vy]);
      }
      return vertices;
    }

});