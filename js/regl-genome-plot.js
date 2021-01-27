class ReglGenomePlot {

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
      pixelRatio:  window.devicePixelRatio || 2,
      attributes: { antialias: true, depth: false, alpha: true},
    });
    this.reglInstance = regl;
    //this.positions = [[0.0, 0.0], [-0.5, 0.5], [0.5,0.5], [0.5, -0.5], [-0.5, -0.5],[-0.5, 0.5]];
    this.positions = [[0.5, 0.0], [0.0, 0.5], [1.0,0.5], [1.0, -0.5], [0.0, -0.5],[0.0, 0.5]];
    this.rectangleHeight = 10.0;
    this.strokeWidth = 0.66;
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
        attribute float startPoint, endPoint, valY;
        uniform vec2 domainX, domainY;
        varying vec4 vColor;
        uniform float stageWidth, stageHeight, rectangleHeight, offset;

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

          float pos1X = kx * (startPoint - domainX.x);
          float pos2X = kx * (endPoint - domainX.x);
          float posY = stageHeight + ky * (valY - domainY.x);

          float padding = offset;
          float diff = pos2X - pos1X - 2.0 * padding;
          if (diff < 0.5) {
            padding = 0.0;
          }

          float vecX = max(pos2X - pos1X - 2.0 * padding, 0.5) * position.x + pos1X + padding;
          float vecY = (rectangleHeight - 2.0 * padding) * position.y + posY;

          vec2 v = normalizeCoords(vec2(vecX,vecY));

          gl_Position = vec4(v, 0, 1);
          vColor = vec4(color.r / 255.0, color.g / 255.0, color.b / 255.0, color.a / 1.0);
        }`,

        attributes: {
          position: this.positions,

          startPoint: {
            buffer: regl.prop("startPoint"),
            divisor: 1
          },

          endPoint: {
            buffer: regl.prop("endPoint"),
            divisor: 1
          },

          valY: {
            buffer: regl.prop("valY"),
            divisor: 1
          },

          color: {
            buffer: regl.prop("color"),
            divisor: 1
          },

        },

        primitive: 'triangle fan',

        depth: {
          enable: false
        },

        uniforms: {
          stageWidth: this.stageWidth,
          stageHeight: this.stageHeight,
          rectangleHeight: this.rectangleHeight,
          offset: regl.prop("offset"),
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

  load(startPoints, endPoints, yValues, fills, strokes, domainX, domainY) {
    const startPoint = this.reglInstance.buffer(startPoints);
    const endPoint = this.reglInstance.buffer(endPoints);
    const fill = this.reglInstance.buffer(fills);
    const stroke = this.reglInstance.buffer(strokes);
    const valY = this.reglInstance.buffer(yValues);
    const instances = startPoints.length;
    let color = stroke;
    let offset = 0;
    this.dataBufferStroke = {startPoint, endPoint, color, offset, valY, domainX, domainY, instances};
    color = fill;
    offset = this.strokeWidth;
    this.dataBufferFill = {startPoint, endPoint, color, offset, valY, domainX, domainY, instances};

    let xScale = d3.scaleLinear().domain(domainX).range([0, this.stageWidth]);
    d3.select(this.container.node()).select('canvas').call(
      d3.zoom()
        .scaleExtent([1, Infinity])
        .translateExtent([[0, 0], [this.stageWidth, this.stageHeight]])
        .extent([[0, 0], [this.stageWidth, this.stageHeight]])
        .on("zoom", () => {

          this.clear();

          this.dataBufferStroke.domainX = d3.event.transform.rescaleX(xScale).domain();
          this.dataBufferFill.domainX = d3.event.transform.rescaleX(xScale).domain();
          this.render();
    }));
  }

  render() {
    this.draw(this.dataBufferStroke);
    this.draw(this.dataBufferFill);
  }
}