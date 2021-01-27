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
      let intervals = dataInput[1].intervals;
      let intervalsStartPoint = [], intervalsEndPoint = [], intervalsDomainY = [0,0], intervalsY = [], intervalsFill = [], intervalsStroke = [];
      intervals.forEach((d,i) => {
        intervalsStartPoint.push(chromoBins[`${d.chromosome}`].startPlace + d.startPoint);
        intervalsEndPoint.push(chromoBins[`${d.chromosome}`].startPlace + d.endPoint);
        intervalsY.push(+d.y);
        intervalsFill.push(Object.values(d3.rgb(chromoBins[`${d.chromosome}`].color)));
        intervalsStroke.push(Object.values(d3.rgb(chromoBins[`${d.chromosome}`].color).darker()));
        intervalsDomainY = [d3.min([intervalsDomainY[0], +d.y]), d3.max([intervalsDomainY[1], +d.y])];
      });
      d3.select('#heading-container2').html(`Finished loading <b>${intervals.length}</b> intervals at <b>${new Date()}</b>`)
      let rGenomePlot = new ReglGenomePlot('genome-plot-container', stageWidth, stageHeight);
      rGenomePlot.load(intervalsStartPoint, intervalsEndPoint, intervalsY, intervalsFill, intervalsStroke, [1, genomeLength] , intervalsDomainY);
      rGenomePlot.render();
    });

});