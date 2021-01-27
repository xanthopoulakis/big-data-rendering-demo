$(function() {
    console.log(new Date(), "ready!");

    let stageWidth = $('#scatter-plot-container').width(); 
    let stageHeight = 444 //0.5 * stageWidth;


    async function loadArrowTable(filename) {
      let results = await ApacheArrow.arrow.Table.from(fetch(`/${filename}`));
      let table = await results;
      return results;
    }

    d3.select('#heading-container').html(`Started loading data at <b>${new Date()}</b>...`)
    d3.queue()
    .defer(d3.json, "../json/metadata.json")
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


      // var worker = new Worker('js/scatter-plot-data-worker.js');
      //
      // loadArrowTable('big.arrow').then((results) => {
      //   worker.postMessage({
      //     x: results.getColumn('x').toArray(),
      //     y: results.getColumn('y').toArray(),
      //     chromosome: results.getColumn('chromosome').toArray()
      //   });
      // });

      // worker.addEventListener('message', (e) => {
      //   console.log('loaded!', e.data)
      // }, false);
      // Papa.parse("http://localhost:8080/public/data.csv", {
      //   dynamicTyping: true,
      //   skipEmptyLines: true,
      //   header: true,
      //   worker: true,
      //   download: true,
      //   complete: (results) => {
      //     console.log('complete parse', new Date())
      //     let dataPoints = results.data;
      //     console.log(dataPoints.length, dataPoints[0], new Date())
      //
      //     let dataPointsX = [], dataPointsY = [], dataPointsColor = [], yExtent = [0,0];
      //     dataPoints.forEach((d,i) => {
      //       dataPointsX.push(chromoBins[`chr${d.chromosome}`].startPlace + d.x);
      //       dataPointsY.push(+d.y);
      //       dataPointsColor.push(Object.values(d3.rgb(chromoBins[`chr${d.chromosome}`].color)));
      //       yExtent = [d3.min([yExtent[0], +d.y]), d3.max([yExtent[1], +d.y])];
      //     });
      //     console.log(dataPointsX[100], dataPointsY[100], dataPointsColor[100], new Date())
      //     let rScatterPlot = new ReglScatterPlot('scatter-plot-container', stageWidth, stageHeight);
      //     rScatterPlot.load(dataPointsX, dataPointsY, dataPointsColor, [1, genomeLength], yExtent);
      //     rScatterPlot.render();
      //   }
      // });
      
      loadArrowTable('data.arrow').then((results) => {
        let dataPointsX = [], dataPointsY = [], dataPointsColor = [], dataChromosomes = [], yExtent = [0,0];
          dataPointsY = results.getColumn('y').toArray();
          yExtent = d3.extent(dataPointsY);
          dataChromosomes = results.getColumn('chromosome').toArray();
          dataPointsX = results.getColumn('x').toArray().map((d,i) => chromoBins[`chr${dataChromosomes[i]}`].startPlace + d);
          dataPointsColor = dataChromosomes.map((d,i) => Object.values(d3.rgb(chromoBins[`chr${d}`].color)));
          d3.select('#heading-container2').html(`Finished loading <b>${results.length}</b> datapoints at <b>${new Date()}</b>`)
        let rScatterPlot = new ReglScatterPlot('scatter-plot-container', stageWidth, stageHeight);
        rScatterPlot.load(dataPointsX, dataPointsY, dataPointsColor, [1, genomeLength], yExtent);
        rScatterPlot.render();
      });

      
    });



});