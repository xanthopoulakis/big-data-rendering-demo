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
      pixelRatio:  this.pixelRatio,
      attributes: { antialias: true, depth: false, alpha: false},
    });
    this.reglInstance = regl;
    this.positions = [[0.0, 0.0]];
    this.pointSize = this.pixelRatio;
    this.clear();
    this.fbo = regl.framebuffer({
      width: this.stageWidth,
      height: this.stageHeight,
      colorFormat: 'rgba',
    });
    let common = {
      frag: `
      precision highp float;
      varying vec4 vColor;
      void main() {
        gl_FragColor = vColor;
      }`,

      vert: `
      precision highp float;
      attribute vec2 position;
      varying vec4 vColor;
      attribute float dataX, dataY, color;
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

          float vecX = position.x + posX;
          float vecY = position.y + posY;

          vec2 v = normalizeCoords(vec2(vecX,vecY));

          gl_PointSize = pointSize;
          gl_Position = vec4(v, 0, 1);
          float red = floor(color / 65536.0);
          float green = floor((color - red * 65536.0) / 256.0);
          float blue = color - red * 65536.0 - green * 256.0;
          vColor = vec4(red / 255.0, green / 255.0, blue / 255.0, 1.0);
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
    };
    this.draw = regl(common);
    this.drawFbo = regl({...common, framebuffer: this.fbo});
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
    let color = this.reglInstance.buffer(dataPointsColor);
    const instances = dataPointsX.length;

    this.dataBuffer = {dataX, dataY, color, domainX, domainY, instances};
    color = this.reglInstance.buffer(dataPointsColor.map((d,i) => i + 3000));
    this.dataBufferFbo = {dataX, dataY, color, domainX, domainY, instances};

    let self = this;
    d3.select(this.container.node()).select('canvas').on('mousemove', function() {
      let position = d3.mouse(this);
      const pixels = self.reglInstance.read({
        x: position[0],
        y: self.stageHeight - position[1],
        width: 1,
        height: 1,
        data: new Uint8Array(6),
        framebuffer: self.fbo
      });
      let index = pixels[0] * 65536 + pixels[1] * 256 + pixels[2] - 3000;

      d3.select('#scatter-plot-tooltip').html(`${dataPointsX[index]}: ${dataPointsY[index]}` )
    });

    let xScale = d3.scaleLinear().domain(domainX).range([0, this.stageWidth]);
    d3.select(this.container.node()).select('canvas').call(
      d3.zoom()
      .scaleExtent([1, Infinity])
      .translateExtent([[0, 0], [this.stageWidth, this.stageHeight]])
      .extent([[0, 0], [this.stageWidth, this.stageHeight]])
      .on("zoom", () => {

        this.clear();

        this.dataBuffer.domainX = d3.event.transform.rescaleX(xScale).domain();
        this.dataBufferFbo.domainX = d3.event.transform.rescaleX(xScale).domain();
        this.render();
    }));
  }

  render() {
    this.draw(this.dataBuffer);
    this.drawFbo(this.dataBufferFbo);
  }
}