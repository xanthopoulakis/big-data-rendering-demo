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
    this.positions = [[0.5, 0.0], [0.0, 0.5], [1.0,0.5], [1.0, -0.5], [0.0, -0.5],[0.0, 0.5]];
    this.rectangleHeight = 10.0;
    this.strokeWidth = 0.66;
    this.clear();
    this.fboIntervals = regl.framebuffer({
      width: this.stageWidth,
      height: this.stageHeight,
      colorFormat: 'rgba',
    });
    let commonSpecIntervals = {
        frag: `
        precision highp float;
        varying vec4 vColor;
        void main() {
          gl_FragColor = vColor;
        }`,

        vert: `
        precision highp float;
        attribute vec2 position;
        attribute float startPoint, endPoint, valY, color;
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
          // vColor = vec4(color.r / 255.0, color.g / 255.0, color.b / 255.0, color.a / 1.0);
          float red = floor(color / 65536.0);
          float green = floor((color - red * 65536.0) / 256.0);
          float blue = color - red * 65536.0 - green * 256.0;
          vColor = vec4(red / 255.0, green / 255.0, blue / 255.0, 1.0);
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
    };
    this.draw = regl(commonSpecIntervals);
    this.drawFboIntervals = regl({...commonSpecIntervals, framebuffer: this.fboIntervals});
    this.connectionSampling = 50; 
    this.drawConnections = regl({
          frag: `
          precision highp float;
          varying vec4 vColor;
          void main() {
            gl_FragColor = vColor;
          }`,

          vert: `
          precision highp float;
          attribute vec2 position;
          attribute float color;
          attribute vec2 startPlace, endPlace;
          uniform vec2 domainX, domainY;
          varying vec4 vColor;
          uniform float stageWidth, stageHeight;

          vec2 normalizeCoords(vec2 position) {
            // read in the positions into x and y vars
            float x = position[0];
            float y = position[1];

            return vec2(
              2.0 * ((x / stageWidth) - 0.5),
              -(2.0 * ((y / stageHeight) - 0.5)));
          }

          vec2 bezier(vec2 A, vec2 B, vec2 C, vec2 D, vec2 E, float t) {
            vec2 A1 = mix(A, B, t);
            vec2 B1 = mix(B, C, t);
            vec2 C1 = mix(C, D, t);
            vec2 D1 = mix(D, E, t);

            vec2 A2 = mix(A1, B1, t);
            vec2 B2 = mix(B1, C1, t);
            vec2 C2 = mix(C1, D1, t);

            vec2 A3 = mix(A2, B2, t);
            vec2 B3 = mix(B2, C2, t);
  
            vec2 P = mix(A3, B3, t);

            return P;
          }

          void main() {
            float kx = stageWidth / (domainX.y - domainX.x);
            float ky = -stageHeight / (domainY.y - domainY.x);

            vec2 pointA = vec2(kx * (startPlace.x - domainX.x), stageHeight + ky * (startPlace.y - domainY.x));
            vec2 pointE = vec2(kx * (endPlace.x - domainX.x), stageHeight + ky * (endPlace.y - domainY.x));

            vec2 pointB = vec2(pointA.x + 2.0, pointA.y);
            vec2 pointD = vec2(pointE.x - 2.0, pointE.y);

            vec2 pointC = vec2(0.5 * (pointA.x + pointE.x), 0.5 * (pointA.y + pointE.y));
            if (startPlace.y == endPlace.y) {
              pointC = vec2(0.5 * (pointA.x + pointE.x), pointA.y - 100.0);
            }

            vec2 pos = bezier(pointA, pointB, pointC, pointD, pointE, position.x);

            vec2 v = normalizeCoords(pos);

            gl_Position = vec4(v, 0, 1);

            float red = floor(color / 65536.0);
            float green = floor((color - red * 65536.0) / 256.0);
            float blue = color - red * 65536.0 - green * 256.0;
            vColor = vec4(red / 255.0, green / 255.0, blue / 255.0, 1.0);
          }`,

          attributes: {
            position: (new Array(this.connectionSampling + 1)).fill().map((x, i) => {
              return [ i / this.connectionSampling, 0 ]
            }),

            startPlace: {
              buffer: regl.prop("startPlace"),
              divisor: 1
            },

            endPlace: {
              buffer: regl.prop("endPlace"),
              divisor: 1
            },

            color: {
              buffer: regl.prop("color"),
              divisor: 1
            },

          },

          primitive: 'line strip',

          depth: {
            enable: false
          },

          uniforms: {
            stageWidth: this.stageWidth,
            stageHeight: this.stageHeight,
            domainX: regl.prop("domainX"),
            domainY: regl.prop("domainY")
          },

          count: this.connectionSampling,
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

  load(intervalStruct, connections) {
    const {intervalsStartPoint, intervalsEndPoint, intervalsY, intervalsFill, intervalsStroke, domainX, domainY} = intervalStruct;
    const startPoint = this.reglInstance.buffer(intervalsStartPoint);
    const endPoint = this.reglInstance.buffer(intervalsEndPoint);
    const fill = this.reglInstance.buffer(intervalsFill);
    const stroke = this.reglInstance.buffer(intervalsStroke);
    const valY = this.reglInstance.buffer(intervalsY);
    const instances = intervalsStartPoint.length;
    let color = stroke;
    let offset = 0;
    this.dataBufferStroke = {startPoint, endPoint, color, offset, valY, domainX, domainY, instances};
    color = fill;
    offset = this.strokeWidth;
    this.dataBufferFill = {startPoint, endPoint, color, offset, valY, domainX, domainY, instances};
    // FboIntervals map
    color = this.reglInstance.buffer(intervalsStroke.map((d,i) => i + 3000));
    offset = 0;
    this.dataBufferFboIntervals = {startPoint, endPoint, color, offset, valY, domainX, domainY, instances};

    let self = this;
    let selectedIndex = null;
    d3.select(this.container.node()).select('canvas').on('mousemove', function() {
      let position = d3.mouse(this);
      const pixels = self.reglInstance.read({
        x: position[0],
        y: self.stageHeight - position[1],
        width: 1,
        height: 1,
        data: new Uint8Array(6),
        framebuffer: self.fboIntervals
      });
      d3.select('#plot-tooltip').html();
      let index = pixels[0] * 65536 + pixels[1] * 256 + pixels[2] - 3000;
      if ((index !== selectedIndex)) {
        d3.select('#plot-tooltip').html(`Y value: ${intervalsY[index]}` );
        let cloneFill = [...intervalsFill];
        cloneFill[index] = 16744206; // orange
        self.dataBufferFill.color.subdata(cloneFill);
        self.clear();
        self.render();
      }
      selectedIndex = index;

    });

    let cons = connections;
    this.dataBufferConnections = {
      startPlace: this.reglInstance.buffer(cons.map(e => e.edges[0])), 
      endPlace: this.reglInstance.buffer(cons.map(e => e.edges[1])), 
      color: this.reglInstance.buffer(cons.map(e => e.color)), 
      domainX: domainX, domainY: domainY, instances: cons.length};

    let xScale = d3.scaleLinear().domain(domainX).range([0, this.stageWidth]);
    d3.select(this.container.node()).select('canvas').call(
      d3.zoom()
        .scaleExtent([1, Infinity])
        .translateExtent([[0, 0], [this.stageWidth, this.stageHeight]])
        .extent([[0, 0], [this.stageWidth, this.stageHeight]])
        .on("zoom", () => {

          this.clear();
          let newDomain = d3.event.transform.rescaleX(xScale).domain();
          this.dataBufferStroke.domainX = newDomain;
          this.dataBufferFill.domainX = newDomain;
          this.dataBufferConnections.domainX = newDomain;
          this.dataBufferFboIntervals.domainX = newDomain;
          this.render();
    }));
  }

  render() {
    this.draw(this.dataBufferStroke);
    this.draw(this.dataBufferFill);
    this.drawConnections(this.dataBufferConnections);
    this.drawFboIntervals(this.dataBufferFboIntervals);
  }
}