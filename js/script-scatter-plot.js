$(function() {
    console.log(new Date(), "ready scatterplot!");

    let stageWidth = $('#scatter-plot-container').width(); 
    let stageHeight = 444 //0.5 * stageWidth;
    let genomeLength = 3087930326;

    async function loadArrowTable(filename) {
      let results = await ApacheArrow.arrow.Table.from(fetch(`/${filename}`));
      let table = await results;
      return results;
    }

    d3.select('#heading-container').html(`Started loading data at <b>${new Date()}</b>...`)
    loadArrowTable('data.arrow').then((results) => {
        let dataPointsY = results.getColumn('y').toArray();
        let yExtent = d3.extent(dataPointsY);
        let dataPointsColor = results.getColumn('color').toArray();
        let dataPointsX = results.getColumn('x').toArray();
        let xExtent = [1, genomeLength] // d3.extent(dataPointsX);
        d3.select('#heading-container2').html(`Finished loading <b>${results.length}</b> datapoints at <b>${new Date()}</b>`)
        let rScatterPlot = new ReglScatterPlot('scatter-plot-container', stageWidth, stageHeight);
        rScatterPlot.load(dataPointsX, dataPointsY, dataPointsColor, xExtent, yExtent);
        rScatterPlot.render();
    });
});