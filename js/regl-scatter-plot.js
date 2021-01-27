class ReglScatterPlot {

  constructor(plotContainerId, totalWidth, totalHeight) {
    this.stageWidth = totalWidth;
    this.stageHeight = totalHeight;
    this.pixelRatio = window.devicePixelRatio || 2;
    this.container = d3.select(`#${plotContainerId}`)
      .style('width', `${this.stageWidth}px`)
      .style('height', `${this.stageHeight}px`);
    d3.select(`#${plotContainerId} canvas`).remove();

    let regl = createREGL({
      container: this.container.node(),
      extensions: ['ANGLE_instanced_arrays'],
      pixelRatio:  1,
      attributes: { antialias: false, depth: false, alpha: false},
    });
    this.reglInstance = regl;
    this.positions = [[0.0, 0.0]];
    this.pointSize = 2.0;
    this.clear();
    this.draw = regl({
        frag: `
        precision highp float;
        varying vec4 vColor;
        void main() {
          gl_FragColor = vColor;
        }`,

        vert: `
        precision highp float;
        attribute vec2 position;
        attribute vec4 color;
        varying vec4 vColor;
        attribute float dataX, dataY;
        uniform vec2 domainX, domainY;
        uniform float stageWidth, stageHeight, pointSize;

        vec2 normalizeCoords(vec2 position) {
          // read in the positions into x and y vars
          float x = position[0];
          float y = position[1];

          return vec2(
            2.0 * ((x / stageWidth) - 0.5),
            -(2.0 * ((y / stageHeight) - 0.5)));
        }

        void main() {

          float kx = stageWidth / (domainX.y - domainX.x);
          float ky = -stageHeight / (domainY.y - domainY.x);

          float posX = kx * (dataX - domainX.x);
          float posY = stageHeight + ky * (dataY - domainY.x);

          float vecX = posX * position.x + posX;
          float vecY = posY * position.y + posY;

          vec2 v = normalizeCoords(vec2(vecX,vecY));

          gl_PointSize = pointSize;
          gl_Position = vec4(v, 0, 1);
          vColor = vec4(color.r / 255.0, color.g / 255.0, color.b / 255.0, color.a / 1.0);
        }`,

        attributes: {
          position: this.positions,

          dataX: {
            buffer: regl.prop("dataX"),
            divisor: 1
          },

          dataY: {
            buffer: regl.prop("dataY"),
            divisor: 1
          },

          color: {
            buffer: regl.prop("color"),
            divisor: 1
          }
        },

        primitive: 'points',

        depth: {
          enable: false
        },

        uniforms: {
          stageWidth: this.stageWidth,
          stageHeight: this.stageHeight,
          pointSize: this.pointSize,
          domainX: regl.prop("domainX"),
          domainY: regl.prop("domainY")
        },

        count: this.positions.length,
        instances: regl.prop('instances')
      });
  }

  clear() {
    this.reglInstance.cache = {};
    this.reglInstance.poll();
    this.reglInstance.clear({
      color: [0, 0, 0, 0]
    });
  }

  load(dataPointsX, dataPointsY, dataPointsColor, domainX, domainY) {
    const dataX = this.reglInstance.buffer(dataPointsX);
    const dataY = this.reglInstance.buffer(dataPointsY);
    const color = this.reglInstance.buffer(dataPointsColor);
    const instances = dataPointsX.length;
    this.dataBuffer = {dataX, dataY, color, domainX, domainY, instances};

    let xScale = d3.scaleLinear().domain(domainX).range([0, this.stageWidth]);
    d3.select(this.container.node()).select('canvas').call(
      d3.zoom()
        .scaleExtent([1, Infinity])
        .translateExtent([[0, 0], [this.stageWidth, this.stageHeight]])
        .extent([[0, 0], [this.stageWidth, this.stageHeight]])
        .on("zoom", () => {

          this.clear();

          this.dataBuffer.domainX = d3.event.transform.rescaleX(xScale).domain();
          this.render();
    }));
  }

  render() {
    this.draw(this.dataBuffer);
  }
}